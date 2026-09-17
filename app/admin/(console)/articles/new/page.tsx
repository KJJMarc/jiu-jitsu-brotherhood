import type { Metadata } from "next";
import styles from "@/app/admin/admin.module.css";
import AdminArticleEditor from "@/components/admin/articles/AdminArticleEditor";
import { listNewsImagePaths } from "@/lib/admin/news-images.server";

export const metadata: Metadata = {
  title: "New Article",
};

export default async function AdminNewArticlePage() {
  const imageOptions = await listNewsImagePaths();

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>Content</p>
        <h1>New Article</h1>
        <p className={styles.lead}>
          Draft or publish a new article. Choose an existing news image — uploads
          are not enabled yet.
        </p>
      </header>

      <AdminArticleEditor mode="create" imageOptions={imageOptions} />
    </div>
  );
}
