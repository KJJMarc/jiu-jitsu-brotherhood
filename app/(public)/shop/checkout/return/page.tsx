import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import StorefrontShell, {
  StorefrontHeader,
  StorefrontSection,
} from "@/components/storefront/StorefrontShell";
import styles from "@/components/storefront/storefront.module.css";
import { syncStoreOrderPayment } from "@/lib/store/checkout.server";
import {
  getPublicCustomerOrderByToken,
} from "@/lib/store/order-access.server";
import { getPublicShopMollieMode } from "@/lib/store/mollie.server";
import {
  fulfilmentMethodLabel,
  paymentStatusLabel,
} from "@/lib/store/orders";
import { formatStorefrontPrice } from "@/lib/storefront/pricing";
import {
  PUBLIC_SHOP_BAG_PATH,
  PUBLIC_SHOP_PATH,
  publicShopOrderPath,
} from "@/lib/storefront/paths";

export const metadata: Metadata = {
  title: "Payment return",
  robots: { index: false, follow: false, nocache: true },
};

export default async function PublicShopCheckoutReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; t?: string }>;
}) {
  const params = await searchParams;
  const orderId = params.order?.trim();
  const token = params.t?.trim();
  if (!orderId || !token) notFound();

  // Never trust the browser redirect alone — sync from Mollie server-side.
  try {
    await syncStoreOrderPayment({ orderId, source: "return_sync" });
  } catch {
    // Still attempt confirmation; webhook may complete later.
  }

  const order = await getPublicCustomerOrderByToken({
    orderId,
    accessToken: token,
  });
  // Wrong/missing token → generic not found (do not leak existence).
  if (!order) notFound();

  if (order.paymentStatus === "paid") {
    redirect(publicShopOrderPath(order.id, token));
  }

  const failed =
    order.paymentStatus === "payment_failed" ||
    order.paymentStatus === "cancelled";
  const allNonPhysical = order.items.every(
    (item) => item.productType === "non_shipping",
  );
  const mode =
    order.mollieMode === "live" || order.mollieMode === "test"
      ? order.mollieMode
      : getPublicShopMollieMode();

  return (
    <StorefrontShell>
      <StorefrontHeader
        eyebrow="Shop"
        title={failed ? "Payment not completed" : "Confirming payment"}
        lead={
          failed
            ? "Your payment was not completed. No charge was taken and your order is not confirmed."
            : "We’re confirming your payment. This usually only takes a moment — refresh if the status does not update."
        }
      />
      <StorefrontSection>
        <div className={styles.statusPanel}>
          <h2>Order {order.orderNumber}</h2>
          <p>
            Payment status:{" "}
            <strong>{paymentStatusLabel(order.paymentStatus)}</strong>
          </p>
          <p>Total: {formatStorefrontPrice(order.totalPence)}</p>
          {allNonPhysical ? (
            <p>No collection or delivery required.</p>
          ) : (
            <p>Fulfilment: {fulfilmentMethodLabel(order.fulfilmentMethod)}</p>
          )}
          {order.mollieMode === "test" ? (
            <p className={styles.shippingNote}>Mollie TEST mode.</p>
          ) : null}
          <div className={styles.statusActions}>
            <Link href={PUBLIC_SHOP_BAG_PATH} className={styles.purchaseButtonLive}>
              Return to bag
            </Link>
          </div>
        </div>
      </StorefrontSection>
    </StorefrontShell>
  );
}
