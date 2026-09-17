-- Phase 3: private store orders + Mollie TEST payment foundation.
-- Admin/private preview only. No public shop cutover.
-- Inventory is reduced only after payment is confirmed, idempotently.

-- ---------------------------------------------------------------------------
-- Extend inventory_movements with optional order linkage
-- ---------------------------------------------------------------------------
ALTER TABLE public.inventory_movements
  ADD COLUMN IF NOT EXISTS order_id uuid NULL;

ALTER TABLE public.inventory_movements
  ADD COLUMN IF NOT EXISTS order_item_id uuid NULL;

CREATE INDEX IF NOT EXISTS inventory_movements_order_id_idx
  ON public.inventory_movements (order_id)
  WHERE order_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- store_orders
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NULL,
  fulfilment_method text NULL
    CONSTRAINT store_orders_fulfilment_method_check
      CHECK (
        fulfilment_method IS NULL
        OR fulfilment_method IN ('collection', 'uk_shipping')
      ),
  shipping_name text NULL,
  shipping_line1 text NULL,
  shipping_line2 text NULL,
  shipping_city text NULL,
  shipping_county text NULL,
  shipping_postcode text NULL,
  shipping_country text NULL,
  subtotal_pence integer NOT NULL CHECK (subtotal_pence >= 0),
  shipping_pence integer NOT NULL DEFAULT 0 CHECK (shipping_pence >= 0),
  total_pence integer NOT NULL CHECK (total_pence >= 0),
  currency text NOT NULL DEFAULT 'GBP'
    CONSTRAINT store_orders_currency_check CHECK (currency = 'GBP'),
  payment_status text NOT NULL DEFAULT 'pending_payment'
    CONSTRAINT store_orders_payment_status_check CHECK (
      payment_status IN (
        'pending_payment',
        'paid',
        'payment_failed',
        'cancelled',
        'refunded',
        'partially_refunded'
      )
    ),
  fulfilment_status text NOT NULL DEFAULT 'unfulfilled'
    CONSTRAINT store_orders_fulfilment_status_check CHECK (
      fulfilment_status IN (
        'unfulfilled',
        'preparing',
        'ready_for_collection',
        'shipped',
        'collected',
        'cancelled'
      )
    ),
  mollie_payment_id text NULL,
  mollie_mode text NULL
    CONSTRAINT store_orders_mollie_mode_check
      CHECK (mollie_mode IS NULL OR mollie_mode IN ('test', 'live')),
  shipping_band_id uuid NULL REFERENCES public.store_shipping_bands (id) ON DELETE SET NULL,
  shipping_weight_grams integer NULL CHECK (
    shipping_weight_grams IS NULL OR shipping_weight_grams >= 0
  ),
  terms_version text NOT NULL,
  terms_accepted_at timestamptz NOT NULL,
  stock_applied_at timestamptz NULL,
  payment_confirmed_at timestamptz NULL,
  customer_note text NULL,
  created_by uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_orders_title_nonempty CHECK (length(trim(customer_name)) > 0),
  CONSTRAINT store_orders_email_nonempty CHECK (length(trim(customer_email)) > 0),
  CONSTRAINT store_orders_shipping_address_when_delivery CHECK (
    fulfilment_method IS DISTINCT FROM 'uk_shipping'
    OR (
      shipping_line1 IS NOT NULL
      AND shipping_city IS NOT NULL
      AND shipping_postcode IS NOT NULL
      AND shipping_country IS NOT NULL
    )
  ),
  CONSTRAINT store_orders_total_matches CHECK (
    total_pence = subtotal_pence + shipping_pence
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS store_orders_order_number_unique
  ON public.store_orders (order_number);

CREATE UNIQUE INDEX IF NOT EXISTS store_orders_mollie_payment_id_unique
  ON public.store_orders (mollie_payment_id)
  WHERE mollie_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS store_orders_created_at_idx
  ON public.store_orders (created_at DESC);

CREATE INDEX IF NOT EXISTS store_orders_payment_status_idx
  ON public.store_orders (payment_status, created_at DESC);

CREATE INDEX IF NOT EXISTS store_orders_customer_email_idx
  ON public.store_orders (lower(customer_email));

COMMENT ON TABLE public.store_orders IS
  'Private KJJ store orders. Payment confirmation must come from Mollie server-side, never the browser redirect alone.';

CREATE OR REPLACE FUNCTION public.set_store_orders_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS store_orders_set_updated_at ON public.store_orders;
CREATE TRIGGER store_orders_set_updated_at
  BEFORE UPDATE ON public.store_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_store_orders_updated_at();

ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_orders_admin_select" ON public.store_orders;
CREATE POLICY "store_orders_admin_select"
  ON public.store_orders
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "store_orders_admin_insert" ON public.store_orders;
CREATE POLICY "store_orders_admin_insert"
  ON public.store_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "store_orders_admin_update" ON public.store_orders;
CREATE POLICY "store_orders_admin_update"
  ON public.store_orders
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- No public/anon access. Service role used by Mollie webhook via service key.
REVOKE ALL ON public.store_orders FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE ON public.store_orders TO authenticated;
GRANT ALL ON public.store_orders TO service_role;

-- ---------------------------------------------------------------------------
-- store_order_items (immutable purchase snapshots)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.store_orders (id) ON DELETE CASCADE,
  product_id uuid NULL REFERENCES public.products (id) ON DELETE SET NULL,
  variant_id uuid NULL REFERENCES public.product_variants (id) ON DELETE SET NULL,
  product_title text NOT NULL,
  variant_label text NOT NULL,
  sku text NULL,
  product_type text NOT NULL
    CONSTRAINT store_order_items_product_type_check
      CHECK (product_type IN ('physical', 'non_shipping')),
  product_status text NOT NULL
    CONSTRAINT store_order_items_product_status_check
      CHECK (product_status IN ('draft', 'active', 'archived')),
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price_pence integer NOT NULL CHECK (unit_price_pence >= 0),
  line_total_pence integer NOT NULL CHECK (line_total_pence >= 0),
  weight_grams integer NULL CHECK (weight_grams IS NULL OR weight_grams > 0),
  track_inventory boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_order_items_line_total_matches CHECK (
    line_total_pence = unit_price_pence * quantity
  )
);

