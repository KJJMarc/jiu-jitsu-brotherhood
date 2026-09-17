import "server-only";

import type { AdminProductDetail, AdminProductListItem } from "@/lib/admin/store";
import { STORE_LOW_STOCK_THRESHOLD } from "@/lib/admin/store";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  mapAdminProductDetailToStorefront,
  mapAdminProductListItemToCard,
} from "@/lib/storefront/map-from-admin";
import type {
  StorefrontProductCard,
  StorefrontProductDetail,
} from "@/lib/storefront/types";

function publicProductHref(slug: string): string {
  return `/products/${slug}`;
}

/**
 * Public catalogue — active products only.
 * Uses service-role client because product RLS is admin-only.
 */
export async function listPublicStorefrontCatalogue(): Promise<
  StorefrontProductCard[]
> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("products")
    .select(
      `
      *,
      product_variants ( id, price_pence, track_inventory, stock_qty, stock_review_required, is_active ),
      product_images ( public_url, is_primary, sort_order )
    `,
    )
    .eq("status", "active")
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((row) => {
      const variants = (row.product_variants ?? []) as Array<{
        id: string;
        price_pence: number;
        track_inventory: boolean;
        stock_qty: number;
        stock_review_required: boolean;
        is_active: boolean;
      }>;
      const images = (row.product_images ?? []) as Array<{
        public_url: string;
        is_primary: boolean;
        sort_order: number;
      }>;

      const activeVariants = variants.filter((v) => v.is_active);
      const prices = activeVariants.map((v) => v.price_pence);
      const tracked = activeVariants.filter((v) => v.track_inventory);
      const needsStockReview = tracked.some((v) => v.stock_review_required);
      const verifiedTracked = tracked.filter((v) => !v.stock_review_required);
      const primary =
        images.find((img) => img.is_primary) ??
        [...images].sort((a, b) => a.sort_order - b.sort_order)[0] ??
        null;

      const {
        product_variants: _variants,
        product_images: _images,
        ...product
      } = row as AdminProductListItem & {
        product_variants: unknown;
        product_images: unknown;
      };

      const item: AdminProductListItem = {
        ...(product as AdminProductListItem),
        variant_count: variants.length,
        active_variant_count: activeVariants.length,
        primary_image_url: primary?.public_url ?? null,
        min_price_pence: prices.length ? Math.min(...prices) : null,
        max_price_pence: prices.length ? Math.max(...prices) : null,
        tracked_stock_total: tracked.length
          ? tracked.reduce((sum, v) => sum + v.stock_qty, 0)
          : null,
        has_out_of_stock:
          verifiedTracked.length > 0 &&
          verifiedTracked.every((v) => v.stock_qty <= 0),
        has_low_stock: (() => {
          const verifiedTotal = verifiedTracked.reduce(
            (sum, v) => sum + v.stock_qty,
            0,
          );
          return (
            verifiedTotal > 0 && verifiedTotal <= STORE_LOW_STOCK_THRESHOLD
          );
        })(),
        has_stock_review_required: needsStockReview,
      };

      return mapAdminProductListItemToCard(item, {
        href: publicProductHref(item.slug),
      });
    })
    .filter((card) => card.status === "active");
}

/**
 * Public PDP by slug — active only. Draft/archived/missing → null (caller notFound).
 */
export async function getPublicStorefrontProductBySlug(
  slug: string,
): Promise<StorefrontProductDetail | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  const admin = getSupabaseAdminClient();
  const { data: product, error } = await admin
    .from("products")
    .select("*")
    .eq("slug", normalized)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!product) return null;
  if (product.status !== "active") return null;

  const productId = product.id as string;
  const [
    { data: variants, error: variantsError },
    { data: images, error: imagesError },
  ] = await Promise.all([
    admin
      .from("product_variants")
      .select("*")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    admin
      .from("product_images")
      .select("*")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  if (variantsError) throw new Error(variantsError.message);
  if (imagesError) throw new Error(imagesError.message);

  const detail: AdminProductDetail = {
    ...(product as AdminProductDetail),
    variants: (variants ?? []) as AdminProductDetail["variants"],
    images: (images ?? []) as AdminProductDetail["images"],
    recent_movements: [],
    can_hard_delete: false,
  };

  return mapAdminProductDetailToStorefront(detail);
}
