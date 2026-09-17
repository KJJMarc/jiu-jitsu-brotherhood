# JJB Phase 0 — KJJ extraction audit

**Date:** 17 September 2026  
**Repository:** `jiu-jitsu-brotherhood` on `main`  
**Baseline commit inspected:** `04f936b` (`docs: add approved JJB rebuild plan`) plus local uncommitted work listed at the end  
**Source of truth:** Stages 1–7 in numerical order; later approved decisions override earlier wording  
**Constraints honoured:** no application-code changes; no package installs; no migrations; no production database, credential, Supabase or Vercel access; no deploy; payments not enabled

Classification used throughout: **Keep** / **Adapt** / **Remove** / **New**.

This snapshot is an unchanged Kingston Jiu Jitsu (KJJ) Next.js application. It is a viable engineering starting point for Jiu Jitsu Brotherhood (JJB), not a JJB site yet.

## Approved decisions (17 September 2026)

These close earlier Phase 0 questions. They override Stage 6 SVG-logo wording and the open items they replace. Unlisted §12 items remain open.

| Decision | Status |
| --- | --- |
| The supplied horizontal PNG is the approved **desktop header logo**. Intended repo path: `public/brand/jjb-header-logo.png`. Do not redraw, crop, optimise or otherwise alter its pixels when placing it. | **Approved** |
| A separate mobile / favicon mark may be supplied later. Do not invent one. | **Approved** |
| Keep **Poppins** during Phase 1. | **Approved** |
| Future order-number prefix is **`JJB-`**. | **Approved** |
| Redirect the old Kingston page (`/pages/bjj-in-kingston-upon-thames` and equivalent legacy sources) to `https://www.kingstonjiujitsu.com/`. | **Approved** |
| Remove academy collection from JJB’s **public** fulfilment flow. UK shipping only at launch. | **Approved** |
| Keep the root-level `app/` structure. Do not move to `src/` in Phase 1. | **Approved** |
| Keep the existing admin allowlist during Phase 1. Role expansion (`owner` / `editor` / `shop_admin`) belongs to Phase 2. | **Approved** |
| Keep the server-only public product-access pattern **provisionally**. The final RLS model (service-role vs anonymous published-product SELECT) remains open. | **Approved provisionally** |

### Header logo verification

Inspected without writing or converting any image bytes.

| Check | Result |
| --- | --- |
| `public/brand/jjb-header-logo.png` | **Not present** in the repository (`public/brand/` does not exist) |
| Pixels altered | **No** — nothing was copied, cropped, optimised or re-encoded |
| Supplied source on disk | `/Users/marcbarton/Desktop/JJB cropped logo.png` |
| Format | PNG signature `89 50 4E 47`; IHDR 2170×725, 8-bit, colour type 6 (truecolour + alpha) |
| Transparency | **Yes** — alpha range 0–255; 1,564,317 fully/partially transparent pixels; four corners `(0,0,0,0)` |

The chat-attached preview was a JPEG (`FF D8…JFIF`), not the source PNG, and was not used as an asset.

Phase 1 should place a **byte-identical** copy of the Desktop PNG at `public/brand/jjb-header-logo.png`. Until that copy exists, the approved desktop header logo is not in git.

---

## 1. Current technical architecture and dependency summary

| Layer | Current state |
| --- | --- |
| App | Next.js App Router `^15.5.25`, React `^18.3.1`, TypeScript `^5.6.3` (strict), path alias `@/*` |
| Layout | Repo-root `app/` — **keep**; do not move to `src/` |
| Hosting intent | Vercel env vars (`VERCEL_ENV`, `VERCEL_URL`) used in code; **no** `vercel.json`, **no** GitHub Actions, **no** Dockerfile |
| Data | Supabase PostgreSQL + Auth + Storage. 23 SQL migrations for a **dedicated KJJ** project. Comments explicitly say “not Dojo Director” |
| Admin | `/admin` with Supabase Auth, `admin_users` allowlist, mandatory TOTP (AAL2) |
| Public CMS | `articles` + `site_pages` with published/draft RLS; `ARTICLES_SOURCE` (`json` default) and `PAGES_SOURCE` (`supabase` default) |
| Shop | Public `/shop` with guest checkout, Mollie, Resend, UK shipping bands; academy collection exists in KJJ and must be removed from JJB public fulfilment |
| Payments | `MOLLIE_API_KEY` + `MOLLIE_ALLOW_LIVE`; live keys blocked on preview/dev |
| Email | Resend for **store transactional mail only**. Hard-coded KJJ from/reply-to |
| Analytics | Consent-gated Meta Pixel / Google tag from `tracking_settings`; admin GA4 + Search Console via service-account JSON |
| Tests | No Jest/Vitest/Playwright. Six ad-hoc `scripts/test-*.mjs` files, none wired as `npm test` |
| Package name | `kingston-jiu-jitsu` |

**Runtime dependencies:** `@supabase/ssr`, `@supabase/supabase-js`, TipTap 3.31, `next`, `react`, `resend`, `server-only`.  
**Dev:** ESLint/Next, TypeScript, `csv-parse`, `sharp`, `tsx`.

