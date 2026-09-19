import Link from "next/link";
import { listAdminContents } from "@/lib/content/admin.server";
import {
  ADMIN_CONTENT_SECTIONS,
  adminContentEditHref,
  adminContentNewPath,
  hasCustomCanonical,
} from "@/lib/content/admin-ui";
import type { ContentStatus, ContentType } from "@/lib/content/types";
import { formatArticleDate } from "@/lib/article-dates";
import styles from "@/app/admin/admin.module.css";

function formatPublishedAt(value: string | null): string {
  if (!value) return "—";
  try {
    return formatArticleDate(value);
  } catch {
    return value.slice(0, 10);
  }
}

export default async function AdminContentTypeList({
  type,
  status: statusRaw,
  q: qRaw,
  extraPanels,
}: {
  type: ContentType;
  status?: string;
  q?: string;
  extraPanels?: React.ReactNode;
}) {
  const section = ADMIN_CONTENT_SECTIONS[type];
  const status = (statusRaw as ContentStatus | "all" | undefined) || "all";
  const q = qRaw || "";

  let rows: Awaited<ReturnType<typeof listAdminContents>> = [];
  let loadError: string | null = null;
  try {
    rows = await listAdminContents({ type, status, query: q });
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Content list unavailable (is the JJB Supabase project connected?).";
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>Content</p>
        <h1>{section.pluralLabel}</h1>
        <p className={styles.lead}>{section.description}</p>
      </header>

      <section className={styles.panel}>
        <div className={styles.toolbar}>
          <form className={styles.searchForm} method="get">
            <label className={styles.srOnly} htmlFor={`${type}-status`}>
              Status
            </label>
            <select
              id={`${type}-status`}
              name="status"
              defaultValue={status}
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <input
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Search title or handle"
              className={styles.searchInput}
            />
            <button type="submit" className={styles.secondaryButtonCompact}>
              Filter
            </button>
          </form>
          <Link
            href={adminContentNewPath(type)}
            className={styles.primaryButtonLink}
          >
            {section.newLabel}
          </Link>
        </div>

        {loadError ? (
          <p className={styles.lead} role="alert">
            {loadError}
          </p>
        ) : null}

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Status</th>
                <th scope="col">Published</th>
                <th scope="col">Canonical</th>
                <th scope="col">
                  <span className={styles.srOnly}>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    {q || status !== "all"
                      ? "No matching items."
                      : `No ${section.pluralLabel.toLowerCase()} yet.`}
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const custom = hasCustomCanonical(row);
                  return (
                    <tr key={row.id}>
                      <td className={styles.tablePrimary}>
                        <div className={styles.tableTitle}>{row.title}</div>
                        <div className={styles.tableMeta}>{row.handle}</div>
                      </td>
                      <td>
                        {row.status === "published" ? (
                          <span className={styles.badgeOk}>Published</span>
                        ) : row.status === "archived" ? (
                          <span className={styles.badgeSoon}>Archived</span>
                        ) : (
                          <span className={styles.badgeSoon}>Draft</span>
                        )}
                      </td>
                      <td className={styles.tableDate}>
                        {formatPublishedAt(row.published_at)}
                      </td>
                      <td>
                        <code>{row.canonical_path}</code>
                        {custom ? (
                          <>
                            {" "}
                            <span
                              className={styles.badgeSoon}
                              title="This URL does not match the default pattern for this content type (often a preserved Shopify path)."
                            >
                              Custom URL
                            </span>
                          </>
                        ) : null}
                      </td>
                      <td className={styles.rowActions}>
                        <Link
                          href={adminContentEditHref(row.id)}
                          className={styles.rowActionLink}
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {extraPanels}
    </div>
  );
}
