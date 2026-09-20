# Shopify catalogue import inputs (private / admin-only).
#
# Place the Shopify products export at:
#   imports/shopify/products_export_1.csv
#
# The CSV is intentionally gitignored and must not be committed.
# Run dry-run analysis first:
#   npm run import:shopify:dry-run
#
# Live import (after dry-run review) writes draft/private products only:
#   npm run import:shopify
#
# Physical inventory drafts (Staunton stock only; skips Printful/Gooten):
#   npm run import:physical-drafts:dry-run
#   npm run import:physical-drafts
#
# ## Private Admin exports (gitignored)
#
# All files under `imports/shopify/private/` are gitignored and may contain
# personal data. Never commit them. Prefer chmod 700/600 on that tree.
#
# Comments export (Phase 2), once a read-only Admin token is in `.env.local`:
#   npm run export:jjb-comments
# Outputs (still gitignored): comments.jsonl, comments-mapping.jsonl,
# comments-manifest.json
# Docs: docs/rebuild/JJB-comments-restoration-audit.md
#       docs/rebuild/JJB-comments-export-phase-2.md
