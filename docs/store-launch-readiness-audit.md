# KJJ Store — Launch-readiness audit

**Date:** 14 September 2026  
**Scope:** Complete launch-readiness audit of the replacement Kingston Jiu Jitsu store  
**Mode:** Audit first. Public store, live Mollie, and Shopify were **not** enabled or changed.

**Statuses:** PASS · FAIL · NEEDS REVIEW · NOT APPLICABLE

For every FAIL / NEEDS REVIEW: what is wrong, where, and the smallest safe fix.

---

## Constraints respected

- Existing Shopify shop at `https://store.kingstonjiujitsu.com/` remains the live customer shop (`lib/site.ts` → `externalLinks.shop`).
- Replacement storefront stays under `/admin/store/...` behind admin auth + MFA.
- Mollie remains TEST-only (`test_` keys; `live_` rejected in `lib/store/mollie.server.ts`).

---

## 1. Public / private isolation

| ID | Item | Result |
|----|------|--------|
| 1.1 | No public `/shop` or `/store` App Router storefront | **PASS** — storefront only under `app/admin/(storefront-preview)/store/...` |
| 1.2 | Catalogue / bag / checkout / order require admin | **PASS** — `requireAdmin()` in `app/admin/(storefront-preview)/layout.tsx` (and console layout) |
| 1.3 | Public Shop nav still points at Shopify | **PASS** — Header/Footer use `externalLinks.shop` → live Shopify (HTTP 200) |
| 1.4 | Preview pages are noindex | **PASS** — e.g. preview page `robots: { index: false, follow: false, nocache: true }` |
| 1.5 | RLS blocks anon product/order reads | **PASS** — admin/`is_admin()` policies in `supabase/migrations/20260913070000_store_products.sql` and `20260914080000_store_orders_mollie.sql` |
| 1.6 | No accidental public-store feature flag | **PASS** — no `STORE_PUBLIC` (or equivalent) |
| 1.7 | Unauthenticated store API limited to Mollie webhook | **PASS** — `app/api/store/mollie/webhook/route.ts` only |

### Applied small fix (isolation hygiene)

| Issue | File | Fix |
|-------|------|-----|
| Preview cart cookie used `path: "/"` (would be sent on public pages) | `lib/store/cart.server.ts` | Cookie `path: "/admin"`; delete uses the same path |

### NEEDS REVIEW (not changed)

| Issue | File | Smallest safe fix (later) |
|-------|------|---------------------------|
| Unused `listPublicStorefrontCatalogue()` stub | `lib/storefront/admin-preview.server.ts` | Leave unused until cutover; do not mount a public route without RLS + auth plan |
| Migration plan mentions `/shop/` → Shopify 301; `next.config.mjs` has no `/shop` redirect | `docs/migration-plan.md`, `next.config.mjs` | Optional single 301 `/shop` → Shopify (nav already deep-links Shopify) |

---

## 2. Catalogue & products

| ID | Item | Result |
|----|------|--------|
| 2.1 | Preview catalogue lists active only | **PASS** — preview catalogue helpers filter `status: "active"` |
| 2.2 | Draft handling intentional | **PASS** — drafts via product Preview URL, not shop grid; archived excluded |
| 2.3 | Stock badges / low-stock threshold | **PASS** after fix — `STORE_LOW_STOCK_THRESHOLD = 3` in `lib/admin/store.ts` |
| 2.4 | GBP pricing | **PASS** |
| 2.5 | Product images | **PASS** — Shopify CDN / storage; CSP allows needed hosts |
| 2.6 | Unpurchasable variants blocked | **PASS** — purchasable helper excludes `pending_review` / OOS |

### Applied small fixes

| Issue | File | Fix |
|-------|------|-----|
| Admin overview hint said “≤ 5 units” while threshold is 3 | `app/admin/(console)/store/page.tsx` | Hint uses `STORE_LOW_STOCK_THRESHOLD` |
| `pending_review` labelled “Available” | `lib/storefront/availability.ts` | Label → **“Needs review”** (still non-purchasable) |

---

## 3. Bag / cart

| ID | Item | Result |
|----|------|--------|
| 3.1 | Cart private to preview | **PASS** after cookie path fix — `PREVIEW_CART_COOKIE` + `requireAdmin()` |
| 3.2 | Qty / stock limits | **PASS** |
| 3.3 | Empty bag UX | **PASS** |
| 3.4 | Line / bag totals | **PASS** |

