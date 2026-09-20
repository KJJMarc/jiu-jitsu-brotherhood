# JJB comments restoration audit (Phase 1 — read-only)

**Date:** 20 September 2026  
**Repository:** `jiu-jitsu-brotherhood` on `main`  
**Scope:** Determine where historical article comments live, how safely they can be exported, how they map to migrated Articles/Techniques, and what to build next.  
**Status:** Audit only — **no** Shopify writes, **no** Supabase writes/migrations, **no** application-code changes beyond this document, **no** test comments, **no** commit/push/deploy, **no** raw PII export.

**Companion private export inspected (gitignored):**  
`imports/shopify/private/jjb-shopify-audit-20260916-091414/` (exported 2026-09-16, Admin GraphQL API `2026-07`, `read_only: true`, credentials not saved).

---

## 1. Executive summary

| Question | Finding |
|---|---|
| Where are historical comments? | **Native Shopify blog comments** (Admin GraphQL `Comment` / REST Comment resource). Not Disqus, not a third-party app, not theme-embedded bodies. |
| Are they in the existing JJB Shopify export? | **No.** The Sept 2026 audit pulled blogs/articles/pages/products/etc. but **did not fetch comments**. |
| Can this environment inventory them now? | **No.** No Shopify Admin API credentials are present in `.env.local` / `.env.example`. |
| Do blogs allow comments? | **Yes.** All six Shopify blogs have `commentPolicy: "MODERATED"` (includes `blog` and `techniques`). |
| Will article GIDs map to Next.js content? | **Strongly yes for 180/183** Shopify articles via `contents.source_shopify_gid`. **3** published Shopify articles currently have **no** Supabase destination. |
| Article vs technique slug collisions? | **0** collisions on `(type, blog_handle, handle)`. |
| Does the Next.js site already have comments? | **No** `comments` table, no comment UI, no Disqus/app dependency. |
| Can comments be restored? | **Yes, in principle**, after a verified read-only Shopify export while the store still exists. |
| Must Shopify stay active until export is verified? | **Yes.** |

**Exact recommended next step:** Phase 2 — obtain a **read-only** Shopify Admin token with `read_content` (and/or `read_online_store_pages`), run a **controlled comments export script** to a **gitignored** private path, produce aggregate inventory + mapping report (still no public UI), then delete the raw PII export after a verified import into a future JJB comments schema.

---

## 2. Comment-source findings

### Conclusion

Historical JJB article comments are **native Shopify blog comments**.

### Evidence

1. **Shopify Admin GraphQL (API version used by JJB export: `2026-07`)** documents first-class `Comment` objects and a shop-wide `comments` query, plus `Article.comments`. Required scopes: `read_content` or `read_online_store_pages`. Fields include author name/email, body/bodyHtml, status, IP, user-agent, article association, created/published timestamps. Status enum: `PENDING`, `PUBLISHED`, `REMOVED`, `SPAM`, `UNAPPROVED`.
2. **JJB blog export** (`blogs.json`): every blog includes `commentPolicy: "MODERATED"`:
   - `blog` (Articles) — active editorial
   - `techniques` (Techniques) — active editorial
   - empty shells: `news`, `videos`, `articles`, `podcast`
3. **No third-party comment vendor** in `package.json`, theme metadata export, or repo dependencies (no Disqus/Hyvor/Giscus/etc.).
4. **Theme export is metadata-only** (id/name/role) — no Liquid templates in the audit zip — so theme markup cannot confirm on-storefront rendering, but policy + Admin Comment API still establish the **storage** source.
5. **Articles export has no comment payloads** — articles lack `commentsCount` / nested comments; the GraphQL audit simply never requested them.
6. **Content import** (`scripts/import-jjb-contents.ts`) migrates article HTML/metadata only; it never references comments.

### Articles vs Techniques

Comments are attached to **Shopify Articles**, which live on blogs. Both:

- `/blogs/blog/{handle}` → JJB `contents.type = 'article'`
- `/blogs/techniques/{handle}` → JJB `contents.type = 'technique'`

