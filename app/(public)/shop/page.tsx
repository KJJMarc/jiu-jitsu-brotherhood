import type { Metadata } from "next";
import CatalogueControls from "@/components/storefront/CatalogueControls";
import ProductGrid from "@/components/storefront/ProductGrid";
import StorefrontShell, {
  StorefrontHeader,
  StorefrontSection,
} from "@/components/storefront/StorefrontShell";
import styles from "@/components/storefront/storefront.module.css";
import { getPublicShopMollieMode } from "@/lib/store/mollie.server";
import {
  applyStorefrontCatalogueQuery,
  parseStorefrontCatalogueQuery,
  STOREFRONT_SORT_LABELS,
  STOREFRONT_TYPE_LABELS,
} from "@/lib/storefront/catalogue";
import { listPublicStorefrontCatalogue } from "@/lib/storefront/public.server";
import {
  PUBLIC_SHOP_PATH,
} from "@/lib/storefront/paths";

export async function generateMetadata(): Promise<Metadata> {
  const mode = getPublicShopMollieMode();
  return {
    title: mode === "live" ? "Shop" : "Shop (test)",
    description:
      mode === "live"
        ? "Kingston Jiu Jitsu club shop — merchandise, courses and events."
        : "Kingston Jiu Jitsu shop — Mollie TEST mode only.",
    robots:
      mode === "live"
        ? { index: true, follow: true }
        : { index: false, follow: false },
  };
}

export default async function PublicShopCataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; type?: string }>;
}) {
  const params = await searchParams;
  const query = parseStorefrontCatalogueQuery(params);
  const catalogue = await listPublicStorefrontCatalogue();
  const products = applyStorefrontCatalogueQuery(catalogue, query);

  return (
    <StorefrontShell>
      <StorefrontHeader
        eyebrow="Shop"
        title="Kingston Jiu Jitsu Shop"
        lead="Club merchandise, courses and events."
      />
      <StorefrontSection>
        <CatalogueControls
          basePath={PUBLIC_SHOP_PATH}
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