---

## 4. Checkout

| ID | Item | Result |
|----|------|--------|
| 4.1 | Guest-style customer fields | **PASS** — name, email, phone, address for UK shipping |
| 4.2 | Collection vs UK shipping | **PASS** |
| 4.3 | Shipping bands from DB | **PASS** |
| 4.4 | Terms acceptance | **PASS** |
| 4.5 | Order created before Mollie redirect | **PASS** |
| 4.6 | Return URL syncs payment | **PASS** |

---

## 5. Mollie payments

| ID | Item | Result |
|----|------|--------|
| 5.1 | TEST key required; live rejected | **PASS** — rejects `live_` / non-`test_` |
| 5.2 | Webhook + idempotent stock | **PASS** |
| 5.3 | Failed / cancelled / expired | **PASS** |
| 5.4 | No live mode path | **PASS** — code-locked to TEST |

---

## 6. Orders & inventory

| ID | Item | Result |
|----|------|--------|
| 6.1 | Stock only after paid | **PASS** |
| 6.2 | Idempotent stock apply | **PASS** |
| 6.3 | Admin order list/detail | **PASS** |
| 6.4 | Order numbers | **PASS** |

---

## 7. Emails (Resend)

| ID | Item | Result |
|----|------|--------|
| 7.1 | Customer confirmation on paid | **PASS** |
| 7.2 | Admin notification on paid | **PASS** |
| 7.3 | Idempotent send markers | **PASS** |
| 7.4 | Missing Resend API key | **PASS** — warn + skip; payment path continues |

---

## 8. Shipping / fulfilment

| ID | Item | Result |
|----|------|--------|
| 8.1 | UK bands configured and used | **PASS** — including latest heavy band on main |
| 8.2 | Collection free | **PASS** |
| 8.3 | Missing weight fails quote | **PASS** |
| 8.4 | Admin fulfilment editable | **PASS** |

---

## 9. Admin CMS

| ID | Item | Result |
|----|------|--------|
| 9.1 | Product CRUD behind admin | **PASS** |
| 9.2 | MFA (AAL2) required | **PASS** — `requireAdmin()` |
| 9.3 | Orders list/detail | **PASS** |
| 9.4 | No admin deep-links on customer confirmation email | **PASS** |

---

## 10. Cutover readiness (informational)

| ID | Item | Result |
|----|------|--------|
| 10.1 | Public launch blockers | **NOT APPLICABLE** (by design) — still need public routes, careful RLS, live Mollie policy change, nav cutover, SEO, inventory cutover, full QA |
| 10.2 | Shopify still live customer store | **PASS** — confirmed live |

**Public launch is not ready and must not be flipped from this audit.**

---

## Summary

| Result | Notes |
|--------|--------|
| PASS | Majority of checklist |
| FAIL (fixed in this PR) | Low-stock copy mismatch; pending_review label; cart cookie path |
| NEEDS REVIEW (deferred) | Public catalogue stub; optional `/shop` 301 |
| NOT APPLICABLE | Public cutover items (intentionally blocked) |

### Verdict

- **Private admin preview + Mollie TEST:** suitable for continued controlled testing.
- **Public cutover:** **blocked** — isolation is correct; keep Shopify live until an explicit launch project.

### Code changes applied from this audit

1. `app/admin/(console)/store/page.tsx` — low-stock hint bound to `STORE_LOW_STOCK_THRESHOLD`
2. `lib/storefront/availability.ts` — `pending_review` → “Needs review”
3. `lib/store/cart.server.ts` — preview cart cookie scoped to `/admin`
4. `docs/store-launch-readiness-audit.md` — this report

No public store enablement. No live Mollie. No Shopify changes.

---

## Attachment note

The source Word doc (`Please perform a COMPLETE KJJ STORE LAUNCH.docx`) arrived as a short preview image containing the audit preamble and section **1. PUBLIC / PRIVATE ISOLATION** heading. The checklist above covers a complete launch-readiness pass consistent with that preamble and the store’s implemented phases. If the full `.docx` has additional named checklist rows, re-attach the complete file and those rows can be mapped 1:1.
