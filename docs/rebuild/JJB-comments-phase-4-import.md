# JJB comments — Phase 4: apply schema & import

**Date:** 20 September 2026  
**Status:** **Complete**  
**Target project ref:** `ftdrmuggvejpbkybpwgt`  
**Follows:** `docs/rebuild/JJB-comments-phase-3-schema-and-import-plan.md`

This document is Git-safe: **no** secrets, commenter identities, emails, or comment bodies.

---

## 1. Verdict

Phase 4 schema is live on the dedicated JJB Supabase project and **70** historical Shopify comments were imported once. Idempotent re-dry-run predicts **0** new inserts. Anonymous RLS shows **69** published rows only.

---

## 2. Preflight (at live import)

| Check | Result |
|---|---|
| URL / declared project ref | `ftdrmuggvejpbkybpwgt` |
| Hard blocklist KJJ `rfabtdqvbgdjzuakvkee` | not targeted — **pass** |
| Phase 2 `comments.jsonl` SHA-256 | **pass** `d8e43872d217690cad6a460b5e50d49fdabf71d7feeaa5f30d8ecf9dae35baa1` |
| Import-ready SHA-256 | **pass** `60fb1fc88a09b15013d525533fa532fbb53b6ce18e87272987718aee718c2497` |
| Public key prefix `sb_publishable_` | **pass** |
| Server key prefix `sb_secret_` | **pass** |
| Pre-import dry-run | predicted inserts=70, conflicts=0, excluded=0 |
| Broad `supabase db push` | **not used** |

---

## 3. Migration method and result

| Item | Detail |
|---|---|
| File | `supabase/migrations/20260920120000_content_comments.sql` |
| Apply method | JJB Supabase **SQL Editor** (single file only) |
| Automated applicator | `scripts/apply-jjb-comments-schema.ts` (available; DDL URL not required after Editor apply) |
| Post-apply fix | `GRANT SELECT ON public.content_comments TO service_role` — also recorded in the migration file so it remains accurate |
| Tables | `content_comments`, `content_comment_private`, `content_comment_moderation_events` |

---

## 4. Import method

| Item | Detail |
|---|---|
| Source | `imports/shopify/private/comments-import-ready.jsonl` (70 rows; Phase 2 export left immutable) |
| Command | `npm run import:jjb-comments:apply` (exactly once) |
| Script | `scripts/import-jjb-comments.ts` |
| Batches | 25 + 25 + 20 |
| Excluded autism / weight-cutting | **not imported** (0) |
| PII destination | `content_comment_private` only |

### Live import counts

| Metric | Result |
|---|---|
| Inserted | **70** |
| Published | **69** |
| Pending | **1** |
| Article comments | **66** |
| Technique comments | **4** |
| Excluded | **0** |
| Conflicts | **0** |
| Duplicate Shopify source IDs | **0** |
| Private rows | **70** |

---

## 5. Idempotency (post-import dry-run)

Command: `npm run import:jjb-comments` (no `--apply`)

| Metric | Result |
|---|---|
| Proposed inserts | **0** |
| Identical existing | **70** |
| Conflicts | **0** |

---

## 6. Live reconciliation

| Metric | Result |
|---|---|
| Total comments | **70** |
| Published | **69** |
| Pending | **1** |
| Unique Shopify comment GIDs | **70** |
| Duplicate source GIDs | **0** |
| Missing `contents` references | **0** |
| Article / technique | **66 / 4** |
| Parent relationships | **0** |
| Official replies | **0** |
| Private rows | **70** |

---

## 7. RLS / anonymous verification

| Check | Result |
|---|---|
| Anon published count | **69** |
| Anon sample statuses published-only | **true** |
| Pending readable anonymously | **no** (69 ≠ 70) |
| `content_comment_private` readable anonymously | **no** |
| `content_comment_moderation_events` readable anonymously | **no** |
| Private columns absent on public table | **true** |
| Overall `rls_ok` | **true** |

---

## 8. Warnings / deviations

* Initial SQL Editor apply omitted `GRANT SELECT … TO service_role` for `content_comments` (service_role bypasses RLS but still needs table privileges). Fixed in live DB and in the migration file before import.
* Schema was applied via SQL Editor, not `psql` / `SUPABASE_DB_URL`.
* No UI built in this phase. No commit, push, or deploy.

---

## 9. Recommended Phase 5 UI work

1. Public published-comment list on article/technique pages (anon SELECT only).
2. Public submission → server action → `pending` + private row (honeypot, rate-limit, sanitise).
3. Admin moderation queue: approve / reject / spam / soft-delete / official reply.
4. Optional pending-comment notification.

---

## 10. Files involved

| Path | Role |
|---|---|
| `supabase/migrations/20260920120000_content_comments.sql` | Schema + RLS + grants (incl. service_role SELECT) |
| `lib/supabase/jjb-phase4-write-gate.ts` | Project + key-prefix write gate |
| `scripts/apply-jjb-comments-schema.ts` | Single-file schema applicator |
| `scripts/import-jjb-comments.ts` | Dry-run / `--apply` importer |
| `package.json` | `apply:jjb-comments-schema*`, `import:jjb-comments*` |
| `docs/rebuild/JJB-comments-phase-4-import.md` | This report |
