-- =============================================================================
-- Jiu Jitsu Brotherhood — CLEAN DATABASE BASELINE (fresh empty project only)
-- =============================================================================
-- File: supabase/jjb-baseline/0001_jjb_clean_baseline.sql
--
-- Apply ONLY to a brand-new, empty JJB Supabase project.
-- NEVER apply to Kingston Jiu Jitsu (KJJ) production or any KJJ project.
-- NEVER place this file into supabase/migrations/ (historical KJJ chain).
--
-- This encodes the FINAL required schema for JJB (Option 3 / Phase 2E).
-- It does NOT replay the 25-file historical migration history.
--
-- Explicitly excluded: articles, site_pages, article-images bucket,
-- KJJ site_settings seeds, KJJ shipping rate seeds, admin allowlist emails.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Admin allowlist + auth helpers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT admin_users_email_nonempty CHECK (length(trim(email)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_users_email_lower_idx
  ON public.admin_users (lower(email));

COMMENT ON TABLE public.admin_users IS
  'Allowlist of users permitted to access /admin. No public registration. No seeded emails.';

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_users_select_own" ON public.admin_users;
CREATE POLICY "admin_users_select_own"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE for authenticated/anon — service role / Dashboard only.
GRANT SELECT ON public.admin_users TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.admin_users FROM authenticated;
REVOKE ALL ON public.admin_users FROM anon;
GRANT ALL ON public.admin_users TO service_role;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

COMMENT ON FUNCTION public.is_admin() IS
  'True when auth.uid() is present on public.admin_users.';

DROP POLICY IF EXISTS "admin_users_select_allowlisted" ON public.admin_users;
CREATE POLICY "admin_users_select_allowlisted"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.is_admin_aal2()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin()
    AND coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;

REVOKE ALL ON FUNCTION public.is_admin_aal2() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_aal2() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_aal2() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin_aal2() TO service_role;

COMMENT ON FUNCTION public.is_admin_aal2() IS
  'True when auth.uid() is on admin_users and the JWT authenticator assurance level is aal2.';

-- ---------------------------------------------------------------------------
-- 2. Site settings + tracking (neutral empty singletons — no KJJ identity)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_settings (
  id text PRIMARY KEY DEFAULT 'site'
    CONSTRAINT site_settings_singleton_id CHECK (id = 'site'),
  academy_name text,
  contact_email text,
  contact_phone text,
  address text,
  instagram_url text,
  facebook_url text,
  youtube_url text,
  tiktok_url text,
  twitter_url text,
  default_seo_title text,
  default_seo_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.site_settings IS
  'Singleton site / social / default SEO settings (id = site). Seeded empty; fill deliberately.';

CREATE OR REPLACE FUNCTION public.set_site_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS site_settings_set_updated_at ON public.site_settings;
CREATE TRIGGER site_settings_set_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_site_settings_updated_at();

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_settings_public_select" ON public.site_settings;
CREATE POLICY "site_settings_public_select"
  ON public.site_settings FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "site_settings_admin_select" ON public.site_settings;
CREATE POLICY "site_settings_admin_select"
  ON public.site_settings FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "site_settings_admin_insert" ON public.site_settings;
CREATE POLICY "site_settings_admin_insert"
  ON public.site_settings FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "site_settings_admin_update" ON public.site_settings;
CREATE POLICY "site_settings_admin_update"
  ON public.site_settings FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "site_settings_admin_delete" ON public.site_settings;
CREATE POLICY "site_settings_admin_delete"
  ON public.site_settings FOR DELETE TO authenticated
  USING (public.is_admin());

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
REVOKE ALL ON public.site_settings FROM PUBLIC;

INSERT INTO public.site_settings (id)
VALUES ('site')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.tracking_settings (
  id text PRIMARY KEY DEFAULT 'site'
    CONSTRAINT tracking_settings_singleton_id CHECK (id = 'site'),
  meta_pixel_enabled boolean NOT NULL DEFAULT false,
  meta_pixel_id text,
  google_enabled boolean NOT NULL DEFAULT false,
  google_tag_id text,
  google_ads_conversion_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.tracking_settings IS
  'Singleton Meta / Google tracking settings. Seeded disabled with null IDs.';

CREATE OR REPLACE FUNCTION public.set_tracking_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tracking_settings_set_updated_at ON public.tracking_settings;
CREATE TRIGGER tracking_settings_set_updated_at
  BEFORE UPDATE ON public.tracking_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tracking_settings_updated_at();

ALTER TABLE public.tracking_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tracking_settings_public_select" ON public.tracking_settings;
CREATE POLICY "tracking_settings_public_select"
  ON public.tracking_settings FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "tracking_settings_admin_select" ON public.tracking_settings;
CREATE POLICY "tracking_settings_admin_select"
  ON public.tracking_settings FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "tracking_settings_admin_insert" ON public.tracking_settings;
CREATE POLICY "tracking_settings_admin_insert"
  ON public.tracking_settings FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "tracking_settings_admin_update" ON public.tracking_settings;
CREATE POLICY "tracking_settings_admin_update"
  ON public.tracking_settings FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "tracking_settings_admin_delete" ON public.tracking_settings;
CREATE POLICY "tracking_settings_admin_delete"
  ON public.tracking_settings FOR DELETE TO authenticated
  USING (public.is_admin());

GRANT SELECT ON public.tracking_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tracking_settings TO authenticated;
GRANT ALL ON public.tracking_settings TO service_role;
REVOKE ALL ON public.tracking_settings FROM PUBLIC;

INSERT INTO public.tracking_settings (
  id, meta_pixel_enabled, meta_pixel_id, google_enabled, google_tag_id, google_ads_conversion_label
)
VALUES ('site', false, NULL, false, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Store catalogue (final schema)
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
  shopify_handle text NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  updated_by uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT products_title_nonempty CHECK (length(trim(title)) > 0),
  CONSTRAINT products_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE UNIQUE INDEX IF NOT EXISTS products_slug_unique ON public.products (slug);
CREATE UNIQUE INDEX IF NOT EXISTS products_shopify_handle_unique
  ON public.products (shopify_handle)
  WHERE shopify_handle IS NOT NULL AND length(trim(shopify_handle)) > 0;
CREATE INDEX IF NOT EXISTS products_status_updated_idx
  ON public.products (status, updated_at DESC);
CREATE INDEX IF NOT EXISTS products_status_sort_order_idx
  ON public.products (status, sort_order ASC, title ASC);

COMMENT ON TABLE public.products IS
  'Store products. Public storefront reads via service_role; RLS is admin-only.';
COMMENT ON COLUMN public.products.shopify_handle IS
  'Original Shopify product Handle for idempotent catalogue imports.';
COMMENT ON COLUMN public.products.sort_order IS
  'Manual storefront catalogue order. Lower values appear first.';

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
  ON public.products FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "products_admin_insert" ON public.products;
CREATE POLICY "products_admin_insert"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "products_admin_update" ON public.products;
CREATE POLICY "products_admin_update"
  ON public.products FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "products_admin_delete" ON public.products;
CREATE POLICY "products_admin_delete"
  ON public.products FOR DELETE TO authenticated
  USING (public.is_admin());

REVOKE ALL ON public.products FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO service_role;

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
  stock_review_required boolean NOT NULL DEFAULT false,
  weight_grams integer NULL
    CHECK (weight_grams IS NULL OR weight_grams > 0),
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
CREATE INDEX IF NOT EXISTS product_variants_stock_review_required_idx
  ON public.product_variants (product_id)
  WHERE stock_review_required = true;

COMMENT ON COLUMN public.product_variants.stock_review_required IS
  'True when stock_qty has not been verified. Do not treat as confirmed out-of-stock.';
COMMENT ON COLUMN public.product_variants.weight_grams IS
  'Shipping weight in whole grams. NULL means unverified — never treat as zero.';

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
  ON public.product_variants FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "product_variants_admin_insert" ON public.product_variants;
CREATE POLICY "product_variants_admin_insert"
  ON public.product_variants FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "product_variants_admin_update" ON public.product_variants;
CREATE POLICY "product_variants_admin_update"
  ON public.product_variants FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "product_variants_admin_delete" ON public.product_variants;
CREATE POLICY "product_variants_admin_delete"
  ON public.product_variants FOR DELETE TO authenticated
  USING (public.is_admin());

REVOKE ALL ON public.product_variants FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variants TO service_role;

CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  source_type text NOT NULL DEFAULT 'storage'
    CONSTRAINT product_images_source_type_check
      CHECK (source_type IN ('storage', 'external')),
  storage_path text NULL,
  public_url text NOT NULL,
  alt_text text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_images_public_url_nonempty
    CHECK (length(trim(public_url)) > 0),
  CONSTRAINT product_images_source_consistency
    CHECK (
      (
        source_type = 'storage'
        AND storage_path IS NOT NULL
        AND length(trim(storage_path)) > 0
      )
      OR (
        source_type = 'external'
        AND storage_path IS NULL
        AND length(trim(public_url)) > 0
      )
    )
);

CREATE INDEX IF NOT EXISTS product_images_product_id_idx
  ON public.product_images (product_id, sort_order);
CREATE UNIQUE INDEX IF NOT EXISTS product_images_one_primary_per_product
  ON public.product_images (product_id)
  WHERE is_primary = true;

COMMENT ON TABLE public.product_images IS
  'Product gallery: Supabase Storage uploads or external CDN URL references.';

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_images_admin_select" ON public.product_images;
CREATE POLICY "product_images_admin_select"
  ON public.product_images FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "product_images_admin_insert" ON public.product_images;
CREATE POLICY "product_images_admin_insert"
  ON public.product_images FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "product_images_admin_update" ON public.product_images;
CREATE POLICY "product_images_admin_update"
  ON public.product_images FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "product_images_admin_delete" ON public.product_images;
CREATE POLICY "product_images_admin_delete"
  ON public.product_images FOR DELETE TO authenticated
  USING (public.is_admin());

REVOKE ALL ON public.product_images FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_images TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_images TO service_role;

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
  order_id uuid NULL,
  order_item_id uuid NULL,
  created_by uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inventory_movements_delta_nonzero CHECK (quantity_delta <> 0)
);

CREATE INDEX IF NOT EXISTS inventory_movements_variant_created_idx
  ON public.inventory_movements (variant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS inventory_movements_order_id_idx
  ON public.inventory_movements (order_id)
  WHERE order_id IS NOT NULL;

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inventory_movements_admin_select" ON public.inventory_movements;
CREATE POLICY "inventory_movements_admin_select"
  ON public.inventory_movements FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "inventory_movements_admin_insert" ON public.inventory_movements;
CREATE POLICY "inventory_movements_admin_insert"
  ON public.inventory_movements FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "inventory_movements_admin_delete" ON public.inventory_movements;
CREATE POLICY "inventory_movements_admin_delete"
  ON public.inventory_movements FOR DELETE TO authenticated
  USING (public.is_admin());

REVOKE ALL ON public.inventory_movements FROM PUBLIC;
GRANT SELECT, INSERT, DELETE ON public.inventory_movements TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.inventory_movements TO service_role;

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

REVOKE ALL ON FUNCTION public.adjust_product_variant_stock(uuid, integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.adjust_product_variant_stock(uuid, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_product_variant_stock(uuid, integer, text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.clear_product_variant_stock_review(p_variant_id uuid)
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

-- ---------------------------------------------------------------------------
-- 4. Fulfilment / shipping (UK fail-closed; collection seeded intentionally)
-- ---------------------------------------------------------------------------
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
  'Order fulfilment choice: Collect at Kingston Jiu Jitsu, or UK shipping.';

CREATE TABLE IF NOT EXISTS public.store_fulfilment_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  collection_enabled boolean NOT NULL DEFAULT true,
  collection_label text NOT NULL DEFAULT 'Collect at Kingston Jiu Jitsu',
  collection_instructions text NOT NULL DEFAULT '',
  uk_shipping_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

COMMENT ON TABLE public.store_fulfilment_settings IS
  'Singleton fulfilment settings. Collection is an intentional JJB option; UK shipping stays fail-closed until bands are configured.';
COMMENT ON COLUMN public.store_fulfilment_settings.collection_label IS
  'Customer-facing label. Approved: Collect at Kingston Jiu Jitsu.';
COMMENT ON COLUMN public.store_fulfilment_settings.collection_instructions IS
  'Left empty until approved JJB collection copy is supplied. Do not invent hours/address here.';

INSERT INTO public.store_fulfilment_settings (
  id,
  collection_enabled,
  collection_label,
  collection_instructions,
  uk_shipping_enabled
)
VALUES (
  1,
  true,
  'Collect at Kingston Jiu Jitsu',
  '',
  false
)
ON CONFLICT (id) DO UPDATE SET
  collection_enabled = EXCLUDED.collection_enabled,
  collection_label = EXCLUDED.collection_label,
  collection_instructions = EXCLUDED.collection_instructions,
  uk_shipping_enabled = EXCLUDED.uk_shipping_enabled;

CREATE TABLE IF NOT EXISTS public.store_shipping_bands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  min_weight_grams integer NOT NULL CHECK (min_weight_grams > 0),
  max_weight_grams integer NOT NULL CHECK (max_weight_grams > 0),
  price_pence integer NOT NULL CHECK (price_pence >= 0),
  is_enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_shipping_bands_range_check
    CHECK (max_weight_grams >= min_weight_grams)
);

CREATE INDEX IF NOT EXISTS store_shipping_bands_enabled_weight_idx
  ON public.store_shipping_bands (is_enabled, min_weight_grams, max_weight_grams);

COMMENT ON TABLE public.store_shipping_bands IS
  'UK shipping price bands. Intentionally empty in the JJB baseline — configure deliberately.';

-- NO seed rows for shipping bands (fail-closed until JJB rates are approved).

ALTER TABLE public.store_fulfilment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_shipping_bands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS store_fulfilment_settings_admin_all ON public.store_fulfilment_settings;
CREATE POLICY store_fulfilment_settings_admin_all
  ON public.store_fulfilment_settings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS store_shipping_bands_admin_all ON public.store_shipping_bands;
CREATE POLICY store_shipping_bands_admin_all
  ON public.store_shipping_bands
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_fulfilment_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_shipping_bands TO authenticated;
GRANT ALL ON public.store_fulfilment_settings TO service_role;
GRANT ALL ON public.store_shipping_bands TO service_role;

-- ---------------------------------------------------------------------------
-- 5. Orders + Mollie + stock apply (JJB- order numbers from day one)
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
  customer_confirmation_sent_at timestamptz NULL,
  admin_notification_sent_at timestamptz NULL,
  customer_access_token_hash text NULL,
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
  'JJB store orders. Payment confirmation must come from Mollie server-side.';
COMMENT ON COLUMN public.store_orders.customer_access_token_hash IS
  'SHA-256 hex digest of guest access token. Never authorize by order id/number alone.';
COMMENT ON COLUMN public.store_orders.customer_confirmation_sent_at IS
  'Set when customer confirmation email sent via Resend.';
COMMENT ON COLUMN public.store_orders.admin_notification_sent_at IS
  'Set when admin new-order notification sent via Resend.';

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
  ON public.store_orders FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "store_orders_admin_insert" ON public.store_orders;
CREATE POLICY "store_orders_admin_insert"
  ON public.store_orders FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "store_orders_admin_update" ON public.store_orders;
CREATE POLICY "store_orders_admin_update"
  ON public.store_orders FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE ALL ON public.store_orders FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE ON public.store_orders TO authenticated;
GRANT ALL ON public.store_orders TO service_role;

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

ALTER TABLE public.store_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_order_items_admin_select" ON public.store_order_items;
CREATE POLICY "store_order_items_admin_select"
  ON public.store_order_items FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "store_order_items_admin_insert" ON public.store_order_items;
CREATE POLICY "store_order_items_admin_insert"
  ON public.store_order_items FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

REVOKE ALL ON public.store_order_items FROM PUBLIC;
GRANT SELECT, INSERT ON public.store_order_items TO authenticated;
GRANT ALL ON public.store_order_items TO service_role;

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
  'Audit log for Mollie create/return/webhook. idempotency_key prevents double-processing.';

ALTER TABLE public.store_payment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_payment_events_admin_select" ON public.store_payment_events;
CREATE POLICY "store_payment_events_admin_select"
  ON public.store_payment_events FOR SELECT TO authenticated
  USING (public.is_admin());

REVOKE ALL ON public.store_payment_events FROM PUBLIC;
GRANT SELECT ON public.store_payment_events TO authenticated;
GRANT ALL ON public.store_payment_events TO service_role;

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
  RETURN 'JJB-' || to_char(now() AT TIME ZONE 'Europe/London', 'YYYYMMDD') || '-' || lpad(n::text, 4, '0');
END;
$$;

REVOKE ALL ON FUNCTION public.next_store_order_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_store_order_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_store_order_number() TO service_role;

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

COMMENT ON FUNCTION public.apply_store_order_stock(uuid) IS
  'Idempotent stock deduction for a paid store order. Safe under webhook retries.';

-- ---------------------------------------------------------------------------
-- 6. Editorial foundation (contents / authors / media_assets)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  slug text NOT NULL,
  bio text NULL,
  avatar_url text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT authors_display_name_nonempty CHECK (length(trim(display_name)) > 0),
  CONSTRAINT authors_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE UNIQUE INDEX IF NOT EXISTS authors_slug_uidx ON public.authors (slug);

CREATE OR REPLACE FUNCTION public.set_authors_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS authors_set_updated_at ON public.authors;
CREATE TRIGGER authors_set_updated_at
  BEFORE UPDATE ON public.authors
  FOR EACH ROW
  EXECUTE FUNCTION public.set_authors_updated_at();

CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL
    CONSTRAINT media_assets_kind_check CHECK (kind IN ('image', 'file')),
  source_url text NOT NULL,
  public_url text NOT NULL,
  storage_path text NULL,
  alt text NULL,
  width integer NULL,
  height integer NULL,
  sha256 text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT media_assets_source_url_nonempty CHECK (length(trim(source_url)) > 0),
  CONSTRAINT media_assets_public_url_nonempty CHECK (length(trim(public_url)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS media_assets_source_url_uidx
  ON public.media_assets (source_url);

CREATE TABLE IF NOT EXISTS public.contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL
    CONSTRAINT contents_type_check
      CHECK (type IN ('article', 'technique', 'past_event', 'page')),
  handle text NOT NULL,
  blog_handle text NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CONSTRAINT contents_status_check
      CHECK (status IN ('draft', 'published', 'archived')),
  published_at timestamptz NULL,
  excerpt text NOT NULL DEFAULT '',
  body_html text NULL,
  seo_title text NULL,
  seo_description text NULL,
  featured_image_url text NULL,
  featured_image_alt text NULL,
  featured_image_asset_id uuid NULL
    REFERENCES public.media_assets (id) ON DELETE SET NULL,
  youtube_ids text[] NOT NULL DEFAULT '{}',
  tags_public text[] NOT NULL DEFAULT '{}',
  tags_source text[] NOT NULL DEFAULT '{}',
  template text NULL,
  noindex boolean NOT NULL DEFAULT false,
  author_id uuid NULL
    REFERENCES public.authors (id) ON DELETE SET NULL,
  event_starts_at timestamptz NULL,
  event_ends_at timestamptz NULL,
  event_location_label text NULL,
  canonical_path text NOT NULL,
  source_shopify_gid text NULL,
  source_shopify_author text NULL,
  source_updated_at timestamptz NULL,
  source_payload jsonb NULL,
  mailerlite_form_code text NULL,
  mailerlite_embed_id text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  updated_by uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT contents_title_nonempty CHECK (length(trim(title)) > 0),
  CONSTRAINT contents_handle_format CHECK (handle ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT contents_published_requires_date CHECK (
    status <> 'published' OR published_at IS NOT NULL
  ),
  CONSTRAINT contents_canonical_path_format CHECK (
    canonical_path = '/'
    OR canonical_path ~ '^/([a-z0-9-]+/)*[a-z0-9-]+$'
  ),
  CONSTRAINT contents_article_blog_handle CHECK (
    type <> 'article' OR blog_handle = 'blog'
  ),
  CONSTRAINT contents_technique_blog_handle CHECK (
    type <> 'technique' OR blog_handle = 'techniques'
  ),
  CONSTRAINT contents_page_blog_handle CHECK (
    type <> 'page' OR blog_handle IS NULL
  ),
  CONSTRAINT contents_past_event_blog_handle CHECK (
    type <> 'past_event'
    OR blog_handle IS NULL
    OR blog_handle = 'blog'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS contents_canonical_path_uidx
  ON public.contents (canonical_path);
CREATE UNIQUE INDEX IF NOT EXISTS contents_source_gid_uidx
  ON public.contents (source_shopify_gid)
  WHERE source_shopify_gid IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS contents_type_handle_uidx
  ON public.contents (type, blog_handle, handle)
  NULLS NOT DISTINCT;
CREATE INDEX IF NOT EXISTS contents_published_list_idx
  ON public.contents (type, published_at DESC)
  WHERE status = 'published';
CREATE INDEX IF NOT EXISTS contents_status_idx
  ON public.contents (status);

COMMENT ON TABLE public.contents IS
  'JJB shared editorial documents. Public URLs are canonical_path.';
COMMENT ON COLUMN public.contents.source_shopify_author IS
  'Import metadata only. Never render publicly.';
COMMENT ON COLUMN public.contents.tags_source IS
  'Raw Shopify tags. Not public taxonomy.';
COMMENT ON COLUMN public.contents.tags_public IS
  'Deliberate public taxonomy; empty at Shopify import.';

CREATE OR REPLACE FUNCTION public.set_contents_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contents_set_updated_at ON public.contents;
CREATE TRIGGER contents_set_updated_at
  BEFORE UPDATE ON public.contents
  FOR EACH ROW
  EXECUTE FUNCTION public.set_contents_updated_at();

ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authors_public_select" ON public.authors;
CREATE POLICY "authors_public_select"
  ON public.authors FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "authors_admin_all" ON public.authors;
CREATE POLICY "authors_admin_all"
  ON public.authors FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "media_assets_public_select" ON public.media_assets;
CREATE POLICY "media_assets_public_select"
  ON public.media_assets FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "media_assets_admin_all" ON public.media_assets;
CREATE POLICY "media_assets_admin_all"
  ON public.media_assets FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "contents_public_select_published" ON public.contents;
CREATE POLICY "contents_public_select_published"
  ON public.contents FOR SELECT TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "contents_admin_select_all" ON public.contents;
CREATE POLICY "contents_admin_select_all"
  ON public.contents FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "contents_admin_insert" ON public.contents;
CREATE POLICY "contents_admin_insert"
  ON public.contents FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "contents_admin_update" ON public.contents;
CREATE POLICY "contents_admin_update"
  ON public.contents FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "contents_admin_delete" ON public.contents;
CREATE POLICY "contents_admin_delete"
  ON public.contents FOR DELETE TO authenticated
  USING (public.is_admin());

GRANT SELECT ON public.authors TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.authors TO authenticated, service_role;

GRANT SELECT ON public.media_assets TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.media_assets TO authenticated, service_role;

GRANT SELECT ON public.contents TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.contents TO authenticated, service_role;

REVOKE ALL ON public.authors FROM PUBLIC;
REVOKE ALL ON public.media_assets FROM PUBLIC;
REVOKE ALL ON public.contents FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- 7. Storage buckets (no seeded files)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "product_images_public_select" ON storage.objects;
CREATE POLICY "product_images_public_select"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_admin_insert" ON storage.objects;
CREATE POLICY "product_images_admin_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.is_admin_aal2()
    AND (storage.foldername(name))[1] = 'products'
  );

DROP POLICY IF EXISTS "product_images_admin_update" ON storage.objects;
CREATE POLICY "product_images_admin_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.is_admin_aal2()
    AND (storage.foldername(name))[1] = 'products'
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.is_admin_aal2()
    AND (storage.foldername(name))[1] = 'products'
  );

DROP POLICY IF EXISTS "product_images_admin_delete" ON storage.objects;
CREATE POLICY "product_images_admin_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.is_admin_aal2()
    AND (storage.foldername(name))[1] = 'products'
  );

-- Future editorial uploads / CDN migration (Shopify media stays CDN-referenced initially).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content-images',
  'content-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "content_images_public_select" ON storage.objects;
CREATE POLICY "content_images_public_select"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'content-images');

DROP POLICY IF EXISTS "content_images_admin_insert" ON storage.objects;
CREATE POLICY "content_images_admin_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'content-images'
    AND public.is_admin_aal2()
    AND (storage.foldername(name))[1] = 'media'
  );

DROP POLICY IF EXISTS "content_images_admin_update" ON storage.objects;
CREATE POLICY "content_images_admin_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'content-images'
    AND public.is_admin_aal2()
    AND (storage.foldername(name))[1] = 'media'
  )
  WITH CHECK (
    bucket_id = 'content-images'
    AND public.is_admin_aal2()
    AND (storage.foldername(name))[1] = 'media'
  );

DROP POLICY IF EXISTS "content_images_admin_delete" ON storage.objects;
CREATE POLICY "content_images_admin_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'content-images'
    AND public.is_admin_aal2()
    AND (storage.foldername(name))[1] = 'media'
  );

-- =============================================================================
-- End of JJB clean baseline
-- =============================================================================
