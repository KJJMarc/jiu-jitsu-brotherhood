# JJB Phase 2E — Database migration audit

**Date:** 17 September 2026 (audit) · **Updated:** Option 3 baseline authored (same day)  
**Context:** Repo seeded from Kingston Jiu Jitsu (KJJ). JJB requires a **completely separate** Supabase project.

**Migrations inspected:** **25** historical files (`supabase/migrations/`, `20260911120000` … `20260917140000`) — retained for provenance only.

---

## Status: Option 3 accepted and authored

**Decision:** Use **Option 3** — clean JJB baseline for a new empty JJB Supabase project.  
**Do not** replay the 25-file historical chain against JJB.

| Artefact | Location |
| --- | --- |
| Clean baseline SQL | [`supabase/jjb-baseline/0001_jjb_clean_baseline.sql`](../../supabase/jjb-baseline/0001_jjb_clean_baseline.sql) |
| Baseline README | [`supabase/jjb-baseline/README.md`](../../supabase/jjb-baseline/README.md) |
| Provisioning guide | [`JJB-fresh-supabase-provisioning.md`](./JJB-fresh-supabase-provisioning.md) |
| Static validator | `node scripts/validate-jjb-baseline.mjs` |

Historical `supabase/migrations/*` are **unchanged** and must not be applied to a fresh JJB project.

### Baseline contents (summary)

**Included:** `admin_users`, `is_admin`, `is_admin_aal2`; neutral `site_settings` / `tracking_settings`; full store catalogue + inventory + fulfilment + orders/Mollie/`JJB-` order numbers; `authors` / `media_assets` / `contents`; buckets `product-images` + `content-images` (AAL2 write).

**Excluded:** `articles`, `site_pages`, `article-images`; KJJ site/settings seeds; UK shipping rate seeds; admin email seeds; invented collection hours/address.

**Collection:** seeded enabled with label **Collect at Kingston Jiu Jitsu**, empty instructions, £0 via existing quote logic. UK shipping **fail-closed** (`uk_shipping_enabled=false`, zero bands).

**App note:** public checkout currently hard-blocks `collection` in `lib/store/checkout.server.ts`, and `fulfilment-readonly.server.ts` forces `collectionEnabled: false` for public reads — deliberate post-baseline app fix required before customers can choose collection.

### Explicit non-actions (still)

No Supabase project provisioned. No SQL applied. No Shopify import `--write`. No push / deploy / commit required by this phase.

---

## 1. Classification by migration

Legend: **A** required generic · **B** required JJB · **C** optional/future · **D** KJJ academy-specific · **E** legacy/superseded

