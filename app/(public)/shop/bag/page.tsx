import type { Metadata } from "next";
import PreviewBag from "@/components/storefront/PreviewBag";
import StorefrontShell, {
  StorefrontHeader,
  StorefrontSection,
} from "@/components/storefront/StorefrontShell";
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

/** Legacy /shop/bag — same bag as /cart. */
export default async function PublicShopBagPage() {
  const checkoutEnabled = isPublicCheckoutEnabled();
  const { cart, notices } = await recoverPublicCart();

  return (
    <StorefrontShell>
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
      </StorefrontSection>
    </StorefrontShell>
  );
}
