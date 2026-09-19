import AdminContentEditor from "@/components/admin/content/AdminContentEditor";
import { CONTENT_TYPES, type ContentType } from "@/lib/content/types";
import { ADMIN_CONTENT_SECTIONS } from "@/lib/content/admin-ui";
import styles from "@/app/admin/admin.module.css";

type Search = Promise<{ type?: string }>;

function resolveType(raw: string | undefined): ContentType {
  if (raw && (CONTENT_TYPES as readonly string[]).includes(raw)) {
    return raw as ContentType;
  }
  return "article";
}

export default async function AdminContentNewPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const sp = await searchParams;
  const type = resolveType(sp.type);
  const section = ADMIN_CONTENT_SECTIONS[type];

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>Content</p>
        <h1>{section.newLabel}</h1>
        <p className={styles.lead}>
          Canonical path controls the public URL. Default pattern for{" "}
          {section.pluralLabel.toLowerCase()} can be overridden when a
          preserved Shopify route must stay in place.
        </p>
      </header>
      <AdminContentEditor mode="create" defaultType={type} lockType />
    </div>
  );
}
