import Link from "next/link";
import { ShoppingBagIcon } from "@/components/storefront/icons";
import styles from "@/components/storefront/storefront.module.css";
import { ADMIN_STORE_BAG_PATH } from "@/lib/admin/store";
import { cartItemCount } from "@/lib/store/cart";
import { readPreviewCart } from "@/lib/store/cart.server";

/** Persistent bag link with outline icon + item-count badge (admin preview). */
export default async function PreviewBagLink({
  label = "Bag",
}: {
  label?: string;
}) {
  const cart = await readPreviewCart();
  const count = cartItemCount(cart);

  return (
    <Link
      href={ADMIN_STORE_BAG_PATH}
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
