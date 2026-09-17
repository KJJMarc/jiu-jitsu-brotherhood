import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/app/admin/admin.module.css";
import {
  adminPageEditPath,
  listAdminPages,
} from "@/lib/admin/pages.server";
import { formatArticleDate } from "@/lib/article-dates";

export const metadata: Metadata = {
  title: "Pages",
};

function formatPublishedAt(value: string | null): string {
  if (!value) return "—";
  try {
    return formatArticleDate(value);
  } catch {
    return value.slice(0, 10);
  }
}

export default async function AdminPagesPage() {
  const { pages, setupRequired, errorMessage } = await listAdminPages();

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>Content</p>
        <h1>Pages</h1>
      </header>

      <section className={styles.panel}>
        {errorMessage ? (
          <p className={styles.placeholderNote}>
            Could not load pages from Supabase: <code>{errorMessage}</code>
            <br />
            If you just created <code>site_pages</code>, also run{" "}
            <code>supabase/migrations/20260912120100_site_pages_grants.sql</code>{" "}
            (table privileges), then refresh.
          </p>
        ) : pages.length === 0 ? (
          <p className={styles.placeholderNote}>
            {setupRequired ? (
              <>
                The <code>site_pages</code> table is not in Supabase yet. Apply
                migration{" "}
                <code>supabase/migrations/20260912120000_site_pages.sql</code>,
                then{" "}
                <code>supabase/migrations/20260912120100_site_pages_grants.sql</code>
                , then refresh this page.
              </>
            ) : (
              <>
                No managed pages found. Re-run the <code>site_pages</code> seed
                insert from the migration, then refresh.
              </>
            )}
          </p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Title</th>
                  <th scope="col">Status</th>
                  <th scope="col">Published</th>
                  <th scope="col">
                    <span className={styles.srOnly}>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => (
                  <tr key={page.id}>
                    <td className={styles.tablePrimary}>
                      <div className={styles.tableTitle}>{page.title}</div>
                      <div className={styles.tableMeta}>/{page.slug}/</div>
                    </td>
                    <td>
                      {page.status === "published" ? (
                        <span className={styles.badgeOk}>Published</span>
                      ) : (
                        <span className={styles.badgeSoon}>Draft</span>
                      )}
                    </td>
                    <td className={styles.tableDate}>
                      {formatPublishedAt(page.published_at)}
                    </td>
                    <td className={styles.rowActions}>
                      <Link
                        href={adminPageEditPath(page.id)}
                        className={styles.rowActionLink}
                      >
                        Edit
                      </Link>
                    </td>
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
