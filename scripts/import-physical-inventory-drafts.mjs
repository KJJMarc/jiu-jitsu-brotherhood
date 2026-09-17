#!/usr/bin/env node
/**
 * Create draft physical products from Shopify inventory exports.
 *
 * - Only counts stock at the physical club location (default: 56 Staunton Road)
 * - Skips print-on-demand locations (Gooten, Printful, …)
 * - Dedupes handles/variants across multiple CSVs (max On hand)
 * - Creates missing products as status=draft with stock intact
 * - Leaves existing products alone (use apply-shopify-inventory.mjs for those)
 *
 * Usage:
 *   node scripts/import-physical-inventory-drafts.mjs
 *   node scripts/import-physical-inventory-drafts.mjs --apply
 *   node scripts/import-physical-inventory-drafts.mjs --csv a.csv --csv b.csv --apply
 *
 * Requires for --apply:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { createReadStream, existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const PHYSICAL_LOCATION = "56 Staunton Road";
const POD_LOCATIONS = new Set(["Gooten", "Printful"]);

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

function collectCsvPaths() {
  const paths = [];
  for (let i = 0; i < process.argv.length; i += 1) {
    if (process.argv[i] === "--csv" && process.argv[i + 1]) {
      paths.push(resolve(process.argv[i + 1]));
    }
  }
  if (paths.length) return paths;

  const defaults = [
    join(ROOT, "imports/shopify/inventory_export.csv"),
    join(ROOT, "imports/shopify/inventory_export_1.csv"),
  ].filter((p) => existsSync(p));

  if (!defaults.length) {
    throw new Error(
      "No inventory CSV found. Pass --csv <path> or place files under imports/shopify/."
    );
  }
  return defaults;
}

function parseStockCell(raw) {
  const value = String(raw ?? "").trim();
  if (!value || value === "not stocked") return null;
  const qty = Number(value);
  if (!Number.isFinite(qty)) return null;
  return Math.max(0, Math.trunc(qty));
}

function stockFromRow(row) {
  const onHandNew = parseStockCell(row["On hand (new)"]);
  if (onHandNew != null) return onHandNew;
  const onHandCurrent = parseStockCell(row["On hand (current)"]);
  if (onHandCurrent != null) return onHandCurrent;
  return parseStockCell(row["Available (not editable)"]);
}

function slugifyHandle(handle) {
  return String(handle)
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function readInventoryCsv(path) {
  const rows = [];
  const parser = createReadStream(path).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true,
      bom: true,
    })
  );
  for await (const row of parser) rows.push(row);
  return rows;
}

/**
 * Aggregate physical-location stock across CSVs.
 * Uses max qty when the same handle/variant appears in multiple files.
 * @returns {Map<string, {
 *   handle: string,
 *   title: string,
 *   optionName: string,
 *   variants: Map<string, { optionValue: string, sku: string|null, stockQty: number }>
 * }>}
 */
