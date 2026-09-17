-- Kingston Jiu Jitsu — singleton tracking / pixel settings.
-- Dedicated KJJ Supabase project only. Does not alter articles or site_settings.

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
  'Singleton Meta / Google tracking settings for the public marketing site (id = site).';
COMMENT ON COLUMN public.tracking_settings.meta_pixel_id IS
  'Meta Pixel ID from Events Manager → Data Sources.';
COMMENT ON COLUMN public.tracking_settings.google_tag_id IS
  'Google tag ID (AW-…) or GA4 Measurement ID (G-…).';
COMMENT ON COLUMN public.tracking_settings.google_ads_conversion_label IS
  'Optional Google Ads conversion label (send_to suffix). Trial enquiry conversions usually fire on Dojo Director; stored here for marketing-site config parity.';

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

-- Public read so consent-gated scripts can load configured IDs.
DROP POLICY IF EXISTS "tracking_settings_public_select" ON public.tracking_settings;
CREATE POLICY "tracking_settings_public_select"
  ON public.tracking_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "tracking_settings_admin_select" ON public.tracking_settings;
CREATE POLICY "tracking_settings_admin_select"
  ON public.tracking_settings
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "tracking_settings_admin_insert" ON public.tracking_settings;
CREATE POLICY "tracking_settings_admin_insert"
  ON public.tracking_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "tracking_settings_admin_update" ON public.tracking_settings;
CREATE POLICY "tracking_settings_admin_update"
  ON public.tracking_settings
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "tracking_settings_admin_delete" ON public.tracking_settings;
CREATE POLICY "tracking_settings_admin_delete"
  ON public.tracking_settings
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Table privileges (RLS still applies). Include GRANTs — do not repeat the
-- site_pages permission miss.
GRANT SELECT ON public.tracking_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tracking_settings TO authenticated;
REVOKE ALL ON public.tracking_settings FROM PUBLIC;

INSERT INTO public.tracking_settings (
  id,
  meta_pixel_enabled,
  meta_pixel_id,
  google_enabled,
  google_tag_id,
  google_ads_conversion_label
)
VALUES (
  'site',
  false,
  NULL,
  false,
  NULL,
  NULL
)
ON CONFLICT (id) DO NOTHING;
