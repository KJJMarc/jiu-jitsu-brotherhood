/**
 * Customer-facing store errors. Technical provider/DB messages must not leak
 * through checkout or bag actions — log those server-side and show a generic line.
 */

export class StoreCustomerError extends Error {
  readonly customerMessage: string;

  constructor(customerMessage: string) {
    super(customerMessage);
    this.name = "StoreCustomerError";
    this.customerMessage = customerMessage;
  }
}

export function storeCustomerError(message: string): StoreCustomerError {
  return new StoreCustomerError(message);
}

const SAFE_PREFIXES = [
  "Please ",
  "Your ",
  "Choose ",
  "Not enough ",
  "A bag ",
  "A size",
  "Only UK ",
  "Collection ",
  "UK delivery ",
  "This order ",
  "No UK delivery ",
  "You must ",
  "Quantity ",
  "Telephone ",
  "Checkout ",
  "Order total ",
  "We could not ",
  "Checkout is ",
] as const;

function looksLikeSafeCustomerMessage(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed || trimmed.length > 280) return false;
  if (/Mollie API|supabase|postgres|JWT|stack|ECONN|fetch failed|permission denied|RLS|PGRST/i.test(trimmed)) {
    return false;
  }
  return SAFE_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
}

export function toCustomerFacingStoreError(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error instanceof StoreCustomerError) {
    return error.customerMessage;
  }
  if (error instanceof Error && looksLikeSafeCustomerMessage(error.message)) {
    return error.message;
  }
  console.error("[store] sanitized customer error", error);
  return fallback;
}
