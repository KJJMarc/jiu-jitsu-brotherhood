# JJB comments — Phase 5: public UI, submissions, admin moderation

**Date:** 20 September 2026  
**Status:** **Complete (code) — no production comment writes in this phase**  
**Target project ref:** `ftdrmuggvejpbkybpwgt`  
**Follows:** `docs/rebuild/JJB-comments-phase-4-import.md`

Git-safe: no secrets, emails, comment bodies, or credentials.

---

## 1. Architecture and security decisions

| Decision | Choice |
|---|---|
| Public reads | Anon Supabase client + RLS (`status = published` only); select list excludes all private columns |
| Submissions | Server action → service-role insert; always `status = pending`, `source = jjb` |
| Private data | Email + IP hash only in `content_comment_private` |
| Rate limiting | Durable counts on existing `content_comment_private` (`ip_hash` / `author_email` + `created_at` window) — no schema change |
| Abuse extras | Honeypot + minimum submit timing (contact-form pattern) |
| Admin auth | `requireAdmin()` on every list/mutation; RLS `is_admin()` remains second line |
| Official replies | Same-table `parent_id` + `is_official_reply`; one level only (reject if parent already has parent) |
| Soft delete | Status → `deleted`; no hard delete UI |
| Notifications | Intentionally no-op (no live emails in Phase 5) |
| Schema | **Unchanged** — uses Phase 4 tables/constraints/actions as-is |

---

## 2. Public query behaviour

- `listPublishedCommentsForContent(contentId)` selects only `PUBLIC_COMMENT_SELECT`.
- Filters `content_id` + `status = published`.
- Threads: oldest top-level first; published replies nested; orphan replies surface as top-level.
- Prefer plain-text body with preserved line breaks; HTML only after `sanitizeCommentHtml`.
- Official replies labelled **Jiu Jitsu Brotherhood**.
- Mounted on article/technique pages via `ContentDocument` → `ContentCommentsSection`.

---

## 3. Submission flow

1. Client form: name, email, body, honeypot, `_t` timing, hidden `content_id`.
2. Server validates lengths/email; rejects timing/honeypot quietly or with generic errors.
3. Confirms `contents` row is published `article` or `technique`.
4. Rate-limit by IP hash (≤5/hour) and email (≤3/hour).
5. Inserts public pending row + private row; never sets Shopify GID / status / official flags from client.
6. Success copy: “Thanks — your comment is awaiting moderation.”

---

## 4. Admin moderation flow

- Nav: **Content → Comments** (`/admin/comments/`).
- Default filter: **pending** (shows the historical pending import).
- Counts for pending / published / rejected / spam / deleted / all.
- Shows content type, title, public path link; admin-only email on the server-rendered admin page.
- Actions: approve, reject, spam, unspam, soft-delete, restore — each appends `content_comment_moderation_events`.
- Official reply form on top-level comments → published child + `reply` event.
- Revalidates content canonical path + `/admin/comments/`.

---

## 5. Files changed / added

| Path | Role |
|---|---|
| `lib/content/comments-types.ts` | Statuses, limits, public select, types |
| `lib/content/comments-thread.ts` | Pure threading helpers |
| `lib/content/comments-public.server.ts` | Public published list |
| `lib/content/comments-submit.server.ts` | Public submit + rate limits |
| `lib/content/comments-admin.server.ts` | Admin list + moderate + reply |
| `components/content/comments/*` | Public UI + form + CSS |
| `components/content/ContentDocument.tsx` | Mount comments on editorial pages |
| `components/admin/AdminShell.tsx` | Nav link |
| `components/admin/comments/AdminCommentRowActions.tsx` | Action forms |
| `app/admin/(console)/comments/page.tsx` | Admin queue |
| `app/admin/(console)/comments/actions.ts` | Server actions |
| `app/admin/admin.module.css` | Admin comments styles |
| `scripts/test-jjb-comments-phase5.ts` | Unit/static tests |
| `scripts/verify-jjb-comments-live.ts` | Read-only live RLS/count verify |
| `package.json` | `test:jjb-comments`, `verify:jjb-comments-live` |
| `docs/rebuild/JJB-comments-phase-5-ui.md` | This report |

---

## 6. Test results

| Command | Result |
|---|---|
| `npm run test:jjb-comments` | **ALL_PASS** (sanitise, threading, public select hygiene, vocabulary) |
| `npm run verify:jjb-comments-live` | **ALL_PASS** — anon 69 published; svc 70/69/1; article 66; technique 4; private/events blocked anonymously |
| `npm run lint` | No ESLint warnings or errors |
| `npm run typecheck` | `tsc --noEmit` exit 0 |
| `npm run build` | **exit 0** — production build succeeded (includes `/admin/comments` and blog article routes) |

**Live verify counts (read-only):**

| Metric | Value |
|---|---|
| Anon published | 69 |
| Service total / published / pending | 70 / 69 / 1 |
| Article / technique | 66 / 4 |
| Anon private / moderation readable | blocked |
| Private columns on public table | absent |

No production comment rows were created by Phase 5 verification.

---

## 7. Remaining blockers / follow-ups

- Optional admin email notification on new pending comments (hook reserved; not wired).
- Deeper nested public replies not offered (schema allows parent_id; UI limits to official one-level replies).
- Deploy / Vercel env not changed in this phase — ensure `sb_publishable_` / `sb_secret_` are set before production traffic uses submissions.

---

## 8. Manual preview checklist

1. Open an article with historical comments — published comments visible; oldest first.
2. Open a technique with comments — same behaviour.
3. Confirm pending historical comment is **not** on the public page.
4. Submit a comment on preview/staging only if intentionally testing moderation (creates a real pending row) — otherwise skip.
5. `/admin/comments/` (authenticated admin): pending filter shows historical pending; approve/reject/spam/delete/restore work; official reply appears under parent publicly labelled Jiu Jitsu Brotherhood.
6. Sign out — admin routes redirect; public still sees only published.
7. Contact form still works unchanged.

---

## 9. Concise summary

Phase 5 adds public comment display + moderated submission on article/technique pages, and an admin Comments queue with schema-aligned moderation and official replies. Security reuses RLS, service-role writes, honeypot/timing, and durable IP/email rate limits on existing private columns. Historical import untouched; read-only live checks still show 69 public / 1 pending.
