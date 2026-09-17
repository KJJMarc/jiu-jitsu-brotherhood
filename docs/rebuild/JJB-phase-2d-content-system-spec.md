# JJB Phase 2D — Content system technical specification

**Date:** 17 September 2026  
**Status:** Specification only — **not implemented**  
**Depends on:** Phase 2A/2B URL contract (`8e21c58`), Phase 2C content audit + approved decisions  
**Out of scope for this document’s approval gate:** applying schema, connecting Supabase, importing content, changing app code, commit, deploy

This spec defines how editorial content is stored, edited, imported, rendered, and routed on the rebuilt JJB site while preserving Shopify SEO URLs.

Authoritative companions:

- [`JJB-phase-2a-seo-url-migration-audit.md`](JJB-phase-2a-seo-url-migration-audit.md)
- [`JJB-phase-2a-url-inventory.csv`](JJB-phase-2a-url-inventory.csv)
- [`JJB-phase-2c-content-migration-audit.md`](JJB-phase-2c-content-migration-audit.md)
- [`JJB-phase-2c-content-migration-inventory.csv`](JJB-phase-2c-content-migration-inventory.csv)

---

## 0. Approved product decisions (must not be reopened silently)

1. Supabase-primary hybrid; Shopify CDN media by reference initially.  
2. Shared model: `article` | `technique` | `past_event` | `page`.  
3. Preserve YouTube embeds; Class C is not a reason to strip them.  
4. Never display `JJB Admin` publicly; optional authors later.  
5. Raw Shopify tags = source metadata only.  
6. Free Stuff landings KEEP/REBUILD at existing URLs; MailerLite delivery unchanged.  
7. One record per event; duplicate URL → 301 to canonical.  
8. Past Events index at `/pages/past-events`.  
9. `/pages/blog` → 301 → `/blogs/blog` (recommendation locked for routing phase).  
10. Legal copy rebuilt later under **Kingston Jiu Jitsu Ltd**; no invented boilerplate; do not copy KJJ legal pages verbatim.  
11. Master Academy → 410.  
12. Deterministic importer cleanup only.  
13. No new canonicals for model cleanliness.  
14. Preserve existing MailerLite success/confirmation behaviour initially; do not invent a JJB thank-you flow unless ML requires a site-hosted success URL.  
15. `MATLIFE10` retired → `/pages/your-discount-coupon` **410**.  
16. Club Network is separate from Past Events — do not merge.  
17. JJB uses a **completely separate Supabase project** — never reuse, modify, migrate, or connect to Kingston Jiu Jitsu production Supabase.

### Legal / business identity (approved)

**Jiu Jitsu Brotherhood is owned and operated by Kingston Jiu Jitsu Ltd.**

Treat Kingston Jiu Jitsu Ltd as the legal entity operating the JJB website and shop. Future JJB Terms, Privacy Policy, Cookie Policy, ecommerce terms, customer communications, and transactional emails may identify Kingston Jiu Jitsu Ltd as operator/controller/seller where appropriate.

Constraints:

- Do **not** copy existing KJJ website legal pages verbatim — JJB has a different site, proposition, and ecommerce configuration; policies must be reviewed and adapted for JJB.
- Preserve verified Kingston Jiu Jitsu Ltd company information from approved source material where appropriate.
- Do **not** invent or guess: company number, registered office, contact details, VAT status, payment-provider details, returns address, or other statutory information.
- Do **not** carry over inherited FastDD / PayPal-specific material unless it genuinely applies to the new JJB operation.
- **Mollie** is the planned JJB payment processor; final legal/payment wording only after commerce implementation is confirmed.
- Intended commerce: **physical products to UK customers only**.
- Legal pages may remain **unpublished/noindex placeholders** until JJB-specific copy is approved.

---

## A–C. Proposed Supabase schema

### Design choice

**One table** `public.contents` for all editorial types, plus small satellite tables for authors (future) and media registry (CDN → Storage). Do **not** create four separate CMS products.

KJJ seed tables `public.articles` / `public.site_pages` are reference patterns (RLS, TipTap `body_html`, admin allowlist) but are **not** the final JJB shape. Implementation must:

- create `contents` (and related tables) in a **new, separate JJB Supabase project**, and  
- leave unused KJJ tables unmigrated / eventually dropped,

rather than overloading slug-only `articles` without blog namespace.

