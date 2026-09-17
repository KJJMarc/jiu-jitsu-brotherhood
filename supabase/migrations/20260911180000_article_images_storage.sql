-- Kingston Jiu Jitsu — Supabase Storage for Articles CMS featured images.
-- Dedicated KJJ Supabase project only (not Dojo Director).
-- Does not migrate or delete existing /images/news/… assets.
--
-- Bucket `article-images` is PUBLIC. Objects are publicly addressable by URL
-- even when the parent article is still a draft (non-sensitive club assets).
-- Insert/update/delete remain restricted to allowlisted AAL2 admins.

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

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'article-images',
  'article-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "article_images_public_select" ON storage.objects;
CREATE POLICY "article_images_public_select"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'article-images');

DROP POLICY IF EXISTS "article_images_admin_insert" ON storage.objects;
CREATE POLICY "article_images_admin_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'article-images'
    AND public.is_admin_aal2()
    AND (storage.foldername(name))[1] = 'featured'
  );

DROP POLICY IF EXISTS "article_images_admin_update" ON storage.objects;
CREATE POLICY "article_images_admin_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'article-images'
    AND public.is_admin_aal2()
    AND (storage.foldername(name))[1] = 'featured'
  )
  WITH CHECK (
    bucket_id = 'article-images'
    AND public.is_admin_aal2()
    AND (storage.foldername(name))[1] = 'featured'
  );

DROP POLICY IF EXISTS "article_images_admin_delete" ON storage.objects;
CREATE POLICY "article_images_admin_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'article-images'
    AND public.is_admin_aal2()
    AND (storage.foldername(name))[1] = 'featured'
  );
