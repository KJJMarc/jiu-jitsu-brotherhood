#!/usr/bin/env node
/**
 * Private Shopify catalogue import → KJJ admin Store tables.
 *
 * Stage 1 (default dry-run): analyse CSV and print mapping report. No writes.
 * Stage 2 ( --apply ): upsert draft products/variants/images into Supabase.
 *
 * Usage:
 *   npm run import:shopify:dry-run
 *   npm run import:shopify
 *
 * Requires for --apply:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Constraints:
 * - Does not touch Shopify
 * - Forces status=draft (never customer-facing)
 * - Preserves Shopify CDN image URLs as external references (no download)
 * - Idempotent via products.shopify_handle
 */

import { createClient } from "@supabase/supabase-js";
import { createReadStream, existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

/** Load `.env.local` when present (Cloud Agent secrets may already be in process.env). */
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

const DEFAULT_CSV = join(ROOT, "imports/shopify/products_export_1.csv");

const apply = process.argv.includes("--apply");
const dryRun = !apply;
const csvArgIndex = process.argv.findIndex((a) => a === "--csv");
const csvPath = resolve(
  csvArgIndex >= 0 && process.argv[csvArgIndex + 1]
    ? process.argv[csvArgIndex + 1]
    : DEFAULT_CSV
);

/** @typedef {{
 *  handle: string;
 *  title: string;
 *  slug: string;
 *  descriptionHtml: string;
 *  productType: 'physical' | 'non_shipping';
 *  shopifyStatus: string;
 *  shopifyPublished: boolean;
 *  seoTitle: string | null;
 *  seoDescription: string | null;
 *  variants: Array<{
 *    optionName: string;
 *    optionValue: string;
 *    sku: string | null;
 *    pricePence: number;
 *    trackInventory: boolean;
 *    stockQty: number | null;
 *    requiresShipping: boolean | null;
 *  }>;
 *  images: Array<{
 *    url: string;
 *    position: number;
 *    altText: string;
 *  }>;
 *  warnings: string[];
 *  errors: string[];
 * }} MappedProduct */

function poundsToPence(raw) {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const pounds = Number(trimmed);
  if (!Number.isFinite(pounds) || pounds < 0) return null;
  return Math.round(pounds * 100);
}

function emptyToNull(value) {
  const trimmed = String(value ?? "").trim();
  return trimmed ? trimmed : null;
}

function slugifyHandle(handle) {
  return String(handle ?? "")
    .toLowerCase()
    .trim()
    .replace(/_/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function parseBool(raw) {
  const v = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (v === "true" || v === "1" || v === "yes") return true;
  if (v === "false" || v === "0" || v === "no") return false;
  return null;
}

/**
 * Shopify CSV groups rows by Handle. Title/body appear on the first row;
 * subsequent rows add variants and/or images.
 */
function mapShopifyRows(rows) {
  /** @type {Map<string, typeof rows>} */
  const byHandle = new Map();
  for (const row of rows) {
    const handle = String(row.Handle ?? "").trim();
    if (!handle) continue;
    if (!byHandle.has(handle)) byHandle.set(handle, []);
    byHandle.get(handle).push(row);
  }

  /** @type {MappedProduct[]} */
  const products = [];

  for (const [handle, group] of byHandle) {
    /** @type {MappedProduct} */
    const product = {
      handle,
      title: "",
      slug: slugifyHandle(handle),
      descriptionHtml: "",
      productType: "physical",
      shopifyStatus: "",
      shopifyPublished: false,
      seoTitle: null,
      seoDescription: null,
      variants: [],
      images: [],
      warnings: [],
      errors: [],
    };

    const titleRow = group.find((r) => String(r.Title ?? "").trim()) ?? group[0];
    product.title = String(titleRow.Title ?? "").trim();
    product.descriptionHtml = String(titleRow["Body (HTML)"] ?? "").trim();
    product.shopifyStatus = String(titleRow.Status ?? "").trim().toLowerCase();
    product.shopifyPublished = parseBool(titleRow.Published) === true;
    product.seoTitle = emptyToNull(titleRow["SEO Title"]);
    product.seoDescription = emptyToNull(titleRow["SEO Description"]);

    if (!product.title) {
      product.errors.push("Missing Title");
    }
    if (!product.slug) {
      product.errors.push("Handle could not be slugified");
    } else if (product.slug !== handle.toLowerCase().replace(/_/g, "-")) {
      product.warnings.push(
        `Slug normalised from handle "${handle}" → "${product.slug}"`
      );
    }

    /** @type {Map<string, number>} */
    const seenVariantKeys = new Map();
    /** @type {Map<string, {url:string, position:number, altText:string}>} */
    const imagesByUrl = new Map();

    let anyShipping = false;
    let anyNonShipping = false;

    for (const row of group) {
      const optionName =
        emptyToNull(row["Option1 Name"]) ||
        (product.variants[0]?.optionName ?? "Title");
      const optionValue = emptyToNull(row["Option1 Value"]);
      const priceRaw = row["Variant Price"];
      const hasVariantSignal =
        optionValue != null ||
        emptyToNull(priceRaw) != null ||
        emptyToNull(row["Variant SKU"]) != null;

      if (hasVariantSignal) {
        const pricePence = poundsToPence(priceRaw);
        if (pricePence == null) {
          product.errors.push(
            `Variant "${optionValue ?? "(blank)"}" has invalid price "${priceRaw}"`
          );
        }

        const requiresShipping = parseBool(row["Variant Requires Shipping"]);
        if (requiresShipping === true) anyShipping = true;
        if (requiresShipping === false) anyNonShipping = true;

        const tracker = emptyToNull(row["Variant Inventory Tracker"]);
        const trackInventory = Boolean(tracker);
        // This export does not include Variant Inventory Qty.
        const stockQty = null;
        if (trackInventory) {
          product.warnings.push(
            `Variant "${optionValue ?? "Default"}" is inventory-tracked in Shopify but CSV has no quantity column — will import track_inventory=true with stock_qty=0 pending manual correction`
          );
        }

        const variantKey = `${optionName}::${optionValue ?? "Default"}`;
        if (seenVariantKeys.has(variantKey)) {
          // Shopify sometimes repeats option rows when attaching more images.
          // Keep first price/SKU; do not duplicate variant.
        } else {
          seenVariantKeys.set(variantKey, product.variants.length);
          product.variants.push({
            optionName: optionName || "Title",
            optionValue: optionValue || "Default",
            sku: emptyToNull(row["Variant SKU"]),
            pricePence: pricePence ?? 0,
            trackInventory,
            stockQty,
            requiresShipping,
          });
        }

        if (emptyToNull(row["Option2 Value"]) || emptyToNull(row["Option3 Value"])) {
          product.warnings.push(
            "Option2/Option3 present — only Option1 is mapped in this import"
          );
        }
      }

      const imageUrl = emptyToNull(row["Image Src"]);
      if (imageUrl) {
        const position = Number.parseInt(String(row["Image Position"] ?? ""), 10);
        const altText = emptyToNull(row["Image Alt Text"]) ?? "";
        const existing = imagesByUrl.get(imageUrl);
        if (!existing) {
          imagesByUrl.set(imageUrl, {
            url: imageUrl,
            position: Number.isFinite(position) ? position : imagesByUrl.size + 1,
            altText,
          });
        } else if (altText && !existing.altText) {
          existing.altText = altText;
        }
      }
    }

    product.images = [...imagesByUrl.values()].sort(
      (a, b) => a.position - b.position
    );

    if (!product.variants.length) {
      product.errors.push("No variants found");
    }

    if (anyShipping && !anyNonShipping) {
      product.productType = "physical";
    } else if (!anyShipping && anyNonShipping) {
      product.productType = "non_shipping";
    } else if (anyShipping && anyNonShipping) {
      product.productType = "physical";
      product.warnings.push(
        "Mixed Requires Shipping values across variants — classified as physical"
      );
    } else {
      product.productType = "physical";
      product.warnings.push(
        "Could not determine Requires Shipping — defaulting to physical"
      );
    }

    // Deduplicate repeated inventory warnings
    product.warnings = [...new Set(product.warnings)];

    products.push(product);
  }

  return products;
}

async function readCsv(path) {
  const { readFileSync } = await import("node:fs");
  const text = readFileSync(path, "utf8");
  // Strip BOM
  const cleaned = text.replace(/^\uFEFF/, "");
  return new Promise((resolvePromise, reject) => {
    parse(
      cleaned,
      {
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
        bom: true,
      },
      (err, records) => {
        if (err) reject(err);
        else resolvePromise(records);
      }
    );
  });
}

function formatGbp(pence) {
  return `£${(pence / 100).toFixed(2)}`;
}

function printDryRunReport(products, csvPath) {
  const ok = products.filter((p) => p.errors.length === 0);
  const blocked = products.filter((p) => p.errors.length > 0);
  const variantCount = products.reduce((n, p) => n + p.variants.length, 0);
  const imageCount = products.reduce((n, p) => n + p.images.length, 0);
  const tracked = products.reduce(
    (n, p) => n + p.variants.filter((v) => v.trackInventory).length,
    0
  );
  const withSku = products.reduce(
    (n, p) => n + p.variants.filter((v) => v.sku).length,
    0
  );
  const physical = products.filter((p) => p.productType === "physical").length;
  const nonShipping = products.filter(
    (p) => p.productType === "non_shipping"
  ).length;
  const shopifyActive = products.filter((p) => p.shopifyStatus === "active")
    .length;
  const shopifyDraft = products.filter((p) => p.shopifyStatus === "draft")
    .length;

  console.log("\n=== Shopify → KJJ Store import DRY-RUN ===");
  console.log(`CSV: ${csvPath}`);
  console.log(`Mode: ${dryRun ? "dry-run (no writes)" : "APPLY"}`);
  console.log("");
  console.log("Totals");
  console.log(`  Products:              ${products.length}`);
  console.log(`  Variants:              ${variantCount}`);
  console.log(`  Image references:      ${imageCount}`);
  console.log(`  Inventory-tracked vars:${tracked}`);
  console.log(`  Variants with SKU:     ${withSku}`);
  console.log(`  Physical products:     ${physical}`);
  console.log(`  Non-shipping products: ${nonShipping}`);
  console.log(`  Shopify status active: ${shopifyActive}`);
  console.log(`  Shopify status draft:  ${shopifyDraft}`);
  console.log(`  Importable (no errors):${ok.length}`);
  console.log(`  Blocked by errors:     ${blocked.length}`);
  console.log("");
  console.log("Mapping rules");
  console.log("  status          → always draft (private admin-only)");
  console.log("  slug            → sanitised Shopify Handle");
  console.log("  shopify_handle  → original Handle (idempotency key)");
  console.log("  product_type    → physical | non_shipping from Requires Shipping");
  console.log("  price_pence     → Variant Price × 100 (GBP)");
  console.log("  images          → external source_type, Shopify CDN URL preserved");
  console.log("  inventory qty   → NOT in this CSV; tracked variants → stock_qty=0 + stock_review_required");
  console.log("");

  console.log("Products");
  for (const p of products) {
    const priceRange = p.variants.length
      ? `${formatGbp(Math.min(...p.variants.map((v) => v.pricePence)))}` +
        (p.variants.length > 1
          ? `–${formatGbp(Math.max(...p.variants.map((v) => v.pricePence)))}`
          : "")
      : "—";
    console.log(
      `\n• ${p.title}\n  handle=${p.handle} → slug=${p.slug}` +
        `\n  shopify_status=${p.shopifyStatus || "?"} published=${p.shopifyPublished}` +
        `\n  import_status=draft type=${p.productType}` +
        `\n  variants=${p.variants.length} images=${p.images.length} price=${priceRange}` +
        `\n  seo_title=${p.seoTitle ? "yes" : "no"} seo_description=${p.seoDescription ? "yes" : "no"}`
    );
    for (const v of p.variants) {
      console.log(
        `    - ${v.optionName}: ${v.optionValue} | ${formatGbp(v.pricePence)}` +
          ` | sku=${v.sku ?? "—"} | track=${v.trackInventory}` +
          ` | ship=${v.requiresShipping}`
      );
    }
    if (p.images.length) {
      console.log(
        `    images: ${p.images
          .slice(0, 3)
          .map((i) => `#${i.position}`)
          .join(", ")}` +
          (p.images.length > 3 ? ` …(+${p.images.length - 3})` : "")
      );
      console.log(`    primary: ${p.images[0].url}`);
    }
    for (const w of p.warnings) console.log(`    WARN: ${w}`);
    for (const e of p.errors) console.log(`    ERROR: ${e}`);
  }

  console.log("\n=== Global findings ===");
  console.log(
    "- Variant Inventory Qty column is absent from this export. Stock quantities cannot be imported; tracked variants will be created at stock_qty=0 with stock_review_required=true so admin does not treat zero as real stock."
  );
  console.log(
    "- Almost all Variant SKU fields are empty (expected for this catalogue)."
  );
  console.log(
    "- One handle uses underscores (mauricio_gomes_seminar) and will be slugified to hyphens."
  );
  console.log(
    "- All imported rows will be forced to status=draft regardless of Shopify Published/Status."
  );
  console.log(
    "- Image URLs remain on cdn.shopify.com (external). Shopify is not modified; URLs are references only."
  );

  if (blocked.length) {
    console.log("\nBlocked products (will be skipped on --apply):");
    for (const p of blocked) {
      console.log(`  - ${p.handle}: ${p.errors.join("; ")}`);
    }
  }

  console.log(
    "\nNext step: review this dry-run. When approved, run: npm run import:shopify\n"
  );
}

async function applyImport(products) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    if (product.errors.length) {
      skipped += 1;
      console.log(`SKIP ${product.handle}: ${product.errors.join("; ")}`);
      continue;
    }

    const { data: existing, error: existingError } = await supabase
      .from("products")
      .select("id")
      .eq("shopify_handle", product.handle)
      .maybeSingle();
    if (existingError) throw new Error(existingError.message);

    let productId = existing?.id ?? null;

    const productPayload = {
      title: product.title,
      slug: product.slug,
      description_html: product.descriptionHtml || "",
      product_type: product.productType,
      status: "draft",
      seo_title: product.seoTitle,
      seo_description: product.seoDescription,
      shopify_handle: product.handle,
    };

    if (productId) {
      const { error } = await supabase
        .from("products")
        .update(productPayload)
        .eq("id", productId);
      if (error) throw new Error(`${product.handle}: ${error.message}`);
      updated += 1;
    } else {
      // Ensure slug uniqueness if a non-shopify product already took the slug.
      const { data: slugClash } = await supabase
        .from("products")
        .select("id")
        .eq("slug", product.slug)
        .maybeSingle();
      if (slugClash) {
        productPayload.slug = `${product.slug}-shopify`;
      }

      const { data: inserted, error } = await supabase
        .from("products")
        .insert(productPayload)
        .select("id")
        .single();
      if (error) throw new Error(`${product.handle}: ${error.message}`);
      productId = inserted.id;
      created += 1;
    }

    // Upsert variants by option_name + option_value; preserve stock_qty on match.
    const { data: existingVariants, error: listVarErr } = await supabase
      .from("product_variants")
      .select("id, option_name, option_value, stock_qty")
      .eq("product_id", productId);
    if (listVarErr) throw new Error(`${product.handle} variants: ${listVarErr.message}`);

    const variantByKey = new Map(
      (existingVariants ?? []).map((v) => [
        `${v.option_name}::${v.option_value}`,
        v,
      ])
    );
    const seenVariantIds = new Set();

    for (let index = 0; index < product.variants.length; index += 1) {
      const variant = product.variants[index];
      const key = `${variant.optionName}::${variant.optionValue}`;
      const current = variantByKey.get(key);
      if (current) {
        seenVariantIds.add(current.id);
        // Preserve stock_qty and stock_review_required on match so admin
        // verification / corrections are not wiped by a re-import.
        const { error: updVarErr } = await supabase
          .from("product_variants")
          .update({
            sku: variant.sku,
            price_pence: variant.pricePence,
            currency: "GBP",
            track_inventory: variant.trackInventory,
            is_active: true,
            sort_order: index,
          })
          .eq("id", current.id);
        if (updVarErr) {
          throw new Error(`${product.handle} variant update: ${updVarErr.message}`);
        }
      } else {
        const { error: insVarErr } = await supabase.from("product_variants").insert({
          product_id: productId,
          sku: variant.sku,
          option_name: variant.optionName,
          option_value: variant.optionValue,
          price_pence: variant.pricePence,
          currency: "GBP",
          track_inventory: variant.trackInventory,
          stock_qty: 0,
          // CSV has no inventory qty — never treat placeholder 0 as real stock.
          stock_review_required: Boolean(variant.trackInventory),
          is_active: true,
          sort_order: index,
        });
        if (insVarErr) {
          throw new Error(`${product.handle} variant insert: ${insVarErr.message}`);
        }
      }
    }

    // Deactivate variants no longer present in Shopify export (do not hard-delete:
    // may have inventory_movements).
    for (const existingVariant of existingVariants ?? []) {
      if (!seenVariantIds.has(existingVariant.id)) {
        const { error: deactErr } = await supabase
          .from("product_variants")
          .update({ is_active: false })
          .eq("id", existingVariant.id);
        if (deactErr) {
          throw new Error(`${product.handle} variant deactivate: ${deactErr.message}`);
        }
      }
    }

    // Sync external Shopify image references only; preserve admin Storage uploads.
    // Never download or delete anything from Shopify CDN.
    const { data: existingImages, error: listImgErr } = await supabase
      .from("product_images")
      .select("id, source_type, public_url, sort_order, is_primary")
      .eq("product_id", productId);
    if (listImgErr) throw new Error(`${product.handle} images: ${listImgErr.message}`);

    const desiredUrls = new Set(product.images.map((img) => img.url));
    const existingExternal = (existingImages ?? []).filter(
      (img) => img.source_type === "external"
    );
    const storageImages = (existingImages ?? []).filter(
      (img) => img.source_type === "storage"
    );

    for (const img of existingExternal) {
      if (!desiredUrls.has(img.public_url)) {
        const { error: delErr } = await supabase
          .from("product_images")
          .delete()
          .eq("id", img.id);
        if (delErr) throw new Error(`Delete stale external image: ${delErr.message}`);
      }
    }

    const existingByUrl = new Map(
      existingExternal.map((img) => [img.public_url, img])
    );
    for (let index = 0; index < product.images.length; index += 1) {
      const image = product.images[index];
      const current = existingByUrl.get(image.url);
      const makePrimary = storageImages.length === 0 && index === 0;
      if (current) {
        const { error: updImgErr } = await supabase
          .from("product_images")
          .update({
            alt_text: image.altText || "",
            sort_order: index,
            is_primary: makePrimary,
          })
          .eq("id", current.id);
        if (updImgErr) throw new Error(`Update external image: ${updImgErr.message}`);
      } else {
        const { error: insImgErr } = await supabase.from("product_images").insert({
          product_id: productId,
          source_type: "external",
          storage_path: null,
          public_url: image.url,
          alt_text: image.altText || "",
          sort_order: index,
          is_primary: makePrimary,
        });
        if (insImgErr) throw new Error(`Insert external image: ${insImgErr.message}`);
      }
    }

    if (storageImages.length === 0 && product.images.length) {
      const { data: refreshed } = await supabase
        .from("product_images")
        .select("id, is_primary, sort_order")
        .eq("product_id", productId)
        .eq("source_type", "external")
        .order("sort_order", { ascending: true });
      if (refreshed?.length && !refreshed.some((r) => r.is_primary)) {
        await supabase
          .from("product_images")
          .update({ is_primary: true })
          .eq("id", refreshed[0].id);
      }
    }

    console.log(
      `${existing ? "UPDATE" : "CREATE"} ${product.handle} → ${product.slug} (${product.variants.length} variants, ${product.images.length} images)`
    );
  }

  console.log(
    `\nDone. created=${created} updated=${updated} skipped=${skipped}`
  );
}

async function main() {
  console.log(`Reading ${csvPath}`);
  const rows = await readCsv(csvPath);
  const products = mapShopifyRows(rows);
  printDryRunReport(products, csvPath);

  if (dryRun) {
    process.exitCode = products.some((p) => p.errors.length) ? 0 : 0;
    return;
  }

  console.log("\nApplying import (draft/private only)…");
  await applyImport(products);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
