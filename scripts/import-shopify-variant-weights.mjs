#!/usr/bin/env node
/**
 * Import Shopify "Variant Grams" into product_variants.weight_grams.
 *
 * - Uses Variant Grams as grams (Shopify export convention).
 * - Skips 0 / blank values (leave null — never invent).
 * - Rounds fractional gram values to nearest integer.
 * - Does not invent weights for missing rows.
 *
 * Usage:
 *   node scripts/import-shopify-variant-weights.mjs
 *   node scripts/import-shopify-variant-weights.mjs --apply
 */

import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function loadEnvLocal() {
  const envPath = join(ROOT, ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const apply = process.argv.includes("--apply");
const csvArg = process.argv.findIndex((a) => a === "--csv");
const csvPath = resolve(
  csvArg >= 0 && process.argv[csvArg + 1]
    ? process.argv[csvArg + 1]
    : join(ROOT, "imports/shopify/products_export_1.csv")
);

function normalizeOption(value) {
  const raw = String(value ?? "").trim();
  if (!raw || /^default title$/i.test(raw) || /^default$/i.test(raw)) {
    return "default";
  }
  return raw.toLowerCase().replace(/\s+/g, " ");
}

function parseGrams(raw) {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return Math.max(1, Math.round(num));
}

const rows = parse(readFileSync(csvPath, "utf8"), {
  columns: true,
  skip_empty_lines: true,
  relax_column_count: true,
  trim: true,
});

/** @type {Map<string, Map<string, number>>} */
const byHandle = new Map();
for (const row of rows) {
  const handle = String(row.Handle ?? "").trim();
  if (!handle) continue;
  const grams = parseGrams(row["Variant Grams"]);
  if (grams == null) continue;
  const option = String(row["Option1 Value"] ?? "").trim() || "Default Title";
  if (!byHandle.has(handle)) byHandle.set(handle, new Map());
  byHandle.get(handle).set(normalizeOption(option), grams);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const { data: products, error } = await supabase
  .from("products")
  .select(
    "id, title, shopify_handle, product_type, product_variants(id, option_value, weight_grams, sku)"
  );
if (error) {
  console.error(error.message);
  process.exit(1);
}

let matched = 0;
let updated = 0;
let skippedZero = 0;
let unmatched = 0;
const suspicious = [];

console.log(`${apply ? "APPLY" : "DRY-RUN"} weights from ${csvPath}`);

for (const product of products ?? []) {
  const handle = product.shopify_handle;
  if (!handle || !byHandle.has(handle)) continue;
  if (product.product_type !== "physical") continue;

  const csvVariants = byHandle.get(handle);
  for (const variant of product.product_variants ?? []) {
    const key = normalizeOption(variant.option_value);
    const grams = csvVariants.get(key);
    if (grams == null) {
      unmatched += 1;
      continue;
    }
    matched += 1;
    if (grams !== variant.weight_grams) {
      console.log(
        `  ${handle} · ${variant.option_value}: ${variant.weight_grams} → ${grams}`
      );
      if (apply) {
        const { error: upErr } = await supabase
          .from("product_variants")
          .update({ weight_grams: grams })
          .eq("id", variant.id);
        if (upErr) throw new Error(upErr.message);
        updated += 1;
      }
    }
  }

  const weights = [...csvVariants.values()];
  if (weights.length > 1) {
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    if (max >= min * 2 && max - min >= 200) {
      suspicious.push(
        `${handle}: variant weights span ${min}–${max}g (review)`
      );
    }
  }
}

console.log("\nSummary");
console.log(`  matched variants : ${matched}`);
console.log(`  unmatched options: ${unmatched}`);
console.log(`  updated          : ${apply ? updated : "(dry-run)"}`);
if (suspicious.length) {
  console.log("\nSuspicious (imported as-is, please review):");
  for (const line of suspicious) console.log(`  - ${line}`);
}
if (!apply) console.log("\nRe-run with --apply to write changes.");
