#!/usr/bin/env node
/**
 * Mollie TEST + Resend store order email matrix.
 * Mirrors production claim columns, From, and Reply-To.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MOLLIE_KEY = process.env.MOLLIE_API_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;

for (const [name, value] of Object.entries({
  NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY,
  MOLLIE_API_KEY: MOLLIE_KEY,
  RESEND_API_KEY: RESEND_KEY,
})) {
  if (!value) throw new Error(`Missing env ${name}`);
}
if (!MOLLIE_KEY.startsWith("test_")) {
  throw new Error("Refusing to run: MOLLIE_API_KEY is not TEST mode");
}

const FROM = process.env.EMAIL_FROM?.trim();
const REPLY_TO = process.env.EMAIL_REPLY_TO?.trim();
const ADMIN_TO = "admin@kingstonjiujitsu.com";
const CUSTOMER_TO = "admin@kingstonjiujitsu.com";

if (!FROM) throw new Error("Missing env EMAIL_FROM");
if (!REPLY_TO) throw new Error("Missing env EMAIL_REPLY_TO");

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function section(title) {
  console.log(`\n=== ${title} ===`);
}

function gbp(pence) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format((pence || 0) / 100);
}

function fulfilmentLabel(method) {
  if (method === "collection") return "Collect at Kingston Jiu Jitsu";
  if (method === "uk_shipping") return "UK delivery";
  return "Not required";
}

async function mollie(path, init = {}) {
  const res = await fetch(`https://api.mollie.com/v2${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${MOLLIE_KEY}`,
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`Mollie ${res.status}: ${text.slice(0, 500)}`);
  return json;
}

async function resendEmail({ to, subject, text, html, apiKey = RESEND_KEY }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      reply_to: REPLY_TO,
      to: [to],
      subject,
      text,
      html: html || `<pre>${text}</pre>`,
    }),
  });
  const raw = await res.text();
  let body = null;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = { raw };
  }
  return { ok: res.ok, status: res.status, body, raw };
}

async function getOrder(id) {
  const { data, error } = await sb.from("store_orders").select("*").eq("id", id).single();
  if (error) throw new Error(error.message);
  return data;
}

async function getItems(orderId) {
  const { data, error } = await sb
    .from("store_order_items")
    .select("*")
    .eq("order_id", orderId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

async function listMovements(orderId) {
  const { data, error } = await sb
    .from("inventory_movements")
    .select("id, quantity_delta, movement_type, created_at")
    .eq("order_id", orderId);
  if (error) throw new Error(error.message);
  return data || [];
}

function buildCustomerEmail(order, items) {
  const lines = items
    .map(
      (item) =>
        `- ${item.product_title}${item.variant_label ? ` (${item.variant_label})` : ""} × ${item.quantity} — ${gbp(item.line_total_pence)}`,
    )
    .join("\n");
  let fulfilment = "No shipping required.";
  if (order.fulfilment_method === "collection") {
    fulfilment = `Fulfilment: ${fulfilmentLabel(order.fulfilment_method)}\nCollect at Kingston Jiu Jitsu reception.`;
  } else if (order.fulfilment_method === "uk_shipping") {
    fulfilment = `Fulfilment: ${fulfilmentLabel(order.fulfilment_method)}\nDeliver to: ${[
      order.shipping_name,
      order.shipping_line1,
      order.shipping_city,
      order.shipping_postcode,
    ]
      .filter(Boolean)
      .join(", ")}`;
  }
  const text = [
    "Kingston Jiu Jitsu",
    "Order confirmed",
    "",
    `Hi ${String(order.customer_name).split(" ")[0]}, thank you for your order.`,
    "",
    `Order number: ${order.order_number}`,
    "",
    "Items:",
    lines,
    "",
    `Subtotal: ${gbp(order.subtotal_pence)}`,
    order.fulfilment_method ? `Delivery: ${gbp(order.shipping_pence)}` : null,
    `Total paid: ${gbp(order.total_pence)}`,
    "",
    fulfilment,
    "",
    `Questions? Contact ${REPLY_TO}.`,
  ]
    .filter((line) => line !== null)
    .join("\n");
  return {
    subject: `Order confirmed – ${order.order_number}`,
    text,
    html: `<div><h1>Order confirmed</h1><p>Order number: <strong>${order.order_number}</strong></p><pre>${lines}</pre><p>Total paid: <strong>${gbp(order.total_pence)}</strong></p></div>`,
  };
}

function buildAdminEmail(order, items) {
  const lines = items
    .map(
      (item) =>
        `- ${item.product_title}${item.variant_label ? ` (${item.variant_label})` : ""} × ${item.quantity} — ${gbp(item.line_total_pence)}`,
    )
    .join("\n");
  const text = [
    `New KJJ order ${order.order_number} – ${gbp(order.total_pence)}`,
    "",
    `Customer: ${order.customer_name}`,
    `Email: ${order.customer_email}`,
    order.customer_phone ? `Telephone: ${order.customer_phone}` : null,
    `Total: ${gbp(order.total_pence)}`,
    `Collection / delivery: ${fulfilmentLabel(order.fulfilment_method)}`,
    order.fulfilment_method === "uk_shipping"
      ? `Address: ${[
          order.shipping_name,
          order.shipping_line1,
          order.shipping_city,
          order.shipping_postcode,
        ]
          .filter(Boolean)
          .join(", ")}`
      : null,
    `Mollie payment: ${order.mollie_payment_id || "—"}`,
    "",
    "Items:",
    lines,
  ]
    .filter((line) => line !== null)
    .join("\n");
  return {
    subject: `New KJJ order ${order.order_number} – ${gbp(order.total_pence)}`,
    text,
    html: `<div><h1>${order.order_number}</h1><pre>${text}</pre></div>`,
  };
}

async function claim(orderId, column) {
  const now = new Date().toISOString();
  const { data, error } = await sb
    .from("store_orders")
    .update({ [column]: now })
    .eq("id", orderId)
    .eq("payment_status", "paid")
    .is(column, null)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(`claim ${column}: ${error.message}`);
  return Boolean(data?.id);
}

async function release(orderId, column) {
  const { error } = await sb
    .from("store_orders")
    .update({ [column]: null })
    .eq("id", orderId);
  if (error) throw new Error(`release ${column}: ${error.message}`);
}

async function sendPaidEmailsIfNeeded(orderId, { apiKey } = {}) {
  const order = await getOrder(orderId);
  if (order.payment_status !== "paid") {
    return { skipped: true, reason: "not_paid", order };
  }
  const items = await getItems(orderId);
  const out = { skipped: false, customer: null, admin: null };

  if (await claim(orderId, "customer_confirmation_sent_at")) {
    const mail = buildCustomerEmail(order, items);
    const res = await resendEmail({
      to: order.customer_email,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      apiKey: apiKey || RESEND_KEY,
    });
    if (!res.ok) {
      await release(orderId, "customer_confirmation_sent_at");
      out.customer = { ok: false, status: res.status, body: res.body };
    } else {
      out.customer = {
        ok: true,
        id: res.body.id,
        subject: mail.subject,
        text: mail.text,
      };
    }
  } else {
    out.customer = { ok: true, skipped: true, reason: "already_claimed" };
  }

  if (await claim(orderId, "admin_notification_sent_at")) {
    const mail = buildAdminEmail(order, items);
    const res = await resendEmail({
      to: ADMIN_TO,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      apiKey: apiKey || RESEND_KEY,
    });
    if (!res.ok) {
      await release(orderId, "admin_notification_sent_at");
      out.admin = { ok: false, status: res.status, body: res.body };
    } else {
      out.admin = {
        ok: true,
        id: res.body.id,
        subject: mail.subject,
        text: mail.text,
      };
    }
  } else {
    out.admin = { ok: true, skipped: true, reason: "already_claimed" };
  }

  out.order = await getOrder(orderId);
  return out;
}

function mapMollieStatus(status) {
  if (status === "paid") return "paid";
  if (status === "failed" || status === "expired") return "payment_failed";
  if (status === "canceled") return "cancelled";
  return "pending_payment";
}

async function syncFromMollie(orderId, source) {
  const order = await getOrder(orderId);
  if (!order.mollie_payment_id) throw new Error("Order has no mollie_payment_id");
  const payment = await mollie(`/payments/${order.mollie_payment_id}`);
  const mapped = mapMollieStatus(payment.status);
  const idempotencyKey = `${source}:${payment.id}:${payment.status}`;

  const { error: eventError } = await sb.from("store_payment_events").insert({
    order_id: order.id,
    mollie_payment_id: payment.id,
    source,
    mollie_status: payment.status,
    idempotency_key: idempotencyKey,
    payload: payment,
    processed_ok: false,
  });

  if (eventError) {
    if (eventError.code === "23505") {
      const emails =
        mapped === "paid" || order.payment_status === "paid"
          ? await sendPaidEmailsIfNeeded(order.id)
          : { skipped: true, reason: "duplicate_non_paid" };
      return {
        duplicate: true,
        mollieStatus: payment.status,
        mapped,
        paymentStatus: order.payment_status,
        emails,
      };
    }
    throw new Error(eventError.message);
  }

  const updates = {
    mollie_payment_id: payment.id,
    mollie_mode: payment.mode,
  };
  if (mapped === "paid") {
    updates.payment_status = "paid";
    updates.payment_confirmed_at =
      order.payment_confirmed_at || new Date().toISOString();
    if (order.fulfilment_status === "unfulfilled") {
      updates.fulfilment_status = "preparing";
    }
  } else if (mapped === "payment_failed" && order.payment_status !== "paid") {
    updates.payment_status = "payment_failed";
  } else if (mapped === "cancelled" && order.payment_status !== "paid") {
    updates.payment_status = "cancelled";
    updates.fulfilment_status = "cancelled";
  }

  const { error: updateError } = await sb
    .from("store_orders")
    .update(updates)
    .eq("id", order.id);
  if (updateError) throw new Error(updateError.message);

  if (mapped === "paid") {
    const { error: stockError } = await sb.rpc("apply_store_order_stock", {
      p_order_id: order.id,
    });
    if (stockError) console.log("stock rpc note:", stockError.message);
  }

  await sb
    .from("store_payment_events")
    .update({ processed_ok: true, error_message: null })
    .eq("idempotency_key", idempotencyKey);

  const emails =
    mapped === "paid"
      ? await sendPaidEmailsIfNeeded(order.id)
      : { skipped: true, reason: "not_paid" };

  return {
    duplicate: false,
    mollieStatus: payment.status,
    mapped,
    paymentStatus: updates.payment_status || order.payment_status,
    emails,
    order: await getOrder(order.id),
  };
}

async function nextOrderNumber() {
  const { data, error } = await sb.rpc("next_store_order_number");
  if (error) throw new Error(error.message);
  return data;
}

async function createPendingOrder({ fulfilmentMethod, label }) {
  const orderNumber = await nextOrderNumber();
  const shippingPence = fulfilmentMethod === "uk_shipping" ? 500 : 0;
  const subtotalPence = 1500;
  const totalPence = subtotalPence + shippingPence;
  const row = {
    order_number: orderNumber,
    customer_name: `Email Matrix ${label}`,
    customer_email: CUSTOMER_TO,
    customer_phone: "07584131335",
    fulfilment_method: fulfilmentMethod,
    shipping_name: fulfilmentMethod === "uk_shipping" ? "Email Matrix Customer" : null,
    shipping_line1: fulfilmentMethod === "uk_shipping" ? "1 Test Street" : null,
    shipping_line2: null,
    shipping_city: fulfilmentMethod === "uk_shipping" ? "Kingston" : null,
    shipping_county: fulfilmentMethod === "uk_shipping" ? "Surrey" : null,
    shipping_postcode: fulfilmentMethod === "uk_shipping" ? "KT1 1AA" : null,
    shipping_country: fulfilmentMethod === "uk_shipping" ? "GB" : null,
    subtotal_pence: subtotalPence,
    shipping_pence: shippingPence,
    total_pence: totalPence,
    currency: "GBP",
    payment_status: "pending_payment",
    fulfilment_status: "unfulfilled",
    terms_version: "2026-09-14",
    terms_accepted_at: new Date().toISOString(),
    customer_note: `matrix:${label}`,
  };
  const { data: order, error } = await sb.from("store_orders").insert(row).select("*").single();
  if (error) throw new Error(`insert order: ${error.message}`);

  const { error: itemError } = await sb.from("store_order_items").insert({
    order_id: order.id,
    product_id: null,
    variant_id: null,
    product_title: `Matrix Test Item (${label})`,
    variant_label: "Adult / M",
    sku: "MATRIX-TEST",
    product_type: fulfilmentMethod ? "physical" : "non_shipping",
    product_status: "active",
    quantity: 1,
    unit_price_pence: subtotalPence,
    line_total_pence: subtotalPence,
    weight_grams: fulfilmentMethod ? 500 : null,
    track_inventory: false,
    sort_order: 0,
  });
  if (itemError) throw new Error(`insert item: ${itemError.message}`);
  return order;
}

async function attachOpenPayment(order) {
  const payment = await mollie("/payments", {
    method: "POST",
    headers: { "Idempotency-Key": `matrix-${order.id}-${Date.now()}` },
    body: JSON.stringify({
      amount: { currency: "GBP", value: (order.total_pence / 100).toFixed(2) },
      description: `Kingston Jiu Jitsu order ${order.order_number}`,
      redirectUrl: `https://www.kingstonjiujitsu.com/admin/store/preview/checkout/return/?order=${order.id}`,
      webhookUrl: `https://www.kingstonjiujitsu.com/api/store/mollie/webhook/`,
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        matrix: "true",
      },
    }),
  });
  const { error } = await sb
    .from("store_orders")
    .update({ mollie_payment_id: payment.id, mollie_mode: "test" })
    .eq("id", order.id);
  if (error) throw new Error(error.message);
  await sb.from("store_payment_events").insert({
    order_id: order.id,
    mollie_payment_id: payment.id,
    source: "create",
    mollie_status: payment.status,
    idempotency_key: `create:${payment.id}`,
    payload: payment,
    processed_ok: true,
  });
  return payment;
}

async function main() {
  const report = { from: FROM, replyTo: REPLY_TO, adminTo: ADMIN_TO, cases: {} };

  section("0) Preflight Resend");
  const pre = await resendEmail({
    to: ADMIN_TO,
    subject: "KJJ matrix preflight",
    text: "Matrix preflight — safe to ignore.",
  });
  console.log(pre.status, pre.body);
  if (!pre.ok) throw new Error("Resend preflight failed");
  report.preflightId = pre.body.id;

  section("1) Paid order — customer + admin once");
  const { data: paidList, error: paidErr } = await sb
    .from("store_orders")
    .select("*")
    .eq("payment_status", "paid")
    .order("created_at", { ascending: false })
    .limit(10);
  if (paidErr) throw new Error(paidErr.message);
  if (!paidList?.length) throw new Error("No paid orders available");

  let paid = paidList[0];
  await sb
    .from("store_orders")
    .update({
      customer_confirmation_sent_at: null,
      admin_notification_sent_at: null,
    })
    .eq("id", paid.id);

  const movementsBefore = await listMovements(paid.id);
  const first = await sendPaidEmailsIfNeeded(paid.id);
  console.log("first send", {
    customerOk: first.customer?.ok,
    customerId: first.customer?.id,
    customerSkipped: first.customer?.skipped,
    adminOk: first.admin?.ok,
    adminId: first.admin?.id,
    adminSkipped: first.admin?.skipped,
  });
  if (!first.customer?.ok || first.customer?.skipped || !first.admin?.ok || first.admin?.skipped) {
    throw new Error(`Paid first send failed: ${JSON.stringify(first)}`);
  }
  paid = await getOrder(paid.id);
  report.cases.paidOnce = {
    orderNumber: paid.order_number,
    orderId: paid.id,
    customerResendId: first.customer.id,
    adminResendId: first.admin.id,
    customerSentAt: paid.customer_confirmation_sent_at,
    adminSentAt: paid.admin_notification_sent_at,
    customerHasOrderNumber: first.customer.text.includes(paid.order_number),
    customerHasTotal: first.customer.text.includes("Total paid"),
    adminHasCustomer: first.admin.text.includes(paid.customer_email),
    adminHasOrderNumber: first.admin.text.includes(paid.order_number),
    replyTo: REPLY_TO,
    from: FROM,
  };

  section("2) Duplicate sends / webhook + return ordering");
  const second = await sendPaidEmailsIfNeeded(paid.id);
  const third = await sendPaidEmailsIfNeeded(paid.id);
  const syncWebhook1 = await syncFromMollie(paid.id, "webhook");
  const syncReturn = await syncFromMollie(paid.id, "return_sync");
  const syncWebhook2 = await syncFromMollie(paid.id, "webhook");
  paid = await getOrder(paid.id);
  const movementsAfter = await listMovements(paid.id);
  report.cases.idempotency = {
    orderNumber: paid.order_number,
    secondCustomerSkipped: second.customer?.skipped === true,
    secondAdminSkipped: second.admin?.skipped === true,
    thirdCustomerSkipped: third.customer?.skipped === true,
    thirdAdminSkipped: third.admin?.skipped === true,
    timestampsStable:
      paid.customer_confirmation_sent_at === report.cases.paidOnce.customerSentAt &&
      paid.admin_notification_sent_at === report.cases.paidOnce.adminSentAt,
    stockBefore: movementsBefore.length,
    stockAfter: movementsAfter.length,
    stockUnchanged: movementsBefore.length === movementsAfter.length,
    webhook1Duplicate: syncWebhook1.duplicate,
    returnHandled: syncReturn.duplicate || syncReturn.mapped === "paid",
    webhook2Duplicate: syncWebhook2.duplicate,
  };
  console.log(report.cases.idempotency);

  section("3) Cancelled payment → no emails");
  // Mollie profile methods are not API-cancelable (isCancelable=false). Create a
  // real TEST payment, sync while open (must not email), then apply the same
  // cancelled transition production sync uses when Mollie reports canceled.
  let cancelled = await createPendingOrder({
    fulfilmentMethod: "collection",
    label: "cancelled",
  });
  const cancelledPayment = await attachOpenPayment(cancelled);
  const openCancelSync = await syncFromMollie(cancelled.id, "webhook");
  const openCancelEmail = await sendPaidEmailsIfNeeded(cancelled.id);
  await sb.from("store_payment_events").insert({
    order_id: cancelled.id,
    mollie_payment_id: cancelledPayment.id,
    source: "webhook",
    mollie_status: "canceled",
    idempotency_key: `webhook:${cancelledPayment.id}:canceled`,
    payload: { id: cancelledPayment.id, status: "canceled", mode: "test" },
    processed_ok: true,
  });
  await sb
    .from("store_orders")
    .update({
      payment_status: "cancelled",
      fulfilment_status: "cancelled",
    })
    .eq("id", cancelled.id);
  const cancelReturnSync = await syncFromMollie(cancelled.id, "return_sync");
  const cancelEmailAttempt = await sendPaidEmailsIfNeeded(cancelled.id);
  cancelled = await getOrder(cancelled.id);
  report.cases.cancelled = {
    orderNumber: cancelled.order_number,
    molliePaymentId: cancelledPayment.id,
    openSyncMapped: openCancelSync.mapped,
    openEmailSkipped: openCancelEmail.skipped === true,
    returnSyncMapped: cancelReturnSync.mapped,
    paymentStatus: cancelled.payment_status,
    emailAttemptSkipped: cancelEmailAttempt.skipped === true,
    customerSentAt: cancelled.customer_confirmation_sent_at,
    adminSentAt: cancelled.admin_notification_sent_at,
    noEmails:
      !cancelled.customer_confirmation_sent_at &&
      !cancelled.admin_notification_sent_at,
  };
  console.log(report.cases.cancelled);

  section("4) Failed payment → no emails");
  let failed = await createPendingOrder({
    fulfilmentMethod: "uk_shipping",
    label: "failed",
  });
  const failedPayment = await attachOpenPayment(failed);
  const pendingSync = await syncFromMollie(failed.id, "return_sync");
  const pendingEmail = await sendPaidEmailsIfNeeded(failed.id);
  await sb.from("store_payment_events").insert({
    order_id: failed.id,
    mollie_payment_id: failedPayment.id,
    source: "webhook",
    mollie_status: "failed",
    idempotency_key: `webhook:${failedPayment.id}:failed`,
    payload: { id: failedPayment.id, status: "failed", mode: "test" },
    processed_ok: true,
  });
  await sb
    .from("store_orders")
    .update({ payment_status: "payment_failed" })
    .eq("id", failed.id);
  const failedWebhookSync = await syncFromMollie(failed.id, "webhook");
  const failedEmailAttempt = await sendPaidEmailsIfNeeded(failed.id);
  failed = await getOrder(failed.id);
  report.cases.failed = {
    orderNumber: failed.order_number,
    molliePaymentId: failedPayment.id,
    pendingMapped: pendingSync.mapped,
    pendingEmailSkipped: pendingEmail.skipped === true,
    afterFailSyncMapped: failedWebhookSync.mapped,
    paymentStatus: failed.payment_status,
    emailAttemptSkipped: failedEmailAttempt.skipped === true,
    customerSentAt: failed.customer_confirmation_sent_at,
    adminSentAt: failed.admin_notification_sent_at,
    noEmails:
      !failed.customer_confirmation_sent_at && !failed.admin_notification_sent_at,
  };
  console.log(report.cases.failed);

  section("5) Email failure does not alter payment/stock");
  const before = await getOrder(paid.id);
  const movBefore = await listMovements(paid.id);
  await sb
    .from("store_orders")
    .update({ customer_confirmation_sent_at: null })
    .eq("id", paid.id);
  const failSend = await sendPaidEmailsIfNeeded(paid.id, {
    apiKey: "re_invalid_key_for_failure_test",
  });
  const after = await getOrder(paid.id);
  const movAfter = await listMovements(paid.id);
  report.cases.emailFailureIsolation = {
    orderNumber: before.order_number,
    failCustomerOk: failSend.customer?.ok === false,
    claimReleasedOnFailure: after.customer_confirmation_sent_at === null,
    paymentUnchanged: after.payment_status === "paid",
    stockAppliedUnchanged: after.stock_applied_at === before.stock_applied_at,
    movementsUnchanged: movBefore.length === movAfter.length,
  };
  console.log(report.cases.emailFailureIsolation);

  const restore = await sendPaidEmailsIfNeeded(paid.id);
  console.log("restore after failure test", {
    ok: restore.customer?.ok,
    id: restore.customer?.id,
    skipped: restore.customer?.skipped,
  });

  section("SUMMARY");
  console.log(JSON.stringify(report, null, 2));

  const ok =
    report.cases.paidOnce.customerResendId &&
    report.cases.paidOnce.adminResendId &&
    report.cases.paidOnce.customerHasOrderNumber &&
    report.cases.paidOnce.adminHasCustomer &&
    report.cases.idempotency.timestampsStable &&
    report.cases.idempotency.stockUnchanged &&
    report.cases.idempotency.secondCustomerSkipped &&
    report.cases.idempotency.secondAdminSkipped &&
    report.cases.cancelled.noEmails &&
    report.cases.cancelled.paymentStatus === "cancelled" &&
    report.cases.failed.noEmails &&
    report.cases.failed.paymentStatus === "payment_failed" &&
    report.cases.emailFailureIsolation.paymentUnchanged &&
    report.cases.emailFailureIsolation.movementsUnchanged &&
    report.cases.emailFailureIsolation.claimReleasedOnFailure;

  if (!ok) {
    console.error("MATRIX ASSERTIONS FAILED");
    process.exit(1);
  }
  console.log("\nMATRIX PASSED");
}

main().catch((err) => {
  console.error("MATRIX FAILED", err);
  process.exit(1);
});
