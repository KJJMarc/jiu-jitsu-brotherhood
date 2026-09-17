-- Kingston Jiu Jitsu — allow allowlisted admins to read the full admin_users list.
-- Needed for Admin → Admin Access when listing peers without the service role.
-- Uses public.is_admin() (SECURITY DEFINER) to avoid RLS recursion on admin_users.
-- Idempotent. Does not grant INSERT/UPDATE/DELETE to authenticated users.

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

DROP POLICY IF EXISTS "admin_users_select_allowlisted" ON public.admin_users;
CREATE POLICY "admin_users_select_allowlisted"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

COMMENT ON POLICY "admin_users_select_allowlisted" ON public.admin_users IS
  'Allowlisted admins may read all admin_users rows for the Admin Access UI.';
