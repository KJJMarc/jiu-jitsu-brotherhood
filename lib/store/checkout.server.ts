import "server-only";

import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { requireAdmin } from "@/lib/admin/auth.server";
import {
  getAdminFulfilmentSettings,
  getAdminShippingBands,
} from "@/lib/admin/fulfilment.server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  clearPreviewCart,
  clearPublicCart,
  resolvePreviewCart,
  resolvePublicCart,
} from "@/lib/store/cart.server";
import {
  PUBLIC_GUEST_ID_COOKIE,
  type ResolvedCart,
  type StoreCartChannel,
} from "@/lib/store/cart";
import {
  STORE_TERMS_VERSION,
  isStoreFulfilmentMethod,
  type StoreFulfilmentMethod,
  type StoreOrderDetail,
  type StoreShippingAddress,
} from "@/lib/store/orders";
import {
  quoteCollection,
  quoteUkShipping,
  type ShippingQuote,
  type ShipmentLine,
} from "@/lib/store/shipping";
import {
  createMolliePayment,
  getMolliePayment,
  mapMollieStatusToPaymentStatus,
  mollieApiKeyConfigured,
  mollieCheckoutUrl,
} from "@/lib/store/mollie.server";
import { sendPaidOrderEmailsIfNeeded } from "@/lib/store/order-emails.server";
import { storeCustomerError } from "@/lib/store/customer-errors";
import { assertPublicCheckoutEnabled } from "@/lib/store/shop-gates.server";
import { site } from "@/lib/site";
import {
  cartFingerprint,
  checkoutIntentIdempotencyKey,
  shouldRetryPaidStockApplication,
} from "@/lib/store/checkout-idempotency";
import {
  getStoreFulfilmentSettingsReadonly,
  getStoreShippingBandsReadonly,
} from "@/lib/store/fulfilment-readonly.server";
import {
  generateCustomerAccessToken,
  hashCustomerAccessToken,
} from "@/lib/store/order-access";

export type CheckoutCustomerInput = {
  name: string;
  email: string;
  phone?: string;
  note?: string;
  fulfilmentMethod?: string;
  address?: Partial<StoreShippingAddress>;
  termsAccepted: boolean;
};

export type CheckoutQuote = {
  cart: ResolvedCart;
  fulfilmentMethod: StoreFulfilmentMethod | null;
  shippingQuote: ShippingQuote | null;
  shippingPence: number;
  totalPence: number;
  collectionLabel: string;
  ukShippingEnabled: boolean;
  collectionEnabled: boolean;
};

export type CheckoutOrderResult = {
  orderId: string;
  orderNumber: string;
  checkoutUrl: string;
  accessToken: string;
};

const GUEST_ID_MAX_AGE_SECONDS = 60 * 60 * 24 * 400;

function physicalShipmentLines(cart: ResolvedCart): ShipmentLine[] {
  return cart.lines
    .filter((line) => line.productType === "physical")
    .map((line) => ({
      weightGrams: line.weightGrams,
      quantity: line.quantity,
      isPhysical: true as const,
    }));
}

