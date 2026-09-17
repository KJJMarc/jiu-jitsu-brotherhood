# Jiu Jitsu Brotherhood rebuild: Stage 4 shop migration

Approved 16 September 2026.

## Shop role

The new JJB website is a content-led standard website with a small UK shop attached. The shop is secondary to Articles, Techniques and the Brotherhood pages. The public shop will sell physical products only. The four existing event-ticket product records will be retained privately as unpublished admin drafts and will not be converted into Past Events content. No digital downloads or legacy courses will be migrated.

## Approved shop categories

1. Gis
2. Rashguards
3. T-Shirts & Hoodies
4. Grappling Gear
5. Belts
6. Patches

Do not reproduce Shopify's 32 collections. Seventeen are empty, and the remainder should redirect to the closest approved category where useful.

## Products to retain

Every retained product should initially be imported as an unpublished draft, even if it is active in Shopify. Existing quantities are migration reference values only and must be checked before publication. Colour-specific products will remain separate rather than being consolidated.

| Product | Existing slug | Category | Variants | Exported stock | Price | Migration action |
| --- | --- | --- | ---: | ---: | ---: | --- |
| Classic Embroidered Badge | `classic-embroidered-badge` | Patches | 1 | 28 | £10.00 | Retain |
| Beast Mode Rashguard | `beast-mode-rashguard` | Rashguards | 5 | 37 | £38.00 | Retain |
| Face Your Fears Rashguard | `face-your-fears-rashguard` | Rashguards | 5 | 2 | £38.00 | Retain; low-stock review |
| Tail-Eater Grappling Shorts | `fight-shorts` | Grappling Gear | 5 | 4 | £34.00 | Retain; low-stock review |
| Jack Johnson vs. Mitsuyo Maeda T-Shirt | `history-on-fire-t-shirt` | T-Shirts & Hoodies | 5 | 20 | £25.00 | Retain |
| Signature Series Jiu Jitsu Hoodie | `signature-series-hooded-sweatshirt` | T-Shirts & Hoodies | 5 | 2 | £38.00 | Retain; low-stock review |
| Open Source Jiu Jitsu Hoodie, Grey | `open-source-jiu-jitsu-hooded-sweatshirt-gray` | T-Shirts & Hoodies | 5 | 2 | £38.00 | Retain separately; low-stock review |
| Open Source Jiu Jitsu Hoodie, Red | `open-source-jiu-jitsu-hooded-sweatshirt-red` | T-Shirts & Hoodies | 5 | 4 | £38.00 | Retain separately; low-stock review |
| Sisterhood Mini Patch | `sisterhood-mini-patch` | Patches | 1 | 68 | £10.00 | Retain |
| Stand Up Eight T-Shirt, Black | `stand-up-eight-t-shirt-black` | T-Shirts & Hoodies | 5 | 24 | £25.00 | Retain |
| Sisterhood Rashguard | `sisterhood-rashguard` | Rashguards | 5 | 15 | £38.00 | Retain |
| Tail Eater Gi Patch | `tail-eater-back-patch` | Patches | 1 | 14 | £15.00 | Retain |
| Tail Eater Rashguard | `tail-eater-rashguard-blue-trim` | Rashguards | 4 | 22 | £38.00 | Retain |
| The Oni Gi | `the-oni-gi` | Gis | 4 | 3 | £115.00 | Retain; low-stock review |
| The Tokugawa Gi | `the-tokugawa-gi` | Gis | 5 | 3 | £115.00 | Retain; low-stock review |
| Musashi Spats | `the-musashi-spats` | Grappling Gear | 5 | 31 | £34.00 | Retain |
| The Gentle Art Rashguard | `the-gentle-art-rashguard` | Rashguards | 6 | 9 | £38.00 | Retain |
| Journey Jiu Jitsu Belts | `journey-bjj-belt` | Belts | 20 | 81 | £15.00 | Retain |
| Future Stars Gi, Blue | `future-stars-gi-blue` | Gis | 6 | 4 | £65.00 | Retain; low-stock review |
| Evolver Classic T-Shirt, Navy | `evolver-classic` | T-Shirts & Hoodies | 5 | 7 | £25.00 | Retain separately |
| The Classic Brotherhood Rashguard | `tail-eater-rashguard-classic-black` | Rashguards | 5 | 29 | £38.00 | Retain |
| Evolver Classic T-Shirt, Red | `evolver-classic-red` | T-Shirts & Hoodies | 5 | 20 | £25.00 | Retain separately |
| Ensō 4.0 Gi, Blue | `enso-4-0-gi-blue` | Gis | 5 | 0 | £100.00 | Retain separately as an unpublished, zero-stock draft |
| Ensō 4.0 Gi, White | `enso-4-0-gi-white` | Gis | 5 | 14 | £100.00 | Retain separately |
| The Astrum Gi | `astrum-gi` | Gis | 5 | 20 | £115.00 | Retain |
| Ensō 4.0 Gi, Black | `enso-4-0-gi-black` | Gis | 5 | 7 | £100.00 | Retain separately |

