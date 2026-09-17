-- Allow the Supabase service_role to manage Store catalogue tables.
-- Needed for one-off private import scripts (Shopify CSV → draft products).
-- Admin UI continues to use the authenticated+is_admin() RLS path.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variants TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_images TO service_role;
GRANT SELECT, INSERT, DELETE ON public.inventory_movements TO service_role;

COMMENT ON TABLE public.products IS
  'Store products (admin CMS). Not publicly readable until a later launch phase. service_role may write for private imports.';
