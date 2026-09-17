-- Kingston Jiu Jitsu — Phase 1A admin allowlist
-- Dedicated KJJ Supabase project only (not Dojo Director).

CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT admin_users_email_nonempty CHECK (length(trim(email)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_users_email_lower_idx
  ON public.admin_users (lower(email));

COMMENT ON TABLE public.admin_users IS
  'Allowlist of users permitted to access /admin. No public registration.';
COMMENT ON COLUMN public.admin_users.user_id IS
  'auth.users id for an invited admin account.';
COMMENT ON COLUMN public.admin_users.email IS
  'Email at invite time (display / audit).';
COMMENT ON COLUMN public.admin_users.created_by IS
  'auth.users id of the admin who added this row, if any.';

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Authenticated users may read only their own allowlist row (for requireAdmin).
DROP POLICY IF EXISTS "admin_users_select_own" ON public.admin_users;
CREATE POLICY "admin_users_select_own"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies for authenticated or anon.
-- Allowlist rows are managed with the service role (Dashboard SQL / invite script).

GRANT SELECT ON public.admin_users TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.admin_users FROM authenticated;
REVOKE ALL ON public.admin_users FROM anon;
