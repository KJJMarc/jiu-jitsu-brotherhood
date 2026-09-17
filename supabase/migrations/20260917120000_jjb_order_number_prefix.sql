-- Additive JJB identity change only. Do not apply against Kingston Jiu Jitsu
-- production. This replaces the order-number prefix used by
-- public.next_store_order_number(); the sequence itself is unchanged.

CREATE OR REPLACE FUNCTION public.next_store_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n bigint;
BEGIN
  n := nextval('public.store_order_number_seq');
  RETURN 'JJB-' || to_char(now() AT TIME ZONE 'Europe/London', 'YYYYMMDD') || '-' || lpad(n::text, 4, '0');
END;
$$;

REVOKE ALL ON FUNCTION public.next_store_order_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_store_order_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_store_order_number() TO service_role;