**URL behaviour today:** `trailingSlash: true` (WordPress parity), canonical host `www.kingstonjiujitsu.com`. Stage 5 requires **no trailing slash** and `www.jiujitsubrotherhood.com`.

**Feature flags from Stage 7 are absent.** There is no `SHOP_ENABLED`, `CHECKOUT_ENABLED`, `PAYMENTS_ENABLED`, `LEAD_FORMS_ENABLED`, `MILITARY_DISCOUNT_ENABLED`, or `SEARCH_ENABLED`. The public shop is already implemented and would serve real catalogue/checkout if this repo were deployed with live credentials.

---

## 2. Reusable KJJ systems and components

These are operationally proven and should be reused as patterns, not copied as KJJ product.

| Area | Verdict | Notes |
| --- | --- | --- |
| Next.js App Router + RSC/server-actions split | **Keep** | Matches Stage 7 |
| Strict TypeScript, `@/` alias | **Keep** | |
| Security headers + CSP report-only | **Adapt** | Hosts, PayPal `form-action`, Maps, KJJ comments |
| Supabase split clients (`browser`, `server`, `admin`, `public`, `env`) | **Keep** | Service-role validation in `lib/supabase/admin.ts` is sound |
| Admin allowlist + MFA + `is_admin()` / `is_admin_aal2()` | **Keep** in Phase 1 | Role expansion is Phase 2 |
| Admin chrome, TipTap editor, image upload (5MB, AAL2 storage) | **Keep** | Extend for techniques, authors, categories |
| Article/page draft–publish + admin preview | **Keep** | Add `archived`, `noindex` preview, query-layer draft blocking |
| Products / variants / images / `inventory_movements` | **Keep** | Strong shop foundation |
| `stock_review_required` + Shopify handle fields | **Keep** | Directly matches Stage 4 import rules |
| Dual cart cookies (preview vs public) | **Adapt** | Rename `kjj_*` cookies; keep isolation |
| Server-priced checkout; client sends IDs/qty only | **Keep** | Stage 7 checkout step 1–2 |
| Mollie hosted payment + webhook + return-is-not-proof | **Keep** | Add `PAYMENTS_ENABLED` fail-closed |
| `MOLLIE_ALLOW_LIVE` + Vercel non-prod block | **Keep** | Complement, do not replace, Stage 7 flags |
| `store_payment_events` idempotency | **Keep** | |
| Guest order token (hash in DB, raw in Mollie metadata) | **Keep** | |
| UK postcode/country rejection in `lib/store/shipping.ts` | **Keep** | Confirm JJB bands separately |
| Weight-band shipping table | **Adapt** | KJJ prices/bands are not approved JJB rates |
| Resend adapter shape | **Adapt** | Move KJJ from-addresses behind env/adapter |
| Consent banner + cookie register | **Adapt** | Rename cookie; rewrite policy copy |
| Tracking settings loaded only after consent | **Keep** | Do not load KJJ GA4 IDs |
| Admin GA4 / Search Console cards | **Adapt** | New property IDs; no KJJ defaults |
| Storefront product card/gallery/variant/qty | **Adapt** | Restyle to Stage 6; hide provisional stock |
| Admin store products/orders/fulfilment UI | **Adapt** | Remove academy collection from the public fulfilment flow |
| Shopify import scripts (dry-run, apply, inventory, drafts) | **Adapt** | Point at JJB audit; do not import KJJ CSV |
| Mollie/shipping/idempotency node tests | **Keep** | Expand into Stage 7 unit/integration set |

---

## 3. Components requiring adaptation for JJB

| Current | Required by Stages 2–7 | Verdict |
| --- | --- | --- |
| Local-academy IA (Classes, Join Us, Locations, Timetable, Instructors) | Content-led IA: Start Here, Articles, Techniques, Brotherhood, Shop | **Adapt** / mostly **Remove** public routes |
| `lib/site.ts` identity, nav, venues, Dojo Director links | JJB name, host, nav, no class-booking stack | **Adapt** |
| Poppins + white/`#e40613` tokens | Stage 6 warm paper / `#D51F2A`; **keep Poppins in Phase 1** | **Adapt** tokens; **Keep** Poppins for Phase 1 |
| Circular K logo / `app/icon.png` | Approved horizontal PNG for desktop header; mobile/favicon mark later | **Adapt** — use `public/brand/jjb-header-logo.png` when placed; no generated mark |
| `articles` as KJJ club news at `/{slug}/` | `content_items` with `article` \| `technique`; `/articles/{slug}`, `/techniques/{slug}` | **Adapt** |
| `site_pages` templates `legal` / `cookie` / `kids` | Modular pages + policy templates; kids-class page is KJJ | **Adapt** |
| `admin_users` binary allowlist | Keep in Phase 1; `admin_profiles` roles in Phase 2 | **Keep** then **Adapt** |
| `product_type` `physical` \| `non_shipping` | `product_kind` `physical` \| `event_draft`; only physical can publish | **Adapt** |
| Collection + UK shipping fulfilment | Remove academy collection from JJB public fulfilment; UK shipping only | **Remove** public collection / **Adapt** shipping |
| Order numbers `KJJ-YYYYMMDD-####` | Prefix **`JJB-`** | **Adapt** |
| Public shop live in code | `SHOP_ENABLED` / `CHECKOUT_ENABLED` / `PAYMENTS_ENABLED` fail-closed | **Adapt** |
| Sitemap includes KJJ class/instructor/news/shop URLs | Canonical 200 JJB URLs only; no drafts, checkout, admin | **Adapt** |
| `trailingSlash: true` | Stage 5: no trailing slash | **Adapt** |
| Contact = phone/WhatsApp/Dojo Director trial | Contact form + email, Club Network routing | **Adapt** / **New** form |
| Cookie name `kjj_cookie_consent` | JJB-owned name | **Adapt** |
| CSP allows PayPal + Google Maps | Mollie hosted checkout; Maps only if Club Network map is approved | **Adapt** |
| Repo `app/` at root | Keep root-level `app/`; do not move to `src/` | **Keep** |
| KJJ docs under `docs/` (migration-plan, store audits) | JJB rebuild docs under `docs/rebuild/` | **Adapt** (archive KJJ docs; do not treat as JJB spec) |

