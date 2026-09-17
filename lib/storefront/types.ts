/**
 * Customer-facing storefront view models.
 * Shared by admin-only previews now and future public /shop routes later.
 */

export type StorefrontAvailability =
  | "available"
  | "low_stock"
  | "unavailable"
  | "pending_review"
  | "untracked";

export type StorefrontProductCard = {
  id: string;
  slug: string;
  title: string;
  productType: "physical" | "non_shipping";
  status: "draft" | "active" | "archived";
  imageUrl: string | null;
  imageAlt: string;
  minPricePence: number | null;
  maxPricePence: number | null;
  availability: StorefrontAvailability;
  href: string;
  /** Manual Recommended catalogue order (lower first). */
  sortOrder: number;
  /** ISO timestamp used by Newest sort. */
  createdAt: string;
};

export type StorefrontVariant = {
  id: string;
  optionName: string;
  optionValue: string;
  label: string;
  sku: string | null;
  pricePence: number;
  currency: string;
  trackInventory: boolean;
  stockQty: number;
  stockReviewRequired: boolean;
  /** Shipping weight in grams; null = unverified / missing. */
  weightGrams: number | null;
  isActive: boolean;
  availability: StorefrontAvailability;
};

export type StorefrontImage = {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  sortOrder: number;
};

export type StorefrontProductDetail = {
  id: string;
  slug: string;
  title: string;
  descriptionHtml: string;
  productType: "physical" | "non_shipping";
  status: "draft" | "active" | "archived";
  seoTitle: string | null;
  seoDescription: string | null;
  images: StorefrontImage[];
  variants: StorefrontVariant[];
  minPricePence: number | null;
  maxPricePence: number | null;
  optionName: string | null;
};
