import type { Metadata } from "next";
import Link from "next/link";
import PreviewBag from "@/components/storefront/PreviewBag";
import PreviewBagLink from "@/components/storefront/PreviewBagLink";
import StorefrontShell, {
  StorefrontHeader,
  StorefrontPreviewBanner,
  StorefrontSection,
} from "@/components/storefront/StorefrontShell";
import styles from "@/components/storefront/storefront.module.css";
import {
  ADMIN_STORE_CHECKOUT_PATH,
  ADMIN_STORE_ORDERS_PATH,
  ADMIN_STORE_PREVIEW_PATH,
} from "@/lib/admin/store";
import { recoverPreviewCart } from "@/lib/store/cart.server";

export const metadata: Metadata = {
  title: "Bag (preview)",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminStorePreviewBagPage() {
  const { cart, notices } = await recoverPreviewCart();

  return (
    <StorefrontShell
      banner={
        <StorefrontPreviewBanner>
          <span>
            <strong>Admin preview</strong> — private bag (not public).
          </span>
          <nav className={styles.previewBannerNav} aria-label="Preview">
            <Link href={ADMIN_STORE_PREVIEW_PATH}>Catalogue</Link>
            <Link href={ADMIN_STORE_CHECKOUT_PATH}>Checkout</Link>
            <Link href={ADMIN_STORE_ORDERS_PATH}>Orders</Link>
            <PreviewBagLink />
          </nav>
        </StorefrontPreviewBanner>
      }
    >
      <StorefrontHeader
        eyebrow="Shop"
        title="Your bag"
        lead="Admin preview bag — for testing catalogue and checkout flows."
      />
      <StorefrontSection>
        <PreviewBag cart={cart} notices={notices} />
      </StorefrontSection>
    </StorefrontShell>
  );
}