**Hard rule:** do **not** reuse, modify, migrate data from, or connect this application to the Kingston Jiu Jitsu **production** Supabase project.

### A. `public.contents`

| Column | Type | Null | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | NO | `gen_random_uuid()` | Internal PK |
| `type` | `text` | NO | — | Check: `article` \| `technique` \| `past_event` \| `page` |
| `handle` | `text` | NO | — | Shopify handle; SEO-stable |
| `blog_handle` | `text` | YES | `null` | `blog` or `techniques` when type is article/technique; **null** for page/past_event unless past_event is served under a blog path |
| `title` | `text` | NO | — | |
| `status` | `text` | NO | `'draft'` | `draft` \| `published` \| `archived` |
| `published_at` | `timestamptz` | YES | `null` | Required when `published`; preserve Shopify timestamps on import |
| `excerpt` | `text` | NO | `''` | From Shopify `summary` / `bodySummary` |
| `body_html` | `text` | YES | `null` | Sanitised HTML; TipTap round-trip |
| `seo_title` | `text` | YES | `null` | Import only if present; **never invent** |
| `seo_description` | `text` | YES | `null` | |
| `featured_image_url` | `text` | YES | `null` | Absolute URL (CDN or later Storage public URL) |
| `featured_image_alt` | `text` | YES | `null` | |
| `featured_image_asset_id` | `uuid` | YES | `null` | FK → `media_assets` when migrated off CDN |
| `youtube_ids` | `text[]` | NO | `'{}'` | Ordered IDs extracted from body / Shopify |
| `tags_public` | `text[]` | NO | `'{}'` | Deliberate public taxonomy (empty at import) |
| `tags_source` | `text[]` | NO | `'{}'` | Raw Shopify tags (not rendered as site taxonomy) |
| `template` | `text` | YES | `null` | Page templates: `default` \| `legal_placeholder` \| `mailerlite_landing` \| `contact` \| … |
| `noindex` | `boolean` | NO | `false` | Legal placeholders, drafts preview, etc. |
| `author_id` | `uuid` | YES | `null` | FK → `authors`; null = no public byline |
| `event_starts_at` | `timestamptz` | YES | `null` | past_event only |
| `event_ends_at` | `timestamptz` | YES | `null` | |
| `event_location_label` | `text` | YES | `null` | Free-text location |
| `canonical_path` | `text` | NO | — | **Explicit** public path, e.g. `/blogs/blog/foo` or `/pages/bar`. Source of truth for routing/sitemap — **not** derived solely from `type` |
| `source_shopify_gid` | `text` | YES | `null` | e.g. `gid://shopify/Article/…` or `Page/…` |
| `source_shopify_author` | `text` | YES | `null` | e.g. `JJB Admin` — never shown publicly |
| `source_updated_at` | `timestamptz` | YES | `null` | Shopify `updatedAt` for idempotent skip |
| `source_payload` | `jsonb` | YES | `null` | Optional compact import provenance (no secrets) |
| `mailerlite_form_code` | `text` | YES | `null` | e.g. `n2l0c2` / `a1f8n6` for Free Stuff landings |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | trigger |
| `created_by` | `uuid` | YES | `null` | auth.users |
| `updated_by` | `uuid` | YES | `null` | auth.users |

**Constraints**

