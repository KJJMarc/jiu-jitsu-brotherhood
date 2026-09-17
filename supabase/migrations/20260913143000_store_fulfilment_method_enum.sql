-- Future order fulfilment method (collection vs UK shipping).
-- No orders table yet — enum only, for the upcoming checkout model.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'store_fulfilment_method'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.store_fulfilment_method AS ENUM (
      'collection',
      'uk_shipping'
    );
  END IF;
END $$;

COMMENT ON TYPE public.store_fulfilment_method IS
  'Order fulfilment choice for physical goods: club collection or UK shipping.';
