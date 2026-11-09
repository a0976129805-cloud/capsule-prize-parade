ALTER TABLE public.products ADD COLUMN fulfillment_type text NOT NULL DEFAULT 'stock', ADD COLUMN dispatch_date date;
ALTER TABLE public.products ADD CONSTRAINT products_fulfillment_valid CHECK (fulfillment_type IN ('stock','preorder') AND (fulfillment_type <> 'preorder' OR dispatch_date IS NOT NULL));
ALTER TABLE public.vault_items ADD COLUMN fulfillment_type text NOT NULL DEFAULT 'stock', ADD COLUMN dispatch_date date;
ALTER TABLE public.orders ADD COLUMN has_preorder boolean NOT NULL DEFAULT false, ADD COLUMN dispatch_date date;
CREATE OR REPLACE FUNCTION public.snapshot_vault_dispatch() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
SELECT fulfillment_type,dispatch_date INTO NEW.fulfillment_type,NEW.dispatch_date FROM public.products WHERE id=NEW.product_id;
NEW.fulfillment_type:=coalesce(NEW.fulfillment_type,'stock');
IF NEW.fulfillment_type='stock' THEN NEW.dispatch_date:=NULL; END IF;
RETURN NEW;
END $$;
CREATE TRIGGER snapshot_vault_dispatch BEFORE INSERT ON public.vault_items FOR EACH ROW EXECUTE FUNCTION public.snapshot_vault_dispatch();
CREATE OR REPLACE FUNCTION public.checkout_vault(_device text, _shipping jsonb, _coupon uuid DEFAULT NULL::uuid, _user uuid DEFAULT NULL::uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE items jsonb; ids uuid[]; sub integer; fee integer; off integer:=0; cp public.member_coupons; oid text:='ORD-'||replace(gen_random_uuid()::text,'-',''); pre boolean; dispatch date;
BEGIN
IF coalesce(length(_device),0)<1 THEN RAISE EXCEPTION '裝置識別失敗'; END IF;
PERFORM pg_advisory_xact_lock(hashtextextended('checkout:'||_device,0));
PERFORM release_expired_vault(now()-interval '24 hours',_device);
SELECT jsonb_agg(jsonb_build_object('vaultId',id,'id',prize_id,'name',name,'image',image,'machineTitle',machine_title,'drawnAt',drawn_at,'price',price,'isLastOne',is_last_one,'fulfillmentType',fulfillment_type,'dispatchDate',dispatch_date)),array_agg(id),sum(price),bool_or(fulfillment_type='preorder'),max(dispatch_date) FILTER (WHERE fulfillment_type='preorder') INTO items,ids,sub,pre,dispatch FROM (SELECT * FROM vault_items WHERE device_id=_device AND order_id IS NULL AND drawn_at>now()-interval '24 hours' FOR UPDATE) v;
IF items IS NULL THEN RAISE EXCEPTION '倉庫沒有商品'; END IF;
IF pre AND (coalesce(_shipping->>'preorderAgreed','false')<>'true' OR coalesce(_shipping->>'dispatchDate','') IS DISTINCT FROM coalesce(dispatch::text,'')) THEN RAISE EXCEPTION '請確認整單預购出貨時間後再送出'; END IF;
fee:=CASE WHEN sub>=1000 THEN 0 ELSE 38 END;
IF _coupon IS NOT NULL THEN
 SELECT * INTO cp FROM member_coupons WHERE id=_coupon FOR UPDATE;
 IF cp.id IS NULL OR _user IS NULL OR cp.user_id<>_user OR cp.used_order_id IS NOT NULL OR cp.expires_at<=now() OR sub<cp.minimum THEN RAISE EXCEPTION '折價券已失效或未達門檻'; END IF;
 off:=least(cp.amount,sub);
END IF;
INSERT INTO orders(id,device_id,items,ship_name,ship_phone,ship_email,store_name,store_code,total,shipping_fee,item_count,discount,coupon_name,coupon_id,has_preorder,dispatch_date) VALUES(oid,_device,items,left(_shipping->>'name',50),_shipping->>'phone',left(_shipping->>'email',100),left(_shipping->>'storeName',50),_shipping->>'storeCode',sub-off+fee,fee,jsonb_array_length(items),off,coalesce(cp.name,''),_coupon,pre,dispatch);
UPDATE vault_items SET order_id=oid WHERE id=ANY(ids);
IF _coupon IS NOT NULL THEN UPDATE member_coupons SET used_order_id=oid WHERE id=_coupon; END IF;
RETURN jsonb_build_object('id',oid,'total',sub-off+fee,'discount',off);
END $$;
REVOKE ALL ON FUNCTION public.checkout_vault(text,jsonb,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.checkout_vault(text,jsonb,uuid,uuid) TO service_role;