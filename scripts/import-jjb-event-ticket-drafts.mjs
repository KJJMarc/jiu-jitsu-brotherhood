#!/usr/bin/env node
/**
 * Import the three Stage-4 event ticket products as unpublished admin drafts.
 *
 * Handles:
 *   - summer-super-seminar-2025
 *   - jiu-jitsu-brotherhood-club-network-adults-competition
 *   - kids-club-network-interclub-competition-2026
 *
 * - Forces status=draft (never publishes / never catalogue-visible)
 * - Forces product_type=non_shipping
 * - Reads Shopify GraphQL audit products.json
 * - External CDN image URLs only (no download)
 * - Idempotent via products.shopify_handle
 *
 * Usage:
 *   node --env-file=.env.local scripts/import-jjb-event-ticket-drafts.mjs
 *   node --env-file=.env.local scripts/import-jjb-event-ticket-drafts.mjs --apply
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

/** The three event tickets from Shopify (screenshots / Stage 4 drafts). */
const TICKET_HANDLES = [
  "summer-super-seminar-2025",
  "jiu-jitsu-brotherhood-club-network-adults-competition",
  "kids-club-network-interclub-competition-2026",
];

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
  throw new Error(
    "No products.json found under imports/shopify/private/jjb-shopify-audit-*/",
  );
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
  const variants = nodes(raw.variants).map((v, index) => {
    const option = (v.selectedOptions && v.selectedOptions[0]) || {};
    const optionName = String(option.name || "Title").trim() || "Title";
    const optionValue = String(
      option.value || v.title || "Default Title",
    ).trim();
    const pricePence = poundsToPence(v.price);
    const tracked = v.inventoryItem?.tracked === true;
    const rawQty = Number(v.inventoryQuantity);
    const stockQty = Number.isFinite(rawQty)
      ? Math.max(0, Math.trunc(rawQty))
      : 0;
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
    nodes(raw.metafields).find(
      (m) => m.namespace === "global" && m.key === "title_tag",
    )?.value ||
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
    totalInventory: variants.reduce((sum, v) => sum + v.stockQty, 0),
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
      product_type: "non_shipping",
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
        stock_review_required: true,
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
          throw new Error(
            `${product.handle} variant update: ${updVarErr.message}`,
          );
        }
      } else {
        const { error: insVarErr } = await supabase
          .from("product_variants")
          .insert({
            product_id: productId,
            ...payload,
          });
        if (insVarErr) {
          throw new Error(
            `${product.handle} variant insert: ${insVarErr.message}`,
          );
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
          throw new Error(
            `${product.handle} variant deactivate: ${deactErr.message}`,
          );
        }
      }
    }

    const { data: existingImages, error: listImgErr } = await supabase
      .from("product_images")
      .select("id, source_type, public_url")
      .eq("product_id", productId);
    if (listImgErr) {
      throw new Error(`${product.handle} images: ${listImgErr.message}`);
    }

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
        if (delErr) {
          throw new Error(`Delete stale external image: ${delErr.message}`);
        }
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
        if (updImgErr) {
          throw new Error(`Update external image: ${updImgErr.message}`);
        }
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
        if (insImgErr) {
          throw new Error(`Insert external image: ${insImgErr.message}`);
        }
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
  const missing = TICKET_HANDLES.filter((h) => !byHandle.has(h));
  if (missing.length) {
    throw new Error(`Missing ticket handles in audit: ${missing.join(", ")}`);
  }

  const products = TICKET_HANDLES.map((handle) =>
    mapProduct(byHandle.get(handle)),
  );

  console.log("\n=== Event ticket draft import plan ===");
  for (const p of products) {
    console.log(
      `  ${p.handle}: £${((p.variants[0]?.pricePence ?? 0) / 100).toFixed(2)} · ${p.variants.length} var · ${p.images.length} img · stock ${p.totalInventory}${p.errors.length ? " ERROR " + p.errors.join("; ") : ""}`,
    );
  }
  console.log(
    "\nAll will be status=draft, product_type=non_shipping (admin-only drafts).",
  );

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
  const host = new URL(url).hostname;
  if (!host.startsWith("ftdrmuggvejpbkybpwgt")) {
    throw new Error(`Refusing to write to unexpected Supabase host: ${host}`);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log("\nApplying import (draft/private only)…");
  await applyImport(products, supabase);

  const { data: verify, error } = await supabase
    .from("products")
    .select(
      "id, title, shopify_handle, slug, status, product_type, product_variants(id, price_pence, stock_qty, track_inventory, is_active), product_images(id)",
    )
    .in("shopify_handle", TICKET_HANDLES);
  if (error) throw new Error(error.message);

  console.log("\n=== Post-import verify ===");
  for (const row of verify ?? []) {
    const vars = (row.product_variants ?? []).filter((v) => v.is_active);
    console.log(
      `  ${row.shopify_handle}: status=${row.status} type=${row.product_type} vars=${vars.length} imgs=${(row.product_images ?? []).length} id=${row.id}`,
    );
  }
  if ((verify ?? []).length !== TICKET_HANDLES.length) {
    throw new Error(
      `Expected ${TICKET_HANDLES.length} ticket drafts, found ${(verify ?? []).length}`,
    );
  }
  for (const row of verify ?? []) {
    if (row.status !== "draft" || row.product_type !== "non_shipping") {
      throw new Error(
        `${row.shopify_handle}: expected draft/non_shipping, got ${row.status}/${row.product_type}`,
      );
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
