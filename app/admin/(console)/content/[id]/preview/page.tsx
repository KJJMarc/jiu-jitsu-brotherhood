import { notFound } from "next/navigation";
import ContentDocument from "@/components/content/ContentDocument";
import { getContentForPreview } from "@/lib/content/admin.server";
import styles from "@/app/admin/admin.module.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

/** Admin-session draft/published preview. Anonymous public routes never use this. */
export default async function AdminContentPreviewPage({ params }: Props) {
  const { id } = await params;
  let content;
  try {
    content = await getContentForPreview(id);
  } catch {
    notFound();
  }
  if (!content) notFound();

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>Preview</p>
        <h1>{content.title}</h1>
        <p className={styles.lead}>
          Status: {content.status}. This is not a public URL.
        </p>
      </header>
      <ContentDocument content={content} />
    </div>
  );
}
