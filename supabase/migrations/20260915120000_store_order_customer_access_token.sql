-- Phase 4A: guest order self-serve access via unguessable token (hash only in DB).
-- Never authorize by order id or order number alone.

ALTER TABLE public.store_orders
  ADD COLUMN IF NOT EXISTS customer_access_token_hash text NULL;

COMMENT ON COLUMN public.store_orders.customer_access_token_hash IS
  'SHA-256 hex digest of an unguessable guest access token. Used to authorize '
  'customer order confirmation views. Never authorize by order id or order number alone. '
  'The raw token is not stored; it is issued at order creation and may be recovered '
  'from Mollie payment metadata for confirmation emails.';
