-- Idempotent transactional email delivery markers for paid store orders.
-- Apply in Supabase SQL editor / migration runner before relying on email sends
-- in production or preview. Safe to re-run (IF NOT EXISTS).

ALTER TABLE public.store_orders
  ADD COLUMN IF NOT EXISTS customer_confirmation_sent_at timestamptz NULL;

ALTER TABLE public.store_orders
  ADD COLUMN IF NOT EXISTS admin_notification_sent_at timestamptz NULL;

COMMENT ON COLUMN public.store_orders.customer_confirmation_sent_at IS
  'Set when the customer order-confirmation email was successfully sent via Resend. Cleared on send failure to allow safe retry.';

COMMENT ON COLUMN public.store_orders.admin_notification_sent_at IS
  'Set when the admin new-order notification email was successfully sent via Resend. Cleared on send failure to allow safe retry.';
