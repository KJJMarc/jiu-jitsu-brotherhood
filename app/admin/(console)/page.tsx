import type { Metadata } from "next";
import styles from "@/app/admin/admin.module.css";
import { AdminGoogleSearchCard } from "@/components/admin/AdminGoogleSearchCard";
import { AdminWebsiteTrafficCard } from "@/components/admin/AdminWebsiteTrafficCard";
import { getAdminArticleCounts } from "@/lib/admin/articles.server";
import { getAdminWebsiteTraffic } from "@/lib/admin/ga4-traffic.server";
import { getAdminSearchConsole } from "@/lib/admin/search-console.server";
import { getAdminStoreOverview } from "@/lib/admin/store.server";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function AdminDashboardPage() {
  const [counts, traffic, search, store] = await Promise.all([
    getAdminArticleCounts(),
    getAdminWebsiteTraffic(),
    getAdminSearchConsole(),
    getAdminStoreOverview(),
  ]);

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>Dashboard</p>
        <h1>Welcome to KJJ Admin</h1>
      </header>

      <section className={styles.statGrid} aria-label="Dashboard stats">
        <article className={styles.statCard}>
          <p className={styles.statLabel}>Published articles</p>
          <p className={styles.statValue}>{counts.published}</p>
          <p className={styles.statHint}>Managed under Content → Articles</p>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statLabel}>Store</p>
          <p className={styles.statValue}>{store.active_products}</p>
          <p className={styles.statHint}>
            Active admin products · {store.draft_products} draft
          </p>
        </article>
      </section>

      <AdminWebsiteTrafficCard traffic={traffic} />
      <AdminGoogleSearchCard search={search} />
    </div>
  );
}
