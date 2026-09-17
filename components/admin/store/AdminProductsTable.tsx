"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
  useTransition,
  type DragEvent,
} from "react";
import {
  moveProductInCatalogueAction,
  reorderProductsInCatalogueAction,
} from "@/app/admin/(console)/store/products/actions";
import styles from "@/app/admin/admin.module.css";
import {
  adminStoreProductEditPath,
  adminStoreProductPreviewPath,
  formatGbpFromPence,
  productStatusLabel,
  productTypeLabel,
  STORE_LOW_STOCK_THRESHOLD,
  type AdminProductListItem,
  type ProductStatus,
} from "@/lib/admin/store";

function statusBadgeClass(status: ProductStatus): string {
  return status === "active" ? styles.badgeOk : styles.badgeSoon;
}

type AdminProductsTableProps = {
  products: AdminProductListItem[];
  canReorder: boolean;
};

export function AdminProductsTable({
  products,
  canReorder,
}: AdminProductsTableProps) {
  const [rows, setRows] = useState(products);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setRows(products);
  }, [products]);

  function persistOrder(nextRows: AdminProductListItem[]) {
    const orderedIds = nextRows.map((row) => row.id);
    startTransition(async () => {
      const result = await reorderProductsInCatalogueAction(orderedIds);
      if (result.error) {
        setError(result.error);
        setRows(products);
        return;
      }
      setError(null);
    });
  }

  function onHandleDragStart(
    index: number,
    event: DragEvent<HTMLButtonElement>
  ) {
    if (!canReorder || isPending) {
      event.preventDefault();
      return;
    }
    setDragIndex(index);
    setOverIndex(index);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  }

  function onDragOver(index: number, event: DragEvent<HTMLTableRowElement>) {
    if (!canReorder || dragIndex == null) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (overIndex !== index) setOverIndex(index);
  }

  function onDrop(index: number, event: DragEvent<HTMLTableRowElement>) {
    if (!canReorder || dragIndex == null) return;
    event.preventDefault();
    const from = dragIndex;
    const to = index;
    setDragIndex(null);
    setOverIndex(null);
    if (from === to) return;

    const next = rows.slice();
    const [moved] = next.splice(from, 1);
    if (!moved) return;
    next.splice(to, 0, moved);
    setRows(next);
    persistOrder(next);
  }

  function onDragEnd() {
    setDragIndex(null);
    setOverIndex(null);
  }

  return (
    <div className={styles.tableWrap}>
      {canReorder ? (
        <p className={styles.reorderHint}>
          Drag rows (or use Up / Down) to set Recommended storefront order
          {isPending ? " · Saving…" : ""}.
        </p>
      ) : (
        <p className={styles.reorderHint}>
          Clear search and status filters to drag products into Recommended
          order.
        </p>
      )}
      {error ? <p className={styles.formError}>{error}</p> : null}
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Order</th>
            <th scope="col">Product</th>
            <th scope="col">Status</th>
            <th scope="col">Type</th>
            <th scope="col">Variants</th>
            <th scope="col">From</th>
            <th scope="col">Stock</th>
            <th scope="col">
              <span className={styles.srOnly}>Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((product, index) => {
            const rowClass = [
              canReorder ? styles.draggableRow : "",
              dragIndex === index ? styles.draggingRow : "",
              overIndex === index && dragIndex != null && dragIndex !== index
                ? styles.dragOverRow
                : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <tr
                key={product.id}
                className={rowClass || undefined}
                onDragOver={(event) => onDragOver(index, event)}
                onDrop={(event) => onDrop(index, event)}
              >
                <td className={styles.orderCell}>
                  <div className={styles.orderControls}>
                    {canReorder ? (
                      <button
                        type="button"
                        className={styles.dragHandle}
                        draggable={!isPending}
                        aria-label={`Drag to reorder ${product.title}`}
                        title="Drag to reorder"
                        disabled={isPending}
                        onDragStart={(event) => onHandleDragStart(index, event)}
                        onDragEnd={onDragEnd}
                      >
                        ⋮⋮
                      </button>
                    ) : null}
                    <span className={styles.orderIndex}>#{index + 1}</span>
                    <form action={moveProductInCatalogueAction}>
                      <input
                        type="hidden"
                        name="product_id"
                        value={product.id}
                      />
                      <input type="hidden" name="direction" value="up" />
                      <button
                        type="submit"
                        className={styles.reorderButton}
                        disabled={!canReorder || index === 0 || isPending}
                        title="Move up in Recommended order"
                      >
                        Up
                      </button>
                    </form>
                    <form action={moveProductInCatalogueAction}>
                      <input
                        type="hidden"
                        name="product_id"
                        value={product.id}
                      />
                      <input type="hidden" name="direction" value="down" />
                      <button
                        type="submit"
                        className={styles.reorderButton}
                        disabled={
                          !canReorder ||
                          index === rows.length - 1 ||
                          isPending
                        }
                        title="Move down in Recommended order"
                      >
                        Down
                      </button>
                    </form>
                  </div>
                </td>
                <td className={styles.tablePrimary}>
                  <div className={styles.productCell}>
                    {product.primary_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        className={styles.productThumb}
                        src={product.primary_image_url}
                        alt=""
                        width={40}
                        height={40}
                      />
                    ) : (
                      <span
                        className={styles.productThumbPlaceholder}
                        aria-hidden
                      />
                    )}
                    <div className={styles.tableTitle}>{product.title}</div>
                  </div>
                </td>
                <td className={styles.tableNowrap}>
                  <span className={statusBadgeClass(product.status)}>
                    {productStatusLabel(product.status)}
                  </span>
                </td>
                <td className={styles.tableNowrap}>
                  {productTypeLabel(product.product_type)}
                </td>
                <td className={styles.tableNowrap}>
                  {product.active_variant_count}/{product.variant_count}
                </td>
                <td className={styles.tableNowrap}>
                  {product.min_price_pence == null
                    ? "—"
                    : formatGbpFromPence(product.min_price_pence)}
                </td>
                <td className={styles.tableNowrap}>
                  {product.has_stock_review_required ? (
                    <span
                      className={`${styles.stockBadge} ${styles.stockBadgeReview}`}
                    >
                      Review
                    </span>
                  ) : product.tracked_stock_total == null ? (
                    <span className={styles.stockMeta}>Not tracked</span>
                  ) : product.tracked_stock_total <= 0 ? (
                    <span
                      className={`${styles.stockBadge} ${styles.stockBadgeOut}`}
                    >
                      Out of stock
                    </span>
                  ) : product.tracked_stock_total <=
                    STORE_LOW_STOCK_THRESHOLD ? (
                    <span
                      className={`${styles.stockBadge} ${styles.stockBadgeLow}`}
                    >
                      Low stock · {product.tracked_stock_total}
                    </span>
                  ) : (
                    <span className={styles.stockQty}>
                      {product.tracked_stock_total} in stock
                    </span>
                  )}
                </td>
                <td className={styles.rowActions}>
                  <div className={styles.productRowActions}>
                    <Link
                      href={adminStoreProductPreviewPath(product.id)}
                      className={styles.rowActionLink}
                    >
                      Preview
                    </Link>
                    <Link
                      href={adminStoreProductEditPath(product.id)}
                      className={styles.rowActionLink}
                    >
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
