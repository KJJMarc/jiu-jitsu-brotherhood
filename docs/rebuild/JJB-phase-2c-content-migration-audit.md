# JJB Phase 2C — Content migration audit and model

**Date:** 17 September 2026  
**Scope:** read-only. No application-code changes, content import, database writes, migration apply, push, or deploy.  
**Application milestone:** commit `8e21c58` (Phase 1 + 2A + 2B)  
**URL authority:** [`JJB-phase-2a-seo-url-migration-audit.md`](JJB-phase-2a-seo-url-migration-audit.md) + [`JJB-phase-2a-url-inventory.csv`](JJB-phase-2a-url-inventory.csv)  
**Export inspected (gitignored):** `imports/shopify/private/jjb-shopify-audit-20260916-091414/`  
**Machine inventory:** [`JJB-phase-2c-content-migration-inventory.csv`](JJB-phase-2c-content-migration-inventory.csv) (217 rows)  
**Implementation spec (not built yet):** [`JJB-phase-2d-content-system-spec.md`](JJB-phase-2d-content-system-spec.md)

This phase designs how Shopify editorial content should be modelled and imported. It does **not** recreate Shopify as a product. Existing SEO URLs, titles, metadata, dates, and media are preserved wherever appropriate.

---

## Approved decisions (17 September 2026 — post-2C acceptance)

These override earlier Phase 2C *recommendations* where they conflict. Full technical design: Phase 2D.

| # | Decision | Status |
| --- | --- | --- |
| 1 | **Supabase-primary hybrid** storage; Shopify CDN media by reference initially; later Storage migration without changing public URLs/content identity | **Approved** |
| 2 | Shared editorial model: `article` \| `technique` \| `past_event` \| `page`. DB must not dictate public URLs (Phase 2A remains authoritative) | **Approved** |
| 3 | Preserve article/technique fields including body HTML, SEO, dates, Shopify IDs, YouTube embeds (~95). Class C ≠ remove embeds | **Approved** |
| 4 | Do **not** publicly display `JJB Admin`. Keep as import metadata; optional real author later | **Approved** |
| 5 | Raw Shopify tags → source metadata only. No automatic public taxonomy from product-like tags | **Approved** |
| 6 | Free resources **Beginner's Guide** + **Suck Less** = **KEEP / REBUILD** at existing Shopify URLs; keep **MailerLite** delivery; do not migrate PDFs; do not alter ML account | **Approved** |
| 7 | One content record per event; duplicate page/article → one canonical + 301. Past Events index at `/pages/past-events` | **Approved** |
| 8 | Lead-funnel pages assessed individually (not mass-recreated) | **Approved** |
| 9 | Recommend `/pages/blog` → **301** → `/blogs/blog` | **Approved recommendation** (implement in routing phase) |
| 10 | Legal/CCPA/copyright: do not migrate Shopify boilerplate; rebuild later for **Kingston Jiu Jitsu Ltd** as JJB operator; unpublished/noindex placeholders if needed; do **not** copy KJJ legal pages verbatim | **Approved** |
| 11 | Master Academy closed page → **410** | **Approved** |
| 12 | Importer: deterministic technical cleanup only; no silent prose rewrite | **Approved** |
| 13 | SEO: preserve handles, dates, SEO fields; do not invent SEO titles on import | **Approved** |
| 14 | MailerLite: preserve existing success/confirmation behaviour initially; do not invent a JJB thank-you flow unless ML requires a site-hosted success URL | **Approved** |
| 15 | `MATLIFE10` / `/pages/your-discount-coupon` → **410** (retired; no active dependency found) | **Approved** |
| 16 | Club Network is **separate** from Past Events — do not merge into past_event type/index; treatment decided later | **Approved** |
| 17 | Next implementation may provision a **separate JJB Supabase** project — never reuse/modify/connect KJJ production Supabase | **Approved** |

### Free resources / MailerLite (follow-up evidence)

GraphQL export bodies for the two Free Stuff pages are **empty** (PageFly templates). Live HTML (read-only GET, 17 Sep 2026) shows PageFly layout + embedded MailerLite webforms:

| Resource | Public URL | MailerLite form code | Embed id | Submit action |
| --- | --- | --- | --- | --- |
| Beginner's Guide | `/pages/beginners-guide-to-bjj-signup` | `n2l0c2` | `mlb2-1721794` | `https://static.mailerlite.com/webforms/submit/n2l0c2` |
| How to Suck Less | `/pages/how-to-suck-less-at-jiu-jitsu` | `a1f8n6` | `mlb2-1722026` | `https://static.mailerlite.com/webforms/submit/a1f8n6` |