function compactPostcode(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

function isLikelyUkPostcode(value: string): boolean {
  return /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/i.test(compactPostcode(value));
}

function formatUkPostcode(value: string): string {
  const compact = compactPostcode(value);
  return compact.replace(/^(.+?)(\d[A-Z]{2})$/, "$1 $2");
}

function siteOrigin(): string {
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (explicit) {
    return explicit.startsWith("http")
      ? explicit.replace(/\/$/, "")
      : `https://${explicit.replace(/\/$/, "")}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}

function isValidUkPhone(value: string): boolean {
  const digits = value.replace(/[\s()-]/g, "");
  if (/^\+?44\d{9,11}$/.test(digits)) return true;
  if (/^0\d{9,10}$/.test(digits)) return true;
  return false;
}

async function resolveCartForChannel(
  channel: StoreCartChannel,
): Promise<ResolvedCart> {
  return channel === "public"
    ? resolvePublicCart()
    : resolvePreviewCart();
}

async function loadFulfilmentForChannel(channel: StoreCartChannel) {
  if (channel === "public") {
    const [settings, bands] = await Promise.all([
      getStoreFulfilmentSettingsReadonly(),
      getStoreShippingBandsReadonly(),
    ]);
    return { settings, bands };
  }
  const [settings, bands] = await Promise.all([
    getAdminFulfilmentSettings(),
    getAdminShippingBands(),
  ]);
  return { settings, bands };
}

async function getOrCreatePublicGuestId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(PUBLIC_GUEST_ID_COOKIE)?.value?.trim();
  if (existing && existing.length >= 16 && existing.length <= 128) {
    return existing;
  }
  const guestId = randomBytes(24).toString("base64url");
  jar.set(PUBLIC_GUEST_ID_COOKIE, guestId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/shop",
    maxAge: GUEST_ID_MAX_AGE_SECONDS,
  });
  return guestId;
}

async function quoteCheckout(
  channel: StoreCartChannel,
  input: { fulfilmentMethod?: string | null },
): Promise<CheckoutQuote> {
  if (channel === "preview") await requireAdmin();
  const cart = await resolveCartForChannel(channel);
  const { settings, bands } = await loadFulfilmentForChannel(channel);

  if (cart.lines.length === 0) {
    throw new Error("Your bag is empty.");
  }

  let fulfilmentMethod: StoreFulfilmentMethod | null = null;
  let shippingQuote: ShippingQuote | null = null;
  let shippingPence = 0;

  if (cart.hasPhysical) {
    if (
      input.fulfilmentMethod &&
      isStoreFulfilmentMethod(input.fulfilmentMethod)
    ) {
      fulfilmentMethod = input.fulfilmentMethod;
      shippingQuote =
        fulfilmentMethod === "collection"
          ? quoteCollection(settings)
          : quoteUkShipping(physicalShipmentLines(cart), settings, bands, {
              destinationCountryCode: "GB",
            });
      if (!shippingQuote.ok) {
        throw new Error(shippingQuote.message);
      }
      shippingPence = shippingQuote.chargePence;
    }
  }

  return {
    cart,
    fulfilmentMethod,
    shippingQuote,
    shippingPence,
    totalPence: cart.subtotalPence + shippingPence,
    collectionLabel: settings.collectionLabel,
    ukShippingEnabled: settings.ukShippingEnabled,
    collectionEnabled: settings.collectionEnabled,
  };
}

async function createCheckoutOrder(
  channel: StoreCartChannel,
  input: CheckoutCustomerInput,
): Promise<CheckoutOrderResult> {
  // Hard block until JJB_CHECKOUT_ENABLED=true (covers public + admin preview).
  assertPublicCheckoutEnabled();

  let createdBy: string | null = null;
  let subjectId: string;

  if (channel === "preview") {
    const session = await requireAdmin();
    createdBy = session.userId;
    subjectId = session.userId;
  } else {
    subjectId = await getOrCreatePublicGuestId();
  }

  if (!mollieApiKeyConfigured()) {
    throw new Error(
      "Mollie API key is not configured (MOLLIE_API_KEY). Use a test_… key, or a live_… key with MOLLIE_ALLOW_LIVE=true in Production.",
    );
  }
  if (!input.termsAccepted) {
    throw new Error("You must agree to the Terms & Conditions.");
  }

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (name.length < 2) throw new Error("Please enter your name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Please enter a valid email address.");
  }

  const cart = await resolveCartForChannel(channel);
  if (cart.lines.length === 0) throw new Error("Your bag is empty.");

  const fingerprint = cartFingerprint(
    cart.lines.map((line) => ({
      variantId: line.variantId,
      quantity: line.quantity,
    })),
  );
  const intentKey = checkoutIntentIdempotencyKey(subjectId, fingerprint);
  const adminClient = getSupabaseAdminClient();
  const { error: intentError } = await adminClient.from("store_payment_events").insert({
    order_id: null,
    mollie_payment_id: null,
    source: "create",
    mollie_status: "checkout_intent",
    idempotency_key: intentKey,
    payload: { fingerprint, phase: "intent", channel },
    processed_ok: false,
  });

  if (intentError) {
    if (intentError.code === "23505") {
      const { data: existingIntent } = await adminClient
        .from("store_payment_events")
        .select("order_id, mollie_payment_id")
        .eq("idempotency_key", intentKey)
        .maybeSingle();

      if (existingIntent?.order_id) {
        const { data: existingOrder } = await adminClient
          .from("store_orders")
          .select("*")
          .eq("id", existingIntent.order_id)
          .maybeSingle();

        if (
          existingOrder &&
          existingOrder.payment_status === "pending_payment" &&
          existingOrder.mollie_payment_id
        ) {
          try {
            const existingPayment = await getMolliePayment(
              existingOrder.mollie_payment_id as string,
            );
            const existingUrl = mollieCheckoutUrl(existingPayment);
            if (
              existingUrl &&
              (existingPayment.status === "open" ||
                existingPayment.status === "pending")
            ) {
              const metaToken =
                typeof existingPayment.metadata?.access_token === "string"
                  ? existingPayment.metadata.access_token
                  : "";
              return {
                orderId: existingOrder.id as string,
                orderNumber: existingOrder.order_number as string,
                checkoutUrl: existingUrl,
                accessToken: metaToken,
              };
            }
          } catch (reuseError) {
            console.error("[store] checkout reuse failed", reuseError);
          }
        }

        await adminClient
          .from("store_payment_events")
          .delete()
          .eq("idempotency_key", intentKey);
        const { error: reclaimError } = await adminClient
          .from("store_payment_events")
          .insert({
            order_id: null,
            mollie_payment_id: null,
            source: "create",
            mollie_status: "checkout_intent",
            idempotency_key: intentKey,
            payload: { fingerprint, phase: "intent_retry", channel },
            processed_ok: false,
          });
        if (reclaimError) {
          throw storeCustomerError(
            "Checkout is already in progress. Please wait a moment and try again.",
          );
        }
      } else {
        throw storeCustomerError(
          "Checkout is already in progress. Please wait a moment and try again.",
        );
      }
    } else {
      console.error("[store] checkout intent claim failed", intentError);
      throw storeCustomerError("Checkout could not start. Please try again.");
    }
  }

  const { settings, bands } = await loadFulfilmentForChannel(channel);

  let fulfilmentMethod: StoreFulfilmentMethod | null = null;
  let shippingPence = 0;
  let shippingBandId: string | null = null;
  let shippingWeightGrams: number | null = null;
  let address: StoreShippingAddress | null = null;

  if (cart.hasPhysical) {
    if (
      !input.fulfilmentMethod ||
      !isStoreFulfilmentMethod(input.fulfilmentMethod)
    ) {
      throw new Error(
        settings.collectionEnabled
          ? "Choose collection or UK delivery."
          : "Choose UK delivery.",
      );
    }
    fulfilmentMethod = input.fulfilmentMethod;

    if (channel === "public" && fulfilmentMethod === "collection") {
      throw new Error("Collection is not available.");
    }

    if (fulfilmentMethod === "collection") {
      const quote = quoteCollection(settings);
      if (!quote.ok) throw new Error(quote.message);
      shippingPence = 0;
    } else {
      const line1 = input.address?.line1?.trim() ?? "";
      const city = input.address?.city?.trim() ?? "";
      const postcode = input.address?.postcode?.trim() ?? "";
      const country = (input.address?.country?.trim() || "GB").toUpperCase();
      if (country !== "GB" && country !== "UK") {
        throw new Error("Only UK delivery is supported.");
      }
      if (!line1 || !city || !postcode) {
        throw new Error("Please enter a full UK delivery address.");
      }
      if (!isLikelyUkPostcode(postcode)) {
        throw new Error("Please enter a valid UK postcode.");
      }
      if (!isValidUkPhone(input.phone?.trim() || "")) {
        throw storeCustomerError(
          "Telephone is required for UK delivery. Please enter a UK phone number.",
        );
      }
      address = {
        name: input.address?.name?.trim() || name,
        line1,
        line2: input.address?.line2?.trim() ?? "",
        city,
        county: input.address?.county?.trim() ?? "",
        postcode: formatUkPostcode(postcode),
        country: "GB",
      };
      const quote = quoteUkShipping(
        physicalShipmentLines(cart),
        settings,
        bands,
        { destinationCountryCode: "GB" },
      );
      if (!quote.ok) throw new Error(quote.message);
      shippingPence = quote.chargePence;
      shippingBandId = quote.bandId;
      shippingWeightGrams = quote.totalWeightGrams;
    }
  }

  const subtotalPence = cart.subtotalPence;
  const totalPence = subtotalPence + shippingPence;
  if (totalPence <= 0) {
    throw new Error("Order total must be greater than zero.");
  }

  for (const line of cart.lines) {
    if (!line.trackInventory) continue;
    if (line.stockQty < line.quantity) {
      throw new Error(
        `Not enough stock for ${line.productTitle} (${line.variantLabel}).`,
      );
    }
  }

  // Public has no admin session — use service role for order writes.
  // Preview keeps authenticated admin client for RLS-aligned inserts.
  const writeClient =
    channel === "public" ? adminClient : await createSupabaseServerClient();

  const { data: orderNumber, error: numberError } = await writeClient.rpc(
    "next_store_order_number",
  );
  if (numberError || typeof orderNumber !== "string") {
    throw new Error(numberError?.message ?? "Could not allocate order number.");
  }

  const accessToken = generateCustomerAccessToken();
  const accessTokenHash = hashCustomerAccessToken(accessToken);
  const termsAcceptedAt = new Date().toISOString();
  const { data: order, error: orderError } = await writeClient
    .from("store_orders")
    .insert({
      order_number: orderNumber,
      customer_name: name,
      customer_email: email,
      customer_phone: input.phone?.trim() || null,
      fulfilment_method: fulfilmentMethod,
      shipping_name: address?.name ?? null,
      shipping_line1: address?.line1 ?? null,
      shipping_line2: address?.line2 || null,
      shipping_city: address?.city ?? null,
      shipping_county: address?.county || null,
      shipping_postcode: address?.postcode ?? null,
      shipping_country: address?.country ?? null,
      subtotal_pence: subtotalPence,
      shipping_pence: shippingPence,
      total_pence: totalPence,
      currency: "GBP",
      payment_status: "pending_payment",
      fulfilment_status: "unfulfilled",
      shipping_band_id: shippingBandId,
      shipping_weight_grams: shippingWeightGrams,
      terms_version: STORE_TERMS_VERSION,
      terms_accepted_at: termsAcceptedAt,
      customer_note: input.note?.trim() || null,
      created_by: createdBy,
      customer_access_token_hash: accessTokenHash,
    })
    .select("*")
    .single();

  if (orderError || !order) {
    throw new Error(orderError?.message ?? "Could not create order.");
  }

  await adminClient
    .from("store_payment_events")
    .update({
      order_id: order.id,
      payload: { fingerprint, phase: "order_created", channel },
    })
    .eq("idempotency_key", intentKey);

  const itemRows = cart.lines.map((line, index) => ({
    order_id: order.id,
    product_id: line.productId,
    variant_id: line.variantId,
    product_title: line.productTitle,
    variant_label: line.variantLabel,
    sku: line.sku,
    product_type: line.productType,
    product_status: line.productStatus,
    quantity: line.quantity,
    unit_price_pence: line.unitPricePence,
    line_total_pence: line.lineTotalPence,
    weight_grams: line.weightGrams,
    track_inventory: line.trackInventory,
    sort_order: index,
  }));

  const { error: itemsError } = await writeClient
    .from("store_order_items")
    .insert(itemRows);
  if (itemsError) {
    await writeClient.from("store_orders").delete().eq("id", order.id);
    throw new Error(itemsError.message);
  }

  const origin = siteOrigin();
  const redirectUrl =
    channel === "public"
      ? `${origin}/shop/checkout/return?order=${encodeURIComponent(order.id)}&t=${encodeURIComponent(accessToken)}`
      : `${origin}/admin/store/preview/checkout/return/?order=${encodeURIComponent(order.id)}`;
  const webhookUrl = `${origin}/api/store/mollie/webhook/`;

  let payment;
  try {
    payment = await createMolliePayment({
      amountPence: totalPence,
      description: `${site.name} order ${orderNumber}`,
      redirectUrl,
      webhookUrl,
      metadata: {
        order_id: order.id,
        order_number: orderNumber,
        access_token: accessToken,
        channel,
      },
      idempotencyKey: `order-${order.id}`,
    });
  } catch (err) {
    await writeClient
      .from("store_orders")
      .update({ payment_status: "payment_failed" })
      .eq("id", order.id);
    throw err;
  }

  const checkoutUrl = mollieCheckoutUrl(payment);
  if (!checkoutUrl) {
    throw new Error("Mollie did not return a checkout URL.");
  }

  const { error: updatePayError } = await writeClient
    .from("store_orders")
    .update({
      mollie_payment_id: payment.id,
      mollie_mode: payment.mode,
    })
    .eq("id", order.id);
  if (updatePayError) throw new Error(updatePayError.message);

  try {
    await adminClient.from("store_payment_events").insert({
      order_id: order.id,
      mollie_payment_id: payment.id,
      source: "create",
      mollie_status: payment.status,
      idempotency_key: `create:${payment.id}`,
      payload: payment,
      processed_ok: true,
    });
  } catch {
    // Non-fatal
  }

  if (channel === "public") {
    await clearPublicCart();
  } else {
    await clearPreviewCart();
  }

  return {
    orderId: order.id as string,
    orderNumber,
    checkoutUrl,
    accessToken,
  };
}

export async function quotePreviewCheckout(input: {
  fulfilmentMethod?: string | null;
}): Promise<CheckoutQuote> {
  return quoteCheckout("preview", input);
}

export async function quotePublicCheckout(input: {
  fulfilmentMethod?: string | null;
}): Promise<CheckoutQuote> {
  return quoteCheckout("public", input);
}

export async function createPreviewCheckoutOrder(
  input: CheckoutCustomerInput,
): Promise<{ orderId: string; orderNumber: string; checkoutUrl: string }> {
  const result = await createCheckoutOrder("preview", input);
  return {
    orderId: result.orderId,
    orderNumber: result.orderNumber,
    checkoutUrl: result.checkoutUrl,
  };
}

export async function createPublicCheckoutOrder(
  input: CheckoutCustomerInput,
): Promise<CheckoutOrderResult> {
  return createCheckoutOrder("public", input);
}

export async function getStoreOrderDetail(
  orderId: string,
): Promise<StoreOrderDetail | null> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data: order, error } = await supabase
    .from("store_orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!order) return null;

  const { data: items, error: itemsError } = await supabase
    .from("store_order_items")
    .select("*")
    .eq("order_id", orderId)
    .order("sort_order", { ascending: true });
  if (itemsError) throw new Error(itemsError.message);

  return {
    ...(order as StoreOrderDetail),
    items: (items ?? []) as StoreOrderDetail["items"],
  };
}

export async function getStoreOrderDetailByNumber(
  orderNumber: string,
): Promise<StoreOrderDetail | null> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data: order, error } = await supabase
    .from("store_orders")
    .select("*")
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!order) return null;
  return getStoreOrderDetail(order.id as string);
}

export async function listStoreOrders(options?: {
  paymentStatus?: string;
  query?: string;
  limit?: number;
}): Promise<StoreOrderDetail[]> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  let q = supabase
    .from("store_orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? 100);

  if (options?.paymentStatus && options.paymentStatus !== "all") {
    q = q.eq("payment_status", options.paymentStatus);
  }
  if (options?.query?.trim()) {
    const term = options.query.trim().replace(/,/g, "");
    q = q.or(
      `order_number.ilike.%${term}%,customer_email.ilike.%${term}%,customer_name.ilike.%${term}%`,
    );
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    ...(row as StoreOrderDetail),
    items: [],
  }));
}

export async function listOrderInventoryMovements(orderId: string) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("inventory_movements")
    .select(
      "id, variant_id, quantity_delta, resulting_quantity, movement_type, note, created_at, order_item_id",
    )
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Sync Mollie payment status into the order and apply stock when paid.
 * Idempotent via payment event keys + stock_applied_at.
 */
export async function syncStoreOrderPayment(input: {
  orderId?: string;
  molliePaymentId?: string;
  source: "return_sync" | "webhook" | "admin_sync";
}): Promise<{ paymentStatus: string; orderId: string }> {
  const admin = getSupabaseAdminClient();

  let orderId = input.orderId ?? null;
  let molliePaymentId = input.molliePaymentId ?? null;

  if (!orderId && molliePaymentId) {
    const { data } = await admin
      .from("store_orders")
      .select("id")
      .eq("mollie_payment_id", molliePaymentId)
      .maybeSingle();
    orderId = data?.id ?? null;
  }
  if (!orderId) throw new Error("Order not found for payment sync.");

  const { data: order, error: orderError } = await admin
    .from("store_orders")
    .select("*")
    .eq("id", orderId)
    .single();
  if (orderError || !order) {
    throw new Error(orderError?.message ?? "Order not found.");
  }

  molliePaymentId = molliePaymentId || order.mollie_payment_id;
  if (!molliePaymentId) {
    throw new Error("Order has no Mollie payment id yet.");
  }

  const payment = await getMolliePayment(molliePaymentId);
  const mapped = mapMollieStatusToPaymentStatus(payment.status);
  const idempotencyKey = `${input.source}:${payment.id}:${payment.status}`;

  const { error: eventError } = await admin.from("store_payment_events").insert({
    order_id: order.id,
    mollie_payment_id: payment.id,
    source: input.source,
    mollie_status: payment.status,
    idempotency_key: idempotencyKey,
    payload: payment,
    processed_ok: false,
  });

  if (eventError) {
    if (eventError.code === "23505") {
      // Duplicate sync for this source/status. If paid but stock not applied,
      // retry stock (RPC is idempotent via stock_applied_at).
      const { data: fresh, error: freshError } = await admin
        .from("store_orders")
        .select("*")
        .eq("id", order.id)
        .single();
      if (freshError) throw new Error(freshError.message);
      const current = fresh ?? order;

      if (mapped === "paid") {
        if (current.payment_status !== "paid") {
          const { error: paidUpdateError } = await admin
            .from("store_orders")
            .update({
              payment_status: "paid",
              payment_confirmed_at:
                current.payment_confirmed_at ?? new Date().toISOString(),
              fulfilment_status:
                current.fulfilment_status === "unfulfilled"
                  ? "preparing"
                  : current.fulfilment_status,
              mollie_payment_id: payment.id,
              mollie_mode: payment.mode,
            })
            .eq("id", order.id);
          if (paidUpdateError) throw new Error(paidUpdateError.message);
          current.payment_status = "paid";
        }

        if (
          shouldRetryPaidStockApplication({
            payment_status: String(current.payment_status),
            stock_applied_at: current.stock_applied_at ?? null,
          })
        ) {
          const { error: stockError } = await admin.rpc(
            "apply_store_order_stock",
            { p_order_id: order.id },
          );
          if (stockError) {
            console.error("[store] paid stock retry failed", stockError);
            throw storeCustomerError(
              `This order is paid but stock could not be updated yet. Please try syncing again or contact ${site.name}.`,
            );
          }
        }

        await sendPaidOrderEmailsIfNeeded(order.id);
        return { paymentStatus: "paid", orderId: order.id };
      }

      await sendPaidOrderEmailsIfNeeded(order.id);
      return {
        paymentStatus: String(current.payment_status),
        orderId: order.id,
      };
    }
    throw new Error(eventError.message);
  }

  const updates: Record<string, unknown> = {
    mollie_payment_id: payment.id,
    mollie_mode: payment.mode,
  };

  if (mapped === "paid") {
    updates.payment_status = "paid";
    updates.payment_confirmed_at =
      order.payment_confirmed_at ?? new Date().toISOString();
    if (order.fulfilment_status === "unfulfilled") {
      updates.fulfilment_status = "preparing";
    }
  } else if (mapped === "payment_failed") {
    if (order.payment_status !== "paid") {
      updates.payment_status = "payment_failed";
    }
  } else if (mapped === "cancelled") {
    if (order.payment_status !== "paid") {
      updates.payment_status = "cancelled";
      updates.fulfilment_status = "cancelled";
    }
  }

  const { error: updateError } = await admin
    .from("store_orders")
    .update(updates)
    .eq("id", order.id);
  if (updateError) throw new Error(updateError.message);

  if (mapped === "paid") {
    const { error: stockError } = await admin.rpc("apply_store_order_stock", {
      p_order_id: order.id,
    });
    if (stockError) {
      console.error("[store] apply_store_order_stock failed", stockError);
      await admin
        .from("store_payment_events")
        .update({
          processed_ok: false,
          error_message: stockError.message,
        })
        .eq("idempotency_key", idempotencyKey);
      throw storeCustomerError(
        `This order is paid but stock could not be updated yet. Please try again or contact ${site.name}.`,
      );
    }
  }

  await admin
    .from("store_payment_events")
    .update({ processed_ok: true, error_message: null })
    .eq("idempotency_key", idempotencyKey);

  if (mapped === "paid") {
    // Email failures must not undo payment / stock. Claims are concurrency-safe.
    await sendPaidOrderEmailsIfNeeded(order.id);
  }

  return {
    paymentStatus: (updates.payment_status as string) ?? order.payment_status,
    orderId: order.id,
  };
}
