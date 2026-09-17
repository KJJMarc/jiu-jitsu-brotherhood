-- Kingston Jiu Jitsu — CMS pages for footer policies + kids class info.
-- Dedicated KJJ Supabase project only. Does not alter articles.

CREATE TABLE IF NOT EXISTS public.site_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  title text NOT NULL,
  slug text NOT NULL,
  -- legal | cookie | kids — chooses public chrome around body_html
  template text NOT NULL DEFAULT 'legal'
    CONSTRAINT site_pages_template_check
      CHECK (template IN ('legal', 'cookie', 'kids')),

  eyebrow text NULL,
  hero_lead text NULL,
  body_html text NULL,

  status text NOT NULL DEFAULT 'draft'
    CONSTRAINT site_pages_status_check CHECK (status IN ('draft', 'published')),
  published_at timestamptz NULL,

  seo_title text NULL,
  seo_description text NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  updated_by uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,

  CONSTRAINT site_pages_title_nonempty CHECK (length(trim(title)) > 0),
  CONSTRAINT site_pages_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT site_pages_published_requires_date CHECK (
    status = 'draft' OR published_at IS NOT NULL
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS site_pages_slug_unique
  ON public.site_pages (slug);

COMMENT ON TABLE public.site_pages IS
  'Editable site pages (policies, kids info). Public may read published rows only.';
COMMENT ON COLUMN public.site_pages.template IS
  'Public layout variant: legal (prose), cookie (prose + cookie controls), kids (pagehero lead).';
COMMENT ON COLUMN public.site_pages.body_html IS
  'TipTap HTML body. Null means public falls back to the static in-repo copy.';

CREATE OR REPLACE FUNCTION public.set_site_pages_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS site_pages_set_updated_at ON public.site_pages;
CREATE TRIGGER site_pages_set_updated_at
  BEFORE UPDATE ON public.site_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_site_pages_updated_at();

ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_pages_public_select_published" ON public.site_pages;
CREATE POLICY "site_pages_public_select_published"
  ON public.site_pages
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "site_pages_admin_select_all" ON public.site_pages;
CREATE POLICY "site_pages_admin_select_all"
  ON public.site_pages
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "site_pages_admin_insert" ON public.site_pages;
CREATE POLICY "site_pages_admin_insert"
  ON public.site_pages
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "site_pages_admin_update" ON public.site_pages;
CREATE POLICY "site_pages_admin_update"
  ON public.site_pages
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "site_pages_admin_delete" ON public.site_pages;
CREATE POLICY "site_pages_admin_delete"
  ON public.site_pages
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Table privileges (RLS still applies). Match articles grants.
GRANT SELECT ON public.site_pages TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_pages TO authenticated;
REVOKE ALL ON public.site_pages FROM PUBLIC;

-- Seed the five managed pages (body_html filled on first admin save from static copy).
INSERT INTO public.site_pages (
  title, slug, template, eyebrow, hero_lead, status, published_at, seo_description
)
VALUES
  (
    'Privacy Policy',
    'privacy-policy',
    'legal',
    NULL,
    NULL,
    'published',
    now(),
    'How Kingston Jiu Jitsu collects, uses and protects your personal data.'
  ),
  (
    'Cookie Policy',
    'cookie-policy',
    'cookie',
    NULL,
    NULL,
    'published',
    now(),
    'How Kingston Jiu Jitsu uses cookies and similar technologies, and how to manage your preferences.'
  ),
  (
    'Child Protection Policy',
    'child-protection-policy',
    'legal',
    NULL,
    NULL,
    'published',
    now(),
    'Kingston Jiu Jitsu child protection and safeguarding policy.'
  ),
  (
    'Terms & Conditions',
    'terms-and-conditions',
    'legal',
    NULL,
    NULL,
    'published',
    now(),
    'Terms and conditions for Kingston Jiu Jitsu membership and website use.'
  ),
  (
    'Kids'' Class Information',
    'kids-class-information',
    'kids',
    'For parents',
    'Everything you need to know about our children''s classes — membership and term times, our behaviour policy and uniform.',
    'published',
    now(),
    'Practical information for parents of children training at Kingston Jiu Jitsu — membership and term times, behaviour policy and uniform.'
  )
ON CONFLICT (slug) DO NOTHING;
