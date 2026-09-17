-- Kingston Jiu Jitsu — admin Store foundation (Phase 1).
-- Dedicated KJJ Supabase project only (not Dojo Director).
--
-- Backend/admin only: no public SELECT policies. The live customer shop
-- remains Shopify until an explicit later cutover.

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL,
  description_html text NOT NULL DEFAULT '',
  product_type text NOT NULL DEFAULT 'physical'
    CONSTRAINT products_product_type_check
      CHECK (product_type IN ('physical', 'non_shipping')),
  status text NOT NULL DEFAULT 'draft'
    CONSTRAINT products_status_check
      CHECK (status IN ('draft', 'active', 'archived')),
  seo_title text NULL,
  seo_description text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  updated_by uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT products_title_nonempty CHECK (length(trim(title)) > 0),
  CONSTRAINT products_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE UNIQUE INDEX IF NOT EXISTS products_slug_unique
  ON public.products (slug);

CREATE INDEX IF NOT EXISTS products_status_updated_idx
  ON public.products (status, updated_at DESC);

COMMENT ON TABLE public.products IS
  'Store products (admin CMS). Not publicly readable until a later launch phase.';
COMMENT ON COLUMN public.products.product_type IS
  'physical = requires shipping; non_shipping = digital/event/drop-in.';
COMMENT ON COLUMN public.products.status IS
  'draft | active | archived. Archived replaces hard-delete once order history exists.';

CREATE OR REPLACE FUNCTION public.set_products_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_set_updated_at ON public.products;
CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_products_updated_at();

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_admin_select" ON public.products;
CREATE POLICY "products_admin_select"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "products_admin_insert" ON public.products;
CREATE POLICY "products_admin_insert"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "products_admin_update" ON public.products;
CREATE POLICY "products_admin_update"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "products_admin_delete" ON public.products;
CREATE POLICY "products_admin_delete"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

REVOKE ALL ON public.products FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;

-- ---------------------------------------------------------------------------
-- product_variants
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  sku text NULL,
  option_name text NOT NULL DEFAULT 'Size',
  option_value text NOT NULL DEFAULT 'Default',
  price_pence integer NOT NULL DEFAULT 0
    CONSTRAINT product_variants_price_nonnegative CHECK (price_pence >= 0),
  currency text NOT NULL DEFAULT 'GBP'
    CONSTRAINT product_variants_currency_check CHECK (currency = 'GBP'),
  track_inventory boolean NOT NULL DEFAULT false,
  stock_qty integer NOT NULL DEFAULT 0
    CONSTRAINT product_variants_stock_nonnegative CHECK (stock_qty >= 0),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_variants_option_name_nonempty
    CHECK (length(trim(option_name)) > 0),
  CONSTRAINT product_variants_option_value_nonempty
    CHECK (length(trim(option_value)) > 0)
);

CREATE INDEX IF NOT EXISTS product_variants_product_id_idx
  ON public.product_variants (product_id, sort_order);

CREATE UNIQUE INDEX IF NOT EXISTS product_variants_sku_unique
  ON public.product_variants (sku)
  WHERE sku IS NOT NULL AND length(trim(sku)) > 0;

CREATE INDEX IF NOT EXISTS product_variants_low_stock_idx
  ON public.product_variants (stock_qty)
  WHERE track_inventory = true AND is_active = true;

COMMENT ON TABLE public.product_variants IS
  'Sellable SKUs for a product (e.g. sizes). stock_qty is the fast-read balance.';

CREATE OR REPLACE FUNCTION public.set_product_variants_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS product_variants_set_updated_at ON public.product_variants;
CREATE TRIGGER product_variants_set_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.set_product_variants_updated_at();

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_variants_admin_select" ON public.product_variants;
CREATE POLICY "product_variants_admin_select"
  ON public.product_variants
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "product_variants_admin_insert" ON public.product_variants;
CREATE POLICY "product_variants_admin_insert"
  ON public.product_variants
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "product_variants_admin_update" ON public.product_variants;
CREATE POLICY "product_variants_admin_update"
  ON public.product_variants
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "product_variants_admin_delete" ON public.product_variants;
CREATE POLICY "product_variants_admin_delete"
  ON public.product_variants
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

