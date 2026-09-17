import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import PreviewBagLink from "@/components/storefront/PreviewBagLink";
import PreviewCheckoutForm from "@/components/storefront/PreviewCheckoutForm";
import StorefrontShell, {
  StorefrontHeader,
  StorefrontPreviewBanner,
  StorefrontSection,
} from "@/components/storefront/StorefrontShell";
import styles from "@/components/storefront/storefront.module.css";
import {
  ADMIN_STORE_BAG_PATH,
  ADMIN_STORE_PREVIEW_PATH,
} from "@/lib/admin/store";
import { quotePreviewCheckout } from "@/lib/store/checkout.server";

export const metadata: Metadata = {
  title: "Checkout (preview)",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminStorePreviewCheckoutPage() {
  let quote;
  try {
    quote = await quotePreviewCheckout({});
  } catch {
    redirect(ADMIN_STORE_BAG_PATH);
  }

  if (!quote.cart.lines.length) {
    redirect(ADMIN_STORE_BAG_PATH);
  }

  return (
    <StorefrontShell
      banner={
        <StorefrontPreviewBanner>
          <span>
            <strong>Admin preview</strong> — Mollie test checkout only.
          </span>
          <nav className={styles.previewBannerNav} aria-label="Preview">
            <Link href={ADMIN_STORE_PREVIEW_PATH}>Catalogue</Link>
            <PreviewBagLink />
          </nav>
        </StorefrontPreviewBanner>
      }
    >
      <StorefrontHeader
        eyebrow="Shop"
        title="Checkout"
        lead="Admin preview checkout. Payment uses Mollie test mode only."
      />
      <StorefrontSection>
        <Link href={ADMIN_STORE_BAG_PATH} className={styles.backLink}>
          ← Back to bag
        </Link>
        <PreviewCheckoutForm initialQuote={quote} mollieMode="test" />
      </StorefrontSection>
    </StorefrontShell>
  );
}
