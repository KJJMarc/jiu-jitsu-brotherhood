/**
 * Verify / apply UK shipping bands in live Supabase.
 *
 * Prerequisite: min_weight_grams check must allow >= 0
 * (see supabase/migrations/20260914140000_uk_shipping_bands_update.sql).
 *
 *   node --env-file=.env.local scripts/apply-uk-shipping-bands.mjs
 *   node --env-file=.env.local scripts/apply-uk-shipping-bands.mjs --apply
 */
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");

const EXPECTED = [
  { min_weight_grams: 0, max_weight_grams: 100, price_pence: 175, sort_order: 10 },
  { min_weight_grams: 101, max_weight_grams: 500, price_pence: 275, sort_order: 20 },
  { min_weight_grams: 501, max_weight_grams: 1500, price_pence: 425, sort_order: 30 },
  { min_weight_grams: 1501, max_weight_grams: 4000, price_pence: 650, sort_order: 40 },
  { min_weight_grams: 4001, max_weight_grams: 6000, price_pence: 750, sort_order: 50 },
  { min_weight_grams: 6001, max_weight_grams: 10000, price_pence: 850, sort_order: 60 },
  { min_weight_grams: 10001, max_weight_grams: 20000, price_pence: 1200, sort_order: 70 },
];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

function formatBand(b) {
  return `${b.min_weight_grams}–${b.max_weight_grams}g → £${(b.price_pence / 100).toFixed(2)}`;
}

const { data: current, error: listError } = await sb
  .from("store_shipping_bands")
  .select("min_weight_grams,max_weight_grams,price_pence,is_enabled,sort_order")
  .eq("is_enabled", true)
  .order("sort_order");
if (listError) {
  console.error(listError.message);
  process.exit(1);
}

console.log("current enabled bands:");
for (const b of current ?? []) console.log(" ", formatBand(b));

const matches =
  (current?.length ?? 0) === EXPECTED.length &&
  EXPECTED.every((e, i) => {
    const c = current[i];
    return (
      c.min_weight_grams === e.min_weight_grams &&
      c.max_weight_grams === e.max_weight_grams &&
      c.price_pence === e.price_pence
    );
  });

if (matches) {
  console.log("OK — live bands already match expected configuration.");
  process.exit(0);
}

if (!APPLY) {
  console.log("Live bands differ. Re-run with --apply after the 0 g constraint migration is applied.");
  process.exit(2);
}

const probe = await sb
  .from("store_shipping_bands")
  .insert({
    min_weight_grams: 0,
    max_weight_grams: 1,
    price_pence: 1,
    is_enabled: false,
    sort_order: -99,
  })
  .select("id")
  .maybeSingle();

if (probe.error) {
  console.error(
    "Cannot write min_weight_grams=0. Apply migration SQL in Supabase first.\n",
    probe.error.message,
  );
  process.exit(3);
}

await sb.from("store_shipping_bands").delete().eq("id", probe.data.id);
const { error: delError } = await sb
  .from("store_shipping_bands")
  .delete()
  .neq("id", "00000000-0000-0000-0000-000000000000");
if (delError) {
  console.error("delete failed", delError.message);
  process.exit(1);
}

const { data: inserted, error: insError } = await sb
  .from("store_shipping_bands")
  .insert(
    EXPECTED.map((b) => ({
      ...b,
      is_enabled: true,
    })),
  )
  .select("min_weight_grams,max_weight_grams,price_pence,sort_order")
  .order("sort_order");
if (insError) {
  console.error("insert failed", insError.message);
  process.exit(1);
}

console.log("applied:");
for (const b of inserted ?? []) console.log(" ", formatBand(b));