Both forms collect **email only**, `method=post`, `target=_blank`. No PDFs in Shopify Files — delivery is MailerLite automation. PageFly supplies landing chrome only.

**Approved success behaviour:** preserve the existing MailerLite success/confirmation flow initially. Do **not** invent a new JJB thank-you flow unless the live MailerLite implementation specifically requires a site-hosted success URL. Improve later only after signup/delivery is reproduced and tested.

**Still useful later (not credentials):** which MailerLite groups/automations fire on each form; OG/hero image assets for native landings. Do **not** change ML config or submit test subscribers.

Retired `/pages/jiu-jitsu-training-secrets` contains a **different** older embed (`mlb2-1004924` / `g4z7y0`) — remains Phase 2A **410**; do not revive.

### Event canonical recommendations

| Event | Evidence | Canonical | Duplicate treatment |
| --- | --- | --- | --- |
| Summer Seaside Special | Page = pre-event announcement (Apr 2022, no video). Article = post-event recap + YouTube (Oct 2022) | **`/blogs/blog/summer-seaside-special`** | `/pages/summer-seaside-special` → **301** |
| Spring Super Seminar | Same pattern (page announcement Feb 2023; article recap+video Nov 2023) | **`/blogs/blog/spring-super-seminar`** | `/pages/spring-super-seminar` → **301** |
| Welsh Winter Special | Page only | `/pages/welsh-winter-special` | — |
| Oli Geddes charity event | Page only | `/pages/oli-geddes-foundation-charity-event-kingston-jiu-jitsu` | — |

Index: **`/pages/past-events`** (new page record). Individuals keep strongest existing URLs — no `/events/` hierarchy.

### Lead-funnel page treatments (updated)

| Handle | Treatment | Reason |
| --- | --- | --- |
| `check-your-email` | KEEP only if ML requires site URL; else leave unlinked | Preserve existing ML success behaviour; do not invent a new thank-you flow |
| `sign-up-thank-you` | Same as above | Mailing-list confirmation helper — keep only if ML still deep-links here |
| `thank-you` | **410** | Obsolete Black Belt Blueprint download thank-you |
| `thank-you-1` | **410** | Thin duplicate |
| `your-discount-coupon` | **410** | `MATLIFE10` treated as **retired**; no active dependency found |
| `thank-you-for-your-purchase` | **301**/replace when shop order flow exists | Generic commerce thank-you |
| `cant-find-that` | **410** | Soft-404 → use Next `not-found` |

### Club Network vs Past Events

`/pages/jiu-jitsu-brotherhood-club-network` is **conceptually separate** from Past Events. Do **not** merge it into the `past_event` type or `/pages/past-events` index. KEEP/REBUILD later as its own page once inspected; treatment undecided beyond that separation.

---

## 1. Articles audit (183 records)

### Counts

| Bucket | Count | Notes |
| --- | ---: | --- |
| Total article records | **183** | Matches export + Phase 0/2A |
| Blog `blog` (Articles) | **122** | All published |
| Blog `techniques` (Techniques) | **61** | 60 published + **1 draft** |
| Unexpected blog assignment | **0** | No articles on `news`, `videos`, `articles`, or `podcast` |
| Handle collisions across blogs | **0** | Handles are unique store-wide in this export |

**Confirmed split:** 122 Articles / 60 published Techniques / 1 draft Technique (`heel-hook-details-leigh-remedios`).

### Field coverage

| Field | Coverage | Notes |
| --- | --- | --- |
| Title | 183/183 | Present |
| Handle | 183/183 | Canonical path = `/blogs/{blogHandle}/{handle}` |
| `isPublished` / `publishedAt` | 182 published | Draft has no public sitemap expectation |
| Author | 183/183 | Always **`JJB Admin`** — do not invent real authors on import |
| Summary / excerpt | 180/183 | Missing: `tripod-sweep-from-the-jelly-guard`, `the-surprising-health-benefits-of-strength-training`, `closed-guard-omoplata-fundamentals` |
| Body | 183/183 | HTML strings (GraphQL `body`) |
| Featured image | 183/183 | All on `cdn.shopify.com` article file URLs |
| Featured image alt | 3/183 | Almost all empty — generate/review on import |
| SEO title (`global.title_tag`) | 22/183 | Sparse; fall back to title |
| SEO description (`global.description_tag`) | 183/183 | Present on every record |
| Tags | Present | Heavily polluted with **product collection tags** (`rashguards`, `Gis`, `patches`, `belts`, …). **41/61** techniques carry product-like tags. Strip or remap on import; do not treat as editorial taxonomy as-is. |
| `templateSuffix` | Mostly empty | Not a migration dependency for articles |
| `onlineStoreUrl` | null in export | Public URL inferred from blog handle + article handle (Phase 2A) |

