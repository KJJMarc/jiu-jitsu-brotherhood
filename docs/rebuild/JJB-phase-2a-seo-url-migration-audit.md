# JJB Phase 2A — SEO and URL migration audit

**Date:** 17 September 2026  
**Scope:** read-only. No application-code, route, `trailingSlash`, import, database, commit or deploy changes.  
**SEO source of truth:** the live Shopify storefront at `https://www.jiujitsubrotherhood.com`  
**Export inspected:** `imports/shopify/private/jjb-shopify-audit-20260916-091414/` (16 September 2026, API `2026-07`)  
**Live spot-checks:** HEAD/GET against the production host on 17 September 2026 (canonical tags, sitemaps, selected status codes)

Phase 1 is accepted and unchanged. This audit does **not** assume the KJJ clone’s `/news/` or `/shop/` routes should become the JJB public structure.

## Approved decisions (17 September 2026)

These close Phase 2A open items and Phase 2B acceptance. They override earlier Stage 5 shop-path wording and the provisional Phase 2A `/shop` → `/` mapping.

| Decision | Status |
| --- | --- |
| Existing live Shopify URL families (`/blogs/…`, `/products/…`, `/collections/…`, `/pages/…`) remain authoritative. Stage 5 rewrite to `/articles`, `/techniques`, `/shop/{slug}` is **not** used for public canonicals. | **Approved** |
| `/shop` → **301** → `/collections/all`. Live Shopify `/shop` is a homepage duplicate (canonical `/`); the rebuilt JJB shop destination is the established catalogue URL `/collections/all`. | **Approved** |
| `/collections` remains a valid **200** route (collection list). | **Approved** |
| Do **not** restore the stale exported redirect `/collections` → `/collections/enso-3-0` (`enso-3-0` is live 404). | **Approved** |
| `/collections/all` is the canonical catalogue / shop landing destination. | **Approved** |

Preference order for existing JJB URLs:

1. **PRESERVE** the live Shopify path in Next.js wherever technically reasonable.
2. **301** one hop to the closest genuine replacement when exact preservation is undesirable or impossible.
3. **410** when content is intentionally removed and has no genuine replacement.

Do not redirect retired URLs to the homepage. Do not clean slugs for aesthetics. Internal content models may differ from public paths.

Full row-level map: [`docs/rebuild/JJB-phase-2a-url-inventory.csv`](JJB-phase-2a-url-inventory.csv) (587 rows).

---

## Conflict with Stage 5 (later instruction wins)

Stage 5 (`JJB-stage-5-redirects-and-seo.md`) rewrote Shopify paths into a new IA (`/articles/{slug}`, `/techniques/{slug}`, `/shop/{slug}`, no `/pages/` prefix, no trailing slash). **This Phase 2A brief overrides that rewrite.** Stage 5 remaining rules that still apply: one-hop redirects, no homepage dumps, 410 for retired content, sitemap only of canonical 200s, query-string sources need middleware.

| Stage 5 destination | Phase 2A proposed public URL |
| --- | --- |
| `/articles/{slug}` | `/blogs/blog/{slug}` |
| `/techniques/{slug}` | `/blogs/techniques/{slug}` |
| `/events/archive/{slug}` | keep `/blogs/blog/{slug}` and/or `/pages/{slug}` as they already exist |
| `/shop/{slug}` | `/products/{slug}` |
| `/shop/gis` etc. | `/collections/gis` etc. |
| `/about`, `/contact`, `/privacy` | `/pages/about`, `/pages/contact`, `/pages/privacy-policy` |

---

## 1. Existing Shopify URL patterns

Live canonicals **omit the trailing slash**. Slash and non-slash both return 200 today; the `<link rel="canonical">` always points at the non-slash form.

