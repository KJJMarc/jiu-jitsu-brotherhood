import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PreviewBagLink from "@/components/storefront/PreviewBagLink";
import ProductDetail from "@/components/storefront/ProductDetail";
import StorefrontShell, {
  StorefrontPreviewBanner,
  StorefrontSection,
} from "@/components/storefront/StorefrontShell";
import styles from "@/components/storefront/storefront.module.css";
import {
  ADMIN_STORE_PREVIEW_PATH,
  adminStoreProductEditPath,
} from "@/lib/admin/store";
import { getStorefrontPreviewProduct } from "@/lib/storefront/admin-preview.server";

export const metadata: Metadata = {
  title: "Product preview",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminStoreProductPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getStorefrontPreviewProduct(id);
  if (!product) notFound();

  return (
    <StorefrontShell
      banner={
        <StorefrontPreviewBanner>
          <span>
            <strong>Admin preview</strong> — private product page.
          </span>
          <nav className={styles.previewBannerNav} aria-label="Preview">
            <Link href={ADMIN_STORE_PREVIEW_PATH}>Catalogue</Link>
            <Link href={adminStoreProductEditPath(product.id)}>Edit</Link>
            <PreviewBagLink />
          </nav>
        </StorefrontPreviewBanner>
      }
    >
      <StorefrontSection>
        <Link href={ADMIN_STORE_PREVIEW_PATH} className={styles.backLink}>
          ← Back to shop
        </Link>
        <ProductDetail product={product} />
      </StorefrontSection>
    </StorefrontShell>
  );
}
