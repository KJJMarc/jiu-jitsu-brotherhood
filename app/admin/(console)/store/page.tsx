import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/app/admin/admin.module.css";
import {
  ADMIN_STORE_PREVIEW_PATH,
  ADMIN_STORE_PRODUCTS_NEW_PATH,
  ADMIN_STORE_PRODUCTS_PATH,
  STORE_LOW_STOCK_THRESHOLD,
} from "@/lib/admin/store";
import { getAdminStoreOverview } from "@/lib/admin/store.server";

export const metadata: Metadata = {
  title: "Store",
};

export default async function AdminStoreOverviewPage() {
  const overview = await getAdminStoreOverview();

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>Store</p>
        <h1>Store overview</h1>
        <p className={styles.lead}>
          Catalogue, inventory, orders and fulfilment for the club shop.
        </p>
      </header>

      <section className={styles.statGrid} aria-label="Store stats">
        <article className={styles.statCard}>
          <p className={styles.statLabel}>Active products</p>
          <p className={styles.statValue}>{overview.active_products}</p>
          <p className={styles.statHint}>Visible on the public shop</p>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>Draft products</p>
          <p className={styles.statValue}>{overview.draft_products}</p>
          <p className={styles.statHint}>Not customer-facing</p>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>Low stock</p>
          <p className={styles.statValue}>{overview.low_stock_variants}</p>
          <p className={styles.statHint}>
            Tracked variants ≤ {STORE_LOW_STOCK_THRESHOLD} units
          </p>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>Out of stock</p>
          <p className={styles.statValue}>{overview.out_of_stock_variants}</p>
          <p className={styles.statHint}>Tracked variants at 0</p>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.toolbar}>
          <p className={styles.placeholderNote} style={{ margin: 0 }}>
            Archived products: {overview.archived_products}
          </p>
          <div className={styles.formActions}>
            <Link
              href={ADMIN_STORE_PREVIEW_PATH}
              className={styles.secondaryButtonCompact}
            >
              Preview storefront
            </Link>
            <Link
              href={ADMIN_STORE_PRODUCTS_PATH}
              className={styles.secondaryButtonCompact}
            >
              View products
            </Link>
            <Link
              href={ADMIN_STORE_PRODUCTS_NEW_PATH}
              className={styles.primaryButtonLink}
            >
              Add product
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