are Shopify articles and are therefore **in scope** for native comments whenever any exist. Empty blogs may hold zero articles/comments.

### On-storefront visibility (secondary)

Automated HTML fetches of live `www.jiujitsubrotherhood.com` article URLs from this environment often returned **403** or empty bodies, so storefront comment widgets could not be reliably confirmed here. That does **not** negate Admin-stored comments: moderated native comments can exist in Admin even when a theme under-renders them.

### Ruled out

| Candidate | Why ruled out |
|---|---|
| Disqus / third-party embed | No dependency, no theme-string hits in export metadata, no env keys |
| Comments stored only in theme HTML | Article bodies are content HTML; no comment tables in theme metadata; Admin Comment API is the platform store |
| Already migrated into Supabase | No `public.comments` table; OpenAPI schema has no comment resources |

---

## 3. Inventory and status counts

### Status of this phase

**Comment counts could not be produced.** Suitable Shopify Admin credentials are **not** available in the local environment.

### Access missing (do not paste secrets into chat or source)

| Need | Present? |
|---|---|
| Shop domain | Yes — `jiu-jitsu-brotherhood.myshopify.com` (from private audit manifest) |
| Admin API access token (Custom app / Dev Dashboard) | **No** — no `SHOPIFY_*` keys in `.env.local` / `.env.example` |
| Scope `read_content` and/or `read_online_store_pages` | Unknown until a token exists |
| Prior comments export file | **No** — not in the Sept 2026 audit package |

### What the inventory must collect in Phase 2 (aggregates only in reports)

When credentials exist, query Admin GraphQL `comments(first: N, after: cursor)` (and/or REST `GET /comments.json` / `comments/count.json` if still available to this store) and report:

- Total comments
- Counts by `status` (`PUBLISHED`, `PENDING`, `SPAM`, `REMOVED`, `UNAPPROVED`)
- Distinct articles with ≥1 comment; split by blog handle (`blog` vs `techniques`)
- Earliest `createdAt` / latest `createdAt` (or `publishedAt`)
- Whether any parent/reply field appears (expected: **flat** — GraphQL `Comment` has **no** documented `parentId`)
- Field coverage checklist (see §6)
- Whether `bodyHtml` contains markup beyond plain paragraphs (boolean / rate only)
- Duplicate detection by `(source_comment_gid)` and by hash of normalised body+article+createdAt (**no** body text in the public report)

**Anonymised example shape only (illustrative — not live data):**  
`status=PUBLISHED; blog=blog; article_handle=<handle>; body_len=120; has_html=true; author_name_len=8`.

### Available Comment fields (platform)

From Shopify Admin GraphQL `Comment` / `CommentAuthor` (2026-07 docs):

| Field | Notes |
|---|---|
| `id` | `gid://shopify/Comment/…` — preserve as source key |
| `article { id handle blog { handle } }` | Mapping key |
| `author { name email }` | Email is PII — export privately; never publish |
| `body`, `bodyHtml` | HTML possible — sanitise on display |
| `createdAt`, `publishedAt`, `updatedAt` | |
| `status`, `isPublished` | |
| `ip`, `userAgent` | PII / fingerprinting — store privately or omit from JJB if unused |
| Parent/reply | **Not present** on Comment object — treat history as flat |

---

## 4. Article / technique mapping results

### Mapping keys (preferred order)

1. **`Comment.article.id` → `contents.source_shopify_gid`** (best; unique index already exists)
2. `(blog.handle, article.handle)` → `contents (type, blog_handle, handle)` with `type` derived from blog (`blog`→article, `techniques`→technique; event recaps may be `past_event`)
3. `canonical_path` = `/blogs/{blogHandle}/{handle}`
4. Redirect ledger only for legacy non-blog paths (e.g. bare `/cut-weight-…` → blog URL) — **not** needed when article GID is present

### Current Supabase editorial inventory (read-only, 2026-09-20)