| Family | Pattern | Live behaviour |
| --- | --- | --- |
| Home | `/` | 200. Canonical host `www.jiujitsubrotherhood.com`. Apex already 301s to www. |
| Articles index | `/blogs/blog` | 200. Menu label “Articles”. Blog title in export is “Articles”, handle is `blog`. |
| Techniques index | `/blogs/techniques` | 200 |
| Empty blog indexes | `/blogs/news`, `/blogs/videos`, `/blogs/articles`, `/blogs/podcast` | 200 and in sitemap despite zero articles |
| Article | `/blogs/blog/{handle}` | 200, 122 published |
| Technique | `/blogs/techniques/{handle}` | 200, 60 published + 1 unpublished (not in sitemap) |
| Tagged blog (not in export) | `/blogs/blog/tagged/{tag}` | Live 200 |
| Paginated blog (not in export) | `/blogs/blog?page=2` | Live 200 |
| Product | `/products/{handle}` | 200 if ACTIVE |
| Collection | `/collections/{handle}` | 200, including empty collections |
| Catalog (not in `collections.json`) | `/collections/all` | 200. Main Menu “Shop”. Canonical `/collections/all` |
| Collections list | `/collections` | Live 200. Export redirect to `/collections/enso-3-0` is **stale** |
| Page | `/pages/{handle}` | 200 if published |
| Shopify policies (not in export) | `/policies/{privacy-policy\|terms-of-service\|refund-policy}` | 200 (shipping-policy 404) |
| Search / cart | `/search`, `/cart` | 200 system routes |
| `/shop` | `/shop` | 200 **but canonical is `/`** — homepage duplicate, not the catalogue |
| `/news` | `/news` | Live **404** |
| Root aliases | `/about`, `/blog`, `/contact`, … | Existing Shopify 301s into `/pages/…` |
| Account | `/account/login` | Shopify customer accounts (out of JJB guest-checkout scope) |
| Podcast host | `podcast.jiujitsubrotherhood.com` | Menu still points here; TLS hostname mismatch on check |
| Old store host | `store.jiujitsubrotherhood.com` | 301s onto www page URLs |

`onlineStoreUrl` is null on every article, page, product and collection in the GraphQL export. Public URLs are inferred from handles plus the live sitemap/canonicals above.

---

## 2. Counts by type

### Export records

| Record | Count | Notes |
| ---: | ---: | --- |
| Articles | 183 | 122 on `blog` (all published); 61 on `techniques` (60 published, 1 draft) |
| Blogs | 6 | 2 populated, 4 empty |
| Pages | 30 | 28 published; `home` and `jiu-jitsu-training-secrets` unpublished |
| Products | 35 | 28 ACTIVE, 7 DRAFT |
| Collections | 32 | 17 empty; `all` is **not** a collection record |
| Redirects | 289 | 0 chains/loops/duplicate sources in the export |
| Menus | 6 | Current nav is `main-menu-1` (“Main Menu”) |
| Files | 913 | 911 images + 2 opaque GenericFiles; **no PDFs / downloadable resources** |
| Metaobjects | 49 | Not URL-bearing |
| Themes | 13 | MAIN theme “Editorial”; PageFly assets theme present |
| Locations | 1 | Not URL-bearing |

### Live sitemaps (17 Sep 2026)

| Sitemap | URLs |
| --- | ---: |
| `sitemap_blogs_1.xml` | 188 = 6 indexes + 182 published articles |
| `sitemap_pages_1.xml` | 28 published pages (excludes unpublished `home` and `jiu-jitsu-training-secrets`) |
| `sitemap_collections_1.xml` | 32 (all collection handles, including empty) |
| `sitemap_products_1.xml` | 29 = `/` plus 28 ACTIVE products (includes `sticker-pack` and kids competition; excludes drafts) |

### Proposed inventory (this audit)

| Slice | Rows | PRESERVE | 301 | 410 |
| --- | ---: | ---: | ---: | ---: |
| Current content / system URLs | 299 | 253 | 12 | 34 |
| Existing Shopify redirects (excluding stale `/collections`) | 288 | 1 | 75 | 212 |
| **Total map** | **587** | **254** | **87** | **246** |

The 253 PRESERVE current-content rows are the URLs Next.js should serve at the Shopify path (some as 404-while-unpublished rather than public 200s).

---

## 3. URL families that can be preserved exactly

Next.js App Router can reproduce these with dedicated segment folders. The internal CMS/shop schema does **not** need to mirror the path.

