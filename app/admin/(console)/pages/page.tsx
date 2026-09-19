import type { Metadata } from "next";
import Link from "next/link";
import AdminContentTypeList from "@/components/admin/content/AdminContentTypeList";
import {
  ADMIN_RESERVED_PLACEHOLDER_PAGES,
  ADMIN_SYSTEM_PAGES,
} from "@/lib/content/admin-ui";
import { getJjLegalPages } from "@/lib/jjb-legal/pages";
import styles from "@/app/admin/admin.module.css";

export const metadata: Metadata = {
  title: "Pages",
};

export const dynamic = "force-dynamic";

type Search = Promise<{ status?: string; q?: string }>;

export default async function AdminPagesPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const sp = await searchParams;
  const legalPages = getJjLegalPages();

  return (
    <AdminContentTypeList
      type="page"
      status={sp.status}
      q={sp.q}
      extraPanels={
        <>
          <section className={styles.panel}>
            <h2>System pages (code-backed)</h2>
            <p className={styles.lead}>
              These public standalone pages are implemented as React routes.
              They are not stored as CMS <code>page</code> rows and must not be
              duplicated in the contents table.
            </p>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Title</th>
                    <th scope="col">Public path</th>
                    <th scope="col">Source</th>
                    <th scope="col">Editable</th>
                    <th scope="col">
                      <span className={styles.srOnly}>Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ADMIN_SYSTEM_PAGES.map((page) => (
                    <tr key={page.path}>
                      <td className={styles.tablePrimary}>
                        <div className={styles.tableTitle}>{page.title}</div>
                      </td>
                      <td>
                        <code>{page.path}</code>
                      </td>
                      <td className={styles.tableMeta}>{page.source}</td>
                      <td>
                        <span className={styles.badgeSoon}>Read-only</span>
                      </td>
                      <td className={styles.rowActions}>
                        <Link
                          href={page.path}
                          className={styles.rowActionLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View live
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={styles.panel}>
            <h2>Legal pages (file-backed)</h2>
            <p className={styles.lead}>
              Published from{" "}
              <code>content/legal/jjb-website-legal-pages.md</code>. Edit that
              markdown in the repo — do not create CMS duplicates.
            </p>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Title</th>
                    <th scope="col">Public path</th>
                    <th scope="col">Last updated</th>
                    <th scope="col">Editable</th>
                    <th scope="col">
                      <span className={styles.srOnly}>Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {legalPages.map((page) => (
                    <tr key={page.slug}>
                      <td className={styles.tablePrimary}>
                        <div className={styles.tableTitle}>{page.title}</div>
                      </td>
                      <td>
                        <code>{page.path}</code>
                      </td>
                      <td className={styles.tableDate}>
                        {page.lastUpdatedLabel}
                      </td>
                      <td>
                        <span className={styles.badgeSoon}>
                          File-backed
                        </span>
                      </td>
                      <td className={styles.rowActions}>
                        <Link
                          href={page.path}
                          className={styles.rowActionLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View live
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={styles.panel}>
            <h2>Reserved Shopify URLs (placeholder)</h2>
            <p className={styles.lead}>
              These paths are preserved in the migration ledger and render a
              public placeholder until real copy is approved. They are not CMS{" "}
              <code>page</code> rows — do not invent duplicates.
            </p>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Title</th>
                    <th scope="col">Public path</th>
                    <th scope="col">Status</th>
                    <th scope="col">
                      <span className={styles.srOnly}>Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ADMIN_RESERVED_PLACEHOLDER_PAGES.map((page) => (
                    <tr key={page.path}>
                      <td className={styles.tablePrimary}>
                        <div className={styles.tableTitle}>{page.title}</div>
                        <div className={styles.tableMeta}>{page.note}</div>
                      </td>
                      <td>
                        <code>{page.path}</code>
                      </td>
                      <td>
                        <span className={styles.badgeSoon}>Placeholder</span>
                      </td>
                      <td className={styles.rowActions}>
                        <Link
                          href={page.path}
                          className={styles.rowActionLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View live
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      }
    />
  );
}