---

## 4. KJJ-specific features and content that must be removed

Do not publish these on JJB. Do not migrate them as JJB content.

**Public academy product (Remove)**

- Home sections: class CTAs, testimonials-as-academy-proof, “book a free trial”
- Routes: `/classes`, `/join-us`, `/locations`, `/timetable`, `/kids-timetable`, `/beginners-programme`, `/instructors`, `/kids-class-information`, class slugs, instructor bio slugs
- `lib/class-pages.ts`, `lib/instructors.ts`, `lib/timetable.ts` (Dojo Director API)
- Venues: Tiffin Sports Centre, St John’s Parish Hall
- Membership: FastDD `fastdd.co.uk/...c=Kingston-Jiu-Jitsu`
- Online portal: `kingstonjiujitsuonline.com`
- Dojo Director book/trial/timetable/belt-ranking URLs
- WhatsApp to `07584 131335`
- KJJ `lib/news.json` club-news archive and `/news` index
- Child-protection / kids-class CMS seeds (KJJ safeguarding pages — replace with JJB legal review, do not copy)
- Header/footer Shop notes about `store.kingstonjiujitsu.com` rollback
- `public/images` academy/news/story photography (KJJ people, mats, branding)
- OG image and app icons (KJJ “K” mark)

**KJJ store behaviours that must not become JJB public behaviour (Remove or Adapt)**

- “Collect at Kingston Jiu Jitsu” fulfilment copy and collection flow
- Non-shipping public products (KJJ drop-ins, seminars, kids competition tickets)
- Order email brand “Kingston Jiu Jitsu” / “New KJJ order”
- Public shop enabled by default

**Out of JJB scope by Stage 2/4/7 (Remove if present; do not build)**

- Customer accounts
- Course access / membership access / digital downloads
- Public event-ticket checkout
- Military discount until a later approved feature
- Shopify theme, PageFly, Plug in SEO, Langify, buy buttons

---

## 5. Hard-coded KJJ names, domains, analytics IDs and service references

Representative inventory (application and config only; rebuild Markdown excluded).

| Kind | Value | Location (examples) | Verdict |
| --- | --- | --- | --- |
| Product name | `kingston-jiu-jitsu` | `package.json`, lockfile | **Adapt** |
| Display name | Kingston Jiu Jitsu / KJJ | `lib/site.ts`, layouts, admin login, emails, migrations | **Adapt** |
| Canonical host | `www.kingstonjiujitsu.com` | `lib/site.ts`, `next.config.mjs`, `.env.example` | **Adapt** |
| Apex host | `kingstonjiujitsu.com` | `next.config.mjs` | **Adapt** |
| Email | `admin@kingstonjiujitsu.com` | `lib/site.ts`, Resend constants, `site_settings` seed | **Adapt** |
| Resend from | `noreply@send.kingstonjiujitsu.com` | `lib/store/resend.server.ts` | **Adapt** |
| Phone | `07584 131335` | `lib/site.ts`, contact page | **Remove** from JJB unless a JJB number is supplied |
| GA4 property | `360613226` | `.env.example`, `lib/admin/ga4-traffic.server.ts` comments | **Remove** as default; JJB must use its own property |
| Search Console | `sc-domain:kingstonjiujitsu.com` | `lib/search-console/env.ts` | **Remove** default |
| Social | facebook/instagram `/kingstonjiujitsu/`, Twitter `@KingstonJits`, YouTube `UCjdHYMuxqEybo4Y_VlA55tQ` | `lib/site.ts`, `site_settings` seed | **Remove** / replace |
| Google Place reviews | Place ID `ChIJRSXmcegLdkgR5YMyOhEqRtA` | `lib/site.ts` | **Remove** |
| Dojo Director | `dojodirector.com/kingston-jiu-jitsu*` | `lib/site.ts`, `next.config.mjs`, `lib/timetable.ts` | **Remove** |
| Member portal | `kingstonjiujitsuonline.com` | `lib/site.ts` | **Remove** |
| Membership | FastDD Kingston club code | `lib/site.ts` | **Remove** |
| Cookie names | `kjj_cookie_consent`, `kjj_store_*` | `lib/cookies.ts`, `lib/store/cart.ts` | **Adapt** |
| Order prefix | `KJJ-` | `store_orders` SQL function | **Adapt** |
| Collection label | Collect at Kingston Jiu Jitsu | fulfilment migration + email templates | **Remove** |
| Beginners guide URL | still points at **JJB Shopify** `jiujitsubrotherhood.com/pages/beginners-guide-to-bjj-signup` | `lib/site.ts` `externalLinks.beginnersGuide` | **Adapt** to native `/start-here/beginners-guide` |
| CSP PayPal | `form-action ... paypal.com` | `next.config.mjs` | **Adapt** (Mollie hosted, not PayPal forms) |