| Family | Next.js route | Feasibility |
| --- | --- | --- |
| `/blogs/{blogHandle}` | `app/(public)/blogs/[blogHandle]/page.tsx` | Straightforward |
| `/blogs/{blogHandle}/{articleHandle}` | `app/(public)/blogs/[blogHandle]/[articleHandle]/page.tsx` | Straightforward. Internal type can be `article` \| `technique` \| `event`. No handle collisions across blogs. |
| `/products/{handle}` | `app/(public)/products/[handle]/page.tsx` | Straightforward. Reuse shop product records. |
| `/collections/{handle}` | `app/(public)/collections/[handle]/page.tsx` | Straightforward. Special-case `all`. |
| `/collections` | `app/(public)/collections/page.tsx` | Straightforward |
| `/pages/{handle}` | `app/(public)/pages/[handle]/page.tsx` | Straightforward. `pages` as an App Router folder is not the Pages Router. |
| `/`, `/search`, `/cart` | static routes | Straightforward |

These do **not** collide with the existing one-segment catch-all `app/(public)/[slug]/page.tsx`, because Shopify public content uses two or more segments (`/blogs/…`, `/pages/…`, `/products/…`).

Preserve (do not rename) even when the handle is ugly or overlapping:

- `fight-shorts` (shorts product)
- `tail-eater-rashguard-classic-black` (Classic Brotherhood rashguard)
- `mushashi-collection` (typo in the live handle)
- `open-source-jiu-jitsu-hooded-sweatshirt-gray` vs `-red` as separate URLs
- Event **pages** and event **articles** that share a handle in different families, e.g. `/pages/summer-seaside-special` **and** `/blogs/blog/summer-seaside-special`

---

## 4. Migration difficulties

1. **KJJ `/news/` and `/shop/` are the wrong public IA.** Live `/news` is 404. Live `/shop` canonicalises to the homepage. Catalogue is `/collections/all`. Articles index is `/blogs/blog`. Phase 1 nav currently points Articles → `/news/` and Shop → `/shop/`.
2. **`trailingSlash: true`** would 308 Shopify’s canonical non-slash URLs onto slash URLs. That is an SEO change. See §7.
3. **Phase 1 middleware 410s `/about` and `/contact`.** Live Shopify already 301s those to `/pages/about` and `/pages/contact`. Restoring the Shopify 301s is required; the 410s are KJJ academy leftovers, not JJB SEO policy.
4. **Phase 1 `next.config` 301s `/blog` → `/news/`.** Live Shopify 301s `/blog` → `/pages/blog`. The Phase 1 rule is a regression against the source of truth.
5. **Four empty blogs** are live 200 and in the sitemap. Preserving them avoids a surprise de-index; they are thin. Do not fold them into `/blogs/blog` just to tidy.
6. **`/pages/blog` vs `/blogs/blog`.** Both live 200 with distinct canonicals. `/pages/blog` has an empty body. Preserve both; optionally render the article listing at the page URL without changing the path.
7. **PageFly pages** (`beginners-guide-to-bjj-signup`, `how-to-suck-less-at-jiu-jitsu`, `jiu-jitsu-brotherhood-club-network`) have empty `body` in the export. URLs must still be preserved; content is recreated natively.
8. **`/collections/all` is not in the export** but is the live Shop URL. Must be implemented as a special catalog route.
9. **Export redirect `/collections` → `/collections/enso-3-0` is stale.** Live `/collections` is 200; `/collections/enso-3-0` is 404. Do not re-apply that redirect.
10. **Empty/person/digital collections are currently indexed** (32/32 in sitemap) but have no catalogue value. Proposed 410 is an intentional removal, not a slug cleanup. Expect Search Console 410s after cutover.
11. **Kids competition product is ACTIVE and in the live product sitemap.** Stage 4 requires forcing it to draft (public 404, URL preserved). Same for blue Ensō: currently live 200 with zero stock; Stage 4 wants unpublished 404 at the same URL.
12. **Duplicate event URLs** (page + article) for summer/spring seminars. Preserve both; do not invent `/events/archive/`.
13. **Belt-system content is a page**, handle `progression-the-belt-system`, not an article. Stage 5’s `/articles/bjj-belt-system` would be a new slug — do not use it.
14. **Query-string redirects** (7) cannot be expressed as Next `redirects()` path rules; they need middleware matching on `search`.
15. **`/blogs/blog/tagged/{tag}` and `?page=` pagination** are live and absent from the JSON export.
16. **Shopify `/policies/*`** exist live; GraphQL `legal_policies` failed in the export. Map to retained `/pages/…` with one hop rather than serving two legal URLs.
17. **No downloadable resource URLs** in Files (no PDFs). Lead magnets are PageFly pages + email, not file routes.
18. **Podcast** is an external host in the old menu (`http://podcast.jiujitsubrotherhood.com`), not a Shopify blog with posts. TLS failed hostname check; needs a later live review.
19. **Customer accounts / `/cart` / checkout** are Shopify system URLs. Guest Mollie checkout can keep `/cart` as the public bag path; do not publish `/shop/bag/` or `/shop/checkout/`.
20. **Existing catch-all `[slug]`** still generates KJJ news/legal slugs at the root. Harmless for Shopify two-segment URLs, but it must not start serving articles at `/{handle}`.

