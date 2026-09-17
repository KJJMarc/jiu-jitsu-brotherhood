import Link from "next/link";
import PublicBagLink from "@/components/storefront/PublicBagLink";
import {
  StorefrontPaymentModeBanner,
  StorefrontShopNavBanner,
} from "@/components/storefront/StorefrontShell";
import styles from "@/components/storefront/storefront.module.css";
import { getPublicShopMollieMode } from "@/lib/store/mollie.server";
import {
  PUBLIC_SHOP_BAG_PATH,
  PUBLIC_SHOP_PATH,
} from "@/lib/storefront/paths";

/**
 * Shared /shop chrome: top Shop | Bag banner (with live bag count).
 * Lives in the layout so cart updates can revalidate it consistently.
 */
export default async function PublicShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const mode = getPublicShopMollieMode();

  return (
    <>
      {mode === "test" ? (
        <StorefrontPaymentModeBanner mode="test">
          <span>
            <strong>TEST MODE</strong> — Mollie test payments only.
          </span>
          <nav className={styles.previewBannerNav} aria-label="Shop">
            <Link href={PUBLIC_SHOP_PATH}>Shop</Link>
            <Link href={PUBLIC_SHOP_BAG_PATH}>Bag</Link>
            <PublicBagLink />
          </nav>
        </StorefrontPaymentModeBanner>
      ) : (
        <StorefrontShopNavBanner />
      )}
      {children}
    </>
  );
}
