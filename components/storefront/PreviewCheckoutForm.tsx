"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import styles from "@/components/storefront/storefront.module.css";
import {
  quotePreviewCheckoutAction,
  submitPreviewCheckoutAction,
  type CheckoutQuoteState,
  type CheckoutSubmitState,
} from "@/lib/store/checkout-actions.server";
import type { CheckoutQuote } from "@/lib/store/checkout.server";
import { formatStorefrontPrice } from "@/lib/storefront/pricing";

const initialSubmit: CheckoutSubmitState = { ok: false, error: null };

type QuoteAction = (input: {
  fulfilmentMethod: string;
}) => Promise<CheckoutQuoteState>;

type SubmitAction = (
  prev: CheckoutSubmitState,
  formData: FormData,
) => Promise<CheckoutSubmitState>;

function PayButton({
  totalPence,
  mollieMode,
  payButtonLabel,
}: {
  totalPence: number;
  mollieMode: "test" | "live";
  payButtonLabel?: string;
}) {
  const { pending } = useFormStatus();
  const amount = formatStorefrontPrice(totalPence);
  const idleLabel =
    payButtonLabel ??
    (mollieMode === "test"
      ? `Pay ${amount} with Mollie (TEST)`
      : `Pay ${amount}`);

  return (
    <button
      type="submit"
      className={styles.purchaseButtonLive}
      disabled={pending || totalPence <= 0}
    >
      {pending ? "Starting Mollie checkout…" : idleLabel}
    </button>
  );
}

