-- Fulfilment / shipping foundation for the future KJJ store checkout.
-- Private admin store only — no public checkout yet.

-- Variant shipping weight (grams). NULL = unverified / missing.
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS weight_grams integer
    CHECK (weight_grams IS NULL OR weight_grams > 0);

COMMENT ON COLUMN public.product_variants.weight_grams IS
  'Shipping weight in whole grams. NULL means unverified — never treat as zero.';

-- Singleton collection + shipping toggles.
CREATE TABLE IF NOT EXISTS public.store_fulfilment_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  collection_enabled boolean NOT NULL DEFAULT true,
  collection_label text NOT NULL DEFAULT 'Collect at Kingston Jiu Jitsu',
  collection_instructions text NOT NULL DEFAULT
    'Collect your order at Kingston Jiu Jitsu. We will confirm collection details after purchase.',
  uk_shipping_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

INSERT INTO public.store_fulfilment_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.store_fulfilment_settings IS
  'Singleton store fulfilment settings (collection + UK shipping toggles).';

-- Weight bands in grams; prices in pence. Inclusive min/max.
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
  'UK shipping price bands by total physical shipment weight (grams → pence).';

-- Seed confirmed KJJ bands (idempotent by exact range).
INSERT INTO public.store_shipping_bands (
  min_weight_grams, max_weight_grams, price_pence, is_enabled, sort_order
)
SELECT * FROM (VALUES
  (10,   100,   120,  true, 10),
  (101,  500,   400,  true, 20),
  (501,  1500,  600,  true, 30),
  (1501, 4000,  1200, true, 40),
  (4001, 6000,  2000, true, 50),
  (6001, 10000, 4000, true, 60)
) AS v(min_weight_grams, max_weight_grams, price_pence, is_enabled, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.store_shipping_bands b
  WHERE b.min_weight_grams = v.min_weight_grams
    AND b.max_weight_grams = v.max_weight_grams
);

ALTER TABLE public.store_fulfilment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_shipping_bands ENABLE ROW LEVEL SECURITY;

-- Admin-only read/write via existing is_admin() helper.
DROP POLICY IF EXISTS store_fulfilment_settings_admin_all ON public.store_fulfilment_settings;
CREATE POLICY store_fulfilment_settings_admin_all
  ON public.store_fulfilment_settings
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS store_shipping_bands_admin_all ON public.store_shipping_bands;
CREATE POLICY store_shipping_bands_admin_all
  ON public.store_shipping_bands
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_fulfilment_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_shipping_bands TO authenticated;
GRANT ALL ON public.store_fulfilment_settings TO service_role;
GRANT ALL ON public.store_shipping_bands TO service_role;