| `contents.type` | Count | Notes |
|---|---|---|
| `article` | 118 published | Includes belt-system page reclassified as article (`source_shopify_gid` is a **Page** GID) |
| `technique` | 60 published + 1 draft | All 61 Shopify technique articles map by Article GID |
| `past_event` | 9 | Includes 2 former blog articles (below) |
| `page` | 1 | Unrelated to comments |

Article ↔ technique **handle collisions:** **0**.

### Shopify articles (export n=183) → current `contents` by Article GID

| Result | Count |
|---|---|
| Mapped unambiguously via `source_shopify_gid` | **180** |
| Mapped via redirects only | **0** (GID path sufficient for these 180) |
| Multiple possible matches | **0** |
| No destination in Supabase | **3** |

**Mapped by destination type:**

| Destination `type` | Count |
|---|---|
| `article` | 117 |
| `technique` | 61 |
| `past_event` | 2 |

**Past-event article GIDs still addressable at blog URLs:**

| Title | Handle | Public path | Notes |
|---|---|---|---|
| Summer Seaside Special | `summer-seaside-special` | `/blogs/blog/summer-seaside-special` | Imported as `past_event`, same Article GID |
| Spring Super Seminar | `spring-super-seminar` | `/blogs/blog/spring-super-seminar` | Same |

### Unmapped Shopify articles (no commenter data)

These remain in the Sept 2026 Shopify articles export as published blog posts, but **no** matching `contents` row exists today (by GID, handle, or canonical path):

| Title | Public handle | Blog |
|---|---|---|
| 5 Ways Jiu Jitsu Benefits Children with Autism | `5-ways-jiujitsu-benefits-children-autism` | `blog` |
| Cutting Weight for Jiu Jitsu Competitions: The Ultimate Guide | `cut-weight-jiu-jitsu-competitions` | `blog` |
| How to Overcome Low Back Pain in Brazilian Jiu-Jitsu | `how-to-overcome-low-back-pain-in-brazilian-jiu-jitsu` | `blog` |

**Context:** The 19 Sep 2026 medical/safety audit listed these three as High-risk published URLs. They are therefore believed to have existed in JJB Supabase around that date and are **absent now**. Any comments on them cannot auto-attach until Marc decides restore vs retire those articles.

### Implications for comment restore rates

- **Automatic attach (expected):** all comments whose `article.id` is among the **180** mapped GIDs — including technique posts and the two past-event recaps.
- **Manual / blocked:** comments on the **3** unmapped articles (count unknown until export).
- **Out of scope unless discovered:** comments on empty blogs (unlikely if article count is 0).

---

## 5. Current application architecture

### Content model

- Table: `public.contents` (migration `20260917140000_jjb_contents_foundation.sql`)
- Types: `article` | `technique` | `past_event` | `page`
- Identity: UUID `id`; unique `source_shopify_gid`; unique `(type, blog_handle, handle)`; unique `canonical_path`
- Public routes: `app/(public)/blogs/[blogHandle]/[articleHandle]/page.tsx` → `ContentDocument`
- HTML sanitisation already exists for editorial bodies: `lib/content/sanitize.ts` (allowlist tags) — reusable pattern for migrated comment HTML

### Admin

- Auth: Supabase email/password + `admin_users` allowlist + MFA (AAL2) via `requireAdmin()` / `lib/admin/auth.server.ts`
- Nav (`AdminShell`): Articles, Techniques, Pages, Past Events, Store, Settings — **no Comments** item yet
- Mutations: server actions under `app/admin/(console)/**/actions.ts` with `"use server"` + `requireAdmin()`
- List/detail patterns: `AdminContentTypeList`, `AdminContentEditor`

### Reusable public-form / email patterns

| Facility | Location | Reuse for comments? |
|---|---|---|
| Contact form honeypot + min-submit time | `components/jjb-contact/*` | Yes (spam basics) |
| Resend transactional email | `lib/email/resend.server.ts` | Optional moderator/author notifications (not marketing) |
| No CAPTCHA/Turnstile today | — | Consider adding for public comments |
| No generic rate-limit middleware | — | Need IP/email throttles for comment POST |
| CSP Report-Only + `X-Frame-Options: DENY` | `next.config.mjs` | Fine for first-party forms; no third-party comment script required |
| RLS + `is_admin()` | contents migrations | Same pattern for comments tables |

