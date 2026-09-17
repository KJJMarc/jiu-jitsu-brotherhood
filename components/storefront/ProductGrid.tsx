import ProductCard from "@/components/storefront/ProductCard";
import styles from "@/components/storefront/storefront.module.css";
import type { StorefrontProductCard } from "@/lib/storefront/types";

export default function ProductGrid({
  products,
  emptyMessage = "No products to preview yet.",
}: {
  products: StorefrontProductCard[];
  emptyMessage?: string;
}) {
  if (!products.length) {
    return <p className={styles.empty}>{emptyMessage}</p>;
  }

  return (
    <div className={styles.grid}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
