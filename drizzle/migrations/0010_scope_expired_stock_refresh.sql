CREATE OR REPLACE FUNCTION public.release_expired_vault(_cutoff timestamptz, _device text DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r record;
BEGIN
FOR r IN DELETE FROM public.vault_items WHERE order_id IS NULL AND drawn_at < _cutoff AND (_device IS NULL OR device_id=_device) RETURNING prize_id,product_id LOOP
UPDATE public.prizes SET stock=stock+1 WHERE id=r.prize_id;
UPDATE public.products SET total_stock=(SELECT coalesce(sum(stock),0) FROM public.prizes WHERE product_id=r.product_id) WHERE id=r.product_id;
END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.release_expired_vault(timestamptz,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.release_expired_vault(timestamptz,text) TO service_role;