-- site_pages was created without table privileges matching articles.
-- Without these GRANTs, authenticated admin SELECTs fail with
-- "permission denied for table site_pages" and /admin/pages/ crashes.

GRANT SELECT ON public.site_pages TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_pages TO authenticated;
REVOKE ALL ON public.site_pages FROM PUBLIC;
