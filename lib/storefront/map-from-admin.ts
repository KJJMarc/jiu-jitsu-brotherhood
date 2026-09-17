import type { AdminProductDetail, AdminProductListItem } from "@/lib/admin/store";
import { adminStoreProductPreviewPath, variantDisplayName } from "@/lib/admin/store";
import {
  resolveProductCardAvailability,
  resolveVariantAvailability,
} from "@/lib/storefront/availability";
import { sanitizeStorefrontDescriptionHtml } from "@/lib/storefront/labels";
import type {
  StorefrontProductCard,
  StorefrontProductDetail,
  StorefrontVariant,
} from "@/lib/storefront/types";

export function mapAdminProductListItemToCard(
  product: AdminProductListItem,
  options?: { href?: string },
): StorefrontProductCard {
  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    productType: product.product_type,
    status: product.status,
    imageUrl: product.primary_image_url,
    imageAlt: product.title,
    minPricePence: product.min_price_pence,
    maxPricePence: product.max_price_pence,
    sortOrder: product.sort_order,
    createdAt: product.created_at,
    availability: resolveProductCardAvailability({
      status: product.status,
      active_variant_count: product.active_variant_count,
      tracked_stock_total: product.tracked_stock_total,
      has_stock_review_required: product.has_stock_review_required,
    }),
    href: options?.href ?? adminStoreProductPreviewPath(product.id),
  };
}

function mapVariant(variant: AdminProductDetail["variants"][number]): StorefrontVariant {
  return {
    id: variant.id,
    optionName: variant.option_name,
    optionValue: variant.option_value,
    label: variantDisplayName(variant),
    sku: variant.sku,
    pricePence: variant.price_pence,
    currency: variant.currency,
    trackInventory: variant.track_inventory,
    stockQty: variant.stock_qty,
    stockReviewRequired: variant.stock_review_required,
    weightGrams: variant.weight_grams,
    isActive: variant.is_active,
    availability: resolveVariantAvailability({
      is_active: variant.is_active,
      track_inventory: variant.track_inventory,
      stock_qty: variant.stock_qty,
      stock_review_required: variant.stock_review_required,
    }),
  };
}

export function mapAdminProductDetailToStorefront(
  product: AdminProductDetail,
): StorefrontProductDetail {
  const variants = product.variants
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(mapVariant);

  const activePrices = variants
    .filter((variant) => variant.isActive)
    .map((variant) => variant.pricePence);
  const prices = activePrices.length
    ? activePrices
    : variants.map((variant) => variant.pricePence);

  const minPricePence = prices.length ? Math.min(...prices) : null;
  const maxPricePence = prices.length ? Math.max(...prices) : null;

  const optionName =
    variants.find((variant) => variant.optionName)?.optionName ?? null;

  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    descriptionHtml: sanitizeStorefrontDescriptionHtml(
      product.description_html ?? "",
    ),
    productType: product.product_type,
    status: product.status,
    seoTitle: product.seo_title,
    seoDescription: product.seo_description,
    images: product.images
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((image) => ({
        id: image.id,
        url: image.public_url,
        alt: image.alt_text || product.title,
        isPrimary: image.is_primary,
        sortOrder: image.sort_order,
      })),
    variants,
    minPricePence,
    maxPricePence,
    optionName,
  };
}
