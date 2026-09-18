import Image from "next/image";
import Link from "next/link";
import type { ArticleIndexPage } from "@/lib/content/public.server";
import styles from "./articles-index.module.css";

type Props = {
  result: ArticleIndexPage;
};

function buildHref(page: number, q: string): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/blogs/blog?${qs}` : "/blogs/blog";
}

export default function ArticlesIndex({ result }: Props) {
  const { items, page, totalPages, total, q } = result;

  return (
    <>
      <section className={styles.hero}>
        <div className="container">
          <h1 className={styles.title}>Articles</h1>
          <form className={styles.search} action="/blogs/blog" method="get" role="search">
            <label className="visually-hidden" htmlFor="articles-search">
              Search articles
            </label>
            <input
              id="articles-search"
              className={styles.searchInput}
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search articles"
              autoComplete="off"
            />
            <button className={styles.searchBtn} type="submit">
              Search
            </button>
          </form>
          {q ? (
            <p className={styles.resultMeta}>
              {total} result{total === 1 ? "" : "s"} for &ldquo;{q}&rdquo;
              {" · "}
              <Link href="/blogs/blog">Clear</Link>
            </p>
          ) : null}
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          {items.length === 0 ? (
            <p className={styles.empty}>No articles matched that search.</p>
          ) : (
            <ul className={styles.grid}>
              {items.map((item) => {
                const src =
                  item.featured_image_url?.trim() ||
                  "/images/jjb/ouroboros-circle-shadow.png";
                const alt = item.featured_image_alt?.trim() || item.title;
                return (
                  <li key={item.id}>
                    <Link href={item.canonical_path} className={styles.card}>
                      <div className={styles.thumb}>
                        <Image
                          src={src}
                          alt={alt}
                          fill
                          sizes="(max-width: 600px) 50vw, (max-width: 1000px) 33vw, 25vw"
                          className={styles.thumbImg}
                        />
                      </div>
                      <h2 className={styles.cardTitle}>{item.title}</h2>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {totalPages > 1 ? (
            <nav className={styles.pager} aria-label="Articles pages">
              {page > 1 ? (
                <Link className={styles.pageLink} href={buildHref(page - 1, q)}>
                  Previous
                </Link>
              ) : (
                <span className={styles.pageDisabled}>Previous</span>
              )}
              <span className={styles.pageStatus}>
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <Link className={styles.pageLink} href={buildHref(page + 1, q)}>
                  Next
                </Link>
              ) : (
                <span className={styles.pageDisabled}>Next</span>
              )}
            </nav>
          ) : null}
        </div>
      </section>
    </>
  );
}
