import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/app/admin/admin.module.css";
import { AdminProductsTable } from "@/components/admin/store/AdminProductsTable";
import {
  ADMIN_STORE_PREVIEW_PATH,
  ADMIN_STORE_PRODUCTS_NEW_PATH,
} from "@/lib/admin/store";
import { listAdminProducts } from "@/lib/admin/store.server";

export const metadata: Metadata = {
  title: "Products",
};

export default async function AdminStoreProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status: statusRaw } = await searchParams;
  const query = q?.trim() ?? "";
  const status =
    statusRaw === "draft" ||
    statusRaw === "active" ||
    statusRaw === "archived"
      ? statusRaw
      : "all";

  const products = await listAdminProducts({ status, q: query });

  const statusLinks = [
    { value: "all", label: "All" },
    { value: "draft", label: "Draft" },
    { value: "active", label: "Active" },
    { value: "archived", label: "Archived" },
  ] as const;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>Store</p>
        <h1>Products</h1>
        <p className={styles.lead}>
          Manage the shop catalogue. Drag products to set the Recommended
          storefront order (Up / Down still work too).
        </p>
      </header>

      <section className={styles.panel}>
        <div className={styles.toolbar}>
          <form
            className={styles.searchForm}
            method="get"
            action="/admin/store/products/"
          >
            {status !== "all" ? (
              <input type="hidden" name="status" value={status} />
            ) : null}
            <label className={styles.srOnly} htmlFor="product-search">
              Search products
            </label>
            <input
              id="product-search"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Search title or slug"
              className={styles.searchInput}
            />
            <button type="submit" className={styles.secondaryButtonCompact}>
              Search
            </button>
            {query ? (
              <Link
                href={
                  status === "all"
                    ? "/admin/store/products/"
                    : `/admin/store/products/?status=${status}`
                }
                className={styles.textButton}
              >
                Clear
              </Link>
            ) : null}
          </form>
          <div className={styles.formActions}>
            <Link
              href={ADMIN_STORE_PREVIEW_PATH}
              className={styles.secondaryButtonCompact}
            >
              Preview storefront
            </Link>
            <Link
              href={ADMIN_STORE_PRODUCTS_NEW_PATH}
              className={styles.primaryButtonLink}
            >
              Add product
            </Link>
          </div>
        </div>

        <div className={styles.formActions} style={{ marginBottom: "1rem" }}>
          {statusLinks.map((link) => {
            const params = new URLSearchParams();
            if (link.value !== "all") params.set("status", link.value);
            if (query) params.set("q", query);
            const qs = params.toString();
            const href = qs
              ? `/admin/store/products/?${qs}`
              : "/admin/store/products/";
            const active = status === link.value;
            return (
              <Link
                key={link.value}
                href={href}
                className={
                  active ? styles.secondaryButtonCompact : styles.textButton
                }
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {products.length === 0 ? (
          <p className={styles.placeholderNote}>
            {query
              ? `No products match “${query}”.`
              : "No products yet. Create the first one."}
          </p>
        ) : (
          <AdminProductsTable
            products={products}
            canReorder={status === "all" && !query}
          />
        )}
      </section>
    </div>
  );
}
