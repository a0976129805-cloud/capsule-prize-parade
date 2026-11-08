CREATE TABLE public.reward_settings (id integer PRIMARY KEY DEFAULT 1 CHECK(id=1), data jsonb NOT NULL DEFAULT '{}'::jsonb);
GRANT ALL ON public.reward_settings TO service_role;
ALTER TABLE public.reward_settings ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.member_rewards (user_id uuid PRIMARY KEY, last_day date, streak integer NOT NULL DEFAULT 0, newcomer_claimed boolean NOT NULL DEFAULT false);
GRANT SELECT ON public.member_rewards TO authenticated;
GRANT ALL ON public.member_rewards TO service_role;
ALTER TABLE public.member_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_rewards ON public.member_rewards FOR SELECT TO authenticated USING(auth.uid()=user_id);
CREATE TABLE public.member_coupons (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, name text NOT NULL, source text NOT NULL, amount integer NOT NULL CHECK(amount>0), minimum integer NOT NULL CHECK(minimum>=amount), expires_at timestamptz NOT NULL, used_order_id text, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.member_coupons TO authenticated;
GRANT ALL ON public.member_coupons TO service_role;
ALTER TABLE public.member_coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_coupons ON public.member_coupons FOR SELECT TO authenticated USING(auth.uid()=user_id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount integer NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_name text NOT NULL DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_id uuid;
CREATE FUNCTION public.claim_member_reward(_user uuid, _kind text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE cfg jsonb; rule jsonb; state public.member_rewards; today date := (now() AT TIME ZONE 'Asia/Taipei')::date; n integer; roll numeric; acc numeric:=0; opt jsonb; expiry timestamptz;
BEGIN
PERFORM pg_advisory_xact_lock(hashtextextended('reward:'||_user::text,0));
SELECT data INTO cfg FROM reward_settings WHERE id=1;
IF cfg IS NULL OR NOT coalesce((cfg->>'enabled')::boolean,false) THEN RAISE EXCEPTION '優惠尚未開放'; END IF;
INSERT INTO member_rewards(user_id) VALUES(_user) ON CONFLICT DO NOTHING;
SELECT * INTO state FROM member_rewards WHERE user_id=_user FOR UPDATE;
IF _kind='newcomer' THEN
 rule:=cfg->'newcomer';
 IF state.newcomer_claimed THEN RAISE EXCEPTION '新人禮已領取'; END IF;
 IF NOT coalesce((rule->>'enabled')::boolean,false) THEN RAISE EXCEPTION '新人禮尚未開放'; END IF;
 UPDATE member_rewards SET newcomer_claimed=true WHERE user_id=_user;
ELSIF _kind='daily' THEN
 IF state.last_day=today THEN RAISE EXCEPTION '今日已簽到'; END IF;
 IF NOT coalesce((cfg->'daily'->>'enabled')::boolean,false) THEN RAISE EXCEPTION '每日簽到尚未開放'; END IF;
 n:=CASE WHEN state.last_day=today-1 THEN state.streak+1 ELSE 1 END;
 roll:=random()*100;
 FOR opt IN SELECT value FROM jsonb_array_elements(cfg->'daily'->'options') LOOP
 acc:=acc+(opt->>'weight')::numeric;
 IF roll<acc THEN rule:=opt; EXIT; END IF;
 END LOOP;
 IF rule IS NULL THEN RAISE EXCEPTION '優惠設定錯誤'; END IF;
 UPDATE member_rewards SET last_day=today,streak=CASE WHEN n>=7 THEN 0 ELSE n END WHERE user_id=_user;
 IF n>=7 AND coalesce((cfg->'streak'->>'enabled')::boolean,false) THEN
 opt:=cfg->'streak';
 INSERT INTO member_coupons(user_id,name,source,amount,minimum,expires_at) VALUES(_user,opt->>'name','streak',(opt->>'amount')::integer,(opt->>'minimum')::integer,now()+make_interval(days=>(opt->>'days')::integer));
 END IF;
ELSE RAISE EXCEPTION '無效操作'; END IF;
expiry:=CASE WHEN _kind='daily' THEN ((today+1)::timestamp AT TIME ZONE 'Asia/Taipei') ELSE now()+make_interval(days=>(rule->>'days')::integer) END;
INSERT INTO member_coupons(user_id,name,source,amount,minimum,expires_at) VALUES(_user,rule->>'name',_kind,(rule->>'amount')::integer,(rule->>'minimum')::integer,expiry);
RETURN jsonb_build_object('name',rule->>'name','streak',CASE WHEN n>=7 THEN 0 ELSE n END,'milestone',coalesce(n>=7,false));
END $$;
REVOKE ALL ON FUNCTION public.claim_member_reward(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_member_reward(uuid,text) TO service_role;
CREATE FUNCTION public.checkout_vault(_device text,_shipping jsonb,_coupon uuid DEFAULT NULL,_user uuid DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE items jsonb; ids uuid[]; sub integer; fee integer; off integer:=0; cp public.member_coupons; oid text:='ORD-'||replace(gen_random_uuid()::text,'-','');
BEGIN
IF coalesce(length(_device),0)<1 THEN RAISE EXCEPTION '裝置識別失敗'; END IF;
PERFORM pg_advisory_xact_lock(hashtextextended('checkout:'||_device,0));
PERFORM release_expired_vault(now()-interval '24 hours',_device);
SELECT jsonb_agg(jsonb_build_object('vaultId',id,'id',prize_id,'name',name,'image',image,'machineTitle',machine_title,'drawnAt',drawn_at,'price',price,'isLastOne',is_last_one)),array_agg(id),sum(price) INTO items,ids,sub FROM (SELECT * FROM vault_items WHERE device_id=_device AND order_id IS NULL AND drawn_at>now()-interval '24 hours' FOR UPDATE) v;
IF items IS NULL THEN RAISE EXCEPTION '倉庫沒有商品'; END IF;
fee:=CASE WHEN sub>=1000 THEN 0 ELSE 38 END;
IF _coupon IS NOT NULL THEN
 SELECT * INTO cp FROM member_coupons WHERE id=_coupon FOR UPDATE;
 IF cp.id IS NULL OR _user IS NULL OR cp.user_id<>_user OR cp.used_order_id IS NOT NULL OR cp.expires_at<=now() OR sub<cp.minimum THEN RAISE EXCEPTION '折價券已失效或未達門檻'; END IF;
 off:=least(cp.amount,sub);
END IF;
INSERT INTO orders(id,device_id,items,ship_name,ship_phone,ship_email,store_name,store_code,total,shipping_fee,item_count,discount,coupon_name,coupon_id) VALUES(oid,_device,items,left(_shipping->>'name',50),_shipping->>'phone',left(_shipping->>'email',100),left(_shipping->>'storeName',50),_shipping->>'storeCode',sub-off+fee,fee,jsonb_array_length(items),off,coalesce(cp.name,''),_coupon);
UPDATE vault_items SET order_id=oid WHERE id=ANY(ids);
IF _coupon IS NOT NULL THEN UPDATE member_coupons SET used_order_id=oid WHERE id=_coupon; END IF;
RETURN jsonb_build_object('id',oid,'total',sub-off+fee,'discount',off);
END $$;
REVOKE ALL ON FUNCTION public.checkout_vault(text,jsonb,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.checkout_vault(text,jsonb,uuid,uuid) TO service_role;