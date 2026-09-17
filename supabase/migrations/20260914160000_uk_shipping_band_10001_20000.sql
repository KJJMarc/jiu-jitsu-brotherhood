-- Add heavy UK shipping band: 10001–20000 g → £12.00
-- Idempotent: skips insert if the range already exists.

INSERT INTO public.store_shipping_bands (
  min_weight_grams, max_weight_grams, price_pence, is_enabled, sort_order
)
SELECT 10001, 20000, 1200, true, 70
WHERE NOT EXISTS (
  SELECT 1
  FROM public.store_shipping_bands b
  WHERE b.min_weight_grams = 10001
    AND b.max_weight_grams = 20000
);

COMMENT ON TABLE public.store_shipping_bands IS
  'UK shipping price bands by total physical shipment weight (grams → pence). Includes 10001–20000 g band.';
