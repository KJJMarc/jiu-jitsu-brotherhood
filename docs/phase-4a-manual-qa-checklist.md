# Phase 4A — Manual QA checklist (public storefront)

Mollie remains **TEST**. Site nav Shop link must still open Shopify. Do not use live Mollie keys.

## Desktop (Chrome / Safari)

- [ ] `/shop/` loads inside public Header/Footer with a clear **TEST MODE** banner
- [ ] Catalogue lists **active** products only; draft products absent
- [ ] PDP `/shop/{slug}/` works for an active product; draft/archived slug → not found
- [ ] Add to bag → bag count updates; bag cookie is `kjj_store_public_cart` (path `/shop`)
- [ ] Admin preview bag (`/admin/store/preview/bag/`) is unaffected by public bag changes
- [ ] Soft recovery: inactive / overstock lines remove or clamp with notices
- [ ] Checkout quotes collection vs UK shipping; UK delivery requires phone + postcode
- [ ] Pay button reads **Pay £X (TEST)** (or equivalent TEST wording)
- [ ] Mollie TEST checkout opens; return URL includes `order` + `t`
- [ ] Paid order confirmation requires valid `t`; wrong/missing token → generic not found
- [ ] Paid email (if Resend configured) includes customer order link when Mollie metadata has token
- [ ] Site header **Shop** still points at Shopify (`store.kingstonjiujitsu.com`)

## iPhone (Safari)

- [ ] Catalogue / PDP / bag usable without horizontal overflow
- [ ] Quantity steppers and Add to bag work with touch
- [ ] Checkout form fields (especially postcode / tel) usable with iOS keyboards
- [ ] Apple Pay / card options appear in Mollie TEST (device dependent)
- [ ] Return + confirmation pages readable; TEST banner visible
- [ ] Confirmation link from email opens order status with token

## Regression (admin preview)

- [ ] `/admin/store/preview/` still lists active only; product Preview still opens drafts
- [ ] Preview bag / checkout / return / order still work with admin auth
- [ ] Preview cookie remains path `/admin` (`kjj_store_preview_cart`)

## Explicit non-goals for this pass

- [ ] Do **not** enable Mollie live keys
- [ ] Do **not** change `externalLinks.shop` or site nav Shop href
- [ ] Do **not** remove `robots: { index: false }` until cutover
