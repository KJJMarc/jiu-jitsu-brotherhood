import Link from "next/link";
import {
  ADMIN_CONTENT_NEW_PATH,
  adminContentEditPath,
  listAdminContents,
} from "@/lib/content/admin.server";
import type { ContentStatus, ContentType } from "@/lib/content/types";
import styles from "@/app/admin/admin.module.css";

export const dynamic = "force-dynamic";

type Search = Promise<{
  type?: string;
  status?: string;
  q?: string;
}>;

export default async function AdminContentListPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const sp = await searchParams;
  const type = (sp.type as ContentType | "all" | undefined) || "all";
  const status = (sp.status as ContentStatus | "all" | undefined) || "all";
  const q = sp.q || "";

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
        <h1>Editorial</h1>
        <p className={styles.lead}>
          Shared CMS for articles, techniques, past events and pages. Public
          URLs use each row&apos;s canonical path.
        </p>
      </header>

      <section className={styles.panel}>
        <div className={styles.toolbar}>
          <form className={styles.searchForm} method="get">
            <label className={styles.srOnly} htmlFor="content-type">
              Type
            </label>
            <select id="content-type" name="type" defaultValue={type}>
              <option value="all">All types</option>
              <option value="article">Article</option>
              <option value="technique">Technique</option>
              <option value="past_event">Past event</option>
              <option value="page">Page</option>
            </select>
            <label className={styles.srOnly} htmlFor="content-status">
              Status
            </label>
            <select id="content-status" name="status" defaultValue={status}>
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
            href={ADMIN_CONTENT_NEW_PATH}
            className={styles.primaryButtonLink}
          >
            New content
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
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Canonical</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5}>No content rows yet (import not run).</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.title}</td>
                    <td>{row.type}</td>
                    <td>{row.status}</td>
                    <td>
                      <code>{row.canonical_path}</code>
                    </td>
                    <td>
                      <Link href={adminContentEditPath(row.id)}>Edit</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