---

## 5. Existing redirects found

289 Shopify URL redirects. No duplicate sources, no chains, no loops in the export.

| Existing target class | Count | Proposed cutover |
| --- | ---: | --- |
| Retained article/technique | 42 | 301 one hop to `/blogs/{blog}/{handle}` |
| Missing `/blogs/blog/{slug}` (WordPress-era) | 195 | **410** default (manual override only if a true equivalent exists) |
| Retained page | 13 | 301 to `/pages/{handle}` (or the page-table 301 destination) |
| Missing page | 31 | 301 to closest equivalent where one exists; otherwise 410 |
| Retained product | 2 | 301 to `/products/{handle}` (kids 2024 → 2026 stays on that product URL, public 404 while draft) |
| Missing/retired product | 4 | 410 (`gundam`, `beyond-the-black-belt`, `grapplers-longevity-vol-2-digital-download`, `half-guard-mastery`) |
| Collection | 1 | Stale `/collections` → `/collections/enso-3-0`. **Do not re-apply.** Live `/collections` is 200. |
| External | 1 | `/membership-access` → closed Building Blocks page → **410** |

Query-string sources (middleware, not `next.config` path table):

| Source | Existing target | Proposed |
| --- | --- | --- |
| `?page_id=4958` | `/pages/beginners-guide-to-bjj` (missing) | 301 `/pages/beginners-guide-to-bjj-signup` |
| `?page_id=5157` | `/pages/newsletter` (missing) | 301 `/pages/beginners-guide-to-bjj-signup` |
| `?p=4942` | `/blogs/blog/commandments-for-jiu-jitsu` (missing) | 410 |
| `?p=5110` | `/blogs/blog/bjj-neck-injury-getting-stacked` (missing) | 410 |
| `?p=5030` | `/blogs/blog/episode-018-marc-barton` (missing) | 410 |
| `?p=5246` | `/blogs/blog/charlie-cooper` (missing) | 410 |
| `?p=5257` | `/blogs/blog/ep-067-charlie-cooper` (missing) | 410 |

Root-path aliases that already exist and should be kept as one-hop 301s into preserved Shopify URLs include `/about` → `/pages/about`, `/contact` → `/pages/contact`, `/blog` → `/pages/blog`, `/privacy-policy` → `/pages/privacy-policy`.

---

## 6. Implications for current KJJ-derived `/news/` and `/shop/` routes

These are clone artefacts. They are not the live JJB structure.

| Current Next.js route | Live Shopify | Proposed |
| --- | --- | --- |
| `/news/` (Phase 1 Articles nav) | `/news` is **404**. Articles index is `/blogs/blog` | 301 `/news` → `/blogs/blog`. Then delete the KJJ news index from nav (later phase). |
| `/{slug}/` catch-all news posts | Shopify articles are never at the root; root slugs 301 into `/blogs/…` or `/pages/…` | Do not publish JJB articles at `/{slug}`. |
| `/shop/` product index | `/shop` is a homepage duplicate; catalogue is `/collections/all` | **Approved:** `/shop` and `/shop/` **301** → `/collections/all`. Do not 301 `/shop` to `/`. |
| `/shop/{slug}/` product PDP | `/products/{handle}` | Implement PDP at `/products/{handle}`. 301 `/shop/{handle}` → `/products/{handle}` as a safety net for any KJJ-era links, not as the canonical. |
| `/shop/bag/`, `/shop/checkout/` | `/cart`, Shopify checkout | Public cart path `/cart`. Do not make `/shop/bag/` canonical. |
| `/blog` → `/news/` (Phase 1 config) | `/blog` → `/pages/blog` | Restore the Shopify 301. |

