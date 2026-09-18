import type { Metadata } from "next";
import Link from "next/link";
import PreviewBag from "@/components/storefront/PreviewBag";
import StorefrontShell, {
  StorefrontHeader,
  StorefrontSection,
  StorefrontShopNavBanner,
} from "@/components/storefront/StorefrontShell";
import styles from "@/components/storefront/storefront.module.css";
import { recoverPublicCart } from "@/lib/store/cart.server";
import {
  removePublicCartLineAction,
  updatePublicCartQuantityAction,
} from "@/lib/store/public-cart-actions.server";
import {
  CHECKOUT_BLOCKED_MESSAGE,
  isPublicCheckoutEnabled,
} from "@/lib/store/shop-gates.server";
import {
  PUBLIC_SHOP_CHECKOUT_PATH,
  PUBLIC_SHOP_PATH,
} from "@/lib/storefront/paths";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Your bag",
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function CartPage() {
  const checkoutEnabled = isPublicCheckoutEnabled();
  const { cart, notices } = await recoverPublicCart();

  return (
    <StorefrontShell banner={<StorefrontShopNavBanner />}>
      <StorefrontHeader
        eyebrow="Shop"
        title="Your bag"
        lead={
          checkoutEnabled
            ? "Review your items before checkout."
            : "Review your items. Checkout is not available yet."
        }
      />
      <StorefrontSection>
        {!checkoutEnabled ? (
          <p className={styles.bagNotices} role="status" style={{ marginBottom: "1rem" }}>
            {CHECKOUT_BLOCKED_MESSAGE}
          </p>
        ) : null}
        <PreviewBag
          cart={cart}
          notices={notices}
          catalogueHref={PUBLIC_SHOP_PATH}
          checkoutHref={checkoutEnabled ? PUBLIC_SHOP_CHECKOUT_PATH : undefined}
          checkoutDisabledMessage={
            checkoutEnabled ? undefined : CHECKOUT_BLOCKED_MESSAGE
          }
          updateQuantityAction={updatePublicCartQuantityAction}
          removeLineAction={removePublicCartLineAction}
        />
        {!checkoutEnabled ? (
          <p className={styles.cardMeta} style={{ marginTop: "1rem" }}>
            <Link href={PUBLIC_SHOP_PATH}>Continue shopping</Link>
          </p>
        ) : null}
      </StorefrontSection>
    </StorefrontShell>
  );
}
