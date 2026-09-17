import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "@/app/admin/admin.module.css";
import SitePageView from "@/components/SitePageView";
import {
  adminPageEditPath,
  getAdminPage,
} from "@/lib/admin/pages.server";
import {
  getStaticSitePageHtml,
  isSitePageSlug,
} from "@/lib/site-pages";
import type { PublicSitePage } from "@/lib/site-pages";

export const metadata: Metadata = {
  title: "Preview Page",
};

export default async function AdminPreviewPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const page = await getAdminPage(id);
  if (!page || !isSitePageSlug(page.slug)) notFound();

  const bodyHtml =
    page.body_html?.trim() || getStaticSitePageHtml(page.slug);

  const preview: PublicSitePage = {
    title: page.title,
    slug: page.slug,
    template: page.template,
    eyebrow: page.eyebrow,
    heroLead: page.hero_lead,
    bodyHtml,
    seoTitle: page.seo_title,
    seoDescription: page.seo_description,
    source: "cms",
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>Preview</p>
        <h1>{page.title}</h1>
        <p className={styles.lead}>
          Admin preview of the page body.{" "}
          <Link href={adminPageEditPath(page.id)}>Back to edit</Link>
        </p>
      </header>
      <SitePageView page={preview} />
    </div>
  );
}