`.env.example` documents KJJ Auth redirect URLs and a real-looking GA4 numeric ID. It contains placeholders for secrets, not live keys. **Do not reuse KJJ analytics or Search Console properties on JJB.**

Historical KJJ measurement IDs appear only in `docs/migration-plan.md` (`G-W6WQ8BP8EC`, `UA-160765391-1`, `GTM-WHZ3NLB`). Those are KJJ WordPress-era notes, not wired in this Next app’s tracking loader.

---

## 6. Supabase schema and migration reuse assessment

23 migrations exist. They are KJJ-branded and must be applied only to a **new JJB** project, never to KJJ production.

### Reuse as base (Keep / Adapt)

| Object | Verdict | Gap vs Stage 7 |
| --- | --- | --- |
| `admin_users` | **Keep** in Phase 1 | Role expansion (`admin_profiles`) is Phase 2 |
| `is_admin()`, `is_admin_aal2()` | **Keep** | Extend to roles |
| `articles` | **Adapt** | Becomes `content_items` + categories/tags/authors/media; unique slug **per type**; `legacy_shopify_id` / `legacy_url`; `original_published_at`; `archived` status |
| `article-images` bucket | **Keep** | Add private migration bucket; alt/credit/checksum |
| `site_pages` | **Adapt** | Modular `sections` JSONB; drop kids-class template; seed JJB pages not KJJ policies |
| `site_settings` | **Adapt** | Reseed; secrets must never live here (already true) |
| `tracking_settings` | **Keep** | Empty until JJB IDs + consent |
| `products` / `product_variants` / `product_images` / `inventory_movements` | **Adapt** | Add `product_kind`, category FK, `shipping_required`, `taxable` review, `stock_review_required` on product as well as variant, prevent `event_draft` publish |
| `shopify_handle` | **Keep** | Stage 7 `legacy_shopify_id` / `legacy_url` |
| `store_fulfilment_settings` / `store_shipping_bands` | **Adapt** | Remove academy collection from the public fulfilment flow; bands need JJB rates (**open**) |
| `store_orders` / `store_order_items` / `store_payment_events` | **Adapt** | Add reservations; align status enums; order prefix **`JJB-`**; drop public collection statuses |
| Guest `customer_access_token_hash` | **Keep** | |
| Email sent-at columns | **Keep** | |
| Admin-only product RLS + service-role public reads | **Keep provisionally** | Continue the server-only public product-access pattern. Final RLS (anonymous published-product SELECT vs service role) remains open. |

### Missing vs Stage 7 (New)

`authors`, `content_categories`, `tags`, `content_item_tags`, `content_relations`, `events_archive`, `event_media`, `media_assets`, `shop_categories`, `inventory_reservations`, `discount_rules` (scaffold inactive), `lead_resources`, `form_submissions`, `redirects` (query-aware), `navigation_items`, `admin_audit_log`, PostgreSQL FTS search vector.

KJJ `articles.categories` is a text array of KJJ news categories — **do not** import Shopify product-style tags into it. Stage 3 categories must be seeded as `content_categories`.

**Do not run these migrations against KJJ production. Do not share the KJJ Supabase project.**

---

## 7. Shop, inventory, order and Mollie reuse assessment

| Concern | KJJ now | JJB Stages 4/7 | Verdict |
| --- | --- | --- | --- |
| Guest checkout, no customer accounts | Yes | Required | **Keep** |
| UK-only shipping validation | Yes | Required | **Keep** |
| Collection at academy | Yes | Remove from JJB **public** fulfilment flow | **Remove** from public |
| Physical vs tickets/digital | `non_shipping` can be public | Public physical only; 4 event products unpublished `event_draft` | **Adapt** |
| Prices as integer pence, GBP | Yes | Required | **Keep** |
| Stock movements, not silent overwrites | Yes | Required | **Keep** |
| `stock_review_required` blocks purchase | Yes (variant) | Required (product + variant) | **Adapt** |
| Inventory reservations before Mollie | **Absent** (stock applied after paid) | Required | **New** |
| Discount engine | **Absent** | Scaffold only; military discount unpublished | **New** (inactive) |
| Mollie webhook idempotency | Yes | Required | **Keep** |
| `PAYMENTS_ENABLED=false` until approved | **Absent** (shop is coded live) | Required | **New** |
| Payment methods | creditcard, applepay, paypal via Mollie | Not specified beyond Mollie | **Keep** pending confirmation |
| Public catalogue | Active products via service role | Keep server-only public product-access **provisionally**; final RLS still open | **Keep provisionally** |
| Admin preview storefront | `/admin/store/preview` | Preview `noindex`, not in sitemap | **Keep** |

