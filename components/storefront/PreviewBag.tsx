"use client";

import Link from "next/link";
import StorefrontSafeImage from "@/components/storefront/StorefrontSafeImage";
import { useEffect, useRef, useState, useTransition } from "react";
import { useFormState } from "react-dom";
import QuantityStepper from "@/components/storefront/QuantityStepper";
import styles from "@/components/storefront/storefront.module.css";
import {
  ADMIN_STORE_CHECKOUT_PATH,
  ADMIN_STORE_PREVIEW_PATH,
} from "@/lib/admin/store";
import {
  removePreviewCartLineAction,
  updatePreviewCartQuantityAction,
  type CartActionState,
} from "@/lib/store/cart-actions.server";
import type { ResolvedCart } from "@/lib/store/cart";
import { formatStorefrontPrice } from "@/lib/storefront/pricing";

const initial: CartActionState = { ok: false, error: null };

type CartLineAction = (
  prev: CartActionState,
  formData: FormData,
) => Promise<CartActionState>;

function BagLine({
  line,
  updateAction,
  removeAction,
}: {
  line: ResolvedCart["lines"][number];
  updateAction: CartLineAction;
  removeAction: CartLineAction;
}) {
  const [updateState, boundUpdate] = useFormState(updateAction, initial);
  const [removeState, boundRemove] = useFormState(removeAction, initial);
  const maxQty = line.trackInventory
    ? Math.max(line.stockQty, line.quantity)
    : null;
  const [quantity, setQuantity] = useState(line.quantity);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const skipNextAutoSave = useRef(true);

  useEffect(() => {
    setQuantity(line.quantity);
    skipNextAutoSave.current = true;
  }, [line.quantity, line.variantId]);

  useEffect(() => {
    if (skipNextAutoSave.current) {
      skipNextAutoSave.current = false;
      return;
    }
    if (quantity === line.quantity) return;
    if (!formRef.current) return;
    startTransition(() => {
      formRef.current?.requestSubmit();
    });
  }, [quantity, line.quantity]);

  const metaParts = [
    line.variantLabel?.trim() || null,
    line.productStatus === "draft" ? "Draft" : null,
    line.productType === "non_shipping" ? "Non-physical" : null,
  ].filter(Boolean);

  const lineTotalPence =
    quantity === line.quantity
      ? line.lineTotalPence
      : line.unitPricePence * quantity;

  return (
    <li className={styles.bagLine}>
      <div className={styles.bagLineMedia}>
        <StorefrontSafeImage src={line.imageUrl} alt="" />
      </div>
      <div>
        <div className={styles.bagLineTop}>
          <div>
            <Link href={line.href} className={styles.bagLineTitle}>
              {line.productTitle}
            </Link>
            {metaParts.length > 0 ? (
              <p className={styles.cardMeta}>{metaParts.join(" · ")}</p>
            ) : null}
          </div>
          <p className={styles.bagLinePrice}>
            {formatStorefrontPrice(lineTotalPence)}
          </p>
        </div>
        <div className={styles.bagLineActions}>
          <form
            ref={formRef}
            action={boundUpdate}
            className={styles.bagQtyForm}
          >
            <input type="hidden" name="variantId" value={line.variantId} />
            <div className={styles.qtyFieldInline}>
              <span className={styles.qtyLabelText} id={`qty-${line.variantId}`}>
                Qty
              </span>
              <QuantityStepper
                value={quantity}
                min={1}
                max={maxQty}
                disabled={pending}
                onChange={setQuantity}
                labelledBy={`qty-${line.variantId}`}
              />
            </div>
          </form>
          <form action={boundRemove}>
            <input type="hidden" name="variantId" value={line.variantId} />
            <button type="submit" className={styles.textButtonDanger}>
              Remove
            </button>
          </form>
        </div>
        {pending ? (
          <p className={styles.cardMeta} aria-live="polite">
            Updating…
          </p>
        ) : null}
        {updateState.error || removeState.error ? (
          <p className={styles.formError} role="alert">
            {updateState.error || removeState.error}
          </p>
        ) : null}
      </div>
    </li>
  );
}

export default function PreviewBag({
  cart,
  notices = [],
  catalogueHref = ADMIN_STORE_PREVIEW_PATH,
  checkoutHref = ADMIN_STORE_CHECKOUT_PATH,
  updateQuantityAction = updatePreviewCartQuantityAction,
  removeLineAction = removePreviewCartLineAction,
}: {
  cart: ResolvedCart;
  notices?: string[];
  catalogueHref?: string;
  checkoutHref?: string;
  updateQuantityAction?: CartLineAction;
  removeLineAction?: CartLineAction;
}) {
  const noticeBanner =
    notices.length > 0 ? (
      <div className={styles.bagNotices} role="status">
        <ul>
          {notices.map((notice) => (
            <li key={notice}>{notice}</li>
          ))}
        </ul>
      </div>
    ) : null;

  if (cart.lines.length === 0) {
    return (
      <div className={styles.bagEmpty}>
        {noticeBanner}
        <p>Your bag is empty.</p>
        <Link href={catalogueHref} className={styles.purchaseButtonLive}>
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.bagLayout}>
      {noticeBanner}
      <ul className={styles.bagList}>
        {cart.lines.map((line) => (
          <BagLine
            key={line.variantId}
            line={line}
            updateAction={updateQuantityAction}
            removeAction={removeLineAction}
          />
        ))}
      </ul>
      <aside className={styles.bagSummary}>
        <h2>Order summary</h2>
        <dl className={styles.totals}>
          <div>
            <dt>Subtotal</dt>
            <dd>{formatStorefrontPrice(cart.subtotalPence)}</dd>
          </div>
        </dl>
        <p className={styles.shippingNote}>
          Shipping or collection is calculated at checkout for physical items.
        </p>
        <Link href={checkoutHref} className={styles.purchaseButtonLive}>
          Checkout
        </Link>
        <div style={{ marginTop: "0.75rem" }}>
          <Link href={catalogueHref} className={styles.textButton}>
            Continue shopping
          </Link>
        </div>
      </aside>
    </div>
  );
}
