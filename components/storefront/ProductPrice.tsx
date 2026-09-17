import styles from "@/components/storefront/storefront.module.css";
import { storefrontAvailabilityLabel } from "@/lib/storefront/availability";
import { formatStorefrontPriceRange } from "@/lib/storefront/pricing";
import type { StorefrontAvailability } from "@/lib/storefront/types";

export default function ProductPrice({
  minPricePence,
  maxPricePence,
  className,
}: {
  minPricePence: number | null;
  maxPricePence: number | null;
  className?: string;
}) {
  return (
    <p className={className ?? styles.cardPrice}>
      {formatStorefrontPriceRange(minPricePence, maxPricePence)}
    </p>
  );
}

export function StockStatus({
  availability,
  tone = "muted",
}: {
  availability: StorefrontAvailability;
  tone?: "ok" | "warn" | "muted" | "draft";
}) {
  const toneClass =
    tone === "ok"
      ? styles.badgeOk
      : tone === "warn"
        ? styles.badgeWarn
        : tone === "draft"
          ? styles.badgeDraft
          : styles.badgeMuted;

  return (
    <span className={`${styles.badge} ${toneClass}`}>
      {storefrontAvailabilityLabel(availability)}
    </span>
  );
}
