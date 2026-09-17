"use client";

import styles from "@/components/storefront/storefront.module.css";
import { storefrontAvailabilityLabel } from "@/lib/storefront/availability";
import type { StorefrontVariant } from "@/lib/storefront/types";

export default function VariantSelector({
  optionName,
  variants,
  selectedId,
  onSelect,
}: {
  optionName: string;
  variants: StorefrontVariant[];
  selectedId: string | null;
  onSelect: (variantId: string) => void;
}) {
  if (!variants.length) return null;

  return (
    <div>
      <p className={styles.optionLabel}>{optionName || "Option"}</p>
      <div className={styles.variantRow} role="group" aria-label={optionName || "Option"}>
        {variants.map((variant) => {
          const blocked = variant.availability === "unavailable";
          return (
            <button
              key={variant.id}
              type="button"
              className={`${styles.variantChip} ${
                variant.id === selectedId ? styles.variantChipActive : ""
              }`}
              disabled={blocked}
              onClick={() => onSelect(variant.id)}
              aria-pressed={variant.id === selectedId}
              title={storefrontAvailabilityLabel(variant.availability)}
            >
              {variant.optionValue}
            </button>
          );
        })}
      </div>
    </div>
  );
}