CREATE INDEX IF NOT EXISTS store_order_items_order_id_idx
  ON public.store_order_items (order_id, sort_order);

COMMENT ON TABLE public.store_order_items IS
  'Immutable line snapshots for store orders. Do not reconstruct from live product rows.';

ALTER TABLE public.store_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_order_items_admin_select" ON public.store_order_items;
CREATE POLICY "store_order_items_admin_select"
  ON public.store_order_items
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "store_order_items_admin_insert" ON public.store_order_items;
CREATE POLICY "store_order_items_admin_insert"
  ON public.store_order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

REVOKE ALL ON public.store_order_items FROM PUBLIC;
GRANT SELECT, INSERT ON public.store_order_items TO authenticated;
GRANT ALL ON public.store_order_items TO service_role;

-- FK from inventory_movements now that order tables exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inventory_movements_order_id_fkey'
  ) THEN
    ALTER TABLE public.inventory_movements
      ADD CONSTRAINT inventory_movements_order_id_fkey
      FOREIGN KEY (order_id) REFERENCES public.store_orders (id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inventory_movements_order_item_id_fkey'
  ) THEN
    ALTER TABLE public.inventory_movements
      ADD CONSTRAINT inventory_movements_order_item_id_fkey
      FOREIGN KEY (order_item_id) REFERENCES public.store_order_items (id) ON DELETE SET NULL;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- store_payment_events (webhook / sync audit + idempotency)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NULL REFERENCES public.store_orders (id) ON DELETE SET NULL,
  mollie_payment_id text NULL,
  source text NOT NULL
    CONSTRAINT store_payment_events_source_check
      CHECK (source IN ('create', 'return_sync', 'webhook', 'admin_sync')),
  mollie_status text NULL,
  idempotency_key text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed_ok boolean NOT NULL DEFAULT false,
  error_message text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS store_payment_events_idempotency_unique
  ON public.store_payment_events (idempotency_key);

