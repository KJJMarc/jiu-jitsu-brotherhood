-- Flag imported variants whose stock_qty is a placeholder, not verified inventory.
-- Shopify CSV used for private catalogue import had no inventory quantity column.
-- Admin UI must treat stock_review_required=true as "needs review", not real zero stock.

ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS stock_review_required boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.product_variants.stock_review_required IS
  'True when stock_qty has not been verified (e.g. Shopify import with missing qty). Do not treat as confirmed out-of-stock.';

CREATE INDEX IF NOT EXISTS product_variants_stock_review_required_idx
  ON public.product_variants (product_id)
  WHERE stock_review_required = true;

-- Clear the review flag whenever an admin records a stock movement.
CREATE OR REPLACE FUNCTION public.adjust_product_variant_stock(
  p_variant_id uuid,
  p_quantity_delta integer,
  p_movement_type text,
  p_note text DEFAULT NULL
)
RETURNS public.product_variants
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_variant public.product_variants;
  v_new_qty integer;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  IF p_quantity_delta = 0 THEN
    RAISE EXCEPTION 'Quantity delta must not be zero';
  END IF;

  IF p_movement_type NOT IN (
    'initial_stock',
    'stock_received',
    'manual_adjustment',
    'damaged',
    'order',
    'refund',
    'cancellation'
  ) THEN
    RAISE EXCEPTION 'Invalid movement type: %', p_movement_type;
  END IF;

  SELECT * INTO v_variant
  FROM public.product_variants
  WHERE id = p_variant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Variant not found';
  END IF;

  IF NOT v_variant.track_inventory THEN
    RAISE EXCEPTION 'Inventory tracking is disabled for this variant';
  END IF;

  v_new_qty := v_variant.stock_qty + p_quantity_delta;
  IF v_new_qty < 0 THEN
    RAISE EXCEPTION 'Insufficient stock (current %, delta %)',
      v_variant.stock_qty, p_quantity_delta;
  END IF;

  UPDATE public.product_variants
  SET
    stock_qty = v_new_qty,
    stock_review_required = false
  WHERE id = p_variant_id
  RETURNING * INTO v_variant;

  INSERT INTO public.inventory_movements (
    variant_id,
    quantity_delta,
    resulting_quantity,
    movement_type,
    note,
    created_by
  ) VALUES (
    p_variant_id,
    p_quantity_delta,
    v_new_qty,
    p_movement_type,
    nullif(trim(p_note), ''),
    auth.uid()
  );

  RETURN v_variant;
END;
$$;

COMMENT ON FUNCTION public.adjust_product_variant_stock(uuid, integer, text, text) IS
  'Admin-only atomic stock change: updates stock_qty, clears stock_review_required, inserts inventory_movements.';

-- Allow admins to acknowledge stock after verifying without changing quantity.
CREATE OR REPLACE FUNCTION public.clear_product_variant_stock_review(
  p_variant_id uuid
)
RETURNS public.product_variants
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_variant public.product_variants;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  UPDATE public.product_variants
  SET stock_review_required = false
  WHERE id = p_variant_id
  RETURNING * INTO v_variant;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Variant not found';
  END IF;

  RETURN v_variant;
END;
$$;

REVOKE ALL ON FUNCTION public.clear_product_variant_stock_review(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.clear_product_variant_stock_review(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_product_variant_stock_review(uuid) TO service_role;

COMMENT ON FUNCTION public.clear_product_variant_stock_review(uuid) IS
  'Admin-only: marks imported stock as reviewed without changing stock_qty.';
