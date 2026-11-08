ALTER TABLE public.vault_items ADD COLUMN IF NOT EXISTS member_id uuid, ADD COLUMN IF NOT EXISTS pending_cards integer[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS vault_member_pending ON public.vault_items(member_id, drawn_at) WHERE order_id IS NULL;
CREATE OR REPLACE FUNCTION public.reserve_member_draw(_user uuid, _product text, _device text, _nos integer[], _set boolean DEFAULT false)
RETURNS SETOF public.vault_items LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE rows public.vault_items[]; r public.vault_items; i integer:=0;
BEGIN
IF _user IS NULL OR _device <> 'member:'||_user::text THEN RAISE EXCEPTION '會員驗證失敗'; END IF;
IF NOT EXISTS(SELECT 1 FROM profiles WHERE id=_user AND length(trim(name))>0 AND phone ~ '^09[0-9]{8}$') THEN RAISE EXCEPTION '請先填寫會員姓名與電話'; END IF;
IF cardinality(_nos) NOT IN (1,5) OR EXISTS(SELECT 1 FROM unnest(_nos)n WHERE n NOT BETWEEN 1 AND 50) OR (_set AND cardinality(_nos)<>1) THEN RAISE EXCEPTION '無效卡片'; END IF;
PERFORM pg_advisory_xact_lock(hashtextextended('checkout:'||_device,0));
PERFORM release_expired_vault(now()-interval '24 hours',_device);
IF _set THEN SELECT array_agg(v) INTO rows FROM buy_set(_product,_device)v;
ELSE SELECT array_agg(v) INTO rows FROM draw_prizes(_product,cardinality(_nos),_device)v; END IF;
IF rows IS NULL THEN RETURN; END IF;
FOREACH r IN ARRAY rows LOOP
IF NOT r.is_last_one AND (NOT _set OR i=0) THEN
 i:=i+1;
 UPDATE vault_items SET member_id=_user,pending_cards=ARRAY[_nos[i]] WHERE id=r.id;
ELSE UPDATE vault_items SET member_id=_user WHERE id=r.id; END IF;
RETURN QUERY SELECT * FROM vault_items WHERE id=r.id;
END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.reserve_member_draw(uuid,text,text,integer[],boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_member_draw(uuid,text,text,integer[],boolean) TO service_role;
CREATE OR REPLACE FUNCTION public.unlock_checked_out_cards() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
IF OLD.order_id IS NULL AND NEW.order_id IS NOT NULL AND NEW.member_id IS NOT NULL AND cardinality(NEW.pending_cards)>0 THEN
 PERFORM pg_advisory_xact_lock(hashtextextended('album-member:'||NEW.member_id::text,0));
 INSERT INTO member_cat_cards AS dst(user_id,card_no,copies) SELECT NEW.member_id,n,count(*)::integer FROM unnest(NEW.pending_cards)n GROUP BY n ON CONFLICT(user_id,card_no) DO UPDATE SET copies=dst.copies+excluded.copies;
 NEW.pending_cards:='{}';
END IF;
RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.unlock_checked_out_cards() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER unlock_checked_out_cards BEFORE UPDATE OF order_id ON public.vault_items FOR EACH ROW EXECUTE FUNCTION public.unlock_checked_out_cards();
COMMENT ON COLUMN public.vault_items.pending_cards IS 'Unpaid collectible previews; removed with expired vault rows, credited atomically on first checkout only.';