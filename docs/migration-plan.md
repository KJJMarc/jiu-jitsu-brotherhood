# Kingston Jiu Jitsu — Website Migration Plan & Implementation Specification

**Status:** Investigation complete — specification for review. No application code has been written yet.
**Goal:** Rebuild <https://www.kingstonjiujitsu.com> as a **Next.js** site hosted on **Vercel**, preserving important URLs, SEO, and integrations.
**Constraint:** The existing WordPress site must remain live and unmodified throughout the migration.

---

## 0. Sources & method

- **Content export:** WordPress WXR 1.2 export (`941` `<item>`s). Platform: WordPress + **Divi** theme/builder, hosted on **WP Engine** (legacy content domain `jjblondon2018.wpengine.com`).
- **Redirect export:** WordPress **Redirection** plugin v5.10.0 (2026‑09‑08). Yoast redirect manager was **not** available (free version), so there is no Yoast redirect export.
- **Live-site inspection:** read-only GET of headers, `<head>`, Yoast sitemaps, and `robots.txt`. The live site was not modified.
- **Item-type counts (export):** `attachment` 548, `et_pb_layout` 157, `post` 103 (98 publish), `page` 48 (43 publish), `et_template` 42, `nav_menu_item` 17, `et_header_layout` 13, `et_body_layout`/`et_footer_layout` 1 each, plus Divi/security housekeeping types.

> **Repository policy:** The raw WordPress XML, the Redirection JSON, the 404 logs, and any downloaded media are **intentionally excluded** from this repository. This document is the durable record of their relevant contents.

---

## 1. Inventory of published pages and posts (current URLs)

Permalink pattern is root-level: `https://www.kingstonjiujitsu.com/<slug>/`.

### 1.1 Pages — 43 published (authoritative from `page-sitemap.xml`)

**Core / marketing**
- `/` — Home (page id 1111476)
- `/about/`, `/instructors/`, `/locations/` (title "How to Find Us"), `/contact/` (title "Get in Touch"), `/join-us/`

**Classes / programmes**
- `/classes/`, `/adult-classes/`, `/beginners-classes/`, `/kids-classes/`, `/ladies-classes/` (title "Women's Classes"), `/no-gi-classes/`, `/muay-thai-classes/`, `/judo-for-bjj-classes/` (title "Takedowns for BJJ"), `/tnt-takedowns-n-transitions/`, `/open-mats/`, `/yoga-classes/`, `/class-timetable/`

**Belts / info / policy**
- `/adult-belt-rankings/`, `/junior-belt-rankings/`, `/training-etiquette-safety/`, `/child-protection-policy/`, `/terms-and-conditions/`, `/privacy-policy/`

**Instructor profiles** (one page each)
- `/marc-barton/`, `/clare-barton/`, `/simon-marshall/`, `/dan-lau/`, `/ray-stokes/`, `/iacopo-sassi/`, `/yiyang-ng/`, `/charlie-villaroman/`, `/andreas-wichmann/`, `/zelim-tatarashvili/`, `/master-mauricio-gomes/` (lineage)

**Events / news / conversion**
- `/seminars-and-events/`, `/news/` (blog index), `/book-a-class/`, `/thank-you/`, `/thank-you-free-class/`

**Legacy / anomalies to review (live but likely NOT for migration)**
- `/home-2/` and `/1305-2/` — duplicate/alternate homepages.
- `/electrician/` — unrelated to BJJ; almost certainly a leftover/link-building artifact. Confirm and **exclude** (or return 410) rather than migrate.

**Drafts in export (NOT live; in scope only if revived):** `Classes in Cheam`, `Events`, `Fitness for BJJ`, `Kingston Jiu Jitsu Club Gear`, a second `Seminars and Events`.

### 1.2 Posts — 98 published (from `post-sitemap.xml`)

Blog/news archive spanning ~2015–2026; permalinks `/(slug)/`. Thematic groups:

- **Belt promotions** (largest group): e.g. `/marc-promoted-to-black-belt/`, `/simon-promoted-to-black-belt/`, `/clare-promoted-to-purple-belt/`, and many `.../*-blue-belt(s)*` posts.
- **Competitions:** `/adcc-london-international/`, `/bronze-medal-at-the-south-east-open/`, `/great-team-performance-at-the-surrey-open/`, `/ibjjf-british-nationals/`, `/naga-british-championships/`, etc.
- **Seminars / gradings:** `/rayron-gracie-seminar/`, `/kit-dale-seminar/`, `/emily-kwok-seminar/`, `/leao-teixeira-seminar/`, multiple Mauricio Gomes seminars, `/grading-with-nic-gregoriades/`.
- **Timetable / operational:** `/christmas-timetable/`, `/christmas-timetable-2019/`, `/current-kjj-timetable/`, `/temporary-closure-due-to-covid-19/`, `/normal-classes-resume/`, `/back-to-training/`.
- **Courses:** beginners / women's / Muay Thai course announcements.

