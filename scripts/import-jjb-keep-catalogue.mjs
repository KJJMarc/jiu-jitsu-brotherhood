#!/usr/bin/env node
/**
 * Import the 26 Stage-4 KEEP physical JJB products from the Shopify GraphQL audit.
 *
 * - Reads the Shopify GraphQL audit products.json under imports/shopify/private/
 * - Imports only the 26 approved physical KEEP handles
 * - Forces status=draft (never publishes)
 * - Skips event/competition tickets and removed products
 * - Imports provisional Shopify inventoryQuantity + stock_review_required=true
 * - Forces enso-4-0-gi-blue to zero stock
 * - Preserves shopify_handle / slug for /products/{handle} canonicals
 * - External Shopify CDN image URLs only (no download)
 *
 * Usage:
 *   node --env-file=.env.local scripts/import-jjb-keep-catalogue.mjs
 *   node --env-file=.env.local scripts/import-jjb-keep-catalogue.mjs --apply
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
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

/** Stage 4 KEEP physical products (26). Event tickets intentionally excluded. */
const KEEP_HANDLES = [
  "classic-embroidered-badge",
  "beast-mode-rashguard",
  "face-your-fears-rashguard",
  "fight-shorts",
  "history-on-fire-t-shirt",
  "signature-series-hooded-sweatshirt",
  "open-source-jiu-jitsu-hooded-sweatshirt-gray",
  "open-source-jiu-jitsu-hooded-sweatshirt-red",
  "sisterhood-mini-patch",
  "stand-up-eight-t-shirt-black",
  "sisterhood-rashguard",
  "tail-eater-back-patch",
  "tail-eater-rashguard-blue-trim",
  "the-oni-gi",
  "the-tokugawa-gi",
  "the-musashi-spats",
  "the-gentle-art-rashguard",
  "journey-bjj-belt",
  "future-stars-gi-blue",
  "evolver-classic",
  "tail-eater-rashguard-classic-black",
  "evolver-classic-red",
  "enso-4-0-gi-blue",
  "enso-4-0-gi-white",
  "astrum-gi",
  "enso-4-0-gi-black",
];

/** Expected variant counts from Stage 4 (sanity check). */
const EXPECTED_VARIANT_COUNTS = {
  "classic-embroidered-badge": 1,
  "beast-mode-rashguard": 5,
  "face-your-fears-rashguard": 5,
  "fight-shorts": 5,
  "history-on-fire-t-shirt": 5,
  "signature-series-hooded-sweatshirt": 5,
  "open-source-jiu-jitsu-hooded-sweatshirt-gray": 5,
  "open-source-jiu-jitsu-hooded-sweatshirt-red": 5,
  "sisterhood-mini-patch": 1,
  "stand-up-eight-t-shirt-black": 5,
  "sisterhood-rashguard": 5,
  "tail-eater-back-patch": 1,
  "tail-eater-rashguard-blue-trim": 4,
  "the-oni-gi": 4,
  "the-tokugawa-gi": 5,
  "the-musashi-spats": 5,
  "the-gentle-art-rashguard": 6,
  "journey-bjj-belt": 20,
  "future-stars-gi-blue": 6,
  "evolver-classic": 5,
  "tail-eater-rashguard-classic-black": 5,
  "evolver-classic-red": 5,
  "enso-4-0-gi-blue": 5,
  "enso-4-0-gi-white": 5,
  "astrum-gi": 5,
  "enso-4-0-gi-black": 5,
};

const ZERO_STOCK_HANDLES = new Set(["enso-4-0-gi-blue"]);

const EXCLUDED_TICKET_HANDLES = new Set([
  "summer-super-seminar-2025",
  "2nd-summer-seaside-special-super-seminar",
  "jiu-jitsu-brotherhood-club-network-adults-competition",
  "kids-club-network-interclub-competition-2026",
]);

function findProductsJson() {
  const privateDir = join(ROOT, "imports/shopify/private");
  if (!existsSync(privateDir)) {
    throw new Error(`Missing ${privateDir}`);
  }
  const dirs = readdirSync(privateDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith("jjb-shopify-audit-"))
    .map((d) => d.name)
    .sort();
  for (const dir of dirs.reverse()) {
    const path = join(privateDir, dir, "products.json");
    if (existsSync(path)) return path;
  }
  throw new Error("No products.json found under imports/shopify/private/jjb-shopify-audit-*/");
}

function poundsToPence(raw) {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const pounds = Number(trimmed);
  if (!Number.isFinite(pounds) || pounds < 0) return null;
  return Math.round(pounds * 100);
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

function nodes(value) {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.nodes)) return value.nodes;
  return [];
}

