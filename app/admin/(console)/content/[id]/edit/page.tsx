import { notFound } from "next/navigation";
import Link from "next/link";
import AdminContentEditor from "@/components/admin/content/AdminContentEditor";
import {
  adminContentPreviewPath,
  getAdminContent,
} from "@/lib/content/admin.server";
import styles from "@/app/admin/admin.module.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminContentEditPage({ params }: Props) {
  const { id } = await params;
  let content;
  try {
    content = await getAdminContent(id);
  } catch {
    notFound();
  }
  if (!content) notFound();

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>Content</p>
        <h1>Edit content</h1>
        <p className={styles.lead}>
          <code>{content.canonical_path}</code>
        </p>
        <p>
          <Link
            className={styles.secondaryButtonLink}
            href={adminContentPreviewPath(content.id)}
          >
            Preview
          </Link>
        </p>
      </header>
      <AdminContentEditor mode="edit" content={content} />
    </div>
  );
}
