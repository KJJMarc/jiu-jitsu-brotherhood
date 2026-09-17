-- Kingston Jiu Jitsu — Supabase Storage for Store product images (Phase 1).
-- Dedicated KJJ Supabase project only (not Dojo Director).
--
-- Bucket `product-images` is PUBLIC so admin-uploaded assets have stable URLs.
-- Insert/update/delete remain restricted to allowlisted AAL2 admins.
-- Objects are not linked from the public site until a later launch phase.

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
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_admin_insert" ON storage.objects;
CREATE POLICY "product_images_admin_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.is_admin_aal2()
    AND (storage.foldername(name))[1] = 'products'
  );

DROP POLICY IF EXISTS "product_images_admin_update" ON storage.objects;
CREATE POLICY "product_images_admin_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
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
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.is_admin_aal2()
    AND (storage.foldername(name))[1] = 'products'
  );
