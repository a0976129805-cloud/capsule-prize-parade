CREATE TABLE public.group_buys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image text NOT NULL DEFAULT '',
  set_price integer NOT NULL DEFAULT 0 CHECK (set_price >= 0),
  style_count integer NOT NULL DEFAULT 1 CHECK (style_count > 0),
  eta text NOT NULL DEFAULT '',
  target integer NOT NULL DEFAULT 5 CHECK (target > 0),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','success','closed')),
  sort integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.group_buys TO anon, authenticated;
GRANT ALL ON public.group_buys TO service_role;
ALTER TABLE public.group_buys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view group buys" ON public.group_buys FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.group_buy_joins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.group_buys(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);
GRANT SELECT ON public.group_buy_joins TO authenticated;
GRANT ALL ON public.group_buy_joins TO service_role;
ALTER TABLE public.group_buy_joins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view own joins" ON public.group_buy_joins FOR SELECT TO authenticated USING (auth.uid() = user_id);