Not live: 3 drafts (`beginners-course-in-cheam`, `dustin-denes-seminar`, `kids-lineage-award-badges`) and 2 private posts (`mauricio-gomes-seminar`, `instructors-training-with-mauricio-gomes`).

> ⚠️ **Duplicate-title posts** exist with distinct slugs (e.g. three "Three New Blue Belts", several "Blue Belt Promotions", two "Dan Promoted to Purple Belt", two "Marc Appears on the Healthy Beast Podcast" incl. numeric slugs like `/930-2/`, `/919-2/`, `/193-2/`). **Keep existing slugs** to preserve inbound links; de-duplicate only with explicit 301s.

---

## 2. Current navigation & page hierarchy

Single menu, **"Main Menu"** (`nav_menu`, slug `main-menu`), 14 published items (3 drafts ignored):

- **About Us** (`/about/`) — dropdown parent
  - Instructors (`/instructors/`)
  - Adult Belt Rankings → `https://www.dojodirector.com/adult-belt-rankings` (external)
  - Junior Belt Rankings → `https://www.dojodirector.com/kingston-jiu-jitsu-kids/junior-belt-rankings` (external)
  - Training Etiquette & Safety (`/training-etiquette-safety/`)
- **Book a Free Trial** → `https://www.dojodirector.com/kingston-jiu-jitsu/trial-enquiry` (external)
- **Book a Class** → `https://www.dojodirector.com/kingston-jiu-jitsu/book` (external)
- **Join Us** (`/join-us/`)
- **Adult Timetable** → `https://www.dojodirector.com/kingston-jiu-jitsu/timetable` (external)
- **Kids Timetable** → `https://www.dojodirector.com/kingston-jiu-jitsu-kids/timetable` (external)
- **Online Portal** → `https://www.kingstonjiujitsuonline.com` (external)
- **Shop** → `https://store.kingstonjiujitsu.com` (external)
- **How to Find Us** (`/locations/`)
- **Get in Touch** (`/contact/`)

**Notes**
- WordPress pages are otherwise a **flat hierarchy** (every page `post_parent = 0`); the only grouping is the About dropdown.
- Menu paths `/adult-timetable/`, `/kids-timetable/`, `/shop/`, `/online-portal/`, `/book-a-free-trial/` are **custom links, not real pages** (confirmed **404** on-site) — keep them as external redirects, do not rebuild as pages.
- No separate footer `nav_menu` term; footer links are rendered inside the Divi footer template (see §4).

---

## 3. Homepage structure & reusable site-wide sections

Home (`/`, id 1111476) is a large Divi layout (~67 KB) built from stacked `et_pb_section`s:

1. **Full-width hero header** (`et_pb_fullwidth_header`) — headline "Brazilian Jiu Jitsu classes in Kingston upon Thames" + CTA.
2. **Intro text + CTA** — "Starting with just a handful of students in 2012 … over 500 students … head instructor Marc Barton … mentored by Mauricio Gomes."
3. **Class/programme grid** — rows of `et_pb_blurb` cards (adults, beginners, no-gi, women's, kids, open mats, TNT, Muay Thai, seminars), each linking to its page.
4. **Testimonials** — member quotes (Karen Barrett, Agon Hadri, etc.).
5. **Additional CTA / video / social sections** (`et_pb_cta`, `et_pb_video`, `et_pb_social_media_follow`).

**Reusable site-wide sections** (rendered on every page via Divi Theme Builder, see §4):
- **Header/nav** — logo + Main Menu + prominent "Book a Free Trial" CTA.
- **Footer** — NAP/contact, social icons, copyright.
- **Global CTA pattern** — "Book a Free Trial" / "Book a Class" buttons (→ Dojo Director) throughout.
- **Divi modules actually used** across pages: `et_pb_text` (87), `et_pb_button` (55), `et_pb_image` (46), `et_pb_blurb` (30), `et_pb_fullwidth_header` (24), `et_pb_video` (8), `et_pb_slide`/slider, `et_pb_cta` (6), `et_pb_number_counter` (3), `et_pb_social_media_follow`, `et_pb_map`/`et_pb_map_pin` (locations), `et_pb_contact_form` (2).

---

## 4. Divi layouts, templates & custom content

- **Theme Builder templates:** `et_header_layout` ×13, `et_body_layout` ×1, `et_footer_layout` ×1, plus `et_template` ×42. These define the global header (multiple variants — reconcile into one component set), body wrapper, and footer.
- **Divi Library:** `et_pb_layout` ×157 (156 publish) — reusable saved sections/rows (hero blocks, CTA bands, pricing tables, blurb grids). Mostly design fragments, not public URLs.
- **Per-page builder data:** `_et_pb_use_builder`, `_et_pb_old_content`, `_et_dynamic_cached_shortcodes`, `_et_pb_custom_css`, `_et_pb_page_layout`, `_et_header/body/footer_layout_id` confirm Theme Builder assignments.
- **A/B testing:** `_et_pb_ab_*` meta present (Divi split testing used on some pages).
- **Custom code:** `custom_css` ×3 items and `et_pb_code`/`_et_pb_custom_css` blocks — re-express as component styles, do not port verbatim.
- **Header/Footer injection:** `hefo_before`/`hefo_after` (×139) and `_pys_head_footer` (×106) — per-post header/footer script injection (tracking/embeds); audit before dropping.

**Implication:** Treat Divi shortcode content as the *source of copy and layout intent*, not something to import literally. Convert to clean React/MDX components; `_et_pb_old_content` helps recover raw text.

---

## 5. Images & media inventory

- **548 attachments**, all hosted under `https://www.kingstonjiujitsu.com/wp-content/uploads/YYYY/MM/`.
- **By type:** `.jpg` 404, `.png` 105, `.jpeg` 20, `.webp` 1; **video** `.mp4` 10, `.webm` 5, `.mov` 1, `.m4v` 1; **`.pdf` 1**.
- **By upload year:** 2015→2026, peaks 2018 (105), 2019 (93), 2024 (73).
- **80** attachments carry alt text (`_wp_attachment_image_alt`) to preserve; the rest need alt text authored.
- **Optimisation:** currently WP Smush; on Next.js replace with `next/image`.
- ⚠️ **Cross-domain image references in content**: many in-page `<img>`/background URLs point to **legacy hosts** rather than the canonical media path — `jjblondon2018.wpengine.com` (174 refs) and Divi demo domains `*.madebysuperfly.com` (~90), plus `cdn.elegantthemes.com`. These will 404/hotlink after migration and must be **downloaded, de-duplicated, and re-hosted** (or served via a media pipeline). The ~18 self-hosted videos are heavy — consider a video host/CDN.

---

## 6. External integrations

| Integration | Purpose | Endpoints |
|---|---|---|
| **Dojo Director** | Bookings, free-trial enquiry, timetables, belt rankings | `dojodirector.com/kingston-jiu-jitsu/{book,trial-enquiry,timetable}`, `/kingston-jiu-jitsu-kids/{timetable,junior-belt-rankings}`, `/adult-belt-rankings` |
| **Shop** | Merchandise store (subdomain) | `https://store.kingstonjiujitsu.com` |
| **Online Portal** | Member portal (separate site) | `https://www.kingstonjiujitsuonline.com` |
| **DFC / FastDD** | Direct Debit **membership billing** (from `/join-us/` pricing tiers) | `fastdd.co.uk` |
| **Bookwhen** | Secondary event/class booking | `bookwhen.com/kingstonjiujitsu` |
| **Google Analytics** | GA4 `G-W6WQ8BP8EC`, legacy UA `UA-160765391-1`, via **MonsterInsights** | live `<head>` |
| **Google Tag Manager** | `GTM-WHZ3NLB` | live `<head>` |
| **Facebook Pixel** | via **PixelYourSite** (`fbevents.js`, `connect.facebook.net`; `_pys_head_footer` meta) | live `<head>` / meta |
| **Cookie consent** | **Cookie Law Info / CookieYes (GDPR Cookie Consent)** (`cookie-law-info` classes; "termly" also referenced in export) | live `<head>` |
| **Forms** | **Divi built-in contact form** (`et_pb_contact_form` ×2, `et_pb_contact_field` ×9); no Gravity/CF7/WPForms. Trial/booking handled by Dojo Director | contact page |
| **Social profiles** | Facebook `/kingstonjiujitsu/`, Instagram `/kingstonjiujitsu/`, Twitter/X `@KingstonJits`, YouTube channel `UCjdHYMuxqEybo4Y_VlA55tQ` | header/footer |
| **Embedded media** | YouTube embeds (97 refs), self-hosted MP4/WebM | throughout |

Contact email: `admin@kingstonjiujitsu.com`. Locations phone: **07584 131335**.

---

## 7. SEO requirements to preserve

- **SEO plugin:** **Yoast** (sitemaps at `/sitemap_index.xml`; `_yoast_wpseo_*` meta present).
- **Title pattern:** `"{Page Title} - Kingston Jiu Jitsu"` (Yoast `%%title%% %%sep%% %%sitename%%`, sep `-`). Confirmed live on Home, About, Adult/Kids/Women's Classes, Contact ("Get in Touch - …"), Locations ("How to Find Us - …"), Instructors, Class Timetable, Join Us, Seminars, News. **Preserve exact titles.**
- **Canonical URLs:** self-referential, trailing-slash, `https://www.` — e.g. `<link rel="canonical" href="https://www.kingstonjiujitsu.com/about/">`. **Preserve slug + trailing slash + canonical host.**
- **Meta descriptions:** essentially **absent** — only **1** item in the export carries a custom description (post "Simon Promoted to Black Belt!"); live key pages return empty descriptions. Newer Yoast stores computed values in the DB `yoast_indexable` table, **not in the WXR** → gap (§9) **and** an improvement opportunity (author real descriptions during migration).
- **Open Graph / Twitter cards:** emitted by Yoast (`og:title/type/url/locale`, image) — replicate via Next.js Metadata API.
- **Structured data:** Yoast graph on every page (`WebSite`, `WebPage`, `BreadcrumbList`, `SearchAction`). **No `LocalBusiness`/`Organization` schema** even on `/locations/` — add during rebuild.
- **Canonical domain:** enforced by 301 — `http→https`, `non-www→www`, apex→www all `301` to `https://www.kingstonjiujitsu.com/`. **Must be replicated on Vercel** (see §11 R1).
- **robots.txt:** virtual (pc-robotstxt plugin) blocking `/wp-admin/`, `/wp-includes/`, `/trackback/`, login/register. WordPress paths won't exist on Next.js; author a fresh `robots.txt` and reference the new sitemap (current robots does not list a sitemap).

---

## 8. Pages/URLs important for local search visibility

Priority to retain rankings and strengthen (Kingston-upon-Thames BJJ intent):

1. **`/`** — primary local landing ("Brazilian Jiu Jitsu classes in Kingston upon Thames").
2. **`/locations/`** — NAP (Grove Lane; phone **07584 131335**), Google Map embed. Highest local-SEO value; add `LocalBusiness` + geo schema and keep the URL.
3. **`/contact/`** — conversion + NAP.
4. **Programme pages** with local+service intent: `/adult-classes/`, `/beginners-classes/`, `/kids-classes/`, `/ladies-classes/`, `/no-gi-classes/`, `/muay-thai-classes/`, `/class-timetable/`.
5. **`/about/`, `/instructors/`, `/marc-barton/`, `/master-mauricio-gomes/`** — E‑E‑A‑T / lineage authority.
6. **`/join-us/`, `/book-a-class/`** — conversion pages attracting branded/near-me queries.
7. **High-authority blog posts** (belt promotions, named seminars) that accumulate backlinks — preserve slugs.

Also: align Google Business Profile, consistent NAP, and `LocalBusiness` structured data on Home/Locations/Contact.

---

## 9. Needed for migration but NOT in export/public site (open inputs)

1. **Yoast per-page titles/descriptions & settings** — in DB `yoast_indexable` + `wp_options`, absent from WXR. Export from Yoast (Tools → Import/Export) or scrape rendered `<head>` for all URLs.
2. **Automatic Yoast slug-change redirects** — unavailable (free version). *(Custom redirects ARE available — see §11, from the Redirection plugin export.)*
3. **Analytics/pixel/consent config** — IDs are known (§6), but MonsterInsights/PixelYourSite/consent settings (events, exclusions) are in `wp_options`.
4. **Original media binaries** — WXR references URLs only; download actual files (incl. legacy `wpengine.com`/`madebysuperfly.com` assets); some may be gone.
5. **DNS / domain control & hosting** at the registrar for Vercel cutover; confirm WP stays live in parallel until switch.
6. **Credentials/ownership** for Dojo Director, DFC/FastDD, Bookwhen, Shop, and Online Portal.
7. **Google Business Profile / Search Console / Bing** access to monitor migration and submit the new sitemap.
8. **Brand assets** — logo source files, fonts, colour palette (currently baked into Divi/`cdn.elegantthemes.com`).
9. **Decisions** on `/electrician/`, `/home-2/`, `/1305-2/` anomalies; which drafts to revive; consolidating duplicate posts.
10. **Legal copy** ownership for Privacy/Terms/Child Protection pages (migrate verbatim).

---

## 10. Recommended structure & staged implementation plan

### 10.1 Proposed information architecture (preserving URLs)

Keep every live slug and trailing slash. Group in code (not URL):
- **Top-level:** `/`, `/about/`, `/instructors/` (+ per-instructor pages via dynamic route), `/locations/`, `/contact/`, `/join-us/`, `/book-a-class/`.
- **Classes:** hub `/classes/` + existing individual class pages (unchanged slugs).
- **Belts/info/policy:** `/adult-belt-rankings/`, `/junior-belt-rankings/`, `/training-etiquette-safety/`, `/child-protection-policy/`, `/terms-and-conditions/`, `/privacy-policy/`.
- **Blog:** index `/news/` + posts at root `/(slug)/`; category archives `/category/news/`, `/category/events/`.
- **External (unchanged outbound links/redirects):** Book a Class / Free Trial / Timetables / Belt Rankings → Dojo Director; `/shop/` → store subdomain; `/online-portal/` → portal; memberships → DFC/FastDD.

### 10.2 Recommended tech

- **Next.js (App Router) on Vercel**, TypeScript, `next/image`, `next-sitemap` for `sitemap.xml`/`robots.txt`, Metadata API for titles/OG/canonical, JSON-LD (`LocalBusiness`, `Organization`, `BreadcrumbList`, `Article`).
- **Content as MDX/structured content in-repo** for pages and blog posts (static, rarely edited) — fast, no DB.
- **Supabase — only where genuinely needed.** Static marketing pages and historical posts do **not** need it. Consider Supabase **only** if the club wants an in-house, regularly editable store for e.g. a self-managed timetable/events feed or contact/trial submissions that shouldn't go through Dojo Director. Otherwise keep bookings/memberships/shop on external providers and skip Supabase. (Contact form can post to a serverless route + email, or stay on Dojo Director.)
- **Redirects** in `next.config.js` / `vercel.json` + host canonicalisation, per §11.

### 10.3 Staged build plan

1. **Data capture (unblock §9 gaps):** export Yoast metadata; crawl live `<head>` for all 43 pages + 98 posts to snapshot titles/descriptions/canonicals; download all media (incl. legacy-domain assets); record analytics/consent IDs. *(Redirects already captured — §11.)*
2. **Foundation:** Next.js + Vercel project, design system from brand assets, global **Header/Footer** (reconcile the 13 Divi headers into one), base Metadata/JSON-LD, `robots`/`sitemap`, domain canonicalisation.
3. **Core pages:** Home (hero, class grid, testimonials, CTAs), About, Instructors + profiles, Locations (NAP + map + `LocalBusiness` schema), Contact, Join Us (membership tiers → FastDD), Classes hub + all class pages. Wire external CTAs to Dojo Director.
4. **Blog/news:** posts → MDX (root-level slugs preserved), `/news/` index with pagination, category archives, `Article` schema; migrate media/alt text.
5. **SEO parity & redirects:** apply preserved titles/canonicals, author missing meta descriptions, implement the full redirect map (§11), submit sitemap to Search Console; verify every old URL resolves 200 or 301.
6. **Integrations & compliance:** GA4 + GTM + Facebook Pixel behind the cookie-consent gate, consent-mode wiring; verify Dojo Director/FastDD/Bookwhen/Shop/Portal links.
7. **QA & cutover:** crawl-diff old vs new (titles, canonicals, status codes, internal links), Lighthouse/Core Web Vitals, accessibility/alt-text pass; DNS cutover to Vercel while WordPress remains live until switch; post-launch monitor Search Console for 404s/coverage.

---

## 11. Redirects (authoritative)

**Source:** WordPress **Redirection** plugin export v5.10.0 (2026‑09‑08), group "Redirections" (enabled). All rules: `301`, exact match, case-insensitive, trailing-slash tolerant, non-regex. The 2,579-row 404 log was reviewed and found to be overwhelmingly bot/scanner traffic — no additional legitimate legacy URLs beyond the convenience set below.

### R1. Canonical host rules
Replicate the existing 301 behaviour on Vercel:
- `http://` → `https://`
- apex `kingstonjiujitsu.com` and any non-`www` → `www.kingstonjiujitsu.com`
- Target host for all internal redirects: `https://www.kingstonjiujitsu.com`
- Preserve slugs and trailing slashes on migrated pages.

### R2. Custom redirects — DEFAULT for the new site
Source paths preserved from the Redirection export; targets **corrected** to real live destinations. The two identical `/book-a-class/` entries are merged into one.

| # | Source (preserve) | Target (default) | Type | Notes |
|---|---|---|---|---|
| 1 | `/category/events/` | `/seminars-and-events/` | 301 internal | Corrected (old `/events/` target was a draft → 404) |
| 2 | `/category/news/` | `/news/` | 301 internal | Already correct; normalised to trailing slash |
| 3 | `/category/adults_classes/` | `/adult-classes/` | 301 internal | Corrected (old `/adultsclasses/` → 404) |
| 4 | `/category/kids_classes/` | `/kids-classes/` | 301 internal | Corrected (old `/kidsclasses/` → 404) |
| 5 | `/book-a-class/` | `https://www.dojodirector.com/kingston-jiu-jitsu/trial-enquiry` | 301 external | De-duplicated from 2 identical entries; takes precedence over the underlying published page |

### R3. Convenience redirects — DEFAULT
Human-mistype tidy-ups derived from 404-log analysis. All `301`, trailing-slash tolerant.

| # | Source | Target | Type |
|---|---|---|---|
| 6 | `/contact-us` | `/contact/` | 301 internal |
| 7 | `/about-us` | `/about/` | 301 internal |
| 8 | `/blog/` | `/news/` | 301 internal |

### R4. Precedence / interaction notes
- R2–R3 layer **on top of** the R1 host canonicalisation.
- `/category/news/` and `/category/events/` also exist as live Yoast category archives; the redirect **takes precedence** over the archive. Keep that behaviour.
- `/book-a-class/` redirects over its (now-unnecessary) published page — no page needs rebuilding for that slug.
- Implement later as source-controlled 301s in `next.config.js` `redirects()` (or `vercel.json`), maintained as a reviewable data file.

### R5. Migration record — original mappings (REFERENCE ONLY — do NOT reproduce)
Captured verbatim from the Redirection export for provenance. **The broken destinations below must not be recreated;** use R2 instead.

| Source | Original exported target | Recorded hits | Original live result | Superseded by |
|---|---|---|---|---|
| `/category/events/` | `/events/` | 2,096 | 301 → **404** (draft page) | R2 #1 → `/seminars-and-events/` |
| `/category/news/` | `/news` (no slash) | 2,109 | 301 → 200 | R2 #2 → `/news/` |
| `/category/adults_classes/` | `/adultsclasses/` | 192 | 301 → **404** | R2 #3 → `/adult-classes/` |
| `/category/kids_classes/` | `/kidsclasses/` | 207 | 301 → **404** | R2 #4 → `/kids-classes/` |
| `/book-a-class/` (id 5) | `https://www.dojodirector.com/kingston-jiu-jitsu/trial-enquiry` | 541 | 301 → external 200 | R2 #5 (kept) |
| `/book-a-class/` (id 6, duplicate) | same as id 5 | 0 | — | Merged into R2 #5 |

---

## 12. Unresolved decisions (require owner input)

- **Anomaly pages:** confirm removal/410 for `/electrician/`, `/home-2/`, `/1305-2/`.
- **Drafts:** decide whether to revive `Events`, `Fitness for BJJ`, `Classes in Cheam`, `Kingston Jiu Jitsu Club Gear`, and draft posts.
- **Duplicate posts:** keep all (preserve slugs) or consolidate with 301s.
- **Events destination:** confirm `/category/events/` → `/seminars-and-events/` (default) vs restoring a dedicated events page.
- **Supabase:** confirm whether any owner-editable data (timetable/events, form submissions) warrants it; otherwise omit.
- **External systems:** confirm Dojo Director, FastDD, Bookwhen, Shop, and Online Portal remain external (linked) rather than rebuilt.
- **Media:** confirm ability to download originals, including legacy-domain and self-hosted video assets.

---

*This document is the definitive implementation specification for the Next.js/Vercel rebuild. Raw exports (WordPress XML, Redirection JSON, 404 logs) and downloaded media are intentionally kept out of the repository; their relevant contents are recorded above.*