| # | Migration | Primary classification | Notes |
| ---: | --- | --- | --- |
| 1 | `20260911120000_admin_users.sql` | **A** | Admin allowlist table. Header says KJJ; schema is reusable. **No seeded emails.** |
| 2 | `20260911153000_articles.sql` | **E** (+ **A** for `is_admin`) | Creates KJJ-era `articles` CMS + **defines `is_admin()`**. JJB editorial SoT is now `contents`, but many admin/code paths still reference `articles`. |
| 3 | `20260911170000_articles_body_html.sql` | **E** | TipTap `body_html` on `articles`. |
| 4 | `20260911180000_article_images_storage.sql` | **C** / **E** | Storage bucket `article-images` + **`is_admin_aal2()`**. Useful pattern; bucket name is CMS-legacy. |
| 5 | `20260912120000_site_pages.sql` | **E** + **D (seeds)** | Table reusable; **seeds publish KJJ policy/kids pages**. |
| 6 | `20260912120100_site_pages_grants.sql` | **E** / **A** | GRANT fix for `site_pages`. |
| 7 | `20260912130000_site_settings.sql` | **C** + **D (seed)** | Singleton settings useful for JJB **if re-seeded**; seed is full KJJ academy identity. Recreates `is_admin()`. |
| 8 | `20260912140000_tracking_settings.sql` | **C** | Pixel settings; seed is empty/disabled (safe). |
| 9 | `20260912160000_admin_users_select_allowlisted.sql` | **A** | Admins can list peers via `is_admin()`. |
| 10 | `20260913070000_store_products.sql` | **A** | Products, variants, images, inventory_movements + stock adjust RPC. |
| 11 | `20260913070100_product_images_storage.sql` | **A** | Bucket `product-images`; uses `is_admin_aal2()`. |
| 12 | `20260913080000_store_external_images_and_import_keys.sql` | **A** | External CDN images + `shopify_handle`. |
| 13 | `20260913090000_variant_stock_review_required.sql` | **A** | Import stock review flags. |
| 14 | `20260913090100_store_service_role_grants.sql` | **A** | Service role for catalogue import scripts. |
| 15 | `20260913120000_products_catalogue_sort_order.sql` | **A** | Catalogue sort order. |
| 16 | `20260913140000_store_fulfilment_shipping.sql` | **A** + **D (defaults/seed labels)** | Shipping bands + fulfilment settings; **defaults say “Collect at Kingston Jiu Jitsu”**. |
| 17 | `20260913143000_store_fulfilment_method_enum.sql` | **A** | Enum `store_fulfilment_method`. |
| 18 | `20260913160000_site_pages_service_role_grants.sql` | **E** / **A** | service_role on `site_pages`. |
| 19 | `20260914080000_store_orders_mollie.sql` | **A** | Orders, items, payment events, stock apply, **`next_store_order_number()` with `KJJ-` prefix**. |
| 20 | `20260914110000_store_order_email_sent.sql` | **A** | Email idempotency columns on orders. |
| 21 | `20260914140000_uk_shipping_bands_update.sql` | **A** | Replaces UK band prices (commerce config). |
| 22 | `20260914160000_uk_shipping_band_10001_20000.sql` | **A** | Adds heavy band. |
| 23 | `20260915120000_store_order_customer_access_token.sql` | **A** | Guest order access token hash. |
| 24 | `20260917120000_jjb_order_number_prefix.sql` | **B** | Replaces order prefix with **`JJB-`**. |
| 25 | `20260917140000_jjb_contents_foundation.sql` | **B** | `authors`, `media_assets`, `contents` + recreates `is_admin()`. |

### Important: no class/timetable/venue/Dojo Director tables

This migration tree does **not** create academy timetable, class booking, instructor, venue, or Dojo Director tables. KJJ academy specificity here is mostly **seeded CMS/settings copy** and **fulfilment branding defaults**, not a separate class schema.

---

## 2. Final objects if full history were applied to empty JJB

### Tables

| Table | Origin |
| --- | --- |
| `admin_users` | #1 |
| `articles` | #2 (+ #3 columns) |
| `site_pages` | #5 |
| `site_settings` | #7 |
| `tracking_settings` | #8 |
| `products` | #10 (+ #12/#15 columns) |
| `product_variants` | #10 (+ #13/#16 columns) |
| `product_images` | #10 (+ #12) |
| `inventory_movements` | #10 (+ #19 order FKs) |
| `store_fulfilment_settings` | #16 |
| `store_shipping_bands` | #16 (+ #21/#22 data) |
| `store_orders` | #19 (+ #20/#23 columns) |
| `store_order_items` | #19 |
| `store_payment_events` | #19 |
| `authors` | #25 |
| `media_assets` | #25 |
| `contents` | #25 |

### Enums / sequences