### Body format and completeness

- Body format is **HTML** throughout (not Markdown, not JSON blocks).
- Typical technique post: short HTML intro + **YouTube iframe**.
- Typical article: longer HTML; many also embed YouTube.
- **98** article bodies contain YouTube/iframe markup; of those, **0** are iframe-only stubs — all have accompanying text (though some intros are short).
- Markup residues: TinyMCE `data-mce-fragment`, inline `style=`, occasional empty `<div>`s. Not PageFly.
- Content appears **substantively complete** for migration for nearly all published records (featured image + SEO description + body text present). Gaps are excerpt (3) and alt text (near-total).

### Anomalies

| Anomaly | Records |
| --- | --- |
| Draft technique | `/blogs/techniques/heel-hook-details-leigh-remedios` |
| Missing summary | 3 handles listed above |
| Page+article duplicate handles (events) | `summer-seaside-special`, `spring-super-seminar` |
| Product-tag pollution | 41 techniques (+ many articles) |
| Author always shop account name | All 183 |

No articles assigned to unexpected blogs. Empty blogs (`news`, `videos`, `articles`, `podcast`) remain URL shells only (Phase 2A/2B).

---

## 2. Migration difficulty (articles + techniques)

Classification (content not rewritten in this phase):

| Class | Meaning | Count | Notes |
| --- | --- | ---: | --- |
| **A** | Straightforward HTML migration | **86** | Clean-enough body; no iframe/table/script |
| **B** | Light HTML cleanup | **2** | Messy markup / thin cleanup: `/blogs/blog/the-neck-grappling-arts-and-tech-devices`, `/blogs/blog/rickson-gracie-jiu-jitsus-living-legend` |
| **C** | Embedded media or unusual markup | **93** | YouTube/iframe (and similar). Needs sanitiser + native embed component |
| **D** | PageFly/theme-dependent or otherwise difficult | **0** | No article bodies are PageFly-empty |
| **E** | Duplicate / obsolete / editorial decision | **2** | Event duplicates: `/blogs/blog/summer-seaside-special`, `/blogs/blog/spring-super-seminar` |

**Problematic article set to review first:** class **E** (2) + class **B** (2) + draft (1) + missing summaries (3). Class **C** is large but mechanically uniform (iframe → embed component).

---

## 3. Internal links

Links were extracted from article `body` HTML only.

### Volume (article bodies)

| Target class | Approx. link hits |
| --- | ---: |
| External sites | 190 |
| JJB pages (`/pages/…`) | 23 |
| JJB articles (`/blogs/blog/…`) | 11 |
| JJB techniques (`/blogs/techniques/…`) | 9 |
| Collections | 11 |
| Products | 7 |
| Unique links needing transform attention | **23** |

### Can Shopify URL architecture leave most links unchanged?

**Yes for path-shaped JJB links.** Because Phase 2A/2B preserve `/blogs/…`, `/pages/…`, `/products/…`, and `/collections/…`, relative-equivalent paths already matching those families can stay as-is (normalise host + scheme only).

### Transform during import

| Pattern | Count (unique samples) | Action |
| --- | --- | --- |
| Legacy WordPress media `…/wp-content/uploads/…` | ~20 | Remap to surviving CDN/file URL if known, or host in new storage; do **not** leave dead WP paths |
| `store.jiujitsubrotherhood.com/products/…` | 1+ | Rewrite to `www` `/products/…` |
| Bare / malformed hrefs (e.g. `www.kingstonjiujitsu.com` without scheme; garbage `%20` “href”) | few | Fix or drop |
| `http://` www JJB absolute links | present among ~89 host-qualified internals | Upgrade to `https://www.jiujitsubrotherhood.com…` or site-relative |
| Root aliases (`/about`, `/contact`, …) | rare in bodies | Optional rewrite to `/pages/…` (middleware already 301s) |

