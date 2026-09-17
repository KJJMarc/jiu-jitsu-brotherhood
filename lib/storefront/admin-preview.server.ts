import "server-only";

import {
  getAdminProductDetail,
  listAdminProducts,
} from "@/lib/admin/store.server";
import {
  mapAdminProductDetailToStorefront,
  mapAdminProductListItemToCard,
} from "@/lib/storefront/map-from-admin";
import type {
  StorefrontProductCard,
  StorefrontProductDetail,
} from "@/lib/storefront/types";

export {
  listPublicStorefrontCatalogue,
  getPublicStorefrontProductBySlug,
} from "@/lib/storefront/public.server";

/**
 * Admin private storefront preview catalogue (the shop).
 * Active products only — drafts stay in admin product management and can
 * still be opened via product Preview, but are not listed in the shop.
 */
export async function listStorefrontPreviewCatalogue(): Promise<
  StorefrontProductCard[]
> {
  const products = await listAdminProducts({ status: "active" });
  return products
    .filter((product) => product.status === "active")
    .map((product) => mapAdminProductListItemToCard(product));
}

/**
 * Admin private product detail for preview.
 * Drafts remain reachable from Admin → Products → Preview so they stay
 * integrated for editing/testing; they are just not listed in the shop.
 * Archived is excluded.
 */
export async function getStorefrontPreviewProduct(
  id: string,
): Promise<StorefrontProductDetail | null> {
  const product = await getAdminProductDetail(id);
  if (!product) return null;
  if (product.status !== "draft" && product.status !== "active") return null;
  return mapAdminProductDetailToStorefront(product);
}
