import "server-only";

/**
 * Shop safety gates for the JJB rebuild.
 *
 * Checkout / Mollie stay hard-blocked until explicitly enabled.
 * Draft catalogue browsing can be allowed locally so the storefront
 * can be inspected before products are published.
 */

const CHECKOUT_ENABLED_ENV = "JJB_CHECKOUT_ENABLED";
const INCLUDE_DRAFTS_ENV = "JJB_SHOP_INCLUDE_DRAFTS";

/** True only when JJB_CHECKOUT_ENABLED=true. Default: blocked. */
export function isPublicCheckoutEnabled(): boolean {
  return process.env[CHECKOUT_ENABLED_ENV] === "true";
}

/**
 * Allow draft products on the public catalogue/PDP/bag for local review.
 * Default: on in development, off in production unless explicitly enabled.
 */
export function includeDraftsInPublicShop(): boolean {
  const raw = process.env[INCLUDE_DRAFTS_ENV];
  if (raw === "true") return true;
  if (raw === "false") return false;
  return process.env.NODE_ENV === "development";
}

export function assertPublicCheckoutEnabled(): void {
  if (!isPublicCheckoutEnabled()) {
    throw new Error(
      "Checkout and Mollie payments are disabled until JJB_CHECKOUT_ENABLED=true.",
    );
  }
}

export const CHECKOUT_BLOCKED_MESSAGE =
  "Checkout is not available yet. You can browse products and use your bag, but orders and payments are disabled.";