function mapProduct(raw) {
  const handle = String(raw.handle ?? "").trim();
  const slug = slugifyHandle(handle);
  const forceZero = ZERO_STOCK_HANDLES.has(handle);
  const variants = nodes(raw.variants).map((v, index) => {
    const option = (v.selectedOptions && v.selectedOptions[0]) || {};
    const optionName = String(option.name || "Title").trim() || "Title";
    const optionValue = String(option.value || v.title || "Default Title").trim();
    const pricePence = poundsToPence(v.price);
    const tracked = v.inventoryItem?.tracked !== false;
    let stockQty = Number.isFinite(Number(v.inventoryQuantity))
      ? Math.max(0, Math.trunc(Number(v.inventoryQuantity)))
      : 0;
    if (forceZero) stockQty = 0;
    const sku = String(v.sku ?? "").trim() || null;
    return {
      optionName,
      optionValue,
      sku,
      pricePence,
      trackInventory: tracked,
      stockQty,
      sortOrder: index,
    };
  });

  const images = [];
  const seenUrls = new Set();
  for (const media of nodes(raw.media)) {
    const url = media?.image?.url || media?.preview?.image?.url;
    if (!url || seenUrls.has(url)) continue;
    seenUrls.add(url);
    images.push({
      url,
      altText: String(media.alt || media.image?.altText || "").trim(),
      position: images.length,
    });
  }

  const seoTitle =
    (raw.seo && String(raw.seo.title || "").trim()) ||
    nodes(raw.metafields).find((m) => m.namespace === "global" && m.key === "title_tag")
      ?.value ||
    null;
  const seoDescription =
    (raw.seo && String(raw.seo.description || "").trim()) ||
    nodes(raw.metafields).find(
      (m) => m.namespace === "global" && m.key === "description_tag",
    )?.value ||
    null;

  const errors = [];
  if (!handle) errors.push("Missing handle");
  if (!raw.title) errors.push("Missing title");
  if (!slug) errors.push("Could not slugify handle");
  if (!variants.length) errors.push("No variants");
  for (const v of variants) {
    if (v.pricePence == null) errors.push(`Variant ${v.optionValue}: bad price`);
  }

  return {
    handle,
    title: String(raw.title ?? "").trim(),
    slug,
    descriptionHtml: String(raw.descriptionHtml ?? "").trim(),
    seoTitle: seoTitle ? String(seoTitle).trim() : null,
    seoDescription: seoDescription ? String(seoDescription).trim() : null,
    variants,
    images,
    errors,
    expectedVariants: EXPECTED_VARIANT_COUNTS[handle] ?? null,
    totalInventory: forceZero
      ? 0
      : variants.reduce((sum, v) => sum + v.stockQty, 0),
  };
}

