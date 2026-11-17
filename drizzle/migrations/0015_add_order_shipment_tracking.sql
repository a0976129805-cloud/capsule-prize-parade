ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_number text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS shipped_at timestamp with time zone;