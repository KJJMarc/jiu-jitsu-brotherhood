-- Kingston Jiu Jitsu — Store catalogue import support.
-- Allows product images to be either Supabase Storage objects or external URLs
-- (e.g. Shopify CDN references during private catalogue import).
-- Adds shopify_handle for idempotent Shopify CSV imports.
-- Admin-only; no public shop exposure.

-- ---------------------------------------------------------------------------
-- products.shopify_handle (idempotent import key)
-- ---------------------------------------------------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS shopify_handle text NULL;

CREATE UNIQUE INDEX IF NOT EXISTS products_shopify_handle_unique
  ON public.products (shopify_handle)
  WHERE shopify_handle IS NOT NULL AND length(trim(shopify_handle)) > 0;

COMMENT ON COLUMN public.products.shopify_handle IS
  'Original Shopify product Handle used for idempotent private catalogue imports.';

-- ---------------------------------------------------------------------------
-- product_images: support external URLs without Storage objects
-- ---------------------------------------------------------------------------
ALTER TABLE public.product_images
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'storage';

ALTER TABLE public.product_images
  DROP CONSTRAINT IF EXISTS product_images_source_type_check;

ALTER TABLE public.product_images
  ADD CONSTRAINT product_images_source_type_check
  CHECK (source_type IN ('storage', 'external'));

ALTER TABLE public.product_images
  ALTER COLUMN storage_path DROP NOT NULL;

ALTER TABLE public.product_images
  DROP CONSTRAINT IF EXISTS product_images_storage_path_nonempty;

ALTER TABLE public.product_images
  DROP CONSTRAINT IF EXISTS product_images_source_consistency;

ALTER TABLE public.product_images
  ADD CONSTRAINT product_images_source_consistency
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
  );

COMMENT ON COLUMN public.product_images.source_type IS
  'storage = file in product-images bucket; external = remote URL (e.g. Shopify CDN).';
COMMENT ON COLUMN public.product_images.storage_path IS
  'Bucket-relative path for storage images; NULL for external URL images.';
COMMENT ON TABLE public.product_images IS
  'Product gallery images: Supabase Storage uploads or external URL references.';
