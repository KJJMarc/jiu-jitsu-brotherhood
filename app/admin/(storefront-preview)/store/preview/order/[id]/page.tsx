import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import StorefrontShell, {
  StorefrontHeader,
  StorefrontPreviewBanner,
  StorefrontSection,
} from "@/components/storefront/StorefrontShell";
import PreviewBagLink from "@/components/storefront/PreviewBagLink";
import styles from "@/components/storefront/storefront.module.css";
import {
  ADMIN_STORE_ORDERS_PATH,
  ADMIN_STORE_PREVIEW_PATH,
} from "@/lib/admin/store";
import {
  getStoreOrderDetail,
  syncStoreOrderPayment,
} from "@/lib/store/checkout.server";
import {
  fulfilmentMethodLabel,
  fulfilmentStatusLabel,
  paymentStatusLabel,
} from "@/lib/store/orders";
import { storefrontProductKindLabel } from "@/lib/storefront/labels";
import { formatStorefrontPrice } from "@/lib/storefront/pricing";

export const metadata: Metadata = {
  title: "Order (preview)",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminStorePreviewOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    await syncStoreOrderPayment({ orderId: id, source: "return_sync" });
  } catch {
    // ignore — show current DB state
  }

  const order = await getStoreOrderDetail(id);
  if (!order) notFound();

  const paid = order.payment_status === "paid";
  const allNonPhysical = order.items.every(
    (item) => item.product_type === "non_shipping",
  );
  const showShipping = !allNonPhysical || order.shipping_pence > 0;

  return (
    <StorefrontShell
      banner={
        <StorefrontPreviewBanner>
          <span>
            <strong>Admin preview</strong> — private order confirmation.
          </span>
          <nav className={styles.previewBannerNav} aria-label="Preview">
            <Link href={ADMIN_STORE_PREVIEW_PATH}>Catalogue</Link>
            <PreviewBagLink />
            <Link href={ADMIN_STORE_ORDERS_PATH}>Orders</Link>
          </nav>
        </StorefrontPreviewBanner>
      }
    >
      <StorefrontHeader
        eyebrow="Shop"
        title={paid ? "Order confirmed" : "Order status"}
        lead={
          paid
            ? "Thanks for your order. Your payment has been received and your order is confirmed."
            : "This preview order is not paid yet."
        }
      />
      <StorefrontSection>
        <div className={styles.statusPanel}>
          <h2>Order {order.order_number}</h2>
          <p>
            Payment: <strong>{paymentStatusLabel(order.payment_status)}</strong>
          </p>
          {allNonPhysical ? (
            <p>No collection or delivery required.</p>
          ) : (
            <p>
              Fulfilment: {fulfilmentMethodLabel(order.fulfilment_method)} ·{" "}
              {fulfilmentStatusLabel(order.fulfilment_status)}
            </p>
          )}
          <p>
            Customer: {order.customer_name} · {order.customer_email}
            {order.customer_phone ? ` · ${order.customer_phone}` : ""}
          </p>
          {!allNonPhysical && order.fulfilment_method === "collection" ? (
            <p>
              Collection: Collect at Kingston Jiu Jitsu. We will confirm collection
              details after purchase.
            </p>
          ) : null}
          {!allNonPhysical && order.fulfilment_method === "uk_shipping" ? (
            <div>
              <p>Delivery address</p>
              <p>
                {[
                  order.shipping_name,
                  order.shipping_line1,
                  order.shipping_line2,
                  [order.shipping_city, order.shipping_county]
                    .filter(Boolean)
                    .join(", "),
                  order.shipping_postcode,
                  order.shipping_country === "GB"
                    ? "United Kingdom"
                    : order.shipping_country,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          ) : null}
          <ul className={styles.checkoutLines}>
            {order.items.map((item) => {
              const kind = storefrontProductKindLabel({
                productType: item.product_type,
                title: item.product_title,
              });
              const variant = item.variant_label?.trim();
              return (
                <li key={item.id}>
                  <span>
                    {item.product_title}
                    {variant ? ` · ${variant}` : ""}
                    {item.product_status === "draft" ? " (Draft)" : ""}
                    {` · ${kind}`} ×{item.quantity}
                  </span>
                  <strong>
                    {formatStorefrontPrice(item.line_total_pence)}
                  </strong>
                </li>
              );
            })}
          </ul>
          <dl className={styles.totals}>
            <div>
              <dt>Subtotal</dt>
              <dd>{formatStorefrontPrice(order.subtotal_pence)}</dd>
            </div>
            {showShipping ? (
              <div>
                <dt>Delivery</dt>
                <dd>{formatStorefrontPrice(order.shipping_pence)}</dd>
              </div>
            ) : null}
            <div className={styles.totalsGrand}>
              <dt>Total</dt>
              <dd>{formatStorefrontPrice(order.total_pence)}</dd>
            </div>
          </dl>
          <div className={styles.statusActions}>
            <Link
              href={ADMIN_STORE_PREVIEW_PATH}
              className={styles.purchaseButtonLive}
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </StorefrontSection>
    </StorefrontShell>
  );
}
