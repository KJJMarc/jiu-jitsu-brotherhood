# JJB comments — Phase 3: schema, moderation & import dry run

**Date:** 20 September 2026  
**Status:** **Complete — proposed only (no Supabase writes, migration not applied)**  
**Follows:** `docs/rebuild/JJB-comments-export-phase-2.md`  
**Phase 2 export SHA-256 (verified):** `d8e43872d217690cad6a460b5e50d49fdabf71d7feeaa5f30d8ecf9dae35baa1`

This document is Git-safe: it contains **no** access tokens, commenter emails, IP addresses, or comment bodies.

---

## 1. Objective

Prepare a reviewable Supabase comments architecture and a deterministic, non-mutating import dry run for the **70** Phase 2 comments mapped to existing JJB content. Public and admin UI are deferred to Phase 4.

**Out of scope (Phase 3):** applying migrations, writing to Supabase, mutating Shopify, building UI, committing/pushing/deploying.

---

## 2. Design choice — same-table parent/child

**Chosen model:** one public-safe table `content_comments` with nullable `parent_id` self-FK (`ON DELETE SET NULL`), plus:

| Table | Purpose |
|---|---|
| `content_comments` | Audience-facing fields; statuses; Shopify source identity |
| `content_comment_private` | Author email, IP hash, user-agent (admin/service only) |
| `content_comment_moderation_events` | Append-only moderation audit |

**Why same-table rather than a separate replies table**

- Historical Shopify export is **flat** (no parent/reply relationships), but the product needs **admin responses** now and **future public threading**.
- Existing JJB content already uses a single `contents` table with type discrimination; a single comments table with `parent_id` matches that simplicity.
- Admin replies are rows with `parent_id` set and `is_official_reply = true` (constraint requires a parent).
- Soft-delete of a parent (`status = 'deleted'`) can leave children intact via `ON DELETE SET NULL` only when the parent row is hard-deleted; normal moderation uses status, not hard delete.
- Public SELECT RLS is a single predicate (`status = 'published'`), including published replies.

A separate replies table was rejected as unnecessary indirection given flat historical data and a small expected volume.

---

## 3. Proposed schema

**Migration (unapplied):** `supabase/migrations/20260920120000_content_comments.sql`

### 3.1 `content_comments`

| Column | Notes |
|---|---|
| `id` | `uuid` PK (import uses deterministic IDs from Shopify GID) |
| `content_id` | FK → `contents(id)` `ON DELETE CASCADE` |
| `parent_id` | Self-FK, nullable; future thread / admin reply |
| `status` | `pending` \| `published` \| `spam` \| `rejected` \| `deleted` |
| `author_display_name` | Public |
| `body_text` / `body_html` | Sanitised; at least one non-empty |
| `is_official_reply` | Admin/JJB reply marker (requires `parent_id`) |
| `source` | `shopify` \| `jjb` |
| `source_shopify_comment_gid` | Immutable; unique partial index for idempotent import |
| `source_shopify_article_gid` | Provenance |
| `source_created_at` | Original audience-facing timestamp |
| `published_at` | Set when published |
| `created_at` / `updated_at` | Audit |
| `moderated_at` / `moderated_by` | Last moderation actor |

**Indexes:** unique Shopify GID (partial); published-by-content ordering; status; parent; content_id.

**Safe deletion:** prefer `status = 'deleted'` (hidden from public SELECT). Hard delete cascades private + moderation rows; parent hard-delete nulls children’s `parent_id`.

### 3.2 `content_comment_private`

1:1 with `content_comments` (`comment_id` PK, `ON DELETE CASCADE`). Holds `author_email`, `ip_hash`, `user_agent`. **No grants to `anon`.** Never selected by public client queries.

### 3.3 `content_comment_moderation_events`

Append-only: `approve`, `reject`, `spam`, `unspam`, `edit`, `delete`, `restore`, `reply`.

### 3.4 Sanitisation

`lib/content/sanitize-comment.ts` — narrow allowlist (`p`, `br`, `strong`, `em`, `b`, `i`, `a` with safe `href` only). Used by the import dry-run; Phase 4 public submit will store plain text → escaped HTML via `plainTextToCommentHtml`.