KJJ shipping bands are a working calculator, not an approved JJB rate card. **Do not guess JJB prices.**

---

## 8. Security, secret, deployment and data-isolation risks

| Risk | Severity | Notes |
| --- | --- | --- |
| Deploying this snapshot with KJJ env vars | **Blocker if it happens** | Would serve KJJ content/shop/payments on a JJB git remote. Never attach KJJ Supabase, Mollie live, Resend, or GA4 to this repo |
| No CI | High | Stage 7 requires lint, typecheck, tests, build, secret scan, redirect validation |
| No `.env` in git | OK | `.env.example` only; `.gitignore` covers `.env*` and `/imports/shopify/private/` |
| Shopify audit locally extracted | OK if ignored | Extract lives under `imports/shopify/private/` and is gitignored. Do not commit |
| Service role used for public shop | Medium | Correct if server-only; catastrophic if leaked to client. Current `admin.ts` guards look solid. Add tests |
| Product RLS is admin-only | Medium | Public shop currently uses server-only service-role reads. That pattern is **kept provisionally**; mixing it with anonymous SELECT without a later decision and tests remains a risk |
| Mollie webhook unauthenticated | Expected | Relies on fetching payment from Mollie. Keep |
| Order token in Mollie metadata | Accepted KJJ pattern | Keep; do not log raw token |
| `GA4_SERVICE_ACCOUNT_JSON` | High if copied from KJJ | JJB needs its own SA; never commit JSON |
| Admin MFA | Keep | Required |
| Preview vs public cart cookies | Keep after rename | Prevents admin draft leakage into public bag |
| Trailing-slash / host mismatch | SEO | Wrong host or slash policy would duplicate JJB URLs |
| KJJ `site_settings` public read | High if reused | Seed contains KJJ name, email, social, SEO title |
| No `PAYMENTS_ENABLED` | High | Checkout can run whenever Mollie test/live key exists |
| Legal policy export failed in Shopify audit | Medium | Shop GraphQL `privacyPolicy` fields missing; page bodies still present. Legal pages need rewrite + legal review, not silent copy |
| Sticker-pack variant quantity `-113` | Data quality | Do not import this product (Stage 4 Remove) |

No production credentials were opened in this audit. The Shopify export README states **credentials saved: No**.

---

## 9. Differences between the existing codebase and Stages 1–7

Later documents win. Material deltas:

| Topic | Codebase | Approved spec | Action |
| --- | --- | --- | --- |
| Site purpose | Local academy + shop | Content-led publication + small UK shop | Rebuild IA |
| Primary nav | About / Classes / Join / Find us / Contact / Shop | Home, Start Here, Articles, Techniques, Brotherhood, Shop | Replace |
| Canonical host | kingstonjiujitsu.com | www.jiujitsubrotherhood.com | Replace |
| Trailing slash | On | Off | Replace |
| Articles | KJJ news, root slugs | 120 ordinary articles + 2 event-archive records at `/articles` and `/events/archive` | New content model + import |
| Techniques | None | 60 published + 1 draft at `/techniques` | New |
| Lead magnets | External JJB Shopify URLs | Native `/start-here/beginners-guide` and `/start-here/how-to-suck-less` | New |
| Club Network / Philosophy / Past Events | Absent | Required pages | New |
| 410 responses | A few KJJ WordPress paths | Deterministic 410 for retired courses/downloads | New redirect engine |
| Search | Absent | Postgres FTS | New |
| Email capture / contact form | Mailto / Dojo Director | Protected form endpoints + adapters | New |
| Shop categories | Flat catalogue + sort | Six named categories | New `shop_categories` |
| Event tickets | Would be `non_shipping` products | Admin drafts, 404 public, not Past Events | Constraint + import rule |
| Military discount | Absent | Unpublished future feature | Do not build in Phase 1 |
| Logo | KJJ raster | Approved horizontal PNG for desktop header; mobile/favicon later | Place byte-identical PNG at `public/brand/jjb-header-logo.png` |
| Fonts | Poppins (Google) | **Keep Poppins in Phase 1** | Keep |
| Layout | Root `app/` | Keep root `app/` | Keep |
| Tests / CI | Ad-hoc scripts | Unit, integration, e2e, PR gates | New |
| Flags | None | Fail-closed flags | New |
| Migration tooling | KJJ Shopify CSV scripts | JJB audit JSON pipeline with exact reconciliation | New |

### Intra-plan overrides already resolved (do not reopen)

- Stage 1 suggested ~7 shop groups including Events. **Stage 4:** six physical categories; events are unpublished product drafts, not a shop group.
- Stage 1 suggested a looser nav. **Stage 2** navigation is approved.
- Stage 1 “one content system” means one editor/table. **Stages 6–7:** separate public indexes for Articles and Techniques.
- Stage 6 asked for supplied SVG wordmark/serpent and a placeholder until then. **Approved 17 September 2026:** the supplied horizontal PNG is the desktop header logo; a mobile/favicon mark may follow later. Do not generate a mark.
- Stage 6 font fallback was Manrope + Source Sans 3. **Approved:** keep Poppins during Phase 1.
- Stage 5 named the Kingston page target only as “the canonical Kingston Jiu Jitsu website”. **Approved:** `https://www.kingstonjiujitsu.com/`.