## Products to remove

These records should not be imported as products:

| Product | Shopify state | Reason | Legacy treatment |
| --- | --- | --- | --- |
| Astrum Rashguard | Draft, zero stock | Discontinued | No redirect required unless the URL has external links |
| Musashi Limited Edition T-Shirt | Draft, zero stock | Discontinued | No redirect required unless the URL has external links |
| Tail-Eater Convertible Kit Bag | Draft, zero stock | Discontinued | No redirect required unless the URL has external links |
| The Seeker T-Shirt | Draft, zero stock | Discontinued | No redirect required unless the URL has external links |
| Sticker Pack | Active, inventory untracked | Product withdrawn by decision | Redirect to `/shop/patches` |

## Event products to retain as drafts

These records should remain available in the admin as unpublished drafts. They must not be purchasable or appear in the permanent shop catalogue, and they should not be converted into Past Events archive content as part of the product migration:

| Product | Existing state | Migration treatment |
| --- | --- | --- |
| Summer Super Seminar 2025 | Draft | Retain as an unpublished draft |
| 2nd Summer Seaside Special Super Seminar | Draft | Retain as an unpublished draft |
| JJB Club Network Adults Competition | Draft | Retain as an unpublished draft |
| JJB Club Network Kids Competition, March 2026 | Active | Import as an unpublished draft |

No event product should be published automatically. If ticket sales are reintroduced, create or update the relevant event deliberately after checking its date, price, capacity and fulfilment settings.

## Product and inventory implementation

- Preserve product descriptions, variant options and retained product media.
- Preserve colour-specific product URLs because the products will remain separate.
- Import existing Shopify quantities as provisional values and set `stock_review_required` on every product.
- Require an administrator to confirm every size quantity before publication.
- Create consistent SKUs during review because only six of the 154 Shopify variants currently have a SKU.
- Preserve an inventory movement history rather than directly overwriting stock without a record.
- Prevent purchase when a variant is out of stock.
- Support safe product archiving and unpublishing rather than destructive deletion.
- Review tax status across all retained products before launch; Shopify's current taxable flags are inconsistent.

## Checkout and fulfilment

- UK sales only at launch.
- Guest checkout with no customer accounts.
- Mollie processes the final payment amount.
- The JJB site owns product prices, stock, shipping rules, discounts, orders and payment-status reconciliation.
- Physical-product shipping only. The retained ticket drafts are non-shipping records and must remain unpublished. Event registration, if reintroduced, should use a distinct non-shipping event flow.
- The 15% military discount is a future feature. Its page remains unpublished until eligibility and discount logic are implemented.

## Migration validation

The 35 Shopify product records must resolve as follows:

- 26 retained physical products, including the zero-stock blue Ensō as an unpublished draft;
- 5 removed products;
- 4 event-ticket products retained as unpublished drafts.

No Shopify product should be left unclassified.
