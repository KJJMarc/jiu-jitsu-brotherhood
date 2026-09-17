import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "@/app/admin/admin.module.css";
import {
  ADMIN_STORE_ORDERS_PATH,
  formatGbpFromPence,
} from "@/lib/admin/store";
import {
  getStoreOrderDetail,
  listOrderInventoryMovements,
  syncStoreOrderPayment,
} from "@/lib/store/checkout.server";
import {
  fulfilmentMethodLabel,
  fulfilmentStatusLabel,
  paymentStatusLabel,
} from "@/lib/store/orders";

export const metadata: Metadata = {
  title: "Order detail",
};

export default async function AdminStoreOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    await syncStoreOrderPayment({ orderId: id, source: "admin_sync" });
  } catch {
    // Keep showing stored state if Mollie is unreachable in this environment.
  }

  const order = await getStoreOrderDetail(id);
  if (!order) notFound();

  let movements: Awaited<ReturnType<typeof listOrderInventoryMovements>> = [];
  try {
    movements = await listOrderInventoryMovements(id);
  } catch {
    movements = [];
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>Store · Orders</p>
        <h1>{order.order_number}</h1>
        <p className={styles.lead}>
          <Link href={ADMIN_STORE_ORDERS_PATH}>← All orders</Link>
        </p>
      </header>

      <section className={styles.panel}>
        <h2>Payment &amp; fulfilment</h2>
        <p>
          <strong>Payment:</strong> {paymentStatusLabel(order.payment_status)}
        </p>
        <p>
          <strong>Mollie:</strong> {order.mollie_payment_id || "—"}
          {order.mollie_mode ? ` (${order.mollie_mode})` : ""}
        </p>
        <p>
          <strong>Fulfilment:</strong>{" "}
          {fulfilmentMethodLabel(order.fulfilment_method)} ·{" "}
          {fulfilmentStatusLabel(order.fulfilment_status)}
        </p>
        <p>
          <strong>Stock applied:</strong>{" "}
          {order.stock_applied_at
            ? new Date(order.stock_applied_at).toLocaleString("en-GB")
            : "Not applied"}
        </p>
        <p>
          <strong>Terms:</strong> {order.terms_version} ·{" "}
          {new Date(order.terms_accepted_at).toLocaleString("en-GB")}
        </p>
        <p>
          <strong>Customer confirmation email:</strong>{" "}
          {order.customer_confirmation_sent_at
            ? new Date(order.customer_confirmation_sent_at).toLocaleString("en-GB")
            : "Not sent"}
        </p>
        <p>
          <strong>Admin notification email:</strong>{" "}
          {order.admin_notification_sent_at
            ? new Date(order.admin_notification_sent_at).toLocaleString("en-GB")
            : "Not sent"}
        </p>
        <p className={styles.placeholderNote}>
          Refund and fulfilment controls will be added after reviewing Mollie’s
          refund API requirements. Manual payment changes are intentionally
          disabled in this phase.
        </p>
      </section>

      <section className={styles.panel}>
        <h2>Customer</h2>
        <p>
          {order.customer_name}
          <br />
          {order.customer_email}
          <br />
          {order.customer_phone || "No telephone"}
        </p>
        {order.fulfilment_method === "uk_shipping" ? (
          <>
            <h3>Delivery address</h3>
            <p>
              {order.shipping_name}
              <br />
              {order.shipping_line1}
              {order.shipping_line2 ? (
                <>
                  <br />
                  {order.shipping_line2}
                </>
              ) : null}
              <br />
              {order.shipping_city}
              {order.shipping_county ? `, ${order.shipping_county}` : ""}
              <br />
              {order.shipping_postcode}
              <br />
              {order.shipping_country}
            </p>
          </>
        ) : null}
        {order.customer_note ? (
          <>
            <h3>Customer note</h3>
            <p>{order.customer_note}</p>
          </>
        ) : null}
      </section>

      <section className={styles.panel}>
        <h2>Items</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Status</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Line</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className={styles.tableTitle}>{item.product_title}</div>
                    <div className={styles.tableMeta}>
                      {item.variant_label}
                      {item.sku ? ` · SKU ${item.sku}` : ""}
                    </div>
                  </td>
                  <td>{item.product_status}</td>
                  <td>{item.quantity}</td>
                  <td>{formatGbpFromPence(item.unit_price_pence)}</td>
                  <td>{formatGbpFromPence(item.line_total_pence)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Subtotal {formatGbpFromPence(order.subtotal_pence)} · Shipping{" "}
          {formatGbpFromPence(order.shipping_pence)} · Total{" "}
          <strong>{formatGbpFromPence(order.total_pence)}</strong>
        </p>
      </section>

      <section className={styles.panel}>
        <h2>Stock movements</h2>
        {movements.length === 0 ? (
          <p className={styles.placeholderNote}>
            No inventory movements for this order yet (expected until payment is
            confirmed).
          </p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Variant</th>
                  <th>Delta</th>
                  <th>Resulting</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id}>
                    <td className={styles.tableDate}>
                      {new Date(m.created_at).toLocaleString("en-GB")}
                    </td>
                    <td className={styles.tableMeta}>{m.variant_id}</td>
                    <td>{m.quantity_delta}</td>
                    <td>{m.resulting_quantity}</td>
                    <td>{m.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
