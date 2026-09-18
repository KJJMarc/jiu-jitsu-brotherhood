import type { Metadata } from "next";
import Link from "next/link";
import StorefrontShell, {
  StorefrontHeader,
  StorefrontSection,
  StorefrontShopNavBanner,
} from "@/components/storefront/StorefrontShell";
import styles from "@/components/storefront/storefront.module.css";
import {
  CHECKOUT_BLOCKED_MESSAGE,
  isPublicCheckoutEnabled,
} from "@/lib/store/shop-gates.server";
import {
  PUBLIC_SHOP_BAG_PATH,
  PUBLIC_SHOP_PATH,
} from "@/lib/storefront/paths";
import { redirect } from "next/navigation";
import PreviewCheckoutForm from "@/components/storefront/PreviewCheckoutForm";
import { quotePublicCheckout } from "@/lib/store/checkout.server";
import { getPublicShopMollieMode } from "@/lib/store/mollie.server";
import {
  quotePublicCheckoutAction,
  submitPublicCheckoutAction,
} from "@/lib/store/public-checkout-actions.server";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Checkout",
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function PublicShopCheckoutPage() {
  if (!isPublicCheckoutEnabled()) {
    return (
      <StorefrontShell banner={<StorefrontShopNavBanner />}>
        <StorefrontHeader
          eyebrow="Shop"
          title="Checkout unavailable"
          lead={CHECKOUT_BLOCKED_MESSAGE}
        />
        <StorefrontSection>
          <p>
            <Link href={PUBLIC_SHOP_BAG_PATH} className={styles.backLink}>
              ← Back to bag
            </Link>
          </p>
          <p>
            <Link href={PUBLIC_SHOP_PATH} className={styles.textButton}>
              Continue shopping
            </Link>
          </p>
        </StorefrontSection>
      </StorefrontShell>
    );
  }

  const mode = getPublicShopMollieMode();
  let quote;
  try {
    quote = await quotePublicCheckout({});
  } catch {
    redirect(PUBLIC_SHOP_BAG_PATH);
  }

  if (!quote.cart.lines.length) {
    redirect(PUBLIC_SHOP_BAG_PATH);
  }

  return (
    <StorefrontShell>
      <StorefrontHeader
        eyebrow="Shop"
        title="Checkout"
        lead={
          mode === "live"
            ? "Enter your details to complete payment."
            : "Payment uses Mollie TEST mode only."
        }
      />
      <StorefrontSection>
        <Link href={PUBLIC_SHOP_BAG_PATH} className={styles.backLink}>
          ← Back to bag
        </Link>
        <PreviewCheckoutForm
          initialQuote={quote}
          mollieMode={mode}
          quoteAction={quotePublicCheckoutAction}
          submitAction={submitPublicCheckoutAction}
        />
      </StorefrontSection>
    </StorefrontShell>
  );
}
