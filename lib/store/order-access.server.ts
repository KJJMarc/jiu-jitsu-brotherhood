import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  StoreFulfilmentMethod,
  StoreFulfilmentStatus,
  StoreOrderItemSnapshot,
  StorePaymentStatus,
} from "@/lib/store/orders";
import {
  generateCustomerAccessToken,
  hashCustomerAccessToken,
  publicCustomerOrderPath,
  verifyCustomerAccessToken,
} from "@/lib/store/order-access";

export {
  generateCustomerAccessToken,
  hashCustomerAccessToken,
  verifyCustomerAccessToken,
} from "@/lib/store/order-access";

/** Public-facing order confirmation DTO — no internal Mollie secrets beyond mode. */
export type PublicCustomerOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  fulfilmentMethod: StoreFulfilmentMethod | null;
  shippingName: string | null;
  shippingLine1: string | null;
  shippingLine2: string | null;
  shippingCity: string | null;
  shippingCounty: string | null;
  shippingPostcode: string | null;
  shippingCountry: string | null;
  subtotalPence: number;
  shippingPence: number;
  totalPence: number;
  currency: string;
  paymentStatus: StorePaymentStatus;
  fulfilmentStatus: StoreFulfilmentStatus;
  mollieMode: "test" | "live" | null;
  customerNote: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    productTitle: string;
    variantLabel: string;
    productType: "physical" | "non_shipping";
    productStatus: "draft" | "active" | "archived";
    quantity: number;
    unitPricePence: number;
    lineTotalPence: number;
  }>;
};

function mapOrderRow(
  order: Record<string, unknown>,
  items: StoreOrderItemSnapshot[],
): PublicCustomerOrder {
  return {
    id: String(order.id),
    orderNumber: String(order.order_number),
    customerName: String(order.customer_name),
    customerEmail: String(order.customer_email),
    customerPhone: (order.customer_phone as string | null) ?? null,
    fulfilmentMethod:
      (order.fulfilment_method as StoreFulfilmentMethod | null) ?? null,
    shippingName: (order.shipping_name as string | null) ?? null,
    shippingLine1: (order.shipping_line1 as string | null) ?? null,
    shippingLine2: (order.shipping_line2 as string | null) ?? null,
    shippingCity: (order.shipping_city as string | null) ?? null,
    shippingCounty: (order.shipping_county as string | null) ?? null,
    shippingPostcode: (order.shipping_postcode as string | null) ?? null,
    shippingCountry: (order.shipping_country as string | null) ?? null,
    subtotalPence: Number(order.subtotal_pence),
    shippingPence: Number(order.shipping_pence),
    totalPence: Number(order.total_pence),
    currency: String(order.currency ?? "GBP"),
    paymentStatus: order.payment_status as StorePaymentStatus,
    fulfilmentStatus: order.fulfilment_status as StoreFulfilmentStatus,
    mollieMode: (order.mollie_mode as "test" | "live" | null) ?? null,
    customerNote: (order.customer_note as string | null) ?? null,
    createdAt: String(order.created_at),
    items: items.map((item) => ({
      id: item.id,
      productTitle: item.product_title,
      variantLabel: item.variant_label,
      productType: item.product_type,
      productStatus: item.product_status,
      quantity: item.quantity,
      unitPricePence: item.unit_price_pence,
      lineTotalPence: item.line_total_pence,
    })),
  };
}

/**
 * Load a public customer order by id + raw access token.
 * Hash compare is server-side only; never authorize by id alone.
 */
export async function getPublicCustomerOrderByToken(input: {
  orderId: string;
  accessToken: string;
}): Promise<PublicCustomerOrder | null> {
  const orderId = input.orderId.trim();
  const accessToken = input.accessToken.trim();
  if (!orderId || !accessToken) return null;

  const admin = getSupabaseAdminClient();
  const { data: order, error } = await admin
    .from("store_orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!order) return null;

  if (
    !verifyCustomerAccessToken(
      accessToken,
      order.customer_access_token_hash as string | null,
    )
  ) {
    return null;
  }

  const { data: items, error: itemsError } = await admin
    .from("store_order_items")
    .select("*")
    .eq("order_id", orderId)
    .order("sort_order", { ascending: true });
  if (itemsError) throw new Error(itemsError.message);

  return mapOrderRow(
    order as Record<string, unknown>,
    (items ?? []) as StoreOrderItemSnapshot[],
  );
}

export function publicCustomerOrderUrl(input: {
  origin: string;
  orderId: string;
  accessToken: string;
}): string {
  const origin = input.origin.replace(/\/$/, "");
  return `${origin}${publicCustomerOrderPath(input.orderId, input.accessToken)}`;
}
