ALTER TABLE public.products ADD COLUMN IF NOT EXISTS set_price integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.buy_set(_product text, _device text)
RETURNS SETOF public.vault_items LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE prod public.products%ROWTYPE; n integer; i integer := 0; z record; per integer; rem integer;
BEGIN
  SELECT * INTO prod FROM public.products WHERE id = _product FOR UPDATE;
  IF NOT FOUND OR prod.set_price <= 0 THEN RETURN; END IF;
  PERFORM 1 FROM public.prizes WHERE product_id = _product FOR UPDATE;
  SELECT count(*) INTO n FROM public.prizes WHERE product_id = _product;
  IF n = 0 OR EXISTS (SELECT 1 FROM public.prizes WHERE product_id = _product AND stock <= 0) THEN RETURN; END IF;
  per := prod.set_price / n; rem := prod.set_price - per * n;
  FOR z IN SELECT id, name, image FROM public.prizes WHERE product_id = _product ORDER BY sort, id LOOP
    UPDATE public.prizes SET stock = stock - 1 WHERE id = z.id;
    RETURN QUERY INSERT INTO public.vault_items(device_id, product_id, prize_id, name, image, machine_title, price)
      VALUES (_device, _product, z.id, z.name, z.image, prod.title || '（整套）', per + CASE WHEN i = 0 THEN rem ELSE 0 END) RETURNING *;
    i := i + 1;
  END LOOP;
  UPDATE public.products SET total_stock = (SELECT COALESCE(sum(stock),0) FROM public.prizes WHERE product_id = _product) WHERE id = _product;
END $$;

CREATE OR REPLACE FUNCTION public.release_expired_vault(_cutoff timestamptz, _device text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r record;
BEGIN
  FOR r IN DELETE FROM public.vault_items WHERE order_id IS NULL AND drawn_at < _cutoff AND (_device IS NULL OR device_id = _device) RETURNING prize_id, product_id LOOP
    UPDATE public.prizes SET stock = stock + 1 WHERE id = r.prize_id;
  END LOOP;
  UPDATE public.products p SET total_stock = (SELECT COALESCE(sum(stock),0) FROM public.prizes WHERE product_id = p.id);
END $$;

REVOKE ALL ON FUNCTION public.buy_set(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_expired_vault(timestamptz, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.buy_set(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_expired_vault(timestamptz, text) TO service_role;