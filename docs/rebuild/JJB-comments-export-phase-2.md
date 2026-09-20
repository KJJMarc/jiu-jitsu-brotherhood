# JJB comments export — Phase 2 inventory & mapping

**Date:** 20 September 2026  
**Status:** **Complete — read-only export verified**  
**Follows:** `docs/rebuild/JJB-comments-restoration-audit.md`  
**Shop:** `jiu-jitsu-brotherhood.myshopify.com`  
**Admin API:** GraphQL `2026-07` via client_credentials (`read_content` only)

This document is Git-safe: it contains **no** access tokens, commenter emails, IP addresses, or comment bodies.

Private (gitignored) artefacts:

| File | Role |
|---|---|
| `imports/shopify/private/comments.jsonl` | Raw export (PII) |
| `imports/shopify/private/comments-mapping.jsonl` | Per-comment mapping (no emails/bodies) |
| `imports/shopify/private/comments-manifest.json` | Aggregates + SHA-256 |

---

## 1. Authentication & schema

| Check | Result |
|---|---|
| Auth method | Client credentials → short-lived Admin token |
| Granted scope logged | `read_content` |
| Mutations | **None** |
| GraphQL `Comment` fields | `article`, `author`, `body`, `bodyHtml`, `createdAt`, `events`, `id`, `ip`, `isPublished`, `publishedAt`, `status`, `updatedAt`, `userAgent` |
| Parent / reply fields | **None** (flat comments) |
| Pagination | 2 pages × 50; completed normally |
| Duplicate comment GIDs | **0** |
| REST `comments/count.json` | **78** — matches export unique GIDs (**78**) |

---

## 2. Inventory (aggregates)

| Measure | Count |
|---|---|
| Total comments | **78** |
| Unique comment GIDs | **78** |
| Articles with ≥1 comment | **43** |
| Missing source article GID | **0** |
| Earliest `createdAt` | 2021-06-15 |
| Latest `createdAt` | 2026-09-17 |

### By blog

| Blog handle | Comments |
|---|---|
| `blog` (Articles) | 74 |
| `techniques` | 4 |

### By status

| Status | Comments |
|---|---|
| `PUBLISHED` | 77 |
| `UNAPPROVED` | 1 |
| `PENDING` / `SPAM` / `REMOVED` | 0 |

### By year (`createdAt`)

| Year | Comments |
|---|---|
| 2021 | 4 |
| 2022 | 6 |
| 2023 | 13 |
| 2024 | 12 |
| 2025 | 33 |
| 2026 | 10 |

### Quality flags (counts only)

| Flag | Count |
|---|---|
| Missing author name | 0 |
| Missing author email | 0 |
| Empty body | 0 |
| HTML in body/bodyHtml | 78 |
| Parent/reply relationship | 0 |

### SHA-256 (`comments.jsonl`)

`d8e43872d217690cad6a460b5e50d49fdabf71d7feeaa5f30d8ecf9dae35baa1`  
(recomputed after write — matches manifest)

---

## 3. Mapping to Supabase `contents`

Read-only SELECT on `contents.source_shopify_gid` (189 rows with a GID). **No Supabase writes.**

| Mapping class | Comments |
|---|---|
| `mapped_article` | **66** |
| `mapped_technique` | **4** |
| `mapped_other_content` | 0 |
| `unmapped_article` | **8** |
| `missing_source_article` | 0 |
| `ambiguous` | 0 |

**Automatic attach rate:** 70 / 78 (**89.7%**) map to a live `contents` row.  
**Preserved unmapped:** 8 / 78 on the known Phase-1 articles (not discarded).

### Unmapped articles (preserved)

| Handle | Comments | Notes |
|---|---|---|
| `5-ways-jiujitsu-benefits-children-autism` | 6 | No Supabase destination today |
| `cut-weight-jiu-jitsu-competitions` | 2 | No Supabase destination today |
| `how-to-overcome-low-back-pain-in-brazilian-jiu-jitsu` | 0 | Still unmapped as content; no comments in this export |

No unmapped comment GIDs fell outside this Phase-1 set.

### Techniques with comments (all mapped)

4 comments on the `techniques` blog — all `mapped_technique`.

---

## 4. Safety confirmation

- Shopify: **read-only** (token exchange + GraphQL/REST GET only)
- Supabase: **read-only** mapping SELECT
- Console / docs: aggregates only — no tokens, emails, IPs, or bodies
- Raw export path: gitignored; file mode `600`
- Commit / push / deploy: **not performed**

---

## 5. Verdict & next step

| Item | Status |
|---|---|
| Export complete & reconciled | **Yes** (78 = REST count) |
| Restorable onto current site without content changes | **70** comments |
| Need content restore / decision first | **8** comments (2 articles) |
| Shopify must stay active until JJB import verified | **Yes** |

**Recommended next step (Phase 3):** Marc decides whether to re-import the two commented unmapped articles (and the third silent unmapped article), then proceed to schema + import of comments into JJB — still without public UI until a later phase.
