#!/usr/bin/env node
/**
 * Seed specific physical draft products that are not present in Shopify
 * inventory exports (manual catalogue additions for admin store).
 *
 * Usage:
 *   node scripts/seed-manual-physical-drafts.mjs
 *   node scripts/seed-manual-physical-drafts.mjs --apply
 *
 * Requires for --apply:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
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

/** Manual physical drafts requested for admin store setup. */
const PRODUCTS = [
  {
    title: "Mauricio Gomes Signature Gi",
    handle: "mauricio-gomes-signature-gi",
    optionName: "Size",
    variants: ["A0", "A1", "A2", "A3", "A4"],
  },
  {
    title: "Legacy Mini Badge",
    handle: "legacy-mini-badge",
    optionName: "Title",
    variants: ["Default Title"],
  },
  {
    title: "Legacy Rashguard 2.0",
    handle: "legacy-rashguard-2-0",
    optionName: "Size",
    variants: ["Small", "Medium", "Large", "XL", "XXL"],
  },
];

function slugifyHandle(handle) {
  return String(handle)
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
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

async function createDraft(supabase, product, sortOrder) {
  const slug = await uniqueSlug(supabase, slugifyHandle(product.handle));
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
      sort_order: sortOrder,
    })
    .select("id")
    .single();
  if (error) throw new Error(`${product.handle}: ${error.message}`);

  const variantRows = product.variants.map((optionValue, index) => ({
    product_id: inserted.id,
    sku: null,
    option_name: product.optionName,
    option_value: optionValue,
    price_pence: 0,
    currency: "GBP",
    track_inventory: true,
    stock_qty: 0,
    stock_review_required: true,
    is_active: true,
    sort_order: index,
  }));

  const { error: variantsError } = await supabase
    .from("product_variants")
    .insert(variantRows);
  if (variantsError) {
    await supabase.from("products").delete().eq("id", inserted.id);
    throw new Error(`${product.handle} variants: ${variantsError.message}`);
  }

  return { productId: inserted.id, slug };
}

async function main() {
  const supabase = createSupabase();
  const handles = PRODUCTS.map((p) => p.handle);

  const { data: existing, error: existingError } = await supabase
    .from("products")
    .select("id, shopify_handle, title, status")
    .in("shopify_handle", handles);
  if (existingError) throw new Error(existingError.message);

  const existingByHandle = new Map(
    (existing ?? []).map((row) => [row.shopify_handle, row])
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

  console.log(`${apply ? "APPLY" : "DRY-RUN"} manual physical drafts`);
  console.log("");

  let created = 0;
  let skipped = 0;

  for (const product of PRODUCTS) {
    const found = existingByHandle.get(product.handle);
    if (found) {
      skipped += 1;
      console.log(
        `SKIP existing ${product.handle} — ${found.title} [${found.status}]`
      );
      continue;
    }

    console.log(
      `${apply ? "CREATE" : "WOULD CREATE"} draft ${product.handle}`
    );
    console.log(`  title: ${product.title}`);
    console.log(
      `  sizes: ${product.variants.join(", ")} (stock 0 — set later)`
    );

    if (apply) {
      const result = await createDraft(supabase, product, nextSortOrder);
      nextSortOrder += 1;
      created += 1;
      console.log(`  → id=${result.productId} slug=${result.slug}`);
    }
  }

  console.log("\nSummary");
  console.log(`  created : ${apply ? created : "(dry-run)"}`);
  console.log(`  skipped : ${skipped}`);
  if (!apply) console.log("\nRe-run with --apply to write draft products.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
