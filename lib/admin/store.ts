export const ADMIN_STORE_PATH = "/admin/store/";
export const ADMIN_STORE_PRODUCTS_PATH = "/admin/store/products/";
export const ADMIN_STORE_PRODUCTS_NEW_PATH = "/admin/store/products/new/";
export const ADMIN_STORE_FULFILMENT_PATH = "/admin/store/fulfilment/";
/** Admin-only catalogue storefront preview (not public /shop). */
export const ADMIN_STORE_PREVIEW_PATH = "/admin/store/preview/";
export const ADMIN_STORE_BAG_PATH = "/admin/store/preview/bag/";
export const ADMIN_STORE_CHECKOUT_PATH = "/admin/store/preview/checkout/";
export const ADMIN_STORE_ORDERS_PATH = "/admin/store/orders/";

/** Variant qty at or below this counts as low stock. Product cards use total qty. */
export const STORE_LOW_STOCK_THRESHOLD = 3;

export const PRODUCT_STATUSES = ["draft", "active", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const PRODUCT_TYPES = ["physical", "non_shipping"] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const INVENTORY_MOVEMENT_TYPES = [
  "initial_stock",
  "stock_received",
  "manual_adjustment",
  "damaged",
  "order",
  "refund",
  "cancellation",
] as const;
export type InventoryMovementType = (typeof INVENTORY_MOVEMENT_TYPES)[number];

export const ADMIN_ADJUSTABLE_MOVEMENT_TYPES = [
  "initial_stock",
  "stock_received",
  "manual_adjustment",
  "damaged",
] as const;
export type AdminAdjustableMovementType =
  (typeof ADMIN_ADJUSTABLE_MOVEMENT_TYPES)[number];

export type AdminProduct = {
  id: string;
  title: string;
  slug: string;
  description_html: string;
  product_type: ProductType;
  status: ProductStatus;
  seo_title: string | null;
  seo_description: string | null;
  shopify_handle: string | null;
  sort_order: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminProductVariant = {
  id: string;
  product_id: string;
  sku: string | null;
  option_name: string;
  option_value: string;
  price_pence: number;
  currency: string;
  track_inventory: boolean;
  stock_qty: number;
  stock_review_required: boolean;
  /** Shipping weight in grams; null = unverified / missing. */
  weight_grams: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export const PRODUCT_IMAGE_SOURCE_TYPES = ["storage", "external"] as const;
export type ProductImageSourceType = (typeof PRODUCT_IMAGE_SOURCE_TYPES)[number];

export type AdminProductImage = {
  id: string;
  product_id: string;
  source_type: ProductImageSourceType;
  storage_path: string | null;
  public_url: string;
  alt_text: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
};

export type AdminInventoryMovement = {
  id: string;
  variant_id: string;
  quantity_delta: number;
  resulting_quantity: number;
  movement_type: InventoryMovementType;
  note: string | null;
  created_by: string | null;
  created_at: string;
};

export type AdminProductListItem = AdminProduct & {
  variant_count: number;
  active_variant_count: number;
  primary_image_url: string | null;
  min_price_pence: number | null;
  max_price_pence: number | null;
  tracked_stock_total: number | null;
  has_out_of_stock: boolean;
  has_low_stock: boolean;
  has_stock_review_required: boolean;
};

export type AdminProductDetail = AdminProduct & {
  variants: AdminProductVariant[];
  images: AdminProductImage[];
  recent_movements: AdminInventoryMovement[];
  can_hard_delete: boolean;
};

export type AdminStoreOverview = {
  active_products: number;
  draft_products: number;
  archived_products: number;
  low_stock_variants: number;
  out_of_stock_variants: number;
};

export type AdminProductInput = {
  title: string;
  slug: string;
  description_html: string;
  product_type: ProductType;
  status: ProductStatus;
  seo_title: string | null;
  seo_description: string | null;
};

export type AdminVariantInput = {
  id?: string;
  sku: string | null;
  option_name: string;
  option_value: string;
  price_pence: number;
  track_inventory: boolean;
  is_active: boolean;
  sort_order: number;
  /**
   * Shipping weight in whole grams.
   * null = unverified / missing — never treat as zero for shipping quotes.
   */
  weight_grams: number | null;
  /** Applied once on create via inventory_movements (initial_stock). */
  initial_stock_qty?: number;
};

export function adminStoreProductEditPath(productId: string): string {
  return `/admin/store/products/${productId}/edit/`;
}

/** Admin-only future product page preview (not public /shop/[slug]). */
export function adminStoreOrderPath(orderId: string): string {
  return `${ADMIN_STORE_ORDERS_PATH}${orderId}/`;
}

export function adminStoreProductPreviewPath(productId: string): string {
  return `/admin/store/products/${productId}/preview/`;
}

export function isProductStatus(value: string): value is ProductStatus {
  return (PRODUCT_STATUSES as readonly string[]).includes(value);
}

export function isProductType(value: string): value is ProductType {
  return (PRODUCT_TYPES as readonly string[]).includes(value);
}

export function isAdminAdjustableMovementType(
  value: string
): value is AdminAdjustableMovementType {
  return (ADMIN_ADJUSTABLE_MOVEMENT_TYPES as readonly string[]).includes(value);
}

export function emptyToNull(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function slugifyProductTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function poundsStringToPence(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const pounds = Number(trimmed);
  if (!Number.isFinite(pounds) || pounds < 0) return null;
  return Math.round(pounds * 100);
}

export function penceToPoundsString(pence: number): string {
  return (pence / 100).toFixed(2);
}

export function formatGbpFromPence(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

export function productStatusLabel(status: ProductStatus): string {
  if (status === "draft") return "Draft";
  if (status === "active") return "Active";
  return "Archived";
}

export function productTypeLabel(type: ProductType): string {
  return type === "physical" ? "Physical (ships)" : "Non-shipping";
}

/** True for Shopify-style single-option placeholders that customers should not see. */
export function isDefaultVariantOption(
  optionName: string | null | undefined,
  optionValue: string | null | undefined,
): boolean {
  const name = (optionName ?? "").trim().toLowerCase();
  const value = (optionValue ?? "").trim().toLowerCase();
  const defaultName = !name || name === "title" || name === "default title";
  const defaultValue =
    !value ||
    value === "default title" ||
    value === "default" ||
    value === "title";
  return defaultName && defaultValue;
}

export function variantDisplayName(
  variant: {
    option_name: string | null;
    option_value: string | null;
    sku: string | null;
  },
  options?: { includeDefault?: boolean },
): string {
  if (isDefaultVariantOption(variant.option_name, variant.option_value)) {
    if (options?.includeDefault) {
      return variant.option_value?.trim() || "Default";
    }
    return "";
  }
  if (variant.option_name && variant.option_value) {
    return `${variant.option_name}: ${variant.option_value}`;
  }
  if (variant.option_value) return variant.option_value;
  if (variant.sku) return variant.sku;
  return options?.includeDefault ? "Default" : "";
}