- `title` / `handle` non-empty; `handle` matches `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- `published` ⇒ `published_at IS NOT NULL`
- `canonical_path` matches `^/([a-z0-9-]+/)*[a-z0-9-]+$` or `/`
- `type=article` ⇒ `blog_handle='blog'`
- `type=technique` ⇒ `blog_handle='techniques'`
- `type=page|past_event` ⇒ `blog_handle IS NULL` **or** (for past_event served at blog URL) `blog_handle='blog'` with `canonical_path` under `/blogs/blog/…`

**Uniqueness / indexes**

| Name | Definition | Purpose |
| --- | --- | --- |
| `contents_canonical_path_uidx` | `UNIQUE (canonical_path)` | One document per public URL |
| `contents_source_gid_uidx` | `UNIQUE (source_shopify_gid) WHERE source_shopify_gid IS NOT NULL` | Idempotent import |
| `contents_type_handle_uidx` | `UNIQUE (type, blog_handle, handle)` NULLS NOT DISTINCT | Stable identity within type |
| `contents_published_list_idx` | `(type, published_at DESC) WHERE status='published'` | Indexes / feeds |
| `contents_status_idx` | `(status)` | Admin filters |

### B. `public.authors` (optional, future-ready)

| Column | Type | Null | Default |
| --- | --- | --- | --- |
| `id` | `uuid` | NO | `gen_random_uuid()` |
| `display_name` | `text` | NO | — |
| `slug` | `text` | NO | — unique |
| `bio` | `text` | YES | `null` |
| `avatar_url` | `text` | YES | `null` |
| `created_at` / `updated_at` | `timestamptz` | NO | `now()` |

Public byline only when `contents.author_id` is set. Import leaves `author_id` null.

### C. `public.media_assets`

Supports later CDN → Storage migration without changing content identity.

| Column | Type | Null | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | NO | `gen_random_uuid()` | |
| `kind` | `text` | NO | — | `image` \| `file` |
| `source_url` | `text` | NO | — | Original Shopify CDN URL (immutable audit) |
| `public_url` | `text` | NO | — | Currently served URL (= `source_url` initially) |
| `storage_path` | `text` | YES | `null` | Supabase Storage path when copied |
| `alt` | `text` | YES | `null` | |
| `width` / `height` | `int` | YES | `null` | |
| `sha256` | `text` | YES | `null` | Set on copy |
| `created_at` | `timestamptz` | NO | `now()` | |

`UNIQUE (source_url)`. Content rows reference `featured_image_asset_id`; inline HTML may keep absolute `public_url` strings rewritten by a later job.

### RLS (sketch)

- Public `SELECT` where `status='published'` AND (`noindex` allowed but still selectable for URL — sitemap excludes `noindex`).  
- Admin write via existing `is_admin()` allowlist pattern.  
- Service role for importer only.

---

## D. Publication / draft model

| Status | Public HTTP | Sitemap | Admin |
| --- | --- | --- | --- |
| `draft` | 404 (or preview cookie — see W) | No | Editable |
| `published` | 200 at `canonical_path` | Yes unless `noindex` | Editable |
| `archived` | Prefer **410** for intentionally retired URLs; else 404 | No | Read-only-ish |

Legal placeholders: `status=draft` or `published`+`noindex=true` until real copy ships — product choice at implementation; default **draft + reserved path** so middleware/ledger can still 301 aliases without indexing stubs.

---

## E. Source Shopify identity

- Always store `source_shopify_gid` + `source_updated_at` on import.  
- `source_shopify_author` retained; never rendered.  
- Optional `source_payload` for tags, templateSuffix, PageFly keys — **no API keys**.  
- Re-import key: `source_shopify_gid`. If GID missing (hand-created), uniqueness is `canonical_path`.

---

## F. SEO fields

- Persist `seo_title`, `seo_description` as imported.  
- If `seo_title` null → render `<title>` / og:title from `title` (app fallback).  
- `canonical_path` drives `<link rel="canonical">` and sitemap loc.  
- Do not generate new paths because the model is cleaner.

---

## G. Image / media representation

1. **Featured:** `featured_image_url` (+ optional asset FK).  
2. **Inline:** remain inside `body_html` as absolute URLs.  
3. **Initial import:** both point at Shopify CDN.  
4. **No download** in first import.  
5. YouTube: `youtube_ids[]` + responsive render component; body may keep a placeholder or cleaned figure.

---

## H. Event-specific representation

`type='past_event'` uses the same row plus nullable `event_*` fields.

| Event | Single record `canonical_path` | Redirect |
| --- | --- | --- |
| Summer Seaside Special | `/blogs/blog/summer-seaside-special` | `/pages/summer-seaside-special` → 301 |
| Spring Super Seminar | `/blogs/blog/spring-super-seminar` | `/pages/spring-super-seminar` → 301 |
| Welsh Winter Special | `/pages/welsh-winter-special` | — |
| Oli Geddes charity | `/pages/oli-geddes-foundation-charity-event-kingston-jiu-jitsu` | — |

Body preference for Seaside/Spring: **article recap HTML** (includes YouTube). Optionally append a short “Originally announced…” note only if editors choose later — **not** auto-merged announcement prose in v1.

Index page: create `contents` row `type=page`, `handle=past-events`, `canonical_path=/pages/past-events`, listing published `past_event` rows. Ticket products remain commerce entities, not content duplicates.

Wire redirects into Phase 2B ledger/overrides when implementing (not in this phase).

---

## I. Optional future author representation

- `authors` table ready; import does not create authors from `JJB Admin`.  
- UI: optional author picker on edit.  
- Public template: show byline only if `author_id` present.

---

## J. Public route resolution

Routes already exist (Phase 2B). Resolution algorithm:

1. Middleware applies Phase 2A/2B redirects/410s first (including future `/pages/blog` → `/blogs/blog`, event page → article canonical, master-academy 410).  
2. App Router page loaders query `contents` by **`canonical_path = request path`** (preferred) or by `(blog_handle, handle)` / `(type, handle)` as fallback.  
3. Mapping expectations:

| Path | Expected `type` |
| --- | --- |
| `/blogs/blog/{handle}` | `article` or `past_event` |
| `/blogs/techniques/{handle}` | `technique` |
| `/pages/{handle}` | `page` or `past_event` |
| `/pages/past-events` | `page` (index) |
| `/blogs/{emptyBlog}` | empty index shell (no rows required) |

**Invariant:** changing `type` never silently changes URL — only `canonical_path` does.

MailerLite landings: `type=page`, `template=mailerlite_landing`, `mailerlite_form_code` set, native React layout embeds public ML webform (no secrets).

---

## K. Admin list / create / edit workflow

Extend existing admin console (auth + MFA + allowlist):

| Surface | Behaviour |
| --- | --- |
| List | Filter by `type`, `status`, search title/handle |
| Create | Choose type → enforce handle/blog_handle/canonical_path rules |
| Edit | Shared form with type-specific sections (event dates; MailerLite code; legal noindex) |
| Preview | Draft preview link (see W) |
| Delete | Soft-archive preferred over hard delete for imported SEO URLs |

Reuse patterns from `AdminArticleEditor` / `AdminPageEditor` rather than a new CMS product.

---

## L. HTML editing approach

- Continue **TipTap** via `components/admin/rich-text/RichTextEditor.tsx` (MRCEM Mastery-style tutorial direction already in-repo).  
- Persist `body_html`.  
- Keep `YoutubeVideosField` (or equivalent) for explicit video IDs; sync into `youtube_ids` and embed nodes.  
- On save: server-side sanitiser (stricter than today’s public strip that removes **all** iframes — see R/S).  
- Do not paste PageFly document JSON into the editor.

---

## M. Image selection / upload strategy

**Phase I (import + early admin):**

- Featured image URL field (CDN).  
- Optional pick-from-known imported URL list.  
- No requirement to upload to Supabase Storage yet.

**Phase II (later):**

- Upload to Supabase Storage → create `media_assets` → set `public_url` + `storage_path`.  
- Featured field stores asset id; `featured_image_url` mirrors `public_url` for simple queries.  
- Inline image insert uses Storage public URL.

---

## N–O. Deterministic Shopify importer + idempotency

### Inputs

- Private export path (gitignored): `imports/shopify/private/jjb-shopify-audit-…/`  
- Phase 2C inventory CSV (decisions)  
- This spec’s mapping rules  

### Behaviour

1. Dry-run by default; `--write` only against JJB Supabase with explicit env.  
2. Upsert on `source_shopify_gid`.  
3. Skip when `source_updated_at` unchanged and checksum of normalised body matches.  
4. Never delete rows unknown to export without `--prune` (default off).  
5. Map:

| Export | `type` | `canonical_path` |
| --- | --- | --- |
| Article blog=`blog` (non-event) | `article` | `/blogs/blog/{handle}` |
| Article blog=`techniques` | `technique` | `/blogs/techniques/{handle}` |
| Seaside/Spring articles | `past_event` | `/blogs/blog/{handle}` |
| Event-only pages (welsh, oli) | `past_event` | `/pages/{handle}` |
| KEEP pages | `page` | `/pages/{handle}` |
| Free Stuff pages | `page` + ML template | `/pages/{handle}` — **body not imported from empty GraphQL**; seed native placeholder + form codes from this spec |
| Duplicate event pages | **no content row** | ledger 301 only |
| 410 targets | **no published row** | ledger 410 |

6. Create `/pages/past-events` index row if missing (hand-authored stub).  
7. Log every transformation code (see T) to an import report artifact (tracked summary OK; not private export dump).

### Safe reruns

- Idempotent upserts.  
- Preserve admin edits if `updated_at > source_updated_at` unless `--force-shopify`.  
- Transaction per batch; fail closed on unclassified handles.

---

## P. Validation before / after import

**Before**

- Inventory row count stable; every MIGRATE handle present in export.  
- No two rows claim same `canonical_path`.  
- Event duplicate redirect targets resolve to a migrated canonical.  

**After**

- Counts: 120 articles (122 − 2 event articles retyped) + 61 techniques + past_events + pages — exact expected table in importer tests.  
- Spot-check YouTube ID extraction count ≈ 95.  
- `JJB Admin` never appears in public render fixtures.  
- `tags_public` empty; `tags_source` populated.  
- SEO title null retained where Shopify lacked title_tag.  
- Routing tests extended for event 301s and `/pages/blog` 301 (implementation phase).

---

## Q. Rollback strategy

1. Importer writes to a stamped `import_run_id` in `source_payload`.  
2. Rollback = soft-unpublish (`archived`/`draft`) all rows from that run, or delete where `created_at` within run and never admin-edited.  
3. DB migration rollback is separate (standard Supabase migration down only if written).  
4. CDN URLs need no rollback.  
5. Do not reverse MailerLite (untouched).

---

## R. Content sanitisation / rendering

**Import sanitiser (deterministic):**

- Allowlist tags: `p, br, strong, em, b, i, u, a, ul, ol, li, h2, h3, h4, blockquote, figure, figcaption, img, table, thead, tbody, tr, th, td, hr, span` (+ controlled `div` only if required for legacy).  
- Allow `a[href,title,rel,target]`, `img[src,alt,width,height,loading]`.  
- Strip `script`, `style`, event handlers, `javascript:` URLs.  
- Convert YouTube iframes → structured embed markers / `youtube_ids` (do **not** drop the video).  
- Strip TinyMCE `data-mce-*` attributes.  
- **Do not** rewrite prose text nodes.

**Render:**

- Server components output sanitised HTML **or** map embed markers to `<YouTubeEmbed id className="responsive" />`.  
- Today’s `sanitizeArticleHtml` that strips all iframes must be replaced/extended before public article launch.

---

## S. Responsive YouTube handling

- Extract 11-char IDs from `youtube.com/embed/`, `youtu.be/`, nocookie hosts.  
- Store in `youtube_ids` (order preserved).  
- CSS aspect-ratio 16/9 wrapper; max-width 100%.  
- Lazy-load iframe.  
- Privacy-friendly host optional (`youtube-nocookie.com`) via site setting — default keep youtube.com for parity unless approved later.  
- ~95 video-supported articles must still show video after import.

---

## T. Internal-link transformations (testable codes)

| Code | Match | Rewrite |
| --- | --- | --- |
| `HTTPS_WWW` | `http://(www.)?jiujitsubrotherhood.com/…` | `https://www.jiujitsubrotherhood.com/…` |
| `STORE_HOST` | `store.jiujitsubrotherhood.com/…` | www equivalent path |
| `STRIP_TRAIL` | trailing slash on JJB paths | non-slash (canonical) |
| `ROOT_ALIAS` | optional `/about` etc. | `/pages/about` (optional; middleware already 301s) |
| `WP_UPLOAD` | `/wp-content/uploads/…` | flag in report; leave or map if CDN twin known — **no silent delete of surrounding prose** |
| `BAD_HREF` | non-URL hrefs | remove `href` or drop anchor per rule — documented |
| `EVENT_DUP` | not in body rewriter; ledger 301 | — |

