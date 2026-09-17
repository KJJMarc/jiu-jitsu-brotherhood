#!/usr/bin/env node
/**
 * Apply Shopify inventory export to KJJ admin Store variants.
 *
 * Usage:
 *   node scripts/apply-shopify-inventory.mjs --csv imports/shopify/inventory_export.csv
 *   node scripts/apply-shopify-inventory.mjs --csv ... --apply
 *
 * - Aggregates On hand qty across stocked locations (skips "not stocked")
 *   Prefer On hand (new) → On hand (current) → Available as last resort
 * - Clears stock_review_required on matched + remaining tracked variants
 * - Does not flip product status; does not touch Shopify, public /shop, cart, or checkout
 */

import { createClient } from "@supabase/supabase-js";
import { createReadStream, existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse";

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
const csvArgIndex = process.argv.findIndex((a) => a === "--csv");
const csvPath = resolve(
  csvArgIndex >= 0 && process.argv[csvArgIndex + 1]
    ? process.argv[csvArgIndex + 1]
    : join(ROOT, "imports/shopify/inventory_export.csv")
);

function normalizeOptionValue(value) {
  const raw = String(value ?? "").trim();
  if (!raw || /^default title$/i.test(raw) || /^default$/i.test(raw)) {
    return "default";
  }
  return raw.toLowerCase().replace(/\s+/g, " ");
}

/**
 * Parse a Shopify inventory cell.
 * "not stocked" / blank → null (skip this location).
 * Numeric strings (incl. 0) → integer stock, floored at 0.
 */
function parseStockCell(raw) {
  const value = String(raw ?? "").trim();
  if (!value || value === "not stocked") return null;
  const qty = Number(value);
  if (!Number.isFinite(qty)) return null;
  return Math.max(0, Math.trunc(qty));
}

const FIXED_INVENTORY_COLUMNS = new Set([
  "Handle",
  "Title",
  "Option1 Name",
  "Option1 Value",
  "Option2 Name",
  "Option2 Value",
  "Option3 Name",
  "Option3 Value",
  "SKU",
  "HS Code",
  "COO",
  "Location",
  "Bin name",
  "Incoming (not editable)",
  "Unavailable (not editable)",
  "Committed (not editable)",
  "Available (not editable)",
  "On hand (current)",
  "On hand (new)",
]);

/**
 * Prefer physical On hand over sellable Available.
 * Shopify Available excludes committed orders; admin stock should track On hand.
 *
 * Long-format priority:
 *   1. On hand (new) when set
 *   2. On hand (current)
 *   3. Available (not editable) as last resort
 *
 * Wide/master exports still sum location columns.
 */
function stockFromRow(row) {
  if (
    "Location" in row ||
    "On hand (current)" in row ||
    "Available (not editable)" in row
  ) {
    const onHandNew = parseStockCell(row["On hand (new)"]);
    if (onHandNew != null) return onHandNew;

    const onHandCurrent = parseStockCell(row["On hand (current)"]);
    if (onHandCurrent != null) return onHandCurrent;

    return parseStockCell(row["Available (not editable)"]);
  }

  let total = 0;
  let sawStocked = false;
  for (const [key, value] of Object.entries(row)) {
    if (FIXED_INVENTORY_COLUMNS.has(key)) continue;
    const qty = parseStockCell(value);
    if (qty == null) continue;
    sawStocked = true;
    total += qty;
  }
  return sawStocked ? total : null;
}

async function readInventoryCsv(path) {
  const rows = [];
  const parser = createReadStream(path).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true,
    })
  );
  for await (const row of parser) rows.push(row);
  return rows;
}

/**
 * Build a stable variant key from Option1 + Option2 + Option3 when present.
 * Matches common Shopify size/color exports without collapsing distinct combos.
 */
function variantKeyFromRow(row) {
  const parts = [
    String(row["Option1 Value"] ?? "").trim(),
    String(row["Option2 Value"] ?? "").trim(),
    String(row["Option3 Value"] ?? "").trim(),
  ].filter(Boolean);
  if (parts.length === 0) return normalizeOptionValue("Default Title");
  return normalizeOptionValue(parts.join(" / "));
}

function optionLabelFromRow(row) {
  const names = [
    String(row["Option1 Name"] ?? "").trim(),
    String(row["Option2 Name"] ?? "").trim(),
    String(row["Option3 Name"] ?? "").trim(),
  ].filter(Boolean);
  return names.join(" / ") || "Title";
}

function optionValueFromRow(row) {
  const values = [
    String(row["Option1 Value"] ?? "").trim(),
    String(row["Option2 Value"] ?? "").trim(),
    String(row["Option3 Value"] ?? "").trim(),
  ].filter(Boolean);
  return values.join(" / ") || "Default Title";
}

