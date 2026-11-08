CREATE TABLE public.cat_cards (device_id text NOT NULL, card_no integer NOT NULL CHECK (card_no BETWEEN 1 AND 50), copies integer NOT NULL DEFAULT 1, first_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (device_id, card_no));
GRANT ALL ON public.cat_cards TO service_role;
ALTER TABLE public.cat_cards ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.album_claims (device_id text NOT NULL, user_id uuid NOT NULL, page integer NOT NULL CHECK (page BETWEEN 1 AND 5), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (device_id, page), UNIQUE (user_id, page));
GRANT ALL ON public.album_claims TO service_role;
ALTER TABLE public.album_claims ENABLE ROW LEVEL SECURITY;

CREATE FUNCTION public.add_cat_cards(_device text, _nos integer[]) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
INSERT INTO cat_cards(device_id, card_no, copies) SELECT _device, n, count(*) FROM unnest(_nos) n GROUP BY n
ON CONFLICT (device_id, card_no) DO UPDATE SET copies = cat_cards.copies + excluded.copies;
$$;
REVOKE ALL ON FUNCTION public.add_cat_cards(text, integer[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_cat_cards(text, integer[]) TO service_role;

CREATE FUNCTION public.claim_album_page(_user uuid, _device text, _page integer) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE cfg jsonb; rule jsonb; have integer;
BEGIN
PERFORM pg_advisory_xact_lock(hashtextextended('album:'||_device||':'||_page,0));
SELECT data INTO cfg FROM reward_settings WHERE id=1;
rule := cfg->'album';
IF cfg IS NULL OR rule IS NULL OR NOT coalesce((rule->>'enabled')::boolean,false) THEN RAISE EXCEPTION '卡冊兌換尚未開放'; END IF;
SELECT count(*) INTO have FROM cat_cards WHERE device_id=_device AND card_no BETWEEN (_page-1)*10+1 AND _page*10;
IF have < 10 THEN RAISE EXCEPTION '這一頁還沒集滿'; END IF;
IF EXISTS (SELECT 1 FROM album_claims WHERE (device_id=_device OR user_id=_user) AND page=_page) THEN RAISE EXCEPTION '這一頁已兌換過'; END IF;
INSERT INTO album_claims(device_id,user_id,page) VALUES(_device,_user,_page);
INSERT INTO member_coupons(user_id,name,source,amount,minimum,expires_at) VALUES(_user,(rule->>'name')||'・第'||_page||'頁','album',(rule->>'amount')::integer,(rule->>'minimum')::integer,now()+make_interval(days=>(rule->>'days')::integer));
RETURN jsonb_build_object('page',_page,'amount',(rule->>'amount')::integer,'minimum',(rule->>'minimum')::integer);
END $$;
REVOKE ALL ON FUNCTION public.claim_album_page(uuid, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_album_page(uuid, text, integer) TO service_role;