Shop data, Mollie, admin and product tables can stay internally as they are. Only the **public URL** must match Shopify.

---

## 7. Implications for `trailingSlash`

| System | Behaviour |
| --- | --- |
| Live Shopify canonical | **No trailing slash** (`https://www.jiujitsubrotherhood.com/blogs/blog/a-brief-history-of-bjj`) |
| Live Shopify slash variant | Also 200; canonical still points at the non-slash URL |
| Current Next.js | `trailingSlash: true` (KJJ WordPress parity). Unchanged in Phase 1 |
| Stage 5 | No trailing slash |

To **preserve** Shopify canonicals, Next.js must serve and canonicalize the non-slash form (`trailingSlash: false`). Leaving `true` would 308 every preserved URL onto a slash variant that is **not** the live canonical.

This audit does not change the flag. Record the implication for the first routing implementation phase: flipping `trailingSlash` is an SEO requirement, not a style preference.

Also: Next `redirects()` sources should be written **without** a trailing slash once the flag is off, and sitemap/canonical helpers must not emit slashes.

---

## 8. Missing from the export (check live later)

Already spot-checked this session (see tables above): canonical slash policy, sitemaps, `/collections/all`, `/shop`, `/news`, `/policies/*`, `/search`, `/cart`, empty blogs, `/collections` vs `enso-3-0`.

Still missing or only partially known:

| Gap | Why it matters |
| --- | --- |
| Search Console / analytics top landing pages | Confirm which 410 defaults should be promoted to 301 |
| Full crawl of tagged, filtered, paginated, and `sort_by` URLs | Export has none of these |
| Theme routes beyond JSON (`/shop` homepage alias implementation) | `/shop` 200-with-canonical-home may be a theme permalink |
| PageFly rendered HTML | Bodies are empty in GraphQL; live pages still render |
| Shopify native policy **body** vs `/pages/privacy-policy` HTML | Legal rewrite still required |
| `podcast.jiujitsubrotherhood.com` DNS/TLS/content | Menu still links it; certificate mismatch on check |
| Alternate hosts still receiving traffic | `store.` 301s to www (checked); others unknown |
| Collection pagination and filter URLs | robots.txt already disallows several crawl traps |
| Whether `/blogs/blog/tagged/*` has inbound links worth preserving | Live 200; tags are mostly product terms |
| Draft product URL history in Search Console | Stage 4 “no redirect unless backlinks exist” |
| Checkout, account, and cart indexed by mistake | robots.txt disallows most |
| `agents.md` / UCP endpoints Shopify now advertises | Not JJB content; do not recreate |

---

## 9. Recommended route architecture (SEO preservation first)

Public URLs follow Shopify. Internal models do not have to.

```
/                                      Home
/blogs/blog                            Articles index
/blogs/blog/[handle]                   Article (or event editorial)
/blogs/techniques                      Techniques index
/blogs/techniques/[handle]             Technique
/blogs/{news|videos|articles|podcast}  Empty indexes (preserve)
/pages/[handle]                        Normal pages, legal, events, lead magnets
/products/[handle]                     Physical products
/collections                           Collection list
/collections/all                       Shop catalogue (menu Shop)
/collections/[handle]                  Collection
/cart                                  Bag
/search                                Search (if kept)
```

**301 (one hop):** WordPress-era root aliases already in `redirects.json`; KJJ `/news` → `/blogs/blog`; `/shop` and `/shop/` → `/collections/all` (approved Phase 2B); Kingston page → `https://www.kingstonjiujitsu.com/`; Shopify `/policies/*` → retained `/pages/…`; `sticker-pack` → `/collections/patches`; merged legal pages (`ccpa-opt-out`, `copyright-notice`).

**410:** retired courses, form-result pages, obsolete blog targets with no retained article, discontinued products (except sticker-pack), empty digital/person collections, `/membership-access`.

**404 (URL reserved, not in sitemap):** unpublished technique, event-ticket products, blue Ensō until published, military discount page once unpublished.

