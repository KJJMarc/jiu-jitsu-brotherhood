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
 * Includes drafts so unpublished KEEP imports can be inspected before publish.
 * Archived stays excluded.
 */
export async function listStorefrontPreviewCatalogue(): Promise<
  StorefrontProductCard[]
> {
  const [active, drafts] = await Promise.all([
    listAdminProducts({ status: "active" }),
    listAdminProducts({ status: "draft" }),
  ]);
  return [...active, ...drafts]
    .filter(
      (product) => product.status === "active" || product.status === "draft",
    )
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
