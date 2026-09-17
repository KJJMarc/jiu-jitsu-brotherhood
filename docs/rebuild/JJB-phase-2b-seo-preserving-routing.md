# JJB Phase 2B — SEO-preserving routing foundation

**Date:** 17 September 2026  
**Status:** Accepted  
**Authoritative inventory:** [`JJB-phase-2a-url-inventory.csv`](JJB-phase-2a-url-inventory.csv) and [`JJB-phase-2a-seo-url-migration-audit.md`](JJB-phase-2a-seo-url-migration-audit.md)

Phase 2B implements the public URL contracts from Phase 2A without importing Shopify content.

## Approved decisions carried into implementation

| Decision | Outcome |
| --- | --- |
| Shopify canonical families remain authoritative | Public routes use `/blogs/…`, `/products/…`, `/collections/…`, `/pages/…` |
| `/shop` → `/collections/all` | **301** (approved 17 Sep 2026). Live Shopify `/shop` is a homepage duplicate; catalogue is `/collections/all` |
| `/collections` | **PRESERVE** as a 200 collection-list route |
| Stale `/collections` → `/collections/enso-3-0` | **Must not be restored** (`enso-3-0` is live 404) |
| `/collections/all` | Canonical catalogue / shop landing |
| `trailingSlash` | `false` (match live Shopify non-slash canonicals) |
| KJJ `/news` | **301** → `/blogs/blog` |
| `/blog` | **301** → `/pages/blog` (not `/news`) |
| `/about`, `/contact` | **301** → `/pages/about`, `/pages/contact` (not 410) |

## Runtime architecture

1. Compile CSV → `lib/migration/ledger.generated.ts` (`npm run generate:migration-ledger`).
2. Resolve in middleware via `lib/migration/resolve.ts` (301 / 410 / pass).
3. `next.config.mjs` keeps only apex → www host canonicalisation.
4. Public route shells reserve Shopify paths; unmigrated item URLs 404 until Phase 2C+.

## Validation

`npm run test:routing` audits every CSV row against the resolver. Extra rules (e.g. `/shop/bag` → `/cart`) live in `lib/migration/overrides.ts` and are asserted separately.