Middleware must:

- honour the 7 query-string sources;
- stop 410ing `/about` and `/contact`;
- 301 `/about` → `/pages/about` and `/contact` → `/pages/contact` (already in the Shopify ledger).

Do **not** add `/articles`, `/techniques` (root), or `/shop/{product}` as canonicals. Optional later aliases would be extra 301s, which are unnecessary if we never publish those links.

---

## Inventory map

Columns: **OLD SHOPIFY URL** · **CONTENT TYPE** · **CURRENT HANDLE/SLUG** · **PROPOSED NEXT.JS URL** · **ACTION** · **NOTES**

The complete 587-row map is [`JJB-phase-2a-url-inventory.csv`](JJB-phase-2a-url-inventory.csv). Grouped subsets follow. Article/technique rows are the family pattern plus the CSV (183 individual URLs, all PRESERVE).

### Home, indexes, system, KJJ leftovers

| OLD SHOPIFY URL | CONTENT TYPE | HANDLE | PROPOSED NEXT.JS URL | ACTION | NOTES |
| --- | --- | --- | --- | --- | --- |
| `/` | home | `(none)` | `/` | **PRESERVE** | Live homepage. |
| `/shop` | shop-alias | `shop` | `/collections/all` | **301** | Approved Phase 2B: live `/shop` is a homepage duplicate; catalogue/shop landing is `/collections/all`. |
| `/collections` | collection-index | `(none)` | `/collections` | **PRESERVE** | Live 200. Do not re-apply export redirect to `enso-3-0`. |
| `/collections/all` | collection-catalog | `all` | `/collections/all` | **PRESERVE** | Live Shop catalog. Missing from `collections.json`. |
| `/search` | shopify-system | `search` | `/search` | **PRESERVE** | Not in JSON export. |
| `/cart` | shopify-system | `cart` | `/cart` | **PRESERVE** | Do not use KJJ `/shop/bag/`. |
| `/policies/privacy-policy` | shopify-policy | `privacy-policy` | `/pages/privacy-policy` | **301** | System policy URL; page HTML already exists. |
| `/policies/terms-of-service` | shopify-policy | `terms-of-service` | `/pages/terms-conditions` | **301** | |
| `/policies/refund-policy` | shopify-policy | `refund-policy` | `/pages/terms-conditions` | **301** | |
| `/policies/shipping-policy` | shopify-policy | `shipping-policy` | `(gone)` | **410** | Live 404. |
| `/blogs/blog` | blog-index | `blog` | `/blogs/blog` | **PRESERVE** | Title “Articles”. 122 posts. |
| `/blogs/techniques` | blog-index | `techniques` | `/blogs/techniques` | **PRESERVE** | 61 records, 60 published. |
| `/blogs/news` | blog-index-empty | `news` | `/blogs/news` | **PRESERVE** | Empty; live 200 + sitemap. |
| `/blogs/videos` | blog-index-empty | `videos` | `/blogs/videos` | **PRESERVE** | Empty; live 200 + sitemap. |
| `/blogs/articles` | blog-index-empty | `articles` | `/blogs/articles` | **PRESERVE** | Title “Blog”. Empty. |
| `/blogs/podcast` | blog-index-empty | `podcast` | `/blogs/podcast` | **PRESERVE** | Empty. External podcast host is separate. |
| `/news` | kjj-derived-route | `news` | `/blogs/blog` | **301** | Live Shopify `/news` is 404. |
| `/shop/` | kjj-derived-route | `shop` | `/collections/all` | **301** | Same destination as `/shop` after `trailingSlash: false`. |

### Articles and techniques (183)

Pattern, all **PRESERVE**:

| OLD SHOPIFY URL | CONTENT TYPE | HANDLE | PROPOSED NEXT.JS URL | ACTION | NOTES |
| --- | --- | --- | --- | --- | --- |
| `/blogs/blog/{handle}` | article | `{handle}` | `/blogs/blog/{handle}` | **PRESERVE** | 122 published. Includes event editorials `summer-seaside-special` and `spring-super-seminar`. |
| `/blogs/techniques/{handle}` | technique | `{handle}` | `/blogs/techniques/{handle}` | **PRESERVE** | 60 published. |
| `/blogs/techniques/heel-hook-details-leigh-remedios` | article-unpublished | `heel-hook-details-leigh-remedios` | same | **PRESERVE** | Public 404 until published. Not 410. |

