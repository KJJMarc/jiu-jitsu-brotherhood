import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/app/admin/admin.module.css";
import {
  ADMIN_ARTICLE_NEW_PATH,
  adminArticleEditPath,
  listAdminArticles,
} from "@/lib/admin/articles.server";
import { formatArticleDate } from "@/lib/article-dates";

export const metadata: Metadata = {
  title: "Articles",
};

function formatPublishedAt(value: string | null): string {
  if (!value) return "—";
  try {
    return formatArticleDate(value);
  } catch {
    return value.slice(0, 10);
  }
}

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; dir?: string }>;
}) {
  const { q, dir: dirRaw } = await searchParams;
  const query = q?.trim() ?? "";
  const dir = dirRaw === "asc" ? "asc" : "desc";
  const nextDir = dir === "desc" ? "asc" : "desc";
  const articles = await listAdminArticles(query, dir);

  const sortHref = (() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    params.set("dir", nextDir);
    const qs = params.toString();
    return qs ? `/admin/articles/?${qs}` : "/admin/articles/";
  })();

  const searchActionQuery =
    dir === "asc" ? (
      <input type="hidden" name="dir" value="asc" />
    ) : null;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>Content</p>
        <h1>Articles</h1>
      </header>

      <section className={styles.panel}>
        <div className={styles.toolbar}>
          <form
            className={styles.searchForm}
            method="get"
            action="/admin/articles/"
          >
            {searchActionQuery}
            <label className={styles.srOnly} htmlFor="article-search">
              Search articles
            </label>
            <input
              id="article-search"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Search title or slug"
              className={styles.searchInput}
            />
            <button type="submit" className={styles.secondaryButtonCompact}>
              Search
            </button>
            {query ? (
              <Link
                href={dir === "asc" ? "/admin/articles/?dir=asc" : "/admin/articles/"}
                className={styles.textButton}
              >
                Clear
              </Link>
            ) : null}
          </form>
          <Link
            href={ADMIN_ARTICLE_NEW_PATH}
            className={styles.primaryButtonLink}
          >
            New Article
          </Link>
        </div>

        {articles.length === 0 ? (
          <p className={styles.placeholderNote}>
            {query
              ? `No articles match “${query}”.`
              : "No articles yet. Create the first one."}
          </p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Title</th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <Link
                      href={sortHref}
                      className={styles.sortHeader}
                      aria-label={`Sort by published date, currently ${
                        dir === "desc" ? "newest first" : "oldest first"
                      }. Activate to show ${
                        nextDir === "desc" ? "newest first" : "oldest first"
                      }.`}
                    >
                      Published
                      <span className={styles.sortIndicator} aria-hidden="true">
                        {dir === "desc" ? "↓" : "↑"}
                      </span>
                    </Link>
                  </th>
                  <th scope="col">
                    <span className={styles.srOnly}>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr key={article.id}>
                    <td className={styles.tablePrimary}>
                      <div className={styles.tableTitle}>{article.title}</div>
                      <div className={styles.tableMeta}>/{article.slug}/</div>
                    </td>
                    <td>
                      {article.status === "published" ? (
                        <span className={styles.badgeOk}>Published</span>
                      ) : (
                        <span className={styles.badgeSoon}>Draft</span>
                      )}
                    </td>
                    <td className={styles.tableDate}>
                      {formatPublishedAt(article.published_at)}
                    </td>
                    <td className={styles.rowActions}>
                      <Link
                        href={adminArticleEditPath(article.id)}
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
