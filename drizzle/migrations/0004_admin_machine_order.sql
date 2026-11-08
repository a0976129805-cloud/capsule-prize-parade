CREATE OR REPLACE FUNCTION public.reorder_machines(_ids text[], _expected text[])
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE current_ids text[];
BEGIN
  LOCK TABLE public.products IN SHARE ROW EXCLUSIVE MODE;
  SELECT coalesce(array_agg(id ORDER BY sort, created_at, id), ARRAY[]::text[]) INTO current_ids FROM public.products;
  IF _expected IS DISTINCT FROM current_ids THEN RAISE EXCEPTION 'ORDER_CHANGED'; END IF;
  IF _ids IS NULL OR cardinality(_ids) <> cardinality(current_ids)
    OR (SELECT count(DISTINCT x) FROM unnest(_ids) AS t(x)) <> cardinality(current_ids)
    OR EXISTS (SELECT 1 FROM unnest(_ids) AS t(x) WHERE x IS NULL OR NOT (x = ANY(current_ids))) THEN
    RAISE EXCEPTION 'INVALID_ORDER';
  END IF;
  UPDATE public.products AS p SET sort = t.position::integer - 1
  FROM unnest(_ids) WITH ORDINALITY AS t(id, position)
  WHERE p.id = t.id AND p.sort IS DISTINCT FROM t.position::integer - 1;
END;
$$;
REVOKE ALL ON FUNCTION public.reorder_machines(text[], text[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reorder_machines(text[], text[]) TO service_role;