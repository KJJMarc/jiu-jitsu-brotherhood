-- JJB — comment email blocklist for spam & block moderation
-- Dedicated Jiu Jitsu Brotherhood Supabase project only.

-- ---------------------------------------------------------------------------
-- content_comment_email_blocklist
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content_comment_email_blocklist (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  note text NULL,
  source_comment_id uuid NULL
    REFERENCES public.content_comments (id) ON DELETE SET NULL,
  CONSTRAINT content_comment_email_blocklist_email_format
    CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  CONSTRAINT content_comment_email_blocklist_email_lower
    CHECK (email = lower(email))
);

COMMENT ON TABLE public.content_comment_email_blocklist IS
  'Normalized (lowercase) emails blocked from public comment submission. Admin/service_role only.';

ALTER TABLE public.content_comment_email_blocklist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "content_comment_email_blocklist_admin_select"
  ON public.content_comment_email_blocklist;
CREATE POLICY "content_comment_email_blocklist_admin_select"
  ON public.content_comment_email_blocklist
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "content_comment_email_blocklist_admin_insert"
  ON public.content_comment_email_blocklist;
CREATE POLICY "content_comment_email_blocklist_admin_insert"
  ON public.content_comment_email_blocklist
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "content_comment_email_blocklist_admin_update"
  ON public.content_comment_email_blocklist;
CREATE POLICY "content_comment_email_blocklist_admin_update"
  ON public.content_comment_email_blocklist
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "content_comment_email_blocklist_admin_delete"
  ON public.content_comment_email_blocklist;
CREATE POLICY "content_comment_email_blocklist_admin_delete"
  ON public.content_comment_email_blocklist
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

REVOKE ALL ON public.content_comment_email_blocklist FROM PUBLIC;
REVOKE ALL ON public.content_comment_email_blocklist FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_comment_email_blocklist
  TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Allow block_email on moderation audit trail
-- ---------------------------------------------------------------------------
ALTER TABLE public.content_comment_moderation_events
  DROP CONSTRAINT IF EXISTS content_comment_moderation_action_check;

ALTER TABLE public.content_comment_moderation_events
  ADD CONSTRAINT content_comment_moderation_action_check
  CHECK (
    action IN (
      'approve',
      'reject',
      'spam',
      'unspam',
      'edit',
      'delete',
      'restore',
      'reply',
      'block_email'
    )
  );
