import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import PreviewCheckoutForm from "@/components/storefront/PreviewCheckoutForm";
import StorefrontShell, {
  StorefrontHeader,
  StorefrontSection,
} from "@/components/storefront/StorefrontShell";
import styles from "@/components/storefront/storefront.module.css";
import { quotePublicCheckout } from "@/lib/store/checkout.server";
import { getPublicShopMollieMode } from "@/lib/store/mollie.server";
import {
  quotePublicCheckoutAction,
  submitPublicCheckoutAction,
} from "@/lib/store/public-checkout-actions.server";
import {
  PUBLIC_SHOP_BAG_PATH,
  PUBLIC_SHOP_PATH,
} from "@/lib/storefront/paths";

export async function generateMetadata(): Promise<Metadata> {
  const mode = getPublicShopMollieMode();
  return {
    title: mode === "live" ? "Checkout" : "Checkout (test)",
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function PublicShopCheckoutPage() {
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