**Recommendation:** import-time link rewriter: (1) force https + www, (2) map `store.` → www, (3) flag/repair `wp-content` and non-URL hrefs, (4) leave already-correct `/blogs|/pages|/products|/collections` paths untouched.

No article-body links were found pointing at the PageFly resource sign-up pages; those resources are primarily **menu**-linked (see §7).

---

## 4. Images / media

### Representation in export

| Source | How represented |
| --- | --- |
| Featured image | `article.image.{url,altText,width,height}` — Shopify CDN article files |
| Inline images | `<img src="https://cdn.shopify.com/…">` in HTML (108 inline imgs across articles; **all** Shopify CDN in this export) |
| Legacy WP images | Some **anchor** hrefs still point at historical `/wp-content/uploads/…` (not necessarily `<img src>`) |
| Files library | `files.json`: **911** `MediaImage` + **2** GenericFile; **100** have alt text; **no PDFs** in export |
| Video | YouTube (and iframe) embeds in HTML — **95** articles match YouTube URL patterns; **115** iframe tags total |
| Other embeds | No meaningful Vimeo/Spotify/SoundCloud signal in article set |
| PageFly | Not in article HTML; three **pages** use `pf-*` template suffixes with empty GraphQL bodies |

### Missing / weak media metadata

- Featured alt text almost entirely blank (3/183).
- Inline alt text sparse (13/108).
- Brokenness of live CDN URLs was **not** HTTP-probed in this phase (read-only; no downloads). Assume CDN URLs work until a later link-check pass.

### Storage recommendation for media (decision, not implementation)

**Phase 1 of content import: keep Shopify CDN URLs externally referenced** for featured + inline images.

Reasons: zero binary copy risk, preserves current rendering, matches “do not download media in 2C”, and avoids blocking editorial import on asset pipeline work.

**Follow-up (before Shopify CDN dependency becomes a liability):** copy hot assets into JJB Supabase Storage (or equivalent) and rewrite URLs in a controlled job; keep original CDN URL as `source_url` for audit. YouTube stays embed-by-ID (extract from iframe `src`), not re-hosted.

---

## 5. Pages audit (30 records)

### Summary treatments (recommendations only)

| Treatment | Count |
| --- | ---: |
| KEEP | 9 |
| KEEP / REBUILD | 9 |
| REDIRECT | 1 |
| ARCHIVE / REPURPOSE | 7 |
| REMOVE / 410 | 4 |
| NEEDS DECISION | 0 as sole label — several KEEP/ARCHIVE rows still flag `decision_needed=yes` in the CSV |

Aligned with Phase 2A where that inventory already decided URL fate.

### Per-page recommendations