- Type: `store_fulfilment_method` (#17)
- Sequence: `store_order_number_seq` (#19)

### Functions (final)

| Function | Role |
| --- | --- |
| `is_admin()` | Allowlist check via `admin_users` (defined #2, redefined #7/#9/#25) |
| `is_admin_aal2()` | Admin + AAL2 MFA for storage writes (#4) |
| `set_articles_updated_at` | Trigger helper (#2) |
| `set_site_pages_updated_at` | (#5) |
| `set_site_settings_updated_at` | (#7) |
| `set_tracking_settings_updated_at` | (#8) |
| `set_products_updated_at` / `set_product_variants_updated_at` | (#10) |
| `adjust_product_variant_stock` / `clear_product_variant_stock_review` | (#10/#13) |
| `set_store_orders_updated_at` | (#19) |
| `next_store_order_number()` | Final body from **#24** → `JJB-YYYYMMDD-####` |
| `apply_store_order_stock` | (#19) |
| `set_authors_updated_at` / `set_contents_updated_at` | (#25) |

### Triggers

- `articles_set_updated_at`, `site_pages_set_updated_at`, `site_settings_set_updated_at`, `tracking_settings_set_updated_at`
- `products_set_updated_at`, `product_variants_set_updated_at`, `store_orders_set_updated_at`
- `authors_set_updated_at`, `contents_set_updated_at`

### Storage buckets / policies

- `article-images` (public read; admin AAL2 write)
- `product-images` (public read; admin AAL2 write)

### RLS

Enabled on all CMS/store/content tables above, with admin policies gated by `is_admin()` (storage by `is_admin_aal2()`). Public SELECT only where intentional (published articles/pages, site/tracking settings, authors/media/contents published, public storage objects).

---

## 3. KJJ-specific remnants full history would leave

| Remnant | Location | Risk |
| --- | --- | --- |
| Published `site_pages` rows for KJJ policies + **kids-class-information** + child protection | Seed #5 | **High** — live slugs/SEO text branded Kingston; kids academy page is not JJB |
| `site_settings` singleton: name, `admin@kingstonjiujitsu.com`, phone, **two Kingston venues**, KJJ social URLs, KJJ SEO | Seed #7 | **High** — public site settings would be wrong if read |
| Fulfilment defaults: “Collect at **Kingston Jiu Jitsu**” | Table defaults #16 | **Medium** — wrong collection copy on JJB shop |
| Comment/docstrings saying “Private KJJ store…” | #19 etc. | Low (metadata only) |
| Intermediate `KJJ-` order prefix | #19 until #24 | Harmless **if #24 applied**; dangerous if #24 skipped |
| Parallel legacy CMS (`articles`, `site_pages`) beside `contents` | #2–#6 + #25 | **Medium** — dual sources of truth; legacy admin still wired |

**Not present:** class/timetable/instructor/Dojo Director tables; seeded `admin_users` emails.

---

## 4. Seeded data / identity risks

### Seeds that would exist after full apply

1. **`site_pages` (5 rows, status=published)**  
   - `privacy-policy`, `cookie-policy`, `child-protection-policy`, `terms-and-conditions`, `kids-class-information`  
   - SEO descriptions explicitly “Kingston Jiu Jitsu…”  
   - Conflicts with Phase 2D decision: JJB legal under **Kingston Jiu Jitsu Ltd** as operator, but **JJB-specific policy copy**, unpublished placeholders, **do not copy KJJ academy legal verbatim**.

2. **`site_settings` (id=`site`)** — full KJJ academy identity (email, phone, venues, socials, SEO).

3. **`tracking_settings` (id=`site`)** — all tracking disabled / null IDs (**safe**).

4. **`store_fulfilment_settings` (id=1)** — uses KJJ collection default strings if not overridden.

5. **`store_shipping_bands`** — UK weight bands (commerce config; likely reusable for JJB UK-only physical goods after review).

6. **No admin allowlist rows** — first JJB admin must be inserted manually (expected).

### Identity rules at stake

- Legal operator for JJB site/shop: **Kingston Jiu Jitsu Ltd** (business entity) ≠ paste of KJJ academy website policies.  
- Order numbers must be **`JJB-`**, not `KJJ-`.  
- Never connect this apply to KJJ production.

---

## 5. Dependency graph (cannot safely skip without replacement)

```
admin_users (#1)
    └─ is_admin()  ← created in #2, also #7/#9/#25
         ├─ almost all admin RLS
         └─ is_admin_aal2() (#4) ← product/article storage policies (#4, #11)

articles (#2) ← #3, #4 (storage only needs is_admin_aal2)
site_pages (#5) ← #6, #18
site_settings (#7) — soft dependency on is_admin (recreates it)
tracking_settings (#8) — needs is_admin

products stack (#10)
    ← #11 storage, #12 import keys, #13 stock review, #14 grants, #15 sort
    ← #16 fulfilment (alters variants), #17 enum
    ← #19 orders (alters inventory_movements; needs shipping bands)
         ← #20 email cols, #21/#22 bands, #23 access token
         ← #24 JJB order prefix (replaces function from #19)

contents (#25)
    ├─ needs admin_users + is_admin (recreates is_admin; does NOT create admin_users)
    └─ independent of articles/site_pages tables
```

### Exact dependencies: `admin_users` / `is_admin`

| Need | Provided by |
| --- | --- |
| Table `admin_users` | **#1 only** |
| Function `is_admin()` | First introduced **#2**; safe recreations in #7, #9, #25 |
| Admin list policy | #9 |
| MFA storage gate `is_admin_aal2()` | **#4** (depends on `is_admin` + auth AAL2 claim) |

**JJB contents (#25) alone is insufficient** — it assumes `admin_users` exists.

### Exact dependencies: shop / catalogue / inventory / Mollie

| Capability | Migrations |
| --- | --- |
| Catalogue + variants + images + movements | #10–#15 |
| External Shopify CDN images + handles | #12 |
| UK shipping + collection settings | #16, #21, #22 |
| Fulfilment method enum | #17 |
| Orders + Mollie fields + stock apply + order numbers | #19 |
| JJB order prefix | **#24** (must follow #19) |
| Order emails / guest token | #20, #23 |
| Service-role imports | #14 |

---

## 6. Extensions / contents schema needs

- Migrations use standard Postgres + Supabase Auth (`auth.users`) + Storage (`storage.buckets` / `storage.objects`).  
- **No** custom Postgres extensions are created in these files (rely on Supabase defaults: `pgcrypto`/`gen_random_uuid()` available on hosted Supabase).  
- `contents` needs: `admin_users`, `is_admin()`, Auth users for `created_by`/`updated_by` FKs (nullable).  
- Does **not** need `articles` or `site_pages` tables to function.

---

## 7. Recommended fresh-JJB strategy

### Chosen: **Option 3 — clean JJB baseline**

Create a new baseline migration (or small ordered set) that defines the **desired final JJB schema** only:

**Include**

- `admin_users` + `is_admin` + `is_admin_aal2` + allowlisted select  
- Store: products, variants, images, inventory, fulfilment, shipping bands, orders, Mollie, email markers, customer access token  
- Storage buckets needed for product images (and later content media if desired)  
- `authors`, `media_assets`, `contents` (Phase 2D)  
- `next_store_order_number()` emitting **`JJB-` only** (never introduce `KJJ-`)  
- Neutral `site_settings` / `tracking_settings` **without KJJ seeds** (or omit until JJB settings model is decided)  
- Neutral fulfilment collection labels (JJB / TBD — not “Kingston Jiu Jitsu” gym copy)

**Exclude from baseline**

- KJJ `site_pages` seed rows (kids class, KJJ legal SEO)  
- KJJ `site_settings` seed  
- Prefer excluding legacy `articles` / `site_pages` CMS **or** include empty tables only if legacy admin routes must keep working until deleted  

**Preserve** historical `supabase/migrations/*` files for KJJ / audit; mark that **JJB empty projects must not run that chain blindly**.

### Why not option 1

Full history leaves **published KJJ academy content/identity** in a JJB database — unacceptable given Phase 2D legal/content decisions.

### Why not prefer option 2 long-term

Skipping/editing mid-chain migrations while keeping filenames is fragile (Supabase migration history, dependency order). A baseline is clearer for a greenfield JJB project.

### Acceptable interim (Option 2) if baseline delayed

Apply schema-bearing migrations in order, but **block go-live** until:

1. Delete or unpublish KJJ `site_pages` seeds.  
2. Replace `site_settings` seed with JJB placeholders (no invented statutory data).  
3. Update fulfilment collection strings.  
4. Ensure #24 and #25 applied.  
5. Decide whether legacy `articles`/`site_pages` admin remains.

---

## 8. Exact sequence recommended for a new JJB project

### Preferred (Option 3) — conceptual sequence

1. Provision empty **JJB-only** Supabase project.  
2. Apply [`supabase/jjb-baseline/0001_jjb_clean_baseline.sql`](../../supabase/jjb-baseline/0001_jjb_clean_baseline.sql) (see provisioning guide).  
3. Manually insert first `admin_users` row(s) for JJB operators.  
4. Configure Auth redirect URLs for JJB domain.  
5. Set app env: URL, anon, service_role, `JJB_SUPABASE_PROJECT_REF` (+ optional blocklist of KJJ ref).  
6. Only then run content importer dry-run / write.

**Do not** run the existing 25-file chain as-is on JJB.

### Interim Option 2 sequence (if forced)

Apply in file order **1→25**, then **immediately** run a documented post-apply scrub SQL (not written in this phase) to remove/replace KJJ seeds and fulfilment labels. Treat scrub as mandatory before any public deploy.

Minimum cannot-skip set for shop + contents:

`#1, #2-or-equivalent is_admin, #4 (if product image uploads), #9, #10–#17, #19–#25`

---

## 9. Do the two new JJB migrations fit safely?

| Migration | Fit |
| --- | --- |
| `20260917120000_jjb_order_number_prefix.sql` | **Yes**, only **after** `#19` creates `next_store_order_number` + sequence. Safe additive replace. Must not be applied to KJJ production. |
| `20260917140000_jjb_contents_foundation.sql` | **Yes**, after `#1` (`admin_users`). Recreates `is_admin()`. Independent of articles/pages. Safe on JJB; never on KJJ production. |

In a **clean baseline**, fold both into the baseline as native JJB definitions (JJB prefix from day one; contents included) rather than replaying KJJ `#19` then patching.

---

## 10. Changes needed before provisioning Supabase

**Done (Option 3):**

1. ~~Agree Option 3~~ — accepted.  
2. ~~Author JJB baseline~~ — `supabase/jjb-baseline/`.  
3. ~~Provisioning docs~~ — `JJB-fresh-supabase-provisioning.md`.  
4. Legacy `articles` / `site_pages` **excluded** from baseline; leftover admin/lib readers are not JJB SoT.  
5. Admin allowlist remains manual after Auth user creation.  
6. Env gate: `JJB_SUPABASE_PROJECT_REF` + optional `JJB_SUPABASE_BLOCKLIST_REFS`.

**Still before go-live (after project exists):**

1. Provision empty JJB Supabase project and apply baseline.  
2. Configure Auth redirects + first `admin_users` row + MFA.  
3. Approve UK shipping bands and enable `uk_shipping_enabled` deliberately.  
4. Supply approved collection instructions (optional).  
5. Remove public checkout collection hard-block when ready to offer collection.  
6. Content importer `--write` only after gate passes.

**Do not** invent company number / VAT / registered office in seeds.

---

## 11. Git / delivery notes

Expected uncommitted artefacts from Option 3 implementation:

- `supabase/jjb-baseline/*`
- `docs/rebuild/JJB-fresh-supabase-provisioning.md`
- updates to this audit
- `scripts/validate-jjb-baseline.mjs`
- prior Phase 2E foundation work may already be dirty

No migrations applied; no Supabase created; **do not commit until asked**.

---

## Appendix — Classification counts

| Class | Count (primary) |
| --- | ---: |
| A Required generic | ~16 (store/admin core + grants/alters) |
| B Required JJB | 2 |
| C Optional/future | ~3–4 (settings/tracking/article storage) |
| D KJJ academy-specific | Seeds/defaults inside otherwise-A/E files (not separate class schema) |
| E Legacy/superseded CMS | ~6 (`articles`/`site_pages` stack) |

---

## Explicit non-actions (provisioning phase)

Historical migrations not edited. No Supabase provisioned or applied. No Shopify import write. No push / deploy. Commit deferred.