async function applyImport(products, supabase) {
  let created = 0;
  let updated = 0;

  for (const product of products) {
    if (product.errors.length) {
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
      product_type: "physical",
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
      const { data: slugClash } = await supabase
        .from("products")
        .select("id")
        .eq("slug", product.slug)
        .maybeSingle();
      if (slugClash) {
        throw new Error(
          `${product.handle}: slug "${product.slug}" already taken by another product`,
        );
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

    const { data: existingVariants, error: listVarErr } = await supabase
      .from("product_variants")
      .select("id, option_name, option_value")
      .eq("product_id", productId);
    if (listVarErr) {
      throw new Error(`${product.handle} variants: ${listVarErr.message}`);
    }

    const variantByKey = new Map(
      (existingVariants ?? []).map((v) => [
        `${v.option_name}::${v.option_value}`,
        v,
      ]),
    );
    const seenVariantIds = new Set();

    for (const variant of product.variants) {
      const key = `${variant.optionName}::${variant.optionValue}`;
      const current = variantByKey.get(key);
      const payload = {
        sku: variant.sku,
        option_name: variant.optionName,
        option_value: variant.optionValue,
        price_pence: variant.pricePence,
        currency: "GBP",
        track_inventory: variant.trackInventory,
        stock_qty: variant.stockQty,
        stock_review_required: Boolean(variant.trackInventory),
        is_active: true,
        sort_order: variant.sortOrder,
      };
      if (current) {
        seenVariantIds.add(current.id);
        const { error: updVarErr } = await supabase
          .from("product_variants")
          .update(payload)
          .eq("id", current.id);
        if (updVarErr) {
          throw new Error(`${product.handle} variant update: ${updVarErr.message}`);
        }
      } else {
        const { error: insVarErr } = await supabase.from("product_variants").insert({
          product_id: productId,
          ...payload,
        });
        if (insVarErr) {
          throw new Error(`${product.handle} variant insert: ${insVarErr.message}`);
        }
      }
    }

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

    const { data: existingImages, error: listImgErr } = await supabase
      .from("product_images")
      .select("id, source_type, public_url")
      .eq("product_id", productId);
    if (listImgErr) throw new Error(`${product.handle} images: ${listImgErr.message}`);

    const desiredUrls = new Set(product.images.map((img) => img.url));
    const existingExternal = (existingImages ?? []).filter(
      (img) => img.source_type === "external",
    );
    const storageImages = (existingImages ?? []).filter(
      (img) => img.source_type === "storage",
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
      existingExternal.map((img) => [img.public_url, img]),
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

    console.log(
      `${existing ? "UPDATE" : "CREATE"} ${product.handle} → /products/${product.slug} (${product.variants.length} variants, ${product.images.length} images, stock=${product.totalInventory})`,
    );
  }

  console.log(`\nDone. created=${created} updated=${updated}`);
}

async function main() {
  const jsonPath = findProductsJson();
  console.log(`Reading ${jsonPath}`);
  const rawProducts = JSON.parse(readFileSync(jsonPath, "utf8"));
  if (!Array.isArray(rawProducts)) {
    throw new Error("products.json must be an array");
  }

  const byHandle = new Map(rawProducts.map((p) => [p.handle, p]));
  const keepSet = new Set(KEEP_HANDLES);

  for (const handle of EXCLUDED_TICKET_HANDLES) {
    if (byHandle.has(handle)) {
      console.log(`EXCLUDE ticket (not imported): ${handle}`);
    }
  }

  const missing = KEEP_HANDLES.filter((h) => !byHandle.has(h));
  if (missing.length) {
    throw new Error(`Missing KEEP handles in audit: ${missing.join(", ")}`);
  }

  const products = KEEP_HANDLES.map((handle) => mapProduct(byHandle.get(handle)));

  console.log("\n=== KEEP physical import plan (draft only) ===");
  let variantTotal = 0;
  let imageTotal = 0;
  for (const p of products) {
    variantTotal += p.variants.length;
    imageTotal += p.images.length;
    const expected = p.expectedVariants;
    const countNote =
      expected != null && expected !== p.variants.length
        ? ` ⚠ expected ${expected} variants`
        : "";
    console.log(
      `  ${p.handle}: £${((p.variants[0]?.pricePence ?? 0) / 100).toFixed(2)} · ${p.variants.length} vars · ${p.images.length} imgs · stock ${p.totalInventory}${countNote}${p.errors.length ? " ERROR " + p.errors.join("; ") : ""}`,
    );
  }
  console.log(
    `\nTotals: ${products.length} products, ${variantTotal} variants, ${imageTotal} images`,
  );
  console.log("All will be status=draft. Event tickets are not imported.");

  if (!apply) {
    console.log("\nDry-run only. Re-run with --apply to write.");
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log("\nApplying import (draft/private only)…");
  await applyImport(products, supabase);

  // Post-verify: no tickets, 26 drafts, enso blue zero
  const { data: all, error } = await supabase
    .from("products")
    .select(
      "shopify_handle, status, slug, product_variants(id, stock_qty, price_pence, is_active), product_images(id)",
    )
    .in("shopify_handle", KEEP_HANDLES);
  if (error) throw new Error(error.message);

  const ticketCheck = await supabase
    .from("products")
    .select("shopify_handle")
    .in("shopify_handle", [...EXCLUDED_TICKET_HANDLES]);
  if (ticketCheck.error) throw new Error(ticketCheck.error.message);

  console.log("\n=== Post-import verify ===");
  console.log(`KEEP products in DB: ${(all ?? []).length}`);
  console.log(
    `Ticket products in DB (should be 0): ${(ticketCheck.data ?? []).length}`,
  );
  for (const row of all ?? []) {
    const vars = (row.product_variants ?? []).filter((v) => v.is_active);
    const stock = vars.reduce((s, v) => s + (v.stock_qty ?? 0), 0);
    console.log(
      `  ${row.shopify_handle}: status=${row.status} slug=${row.slug} vars=${vars.length} imgs=${(row.product_images ?? []).length} stock=${stock}`,
    );
  }
  const blue = (all ?? []).find((p) => p.shopify_handle === "enso-4-0-gi-blue");
  if (blue) {
    const stock = (blue.product_variants ?? []).reduce(
      (s, v) => s + (v.stock_qty ?? 0),
      0,
    );
    console.log(`enso-4-0-gi-blue stock total=${stock} (expect 0)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
