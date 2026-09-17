"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "@/components/storefront/storefront.module.css";
import {
  STOREFRONT_SORT_LABELS,
  STOREFRONT_SORT_OPTIONS,
  STOREFRONT_TYPE_FILTERS,
  STOREFRONT_TYPE_LABELS,
  storefrontCatalogueQueryToSearchParams,
  type StorefrontCatalogueQuery,
  type StorefrontSortOption,
  type StorefrontTypeFilter,
} from "@/lib/storefront/catalogue";

function hrefFor(
  basePath: string,
  query: StorefrontCatalogueQuery,
  patch: Partial<StorefrontCatalogueQuery>,
): string {
  const params = storefrontCatalogueQueryToSearchParams({ ...query, ...patch });
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export default function CatalogueControls({
  basePath,
  query,
  resultCount,
}: {
  basePath: string;
  query: StorefrontCatalogueQuery;
  resultCount: number;
}) {
  const router = useRouter();

  return (
    <div className={styles.catalogueControls}>
      <div className={styles.catalogueControlGroup}>
        <p className={styles.catalogueControlLabel} id="storefront-type-label">
          Show
        </p>
        <div
          className={styles.catalogueChips}
          role="group"
          aria-labelledby="storefront-type-label"
        >
          {STOREFRONT_TYPE_FILTERS.map((type) => {
            const active = query.type === type;
            return (
              <Link
                key={type}
                href={hrefFor(basePath, query, {
                  type: type as StorefrontTypeFilter,
                })}
                className={
                  active ? styles.catalogueChipActive : styles.catalogueChip
                }
                aria-current={active ? "page" : undefined}
              >
                {STOREFRONT_TYPE_LABELS[type]}
              </Link>
            );
          })}
        </div>
      </div>

      <div className={styles.catalogueControlGroup}>
        <label className={styles.catalogueControlLabel} htmlFor="storefront-sort">
          Sort
        </label>
        <select
          id="storefront-sort"
          className={styles.catalogueSortSelect}
          value={query.sort}
          aria-label="Sort products"
          onChange={(event) => {
            const sort = event.target.value as StorefrontSortOption;
            router.push(hrefFor(basePath, query, { sort }));
          }}
        >
          {STOREFRONT_SORT_OPTIONS.map((sort) => (
            <option key={sort} value={sort}>
              {STOREFRONT_SORT_LABELS[sort as StorefrontSortOption]}
            </option>
          ))}
        </select>
      </div>

      <p className={styles.catalogueResultCount}>
        {resultCount} product{resultCount === 1 ? "" : "s"}
      </p>
    </div>
  );
}
