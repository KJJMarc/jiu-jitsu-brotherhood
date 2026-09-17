-- JJB Phase 2E — editorial content foundation (Phase 2D schema)
-- Apply ONLY to a dedicated Jiu Jitsu Brotherhood Supabase project.
-- NEVER apply to Kingston Jiu Jitsu production.

-- ---------------------------------------------------------------------------
-- Authors (optional byline; import leaves author_id null)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  slug text NOT NULL,
  bio text NULL,
  avatar_url text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT authors_display_name_nonempty CHECK (length(trim(display_name)) > 0),
  CONSTRAINT authors_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE UNIQUE INDEX IF NOT EXISTS authors_slug_uidx ON public.authors (slug);

CREATE OR REPLACE FUNCTION public.set_authors_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS authors_set_updated_at ON public.authors;
CREATE TRIGGER authors_set_updated_at
  BEFORE UPDATE ON public.authors
  FOR EACH ROW
  EXECUTE FUNCTION public.set_authors_updated_at();

-- ---------------------------------------------------------------------------
-- Media assets (CDN-by-reference now; Storage later)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL
    CONSTRAINT media_assets_kind_check CHECK (kind IN ('image', 'file')),
  source_url text NOT NULL,
  public_url text NOT NULL,
  storage_path text NULL,
  alt text NULL,
  width integer NULL,
  height integer NULL,
  sha256 text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT media_assets_source_url_nonempty CHECK (length(trim(source_url)) > 0),
  CONSTRAINT media_assets_public_url_nonempty CHECK (length(trim(public_url)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS media_assets_source_url_uidx
  ON public.media_assets (source_url);

-- ---------------------------------------------------------------------------
-- Shared editorial contents
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  type text NOT NULL
    CONSTRAINT contents_type_check
      CHECK (type IN ('article', 'technique', 'past_event', 'page')),

  handle text NOT NULL,
  blog_handle text NULL,
  title text NOT NULL,

  status text NOT NULL DEFAULT 'draft'
    CONSTRAINT contents_status_check
      CHECK (status IN ('draft', 'published', 'archived')),
  published_at timestamptz NULL,

  excerpt text NOT NULL DEFAULT '',
  body_html text NULL,

  seo_title text NULL,
  seo_description text NULL,

  featured_image_url text NULL,
  featured_image_alt text NULL,
  featured_image_asset_id uuid NULL
    REFERENCES public.media_assets (id) ON DELETE SET NULL,

  youtube_ids text[] NOT NULL DEFAULT '{}',
  tags_public text[] NOT NULL DEFAULT '{}',
  tags_source text[] NOT NULL DEFAULT '{}',

  template text NULL,
  noindex boolean NOT NULL DEFAULT false,

  author_id uuid NULL
    REFERENCES public.authors (id) ON DELETE SET NULL,

  event_starts_at timestamptz NULL,
  event_ends_at timestamptz NULL,
  event_location_label text NULL,

  canonical_path text NOT NULL,

  source_shopify_gid text NULL,
  source_shopify_author text NULL,
  source_updated_at timestamptz NULL,
  source_payload jsonb NULL,

  mailerlite_form_code text NULL,
  mailerlite_embed_id text NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  updated_by uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,

  CONSTRAINT contents_title_nonempty CHECK (length(trim(title)) > 0),
  CONSTRAINT contents_handle_format CHECK (handle ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT contents_published_requires_date CHECK (
    status <> 'published' OR published_at IS NOT NULL
  ),
  CONSTRAINT contents_canonical_path_format CHECK (
    canonical_path = '/'
    OR canonical_path ~ '^/([a-z0-9-]+/)*[a-z0-9-]+$'
  ),
  CONSTRAINT contents_article_blog_handle CHECK (
    type <> 'article' OR blog_handle = 'blog'
  ),
  CONSTRAINT contents_technique_blog_handle CHECK (
    type <> 'technique' OR blog_handle = 'techniques'
  ),
  CONSTRAINT contents_page_blog_handle CHECK (
    type <> 'page' OR blog_handle IS NULL
  ),
  CONSTRAINT contents_past_event_blog_handle CHECK (
    type <> 'past_event'
    OR blog_handle IS NULL
    OR blog_handle = 'blog'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS contents_canonical_path_uidx
  ON public.contents (canonical_path);

CREATE UNIQUE INDEX IF NOT EXISTS contents_source_gid_uidx
  ON public.contents (source_shopify_gid)
  WHERE source_shopify_gid IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS contents_type_handle_uidx
  ON public.contents (type, blog_handle, handle)
  NULLS NOT DISTINCT;

CREATE INDEX IF NOT EXISTS contents_published_list_idx
  ON public.contents (type, published_at DESC)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS contents_status_idx
  ON public.contents (status);

COMMENT ON TABLE public.contents IS
  'JJB shared editorial documents. Public URLs are canonical_path (Phase 2A), not inferred from type alone.';
COMMENT ON COLUMN public.contents.source_shopify_author IS
  'Import metadata only. Never render publicly (do not display JJB Admin).';
COMMENT ON COLUMN public.contents.tags_source IS
  'Raw Shopify tags. Not public taxonomy.';
COMMENT ON COLUMN public.contents.tags_public IS
  'Deliberate public taxonomy; empty at Shopify import.';
COMMENT ON COLUMN public.contents.mailerlite_form_code IS
  'Public MailerLite webform code (e.g. n2l0c2). No API secrets.';

CREATE OR REPLACE FUNCTION public.set_contents_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contents_set_updated_at ON public.contents;
CREATE TRIGGER contents_set_updated_at
  BEFORE UPDATE ON public.contents
  FOR EACH ROW
  EXECUTE FUNCTION public.set_contents_updated_at();

-- Ensure is_admin() exists (created by earlier seed migrations on full apply).
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

ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;

-- Authors: public can read (for bylines); admins write
DROP POLICY IF EXISTS "authors_public_select" ON public.authors;
CREATE POLICY "authors_public_select"
  ON public.authors FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "authors_admin_all" ON public.authors;
CREATE POLICY "authors_admin_all"
  ON public.authors FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Media: public read; admin write
DROP POLICY IF EXISTS "media_assets_public_select" ON public.media_assets;
CREATE POLICY "media_assets_public_select"
  ON public.media_assets FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "media_assets_admin_all" ON public.media_assets;
CREATE POLICY "media_assets_admin_all"
  ON public.media_assets FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Contents: public published only; admin full
DROP POLICY IF EXISTS "contents_public_select_published" ON public.contents;
CREATE POLICY "contents_public_select_published"
  ON public.contents FOR SELECT TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "contents_admin_select_all" ON public.contents;
CREATE POLICY "contents_admin_select_all"
  ON public.contents FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "contents_admin_insert" ON public.contents;
CREATE POLICY "contents_admin_insert"
  ON public.contents FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "contents_admin_update" ON public.contents;
CREATE POLICY "contents_admin_update"
  ON public.contents FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "contents_admin_delete" ON public.contents;
CREATE POLICY "contents_admin_delete"
  ON public.contents FOR DELETE TO authenticated
  USING (public.is_admin());

GRANT SELECT ON public.authors TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.authors TO authenticated, service_role;

GRANT SELECT ON public.media_assets TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.media_assets TO authenticated, service_role;

GRANT SELECT ON public.contents TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.contents TO authenticated, service_role;

REVOKE ALL ON public.authors FROM PUBLIC;
REVOKE ALL ON public.media_assets FROM PUBLIC;
REVOKE ALL ON public.contents FROM PUBLIC;