REVOKE ALL ON public.product_variants FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;

-- ---------------------------------------------------------------------------
-- product_images
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  alt_text text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_images_storage_path_nonempty
    CHECK (length(trim(storage_path)) > 0),
  CONSTRAINT product_images_public_url_nonempty
    CHECK (length(trim(public_url)) > 0)
);

CREATE INDEX IF NOT EXISTS product_images_product_id_idx
  ON public.product_images (product_id, sort_order);

CREATE UNIQUE INDEX IF NOT EXISTS product_images_one_primary_per_product
  ON public.product_images (product_id)
  WHERE is_primary = true;

COMMENT ON TABLE public.product_images IS
  'Product gallery images stored in the product-images Storage bucket.';

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_images_admin_select" ON public.product_images;
CREATE POLICY "product_images_admin_select"
  ON public.product_images
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "product_images_admin_insert" ON public.product_images;
CREATE POLICY "product_images_admin_insert"
  ON public.product_images
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "product_images_admin_update" ON public.product_images;
CREATE POLICY "product_images_admin_update"
  ON public.product_images
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "product_images_admin_delete" ON public.product_images;
CREATE POLICY "product_images_admin_delete"
  ON public.product_images
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

REVOKE ALL ON public.product_images FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_images TO authenticated;

-- ---------------------------------------------------------------------------
-- inventory_movements (audit ledger)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid NOT NULL REFERENCES public.product_variants (id) ON DELETE CASCADE,
  quantity_delta integer NOT NULL,
  resulting_quantity integer NOT NULL
    CONSTRAINT inventory_movements_resulting_nonnegative CHECK (resulting_quantity >= 0),
  movement_type text NOT NULL
    CONSTRAINT inventory_movements_type_check CHECK (
      movement_type IN (
        'initial_stock',
        'stock_received',
        'manual_adjustment',
        'damaged',
        'order',
        'refund',
        'cancellation'
      )
    ),
  note text NULL,
  created_by uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inventory_movements_delta_nonzero CHECK (quantity_delta <> 0)
);

CREATE INDEX IF NOT EXISTS inventory_movements_variant_created_idx
  ON public.inventory_movements (variant_id, created_at DESC);

COMMENT ON TABLE public.inventory_movements IS
  'Append-only-ish inventory audit log. stock_qty on variants is derived/fast-read.';

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inventory_movements_admin_select" ON public.inventory_movements;
CREATE POLICY "inventory_movements_admin_select"
  ON public.inventory_movements
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "inventory_movements_admin_insert" ON public.inventory_movements;
CREATE POLICY "inventory_movements_admin_insert"
  ON public.inventory_movements
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- No UPDATE policy: corrections are new movements, not edits.
-- DELETE is allowed only so unused products/variants can be hard-removed
-- (and so ON DELETE CASCADE from product_variants works under RLS).

DROP POLICY IF EXISTS "inventory_movements_admin_delete" ON public.inventory_movements;
CREATE POLICY "inventory_movements_admin_delete"
  ON public.inventory_movements
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

REVOKE ALL ON public.inventory_movements FROM PUBLIC;
GRANT SELECT, INSERT, DELETE ON public.inventory_movements TO authenticated;

-- ---------------------------------------------------------------------------
-- Atomic stock adjustment (admin only)
-- ---------------------------------------------------------------------------
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
  SET stock_qty = v_new_qty
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

REVOKE ALL ON FUNCTION public.adjust_product_variant_stock(uuid, integer, text, text)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.adjust_product_variant_stock(uuid, integer, text, text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_product_variant_stock(uuid, integer, text, text)
  TO service_role;

COMMENT ON FUNCTION public.adjust_product_variant_stock(uuid, integer, text, text) IS
  'Admin-only atomic stock change: updates stock_qty and inserts inventory_movements.';
