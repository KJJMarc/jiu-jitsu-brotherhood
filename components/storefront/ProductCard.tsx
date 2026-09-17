import Link from "next/link";
import StorefrontSafeImage from "@/components/storefront/StorefrontSafeImage";
import ProductPrice, { StockStatus } from "@/components/storefront/ProductPrice";
import styles from "@/components/storefront/storefront.module.css";
import { storefrontProductKindLabel } from "@/lib/storefront/labels";
import type { StorefrontProductCard } from "@/lib/storefront/types";

export default function ProductCard({
  product,
}: {
  product: StorefrontProductCard;
}) {
  const stockTone =
    product.availability === "unavailable"
      ? "muted"
      : product.availability === "low_stock"
        ? "warn"
        : "ok";

  return (
    <Link href={product.href} className={styles.card}>
      <div className={styles.cardMedia}>
        <StorefrontSafeImage
          src={product.imageUrl}
          alt={product.imageAlt}
        />
      </div>
      <div className={styles.cardBody}>
        <h2 className={styles.cardTitle}>{product.title}</h2>
        <p className={styles.cardMeta}>
          {storefrontProductKindLabel({
            productType: product.productType,
            title: product.title,
            slug: product.slug,
          })}
        </p>
        <ProductPrice
          minPricePence={product.minPricePence}
          maxPricePence={product.maxPricePence}
        />
        <div className={styles.badgeRow}>
          {product.status === "draft" ? (
            <span className={`${styles.badge} ${styles.badgeDraft}`}>Draft</span>
          ) : null}
          <StockStatus availability={product.availability} tone={stockTone} />
        </div>
      </div>
    </Link>
  );
}