CREATE INDEX IF NOT EXISTS store_payment_events_order_id_idx
  ON public.store_payment_events (order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS store_payment_events_mollie_payment_id_idx
  ON public.store_payment_events (mollie_payment_id, created_at DESC);

COMMENT ON TABLE public.store_payment_events IS
  'Audit log for Mollie payment create/return/webhook. idempotency_key prevents double-processing.';

ALTER TABLE public.store_payment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_payment_events_admin_select" ON public.store_payment_events;
CREATE POLICY "store_payment_events_admin_select"
  ON public.store_payment_events
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

REVOKE ALL ON public.store_payment_events FROM PUBLIC;
GRANT SELECT ON public.store_payment_events TO authenticated;
GRANT ALL ON public.store_payment_events TO service_role;

-- ---------------------------------------------------------------------------
-- Order number sequence helper
-- ---------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.store_order_number_seq;

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
  RETURN 'KJJ-' || to_char(now() AT TIME ZONE 'Europe/London', 'YYYYMMDD') || '-' || lpad(n::text, 4, '0');
END;
$$;

REVOKE ALL ON FUNCTION public.next_store_order_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_store_order_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_store_order_number() TO service_role;

-- ---------------------------------------------------------------------------
-- Idempotent stock application after paid confirmation
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_store_order_stock(p_order_id uuid)
RETURNS public.store_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.store_orders;
  v_item public.store_order_items;
  v_variant public.product_variants;
  v_new_qty integer;
BEGIN
  SELECT * INTO v_order
  FROM public.store_orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.payment_status <> 'paid' THEN
    RAISE EXCEPTION 'Order is not paid (status %)', v_order.payment_status;
  END IF;

  -- Already applied — idempotent no-op
  IF v_order.stock_applied_at IS NOT NULL THEN
    RETURN v_order;
  END IF;

  FOR v_item IN
    SELECT *
    FROM public.store_order_items
    WHERE order_id = p_order_id
    ORDER BY sort_order, created_at
  LOOP
    IF NOT v_item.track_inventory OR v_item.variant_id IS NULL THEN
      CONTINUE;
    END IF;

    SELECT * INTO v_variant
    FROM public.product_variants
    WHERE id = v_item.variant_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Variant % missing for order item %', v_item.variant_id, v_item.id;
    END IF;

    IF NOT v_variant.track_inventory THEN
      CONTINUE;
    END IF;

    v_new_qty := v_variant.stock_qty - v_item.quantity;
    IF v_new_qty < 0 THEN
      RAISE EXCEPTION 'Insufficient stock for variant % (have %, need %)',
        v_item.variant_id, v_variant.stock_qty, v_item.quantity;
    END IF;

    UPDATE public.product_variants
    SET
      stock_qty = v_new_qty,
      stock_review_required = false
    WHERE id = v_item.variant_id;

    INSERT INTO public.inventory_movements (
      variant_id,
      quantity_delta,
      resulting_quantity,
      movement_type,
      note,
      created_by,
      order_id,
      order_item_id
    ) VALUES (
      v_item.variant_id,
      -v_item.quantity,
      v_new_qty,
      'order',
      'Order ' || v_order.order_number,
      NULL,
      v_order.id,
      v_item.id
    );
  END LOOP;

  UPDATE public.store_orders
  SET stock_applied_at = now()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_store_order_stock(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_store_order_stock(uuid) TO service_role;
-- Admins may manually re-sync via service path; not granted to authenticated
-- to avoid accidental double-clicks without going through app logic.

COMMENT ON FUNCTION public.apply_store_order_stock(uuid) IS
  'Idempotent stock deduction for a paid store order. Safe under webhook retries.';
