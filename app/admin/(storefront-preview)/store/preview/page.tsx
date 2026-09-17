import type { Metadata } from "next";
import Link from "next/link";
import CatalogueControls from "@/components/storefront/CatalogueControls";
import PreviewBagLink from "@/components/storefront/PreviewBagLink";
import ProductGrid from "@/components/storefront/ProductGrid";
import StorefrontShell, {
  StorefrontHeader,
  StorefrontPreviewBanner,
  StorefrontSection,
} from "@/components/storefront/StorefrontShell";
import styles from "@/components/storefront/storefront.module.css";
import {
  ADMIN_STORE_PATH,
  ADMIN_STORE_PRODUCTS_PATH,
  ADMIN_STORE_PREVIEW_PATH,
} from "@/lib/admin/store";
import {
  applyStorefrontCatalogueQuery,
  parseStorefrontCatalogueQuery,
  STOREFRONT_SORT_LABELS,
  STOREFRONT_TYPE_LABELS,
} from "@/lib/storefront/catalogue";
import { listStorefrontPreviewCatalogue } from "@/lib/storefront/admin-preview.server";

export const metadata: Metadata = {
  title: "Store preview",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminStoreCataloguePreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; type?: string }>;
}) {
  const params = await searchParams;
  const query = parseStorefrontCatalogueQuery(params);
  const catalogue = await listStorefrontPreviewCatalogue();
  const products = applyStorefrontCatalogueQuery(catalogue, query);

  return (
    <StorefrontShell
      banner={
        <StorefrontPreviewBanner>
          <span>
            <strong>Admin preview</strong> — private catalogue view.
          </span>
          <nav className={styles.previewBannerNav} aria-label="Preview">
            <Link href={ADMIN_STORE_PATH}>Store overview</Link>
            <Link href={ADMIN_STORE_PRODUCTS_PATH}>Products</Link>
            <PreviewBagLink />
          </nav>
        </StorefrontPreviewBanner>
      }
    >
      <StorefrontHeader
        eyebrow="Shop"
        title="Shop"
        lead="Physical products for UK delivery."
      />
      <StorefrontSection>
        <CatalogueControls
          basePath={ADMIN_STORE_PREVIEW_PATH}
          query={query}
          resultCount={products.length}
        />
        <ProductGrid
          products={products}
          emptyMessage={
            catalogue.length === 0
              ? "No published products in the catalogue yet."
              : `No products match ${STOREFRONT_TYPE_LABELS[query.type]} with ${STOREFRONT_SORT_LABELS[query.sort]}.`
          }
        />
        <p className={styles.cardMeta} style={{ paddingBottom: "2rem" }}>
          Showing {products.length} of {catalogue.length} product
          {catalogue.length === 1 ? "" : "s"}.
        </p>
      </StorefrontSection>
    </StorefrontShell>
  );
}