---

## 4. RLS and authorization model

Aligned with existing `public.is_admin()` and app-level `requireAdmin()` (allowlisted `admin_users` + MFA).

| Actor | `content_comments` | `content_comment_private` | Moderation events |
|---|---|---|---|
| `anon` / non-admin `authenticated` | SELECT where `status = 'published'` only | **None** | **None** |
| Admin (`is_admin()`) | Full SELECT/INSERT/UPDATE/DELETE | Full | SELECT/INSERT |
| Service role (server only) | Used for public submit + import | Used for private insert | Used as needed |

**Critical controls**

- No anon INSERT/UPDATE/DELETE policies — public submissions go through a **server action** using the service role **after** validation (same pattern as the contact form).
- Browser clients never receive `author_email` / IP / user-agent.
- `sb_secret_…` / service role remains server-only; never exposed to the client.
- Admin UI/actions call `requireAdmin()` before mutations; RLS remains a second line of defence via `is_admin()`.
- Existing RLS on other tables is unchanged.

---

## 5. Public submission flow (Phase 4 — planned)

1. Client form: display name, email (stored private only), body (plain text), honeypot field, optional timing gate (mirror `ContactForm`).
2. Server action: validate lengths/format → reject honeypot → rate-limit → sanitise → insert `content_comments` with `status = 'pending'`, `source = 'jjb'` via service role → insert private row → return success without exposing email.
3. Public list query: anon client SELECT from `content_comments` only (`status = 'published'`), ordered by `source_created_at` / `created_at`. Never join private table.

---

## 6. Moderation / admin workflow (Phase 4 — planned)

Admin console (existing auth + MFA), server actions with `requireAdmin()`:

| Action | Effect |
|---|---|
| Approve | `pending`/`rejected` → `published`; set `published_at`, moderation event |
| Reject | → `rejected` |
| Mark spam | → `spam` |
| Soft delete | → `deleted` |
| Restore | From `deleted`/`spam` back to `pending` or `published` as policy dictates |
| Official reply | Insert child row: `parent_id`, `is_official_reply = true`, typically `published` |

Append event to `content_comment_moderation_events` on each action.

---

## 7. Admin-response model

- Same table, `parent_id` → parent comment.
- `is_official_reply = true`; UI labels author as Jiu Jitsu Brotherhood (display name may still be stored for audit).
- Historical import sets `parent_id = null` for all 70 rows (no Shopify parent data).

---

## 8. Historical import rules

| Rule | Detail |
|---|---|
| Gate | Phase 2 `comments.jsonl` SHA-256 must equal `d8e43872…` |
| Mutability | Phase 2 files (`comments.jsonl`, mapping, manifest) are **immutable audit source** — never modified |
| Mapped only | Import **70** comments with JJB `content_id` |
| Status map | Shopify `PUBLISHED` → `published`; `UNAPPROVED`/`PENDING` → `pending`; `SPAM` → `spam`; `REMOVED` → `deleted` |
| IDs | Deterministic UUID from Shopify comment GID (`stableCommentIdFromShopifyGid`) |
| Idempotency | Unique index on `source_shopify_comment_gid` |
| Private | Email + IP hash + UA in separate payload / table; not in public columns |
| Writes | Phase 3 dry-run writes **local** gitignored artefacts only — **no Supabase** |

**Script:** `scripts/prepare-jjb-comments-import.ts`  
**npm:** `npm run prepare:jjb-comments-import` (includes `--verify-twice`)

---

## 9. Intentionally excluded comments (8)

These are **not required and must not be migrated**. They are not orphans awaiting future content; no orphan table or reconciliation mechanism is planned.

| Source article handle | Count |
|---|---|
| `5-ways-jiujitsu-benefits-children-autism` | 6 |
| `cut-weight-jiu-jitsu-competitions` | 2 |
| **Total** | **8** |

Phase 2 export left unchanged. Dry-run records counts and handles only — **no** commenter details in the Git-safe report or dry-run report JSON.

---

## 10. Exact dry-run counts

Verified 20 September 2026 (`npm run prepare:jjb-comments-import`).

