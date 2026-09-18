import styles from "@/components/storefront/storefront.module.css";

/**
 * Side-effect import so storefront CSS ships in the public layout chunk.
 * Prevents Next.js HMR hash desync from leaving /collections/all unstyled
 * (filters smashed together, full-bleed product images, red Shop|Bag links).
 */
export default function EnsureStorefrontStyles() {
  return (
    <span className={styles.store} hidden aria-hidden="true" />
  );
}
