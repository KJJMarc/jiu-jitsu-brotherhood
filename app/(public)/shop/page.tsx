import type { Metadata } from "next";
import CatalogueControls from "@/components/storefront/CatalogueControls";
import ProductGrid from "@/components/storefront/ProductGrid";
import StorefrontShell, {
  StorefrontHeader,
  StorefrontSection,
} from "@/components/storefront/StorefrontShell";
import styles from "@/components/storefront/storefront.module.css";
import { canonicalAlternate } from "@/lib/canonical";
import {
  applyStorefrontCatalogueQuery,
  parseStorefrontCatalogueQuery,
  STOREFRONT_SORT_LABELS,
  STOREFRONT_TYPE_LABELS,
} from "@/lib/storefront/catalogue";
import { listPublicStorefrontCatalogue } from "@/lib/storefront/public.server";
import { includeDraftsInPublicShop } from "@/lib/store/shop-gates.server";
import { PUBLIC_SHOP_PATH } from "@/lib/storefront/paths";

type Props = {
  searchParams: Promise<{ sort?: string; type?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const includeDrafts = includeDraftsInPublicShop();
  return {
    title: "Shop",
    description: "Jiu Jitsu Brotherhood shop.",
    alternates: canonicalAlternate(PUBLIC_SHOP_PATH),
    robots: includeDrafts
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export default async function PublicShopPage({ searchParams }: Props) {
  const paramsQuery = await searchParams;
  const query = parseStorefrontCatalogueQuery(paramsQuery);
  const catalogue = await listPublicStorefrontCatalogue();
  const products = applyStorefrontCatalogueQuery(catalogue, query);
  const includeDrafts = includeDraftsInPublicShop();

  return (
    <StorefrontShell>
      <StorefrontHeader
        eyebrow="Shop"
        title="Shop"
        lead={
          includeDrafts
            ? "Draft catalogue preview — products are not published yet."
            : "Physical products for UK delivery or collection."
        }
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
              ? "No products in the catalogue yet."
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
