-- Kingston Jiu Jitsu — articles table for news/CMS (Phase 1B import)
-- Dedicated KJJ Supabase project only (not Dojo Director).

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

CREATE TABLE IF NOT EXISTS public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  title text NOT NULL,
  slug text NOT NULL,
  excerpt text NOT NULL DEFAULT '',

  -- Mapped from legacy news.json (rich body/editor comes later)
  body_paragraphs text[] NOT NULL DEFAULT '{}',
  youtube_ids text[] NOT NULL DEFAULT '{}',
  categories text[] NOT NULL DEFAULT '{}',

  -- Existing public asset paths, e.g. /images/news/....jpg
  image_path text NULL,
  image_alt text NULL,

  status text NOT NULL DEFAULT 'draft'
    CONSTRAINT articles_status_check CHECK (status IN ('draft', 'published')),
  published_at timestamptz NULL,

  seo_title text NULL,
  seo_description text NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  updated_by uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,

  CONSTRAINT articles_title_nonempty CHECK (length(trim(title)) > 0),
  CONSTRAINT articles_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT articles_published_requires_date CHECK (
    status = 'draft' OR published_at IS NOT NULL
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS articles_slug_unique
  ON public.articles (slug);

CREATE INDEX IF NOT EXISTS articles_published_list
  ON public.articles (published_at DESC)
  WHERE status = 'published';

COMMENT ON TABLE public.articles IS
  'Club news/articles. Public may read published rows only.';
COMMENT ON COLUMN public.articles.body_paragraphs IS
  'Plain-text paragraphs from legacy news.json (TipTap body later).';
COMMENT ON COLUMN public.articles.youtube_ids IS
  'YouTube video IDs embedded after body paragraphs.';
COMMENT ON COLUMN public.articles.image_path IS
  'Public site path or absolute URL for the article image.';
COMMENT ON COLUMN public.articles.seo_title IS
  'Optional SEO title; null falls back to title.';
COMMENT ON COLUMN public.articles.seo_description IS
  'Optional SEO description; null falls back to excerpt.';

CREATE OR REPLACE FUNCTION public.set_articles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS articles_set_updated_at ON public.articles;
CREATE TRIGGER articles_set_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_articles_updated_at();

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Public / anon: published articles only
DROP POLICY IF EXISTS "articles_public_select_published" ON public.articles;
CREATE POLICY "articles_public_select_published"
  ON public.articles
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- Admins: full access (allowlist via is_admin())
DROP POLICY IF EXISTS "articles_admin_select_all" ON public.articles;
CREATE POLICY "articles_admin_select_all"
  ON public.articles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "articles_admin_insert" ON public.articles;
CREATE POLICY "articles_admin_insert"
  ON public.articles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "articles_admin_update" ON public.articles;
CREATE POLICY "articles_admin_update"
  ON public.articles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "articles_admin_delete" ON public.articles;
CREATE POLICY "articles_admin_delete"
  ON public.articles
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

GRANT SELECT ON public.articles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.articles TO authenticated;
REVOKE ALL ON public.articles FROM PUBLIC;
