import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CatalogueControls from "@/components/storefront/CatalogueControls";
import ProductGrid from "@/components/storefront/ProductGrid";
import StorefrontShell, {
  StorefrontHeader,
  StorefrontSection,
  StorefrontShopNavBanner,
} from "@/components/storefront/StorefrontShell";
import styles from "@/components/storefront/storefront.module.css";
import { canonicalAlternate } from "@/lib/canonical";
import { isPreservedPath } from "@/lib/migration/resolve";
import {
  applyStorefrontCatalogueQuery,
  parseStorefrontCatalogueQuery,
  STOREFRONT_SORT_LABELS,
  STOREFRONT_TYPE_LABELS,
} from "@/lib/storefront/catalogue";
import { listPublicStorefrontCatalogue } from "@/lib/storefront/public.server";
import { includeDraftsInPublicShop } from "@/lib/store/shop-gates.server";
import { PUBLIC_SHOP_PATH } from "@/lib/storefront/paths";
import RoutePlaceholder from "@/components/RoutePlaceholder";

type Props = {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ sort?: string; type?: string }>;
};

function collectionPath(handle: string): string {
  return `/collections/${handle}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const path = collectionPath(handle);
  if (!isPreservedPath(path)) {
    return { robots: { index: false, follow: false } };
  }
  const title = handle === "all" ? "Shop" : handle.replace(/-/g, " ");
  const includeDrafts = includeDraftsInPublicShop();
  return {
    title,
    description: "Jiu Jitsu Brotherhood shop.",
    alternates: canonicalAlternate(path),
    robots: includeDrafts
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { handle } = await params;
  const path = collectionPath(handle);
  if (!isPreservedPath(path)) notFound();

  if (handle !== "all") {
    return (
      <RoutePlaceholder
        eyebrow="Shop"
        title={handle.replace(/-/g, " ")}
        body="This historical collection URL is reserved. Browse the full catalogue at /collections/all."
      />
    );
  }

  const paramsQuery = await searchParams;
  const query = parseStorefrontCatalogueQuery(paramsQuery);
  const catalogue = await listPublicStorefrontCatalogue();
  const products = applyStorefrontCatalogueQuery(catalogue, query);
  const includeDrafts = includeDraftsInPublicShop();

  return (
    <StorefrontShell banner={<StorefrontShopNavBanner />}>
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
