-- Kingston Jiu Jitsu — singleton site settings (academy, social, default SEO).
-- Dedicated KJJ Supabase project only. Does not alter articles or site_pages.

-- Ensure is_admin() exists (normally created by articles migration). Safe to
-- re-run if that function was missing when site_settings policies were applied.
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
  'Singleton academy / social / default SEO settings (id = site).';
COMMENT ON COLUMN public.site_settings.twitter_url IS
  'X (Twitter) URL — existing public social location; blank hides the icon.';
COMMENT ON COLUMN public.site_settings.tiktok_url IS
  'TikTok URL — blank hides the icon (no link until set).';

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

-- Public read (footer/social/SEO fallbacks).
DROP POLICY IF EXISTS "site_settings_public_select" ON public.site_settings;
CREATE POLICY "site_settings_public_select"
  ON public.site_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admins: write access via is_admin() allowlist (same pattern as articles).
DROP POLICY IF EXISTS "site_settings_admin_select" ON public.site_settings;
CREATE POLICY "site_settings_admin_select"
  ON public.site_settings
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "site_settings_admin_insert" ON public.site_settings;
CREATE POLICY "site_settings_admin_insert"
  ON public.site_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "site_settings_admin_update" ON public.site_settings;
CREATE POLICY "site_settings_admin_update"
  ON public.site_settings
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "site_settings_admin_delete" ON public.site_settings;
CREATE POLICY "site_settings_admin_delete"
  ON public.site_settings
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Table privileges (RLS still applies). Do not omit these — matches articles /
-- site_pages grants so authenticated admin SELECT/UPDATE cannot permission-deny.
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
REVOKE ALL ON public.site_settings FROM PUBLIC;

-- Seed the single settings row from current codebase values in lib/site.ts.
INSERT INTO public.site_settings (
  id,
  academy_name,
  contact_email,
  contact_phone,
  address,
  instagram_url,
  facebook_url,
  youtube_url,
  tiktok_url,
  twitter_url,
  default_seo_title,
  default_seo_description
)
VALUES (
  'site',
  'Kingston Jiu Jitsu',
  'admin@kingstonjiujitsu.com',
  '07584 131335',
  E'Tiffin Sports Centre, Queen Elizabeth Road, Kingston upon Thames KT2 6RL\nSt John''s Parish Hall, Grove Lane, Kingston upon Thames KT1 2SU',
  'https://www.instagram.com/kingstonjiujitsu/',
  'https://www.facebook.com/kingstonjiujitsu/',
  'https://www.youtube.com/channel/UCjdHYMuxqEybo4Y_VlA55tQ',
  NULL,
  'https://twitter.com/KingstonJits',
  'Kingston Jiu Jitsu | Brazilian Jiu Jitsu in Kingston upon Thames',
  'Brazilian Jiu Jitsu classes for all ages and levels in Kingston upon Thames. A welcoming, family-friendly academy and proud members of the Mauricio Gomes Legacy Team.'
)
ON CONFLICT (id) DO NOTHING;
