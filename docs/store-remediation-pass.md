# Store launch remediation pass (pre-cutover)

Scope: targeted fixes only. No public cutover, `/shop` remains private-preview, Mollie TEST-only, Shopify Shop link unchanged.

## Item status

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | 3.3 Cart quantity validation before cookie write | FIXED | Validate stock/availability before writing the preview cart cookie. |
| 2 | 3.8 Invalid/stale cart handling on bag | FIXED | Bag uses `recoverPreviewCart` to drop/clamp bad lines and show notices. |
| 3 | 13.5 Checkout Privacy Policy link | FIXED | Privacy Policy link beside Terms acceptance on preview checkout. |
| 4 | 15.8 Error sanitisation | FIXED | Customer-facing sanitiser; cart/checkout actions no longer return raw provider/DB messages. |
| 5 | 8.8 / 15.6 Paid-stock retry | FIXED | Duplicate sync (`23505`) retries stock apply when paid and `stock_applied_at` is null; RPC stays idempotent. |
| 6 | UK delivery telephone required server-side | FIXED | Server validates UK phone for UK delivery checkout. |
| 7 | Broken product image fallback | FIXED | `StorefrontSafeImage` on card, gallery, and bag. |
| 8 | >20 kg shipping error copy | FIXED | Clear automatic-ship block plus collection/contact guidance. |
| 9 | Admin order customer note | FIXED | Shown on admin order detail when present. |
| 10 | Admin email sent timestamps | FIXED | Customer confirmation + admin notification timestamps on order detail. |
| 11 | Checkout/payment creation idempotency | FIXED | Checkout intent claim + reuse of open Mollie checkout on duplicate submit. |

## Explicitly out of scope (unchanged)

- Public `/shop` cutover
- Mollie LIVE
- DNS / Shopify Shop link
- Resend sender unchanged (`Kingston Jiu Jitsu <noreply@send.kingstonjiujitsu.com>`, Reply-To / admin `admin@kingstonjiujitsu.com`)
- Full inventory reservation system
- Public storefront order-access ACL

## Verification

- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm run build` — pass
- `node --experimental-strip-types scripts/test-store-remediation.mjs` — pass
- `node --experimental-strip-types scripts/test-shipping-calculator.mjs` — pass
