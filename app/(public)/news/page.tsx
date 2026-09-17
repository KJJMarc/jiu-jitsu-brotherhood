import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { listPublishedPosts, formatDate } from "@/lib/news";
import styles from "@/components/pages.module.css";

export const metadata: Metadata = {
  title: "News",
  description:
    "Club news and events from Kingston Jiu Jitsu — belt promotions, competition results, seminars with Mauricio Gomes and guest instructors, and community updates.",
  alternates: { canonical: "/news/" },
};

export default async function NewsPage() {
  const posts = await listPublishedPosts();

  return (
    <>
      <section className="pagehero">
        <div className="container">
          <p className="eyebrow">Club news</p>
          <h1>News &amp; events</h1>
          <p>
            Belt promotions, competition results, seminars and everything else
            from the Kingston Jiu Jitsu community.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <ul className={styles.newsGrid}>
            {posts.map((p) => (
              <li key={p.slug}>
                <Link href={`/${p.slug}/`} className={styles.newsCard}>
                  <span className={styles.newsMedia}>
                    {p.image ? (
                      <Image
                        src={p.image}
                        alt={p.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
                        className={styles.coverImg}
                      />
                    ) : (
                      <span className={styles.newsPlaceholder} aria-hidden="true">
                        KJJ
                      </span>
                    )}
                  </span>
                  <span className={styles.newsBody}>
                    <span className={styles.newsMeta}>
                      {p.cats[0] || "News"} · {formatDate(p.date)}
                    </span>
                    <span className={styles.newsTitle}>{p.title}</span>
                    {p.excerpt && (
                      <span className={styles.newsExcerpt}>{p.excerpt}</span>
                    )}
                    <span className={styles.newsLink}>Read more →</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
