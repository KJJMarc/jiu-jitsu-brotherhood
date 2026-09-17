import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import StorefrontShell, {
  StorefrontHeader,
  StorefrontSection,
} from "@/components/storefront/StorefrontShell";
import styles from "@/components/storefront/storefront.module.css";
import { syncStoreOrderPayment } from "@/lib/store/checkout.server";
import { getPublicCustomerOrderByToken } from "@/lib/store/order-access.server";
import { getPublicShopMollieMode } from "@/lib/store/mollie.server";
import {
  fulfilmentMethodLabel,
  fulfilmentStatusLabel,
  paymentStatusLabel,
} from "@/lib/store/orders";
import { storefrontProductKindLabel } from "@/lib/storefront/labels";
import { formatStorefrontPrice } from "@/lib/storefront/pricing";
import { PUBLIC_SHOP_PATH } from "@/lib/storefront/paths";

export const metadata: Metadata = {
  title: "Order status",
  robots: { index: false, follow: false, nocache: true },
};

export default async function PublicShopOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; t?: string }>;
}) {
  const params = await searchParams;
  const orderId = params.order?.trim();
  const token = params.t?.trim();
  if (!orderId || !token) notFound();

  try {
    await syncStoreOrderPayment({ orderId, source: "return_sync" });
  } catch {
    // Show current DB state if sync fails.
  }

  let order;
  try {
    order = await getPublicCustomerOrderByToken({
      orderId,
      accessToken: token,
    });
  } catch (error) {
    console.error("[shop/order] token lookup failed", error);
    notFound();
  }
  // Bad token → generic "not found" without leaking whether the order exists.
  if (!order) notFound();

  const paid = order.paymentStatus === "paid";
  const allNonPhysical = order.items.every(
    (item) => item.productType === "non_shipping",
  );
  const showShipping = !allNonPhysical || order.shippingPence > 0;
  const mode =
    order.mollieMode === "live" || order.mollieMode === "test"
      ? order.mollieMode
      : getPublicShopMollieMode();

  return (
    <StorefrontShell>
      <StorefrontHeader
        eyebrow="Shop"
        title={paid ? "Order confirmed" : "Order status"}
        lead={
          paid
            ? "Thanks for your order. Your payment has been received and your order is confirmed."
            : "This order is not paid yet."
        }
      />
      <StorefrontSection>
        <div className={styles.statusPanel}>
          <h2>Order {order.orderNumber}</h2>
          <p>
            Payment: <strong>{paymentStatusLabel(order.paymentStatus)}</strong>
          </p>
          {allNonPhysical ? (
            <p>No collection or delivery required.</p>
          ) : (
            <p>
              Fulfilment: {fulfilmentMethodLabel(order.fulfilmentMethod)} ·{" "}
              {fulfilmentStatusLabel(order.fulfilmentStatus)}
            </p>
          )}
          <p>
            Customer: {order.customerName} · {order.customerEmail}
            {order.customerPhone ? ` · ${order.customerPhone}` : ""}
          </p>
          {!allNonPhysical && order.fulfilmentMethod === "collection" ? (
            <p>
              Collection: Collection details will be confirmed after purchase.
            </p>
          ) : null}
          {!allNonPhysical && order.fulfilmentMethod === "uk_shipping" ? (
            <div>
              <p>Delivery address</p>
              <p>
                {[
                  order.shippingName,
                  order.shippingLine1,
                  order.shippingLine2,
                  [order.shippingCity, order.shippingCounty]
                    .filter(Boolean)
                    .join(", "),
                  order.shippingPostcode,
                  order.shippingCountry === "GB"
                    ? "United Kingdom"
                    : order.shippingCountry,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          ) : null}
          <ul className={styles.checkoutLines}>
            {order.items.map((item) => {
              const kind = storefrontProductKindLabel({
                productType: item.productType,
                title: item.productTitle,
              });
              const variant = item.variantLabel?.trim();
              return (
                <li key={item.id}>
                  <span>
                    {item.productTitle}
                    {variant ? ` · ${variant}` : ""}
                    {` · ${kind}`} ×{item.quantity}
                  </span>
                  <strong>
                    {formatStorefrontPrice(item.lineTotalPence)}
                  </strong>
                </li>
              );
            })}
          </ul>
          <dl className={styles.totals}>
            <div>
              <dt>Subtotal</dt>
              <dd>{formatStorefrontPrice(order.subtotalPence)}</dd>
            </div>
            {showShipping ? (
              <div>
                <dt>Delivery</dt>
                <dd>{formatStorefrontPrice(order.shippingPence)}</dd>
              </div>
            ) : null}
            <div className={styles.totalsGrand}>
              <dt>Total</dt>
              <dd>{formatStorefrontPrice(order.totalPence)}</dd>
            </div>
          </dl>
          <div className={styles.statusActions}>
            <Link href={PUBLIC_SHOP_PATH} className={styles.purchaseButtonLive}>
              Continue shopping
            </Link>
          </div>
        </div>
      </StorefrontSection>
    </StorefrontShell>
  );
}