function aggregatePhysicalInventory(rowsByFile) {
  /** @type {Map<string, any>} */
  const byHandle = new Map();

  for (const rows of rowsByFile) {
    for (const row of rows) {
      const location = String(row.Location ?? "").trim();
      if (!location) continue;
      if (POD_LOCATIONS.has(location)) continue;
      if (location !== PHYSICAL_LOCATION) continue;

      const handle = String(row.Handle ?? "").trim();
      if (!handle) continue;

      const stock = stockFromRow(row);
      if (stock == null) continue;

      const optionName =
        String(row["Option1 Name"] ?? "").trim() || "Title";
      const optionValue =
        String(row["Option1 Value"] ?? "").trim() || "Default Title";
      const title = String(row.Title ?? "").trim() || handle;
      const sku = String(row.SKU ?? "").trim() || null;

      if (!byHandle.has(handle)) {
        byHandle.set(handle, {
          handle,
          title,
          optionName,
          variants: new Map(),
        });
      }

      const product = byHandle.get(handle);
      if (title) product.title = title;
      if (optionName) product.optionName = optionName;

      const existing = product.variants.get(optionValue);
      if (existing) {
        existing.stockQty = Math.max(existing.stockQty, stock);
        if (sku && !existing.sku) existing.sku = sku;
      } else {
        product.variants.set(optionValue, {
          optionValue,
          sku,
          stockQty: stock,
        });
      }
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
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function uniqueSlug(supabase, preferred) {
  let slug = preferred;
  for (let i = 0; i < 20; i += 1) {
    const { data, error } = await supabase
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return slug;
    slug = `${preferred}-${i + 2}`;
  }
  throw new Error(`Could not allocate unique slug for ${preferred}`);
}

async function createDraftProduct(supabase, product, nextSortOrder) {
  const slug = await uniqueSlug(supabase, slugifyHandle(product.handle));
  const variants = [...product.variants.values()];

  const { data: inserted, error } = await supabase
    .from("products")
    .insert({
      title: product.title,
      slug,
      description_html: "",
      product_type: "physical",
      status: "draft",
      seo_title: product.title,
      seo_description: null,
      shopify_handle: product.handle,
      sort_order: nextSortOrder,
    })
    .select("id")
    .single();
  if (error) throw new Error(`${product.handle}: ${error.message}`);

  const productId = inserted.id;
  // Set stock_qty directly (same approach as apply-shopify-inventory.mjs).
  // adjust_product_variant_stock requires an authenticated admin session.
  const variantRows = variants.map((variant, index) => ({
    product_id: productId,
    sku: variant.sku,
    option_name: product.optionName || "Size",
    option_value: variant.optionValue,
    price_pence: 0,
    currency: "GBP",
    track_inventory: true,
    stock_qty: variant.stockQty,
    stock_review_required: false,
    is_active: true,
    sort_order: index,
  }));

  const { data: insertedVariants, error: variantsError } = await supabase
    .from("product_variants")
    .insert(variantRows)
    .select("id, option_value, sort_order, stock_qty");
  if (variantsError) {
    await supabase.from("products").delete().eq("id", productId);
    throw new Error(`${product.handle} variants: ${variantsError.message}`);
  }

  const movementRows = (insertedVariants ?? [])
    .filter((row) => row.stock_qty > 0)
    .map((row) => ({
      variant_id: row.id,
      quantity_delta: row.stock_qty,
      resulting_quantity: row.stock_qty,
      movement_type: "initial_stock",
      note: "Initial stock from Shopify physical inventory import",
    }));

  if (movementRows.length) {
    const { error: movementError } = await supabase
      .from("inventory_movements")
      .insert(movementRows);
    if (movementError) {
      throw new Error(
        `${product.handle} inventory_movements: ${movementError.message}`
      );
    }
  }

  return { productId, slug, variantCount: variants.length };
}

async function main() {
  const csvPaths = collectCsvPaths();
  const rowsByFile = [];
  for (const path of csvPaths) {
    if (!existsSync(path)) throw new Error(`CSV not found: ${path}`);
    rowsByFile.push(await readInventoryCsv(path));
  }

  const inventory = aggregatePhysicalInventory(rowsByFile);
  const withStock = [...inventory.values()]
    .map((product) => {
      const totalStock = [...product.variants.values()].reduce(
        (sum, v) => sum + v.stockQty,
        0
      );
      return { ...product, totalStock };
    })
    .filter((product) => product.totalStock > 0)
    .sort((a, b) => a.handle.localeCompare(b.handle));

  const supabase = createSupabase();
  const { data: existingProducts, error: existingError } = await supabase
    .from("products")
    .select("id, shopify_handle, sort_order")
    .not("shopify_handle", "is", null);
  if (existingError) throw new Error(existingError.message);

  const existingHandles = new Set(
    (existingProducts ?? [])
      .map((p) => p.shopify_handle)
      .filter(Boolean)
  );

  const { data: maxSortRow, error: maxSortError } = await supabase
    .from("products")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (maxSortError) throw new Error(maxSortError.message);

  let nextSortOrder =
    typeof maxSortRow?.sort_order === "number" ? maxSortRow.sort_order + 1 : 0;

  console.log(`${apply ? "APPLY" : "DRY-RUN"} physical inventory drafts`);
  console.log(`CSVs: ${csvPaths.join(", ")}`);
  console.log(`Physical location: ${PHYSICAL_LOCATION}`);
  console.log(`POD locations skipped: ${[...POD_LOCATIONS].join(", ")}`);
  console.log(
    `In-stock physical products in CSV: ${withStock.length}; already in DB: ${
      withStock.filter((p) => existingHandles.has(p.handle)).length
    }`
  );
  console.log("");

  let created = 0;
  let skippedExisting = 0;

  for (const product of withStock) {
    const variantSummary = [...product.variants.values()]
      .map((v) => `${v.optionValue}=${v.stockQty}`)
      .join(", ");

    if (existingHandles.has(product.handle)) {
      skippedExisting += 1;
      console.log(
        `SKIP existing ${product.handle} — ${product.title} (total ${product.totalStock}: ${variantSummary})`
      );
      continue;
    }

    console.log(
      `${apply ? "CREATE" : "WOULD CREATE"} draft ${product.handle}`
    );
    console.log(`  title: ${product.title}`);
    console.log(`  option: ${product.optionName}`);
    console.log(`  stock: ${variantSummary} (total ${product.totalStock})`);
    console.log(`  price: £0.00 placeholder (set later)`);

    if (apply) {
      const result = await createDraftProduct(
        supabase,
        product,
        nextSortOrder
      );
      nextSortOrder += 1;
      created += 1;
      console.log(
        `  → id=${result.productId} slug=${result.slug} variants=${result.variantCount}`
      );
    }
  }

  console.log("\nSummary");
  console.log(`  create candidates : ${withStock.length - skippedExisting}`);
  console.log(`  skipped existing  : ${skippedExisting}`);
  console.log(`  created           : ${apply ? created : "(dry-run)"}`);
  if (!apply) {
    console.log("\nRe-run with --apply to write draft products.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