Individual handles are in the CSV. No duplicate handles across blogs.

### Pages (30)

| OLD SHOPIFY URL | CONTENT TYPE | HANDLE | PROPOSED NEXT.JS URL | ACTION | NOTES |
| --- | --- | --- | --- | --- | --- |
| `/pages/about` | page | `about` | `/pages/about` | **PRESERVE** | |
| `/pages/armed-forces` | page | `armed-forces` | `/pages/armed-forces` | **PRESERVE** | Keep URL; 404 while discount unpublished. |
| `/pages/beginners-guide-to-bjj-signup` | page-pagefly | `beginners-guide-to-bjj-signup` | same | **PRESERVE** | Recreate natively. |
| `/pages/bjj-in-kingston-upon-thames` | page | `bjj-in-kingston-upon-thames` | `https://www.kingstonjiujitsu.com/` | **301** | Approved Phase 0. |
| `/pages/blog` | page | `blog` | `/pages/blog` | **PRESERVE** | Distinct from `/blogs/blog`. |
| `/pages/cant-find-that` | page-retired | `cant-find-that` | `(gone)` | **410** | |
| `/pages/ccpa-opt-out` | page | `ccpa-opt-out` | `/pages/privacy-policy` | **301** | |
| `/pages/check-your-email` | page-retired | `check-your-email` | `(gone)` | **410** | |
| `/pages/closed-bjj-building-blocks-and-bjj-learning-sites` | page-retired | `closed-bjj-building-blocks-and-bjj-learning-sites` | `(gone)` | **410** | |
| `/pages/closed-jiu-jitsu-master-academy` | page-retired | `closed-jiu-jitsu-master-academy` | `(gone)` | **410** | |
| `/pages/contact` | page | `contact` | `/pages/contact` | **PRESERVE** | |
| `/pages/copyright-notice` | page | `copyright-notice` | `/pages/terms-conditions` | **301** | |
| `/pages/disclaimer` | page | `disclaimer` | `/pages/disclaimer` | **PRESERVE** | |
| `/pages/home` | page | `home` | `/` | **301** | Unpublished; live 404. |
| `/pages/how-to-suck-less-at-jiu-jitsu` | page-pagefly | `how-to-suck-less-at-jiu-jitsu` | same | **PRESERVE** | Recreate natively. |
| `/pages/jiu-jitsu-brotherhood-club-network` | page-pagefly | `jiu-jitsu-brotherhood-club-network` | same | **PRESERVE** | Recreate natively. |
| `/pages/jiu-jitsu-training-secrets` | page-retired | `jiu-jitsu-training-secrets` | `(gone)` | **410** | Unpublished. |
| `/pages/oli-geddes-foundation-charity-event-kingston-jiu-jitsu` | page | `oli-geddes-foundation-charity-event-kingston-jiu-jitsu` | same | **PRESERVE** | Event page. |
| `/pages/privacy-policy` | page | `privacy-policy` | `/pages/privacy-policy` | **PRESERVE** | Do not rename to `/privacy`. |
| `/pages/progression-the-belt-system` | page | `progression-the-belt-system` | `/pages/progression-the-belt-system` | **PRESERVE** | Do not invent `/articles/bjj-belt-system`. |
| `/pages/sign-up-thank-you` | page-retired | `sign-up-thank-you` | `(gone)` | **410** | |
| `/pages/spring-super-seminar` | page | `spring-super-seminar` | same | **PRESERVE** | Also an article at `/blogs/blog/spring-super-seminar`. |
| `/pages/summer-seaside-special` | page | `summer-seaside-special` | same | **PRESERVE** | Also an article at `/blogs/blog/summer-seaside-special`. |
| `/pages/terms-conditions` | page | `terms-conditions` | `/pages/terms-conditions` | **PRESERVE** | Do not rename to `/terms`. |
| `/pages/thank-you` | page-retired | `thank-you` | `(gone)` | **410** | |
| `/pages/thank-you-1` | page-retired | `thank-you-1` | `(gone)` | **410** | |
| `/pages/thank-you-for-your-purchase` | page-retired | `thank-you-for-your-purchase` | `(gone)` | **410** | |
| `/pages/the-oliver-geddes-foundation` | page | `the-oliver-geddes-foundation` | same | **PRESERVE** | |
| `/pages/welsh-winter-special` | page | `welsh-winter-special` | same | **PRESERVE** | |
| `/pages/your-discount-coupon` | page-retired | `your-discount-coupon` | `(gone)` | **410** | MATLIFE10 campaign. |

