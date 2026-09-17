import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/app/admin/admin.module.css";
import {
  ADMIN_STORE_ORDERS_PATH,
  adminStoreOrderPath,
  formatGbpFromPence,
} from "@/lib/admin/store";
import { listStoreOrders } from "@/lib/store/checkout.server";
import {
  fulfilmentMethodLabel,
  paymentStatusLabel,
  type StorePaymentStatus,
} from "@/lib/store/orders";

export const metadata: Metadata = {
  title: "Orders",
};

const PAYMENT_FILTERS = [
  { value: "all", label: "All payments" },
  { value: "pending_payment", label: "Pending payment" },
  { value: "paid", label: "Paid" },
  { value: "payment_failed", label: "Payment failed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
  { value: "partially_refunded", label: "Partially refunded" },
] as const;

export default async function AdminStoreOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; payment?: string }>;
}) {
  const params = await searchParams;
  const payment = params.payment || "all";
  const q = params.q || "";

  let orders: Awaited<ReturnType<typeof listStoreOrders>> = [];
  let error: string | null = null;
  try {
    orders = await listStoreOrders({
      paymentStatus: payment,
      query: q,
    });
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not load orders.";
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>Store</p>
        <h1>Orders</h1>
        <p className={styles.lead}>
          Customer orders from the public shop, including payment and fulfilment
          status.
        </p>
      </header>

      <form className={styles.toolbar} method="get" action={ADMIN_STORE_ORDERS_PATH}>
        <input
          className={styles.searchInput}
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search order number, email, name"
        />
        <select name="payment" defaultValue={payment} aria-label="Payment status">
          {PAYMENT_FILTERS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button type="submit" className={styles.secondaryButtonCompact}>
          Filter
        </button>
      </form>

      {error ? (
        <p className={styles.formError} role="alert">
          {error} Apply migration{" "}
          <code>20260914080000_store_orders_mollie.sql</code> if tables are
          missing.
        </p>
      ) : null}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Payment</th>
              <th>Fulfilment</th>
              <th>Total</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.tableMeta}>
                  No orders yet.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td className={styles.orderCell}>
                    <Link
                      href={adminStoreOrderPath(order.id)}
                      className={styles.tablePrimaryLink}
                    >
                      {order.order_number}
                    </Link>
                  </td>
                  <td className={styles.tableCustomer}>
                    <span className={styles.tableTitleInline}>
                      {order.customer_name}
                    </span>
                    <span className={styles.tableMetaInline}>
                      {order.customer_email}
                    </span>
                  </td>
                  <td className={styles.tableNowrap}>
                    {paymentStatusLabel(order.payment_status as StorePaymentStatus)}
                  </td>
                  <td className={styles.tableNowrap}>
                    {fulfilmentMethodLabel(order.fulfilment_method)}
                  </td>
                  <td className={styles.tableNowrap}>
                    {formatGbpFromPence(order.total_pence)}
                  </td>
                  <td className={styles.tableDate}>
                    {new Date(order.created_at).toLocaleString("en-GB")}
                  </td>
                  <td className={styles.rowActions}>
                    <Link
                      href={adminStoreOrderPath(order.id)}
                      className={styles.secondaryButtonCompact}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
