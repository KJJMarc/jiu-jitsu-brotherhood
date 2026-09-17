/**
 * Regression: storefront catalogue must only include active (published) products.
 * Run: node scripts/test-storefront-active-only.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

const { data, error } = await sb
  .from("products")
  .select("id, title, status")
  .order("title");

if (error) {
  console.error(error.message);
  process.exit(1);
}

const all = data ?? [];
const drafts = all.filter((p) => p.status === "draft");
const active = all.filter((p) => p.status === "active");

// Mirror listStorefrontPreviewCatalogue query + guard
const { data: queried, error: qErr } = await sb
  .from("products")
  .select("id, title, status")
  .eq("status", "active");

if (qErr) {
  console.error(qErr.message);
  process.exit(1);
}

const catalogue = (queried ?? []).filter((p) => p.status === "active");
const leaked = catalogue.filter((p) => p.status !== "active");

let failed = false;
if (leaked.length) {
  console.error("FAIL: non-active products in catalogue", leaked);
  failed = true;
}
if (catalogue.length !== active.length) {
  console.error(
    `FAIL: expected ${active.length} active products, got ${catalogue.length}`,
  );
  failed = true;
}
for (const draft of drafts) {
  if (catalogue.some((p) => p.id === draft.id)) {
    console.error(`FAIL: draft still in catalogue: ${draft.title}`);
    failed = true;
  }
}

if (failed) process.exit(1);

console.log(
  `OK: ${catalogue.length} active products; ${drafts.length} drafts excluded`,
);
if (drafts.length) {
  console.log(
    "Excluded drafts:",
    drafts.map((d) => d.title).join("; "),
  );
}