export default function PreviewCheckoutForm({
  initialQuote,
  mollieMode = "test",
  quoteAction = quotePreviewCheckoutAction,
  submitAction = submitPreviewCheckoutAction,
  payButtonLabel,
  showMollieTestNote = true,
}: {
  initialQuote: CheckoutQuote;
  /** TEST vs future live — button copy only; keys stay server-side. */
  mollieMode?: "test" | "live";
  quoteAction?: QuoteAction;
  submitAction?: SubmitAction;
  /** Override idle pay button label (e.g. `Pay £X (TEST)`). */
  payButtonLabel?: string;
  showMollieTestNote?: boolean;
}) {
  const hasPhysical = initialQuote.cart.hasPhysical;
  const [fulfilmentMethod, setFulfilmentMethod] = useState(
    initialQuote.fulfilmentMethod ??
      (hasPhysical
        ? initialQuote.collectionEnabled
          ? "collection"
          : "uk_shipping"
        : ""),
  );
  const [shippingPence, setShippingPence] = useState(initialQuote.shippingPence);
  const [totalPence, setTotalPence] = useState(initialQuote.totalPence);
  const [weightGrams, setWeightGrams] = useState(
    initialQuote.shippingQuote?.ok
      ? initialQuote.shippingQuote.totalWeightGrams
      : 0,
  );
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [pendingQuote, startQuote] = useTransition();
  const [submitState, boundSubmit] = useFormState(submitAction, initialSubmit);

  useEffect(() => {
    if (!hasPhysical) return;
    startQuote(async () => {
      const next = await quoteAction({ fulfilmentMethod });
      if (!next.ok) {
        setQuoteError(next.error);
        return;
      }
      setQuoteError(null);
      setShippingPence(next.shippingPence);
      setTotalPence(next.totalPence);
      setWeightGrams(next.totalWeightGrams);
    });
  }, [fulfilmentMethod, hasPhysical, quoteAction]);

  const showAddress = fulfilmentMethod === "uk_shipping";
  const resolvedPayLabel =
    payButtonLabel ??
    (mollieMode === "test"
      ? `Pay ${formatStorefrontPrice(totalPence)} (TEST)`
      : `Pay ${formatStorefrontPrice(totalPence)}`);

  return (
    <form action={boundSubmit} className={styles.checkoutLayout}>
      <div className={styles.checkoutMain}>
        <section className={styles.checkoutSection}>
          <h2>Your details</h2>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              Full name
              <input name="customerName" required autoComplete="name" />
            </label>
            <label className={styles.field}>
              Email
              <input name="customerEmail" type="email" required autoComplete="email" />
            </label>
            <label className={styles.field}>
              Telephone
              <input
                name="customerTelephone"
                type="tel"
                autoComplete="tel"
                required={showAddress}
              />
            </label>
            <label className={`${styles.field} ${styles.fieldFull}`}>
              Order note (optional)
              <textarea name="customerNote" rows={3} />
            </label>
          </div>
        </section>

        {hasPhysical ? (
          <section className={styles.checkoutSection}>
            <h2>Fulfilment</h2>
            <div className={styles.fulfilmentChoices}>
              {initialQuote.collectionEnabled ? (
                <label className={styles.choiceCard}>
                  <input
                    type="radio"
                    name="fulfilmentMethod"
                    value="collection"
                    checked={fulfilmentMethod === "collection"}
                    onChange={() => setFulfilmentMethod("collection")}
                  />
                  <span>
                    <strong>{initialQuote.collectionLabel}</strong>
                    <em>Free</em>
                  </span>
                </label>
              ) : null}
              {initialQuote.ukShippingEnabled ? (
                <label className={styles.choiceCard}>
                  <input
                    type="radio"
                    name="fulfilmentMethod"
                    value="uk_shipping"
                    checked={fulfilmentMethod === "uk_shipping"}
                    onChange={() => setFulfilmentMethod("uk_shipping")}
                  />
                  <span>
                    <strong>UK delivery</strong>
                    <em>
                      {pendingQuote
                        ? "Calculating…"
                        : formatStorefrontPrice(shippingPence)}
                    </em>
                  </span>
                </label>
              ) : null}
            </div>
            {quoteError ? (
              <p className={styles.formError} role="alert">
                {quoteError}
              </p>
            ) : null}
            {showAddress ? (
              <div className={styles.formGrid} style={{ marginTop: "1rem" }}>
                <label className={`${styles.field} ${styles.fieldFull}`}>
                  Address line 1
                  <input name="addressLine1" required autoComplete="address-line1" />
                </label>
                <label className={`${styles.field} ${styles.fieldFull}`}>
                  Address line 2
                  <input name="addressLine2" autoComplete="address-line2" />
                </label>
                <label className={styles.field}>
                  Town / city
                  <input name="addressCity" required autoComplete="address-level2" />
                </label>
                <label className={styles.field}>
                  County
                  <input name="addressCounty" autoComplete="address-level1" />
                </label>
                <label className={styles.field}>
                  Postcode
                  <input name="addressPostcode" required autoComplete="postal-code" />
                </label>
                <label className={styles.field}>
                  Country
                  <input value="United Kingdom" disabled readOnly />
                </label>
              </div>
            ) : (
              <p className={styles.shippingNote}>
                No shipping address needed for collection.
              </p>
            )}
          </section>
        ) : (
          <input type="hidden" name="fulfilmentMethod" value="" />
        )}

        <section className={styles.checkoutSection}>
          <h2>Terms</h2>
          <label className={styles.checkRow}>
            <input type="checkbox" name="termsAccepted" required />
            <span>
              I agree to the{" "}
              <Link href="/pages/terms-conditions" target="_blank">
                Terms &amp; Conditions
              </Link>
              {" "}and{" "}
              <Link href="/delivery-returns" target="_blank">
                Delivery &amp; Returns
              </Link>
              . See our{" "}
              <Link href="/pages/privacy-policy" target="_blank">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
        </section>

        {submitState.error ? (
          <p className={styles.formError} role="alert">
            {submitState.error}
          </p>
        ) : null}

        <PayButton
          totalPence={totalPence}
          mollieMode={mollieMode}
          payButtonLabel={resolvedPayLabel}
        />
      </div>

      <aside className={styles.checkoutSummary}>
        <h2>Bag</h2>
        <ul className={styles.checkoutLines}>
          {initialQuote.cart.lines.map((line) => {
            const detail = [
              line.variantLabel?.trim() || null,
              line.productStatus === "draft" ? "Draft" : null,
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <li key={line.variantId}>
                <span>
                  {line.productTitle}
                  {detail ? ` · ${detail}` : ""} ×{line.quantity}
                </span>
                <strong>{formatStorefrontPrice(line.lineTotalPence)}</strong>
              </li>
            );
          })}
        </ul>
        <dl className={styles.totals}>
          <div>
            <dt>Subtotal</dt>
            <dd>{formatStorefrontPrice(initialQuote.cart.subtotalPence)}</dd>
          </div>
          {hasPhysical ? (
            <div>
              <dt>
                Shipping
                {weightGrams > 0 ? ` (${weightGrams} g)` : ""}
              </dt>
              <dd>
                {fulfilmentMethod === "collection"
                  ? "Free"
                  : formatStorefrontPrice(shippingPence)}
              </dd>
            </div>
          ) : null}
          <div className={styles.totalsGrand}>
            <dt>Total</dt>
            <dd>{formatStorefrontPrice(totalPence)}</dd>
          </div>
        </dl>
        {showMollieTestNote ? (
          <p className={styles.shippingNote}>
            {mollieMode === "live"
              ? "Prices are recalculated server-side before payment."
              : "Mollie TEST mode only. Prices are recalculated server-side before payment."}
          </p>
        ) : (
          <p className={styles.shippingNote}>
            Prices are recalculated server-side before payment.
          </p>
        )}
      </aside>
    </form>
  );
}
