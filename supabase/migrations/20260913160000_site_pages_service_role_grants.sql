-- Allow service_role (and maintain anon/authenticated privileges) on site_pages.
-- Fixes service-role tooling permission denied; public CMS reads already use anon.
GRANT SELECT ON public.site_pages TO anon, authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.site_pages TO authenticated, service_role;
