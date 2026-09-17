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