### Products (35)

Retain physical products: **PRESERVE** `/products/{handle}` (26, including blue Ensō URL reserved at 404-until-published).

| OLD SHOPIFY URL | ACTION | PROPOSED NEXT.JS URL | NOTES |
| --- | --- | --- | --- |
| `/products/{retain-handle}` × 25 ACTIVE retain | **PRESERVE** | same | Not `/shop/{handle}`. |
| `/products/enso-4-0-gi-blue` | **PRESERVE** | same | Unpublished zero-stock draft; currently live 200. |
| `/products/sticker-pack` | **301** | `/collections/patches` | Withdrawn; currently ACTIVE + sitemap. |
| `/products/astrum-rashguard` | **410** | `(gone)` | Draft discontinued. |
| `/products/musashi-limited-edition` | **410** | `(gone)` | Draft discontinued. |
| `/products/tail-eater-back-pack` | **410** | `(gone)` | Draft discontinued. |
| `/products/the-seeker-t-shirt` | **410** | `(gone)` | Draft discontinued. |
| `/products/summer-super-seminar-2025` | **PRESERVE** | same | Event draft; public 404. |
| `/products/2nd-summer-seaside-special-super-seminar` | **PRESERVE** | same | Event draft; public 404. |
| `/products/jiu-jitsu-brotherhood-club-network-adults-competition` | **PRESERVE** | same | Event draft; public 404. |
| `/products/kids-club-network-interclub-competition-2026` | **PRESERVE** | same | Force draft; currently ACTIVE + sitemap. |

### Collections (32 + `enso-3-0` + `all`)

**PRESERVE:** `all`, `apparel`, `belts`, `featured`, `gis`, `hoodies`, `mushashi-collection`, `patches`, `rash-guards`, `shorts`, `sisterhood`, `spats`, `t-shirts`, `training-gear`, and `/collections`.

**410:** 17 empty/digital/person collections, plus `bags` (only discontinued product) and `seminars` (only event drafts). These are live 200s today.

**301:** `/collections/enso-3-0` → `/collections/gis` (live 404; missing from export).

### Resources / downloads / events / other

| Kind | Finding |
| --- | --- |
| Downloads | No PDF/file routes in Files. Lead magnets are pages. |
| Events | Pages `welsh-winter-special`, `spring-super-seminar`, `summer-seaside-special`, `oli-geddes-foundation-charity-event-kingston-jiu-jitsu`; matching articles for summer/spring; ticket products unpublished. Preserve those Shopify URLs. Do not create `/events/archive/`. |
| Podcast | Empty `/blogs/podcast` plus external host in old menu. |
| Club Network | `/pages/jiu-jitsu-brotherhood-club-network` (PageFly). |

---

## Next.js feasibility summary

| Concern | Verdict |
| --- | --- |
| Reproduce `/blogs`, `/products`, `/collections`, `/pages` | Easy in App Router |
| Keep KJJ shop/admin internally | Compatible; public path is independent |
| `trailingSlash: true` | Blocks exact canonical preservation until flipped |
| Query-string redirects | Middleware required |
| `[slug]` catch-all | Does not steal two-segment Shopify paths; must not become the article URL |
| `/pages` folder name | Fine in App Router |
| `/collections/all` | Special case; `all` is not in the collection JSON |

---

## What this audit did not do

No application code, routes, `trailingSlash`, KJJ file deletion, Shopify import, product import, database, Supabase, commit or deploy.

---

## Recommended next phase (not started)

Implement public route shells that **serve** the preserved Shopify paths (empty/fixture content is enough), set canonicals without trailing slashes, and encode the 301/410 ledger — still without importing Shopify bodies or connecting a JJB database, unless a later brief says otherwise.