Relative `/blogs|/pages|/products|/collections` paths: **unchanged**.

---

## U. Sitemap integration

- `app/sitemap.ts` emits only `status=published` AND `noindex=false`.  
- Include `/pages/past-events` when published.  
- Exclude drafts, archived, legal placeholders if noindex/draft.  
- Keep empty blog index URLs if Phase 2A still requires (shell routes, not `contents` rows).  
- Do not emit `/pages/blog` once 301 is live.

---

## V. Search implications

- Short term: Postgres `ilike` / full-text on `title`, `excerpt`, `body_html` for admin + optional public search flag.  
- Public `/search` remains feature-flagged.  
- Do not index `tags_source` as public facets.  
- External search appliances deferred.

---

## W. Preview / draft behaviour

- Admin “Preview” uses signed cookie or admin session to fetch draft by id/path.  
- Public anonymous requests never see drafts (404).  
- Noindex on preview responses.  
- Match existing KJJ article preview path patterns where practical (`adminArticlePreviewPath`).

---

## X. Future Shopify CDN → own storage

1. Job lists distinct CDN URLs from `featured_image_url` + `body_html` imgs.  
2. Download → Storage → `media_assets` with `sha256`.  
3. Set `public_url` to Storage public URL; keep `source_url`.  
4. Rewrite content HTML + featured fields in one transaction.  
5. **Stable content `id` and `canonical_path` unchanged.**  
6. Optional CDN purge only after verification — out of band.

