-- JJB Phase 3 — content comments (PROPOSED — do not apply until Phase 4 approval)
-- Dedicated Jiu Jitsu Brotherhood Supabase project only.
-- Supports historical Shopify imports + new moderated public comments on
-- articles and techniques. Parent/child threading prepared for admin replies
-- and future public replies (historical export is flat).

-- ---------------------------------------------------------------------------
-- content_comments (public-safe columns only)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content_comments (
  id uuid PRIMARY KEY,

  content_id uuid NOT NULL
    REFERENCES public.contents (id) ON DELETE CASCADE,

  parent_id uuid NULL
    REFERENCES public.content_comments (id) ON DELETE SET NULL,

  status text NOT NULL DEFAULT 'pending'
    CONSTRAINT content_comments_status_check
      CHECK (status IN ('pending', 'published', 'spam', 'rejected', 'deleted')),

  author_display_name text NOT NULL,
  body_text text NOT NULL DEFAULT '',
  body_html text NULL,

  is_official_reply boolean NOT NULL DEFAULT false,

  source text NOT NULL DEFAULT 'jjb'
    CONSTRAINT content_comments_source_check
      CHECK (source IN ('shopify', 'jjb')),

  source_shopify_comment_gid text NULL,
  source_shopify_article_gid text NULL,

  -- Original audience-facing timestamp (Shopify createdAt for imports)
  source_created_at timestamptz NULL,
  published_at timestamptz NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  moderated_at timestamptz NULL,
  moderated_by uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,

  CONSTRAINT content_comments_author_name_nonempty
    CHECK (length(trim(author_display_name)) > 0),
  CONSTRAINT content_comments_body_nonempty
    CHECK (
      length(trim(body_text)) > 0
      OR (body_html IS NOT NULL AND length(trim(body_html)) > 0)
    ),
  CONSTRAINT content_comments_shopify_gid_required
    CHECK (
      source <> 'shopify'
      OR source_shopify_comment_gid IS NOT NULL
    ),
  CONSTRAINT content_comments_official_reply_has_parent
    CHECK (
      is_official_reply = false
      OR parent_id IS NOT NULL
    ),
  CONSTRAINT content_comments_no_self_parent
    CHECK (parent_id IS NULL OR parent_id <> id)
);

CREATE UNIQUE INDEX IF NOT EXISTS content_comments_shopify_gid_uidx
  ON public.content_comments (source_shopify_comment_gid)
  WHERE source_shopify_comment_gid IS NOT NULL;

CREATE INDEX IF NOT EXISTS content_comments_content_published_idx
  ON public.content_comments (content_id, source_created_at ASC NULLS LAST, created_at ASC)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS content_comments_status_idx
  ON public.content_comments (status, created_at DESC);

CREATE INDEX IF NOT EXISTS content_comments_parent_idx
  ON public.content_comments (parent_id)
  WHERE parent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS content_comments_content_id_idx
  ON public.content_comments (content_id);

COMMENT ON TABLE public.content_comments IS
  'Public-safe comment rows for articles/techniques. Author email and IP live in content_comment_private.';
COMMENT ON COLUMN public.content_comments.source_shopify_comment_gid IS
  'Immutable Shopify Comment GID. Unique for idempotent imports.';
COMMENT ON COLUMN public.content_comments.is_official_reply IS
  'When true, UI should label the author as Jiu Jitsu Brotherhood.';

CREATE OR REPLACE FUNCTION public.set_content_comments_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS content_comments_set_updated_at ON public.content_comments;
CREATE TRIGGER content_comments_set_updated_at
  BEFORE UPDATE ON public.content_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_content_comments_updated_at();

-- ---------------------------------------------------------------------------
-- content_comment_private (PII — never grant to anon)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content_comment_private (
  comment_id uuid PRIMARY KEY
    REFERENCES public.content_comments (id) ON DELETE CASCADE,

  author_email text NULL,
  ip_hash text NULL,
  user_agent text NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT content_comment_private_email_format
    CHECK (
      author_email IS NULL
      OR author_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    )
);

