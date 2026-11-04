ALTER TABLE public.prizes ADD COLUMN stock integer NOT NULL DEFAULT 0;
UPDATE public.prizes z SET stock = GREATEST(0, p.total_stock / GREATEST(1,(SELECT count(*) FROM public.prizes WHERE product_id = p.id)))
FROM public.products p WHERE p.id = z.product_id;
UPDATE public.products p SET total_stock = COALESCE((SELECT sum(stock) FROM public.prizes WHERE product_id = p.id),0);

ALTER TABLE public.orders ADD COLUMN ship_email text NOT NULL DEFAULT '';
ALTER TABLE public.orders ADD COLUMN shipping_fee integer NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN item_count integer NOT NULL DEFAULT 0;

CREATE TABLE public.vault_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  product_id text NOT NULL,
  prize_id text NOT NULL,
  name text NOT NULL DEFAULT '',
  image text NOT NULL DEFAULT '',
  machine_title text NOT NULL DEFAULT '',
  price integer NOT NULL DEFAULT 0,
  drawn_at timestamptz NOT NULL DEFAULT now(),
  order_id text
);
GRANT ALL ON public.vault_items TO service_role;
ALTER TABLE public.vault_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX vault_items_device_idx ON public.vault_items(device_id, order_id);

CREATE TABLE public.shop_settings (
  id integer PRIMARY KEY DEFAULT 1,
  data jsonb NOT NULL DEFAULT '{}'::jsonb
);
GRANT ALL ON public.shop_settings TO service_role;
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.draw_prizes(_product text, _n integer, _device text)
RETURNS SETOF public.vault_items
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  prod public.products%ROWTYPE;
  total integer;
  pick integer;
  z record;
  i integer;
BEGIN
  IF _n NOT IN (1,5) THEN RAISE EXCEPTION 'bad count'; END IF;
  SELECT * INTO prod FROM public.products WHERE id = _product FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  PERFORM 1 FROM public.prizes WHERE product_id = _product FOR UPDATE;
  SELECT COALESCE(sum(stock),0) INTO total FROM public.prizes WHERE product_id = _product AND stock > 0;
  IF total < _n THEN RETURN; END IF;
  FOR i IN 1.._n LOOP
    SELECT COALESCE(sum(stock),0) INTO total FROM public.prizes WHERE product_id = _product AND stock > 0;
    pick := floor(random() * total)::int;
    FOR z IN SELECT id, name, image, stock FROM public.prizes WHERE product_id = _product AND stock > 0 ORDER BY sort, id LOOP
      IF pick < z.stock THEN
        UPDATE public.prizes SET stock = stock - 1 WHERE id = z.id;
        RETURN QUERY INSERT INTO public.vault_items(device_id, product_id, prize_id, name, image, machine_title, price)
          VALUES (_device, _product, z.id, z.name, z.image, prod.title, prod.price) RETURNING *;
        EXIT;
      END IF;
      pick := pick - z.stock;
    END LOOP;
  END LOOP;
  UPDATE public.products SET total_stock = (SELECT COALESCE(sum(stock),0) FROM public.prizes WHERE product_id = _product) WHERE id = _product;
END $$;
REVOKE EXECUTE ON FUNCTION public.draw_prizes(text, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.draw_prizes(text, integer, text) TO service_role;