Public URLs of **pages** stay Shopify pathnames; only **asset host** changes.

---

## Y. Implementation phases (after this spec is approved)

| Phase | Work | Still forbidden until approved |
| --- | --- | --- |
| **2D.1 Schema** | Migrations for `contents`, `authors`, `media_assets`, RLS against **new JJB Supabase only** | No import yet; never touch KJJ production |
| **2D.2 Admin CMS** | Typed list/edit, TipTap, YouTube, preview, MailerLite landing template | — |
| **2D.3 Rendering** | Public loaders by `canonical_path`; responsive embeds; sanitiser fix | — |
| **2D.4 Importer** | Dry-run + write; reports; idempotency tests | No production attach without JJB project |
| **2D.5 Routing deltas** | `/pages/blog` 301; event page 301s; master-academy 410; MATLIFE coupon 410; past-events page | Update ledger/CSV |
| **2D.6 Free Stuff rebuild** | Native landings + existing ML form codes; preserve ML success behaviour; no ML account changes | No test subscribers; no invented thank-you flow |
| **2D.7 Legal placeholders** | Unpublished/noindex shells; entity = Kingston Jiu Jitsu Ltd when copy is written | No invented statutory details; no verbatim KJJ policy paste; no FastDD/PayPal carry-over |
| **2D.8 Club Network** | Separate KEEP/REBUILD when inspected | Do not merge into Past Events |
| **2D.9 Media migration job** | Optional later | — |

