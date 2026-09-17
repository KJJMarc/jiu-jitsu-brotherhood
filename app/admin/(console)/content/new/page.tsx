import AdminContentEditor from "@/components/admin/content/AdminContentEditor";
import styles from "@/app/admin/admin.module.css";

export default function AdminContentNewPage() {
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>Content</p>
        <h1>New content</h1>
        <p className={styles.lead}>
          Canonical path controls the public URL (Phase 2A SEO contract).
        </p>
      </header>
      <AdminContentEditor mode="create" />
    </div>
  );
}
