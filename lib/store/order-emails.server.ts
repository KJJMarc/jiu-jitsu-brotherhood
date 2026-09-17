import "server-only";

import { adminStoreOrderPath } from "@/lib/admin/store";
import {
  buildAdminNewOrderEmail,
  buildCustomerConfirmationEmail,
} from "@/lib/store/order-email-templates";
import type { StoreOrderDetail } from "@/lib/store/orders";
import {
  resendApiKeyConfigured,
  sendStoreEmail,
  STORE_ADMIN_ORDER_NOTIFY_TO,
} from "@/lib/store/resend.server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getMolliePayment } from "@/lib/store/mollie.server";
import { publicCustomerOrderUrl } from "@/lib/store/order-access.server";

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

async function loadPaidOrderDetail(
  orderId: string,
): Promise<StoreOrderDetail | null> {
  const admin = getSupabaseAdminClient();
  const { data: order, error } = await admin
    .from("store_orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!order) return null;
  if (order.payment_status !== "paid") return null;

  const { data: items, error: itemsError } = await admin
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

async function loadCollectionInstructions(): Promise<string | null> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("store_fulfilment_settings")
    .select("collection_instructions")
    .eq("id", 1)
    .maybeSingle();
  if (error) {
    console.error("[store-email] fulfilment settings load failed", error.message);
    return null;
  }
  const instructions = data?.collection_instructions?.trim();
  return instructions || null;
}

/**
 * Recover guest access token from Mollie payment metadata (Option A).
 * Raw token is never stored in DB — only the hash.
 */
async function resolveCustomerOrderUrl(
  order: StoreOrderDetail,
): Promise<string | null> {
  if (!order.mollie_payment_id) return null;
  try {
    const payment = await getMolliePayment(order.mollie_payment_id);
    const token =
      typeof payment.metadata?.access_token === "string"
        ? payment.metadata.access_token.trim()
        : "";
    if (!token) return null;
    return publicCustomerOrderUrl({
      origin: siteOrigin(),
      orderId: order.id,
      accessToken: token,
    });
  } catch (error) {
    console.error(
      "[store-email] could not recover access token from Mollie metadata",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

/**
 * Claim a send slot with a conditional update. Only one concurrent caller wins.
 * On send failure the claim is released so a later sync can retry.
 */
async function claimEmailSlot(
  orderId: string,
  column: "customer_confirmation_sent_at" | "admin_notification_sent_at",
): Promise<boolean> {
  const admin = getSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("store_orders")
    .update({ [column]: now })
    .eq("id", orderId)
    .eq("payment_status", "paid")
    .is(column, null)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(`[store-email] claim ${column} failed`, error.message);
    return false;
  }
  return Boolean(data?.id);
}

async function releaseEmailSlot(
  orderId: string,
  column: "customer_confirmation_sent_at" | "admin_notification_sent_at",
): Promise<void> {
  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from("store_orders")
    .update({ [column]: null })
    .eq("id", orderId);
  if (error) {
    console.error(`[store-email] release ${column} failed`, error.message);
  }
}

async function sendCustomerConfirmation(
  order: StoreOrderDetail,
  collectionInstructions: string | null,
  customerOrderUrl: string | null,
): Promise<void> {
  const claimed = await claimEmailSlot(order.id, "customer_confirmation_sent_at");
  if (!claimed) return;

  try {
    const content = buildCustomerConfirmationEmail({
      order,
      collectionInstructions,
      adminOrderUrl: `${siteOrigin()}${adminStoreOrderPath(order.id)}`,
      customerOrderUrl,
    });
    await sendStoreEmail({
      to: order.customer_email,
      subject: content.subject,
      html: content.html,
      text: content.text,
      tags: [
        { name: "category", value: "store_customer_confirmation" },
        { name: "order_id", value: order.id.replace(/[^a-zA-Z0-9_-]/g, "") },
      ],
    });
  } catch (error) {
    await releaseEmailSlot(order.id, "customer_confirmation_sent_at");
    console.error(
      `[store-email] customer confirmation failed for ${order.order_number}`,
      error instanceof Error ? error.message : error,
    );
  }
}

async function sendAdminNotification(
  order: StoreOrderDetail,
  collectionInstructions: string | null,
): Promise<void> {
  const claimed = await claimEmailSlot(order.id, "admin_notification_sent_at");
  if (!claimed) return;

  try {
    const content = buildAdminNewOrderEmail({
      order,
      collectionInstructions,
      adminOrderUrl: `${siteOrigin()}${adminStoreOrderPath(order.id)}`,
    });
    await sendStoreEmail({
      to: STORE_ADMIN_ORDER_NOTIFY_TO,
      subject: content.subject,
      html: content.html,
      text: content.text,
      tags: [
        { name: "category", value: "store_admin_notification" },
        { name: "order_id", value: order.id.replace(/[^a-zA-Z0-9_-]/g, "") },
      ],
    });
  } catch (error) {
    await releaseEmailSlot(order.id, "admin_notification_sent_at");
    console.error(
      `[store-email] admin notification failed for ${order.order_number}`,
      error instanceof Error ? error.message : error,
    );
  }
}

/**
 * Send paid-order transactional emails if not already delivered.
 * Safe to call from webhook / return / admin sync. Never throws for send
 * failures — payment and stock must remain intact.
 */
export async function sendPaidOrderEmailsIfNeeded(
  orderId: string,
): Promise<void> {
  try {
    if (!resendApiKeyConfigured()) {
      console.warn(
        "[store-email] RESEND_API_KEY missing — skipping order emails",
      );
      return;
    }

    const order = await loadPaidOrderDetail(orderId);
    if (!order) return;

    const collectionInstructions = await loadCollectionInstructions();
    const customerOrderUrl = await resolveCustomerOrderUrl(order);
    await sendCustomerConfirmation(
      order,
      collectionInstructions,
      customerOrderUrl,
    );
    await sendAdminNotification(order, collectionInstructions);
  } catch (error) {
    console.error(
      "[store-email] unexpected error",
      error instanceof Error ? error.message : error,
    );
  }
}
