/**
 * Storefront catalogue query helpers.
 *
 * Shared by the private admin preview now and future public /shop routes later.
 * Extend StorefrontCatalogueQuery for best-sellers, collections, and in-stock
 * filters without redesigning the catalogue pipeline.
 */

import type { StorefrontProductCard } from "@/lib/storefront/types";

export const STOREFRONT_SORT_OPTIONS = [
  "recommended",
  "title_asc",
  "title_desc",
  "price_asc",
  "price_desc",
  "newest",
  // Future (requires completed order data): "best_sellers",
] as const;

export type StorefrontSortOption = (typeof STOREFRONT_SORT_OPTIONS)[number];

export const STOREFRONT_TYPE_FILTERS = [
  "all",
  "merchandise",
  "courses_events",
  // Future: collection/category ids via `collectionId`
  // Future: `inStockOnly: boolean`
] as const;

export type StorefrontTypeFilter = (typeof STOREFRONT_TYPE_FILTERS)[number];

export type StorefrontCatalogueQuery = {
  sort: StorefrontSortOption;
  type: StorefrontTypeFilter;
  /** Reserved for future collection/category filtering. */
  collectionId?: string | null;
  /** Reserved for future in-stock-only filtering. */
  inStockOnly?: boolean;
};

export const STOREFRONT_SORT_LABELS: Record<StorefrontSortOption, string> = {
  recommended: "Recommended",
  title_asc: "Alphabetical A–Z",
  title_desc: "Alphabetical Z–A",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  newest: "Newest",
};

export const STOREFRONT_TYPE_LABELS: Record<StorefrontTypeFilter, string> = {
  all: "All",
  merchandise: "Merchandise",
  courses_events: "Classes, courses & events",
};

export function isStorefrontSortOption(value: string): value is StorefrontSortOption {
  return (STOREFRONT_SORT_OPTIONS as readonly string[]).includes(value);
}

export function isStorefrontTypeFilter(value: string): value is StorefrontTypeFilter {
  return (STOREFRONT_TYPE_FILTERS as readonly string[]).includes(value);
}

export function parseStorefrontCatalogueQuery(input: {
  sort?: string | string[] | undefined;
  type?: string | string[] | undefined;
}): StorefrontCatalogueQuery {
  const sortRaw = Array.isArray(input.sort) ? input.sort[0] : input.sort;
  const typeRaw = Array.isArray(input.type) ? input.type[0] : input.type;

  return {
    sort:
      sortRaw && isStorefrontSortOption(sortRaw) ? sortRaw : "recommended",
    type: typeRaw && isStorefrontTypeFilter(typeRaw) ? typeRaw : "all",
    collectionId: null,
    inStockOnly: false,
  };
}

export function storefrontCatalogueQueryToSearchParams(
  query: StorefrontCatalogueQuery,
): URLSearchParams {
  const params = new URLSearchParams();
  if (query.type !== "all") params.set("type", query.type);
  if (query.sort !== "recommended") params.set("sort", query.sort);
  // Future: collectionId / inStockOnly
  return params;
}

function titleKey(title: string): string {
  return title.trim().toLocaleLowerCase("en-GB");
}

function priceKey(product: StorefrontProductCard): number {
  return product.minPricePence ?? Number.POSITIVE_INFINITY;
}

export function filterStorefrontCatalogue(
  products: StorefrontProductCard[],
  query: Pick<StorefrontCatalogueQuery, "type" | "collectionId" | "inStockOnly">,
): StorefrontProductCard[] {
  let next = products;

  if (query.type === "merchandise") {
    next = next.filter((product) => product.productType === "physical");
  } else if (query.type === "courses_events") {
    next = next.filter((product) => product.productType === "non_shipping");
  }

  // Future hooks (intentionally no-ops until data exists):
  // if (query.collectionId) { ... }
  // if (query.inStockOnly) { ... }

  return next;
}

export function sortStorefrontCatalogue(
  products: StorefrontProductCard[],
  sort: StorefrontSortOption,
): StorefrontProductCard[] {
  const next = products.slice();

  switch (sort) {
    case "title_asc":
      next.sort((a, b) => titleKey(a.title).localeCompare(titleKey(b.title), "en-GB"));
      break;
    case "title_desc":
      next.sort((a, b) => titleKey(b.title).localeCompare(titleKey(a.title), "en-GB"));
      break;
    case "price_asc":
      next.sort((a, b) => {
        const diff = priceKey(a) - priceKey(b);
        return diff !== 0 ? diff : titleKey(a.title).localeCompare(titleKey(b.title), "en-GB");
      });
      break;
    case "price_desc":
      next.sort((a, b) => {
        const aPrice = a.minPricePence ?? -1;
        const bPrice = b.minPricePence ?? -1;
        const diff = bPrice - aPrice;
        return diff !== 0 ? diff : titleKey(a.title).localeCompare(titleKey(b.title), "en-GB");
      });
      break;
    case "newest":
      next.sort((a, b) => {
        const diff = b.createdAt.localeCompare(a.createdAt);
        return diff !== 0 ? diff : titleKey(a.title).localeCompare(titleKey(b.title), "en-GB");
      });
      break;
    case "recommended":
    default:
      next.sort((a, b) => {
        const diff = a.sortOrder - b.sortOrder;
        return diff !== 0 ? diff : titleKey(a.title).localeCompare(titleKey(b.title), "en-GB");
      });
      break;
  }

  return next;
}

/** Apply type filter then sort. Default sort is Recommended (manual sort_order). */
export function applyStorefrontCatalogueQuery(
  products: StorefrontProductCard[],
  query: StorefrontCatalogueQuery,
): StorefrontProductCard[] {
  return sortStorefrontCatalogue(
    filterStorefrontCatalogue(products, query),
    query.sort,
  );
}
