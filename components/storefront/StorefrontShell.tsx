import Link from "next/link";
import { ShopNavBagIcon } from "@/components/storefront/icons";
import styles from "@/components/storefront/storefront.module.css";
import { cartItemCount } from "@/lib/store/cart";
import { readPublicCart } from "@/lib/store/cart.server";
import {
  PUBLIC_SHOP_BAG_PATH,
  PUBLIC_SHOP_PATH,
} from "@/lib/storefront/paths";

/** Public-looking storefront chrome (not admin dashboard styling). */
export default function StorefrontShell({
  children,
  banner,
}: {
  children: React.ReactNode;
  banner?: React.ReactNode;
}) {
  return (
    <div className={styles.store}>
      {banner}
      {children}
    </div>
  );
}

/** Matches public pagehero + eyebrow typography from globals.css. */
export function StorefrontHeader({
  eyebrow = "Shop",
  title,
  lead,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
}) {
  return (
    <header className="pagehero">
      <div className="container">
        {/* Same cascade as public pages: .pagehero p → grey-600 (not forced red). */}
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {lead ? <p>{lead}</p> : null}
      </div>
    </header>
  );
}

export function StorefrontPreviewBanner({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.previewBanner}>
      <div className={`container ${styles.previewBannerInner}`}>{children}</div>
    </div>
  );
}

/**
 * Normal shop navigation bar for the live public /shop.
 * Shop | Bag — shows a count badge when the bag has items.
 */
export async function StorefrontShopNavBanner() {
  const cart = await readPublicCart();
  const count = cartItemCount(cart);

  return (
    <div className={styles.shopNavBanner}>
      <div className={`container ${styles.shopNavBannerInner}`}>
        <nav className={styles.shopNav} aria-label="Shop">
          <Link href={PUBLIC_SHOP_PATH}>Shop</Link>
          <span className={styles.shopNavSep} aria-hidden="true">
            |
          </span>
          <Link
            href={PUBLIC_SHOP_BAG_PATH}
            className={styles.shopNavBagLink}
            aria-label={count > 0 ? `Bag, ${count} items` : "Bag"}
          >
            <span>Bag</span>
            <ShopNavBagIcon className={styles.shopNavBagIcon} />
            {count > 0 ? (
              <span className={styles.shopNavBagBadge} aria-hidden="true">
                {count > 99 ? "99+" : count}
              </span>
            ) : null}
          </Link>
        </nav>
      </div>
    </div>
  );
}

/**
 * Payment-mode banner for public /shop.
 * TEST mode shows a clear sandbox warning. LIVE mode renders nothing —
 * use StorefrontShopNavBanner for live navigation instead.
 */
export function StorefrontPaymentModeBanner({
  mode,
  children,
}: {
  mode: "test" | "live";
  children?: React.ReactNode;
}) {
  if (mode === "live") {
    return null;
  }

  return (
    <div className={styles.testModeBanner} role="status">
      <div className={`container ${styles.testModeBannerInner}`}>
        {children ?? (
          <span>
            <strong>TEST MODE</strong> — payments use Mollie test keys. No real
            charges.
          </span>
        )}
      </div>
    </div>
  );
}

/** @deprecated Prefer StorefrontPaymentModeBanner with an explicit mode. */
export function StorefrontTestModeBanner({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <StorefrontPaymentModeBanner mode="test">
      {children}
    </StorefrontPaymentModeBanner>
  );
}

export function StorefrontSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`container ${styles.storeSection}${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}
