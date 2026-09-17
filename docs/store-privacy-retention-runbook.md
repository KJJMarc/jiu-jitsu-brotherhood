# Store privacy & retention runbook

Internal runbook for Kingston Jiu Jitsu store order data. Manual process only — **no automatic deletion**.

## What we store

- Customer name, email, phone (when provided)
- Shipping address for UK delivery orders
- Order line snapshots (titles, SKUs, prices, quantities)
- Payment status and Mollie payment id / mode
- Guest access token **hash** only (`customer_access_token_hash`) — raw token is not stored in Postgres
- Fulfilment notes and email send timestamps

## Access model

- Admin order views: authenticated admin session only
- Customer self-serve confirmation: order id **plus** unguessable access token (timing-safe hash verify). Never authorize by order id or order number alone
- Public catalogue/cart: service-role reads for products (RLS remains admin-only); cart cookies are channel-isolated (`kjj_store_public_cart` path `/shop` vs preview path `/admin`)

## Retention

- Keep paid orders and related inventory movements for accounting / dispute windows
- Do **not** auto-delete orders, payment events, or inventory movements
- Draft product data is editorial; deletion is an explicit admin action

## Deletion / erasure requests

1. Verify the requester (email match + order number, or other staff-known identity check)
2. Prefer **redaction** over hard delete when stock movements or accounting records must remain:
   - Replace customer name / email / phone / address / note with placeholders (e.g. `[redacted]`)
   - Clear or rotate `customer_access_token_hash` so old confirmation links stop working
3. Hard delete only when legally required **and** after confirming no blocking inventory/accounting dependency
4. Record who actioned the request and when (admin ops note / ticket)

## Emails

- Customer confirmation may include a self-serve `/shop/order/?order=…&t=…` link when Mollie payment metadata still has `access_token`
- If metadata is unavailable, omit the customer link; admin notification still includes the admin order URL

## Contacts

- Ops: admin@kingstonjiujitsu.com
- Escalate payment disputes with Mollie payment id from the admin order page