### Remaining spec gaps (not conflicts)

Listed in §12. These are missing decisions, not contradictions. Logo format, Phase 1 font, order prefix, Kingston redirect URL, public collection, `app/` layout and Phase 1 allowlist are now decided.

---

## 10. Shopify audit contents and migration-readiness assessment

**Archive:** `imports/shopify/private/jjb-shopify-audit-20260916-091414.zip`  
**Read-only extract (gitignored):** `imports/shopify/private/jjb-shopify-audit-20260916-091414/`  
**Store:** `jiu-jitsu-brotherhood.myshopify.com`  
**Primary domain in export:** `www.jiujitsubrotherhood.com`  
**Exported:** 2026-09-16T08:14:25Z, API `2026-07`  
**Credentials in export:** No

### File inventory

| File | Records | Matches Stage 1? |
| --- | ---: | --- |
| `articles.json` | 183 | Yes (122 `blog` + 61 `techniques`) |
| `blogs.json` | 6 | Yes |
| `pages.json` | 30 | Yes |
| `products.json` | 35 | Yes (28 ACTIVE, 7 DRAFT) |
| `collections.json` | 32 | Yes (17 empty-looking in export nodes; 15 with products) |
| `redirects.json` | 289 | Yes; 7 query-string sources; 237 blog / 44 page / 6 product / 1 collection / 1 external |
| `files.json` | 913 READY (911 images, 87 &lt; 300px) | Yes |
| `menus.json` | 6 | Yes; active menu `main-menu-1` |
| `locations.json` | 1 — 56 Staunton Road, KT2 5TL | Yes |
| `themes.json` | 13 | Yes |
| `metaobjects.json` | 49 | Present; not required by Stages 1–7 as a migration target |
| `shop.json` | GBP, host confirmed | Yes |

**Section error:** `legal_policies` GraphQL fields do not exist on `Shop`. Privacy/terms still exist as **pages** with substantial HTML. Rewrite under legal review; do not treat the failed Shop policy query as missing legal content.

### Editorial reconciliation

| Gate (Stage 3/7) | Audit | Ready? |
| --- | --- | --- |
| 183 editorial records | 183 | Yes |
| 122 articles on blog `blog` | 122 | Yes |
| 2 event articles `summer-seaside-special`, `spring-super-seminar` | Both published on `blog` | Yes — migrate to `events_archive`, not ordinary articles |
| 60 published techniques + 1 draft | 61 techniques, 1 unpublished (`heel-hook-details-leigh-remedios`) | Yes |
| Author `JJB Admin` | All 183 | Yes — do not fabricate real authors |
| Missing summaries | Same 3 handles as Stage 1 | Yes |
| YouTube/iframe bodies | 98 articles contain youtube/iframe markup | Needs sanitiser + native embed component |
| PageFly landing pages | `beginners-guide-to-bjj-signup`, `how-to-suck-less-at-jiu-jitsu`, `jiu-jitsu-brotherhood-club-network` have **empty** `body` | Recreate natively; nothing to import as HTML |
| Belt system as article `/articles/bjj-belt-system` | **No article handle `bjj-belt-system`**. Content is Shopify **page** `progression-the-belt-system` | Import page → article with **new** slug `bjj-belt-system` (Stage 5 explicit replacement) |

Four query-string redirect targets point at blog handles **not** in the 183 (`commandments-for-jiu-jitsu`, `bjj-neck-injury-getting-stacked`, `episode-018-marc-barton`, `charlie-cooper`, `ep-067-charlie-cooper`). Stage 5 default is **410** unless a manual equivalent is approved.

`/membership-access` currently targets the closed Building Blocks page URL. Stage 5 overrides to **410**.

### Product reconciliation (Stage 4)

All 35 Shopify products classify with no remainder:

- **26 retain physical** — every Stage 4 retain handle is present, including `enso-4-0-gi-blue` ACTIVE with `totalInventory` 0 (must import as unpublished zero-stock draft).
- **5 remove** — `astrum-rashguard`, `musashi-limited-edition`, `tail-eater-back-pack`, `the-seeker-t-shirt`, `sticker-pack` (ACTIVE, `inventoryQuantity` −113, untracked).
- **4 event drafts** — three already DRAFT; `kids-club-network-interclub-competition-2026` is **ACTIVE** and must be forced to draft (404, not in sitemap).

Variants 154, media 158, SKUs 6 — matches Stage 1. SKUs are mostly event tickets plus one rashguard size. Physical SKU creation remains a review task.

**Inventory figures:** `product.totalInventory` sums to **470** (Stage 1). Sum of `variant.inventoryQuantity` is **278** because of untracked/negative rows. Stage 4 already says exported stock is provisional and `stock_review_required` must be set. Use totalInventory as the migration reference, never as live availability.

