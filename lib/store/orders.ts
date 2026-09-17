/** Store order domain types (Phase 3 — private preview + Mollie TEST). */

export const STORE_PAYMENT_STATUSES = [
  "pending_payment",
  "paid",
  "payment_failed",
  "cancelled",
  "refunded",
  "partially_refunded",
] as const;
export type StorePaymentStatus = (typeof STORE_PAYMENT_STATUSES)[number];

export const STORE_FULFILMENT_STATUSES = [
  "unfulfilled",
  "preparing",
  "ready_for_collection",
  "shipped",
  "collected",
  "cancelled",
] as const;
export type StoreFulfilmentStatus = (typeof STORE_FULFILMENT_STATUSES)[number];

export const STORE_FULFILMENT_METHODS = ["collection", "uk_shipping"] as const;
export type StoreFulfilmentMethod = (typeof STORE_FULFILMENT_METHODS)[number];

export type StoreShippingAddress = {
  name: string;
  line1: string;
  line2: string;
  city: string;
  county: string;
  postcode: string;
  country: string;
};

export type StoreOrderItemSnapshot = {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_title: string;
  variant_label: string;
  sku: string | null;
  product_type: "physical" | "non_shipping";
  product_status: "draft" | "active" | "archived";
  quantity: number;
  unit_price_pence: number;
  line_total_pence: number;
  weight_grams: number | null;
  track_inventory: boolean;
  sort_order: number;
  created_at: string;
};

export type StoreOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  fulfilment_method: StoreFulfilmentMethod | null;
  shipping_name: string | null;
  shipping_line1: string | null;
  shipping_line2: string | null;
  shipping_city: string | null;
  shipping_county: string | null;
  shipping_postcode: string | null;
  shipping_country: string | null;
  subtotal_pence: number;
  shipping_pence: number;
  total_pence: number;
  currency: string;
  payment_status: StorePaymentStatus;
  fulfilment_status: StoreFulfilmentStatus;
  mollie_payment_id: string | null;
  mollie_mode: "test" | "live" | null;
  shipping_band_id: string | null;
  shipping_weight_grams: number | null;
  terms_version: string;
  terms_accepted_at: string;
  stock_applied_at: string | null;
  payment_confirmed_at: string | null;
  customer_confirmation_sent_at: string | null;
  admin_notification_sent_at: string | null;
  customer_note: string | null;
  created_by: string | null;
  /** SHA-256 hex of guest access token; never authorize by id alone. */
  customer_access_token_hash?: string | null;
  created_at: string;
  updated_at: string;
};

export type StoreOrderDetail = StoreOrder & {
  items: StoreOrderItemSnapshot[];
};

export const STORE_TERMS_VERSION = "2026-09-14";

export function isStoreFulfilmentMethod(
  value: string,
): value is StoreFulfilmentMethod {
  return (STORE_FULFILMENT_METHODS as readonly string[]).includes(value);
}

export function paymentStatusLabel(status: StorePaymentStatus): string {
  switch (status) {
    case "pending_payment":
      return "Pending payment";
    case "paid":
      return "Paid";
    case "payment_failed":
      return "Payment failed";
    case "cancelled":
      return "Cancelled";
    case "refunded":
      return "Refunded";
    case "partially_refunded":
      return "Partially refunded";
    default:
      return status;
  }
}

export function fulfilmentStatusLabel(status: StoreFulfilmentStatus): string {
  switch (status) {
    case "unfulfilled":
      return "Unfulfilled";
    case "preparing":
      return "Preparing";
    case "ready_for_collection":
      return "Ready for collection";
    case "shipped":
      return "Shipped";
    case "collected":
      return "Collected";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

export function fulfilmentMethodLabel(
  method: StoreFulfilmentMethod | null,
): string {
  if (method === "collection") return "Collection";
  if (method === "uk_shipping") return "UK delivery";
  return "Not required";
}
