#!/usr/bin/env node
/**
 * Static validation of the JJB clean baseline against application DB deps.
 * Does not connect to Supabase. Does not apply SQL.
 *
 * Usage: node scripts/validate-jjb-baseline.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baselinePath = path.join(
  root,
  "supabase/jjb-baseline/0001_jjb_clean_baseline.sql",
);
const migrationsDir = path.join(root, "supabase/migrations");

const REQUIRED_TABLES = [
  "admin_users",
  "site_settings",
  "tracking_settings",
  "products",
  "product_variants",
  "product_images",
  "inventory_movements",
  "store_fulfilment_settings",
  "store_shipping_bands",
  "store_orders",
  "store_order_items",
  "store_payment_events",
  "authors",
  "media_assets",
  "contents",
];

const FORBIDDEN_TABLES = ["articles", "site_pages"];

const REQUIRED_FUNCTIONS = [
  "is_admin",
  "is_admin_aal2",
  "next_store_order_number",
  "apply_store_order_stock",
  "adjust_product_variant_stock",
  "clear_product_variant_stock_review",
];

const REQUIRED_BUCKETS = ["product-images", "content-images"];
const FORBIDDEN_BUCKETS = ["article-images"];

/** Tables still referenced by leftover KJJ-era app modules (not required in JJB baseline). */
const LEGACY_APP_TABLES = new Set(["articles", "site_pages"]);

/** App tables that must exist in the JJB baseline for current JJB paths. */
const JJB_APP_TABLES = new Set([
  "admin_users",
  "site_settings",
  "tracking_settings",
  "products",
  "product_variants",
  "product_images",
  "inventory_movements",
  "store_fulfilment_settings",
  "store_shipping_bands",
  "store_orders",
  "store_order_items",
  "store_payment_events",
  "contents",
  "authors",
  "media_assets",
]);

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exitCode = 1;
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

function collectFromCalls(dir, tables) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFromCalls(full, tables);
      continue;
    }
    if (!/\.(ts|tsx|mjs|js)$/.test(entry.name)) continue;
    const text = fs.readFileSync(full, "utf8");
    for (const m of text.matchAll(/\.from\(\s*["']([a-z_]+)["']\s*\)/g)) {
      tables.add(m[1]);
    }
  }
}

const sql = fs.readFileSync(baselinePath, "utf8");

ok(`Loaded baseline (${sql.length} bytes)`);

// --- Must live outside historical migrations ---
const accidental = fs
  .readdirSync(migrationsDir)
  .filter((f) => /jjb_clean_baseline|jjb-baseline/i.test(f));
if (accidental.length) {
  fail(
    `Baseline must not sit in supabase/migrations/: ${accidental.join(", ")}`,
  );
} else {
  ok("Baseline is outside supabase/migrations/");
}

// --- Required / forbidden tables ---
for (const t of REQUIRED_TABLES) {
  const re = new RegExp(
    `CREATE TABLE IF NOT EXISTS public\\.${t}\\b`,
    "i",
  );
  if (!re.test(sql)) fail(`Missing CREATE TABLE public.${t}`);
  else ok(`Table ${t}`);
}

for (const t of FORBIDDEN_TABLES) {
  const re = new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${t}\\b`, "i");
  if (re.test(sql)) fail(`Forbidden table present: ${t}`);
  else ok(`Excluded table ${t}`);
}

// --- Functions ---
for (const fn of REQUIRED_FUNCTIONS) {
  const re = new RegExp(
    `CREATE OR REPLACE FUNCTION public\\.${fn}\\s*\\(`,
    "i",
  );
  if (!re.test(sql)) fail(`Missing function ${fn}`);
  else ok(`Function ${fn}`);
}

if (!/RETURN 'JJB-'/.test(sql)) {
  fail("next_store_order_number must emit JJB- prefix");
} else {
  ok("Order prefix JJB-");
}
if (/RETURN 'KJJ-'/.test(sql)) {
  fail("Baseline must not emit KJJ- order prefix");
} else {
  ok("No KJJ- order prefix");
}

// --- Shipping fail-closed ---
if (/INSERT INTO public\.store_shipping_bands/i.test(sql)) {
  fail("Must not seed store_shipping_bands rows");
} else {
  ok("No shipping band seeds");
}
if (!/uk_shipping_enabled boolean NOT NULL DEFAULT false/i.test(sql)) {
  fail("uk_shipping_enabled should default false (fail-closed)");
} else {
  ok("uk_shipping_enabled defaults false");
}
if (!/Collect at Kingston Jiu Jitsu/.test(sql)) {
  fail("Collection label must be Collect at Kingston Jiu Jitsu");
} else {
  ok("Collection label present");
}
if (
  /Collect your order at Kingston Jiu Jitsu\. We will confirm/i.test(sql)
) {
  fail("Must not invent collection instruction copy");
} else {
  ok("No invented collection instructions");
}

// --- KJJ identity scrub ---
const kjjMarkers = [
  "admin@kingstonjiujitsu.com",
  "kingstonjiujitsu.com",
  "Tiffin Sports Centre",
  "07584 131335",
];
for (const m of kjjMarkers) {
  if (sql.includes(m)) fail(`KJJ identity remnant: ${m}`);
}
if (process.exitCode !== 1) ok("No KJJ identity seeds in baseline");

// --- Storage ---
for (const b of REQUIRED_BUCKETS) {
  if (!sql.includes(`'${b}'`)) fail(`Missing storage bucket ${b}`);
  else ok(`Bucket ${b}`);
}
for (const b of FORBIDDEN_BUCKETS) {
  if (new RegExp(`'${b}'`).test(sql)) fail(`Forbidden bucket ${b}`);
  else ok(`Excluded bucket ${b}`);
}
if (!/is_admin_aal2\(\)/.test(sql)) fail("Storage must gate on is_admin_aal2");
else ok("Storage AAL2 gate present");

// --- App dependency coverage ---
const referenced = new Set();
for (const dir of ["lib", "app", "scripts", "components"]) {
  collectFromCalls(path.join(root, dir), referenced);
}

const missingForJjb = [...JJB_APP_TABLES].filter(
  (t) =>
    referenced.has(t) &&
    !new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${t}\\b`, "i").test(sql),
);
if (missingForJjb.length) {
  fail(`JJB app tables missing from baseline: ${missingForJjb.join(", ")}`);
} else {
  ok("All JJB-required app tables present in baseline");
}

const leftoverLegacy = [...referenced].filter((t) => LEGACY_APP_TABLES.has(t));
if (leftoverLegacy.length) {
  console.log(
    `NOTE: Legacy app code still references ${leftoverLegacy.join(", ")} — excluded from JJB baseline by design (contents supersedes).`,
  );
}

// --- Historical migrations still present (provenance) ---
const hist = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"));
if (hist.length < 20) {
  fail(`Expected historical migrations retained; found ${hist.length}`);
} else {
  ok(`Historical migrations retained (${hist.length} files)`);
}

if (process.exitCode) {
  console.error("\nBaseline validation FAILED");
  process.exit(process.exitCode);
}
console.log("\nBaseline validation PASSED");
