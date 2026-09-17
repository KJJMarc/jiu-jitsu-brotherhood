"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { ShoppingBagIcon } from "@/components/storefront/icons";
import ProductGallery from "@/components/storefront/ProductGallery";
import ProductPrice, { StockStatus } from "@/components/storefront/ProductPrice";
import QuantityStepper from "@/components/storefront/QuantityStepper";
import VariantSelector from "@/components/storefront/VariantSelector";
import styles from "@/components/storefront/storefront.module.css";
import { ADMIN_STORE_BAG_PATH } from "@/lib/admin/store";
import {
  addToPreviewCartAction,
  type CartActionState,
} from "@/lib/store/cart-actions.server";
import { variantIsPurchasable } from "@/lib/storefront/availability";
import { storefrontProductKindLabel } from "@/lib/storefront/labels";
import { formatStorefrontPrice } from "@/lib/storefront/pricing";
import type { StorefrontProductDetail } from "@/lib/storefront/types";

const initialState: CartActionState = { ok: false, error: null };

type AddToCartAction = (
  prev: CartActionState,
  formData: FormData,
) => Promise<CartActionState>;

function AddButton({ enabled }: { enabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={enabled ? styles.purchaseButtonLive : styles.purchaseButton}
      disabled={!enabled || pending}
      aria-disabled={!enabled || pending}
    >
      {pending ? "Adding…" : enabled ? "Add to bag" : "Out of stock"}
    </button>
  );
}

function maxPurchasableQty(variant: {
  trackInventory: boolean;
  stockQty: number;
} | null): number | null {
  if (!variant) return 1;
  if (!variant.trackInventory) return null;
  return Math.max(0, variant.stockQty);
}

export default function ProductDetail({
  product,
  bagHref = ADMIN_STORE_BAG_PATH,
  addToCartAction = addToPreviewCartAction,
  showDraftBadge = true,
}: {
  product: StorefrontProductDetail;
  bagHref?: string;
  addToCartAction?: AddToCartAction;
  /** Admin preview may show draft badge; public catalogue never lists drafts. */
  showDraftBadge?: boolean;
}) {
  const selectable = useMemo(
    () => product.variants.filter((variant) => variant.isActive),
    [product.variants],
  );

  const defaultVariant =
    selectable.find((variant) => variantIsPurchasable(variant.availability)) ??
    selectable[0] ??
    null;

  const [selectedId, setSelectedId] = useState(defaultVariant?.id ?? "");
  const selected =
    selectable.find((variant) => variant.id === selectedId) ?? defaultVariant;

  const showOptionPicker =
    selectable.length > 1 ||
    (selectable.length === 1 &&
      !["default title", "default", "title"].includes(
        selectable[0].optionValue.toLowerCase(),
      ));

  const purchaseEnabled = selected
    ? variantIsPurchasable(selected.availability)
    : false;

  const stockMax = maxPurchasableQty(selected);
  const [quantity, setQuantity] = useState(1);
  const [state, formAction] = useFormState(addToCartAction, initialState);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const max = maxPurchasableQty(
      selectable.find((variant) => variant.id === selectedId) ?? defaultVariant,
    );
    setQuantity((prev) => {
      if (max == null) return Math.max(1, prev);
      if (max <= 0) return 1;
      return Math.min(Math.max(1, prev), max);
    });
  }, [selectedId, selectable, defaultVariant]);

  useEffect(() => {
    if (!state.ok) {
      setShowSuccess(false);
      return;
    }
    setShowSuccess(true);
    // Refresh server components so the top Shop | Bag count updates.
    router.refresh();
    const timer = window.setTimeout(() => setShowSuccess(false), 3200);
    return () => window.clearTimeout(timer);
  }, [state, router]);

  const bagCount = state.itemCount ?? 0;

  return (
    <div className={styles.detail}>
      <ProductGallery images={product.images} title={product.title} />

      <div className={styles.detailInfo}>
        <header className={styles.detailHeader}>
          <h1>{product.title}</h1>
          {selected ? (
            <p className={styles.detailPrice}>
              {formatStorefrontPrice(selected.pricePence)}
            </p>
          ) : (
            <ProductPrice
              minPricePence={product.minPricePence}
              maxPricePence={product.maxPricePence}
              className={styles.detailPrice}
            />
          )}
          <div className={styles.badgeRow}>
            <span className={styles.badge}>
              {storefrontProductKindLabel({
                productType: product.productType,
                title: product.title,
                slug: product.slug,
              })}
            </span>
            {showDraftBadge && product.status === "draft" ? (
              <span className={`${styles.badge} ${styles.badgeDraft}`}>
                Draft
              </span>
            ) : null}
            {selected ? (
              <StockStatus
                availability={selected.availability}
                tone={
                  selected.availability === "unavailable"
                    ? "muted"
                    : selected.availability === "low_stock"
                      ? "warn"
                      : "ok"
                }
              />
            ) : null}
          </div>
        </header>

        {product.descriptionHtml.trim() ? (
          <div
            className={styles.detailBody}
            dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
          />
        ) : null}

        {showOptionPicker ? (
          <VariantSelector
            optionName={product.optionName || "Size"}
            variants={selectable}
            selectedId={selected?.id ?? null}
            onSelect={setSelectedId}
          />
        ) : null}

        {selected?.sku ? (
          <p className={styles.cardMeta} style={{ marginTop: "0.85rem" }}>
            SKU {selected.sku}
          </p>
        ) : null}

        <p className={styles.shippingNote}>
          {product.productType === "physical"
            ? "Collection and UK delivery will be available at checkout."
            : "No delivery needed."}
        </p>

        <form action={formAction} className={styles.purchasePanel}>
          <input type="hidden" name="variantId" value={selected?.id ?? ""} />
          <div className={styles.qtyField}>
            <span className={styles.qtyLabelText} id="product-qty-label">
              Quantity
            </span>
            <QuantityStepper
              value={quantity}
              min={1}
              max={stockMax && stockMax > 0 ? stockMax : null}
              disabled={!purchaseEnabled}
              onChange={setQuantity}
              labelledBy="product-qty-label"
            />
          </div>
          <AddButton enabled={purchaseEnabled} />
          {state.error ? (
            <p className={styles.formError} role="alert">
              {state.error}
            </p>
          ) : null}
          {state.ok ? (
            <div
              className={`${styles.addSuccess} ${showSuccess ? styles.addSuccessFlash : ""}`}
              role="status"
            >
              {showSuccess ? (
                <p className={styles.addSuccessLabel}>✓ Added to bag</p>
              ) : (
                <p className={styles.addSuccessLabelMuted}>Added to bag</p>
              )}
              <Link href={bagHref} className={styles.addSuccessAction}>
                <ShoppingBagIcon className={styles.addSuccessIcon} />
                <span>View bag ({bagCount})</span>
              </Link>
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}
