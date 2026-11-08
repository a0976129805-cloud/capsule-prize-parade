ALTER TABLE public.products ADD COLUMN last_one_name text NOT NULL DEFAULT '', ADD COLUMN last_one_image text NOT NULL DEFAULT '', ADD COLUMN last_one_awarded boolean NOT NULL DEFAULT false;
ALTER TABLE public.vault_items ADD COLUMN is_last_one boolean NOT NULL DEFAULT false;
CREATE TABLE public.draw_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), machine_title text NOT NULL, prize_name text NOT NULL, is_last_one boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.draw_events TO anon, authenticated;
GRANT ALL ON public.draw_events TO service_role;
ALTER TABLE public.draw_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public anonymous draw summaries" ON public.draw_events FOR SELECT TO anon, authenticated USING (true);
CREATE INDEX draw_events_recent ON public.draw_events(created_at DESC);
CREATE OR REPLACE FUNCTION public.award_last_one(_product text, _device text) RETURNS SETOF public.vault_items LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.products%ROWTYPE;
BEGIN
 SELECT * INTO p FROM public.products WHERE id=_product FOR UPDATE;
 IF NOT FOUND OR p.last_one_name='' OR p.last_one_awarded OR EXISTS(SELECT 1 FROM public.prizes WHERE product_id=_product AND stock>0) THEN RETURN; END IF;
 UPDATE public.products SET last_one_awarded=true WHERE id=_product;
 RETURN QUERY INSERT INTO public.vault_items(device_id,product_id,prize_id,name,image,machine_title,price,is_last_one) VALUES(_device,_product,'last-one-'||_product,p.last_one_name,p.last_one_image,p.title,0,true) RETURNING *;
END $$;
REVOKE ALL ON FUNCTION public.award_last_one(text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_last_one(text,text) TO service_role;
CREATE OR REPLACE FUNCTION public.record_draw_event() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN INSERT INTO public.draw_events(machine_title,prize_name,is_last_one) VALUES(NEW.machine_title,NEW.name,NEW.is_last_one); RETURN NEW; END $$;
CREATE TRIGGER record_draw_event AFTER INSERT ON public.vault_items FOR EACH ROW EXECUTE FUNCTION public.record_draw_event();
CREATE OR REPLACE FUNCTION public.draw_prizes(_product text, _n integer, _device text) RETURNS SETOF public.vault_items LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE prod public.products%ROWTYPE; total integer; pick integer; z record; i integer;
BEGIN
 IF _n NOT IN (1,5) THEN RAISE EXCEPTION 'bad count'; END IF;
 IF length(trim(_device))=0 THEN RAISE EXCEPTION 'device required'; END IF;
 SELECT * INTO prod FROM public.products WHERE id=_product FOR UPDATE;
 IF NOT FOUND THEN RETURN; END IF;
 PERFORM 1 FROM public.prizes WHERE product_id=_product FOR UPDATE;
 SELECT coalesce(sum(stock),0) INTO total FROM public.prizes WHERE product_id=_product AND stock>0;
 IF total<_n THEN RETURN; END IF;
 FOR i IN 1.._n LOOP
 SELECT coalesce(sum(stock),0) INTO total FROM public.prizes WHERE product_id=_product AND stock>0;
 pick:=floor(random()*total)::int;
 FOR z IN SELECT id,name,image,stock FROM public.prizes WHERE product_id=_product AND stock>0 ORDER BY sort,id LOOP
 IF pick<z.stock THEN
 UPDATE public.prizes SET stock=stock-1 WHERE id=z.id;
 RETURN QUERY INSERT INTO public.vault_items(device_id,product_id,prize_id,name,image,machine_title,price) VALUES(_device,_product,z.id,z.name,z.image,prod.title,prod.price) RETURNING *;
 EXIT;
 END IF;
 pick:=pick-z.stock;
 END LOOP;
 END LOOP;
 UPDATE public.products SET total_stock=(SELECT coalesce(sum(stock),0) FROM public.prizes WHERE product_id=_product) WHERE id=_product;
 RETURN QUERY SELECT * FROM public.award_last_one(_product,_device);
END $$;
CREATE OR REPLACE FUNCTION public.buy_set(_product text,_device text) RETURNS SETOF public.vault_items LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE prod public.products%ROWTYPE; n integer; i integer:=0; z record; per integer; rem integer;
BEGIN
 IF length(trim(_device))=0 THEN RAISE EXCEPTION 'device required'; END IF;
 SELECT * INTO prod FROM public.products WHERE id=_product FOR UPDATE;
 IF NOT FOUND OR prod.set_price<=0 THEN RETURN; END IF;
 PERFORM 1 FROM public.prizes WHERE product_id=_product FOR UPDATE;
 SELECT count(*) INTO n FROM public.prizes WHERE product_id=_product;
 IF n=0 OR EXISTS(SELECT 1 FROM public.prizes WHERE product_id=_product AND stock<=0) THEN RETURN; END IF;
 per:=prod.set_price/n; rem:=prod.set_price-per*n;
 FOR z IN SELECT id,name,image FROM public.prizes WHERE product_id=_product ORDER BY sort,id LOOP
 UPDATE public.prizes SET stock=stock-1 WHERE id=z.id;
 RETURN QUERY INSERT INTO public.vault_items(device_id,product_id,prize_id,name,image,machine_title,price) VALUES(_device,_product,z.id,z.name,z.image,prod.title||'（整套）',per+CASE WHEN i=0 THEN rem ELSE 0 END) RETURNING *;
 i:=i+1;
 END LOOP;
 UPDATE public.products SET total_stock=(SELECT coalesce(sum(stock),0) FROM public.prizes WHERE product_id=_product) WHERE id=_product;
 RETURN QUERY SELECT * FROM public.award_last_one(_product,_device);
END $$;
REVOKE ALL ON FUNCTION public.draw_prizes(text,integer,text), public.buy_set(text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.draw_prizes(text,integer,text), public.buy_set(text,text) TO service_role;