**Collection `enso-3-0`:** not a current collection in the export. It appears as the **target** of `/collections` → `/collections/enso-3-0`. Stage 5 still maps that target to `/shop/gis`.

Taxable flags were not re-audited here. Stage 4 requires a tax review before publication — **open**, not guessed.

### Migration readiness

**Ready to build tooling against:** counts, handles, redirects, files, menus, GBP shop domain.  
**Not ready to import into production:** no JJB database, no media bucket, no HTML sanitiser, no redirect manifest generator, no SKU/tax/stock sign-off, empty PageFly bodies, legal rewrite pending.

Import must be dry-runnable and fail closed on unclassified records (Stage 7).

---

## 11. Proposed Phase 1 file and schema changes

Phase 1 (Stage 7) is foundation only: shell, tokens, admin guard, env validation, flags, CI, fixture routes. **No Shopify import. No live payments. No production project attachment.**

### Suggested code touch list (after Phase 0 approval)

| Change | Verdict | Why |
| --- | --- | --- |
| `package.json` name/description → JJB | **Adapt** | Identity |
| `README.md` | **Adapt** | Stop describing KJJ |
| `.env.example` | **Adapt** | JJB host; remove KJJ GA4/Search Console defaults; document flags; still no secrets |
| `lib/site.ts` | **Adapt** | JJB name, `https://www.jiujitsubrotherhood.com`, approved nav stubs, drop Dojo Director/venues/KJJ social |
| `next.config.mjs` | **Adapt** | Canonical `www.jiujitsubrotherhood.com`; `trailingSlash: false`; Kingston page → `https://www.kingstonjiujitsu.com/`; strip other KJJ academy redirects; tighten CSP |
| `app/layout.tsx` + `app/globals.css` | **Adapt** | Stage 6 tokens; **keep Poppins**; desktop header uses approved PNG (byte-identical copy to `public/brand/jjb-header-logo.png`) |
| `components/Header.tsx` / `Footer.tsx` | **Adapt** | Stage 2/6 IA; desktop wordmark from the approved PNG; no invented mobile mark |
| Feature-flag module + startup validation | **New** | Fail-closed `SHOP_ENABLED`, `CHECKOUT_ENABLED`, `PAYMENTS_ENABLED`, `LEAD_FORMS_ENABLED`, `MILITARY_DISCOUNT_ENABLED`, `SEARCH_ENABLED` |
| Public `/shop` and checkout | **Adapt** | Hide behind flags (default false) so a mistaken deploy cannot take payment |
| Cookie/cart cookie names | **Adapt** | Stop writing `kjj_*` on the JJB domain |
| Admin auth/MFA/clients | **Keep** | Point at a future JJB Supabase project via env only |
| `app/robots.ts` / `app/sitemap.ts` | **Adapt** | New host; do not emit KJJ class/instructor/news URLs |
| Fixture routes | **New** | Minimal Home / Start Here / one Article fixture / 404 — empty or placeholder copy, no fake club-network claims |
| KJJ public academy pages | **Remove from sitemap and nav** | Physical files can remain unlinked until a later deletion PR to keep Phase 1 small |
| GitHub Action: lint, `typecheck`, flag/env unit tests | **New** | No production secrets in CI |
| Schema | **No applied migration in Phase 1** | Additive JJB identity/flags do not require DB. Keep admin allowlist; role tables wait for Phase 2 |

### Schema changes **not** in Phase 1

`content_items`, shop categories, reservations, redirects table, discounts, lead forms. Those are Phases 2–5.

---

## 12. Open decisions or genuine blockers requiring approval

Do not guess these. Items resolved on 17 September 2026 are listed in **Approved decisions** at the top of this document.

1. **JJB Supabase + Vercel projects** are not in this repository. Provisioning is required before any migration apply. Blocker for Phase 2+, not for a code-only Phase 1.
2. **Place the approved desktop header PNG** at `public/brand/jjb-header-logo.png` as a byte-identical copy. The path is not in the repo yet. A separate mobile/favicon mark is still outstanding.
3. **JJB shipping rate card** (bands, price, max weight). KJJ bands must not be silently reused. Academy collection is removed from the public fulfilment flow; rates are still unapproved.
4. **Transactional From / Reply-To / admin notify addresses** for Resend (or replacement provider). Stage 7: choose existing approved provider during implementation — **provider is not named for JJB**.
5. **Marketing email provider** and list IDs. Explicitly not to be hard-coded.
6. **Analytics:** JJB GA4 property ID, measurement ID, Search Console property. Do not use `360613226` or `sc-domain:kingstonjiujitsu.com`.
7. **Club Network roster** (which clubs, addresses, whether a map is maintained).
8. **Philosophy / About copy** — rewrite required; Shopify About HTML is not the approved JJB story.
9. **Contact phone / WhatsApp / response SLA.**
10. **Final product RLS model** — server-only public product access is kept provisionally; anonymous published-product SELECT vs service role is still open.
11. **Tax treatment** of retained products.
12. **Inventory source of truth** when `totalInventory` (470) ≠ sum of variant quantities (278). Stage 4 already requires manual confirmation; confirm the import default (zero vs Shopify quantity vs blank + review flag).
13. **Manual 410→301 overrides** for the 195 obsolete blog redirect targets and the five missing query-string article handles.
14. **Military discount eligibility process** — explicitly future; do not design in Phase 1.
15. **Error monitoring provider** — optional, disabled until configured.

