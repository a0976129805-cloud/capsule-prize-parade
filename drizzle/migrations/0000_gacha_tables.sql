CREATE TABLE public.products (
  id text PRIMARY KEY,
  title text NOT NULL,
  price integer NOT NULL DEFAULT 100,
  total_stock integer NOT NULL DEFAULT 0,
  cover_image text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT '熱烈販售中',
  sort integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.prizes (
  id text PRIMARY KEY,
  product_id text NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  image text NOT NULL DEFAULT '',
  sort integer NOT NULL DEFAULT 0
);
CREATE TABLE public.orders (
  id text PRIMARY KEY,
  device_id text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]',
  ship_name text NOT NULL,
  ship_phone text NOT NULL,
  store_name text NOT NULL,
  store_code text NOT NULL,
  total integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT '待出貨',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products, public.prizes TO anon, authenticated;
GRANT ALL ON public.products, public.prizes, public.orders TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read products" ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read prizes" ON public.prizes FOR SELECT TO anon, authenticated USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.prizes;

CREATE OR REPLACE FUNCTION public.take_stock(_product text, _n integer) RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  WITH u AS (UPDATE public.products SET total_stock = total_stock - _n WHERE id = _product AND total_stock >= _n AND _n > 0 RETURNING 1)
  SELECT EXISTS (SELECT 1 FROM u);
$$;
REVOKE ALL ON FUNCTION public.take_stock(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.take_stock(text, integer) TO service_role;

INSERT INTO public.products (id,title,price,total_stock,cover_image,status,sort) VALUES
('m1','【CAP''in GALLERY】 miffy Glint Series',150,50,'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&q=80&w=600','熱烈販售中',1),
('m2','夢之蠟筆王國 飾品配件專用輯',100,30,'https://images.unsplash.com/photo-1535572290543-960a8046f5af?auto=format&fit=crop&q=80&w=600','熱烈販售中',2),
('m3','rom&nd 縮小版甜心彩妝模型 Vol.3',100,15,'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=600','少量即將完售',3);
INSERT INTO public.prizes (id,product_id,name,image,sort) VALUES
('i1','m1','米飛兔 珍珠白公仔','https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&q=80&w=300',1),
('i2','m1','米飛兔 經典黃公仔','https://images.unsplash.com/photo-1558679908-541bcf1249ff?auto=format&fit=crop&q=80&w=300',2),
('i3','m1','米飛兔 薄荷綠公仔','https://images.unsplash.com/photo-1535572290543-960a8046f5af?auto=format&fit=crop&q=80&w=300',3),
('i4','m2','魔法杖 吊飾','https://images.unsplash.com/photo-1535572290543-960a8046f5af?auto=format&fit=crop&q=80&w=300',1),
('i5','m2','香水瓶 鑰匙圈','https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&q=80&w=300',2),
('i6','m3','迷你唇釉 01 號','https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=300',1),
('i7','m3','迷你氣墊粉餅','https://images.unsplash.com/photo-1558679908-541bcf1249ff?auto=format&fit=crop&q=80&w=300',2);