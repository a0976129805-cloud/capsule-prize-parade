DROP POLICY IF EXISTS "Anyone can view group buys" ON public.group_buys;
REVOKE SELECT ON public.group_buys FROM anon, authenticated;
DROP POLICY IF EXISTS "Public anonymous draw summaries" ON public.draw_events;
CREATE POLICY "Recent anonymous draw summaries" ON public.draw_events FOR SELECT TO anon, authenticated USING (created_at >= now() - interval '24 hours');