### Security posture relevant to comments

- Public write must **not** use the service role from the browser
- Prefer server action / Route Handler with validation, origin checks, and service-role insert of `pending` rows only
- Never select `author_email` / `ip` / `user_agent` in public queries

---

## 6. Recommended extraction and backup method

### Recommendation

**Controlled read-only Admin GraphQL export script** (same family as the existing private Shopify audit), targeting API version **`2026-07`** (or the store’s current stable Admin version), writing only under **`imports/shopify/private/`** (already gitignored).

Prefer GraphQL `comments` connection pagination over relying on legacy REST long-term; REST `GET /comments.json` / `count.json` may still work for this shop but is a **legacy** Admin API surface — use only as a cross-check if GraphQL completeness is doubted.

**Do not** use write scopes. **Do not** run approve/spam/delete mutations during export.

### Required read-only scope

- `read_content` **or** `read_online_store_pages` (per Shopify Comment docs)

### Pagination

- `comments(first: 50–100, after: endCursor)` until `hasNextPage = false`
- Optional completeness cross-check: filter by `status:` and sum counts; and/or REST `comments/count.json` if accessible
- Also page `article { comments }` for articles known to have discussion if shop-wide query hits complexity limits

### Fields to retrieve (private export)

```
id
status
isPublished
createdAt
publishedAt
updatedAt
body
bodyHtml
ip
userAgent
author { name email }
article { id handle title blog { id handle title } }
```

### Rate-limit handling

- Honour `Retry-After` / `X-Shopify-Shop-Api-Call-Limit` (REST) or GraphQL cost extensions
- Small concurrency (1 worker), backoff on 429/throttle

### Personal-data protection

- Store export only under `imports/shopify/private/` (gitignored)
- Encrypt at rest if the machine backup policy requires it
- Reports/docs may include **aggregates** and **article titles/handles** only
- **Never** commit raw JSON/CSV with emails, IPs, or full bodies
- **Never** paste token values into chat, commits, or `.env.example`

### Temporary storage location

`imports/shopify/private/jjb-comments-export-YYYYMMDD/`  
Files such as `comments.jsonl`, `manifest.json` (counts, api version, exported_at), `mapping-preview.json` (article GID → contents id, **no** PII).

### Why it must never be committed

Contains commenter **emails**, **IPs**, **user-agents**, and full **message bodies** — personal data under UK GDPR expectations; git history is durable and often mirrored remotely.

### Completeness verification

1. `manifest.total_nodes` equals final page accumulation  
2. Status histogram sums to total  
3. Spot-check Admin UI comment counts for 3–5 known articles  
4. Mapping preview: % of comment article GIDs resolvable to `contents`  
5. Idempotent re-export: identical set of comment GIDs

### Secure deletion after successful migration

1. Confirm JJB DB contains all source GIDs with expected status mapping  
2. Shred/delete the private folder and any zip copies  
3. Rotate/revoke the temporary Admin token if it was created solely for export  
4. Keep only non-PII aggregate reports in `docs/rebuild/`

### Alternatives compared

| Method | Verdict |
|---|---|
| Admin GraphQL `comments` | **Preferred** — supported on 2026-07, paginated, includes article + author email |
| Legacy REST comments | Optional cross-check; legacy; still documents list/count |
| Shopify admin CSV UI | Acceptable manual backup if API token delayed; still PII; store privately |
| Theme scrape | Unreliable (theme may hide comments); misses pending/spam; no emails |
| Third-party app export | N/A — no app identified |

**This phase did not perform a full raw export.**

---

## 7. Proposed database model

Shared comments for **Articles and Techniques** (and optionally `past_event` rows that keep blog canonical paths).

