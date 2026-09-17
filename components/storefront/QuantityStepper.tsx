"use client";

import styles from "@/components/storefront/storefront.module.css";

type QuantityStepperProps = {
  name?: string;
  value: number;
  min?: number;
  /** When null/undefined, plus is not stock-capped. */
  max?: number | null;
  disabled?: boolean;
  onChange: (next: number) => void;
  labelledBy?: string;
  id?: string;
};

export default function QuantityStepper({
  name = "quantity",
  value,
  min = 1,
  max = null,
  disabled = false,
  onChange,
  labelledBy,
  id,
}: QuantityStepperProps) {
  const atMin = value <= min;
  const atMax = max != null && value >= max;

  function setQuantity(next: number) {
    let clamped = Math.max(min, Math.floor(next));
    if (max != null) clamped = Math.min(max, clamped);
    if (clamped !== value) onChange(clamped);
  }

  return (
    <div className={styles.qtyStepper} role="group" aria-labelledby={labelledBy}>
      <button
        type="button"
        className={styles.qtyStepperBtn}
        onClick={() => setQuantity(value - 1)}
        disabled={disabled || atMin}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <input
        id={id}
        className={styles.qtyStepperValue}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        name={name}
        value={value}
        disabled={disabled}
        aria-live="polite"
        onChange={(event) => {
          const raw = event.target.value.replace(/\D/g, "");
          if (raw === "") {
            onChange(min);
            return;
          }
          setQuantity(Number(raw));
        }}
        onBlur={() => {
          if (!Number.isInteger(value) || value < min) onChange(min);
        }}
      />
      <button
        type="button"
        className={styles.qtyStepperBtn}
        onClick={() => setQuantity(value + 1)}
        disabled={disabled || atMax}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