/** @returns {Map<string, Map<string, { title: string, optionName: string, optionValue: string, sku: string|null, available: number }>>} */
function aggregateInventory(rows) {
  /** @type {Map<string, Map<string, any>>} */
  const byHandle = new Map();

  for (const row of rows) {
    const handle = String(row.Handle ?? "").trim();
    if (!handle) continue;
    const optionValue = optionValueFromRow(row);
    const optionName = optionLabelFromRow(row);
    const stock = stockFromRow(row);
    if (stock == null) continue; // not stocked at this location / row

    if (!byHandle.has(handle)) byHandle.set(handle, new Map());
    const variants = byHandle.get(handle);
    const key = variantKeyFromRow(row);
    const existing = variants.get(key);
    if (existing) {
      existing.available += stock;
    } else {
      variants.set(key, {
        title: String(row.Title ?? "").trim(),
        optionName,
        optionValue,
        sku: String(row.SKU ?? "").trim() || null,
        available: stock,
      });
    }
  }

  return byHandle;
}

function createSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

async function main() {
  if (!existsSync(csvPath)) {
    throw new Error(`CSV not found: ${csvPath}`);
  }

  const rows = await readInventoryCsv(csvPath);
  const inventory = aggregateInventory(rows);
  const supabase = createSupabase();

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select(
      "id, title, status, shopify_handle, product_variants(id, option_name, option_value, sku, track_inventory, stock_qty, stock_review_required)"
    );
  if (productsError) throw new Error(productsError.message);

  const productByHandle = new Map(
    (products ?? [])
      .filter((p) => p.shopify_handle)
      .map((p) => [p.shopify_handle, p])
  );

  let matchedVariants = 0;
  let updatedVariants = 0;
  let unmatchedCsv = 0;
  let activatedProducts = 0;
  let clearedReview = 0;
  const unmatched = [];

  console.log(
    `${apply ? "APPLY" : "DRY-RUN"} inventory from ${csvPath}`
  );
  console.log(
    `CSV handles: ${inventory.size}; DB products: ${(products ?? []).length}`
  );

  /** @type {Set<string>} */
  const touchedProductIds = new Set();

  for (const [handle, variants] of inventory.entries()) {
    const product = productByHandle.get(handle);
    if (!product) {
      unmatchedCsv += variants.size;
      unmatched.push(`handle missing in DB: ${handle}`);
      continue;
    }

    const dbVariants = product.product_variants ?? [];
    const dbByOption = new Map(
      dbVariants.map((v) => [normalizeOptionValue(v.option_value), v])
    );

    for (const [optionKey, csvVariant] of variants.entries()) {
      const dbVariant = dbByOption.get(optionKey);
      if (!dbVariant) {
        unmatchedCsv += 1;
        unmatched.push(
          `${handle} / ${csvVariant.optionValue} (no DB variant)`
        );
        continue;
      }

      matchedVariants += 1;
      touchedProductIds.add(product.id);
      const nextQty = csvVariant.available;
      const needsUpdate =
        dbVariant.stock_qty !== nextQty ||
        dbVariant.stock_review_required === true ||
        (csvVariant.sku && dbVariant.sku !== csvVariant.sku);

      console.log(
        `  ${handle} · ${csvVariant.optionValue}: ${dbVariant.stock_qty} → ${nextQty}` +
          (dbVariant.stock_review_required ? " (clear review)" : "")
      );

      if (apply && needsUpdate) {
        const patch = {
          stock_qty: nextQty,
          stock_review_required: false,
          track_inventory: true,
        };
        if (csvVariant.sku) patch.sku = csvVariant.sku;
        const { error } = await supabase
          .from("product_variants")
          .update(patch)
          .eq("id", dbVariant.id);
        if (error) throw new Error(`${handle}: ${error.message}`);
        updatedVariants += 1;
      }
    }
  }

  // Partial inventory files should not flip unrelated (or intentional) drafts
  // to active. Stock updates above already clear review on matched variants.
  for (const product of products ?? []) {
    if (!touchedProductIds.has(product.id)) continue;

    for (const variant of product.product_variants ?? []) {
      if (!variant.stock_review_required) continue;
      clearedReview += 1;
      console.log(
        `  clear review: ${product.shopify_handle ?? product.title} · ${variant.option_value}`
      );
      if (apply) {
        const { error } = await supabase
          .from("product_variants")
          .update({ stock_review_required: false })
          .eq("id", variant.id);
        if (error) throw new Error(error.message);
      }
    }
  }

  console.log("\nSummary");
  console.log(`  matched variants     : ${matchedVariants}`);
  console.log(`  unmatched CSV rows   : ${unmatchedCsv}`);
  console.log(`  variants updated     : ${apply ? updatedVariants : "(dry-run)"}`);
  console.log(`  review flags cleared : ${apply ? "yes" : clearedReview + " pending"}`);
  console.log(`  products activated   : skipped (status left unchanged)`);
  if (unmatched.length) {
    console.log("\nUnmatched:");
    for (const line of unmatched) console.log(`  - ${line}`);
  }
  if (!apply) {
    console.log("\nRe-run with --apply to write changes.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
