CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE CHECK (code = upper(code) AND code ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  amount integer NOT NULL DEFAULT 0 CHECK (amount >= 0 AND amount <= 10000),
  minimum integer NOT NULL DEFAULT 0 CHECK (minimum >= amount AND minimum <= 1000000),
  days integer NOT NULL DEFAULT 7 CHECK (days BETWEEN 1 AND 90),
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (NOT enabled OR amount > 0)
);
GRANT ALL ON public.promo_codes TO service_role;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.promo_redemptions (
  code_id uuid NOT NULL REFERENCES public.promo_codes(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL,
  coupon_id uuid NOT NULL UNIQUE REFERENCES public.member_coupons(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (code_id, user_id)
);
GRANT ALL ON public.promo_redemptions TO service_role;
ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;
CREATE INDEX promo_redemptions_user_idx ON public.promo_redemptions(user_id);

CREATE FUNCTION public.redeem_promo_code(_user uuid, _code text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  promo public.promo_codes;
  new_coupon_id uuid;
  normalized text := upper(trim(_code));
  expiry timestamptz;
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION '請先登入會員'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('promo:' || _user::text, 0));
  SELECT * INTO promo FROM public.promo_codes WHERE code = normalized FOR UPDATE;
  IF promo.id IS NULL OR NOT promo.enabled THEN RAISE EXCEPTION '代碼不存在或已停用'; END IF;
  IF EXISTS (SELECT 1 FROM public.promo_redemptions WHERE code_id = promo.id AND user_id = _user) THEN
    RAISE EXCEPTION '這組代碼已領取過';
  END IF;
  IF promo.amount <= 0 OR promo.minimum < promo.amount OR promo.days NOT BETWEEN 1 AND 90 THEN
    RAISE EXCEPTION '代碼設定不完整，請聯繫店長';
  END IF;
  expiry := now() + make_interval(days => promo.days);
  INSERT INTO public.member_coupons(user_id, name, source, amount, minimum, expires_at)
  VALUES (_user, promo.name, 'promo:' || promo.id::text, promo.amount, promo.minimum, expiry)
  RETURNING id INTO new_coupon_id;
  INSERT INTO public.promo_redemptions(code_id, user_id, coupon_id) VALUES (promo.id, _user, new_coupon_id);
  RETURN jsonb_build_object('code', promo.code, 'name', promo.name, 'amount', promo.amount, 'minimum', promo.minimum, 'expires_at', expiry);
END $$;
REVOKE ALL ON FUNCTION public.redeem_promo_code(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_promo_code(uuid, text) TO service_role;

CREATE FUNCTION public.delete_promo_code(_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE promo_id uuid;
BEGIN
  SELECT id INTO promo_id FROM public.promo_codes WHERE id = _id FOR UPDATE;
  IF promo_id IS NULL THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM public.promo_redemptions WHERE code_id = promo_id) THEN
    RAISE EXCEPTION '已有會員領取，請改用停用';
  END IF;
  DELETE FROM public.promo_codes WHERE id = promo_id;
END $$;
REVOKE ALL ON FUNCTION public.delete_promo_code(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_promo_code(uuid) TO service_role;