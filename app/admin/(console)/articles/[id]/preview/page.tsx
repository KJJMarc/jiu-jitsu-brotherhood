import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "@/app/admin/admin.module.css";
import {
  adminArticleEditPath,
  getAdminArticle,
} from "@/lib/admin/articles.server";
import { formatArticleDate } from "@/lib/article-dates";
import { paragraphsToHtml, sanitizeArticleHtml } from "@/lib/rich-text/html";

export const metadata: Metadata = {
  title: "Preview Article",
};

export default async function AdminArticlePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getAdminArticle(id);
  if (!article) notFound();

  const html = sanitizeArticleHtml(
    article.body_html?.trim() || paragraphsToHtml(article.body_paragraphs),
  );

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>Preview</p>
        <h1>{article.title}</h1>
        <p className={styles.lead}>
          Admin preview only — public URL stays <code>/{article.slug}/</code>.
          Status: <strong>{article.status}</strong>
          {article.published_at
            ? ` · ${formatArticleDate(article.published_at)}`
            : ""}
        </p>
        <div className={styles.formActions}>
          <Link
            href={adminArticleEditPath(article.id)}
            className={styles.primaryButtonLink}
          >
            Back to editor
          </Link>
        </div>
      </header>

      <section className={styles.panel}>
        {article.image_path ? (
          <div className={styles.previewHero}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.image_path}
              alt={article.image_alt || article.title}
            />
          </div>
        ) : null}
        {article.excerpt ? (
          <p className={styles.previewExcerpt}>{article.excerpt}</p>
        ) : null}
        <div
          className={styles.previewBody}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {(article.youtube_ids ?? []).length > 0 ? (
          <div className={styles.previewEmbeds}>
            {(article.youtube_ids ?? []).map((ytId) => (
              <div key={ytId} className={styles.previewEmbed}>
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${ytId}`}
                  title={`${article.title} video`}
                  loading="lazy"
                  allowFullScreen
                />
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