| Handle | URL | Pub | Diff | Treatment | Purpose / note |
| --- | --- | --- | --- | --- | --- |
| `about` | `/pages/about` | Y | A | **KEEP** | Brand about |
| `contact` | `/pages/contact` | Y | D | **KEEP / REBUILD** | Body is WP `contact-form-7` only |
| `blog` | `/pages/blog` | Y | D | **KEEP / REBUILD** | Empty body; preserve URL; may render article index |
| `privacy-policy` | `/pages/privacy-policy` | Y | A | **KEEP / REBUILD** | Legal rewrite still required |
| `terms-conditions` | `/pages/terms-conditions` | Y | A | **KEEP / REBUILD** | Legal rewrite still required |
| `copyright-notice` | `/pages/copyright-notice` | Y | A | **KEEP / REBUILD** | Legal; Phase 2A may merge later |
| `disclaimer` | `/pages/disclaimer` | Y | A | **KEEP** | Legal/disclaimer prose |
| `ccpa-opt-out` | `/pages/ccpa-opt-out` | Y | D | **KEEP / REBUILD** | Confirm keep vs merge into privacy |
| `progression-the-belt-system` | `/pages/progression-the-belt-system` | Y | A | **KEEP** | Educational; Stage 5 once wanted a different slug — **Phase 2A preserves this URL** |
| `the-oliver-geddes-foundation` | `/pages/the-oliver-geddes-foundation` | Y | A | **KEEP** | Foundation info |
| `armed-forces` | `/pages/armed-forces` | Y | A | **KEEP** | Military discount landing; Phase 2A: keep URL, unpublish until feature ships |
| `bjj-in-kingston-upon-thames` | `/pages/bjj-in-kingston-upon-thames` | Y | A | **REDIRECT** | Phase 2A → `https://www.kingstonjiujitsu.com/` |
| `summer-seaside-special` | `/pages/summer-seaside-special` | Y | A | **KEEP** | Event landing; duplicate article exists |
| `spring-super-seminar` | `/pages/spring-super-seminar` | Y | A | **KEEP** | Event landing; duplicate article exists |
| `welsh-winter-special` | `/pages/welsh-winter-special` | Y | C | **KEEP** | Past event (has embed/markup) |
| `oli-geddes-foundation-charity-event-kingston-jiu-jitsu` | `/pages/…` | Y | A | **KEEP** | Charity event landing |
| `jiu-jitsu-brotherhood-club-network` | `/pages/…` | Y | D | **KEEP / REBUILD** | PageFly empty body (`pf-bb042e4c`) |
| `beginners-guide-to-bjj-signup` | `/pages/…` | Y | D | **KEEP / REBUILD** | PageFly + MailerLite `n2l0c2`; preserve URL; keep ML delivery |
| `how-to-suck-less-at-jiu-jitsu` | `/pages/…` | Y | D | **KEEP / REBUILD** | PageFly + MailerLite `a1f8n6`; preserve URL; keep ML delivery |
| `sign-up-thank-you` | `/pages/…` | Y | A | **ARCHIVE / REPURPOSE** | Lead thank-you |
| `check-your-email` | `/pages/…` | Y | A | **ARCHIVE / REPURPOSE** | Lead funnel |
| `thank-you` | `/pages/…` | Y | A | **ARCHIVE / REPURPOSE** | Lead funnel |
| `thank-you-1` | `/pages/…` | Y | A | **ARCHIVE / REPURPOSE** | Thin duplicate thank-you |
| `your-discount-coupon` | `/pages/…` | Y | A | **ARCHIVE / REPURPOSE** | Discount funnel |
| `thank-you-for-your-purchase` | `/pages/…` | Y | A | **KEEP / REBUILD** | Commerce thank-you vs Mollie order flow |
| `cant-find-that` | `/pages/…` | Y | A | **KEEP / REBUILD** | Soft-404 style; vs app `not-found` |
| `closed-bjj-building-blocks-and-bjj-learning-sites` | `/pages/…` | Y | A | **REMOVE / 410** | Phase 2A retired |
| `jiu-jitsu-training-secrets` | `/pages/…` | N | D | **REMOVE / 410** | Phase 2A retired; unpublished |
| `closed-jiu-jitsu-master-academy` | `/pages/…` | Y | A | **REMOVE / 410** | CLOSED stub — confirm |
| `home` | `/pages/home` | N | C | **REMOVE / 410** | Theme/homepage blob; live home is `/` |

Page difficulty **D (7):** contact, blog, ccpa-opt-out, two PageFly resources, club-network, training-secrets.

---

## 6. Events / Past Events

### Found historical event content (not only the four known ticket products)

**Editorial duplicates (page + article, same handle):**

| Event | Page URL | Article URL |
| --- | --- | --- |
| Summer Seaside Special | `/pages/summer-seaside-special` | `/blogs/blog/summer-seaside-special` |
| Spring Super Seminar | `/pages/spring-super-seminar` | `/blogs/blog/spring-super-seminar` |

**Additional event-like pages:**

| Page | Notes |
| --- | --- |
| `/pages/welsh-winter-special` | Past seminar-style landing |
| `/pages/oli-geddes-foundation-charity-event-kingston-jiu-jitsu` | Charity event |
| `/pages/jiu-jitsu-brotherhood-club-network` | Network hub (PageFly empty) — **separate** from Past Events; not a `past_event` |

**Ticket / product records (commerce, not editorial bodies):**

| Product | Status | URL |
| --- | --- | --- |
| Summer Super Seminar 2025 | DRAFT | `/products/summer-super-seminar-2025` |
| 2nd Summer Seaside Special Super Seminar | DRAFT | `/products/2nd-summer-seaside-special-super-seminar` |
| Club Network Adults Competition | DRAFT | `/products/jiu-jitsu-brotherhood-club-network-adults-competition` |
| Kids Club Network Interclub Competition 2026 | ACTIVE (Phase 2A: force draft/404) | `/products/kids-club-network-interclub-competition-2026` |

