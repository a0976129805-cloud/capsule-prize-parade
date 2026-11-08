CREATE TABLE public.member_cat_cards (user_id uuid NOT NULL, card_no integer NOT NULL CHECK(card_no BETWEEN 1 AND 50), copies integer NOT NULL DEFAULT 1 CHECK(copies>0), first_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,card_no));
GRANT SELECT ON public.member_cat_cards TO authenticated;
GRANT ALL ON public.member_cat_cards TO service_role;
ALTER TABLE public.member_cat_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY member_reads_cards ON public.member_cat_cards FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE TABLE public.album_device_links (device_id text PRIMARY KEY, user_id uuid NOT NULL, linked_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.album_device_links TO service_role;
ALTER TABLE public.album_device_links ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.member_album_claims (user_id uuid NOT NULL, page integer NOT NULL CHECK(page BETWEEN 1 AND 5), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,page));
GRANT SELECT ON public.member_album_claims TO authenticated;
GRANT ALL ON public.member_album_claims TO service_role;
ALTER TABLE public.member_album_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY member_reads_album_claims ON public.member_album_claims FOR SELECT TO authenticated USING(user_id=auth.uid());
INSERT INTO public.member_album_claims(user_id,page,created_at) SELECT user_id,page,created_at FROM public.album_claims ON CONFLICT DO NOTHING;
CREATE TABLE public.device_album_claims (device_id text NOT NULL, page integer NOT NULL CHECK(page BETWEEN 1 AND 5), PRIMARY KEY(device_id,page));
GRANT ALL ON public.device_album_claims TO service_role;
ALTER TABLE public.device_album_claims ENABLE ROW LEVEL SECURITY;
INSERT INTO public.device_album_claims SELECT device_id,page FROM public.album_claims ON CONFLICT DO NOTHING;
CREATE FUNCTION public.merge_cat_album(_user uuid,_device text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
IF _user IS NULL OR length(coalesce(_device,'')) NOT BETWEEN 1 AND 80 THEN RAISE EXCEPTION '無效卡冊'; END IF;
PERFORM pg_advisory_xact_lock(hashtextextended('album-device:'||_device,0));
PERFORM pg_advisory_xact_lock(hashtextextended('album-member:'||_user::text,0));
IF EXISTS(SELECT 1 FROM album_device_links WHERE device_id=_device AND user_id<>_user) OR EXISTS(SELECT 1 FROM album_claims WHERE device_id=_device AND user_id<>_user) THEN RAISE EXCEPTION '此手機卡冊已合併至另一位會員'; END IF;
INSERT INTO album_device_links(device_id,user_id) VALUES(_device,_user) ON CONFLICT DO NOTHING;
INSERT INTO member_cat_cards AS dst(user_id,card_no,copies,first_at) SELECT _user,card_no,copies,first_at FROM cat_cards WHERE device_id=_device ON CONFLICT(user_id,card_no) DO UPDATE SET copies=dst.copies+excluded.copies,first_at=least(dst.first_at,excluded.first_at);
DELETE FROM cat_cards WHERE device_id=_device;
INSERT INTO member_album_claims(user_id,page) SELECT _user,page FROM device_album_claims WHERE device_id=_device ON CONFLICT DO NOTHING;
INSERT INTO device_album_claims(device_id,page) SELECT _device,page FROM member_album_claims WHERE user_id=_user ON CONFLICT DO NOTHING;
END $$;
REVOKE ALL ON FUNCTION public.merge_cat_album(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.merge_cat_album(uuid,text) TO service_role;
CREATE FUNCTION public.add_cat_cards_routed(_device text,_nos integer[],_user uuid DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
IF length(coalesce(_device,'')) NOT BETWEEN 1 AND 80 THEN RAISE EXCEPTION '無效卡冊'; END IF;
PERFORM pg_advisory_xact_lock(hashtextextended('album-device:'||_device,0));
IF _user IS NOT NULL THEN
PERFORM pg_advisory_xact_lock(hashtextextended('album-member:'||_user::text,0));
INSERT INTO member_cat_cards AS dst(user_id,card_no,copies) SELECT _user,n,count(*)::integer FROM unnest(_nos)n GROUP BY n ON CONFLICT(user_id,card_no) DO UPDATE SET copies=dst.copies+excluded.copies;
ELSE
INSERT INTO cat_cards AS dst(device_id,card_no,copies) SELECT _device,n,count(*)::integer FROM unnest(_nos)n GROUP BY n ON CONFLICT(device_id,card_no) DO UPDATE SET copies=dst.copies+excluded.copies;
END IF;
END $$;
REVOKE ALL ON FUNCTION public.add_cat_cards_routed(text,integer[],uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.add_cat_cards_routed(text,integer[],uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.add_cat_cards(_device text,_nos integer[]) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$ SELECT public.add_cat_cards_routed(_device,_nos,NULL); $$;
CREATE OR REPLACE FUNCTION public.claim_album_page(_user uuid,_device text,_page integer) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE cfg jsonb; rule jsonb; have integer;
BEGIN
IF _user IS NULL OR _page NOT BETWEEN 1 AND 5 OR length(coalesce(_device,'')) NOT BETWEEN 1 AND 80 THEN RAISE EXCEPTION '無效卡冊'; END IF;
PERFORM pg_advisory_xact_lock(hashtextextended('album-device:'||_device,0));
PERFORM pg_advisory_xact_lock(hashtextextended('album-member:'||_user::text,0));
SELECT data INTO cfg FROM reward_settings WHERE id=1;
rule:=cfg->'album';
IF NOT coalesce((rule->>'enabled')::boolean,false) OR coalesce((rule->>'amount')::integer,0)<=0 THEN RAISE EXCEPTION '卡冊兌換尚未開放'; END IF;
SELECT count(*) INTO have FROM member_cat_cards WHERE user_id=_user AND card_no BETWEEN (_page-1)*10+1 AND _page*10;
IF have<10 THEN RAISE EXCEPTION '這一頁還沒集滿，請先合併手機卡片'; END IF;
IF EXISTS(SELECT 1 FROM member_album_claims WHERE user_id=_user AND page=_page) THEN RAISE EXCEPTION '這一頁已兌換過'; END IF;
INSERT INTO member_album_claims(user_id,page) VALUES(_user,_page);
INSERT INTO device_album_claims(device_id,page) SELECT device_id,_page FROM album_device_links WHERE user_id=_user ON CONFLICT DO NOTHING;
INSERT INTO member_coupons(user_id,name,source,amount,minimum,expires_at) VALUES(_user,(rule->>'name')||'・第'||_page||'頁','album',(rule->>'amount')::integer,(rule->>'minimum')::integer,now()+make_interval(days=>(rule->>'days')::integer));
RETURN jsonb_build_object('page',_page,'amount',(rule->>'amount')::integer,'minimum',(rule->>'minimum')::integer);
END $$;
COMMENT ON TABLE public.album_claims IS 'Historical device/member claims; new claims use member_album_claims and device_album_claims.';