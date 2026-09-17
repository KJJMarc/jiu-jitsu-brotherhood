# Phase 4A — Public storefront preparation

Architecture notes for the parallel public `/shop` channel. Shopify remains live; Mollie stays TEST.

## Goals

- Prepare a public-looking storefront under `app/(public)/shop/` without cutting over site nav
- Keep admin private preview working with the same components (injectable paths/actions)
- Harden guest order access with hashed tokens (never authorize by order id alone)

## Channels

| Concern | Preview | Public |
| --- | --- | --- |
| Routes | `/admin/store/preview/…` | `/shop/…` |
| Cart cookie | `kjj_store_preview_cart` path `/admin` | `kjj_store_public_cart` path `/shop` |
| Auth | `requireAdmin` | none (guest) |
| Catalogue | Active list; draft PDP via admin product Preview | Active only (draft/archived → null / notFound) |
| DB reads (products) | Authenticated Supabase (admin RLS) | Service-role admin client |
| Checkout subject | Admin user id | Guest cookie `kjj_store_guest_id` path `/shop` |
| Order `created_by` | Admin user id | `null` |
| Mollie redirect | `/admin/store/preview/checkout/return/?order=` | `/shop/checkout/return/?order=&t=` |

## Security model

1. **Catalogue** — public lists/filters `status = active` only
2. **Cart** — cookies are httpOnly, channel-isolated by name + path; prices never trusted from the client
3. **Checkout** — stock/prices recalculated server-side; Mollie TEST key guard blocks `live_` keys
4. **Orders** — RLS remains admin/authenticated; public writes use service role on the server only
5. **Guest confirmation** — `customer_access_token_hash` (SHA-256) stored on `store_orders`; raw 32-byte base64url token issued at create time; verify with timing-safe compare
6. **Email links** — Option A: raw `access_token` in Mollie payment metadata; recovered when sending paid confirmation; omitted if unavailable
7. **SEO** — public `/shop` uses `robots: { index: false }` until cutover

## Key modules

- `lib/store/cart.ts` / `cart.server.ts` — shared cart helpers + channel wrappers
- `lib/store/checkout.server.ts` — shared quote/create with channel
- `lib/store/order-access.server.ts` — token mint/hash/verify + public DTO
- `lib/store/fulfilment-readonly.server.ts` — fulfilment settings without admin session
- `lib/storefront/public.server.ts` — public catalogue / PDP by slug
- `lib/store/public-*-actions.server.ts` — public server actions

## Routes created

- `/shop/` — catalogue
- `/shop/[slug]/` — PDP
- `/shop/bag/` — bag
- `/shop/checkout/` — checkout
- `/shop/checkout/return/` — Mollie return (server sync, then confirm)
- `/shop/order/` — confirmation (`order` + `t`)

## Remaining cutover steps (not done in 4A)

1. Apply migration `20260915120000_store_order_customer_access_token.sql` in production
2. Complete inventory / content go-live checklist
3. Flip Mollie to live only after explicit ops approval (code still blocks `live_` until guard removed)
4. Change `externalLinks.shop` / site nav from Shopify → `/shop/` (explicit decision)
5. Remove TEST banners and `robots: { index: false }`
6. Announce cutover; monitor webhooks, stock, and emails

## Safety locks still in force

- Do not change `externalLinks.shop` in `lib/site.ts`
- Do not enable Mollie live keys
- Do not point site nav Shop at `/shop` until cutover
