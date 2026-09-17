import type { Metadata } from "next";
import PreviewBag from "@/components/storefront/PreviewBag";
import StorefrontShell, {
  StorefrontHeader,
  StorefrontSection,
  StorefrontShopNavBanner,
} from "@/components/storefront/StorefrontShell";
import { recoverPublicCart } from "@/lib/store/cart.server";
import { getPublicShopMollieMode } from "@/lib/store/mollie.server";
import {
  removePublicCartLineAction,
  updatePublicCartQuantityAction,
} from "@/lib/store/public-cart-actions.server";
import {
  PUBLIC_SHOP_CHECKOUT_PATH,
  PUBLIC_SHOP_PATH,
} from "@/lib/storefront/paths";

export async function generateMetadata(): Promise<Metadata> {
  const mode = getPublicShopMollieMode();
  return {
    title: mode === "live" ? "Your bag" : "Your bag (test)",
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function CartPage() {
  const mode = getPublicShopMollieMode();
  const { cart, notices } = await recoverPublicCart();

  return (
    <StorefrontShell banner={<StorefrontShopNavBanner />}>
      <StorefrontHeader
        eyebrow="Shop"
        title="Your bag"
        lead={
          mode === "live"
            ? "Review your items before checkout."
            : "Mollie TEST checkout only."
        }
      />
      <StorefrontSection>
        <PreviewBag
          cart={cart}
          notices={notices}
          catalogueHref={PUBLIC_SHOP_PATH}
          checkoutHref={PUBLIC_SHOP_CHECKOUT_PATH}
          updateQuantityAction={updatePublicCartQuantityAction}
          removeLineAction={removePublicCartLineAction}
        />
      </StorefrontSection>
    </StorefrontShell>
  );
}