None of the above should be filled in by the implementer.

Resolved and **not** to be reopened without a new decision: desktop header PNG (not SVG), Poppins in Phase 1, order prefix `JJB-`, Kingston redirect `https://www.kingstonjiujitsu.com/`, no public academy collection, keep root `app/`, Phase 1 admin allowlist.

---

## 13. Small, gated Phase 1 implementation plan

**Objective:** Make this repository safely JJB-branded at the shell/config layer, fail-closed for shop/payments, without connecting services or importing Shopify data.

### In scope

1. Identity and canonical host/path policy (no trailing slash). Kingston page → `https://www.kingstonjiujitsu.com/`.
2. Stage 6 colour/spacing tokens, **Poppins**, header/footer IA, and the approved desktop header PNG (byte-identical copy to `public/brand/jjb-header-logo.png`; no generated mobile mark).
3. Env example + fail-closed feature flags + validation helper.
4. Gate public shop/checkout/Mollie behind flags (default off). Public fulfilment is UK shipping only — no academy collection.
5. Rename first-party cookies away from `kjj_*`.
6. Fixture Home / Start Here / 404 (and optionally one unpublished article fixture in JSON, not a full CMS).
7. CI: lint + typecheck + new unit tests.
8. Keep admin MFA/allowlist code paths compiling against env placeholders (no role expansion).

### Out of scope

Package upgrades; Supabase/Vercel/Mollie/Resend configuration; migrations apply; Shopify import; enabling payments; deleting all KJJ page files in one sweep; writing real legal/About/Club Network copy.

### Tests (Phase 1 gate)

- Canonical host helper: apex vs www; no `kingstonjiujitsu.com` in production config module.
- `trailingSlash` / path helper: generated public paths have no trailing slash (except `/`).
- Feature flags: missing/empty/`false` ⇒ shop, checkout, payments, military discount, lead forms stay off.
- `resolveMollieApiKey` existing tests still pass; adding `PAYMENTS_ENABLED!==true` blocks creating payments even with a test key.
- Cookie names are not `kjj_*`.
- `npm run typecheck` and `npm run lint` pass.
- Production build with dummy public env and **no** service-role/Mollie keys still builds; shop routes do not expose checkout.

### Rollback

- Phase 1 is a git revert of the Phase 1 PR. No database and no DNS change.
- Do not attach a production domain in Phase 1.
- Shopify.com JJB store remains the live public site until Phase 7 cutover.
- If flags are wrong, default is off — rollback is revert + confirm env flags unset.

### Gate to Phase 2

- Approved visual shell (desktop + 360px) without claiming unfinished Club Network facts.
- Flags fail closed in tests.
- No KJJ production service wired.
- This Phase 0 document accepted or annotated with decisions from §12.

---

## Classification cheat sheet

| | Keep | Adapt | Remove | New |
| --- | --- | --- | --- | --- |
| Platform | Next/TS/Supabase/Vercel pattern, admin MFA, Mollie/Resend adapters, inventory movements, webhook idempotency | Identity, IA, tokens, schema, flags, trailing slash, emails, cookies, fulfilment | Academy pages, Dojo Director, FastDD, KJJ news/images/seeds, collection-at-Kingston, KJJ analytics defaults, customer-account leftovers | Content model, techniques, events archive, redirects engine, search, lead/contact forms, six shop categories, reservations, inactive discounts, 410 template, CI, migration pipeline |

---

## Inspected areas

- `docs/rebuild/JJB-stage-1-inventory.md` … `JJB-stage-7-technical-architecture-and-cursor-brief.md` (full text, in order)
- `package.json`, `package-lock.json`, `next.config.mjs`, `tsconfig.json`, `middleware.ts`, `.env.example`, `.gitignore`, `README.md`
- `app/` public, shop, admin, API webhook, `robots.ts`, `sitemap.ts`, `globals.css`
- `components/` header/footer, home, storefront, admin, cookies/tracking
- `lib/` site, news, legal, supabase, admin, store, storefront, ga4, search-console, cookies
- `supabase/migrations/` (all 23 files, summarized)
- `scripts/` import + test scripts (inventory, not executed against live services)
- Extracted Shopify audit JSON (counts, handles, redirects, menus, shop metadata). Source zip not modified. No customer/order/payment records in the export.
- Header logo: confirmed `public/brand/jjb-header-logo.png` is absent; read-only inspect of `/Users/marcbarton/Desktop/JJB cropped logo.png` (PNG RGBA, transparent). No pixels written.

Production databases, Vercel, Mollie, Resend, and live credentials were not accessed.

---

## Git status at report write

**Uncommitted:**

- Modified/untracked: `docs/rebuild/JJB-phase-0-kjj-extraction-audit.md` only
- Ignored: `imports/shopify/private/` (zip + extract)
- Application source: unchanged
- `public/brand/jjb-header-logo.png` was **not** added
- Do not commit this report until it is approved
