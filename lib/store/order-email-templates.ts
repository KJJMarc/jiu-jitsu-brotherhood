import { formatGbpFromPence } from "@/lib/admin/store";
import { site } from "@/lib/site";
import type { StoreOrderDetail } from "@/lib/store/orders";
import {
  fulfilmentMethodLabel,
  fulfilmentStatusLabel,
} from "@/lib/store/orders";

const BRAND_RED = "#e40613";
const INK = "#1b1c1e";
const MUTED = "#5c6470";
const BORDER = "#e5e8ec";
const SOFT = "#f4f6f9";

export type OrderEmailContext = {
  order: StoreOrderDetail;
  collectionInstructions: string | null;
  adminOrderUrl: string;
  /** Guest self-serve confirmation URL when access token is available. */
  customerOrderUrl?: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function firstName(fullName: string): string {
  const part = fullName.trim().split(/\s+/)[0];
  return part || fullName.trim();
}

function displayVariantLabel(label: string | null | undefined): string | null {
  const trimmed = label?.trim() ?? "";
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (
    lower === "default title" ||
    lower === "default" ||
    lower === "title" ||
    lower === "title: default title"
  ) {
    return null;
  }
  return trimmed;
}

function orderHasPhysical(order: StoreOrderDetail): boolean {
  return order.items.some((item) => item.product_type === "physical");
}

function formatAddress(order: StoreOrderDetail): string[] {
  return [
    order.shipping_name,
    order.shipping_line1,
    order.shipping_line2,
    [order.shipping_city, order.shipping_county].filter(Boolean).join(", "),
    order.shipping_postcode,
    order.shipping_country === "GB"
      ? "United Kingdom"
      : order.shipping_country,
  ]
    .map((line) => line?.trim() || "")
    .filter(Boolean);
}

function itemLinesHtml(order: StoreOrderDetail): string {
  return order.items
    .map((item) => {
      const variant = displayVariantLabel(item.variant_label);
      const title = escapeHtml(item.product_title);
      const meta = [
        variant ? escapeHtml(variant) : null,
        item.product_status === "draft" ? "Draft" : null,
      ]
        .filter(Boolean)
        .join(" · ");
      return `<tr>
  <td style="padding:12px 0;border-bottom:1px solid ${BORDER};vertical-align:top;">
    <div style="font-weight:600;color:${INK};">${title}</div>
    ${meta ? `<div style="margin-top:4px;font-size:13px;color:${MUTED};">${meta}</div>` : ""}
    <div style="margin-top:4px;font-size:13px;color:${MUTED};">Qty ${item.quantity}</div>
  </td>
  <td style="padding:12px 0;border-bottom:1px solid ${BORDER};vertical-align:top;text-align:right;white-space:nowrap;font-weight:600;color:${INK};">
    ${escapeHtml(formatGbpFromPence(item.line_total_pence))}
  </td>
</tr>`;
    })
    .join("\n");
}

function itemLinesText(order: StoreOrderDetail): string {
  return order.items
    .map((item) => {
      const variant = displayVariantLabel(item.variant_label);
      const bits = [
        item.product_title,
        variant,
        item.product_status === "draft" ? "Draft" : null,
        `Qty ${item.quantity}`,
        formatGbpFromPence(item.line_total_pence),
      ].filter(Boolean);
      return `- ${bits.join(" · ")}`;
    })
    .join("\n");
}

function wrapHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${SOFT};font-family:Arial,Helvetica,sans-serif;color:${INK};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${SOFT};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid ${BORDER};">
          <tr>
            <td style="padding:20px 24px;border-bottom:3px solid ${BRAND_RED};">
              <div style="font-size:18px;font-weight:700;letter-spacing:0.02em;color:${INK};">${escapeHtml(site.name)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px 8px;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 24px 28px;font-size:13px;line-height:1.5;color:${MUTED};">
              Questions? Reply to this email or contact us at
              <a href="mailto:${escapeHtml(site.email)}" style="color:${BRAND_RED};text-decoration:none;">${escapeHtml(site.email)}</a>.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildCustomerConfirmationEmail(ctx: OrderEmailContext): {
  subject: string;
  html: string;
  text: string;
} {
  const { order, collectionInstructions } = ctx;
  const name = firstName(order.customer_name);
  const physical = orderHasPhysical(order);
  const showShippingRow = physical || order.shipping_pence > 0;
  const subject = `Order confirmed – ${order.order_number}`;
  const customerOrderUrl = ctx.customerOrderUrl?.trim() || null;

  const fulfilmentBlocks: string[] = [];
  const fulfilmentText: string[] = [];

  if (physical) {
    fulfilmentBlocks.push(
      `<p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:${INK};"><strong>Fulfilment:</strong> ${escapeHtml(fulfilmentMethodLabel(order.fulfilment_method))}</p>`,
    );
    fulfilmentText.push(
      `Fulfilment: ${fulfilmentMethodLabel(order.fulfilment_method)}`,
    );

    if (order.fulfilment_method === "collection") {
      const instructions =
        collectionInstructions?.trim() ||
        "Collection details will be confirmed after purchase.";
      fulfilmentBlocks.push(
        `<p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:${MUTED};">${escapeHtml(instructions)}</p>`,
      );
      fulfilmentText.push(instructions);
    }

    if (order.fulfilment_method === "uk_shipping") {
      const address = formatAddress(order);
      if (address.length) {
        fulfilmentBlocks.push(
          `<p style="margin:0 0 4px;font-size:14px;font-weight:600;color:${INK};">Delivery address</p>
           <p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:${MUTED};">${address.map(escapeHtml).join("<br />")}</p>`,
        );
        fulfilmentText.push("Delivery address:");
        fulfilmentText.push(...address.map((line) => `  ${line}`));
      }
    }
  }

  const totalsHtml = `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:8px;">
  <tr>
    <td style="padding:6px 0;font-size:14px;color:${MUTED};">Subtotal</td>
    <td style="padding:6px 0;font-size:14px;text-align:right;color:${INK};">${escapeHtml(formatGbpFromPence(order.subtotal_pence))}</td>
  </tr>
  ${
    showShippingRow
      ? `<tr>
    <td style="padding:6px 0;font-size:14px;color:${MUTED};">Delivery</td>
    <td style="padding:6px 0;font-size:14px;text-align:right;color:${INK};">${escapeHtml(formatGbpFromPence(order.shipping_pence))}</td>
  </tr>`
      : ""
  }
  <tr>
    <td style="padding:10px 0 0;font-size:16px;font-weight:700;color:${INK};border-top:1px solid ${BORDER};">Total paid</td>
    <td style="padding:10px 0 0;font-size:16px;font-weight:700;text-align:right;color:${INK};border-top:1px solid ${BORDER};">${escapeHtml(formatGbpFromPence(order.total_pence))}</td>
  </tr>
</table>`;

  const body = `
<p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:${BRAND_RED};">${escapeHtml(site.name)}</p>
<h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;color:${INK};">Order confirmed</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:${INK};">Hi ${escapeHtml(name)}, thank you for your order. Your payment has been received and your order is confirmed.</p>
<p style="margin:0 0 20px;font-size:14px;line-height:1.5;color:${MUTED};"><strong style="color:${INK};">Order number:</strong> ${escapeHtml(order.order_number)}</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
  ${itemLinesHtml(order)}
</table>
${totalsHtml}
<div style="margin-top:20px;">
  ${fulfilmentBlocks.join("\n")}
</div>
${
  customerOrderUrl
    ? `<p style="margin:20px 0 0;">
  <a href="${escapeHtml(customerOrderUrl)}" style="display:inline-block;background:${BRAND_RED};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 18px;">View your order</a>
</p>`
    : ""
}
<p style="margin:20px 0 0;font-size:14px;line-height:1.55;color:${INK};">Thanks again for supporting ${escapeHtml(site.name)}.</p>`;

  const text = [
    site.name,
    "Order confirmed",
    "",
    `Hi ${name}, thank you for your order. Your payment has been received and your order is confirmed.`,
    "",
    `Order number: ${order.order_number}`,
    "",
    "Items:",
    itemLinesText(order),
    "",
    `Subtotal: ${formatGbpFromPence(order.subtotal_pence)}`,
    ...(showShippingRow
      ? [`Delivery: ${formatGbpFromPence(order.shipping_pence)}`]
      : []),
    `Total paid: ${formatGbpFromPence(order.total_pence)}`,
    "",
    ...fulfilmentText,
    ...(customerOrderUrl ? ["", `View your order: ${customerOrderUrl}`] : []),
    "",
    `Thanks again for supporting ${site.name}.`,
    ...(site.email ? [`Questions? Contact ${site.email}.`] : []),
  ].join("\n");

  return { subject, html: wrapHtml(subject, body), text };
}

export function buildAdminNewOrderEmail(ctx: OrderEmailContext): {
  subject: string;
  html: string;
  text: string;
} {
  const { order, adminOrderUrl } = ctx;
  const physical = orderHasPhysical(order);
  const total = formatGbpFromPence(order.total_pence);
  const subject = `New ${site.shortName} order ${order.order_number} – ${total}`;

  const fulfilmentLabel = physical
    ? fulfilmentMethodLabel(order.fulfilment_method)
    : "Not required (non-physical)";
  const address = formatAddress(order);

  const body = `
<p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:${BRAND_RED};">New store order</p>
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;color:${INK};">${escapeHtml(order.order_number)}</h1>
<p style="margin:0 0 8px;font-size:14px;line-height:1.5;color:${INK};"><strong>Customer:</strong> ${escapeHtml(order.customer_name)}</p>
<p style="margin:0 0 8px;font-size:14px;line-height:1.5;color:${INK};"><strong>Email:</strong> ${escapeHtml(order.customer_email)}</p>
${
  order.customer_phone
    ? `<p style="margin:0 0 8px;font-size:14px;line-height:1.5;color:${INK};"><strong>Telephone:</strong> ${escapeHtml(order.customer_phone)}</p>`
    : ""
}
<p style="margin:0 0 8px;font-size:14px;line-height:1.5;color:${INK};"><strong>Total:</strong> ${escapeHtml(total)}</p>
<p style="margin:0 0 8px;font-size:14px;line-height:1.5;color:${INK};"><strong>Collection / delivery:</strong> ${escapeHtml(fulfilmentLabel)} · ${escapeHtml(fulfilmentStatusLabel(order.fulfilment_status))}</p>
${
  physical && order.fulfilment_method === "uk_shipping" && address.length
    ? `<p style="margin:0 0 4px;font-size:14px;font-weight:600;color:${INK};">Delivery address</p>
       <p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:${MUTED};">${address.map(escapeHtml).join("<br />")}</p>`
    : ""
}
<p style="margin:0 0 16px;font-size:14px;line-height:1.5;color:${INK};"><strong>Mollie payment:</strong> ${escapeHtml(order.mollie_payment_id ?? "—")}</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
  ${itemLinesHtml(order)}
</table>
<p style="margin:20px 0 0;">
  <a href="${escapeHtml(adminOrderUrl)}" style="display:inline-block;background:${BRAND_RED};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 18px;">Open order in admin</a>
</p>`;

  const text = [
    `New ${site.shortName} order ${order.order_number} – ${total}`,
    "",
    `Customer: ${order.customer_name}`,
    `Email: ${order.customer_email}`,
    ...(order.customer_phone ? [`Telephone: ${order.customer_phone}`] : []),
    `Total: ${total}`,
    `Collection / delivery: ${fulfilmentLabel} · ${fulfilmentStatusLabel(order.fulfilment_status)}`,
    ...(physical && order.fulfilment_method === "uk_shipping" && address.length
      ? ["Delivery address:", ...address.map((line) => `  ${line}`)]
      : []),
    `Mollie payment: ${order.mollie_payment_id ?? "—"}`,
    "",
    "Items:",
    itemLinesText(order),
    "",
    `Admin: ${adminOrderUrl}`,
  ].join("\n");

  return { subject, html: wrapHtml(subject, body), text };
}
