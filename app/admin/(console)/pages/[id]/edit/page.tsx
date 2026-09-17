import type { Metadata } from "next";
import { notFound } from "next/navigation";
import styles from "@/app/admin/admin.module.css";
import AdminPageEditor from "@/components/admin/pages/AdminPageEditor";
import { getAdminPage } from "@/lib/admin/pages.server";
import {
  getStaticSitePageHtml,
  isSitePageSlug,
} from "@/lib/site-pages";

export const metadata: Metadata = {
  title: "Edit Page",
};

export default async function AdminEditPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const page = await getAdminPage(id);
  if (!page) notFound();

  const initialBodyHtml =
    page.body_html?.trim() ||
    (isSitePageSlug(page.slug)
      ? getStaticSitePageHtml(page.slug)
      : "<p></p>");

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>Content</p>
        <h1>Edit Page</h1>
        <p className={styles.lead}>
          Update “{page.title}”. Public URL remains <code>/{page.slug}/</code>.
        </p>
      </header>

      <AdminPageEditor page={page} initialBodyHtml={initialBodyHtml} />
    </div>
  );
}