Each sub-phase ends with validation gates (typecheck/lint/tests as applicable) and an explicit go/no-go — still no deploy until requested.

---

## Free Stuff rebuild notes (for 2D.6)

| Item | Value |
| --- | --- |
| Beginners URL | `/pages/beginners-guide-to-bjj-signup` |
| Beginners ML form code | `n2l0c2` |
| Beginners embed id | `mlb2-1721794` |
| Suck Less URL | `/pages/how-to-suck-less-at-jiu-jitsu` |
| Suck Less ML form code | `a1f8n6` |
| Suck Less embed id | `mlb2-1722026` |
| Account-visible public script path | `static.mailerlite.com/data/a/535/535995/…` (public asset URL on live site; **not** an API key) |
| PDF hosting | MailerLite automation — **out of app** |
| PageFly | Replace entirely with native JJB UI |

**Need from live/MailerLite later (non-secret):** automation/group names for QA; brand images for native hero. Preserve existing ML success/confirmation behaviour; add a site-hosted thank-you **only** if ML configuration requires it.

---

## Club Network (not Past Events)

`/pages/jiu-jitsu-brotherhood-club-network` remains a separate page concern. Do not model it as `past_event` or list it as the Past Events index. Rebuild/inspect in its own sub-phase.

---

## Security summary

- No MailerLite API keys in repo; browser form post to ML only.  
- No private Shopify export in git.  
- HTML sanitiser on write and render.  
- Admin MFA/allowlist unchanged in intent.  
- Importer service role credentials only in env, never committed.

---

## Unresolved items (blockers for specific sub-phases only)

1. Whether ML actually requires `/pages/check-your-email` or `/pages/sign-up-thank-you` as success URLs (observe during Free Stuff rebuild — do not invent a new flow).  
2. Club Network page content/rebuild (separate from Past Events).  
3. Approved JJB legal copy under Kingston Jiu Jitsu Ltd (placeholders until then; no guessed statutory fields).  
4. Provisioning of the **separate** JJB Supabase project (must not touch KJJ production).

---

## Explicit non-actions (this documentation milestone)

No schema applied, no app code changes, no Supabase connection/provisioning in this commit, no import, no push, no deploy.
