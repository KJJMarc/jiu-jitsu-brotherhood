import Image from "next/image";
import Link from "next/link";
import { formatUkDate, type HomeArticle } from "@/lib/home/prototype";
import styles from "./jjb-home.module.css";

type Props = {
  articles: HomeArticle[];
};

export default function LatestArticles({ articles }: Props) {
  const [lead, ...rest] = articles;
  if (!lead) return null;

  return (
    <section
      className={`${styles.band} ${styles.bandWhite}`}
      aria-labelledby="latest-articles-heading"
    >
      <div className={styles.wide}>
        <div className={styles.headRow}>
          <div>
            <p className={styles.kicker}>Editorial</p>
            <h2 id="latest-articles-heading">Latest articles</h2>
          </div>
          <Link className={styles.textLink} href="/blogs/blog">
            View all articles
          </Link>
        </div>

        <div className={styles.articlesLayout}>
          <Link href={lead.href} className={styles.artFeature}>
            <div className={styles.artFrame}>
              <Image
                src={lead.image.src}
                alt={lead.image.alt}
                fill
                className={styles.artFrameImg}
                sizes="(max-width: 959px) 100vw, 55vw"
                priority
              />
            </div>
            <p className={styles.artMeta}>{formatUkDate(lead.publishedAt)}</p>
            <h3 className={styles.artTitle}>{lead.title}</h3>
            {lead.excerpt ? (
              <p className={styles.artExcerpt}>{lead.excerpt}</p>
            ) : null}
          </Link>

          <ul className={styles.artList}>
            {rest.map((article) => (
              <li key={article.href} className={styles.artListItem}>
                <Link href={article.href}>
                  <div className={styles.artThumb}>
                    <Image
                      src={article.image.src}
                      alt={article.image.alt}
                      width={article.image.width}
                      height={article.image.height}
                      sizes="160px"
                    />
                  </div>
                  <div>
                    <p className={styles.artMeta}>
                      {formatUkDate(article.publishedAt)}
                    </p>
                    <h3 className={styles.artTitleSm}>{article.title}</h3>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