COMMENT ON TABLE public.content_comment_private IS
  'Private commenter contact/fingerprint data. Admin/service_role only. Never expose via public API.';

CREATE OR REPLACE FUNCTION public.set_content_comment_private_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS content_comment_private_set_updated_at
  ON public.content_comment_private;
CREATE TRIGGER content_comment_private_set_updated_at
  BEFORE UPDATE ON public.content_comment_private
  FOR EACH ROW
  EXECUTE FUNCTION public.set_content_comment_private_updated_at();

-- ---------------------------------------------------------------------------
-- Moderation audit trail
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content_comment_moderation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL
    REFERENCES public.content_comments (id) ON DELETE CASCADE,
  actor_user_id uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  action text NOT NULL
    CONSTRAINT content_comment_moderation_action_check
      CHECK (
        action IN (
          'approve',
          'reject',
          'spam',
          'unspam',
          'edit',
          'delete',
          'restore',
          'reply'
        )
      ),
  from_status text NULL,
  to_status text NULL,
  note text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_comment_moderation_events_comment_idx
  ON public.content_comment_moderation_events (comment_id, created_at DESC);

COMMENT ON TABLE public.content_comment_moderation_events IS
  'Append-only moderation history for content_comments.';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.content_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_comment_private ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_comment_moderation_events ENABLE ROW LEVEL SECURITY;

-- Public: published comments only (no private table access)
DROP POLICY IF EXISTS "content_comments_public_select_published"
  ON public.content_comments;
CREATE POLICY "content_comments_public_select_published"
  ON public.content_comments
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- Admins: full access on public-safe table
DROP POLICY IF EXISTS "content_comments_admin_select_all"
  ON public.content_comments;
CREATE POLICY "content_comments_admin_select_all"
  ON public.content_comments
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "content_comments_admin_insert"
  ON public.content_comments;
CREATE POLICY "content_comments_admin_insert"
  ON public.content_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "content_comments_admin_update"
  ON public.content_comments;
CREATE POLICY "content_comments_admin_update"
  ON public.content_comments
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "content_comments_admin_delete"
  ON public.content_comments;
CREATE POLICY "content_comments_admin_delete"
  ON public.content_comments
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- No anon INSERT/UPDATE/DELETE policies — public submissions use server
-- actions with the service role after validation (same pattern as contact form).

-- Private PII: admin read/write only
DROP POLICY IF EXISTS "content_comment_private_admin_select"
  ON public.content_comment_private;
CREATE POLICY "content_comment_private_admin_select"
  ON public.content_comment_private
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "content_comment_private_admin_insert"
  ON public.content_comment_private;
CREATE POLICY "content_comment_private_admin_insert"
  ON public.content_comment_private
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "content_comment_private_admin_update"
  ON public.content_comment_private;
CREATE POLICY "content_comment_private_admin_update"
  ON public.content_comment_private
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "content_comment_private_admin_delete"
  ON public.content_comment_private;
CREATE POLICY "content_comment_private_admin_delete"
  ON public.content_comment_private
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Moderation events: admin only
DROP POLICY IF EXISTS "content_comment_moderation_events_admin_select"
  ON public.content_comment_moderation_events;
CREATE POLICY "content_comment_moderation_events_admin_select"
  ON public.content_comment_moderation_events
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "content_comment_moderation_events_admin_insert"
  ON public.content_comment_moderation_events;
CREATE POLICY "content_comment_moderation_events_admin_insert"
  ON public.content_comment_moderation_events
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Grants
-- service_role bypasses RLS but still needs table privileges (importer SELECT + writes).
GRANT SELECT ON public.content_comments TO anon, authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.content_comments TO authenticated, service_role;

REVOKE ALL ON public.content_comment_private FROM PUBLIC;
REVOKE ALL ON public.content_comment_private FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_comment_private
  TO authenticated, service_role;

REVOKE ALL ON public.content_comment_moderation_events FROM PUBLIC;
REVOKE ALL ON public.content_comment_moderation_events FROM anon;
GRANT SELECT, INSERT ON public.content_comment_moderation_events
  TO authenticated, service_role;

REVOKE ALL ON public.content_comments FROM PUBLIC;
