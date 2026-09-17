/**
 * Pure helpers for checkout attempt fingerprinting / paid-stock retry decisions.
 * Kept free of server imports so scripts can exercise them without Next runtime.
 */

export type CartFingerprintItem = {
  variantId: string;
  quantity: number;
};

/** Stable fingerprint of bag contents for duplicate-submit detection. */
export function cartFingerprint(items: CartFingerprintItem[]): string {
  return items
    .map((item) => ({
      variantId: String(item.variantId),
      quantity: Math.floor(Number(item.quantity)),
    }))
    .filter((item) => item.variantId && Number.isInteger(item.quantity) && item.quantity > 0)
    .sort((a, b) => a.variantId.localeCompare(b.variantId))
    .map((item) => `${item.variantId}:${item.quantity}`)
    .join("|");
}

export function checkoutIntentIdempotencyKey(
  userId: string,
  fingerprint: string,
): string {
  return `checkout-intent:${userId}:${fingerprint}`;
}

/**
 * When a payment-event insert is a duplicate, still retry stock if Mollie/order
 * is paid and stock has not been applied yet.
 */
export function shouldRetryPaidStockApplication(order: {
  payment_status: string;
  stock_applied_at: string | null;
}): boolean {
  return order.payment_status === "paid" && order.stock_applied_at == null;
}
