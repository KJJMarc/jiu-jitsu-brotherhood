import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import StorefrontShell, {
  StorefrontHeader,
  StorefrontPreviewBanner,
  StorefrontSection,
} from "@/components/storefront/StorefrontShell";
import PreviewBagLink from "@/components/storefront/PreviewBagLink";
import styles from "@/components/storefront/storefront.module.css";
import {
  ADMIN_STORE_BAG_PATH,
  ADMIN_STORE_ORDERS_PATH,
  ADMIN_STORE_PREVIEW_PATH,
} from "@/lib/admin/store";
import {
  getStoreOrderDetail,
  syncStoreOrderPayment,
} from "@/lib/store/checkout.server";
import {
  fulfilmentMethodLabel,
  paymentStatusLabel,
} from "@/lib/store/orders";
import { formatStorefrontPrice } from "@/lib/storefront/pricing";

export const metadata: Metadata = {
  title: "Payment return (preview)",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminStorePreviewCheckoutReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const params = await searchParams;
  const orderId = params.order?.trim();
  if (!orderId) notFound();

  // Never trust the browser redirect alone — sync from Mollie server-side.
  try {
    await syncStoreOrderPayment({ orderId, source: "return_sync" });
  } catch {
    // Still show the order page; webhook may complete later.
  }

  const order = await getStoreOrderDetail(orderId);
  if (!order) notFound();

  if (order.payment_status === "paid") {
    redirect(`${ADMIN_STORE_PREVIEW_PATH}order/${order.id}/`);
  }

  const failed =
    order.payment_status === "payment_failed" ||
    order.payment_status === "cancelled";
  const allNonPhysical = order.items.every(
    (item) => item.product_type === "non_shipping",
  );

  return (
    <StorefrontShell
      banner={
        <StorefrontPreviewBanner>
          <span>
            <strong>Admin preview</strong> — payment return (server-verified).
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
        title={failed ? "Payment not completed" : "Confirming payment"}
        lead={
          failed
            ? "Your payment was not completed. No charge was taken and your order is not confirmed."
            : "We’re confirming your payment. This usually only takes a moment — refresh if the status does not update."
        }
      />
      <StorefrontSection>
        <div className={styles.statusPanel}>
          <h2>Order {order.order_number}</h2>
          <p>
            Payment status:{" "}
            <strong>{paymentStatusLabel(order.payment_status)}</strong>
          </p>
          <p>Total: {formatStorefrontPrice(order.total_pence)}</p>
          {allNonPhysical ? (
            <p>No collection or delivery required.</p>
          ) : (
            <p>Fulfilment: {fulfilmentMethodLabel(order.fulfilment_method)}</p>
          )}
          <div className={styles.statusActions}>
            <Link href={ADMIN_STORE_BAG_PATH} className={styles.purchaseButtonLive}>
              Return to bag
            </Link>
          </div>
        </div>
      </StorefrontSection>
    </StorefrontShell>
  );
}