| Check | Result |
|---|---|
| Phase 2 SHA-256 verified | **true** |
| Phase 2 raw comments | **78** |
| Import-ready | **70** |
| Intentionally excluded | **8** |
| Status after conversion | **published 69**, **pending 1** |
| By content type | **article 66**, **technique 4** |
| Mapping classes seen | `mapped_article` 66, `mapped_technique` 4, `unmapped_article` 8 |
| Duplicate source IDs | **0** |
| Missing content references (among import-ready) | **0** |
| `parent_id` all null | **true** |
| Determinism (second pass identical SHA-256) | **OK** |
| Import-ready SHA-256 | `60fb1fc88a09b15013d525533fa532fbb53b6ce18e87272987718aee718c2497` |
| Dry-run report contains email addresses | **false** |
| Private fields separated in ready rows | `private.author_email`, `private.ip_hash`, `private.user_agent` |

Private artefacts (gitignored under `imports/shopify/private/`):

- `comments-import-ready.jsonl`
- `comments-import-dry-run-report.json`

---

## 11. GDPR / data minimisation

- Historical emails exist in Shopify export and will land only in `content_comment_private` (admin/service).
- Public APIs, logs, and Git docs must never include emails.
- IP stored as **hash** only in prepared import (`sha256` with app namespace prefix).
- Retention / erasure: hard delete of a comment cascades private row; soft-delete hides from public without wiping PII until an explicit purge policy (Phase 4 decision).
- Legal basis for retaining historical emails: contact for moderation / abuse only — review before go-live if a shorter retention is preferred.

---

## 12. Risks and unresolved decisions

| Item | Notes |
|---|---|
| Migration not applied | Requires explicit Phase 4 approval |
| Soft vs hard delete UX | Schema supports both; product default should be soft-delete |
| Public reply threading | Schema ready; product may ship admin-reply-only first |
| Email retention window | Not fixed in Phase 3 |
| Rate-limit backend | Contact form pattern exists; comment-specific limits TBD in Phase 4 |
| Notification of new pending comments | Optional email/admin badge — not designed yet |
| Vercel env | Confirm `sb_publishable_` / `sb_secret_` on production before Phase 4 apply |

---

## 13. Recommended Phase 4 order

1. Review and approve migration + this plan.
2. Apply `20260920120000_content_comments.sql` to JJB Supabase only.
3. Run a one-shot import from `comments-import-ready.jsonl` (service role; upsert on Shopify GID; insert private rows).
4. Smoke-check: 70 rows, 69 published visible via anon SELECT, 1 pending hidden, private table row count 70, no email in public select.
5. Server actions: public submit (validate, honeypot, rate-limit, sanitise, pending insert).
6. Public UI: list published comments on article/technique pages.
7. Admin UI: queue, approve/reject/spam/delete, official reply.
8. Optional: moderation email alerts; retention/purge job.

---

## 14. Verification commands run (Phase 3)

| Command | Result |
|---|---|
| `npm run prepare:jjb-comments-import` | SUCCESS — import_ready=70, excluded=8, determinism OK |
| `npm run lint` | No ESLint warnings or errors |
| `npm run typecheck` | `tsc --noEmit` exit 0 |

**Not run (by design):** migration apply, Supabase mutations, UI builds tied to comments.

---

## 15. Files created / changed

| Path | Role |
|---|---|
| `supabase/migrations/20260920120000_content_comments.sql` | Proposed schema + RLS (**unapplied**) |
| `lib/content/sanitize-comment.ts` | Comment HTML allowlist / plain-text helper |
| `scripts/prepare-jjb-comments-import.ts` | Deterministic dry-run preparer |
| `package.json` | Script `prepare:jjb-comments-import` |
| `docs/rebuild/JJB-comments-phase-3-schema-and-import-plan.md` | This report |
| `imports/shopify/private/comments-import-ready.jsonl` | Gitignored dry-run output |
| `imports/shopify/private/comments-import-dry-run-report.json` | Gitignored aggregates |

Unrelated working-tree changes (e.g. `ContentBody.module.css`, audit docs) were left untouched.