### `public.content_comments`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `content_id` | uuid NOT NULL → `contents(id)` | Target article/technique/past_event |
| `parent_id` | uuid NULL → `content_comments(id)` | Admin replies / future threading |
| `status` | text | `pending` \| `published` \| `spam` \| `archived` \| `deleted` |
| `author_display_name` | text NOT NULL | Public |
| `author_email` | text NULL | **Private** — never public select |
| `body_text` | text NOT NULL | Plain source / fallback |
| `body_html` | text NULL | Sanitised subset for migrated Shopify HTML |
| `is_official_reply` | boolean DEFAULT false | When true, show “Jiu Jitsu Brotherhood” label |
| `source` | text | `shopify` \| `jjb` |
| `source_shopify_comment_gid` | text NULL UNIQUE | Idempotent import |
| `source_shopify_article_gid` | text NULL | Audit/mapping |
| `source_created_at` | timestamptz NULL | Preserve original date |
| `published_at` | timestamptz NULL | |
| `ip_hash` | text NULL | Optional — store hash not raw IP |
| `user_agent` | text NULL | Admin-only if kept |
| `created_at` / `updated_at` | timestamptz | |
| `created_by` / `moderated_by` | uuid NULL → auth.users | |

Indexes: `(content_id, status, source_created_at)`, unique source GID.

### `public.content_comment_moderation_events`

Append-only audit: `comment_id`, `actor_user_id`, `action` (`approve|reject|spam|edit|delete|reply|restore`), `from_status`, `to_status`, `note`, `created_at`.

### RLS sketch

- `anon`/`authenticated`: `SELECT` where `status = 'published'` only; **no** email/ip columns (use a view or column privileges)
- Inserts from public via **server role** only after validation (not direct client insert)
- Admins: full access via `is_admin()`

---

## 8. Public commenting flow

1. Server-render published comments under Articles and Techniques (`ContentDocument` or sibling section) for SEO and no-JS readability.
2. Form fields: name, email, comment (+ honeypot, timestamp trap). **No accounts.**
3. Server action validates lengths/email, sanitises body to plain text (or strict markdown→HTML later), inserts `pending`.
4. Accessible success: “Thanks — your comment is awaiting moderation.”
5. Rate limit by IP hash + email; reject duplicates.
6. Do **not** treat comment email as marketing consent; optional “notify me of replies” must be separate and off by default.
7. Official admin replies: `is_official_reply = true`, display name overridden to **Jiu Jitsu Brotherhood**.

---

## 9. Admin moderation and reply flow

1. New Admin nav: **Comments** (pending count badge).
2. List filters: status, content type (article/technique), date, search by article title/handle.
3. Detail: body, article link, author name, **email (admin only)**, source dates, status history.
4. Actions: Approve → published; Reject → archived/deleted; Spam; Edit body; Delete (soft); Reply (creates child with official label).
5. All actions write moderation events.
6. Optional Resend notify on new pending comment to an internal address (`EMAIL_*` / dedicated env) — transactional, not MailerLite.

---

## 10. Privacy, spam and security considerations

- Emails/IPs are personal data — minimise retention; prefer hashed IP; restrict admin access via existing MFA allowlist.
- Migrated `bodyHtml`: sanitise with a **stricter** allowlist than articles (likely `p`, `br`, `strong`, `em`, `a[href]` only).
- CSRF: Next server actions + same-origin; verify `Origin`/`Host` on any Route Handler.
- CSP: keep first-party; do not add third-party comment scripts.
- Spam: honeypot, timing, rate limits; optional CAPTCHA later if abuse appears.
- SEO: index published comments in HTML; `noindex` not required if quality-moderated.
- Legal pages: ensure Privacy Policy describes comment processing before launch.

---

## 11. Migration verification and rollback

### Verification

1. Count Shopify export GIDs vs imported `source_shopify_comment_gid`
2. Status mapping table documented and applied consistently  
   e.g. Shopify `PUBLISHED`→`published`, `PENDING`/`UNAPPROVED`→`pending`, `SPAM`→`spam`, `REMOVED`→`deleted` or `archived`
3. Spot-check 10 published threads on staging/Vercel preview
4. Confirm no email/ip leakage in public HTML or RSC payloads
5. Confirm technique + article pages both render

