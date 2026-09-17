import type { Metadata } from "next";
import { notFound } from "next/navigation";
import styles from "@/app/admin/admin.module.css";
import AdminArticleEditor from "@/components/admin/articles/AdminArticleEditor";
import { getAdminArticle } from "@/lib/admin/articles.server";
import { listNewsImagePaths } from "@/lib/admin/news-images.server";

export const metadata: Metadata = {
  title: "Edit Article",
};

export default async function AdminEditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [article, imageOptions] = await Promise.all([
    getAdminArticle(id),
    listNewsImagePaths(),
  ]);
  if (!article) notFound();

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>Content</p>
        <h1>Edit Article</h1>
        <p className={styles.lead}>
          Update “{article.title}”. Public URL remains{" "}
          <code>/{article.slug}/</code>.
        </p>
      </header>

      <AdminArticleEditor
        mode="edit"
        article={article}
        imageOptions={imageOptions}
      />
    </div>
  );
}
