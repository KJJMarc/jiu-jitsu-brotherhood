import type {
  StorefrontAvailability,
  StorefrontProductDetail,
  StorefrontVariant,
} from "@/lib/storefront/types";
import { STORE_LOW_STOCK_THRESHOLD } from "@/lib/admin/store";

export function resolveVariantAvailability(variant: {
  is_active: boolean;
  track_inventory: boolean;
  stock_qty: number;
  stock_review_required: boolean;
}): StorefrontAvailability {
  if (!variant.is_active) return "unavailable";
  if (!variant.track_inventory) return "untracked";
  if (variant.stock_review_required) return "pending_review";
  if (variant.stock_qty <= 0) return "unavailable";
  if (variant.stock_qty <= STORE_LOW_STOCK_THRESHOLD) return "low_stock";
  return "available";
}

export function resolveProductCardAvailability(input: {
  status: "draft" | "active" | "archived";
  active_variant_count: number;
  tracked_stock_total: number | null;
  has_stock_review_required: boolean;
}): StorefrontAvailability {
  // Archived is never sellable. Drafts are excluded from public catalogue
  // queries but remain purchasable in admin/private preview (Phase 3).
  if (input.status === "archived" || input.active_variant_count === 0) {
    return "unavailable";
  }
  if (input.has_stock_review_required) return "pending_review";
  if (input.tracked_stock_total === null) return "untracked";
  // Product-level: out of stock only when every tracked size is zero.
  if (input.tracked_stock_total <= 0) return "unavailable";
  // Low stock only when overall remaining stock is scarce (not one thin size).
  if (input.tracked_stock_total <= STORE_LOW_STOCK_THRESHOLD) return "low_stock";
  return "available";
}

export function storefrontAvailabilityLabel(
  availability: StorefrontAvailability,
): string {
  switch (availability) {
    case "available":
      return "In stock";
    case "low_stock":
      return "Low stock";
    case "pending_review":
      // Inventory not yet verified — must not read as sellable "Available".
      return "Needs review";
    case "untracked":
      return "Available";
    case "unavailable":
      return "Out of stock";
    default:
      return "Unavailable";
  }
}

/** True when a variant could be sold once cart/checkout exists. */
export function variantIsPurchasable(
  availability: StorefrontAvailability,
): boolean {
  return (
    availability === "available" ||
    availability === "low_stock" ||
    availability === "untracked"
  );
}

export function defaultSelectedVariantId(
  product: StorefrontProductDetail,
): string | null {
  const purchasable = product.variants.find((variant) =>
    variantIsPurchasable(variant.availability),
  );
  if (purchasable) return purchasable.id;
  return product.variants[0]?.id ?? null;
}

export function variantOptionLabel(variant: StorefrontVariant): string {
  return variant.label || variant.optionValue || "Default";
}