### Rollback

- Feature flag / env `JJB_COMMENTS_PUBLIC=0` to hide form + list without dropping data
- Import is idempotent on source GID — safe to truncate import batch and re-run
- Do not delete Shopify comments until JJB verification sign-off

---

## 12. Exact recommended implementation phases

| Phase | Work | Gate |
|---|---|---|
| **1** | This audit | Done |
| **2** | Read-only Shopify comments export + aggregate inventory + mapping report | Token with read scopes; private storage |
| **3** | Resolve 3 unmapped articles (restore content vs park orphan comments) | Marc decision |
| **4** | Supabase migration: comments + moderation events + RLS | Apply to JJB project only |
| **5** | Import script (dry-run then write) from private export | Completeness checks |
| **6** | Public UI (SSR list + pending form) on article & technique templates | Preview QA |
| **7** | Admin Comments list/detail/actions/replies | MFA admin QA |
| **8** | Optional notifications + CAPTCHA if needed | |
| **9** | Production enable + retain Shopify until soak period + delete private PII export + revoke token | Marc sign-off |

---

## 13. Blockers / decisions required from Marc

1. **Provide read-only Shopify Admin API access** for comments export (Custom app token with `read_content` or `read_online_store_pages`) — via password manager / local env only; **do not paste into chat**.
2. Confirm whether storefront currently **shows** comments (theme) or Admin-only history — does not block export.
3. Decide fate of the **3 unmapped articles** (autism benefits, weight cutting, low-back pain): re-import to preserve URL+comments, or accept orphaned comments.
4. Should **past_event** blog recaps accept restored + new comments?
5. Default moderation: keep **pre-publish moderation** (matches Shopify `MODERATED`) or allow auto-publish?
6. Retain commenter emails after import (admin contact) or hash/drop after migration?
7. Official reply branding text confirmed as **“Jiu Jitsu Brotherhood”**?

---

## Verdict

| Item | Answer |
|---|---|
| Can existing comments be restored? | **Yes**, from native Shopify Admin Comments, after a verified private export. |
| Estimated automatic mapping | **All comments on 180/183 Shopify articles** map by Article GID today (117 articles + 61 techniques + 2 past-event recaps). Exact comment **counts** unknown until export. |
| Manual resolution | Comments on **3** articles currently missing from Supabase; plus any status/HTML edge cases found in Phase 2. |
| Keep Shopify active? | **Yes**, until export + import verification (+ short production soak). |
| Next step | **Phase 2 read-only comments export** with a scoped Admin token; produce inventory aggregates and a mapping preview; still no public commenting system. |

---

## Appendix A — Commands and checks used (read-only)

```text
# Env key names only (no values)
node -e "… list SHOPIFY/SUPABASE-related keys from .env.local /.env.example …"

# Private Shopify audit inspection (local files)
node … blogs.json commentPolicy; articles.json keys; themes metadata; redirects for unmapped handles

# Live HTTP probes (no mutations)
curl -sI / curl -sL selected www.jiujitsubrotherhood.com blog URLs
# (often 403 from this environment)

# Shopify platform docs (WebFetch / WebSearch)
https://shopify.dev/docs/api/admin-graphql/2026-07/objects/Comment
https://shopify.dev/docs/api/admin-graphql/latest/enums/CommentStatus
https://shopify.dev/docs/api/admin-rest/latest/resources/comment

# Supabase read-only aggregates (service role, SELECT/count only)
contents counts by type/status
GID mapping of 183 Shopify articles → contents
handle collision check article vs technique
confirmed public.comments table does not exist

# Repo searches
rg for comment/disqus across docs, scripts, package.json, supabase migrations
```

### Confirmation

- **No remote Shopify data was modified.**
- **No Supabase rows were inserted/updated/deleted; no migrations applied.**
- **No application runtime files were changed** for this phase (only this audit document is added under `docs/rebuild/`).
- **No raw PII export was created.**
- **No commit, push, or deploy was performed.**