**Not Past Events (keep as normal articles):** competition *advice* posts such as `cut-weight-jiu-jitsu-competitions`, `brazilian-jiu-jitsu-competitions`.

**Orphan redirect:** `/brazilian-jiu-jitsu-seminars` → missing `/pages/brazilian-jiu-jitsu-seminars` (Phase 2A already **410**).

### Consolidation recommendation (design only) — **approved in Phase 2D**

1. Content type **`past_event`** on the shared editorial table.
2. **One record per event.** Seaside/Spring: canonical = **article** URL (recap + YouTube); page URL **301** → article.
3. **Do not** invent `/events/archive/{slug}` as required public paths.
4. Past Events index at **`/pages/past-events`**; individuals keep strongest existing Shopify URLs.
5. Ticket products stay in commerce.

---

## 7. Legacy resources / lead magnets

### What exists

| Resource | URL | Body in export | Menu | Phase 2A URL fate |
| --- | --- | --- | --- | --- |
| The Beginner's Guide to BJJ | `/pages/beginners-guide-to-bjj-signup` | **Empty** in GraphQL (PageFly `pf-391e1a38`); live = PageFly + MailerLite `n2l0c2` | main-menu **Free Stuff** | **KEEP / REBUILD** (approved) |
| How to Suck Less at Jiu Jitsu | `/pages/how-to-suck-less-at-jiu-jitsu` | **Empty** in GraphQL (PageFly `pf-d0d66f53`); live = PageFly + MailerLite `a1f8n6` | main-menu **Free Stuff** | **KEEP / REBUILD** (approved) |
| Jiu Jitsu Training Secrets | `/pages/jiu-jitsu-training-secrets` | HTML present (~949 chars text) | not in main Free Stuff | **410** |
| CLOSED Building Blocks page | `/pages/closed-bjj-building-blocks-…` | Short CLOSED notice | — | **410** |
| `/membership-access` | redirect | — | — | **410** (not hop to CLOSED page) |

**Files export contains no PDFs** — downloadable “guides” are not in `files.json`. Delivery was almost certainly external email/PageFly, not Shopify Files.

### Internal links

- Article bodies: **no** hrefs to the two Free Stuff PageFly pages (in this export).
- Redirect ledger contains multiple legacy beginner-guide aliases already mapped in Phase 2A toward `beginners-guide-to-bjj-signup` or 410.

### Recommended migration treatment (not deleting yet)

| Item | Recommendation |
| --- | --- |
| Two Free Stuff PageFly pages | **KEEP / REBUILD** at same URLs with native JJB landings + existing MailerLite forms. Do not migrate PDFs. |
| Funnel thank-you / check-email / coupon pages | Assess individually — see approved table above (several **410**). |
| Training Secrets / Building Blocks / membership-access | Follow Phase 2A **410**. |
| Menu “Free Stuff” | Keep links to the two rebuilt resource URLs. |

---

## 8. Recommended content model

### Design principle

One **editorial document** table (or closely shared schema) with a **`type`** discriminator, rather than three disconnected CMS implementations. Public routes stay Shopify-shaped via `(type, blog_handle/handle)` mapping — internal model ≠ URL.

### Types

| Type | Public URL pattern | Source today |
| --- | --- | --- |
| `article` | `/blogs/blog/{handle}` | Shopify blog `blog` |
| `technique` | `/blogs/techniques/{handle}` | Shopify blog `techniques` |
| `past_event` | Prefer existing `/pages/{handle}` and/or preserved `/blogs/blog/{handle}` | Event pages + recap articles |
| `page` | `/pages/{handle}` | Shopify pages (legal, about, utility) |

Empty Shopify blogs remain route shells without documents.

### Suggested fields (logical)

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | UUID |
| `type` | yes | `article` \| `technique` \| `past_event` \| `page` |
| `handle` | yes | Shopify handle; immutable for SEO |
| `blog_handle` | for blog types | `blog` or `techniques`; null for pages |
| `title` | yes | |
| `status` | yes | `draft` \| `published` \| `archived` |
| `published_at` | when published | Preserve Shopify timestamps |
| `author_name` | yes | Import as `JJB Admin` initially; optional later people table |
| `excerpt` | recommended | From `summary` / `bodySummary` |
| `body_html` | yes | Sanitised HTML |
| `seo_title` | optional | |
| `seo_description` | optional | |
| `featured_image_url` | optional | CDN or storage URL |
| `featured_image_alt` | optional | |
| `tags` | optional | **Clean** editorial tags only |
| `youtube_ids` | optional | Extracted from iframes for techniques/articles |
| `template` | pages | `default` \| `legal` \| `form` \| … |
| `source_shopify_id` | yes on import | `gid://shopify/…` for idempotent re-import |
| `source_updated_at` | yes on import | Skip unchanged rows |
| `canonical_path` | computed | From type + handles — must match Phase 2A |

