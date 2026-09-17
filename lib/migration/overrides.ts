import type { ExtraRule, LedgerOverride } from "@/lib/migration/types";

/**
 * Path-level CSV overrides. Empty after the 17 Sep 2026 approval that made
 * `/shop` → `/collections/all` the inventory row itself (no longer a runtime
 * discrepancy against the CSV).
 */
export const LEDGER_OVERRIDES: LedgerOverride[] = [];

/**
 * Extra one-hop rules that are not Shopify export rows. Kept out of the CSV
 * so the audit file stays frozen; tests assert these are explicit extras.
 */
export const EXTRA_REDIRECTS: ExtraRule[] = [
  {
    path: "/shop/bag",
    action: "301",
    destination: "/cart",
    reason: "Public bag contract is /cart (Phase 2B). Internal /shop/bag is not canonical.",
  },
  {
    path: "/category/news",
    action: "301",
    destination: "/blogs/blog",
    reason: "Phase 1 KJJ alias; one hop to the preserved articles index (not via /news).",
  },
  {
    path: "/terms-and-conditions",
    action: "301",
    destination: "/pages/terms-conditions",
    reason: "KJJ legal slug; closest preserved JJB terms URL.",
  },
];

export const SHOP_RESERVED_SEGMENTS = new Set([
  "bag",
  "checkout",
  "order",
]);
