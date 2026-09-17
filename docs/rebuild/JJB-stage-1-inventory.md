# Jiu Jitsu Brotherhood rebuild: Stage 1 inventory

Inventory completed 16 September 2026 from the Shopify Admin GraphQL API, Shopify exports, public sitemaps and the current Editorial theme export.

## Executive conclusion

The migration is viable and the important content is recoverable. The new site should be content-first, with the shop retained as a smaller secondary section using the same operational model as Kingston Jiu Jitsu.

The strongest migration approach is:

1. preserve all 182 published articles and techniques;
2. combine them into one content system with an `article` or `technique` type;
3. simplify the shop from 32 Shopify collections to a small useful catalogue;
4. rebuild only the worthwhile pages and flows;
5. resolve the legacy redirect map before launch;
6. reuse the proven KJJ admin, product, inventory and Mollie patterns where appropriate.

## Recovered inventory

| Area | Recovered | Key finding |
| --- | ---: | --- |
| Pages | 30 | 28 published, 2 hidden |
| Articles and techniques | 183 | 182 published, 1 unpublished draft |
| Blog containers | 6 | Only Articles and Techniques contain published content |
| Products | 35 | 28 active, 7 draft |
| Product variants | 154 | Only 6 variants have SKUs |
| Product media | 158 | Product images and media recovered |
| Collections | 32 | 17 are empty legacy collections |
| Shopify Files | 913 | 911 images and 2 generic files; all marked ready |
| Redirects | 289 | Unique sources, with no chains or loops |
| Navigation menus | 6 | Includes a current menu, an old menu and a customer-account menu |
| Themes | 13 | Editorial is live; most others are historical remnants |
| Locations | 1 | 56 Staunton Road, Kingston upon Thames |
| Recorded active inventory | 470 | Matches the earlier inventory export |

No customer records, order records or payment information were accessed. The migration app has read-only permissions, and its credentials were not included in the export.

## Content library

The content is the strongest part of the existing site and should be the centre of the rebuild.

- 122 published Articles.
- 60 published Techniques.
- One unpublished Technique draft: `heel-hook-details-leigh-remedios`.
- Every record has body content and a featured image.
- 180 of 183 records have summaries.
- All records currently use the generic author name `JJB Admin`.
- 118 embedded iframes and approximately 120 YouTube links will need responsive, sanitised video handling.
- The existing Shopify tags are not a useful editorial taxonomy. Most are shop-style terms such as rashguards, gis, belts and patches, so they should not be imported blindly.

The three records missing summaries are:

- `tripod-sweep-from-the-jelly-guard`
- `the-surprising-health-benefits-of-strength-training`
- `closed-guard-omoplata-fundamentals`

### Recommended content model

Use one content table and one editor, with fields such as:

- title and slug;
- type: article or technique;
- summary;
- rich body content;
- featured image and alt text;
- author;
- editorial categories and tags;
- original publication date;
- draft/published state;
- SEO title and description;
- legacy Shopify URL.

Keep Articles and Techniques as distinct visitor-facing sections, while managing both through the same dashboard.

## Pages

### Keep and rewrite

- About
- Contact
- Jiu Jitsu Brotherhood Club Network
- The Beginner's Guide to BJJ
- How to Suck Less at Jiu Jitsu
- The BJJ Belt System
- Military Discount, if still offered
- Privacy Policy, Terms and Conditions, Disclaimer and Copyright Notice, subject to legal review

### Merge or rationalise

- Merge the two Oliver Geddes Foundation pages into one current page.
- Consolidate the multiple Thank You, Check Your Email and Discount Coupon pages into reusable form-success states.
- Treat Spring, Summer and Welsh seminar pages as an Events archive or retire them if no longer useful.
- Link Kingston-specific material to the KJJ site instead of maintaining duplicate location content on JJB.

### Review before deletion

Two hidden pages contain substantial content and should be inspected before retiring:

- `home`
- `jiu-jitsu-training-secrets`

Three live landing pages depend on PageFly templates and have no useful body content in Shopify's normal page field:

- The Beginner's Guide to BJJ
- How to Suck Less at Jiu Jitsu
- Jiu Jitsu Brotherhood Club Network

Their layouts should be recreated natively rather than attempting to migrate PageFly code.

## Shop

- 28 active products and 7 drafts.
- 154 variants and 158 media records.
- Total recorded active inventory is 470 units.
- Active zero-inventory records are the sticker pack, the 2026 kids competition ticket and the blue Ensō 4.0 Gi. These have different reasons and should be reviewed individually.
- The sticker pack is not inventory-tracked in the CSV export.
- Only six variants have SKUs, so SKU creation should be part of the new catalogue clean-up.
- The old Printful inventory rows contain no stock and do not justify recreating a Printful integration.

### Recommended shop structure

Replace the 32 Shopify collections with approximately seven customer-facing groups:

1. Gis
2. Rashguards
3. T-shirts and Hoodies
4. Grappling Gear
5. Belts
6. Patches and Accessories
7. Events

Seventeen existing collections are empty legacy structures and should not become visible sections on the new site.

## Navigation

The active reference menu is `main-menu-1`, not Shopify's older default menu called Old Main Menu.

The existing active structure is:

- About
- Shop
- Free Stuff
- Articles
- Techniques
- Club Network
- Contact

For the new content-first site, the recommended primary hierarchy is:

- Learn
- Techniques
- About
- Club Network
- Shop
- Subscribe

Contact and legal links can sit in the footer. Customer account navigation is unnecessary because the proposed shop does not require customer accounts.

## Assets

- 913 Shopify Files were recovered, all with unique source URLs.
- 87 are smaller than 300 pixels in at least one dimension.
- The library contains many historical or unused files.
- Article featured images and images embedded in retained content should be migrated to controlled storage.
- The entire Shopify Files library should be retained as a temporary migration archive, but it should not all be published or imported into the new media library.

## Redirects and SEO

The redirect inventory is a significant launch dependency.

- 289 redirect sources are present.
- There are no duplicate source paths.
- There are no redirect chains or loops.
- 57 currently point to live Shopify resources.
- One points to an external URL.
- 231 point to resources that are no longer live, including 195 old blog targets and 31 removed pages.

Do not copy these redirects blindly. Build a final redirect matrix that:

1. maps every retained Shopify article, technique, page and product URL to its new canonical route;
2. flattens useful historical WordPress redirects directly to that final route;
3. maps genuinely superseded material to the closest relevant resource;
4. returns a deliberate 410 or relevant section page where no honest replacement exists.

## Technical remnants not to reproduce

The current theme contains integrations or remnants from PageFly, Plug in SEO, SEO Doctor, Langify, SpurIT, Ninjacoderz, Instagram, Google Analytics, Facebook pixels, YouTube and Vimeo.

Reimplement only what the new site actually needs. Do not port the Shopify Liquid theme into Next.js.

## Next stage

Stage 2 is the information architecture and migration matrix. Before building pages, agree:

1. the new canonical URL structure;
2. the final top-level navigation;
3. the page keep/merge/retire decisions;
4. the editorial category system;
5. the reduced shop catalogue and collection structure;
6. the redirect destination for every retained legacy URL.

Recommended canonical routes:

- `/articles/[slug]`
- `/techniques/[slug]`
- `/shop/[product-slug]`
- `/shop/[category]`
- short standalone routes for core pages, such as `/about` and `/club-network`

All current Shopify paths should continue to work through permanent redirects.
