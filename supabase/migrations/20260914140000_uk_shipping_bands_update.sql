-- Update KJJ UK shipping bands: close 0–9 g gap; new prices.
-- Architecture unchanged — collection, UK-only, physical-weight-only.

ALTER TABLE public.store_shipping_bands
  DROP CONSTRAINT IF EXISTS store_shipping_bands_min_weight_grams_check;

ALTER TABLE public.store_shipping_bands
  ADD CONSTRAINT store_shipping_bands_min_weight_grams_check
  CHECK (min_weight_grams >= 0);

ALTER TABLE public.store_shipping_bands
  DROP CONSTRAINT IF EXISTS store_shipping_bands_max_weight_grams_check;

ALTER TABLE public.store_shipping_bands
  ADD CONSTRAINT store_shipping_bands_max_weight_grams_check
  CHECK (max_weight_grams >= 0);

-- Replace enabled band set (order FKs use ON DELETE SET NULL).
DELETE FROM public.store_shipping_bands;

INSERT INTO public.store_shipping_bands (
  min_weight_grams, max_weight_grams, price_pence, is_enabled, sort_order
) VALUES
  (0,    100,   175, true, 10),
  (101,  500,   275, true, 20),
  (501,  1500,  425, true, 30),
  (1501, 4000,  650, true, 40),
  (4001, 6000,  750, true, 50),
  (6001, 10000, 850, true, 60);

COMMENT ON TABLE public.store_shipping_bands IS
  'UK shipping price bands by total physical shipment weight (grams → pence). First band starts at 0 g.';
