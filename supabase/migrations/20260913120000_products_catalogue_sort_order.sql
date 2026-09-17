-- Manual catalogue display order for Recommended storefront sort.
-- Admin-only until an explicit public /shop cutover.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.products.sort_order IS
  'Manual storefront catalogue order (Recommended). Lower values appear first.';

-- Backfill existing rows into a stable curated sequence.
WITH ordered AS (
  SELECT
    id,
    (ROW_NUMBER() OVER (ORDER BY created_at ASC, title ASC) - 1)::integer AS rn
  FROM public.products
)
UPDATE public.products AS p
SET sort_order = ordered.rn
FROM ordered
WHERE p.id = ordered.id;

CREATE INDEX IF NOT EXISTS products_status_sort_order_idx
  ON public.products (status, sort_order ASC, title ASC);