Past Events may additionally store `event_start`, `event_end`, `location_label` when known (often absent in export — nullable).

### Relationship to KJJ seed schema

Existing `public.articles` + `public.site_pages` are a useful **starting shape** (status, SEO fields, `body_html`, admin RLS) but are KJJ-oriented (`body_paragraphs`, narrow `site_pages.template` check). JJB should **extend or replace** with type/blog_handle/source ids rather than forcing techniques into slug-only `articles` without blog namespace.

---

## 9. Storage architecture recommendation

### Options compared (realistic for this repo)

| Option | Fit | Drawbacks |
| --- | --- | --- |
| Repo-backed MD/JSON only | Simple deploys, great versioning | Weak admin UX; poor fit for 183 HTML bodies + ongoing publishing; duplicates KJJ’s already-built Supabase admin path |
| **Supabase (recommended primary)** | Matches existing admin/auth/MFA, `articles`/`site_pages` patterns, RLS, search later | Needs JJB project + migrations; HTML sanitiser on write |
| Hybrid (Supabase rows + CDN/Storage assets) | Best practical split | Two systems to backup |

### Recommendation: **Supabase-primary hybrid**

1. **Documents** (articles, techniques, pages, past_events) in Supabase.
2. **Media:** initially Shopify CDN URLs on the row; later optional copy into **Supabase Storage**.
3. **Redirects / 410 ledger** remain code/CSV-generated (Phase 2B) — not duplicated as CMS content.
4. **Admin:** extend existing TipTap/admin console rather than a new headless CMS.
5. **Backups:** Supabase PITR + periodic export of `source_shopify_id` + handles for disaster recovery.
6. **Search:** start with SQL/`ilike` or Postgres full-text; Algolia-class search only if needed later.
7. **Deploy:** content changes do not require frontend redeploy once App Router reads Supabase (same as KJJ `ARTICLES_SOURCE=supabase` pattern).

Do **not** commit the private Shopify JSON into git as the long-term content store.

---

## 10. Import plan sketch (next phase — not executed)

1. Idempotent importer keyed by `source_shopify_id`.
2. Map 122 `blog` → `article`, 61 `techniques` → `technique` (draft stays draft).
3. Sanitize HTML; extract YouTube IDs; strip product tags; rewrite links per §3.
4. Import KEEP pages; skip or stub PageFly empties pending §7 decisions.
5. Mark event duplicates for editorial resolution before public launch.
6. Dry-run + diff against inventory CSV; fail closed on unclassified handles.
7. No live attach until JJB Supabase + flags ready.

---

## 11. Decisions — resolved vs still open

**Resolved** by the approved post-2C / post-2D decisions (see top of this doc), including MailerLite success behaviour, MATLIFE10 retirement, Club Network ≠ Past Events, Kingston Jiu Jitsu Ltd as JJB legal operator, and separate JJB Supabase.

**Still open / confirm before relevant sub-phases:**

1. Whether live MailerLite forms/automations actually require `/pages/check-your-email` or `/pages/sign-up-thank-you` as site-hosted success URLs (if not, do not rebuild them).
2. Exact native landing copy/layout for the two Free Stuff rebuilds (ML form codes known from live HTML).
3. Eventual Club Network page rebuild content (separate from Past Events).
4. Approved final legal copy for JJB under Kingston Jiu Jitsu Ltd (placeholders until then).
5. Provisioning of the separate JJB Supabase project (implementation phase — must not touch KJJ production).

---

## 12. Files created (this phase)

| File | Tracked? | Purpose |
| --- | --- | --- |
| `docs/rebuild/JJB-phase-2c-content-migration-audit.md` | yes | This audit |
| `docs/rebuild/JJB-phase-2c-content-migration-inventory.csv` | yes | One row per article/technique/page/event-product |

Private export under `imports/shopify/private/` was **read only** and remains gitignored.

---

## 13. Explicit non-actions

- No application code changes  
- No content import  
- No database records / migration apply  
- No media download  
- No commit, push, or deploy  
