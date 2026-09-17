import Link from "next/link";
import { ShoppingBagIcon } from "@/components/storefront/icons";
import styles from "@/components/storefront/storefront.module.css";
import { cartItemCount } from "@/lib/store/cart";
import { readPublicCart } from "@/lib/store/cart.server";
import { PUBLIC_SHOP_BAG_PATH } from "@/lib/storefront/paths";

/** Persistent bag link for the public /shop channel. */
export default async function PublicBagLink({
  label = "Bag",
}: {
  label?: string;
}) {
  const cart = await readPublicCart();
  const count = cartItemCount(cart);

  return (
    <Link
      href={PUBLIC_SHOP_BAG_PATH}
      className={styles.bagNavLink}
      aria-label={count > 0 ? `${label}, ${count} items` : label}
    >
      <ShoppingBagIcon className={styles.bagNavIcon} />
      <span>{label}</span>
      {count > 0 ? (
        <span className={styles.bagNavBadge} aria-hidden="true">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
