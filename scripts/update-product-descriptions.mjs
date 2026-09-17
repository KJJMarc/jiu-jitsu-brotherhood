#!/usr/bin/env node
/**
 * Update products.description_html from cleaned copy in
 * scripts/data/product-description-updates.json.
 *
 * Dry-run by default. Pass --apply to write.
 *
 * Before any DB write, upserts the current DB description into
 * scripts/data/product-descriptions-backup.json when that handle
 * is not already backed up (recoverable originals).
 *
 * Only updates rows where new HTML differs from the current value.
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   node scripts/update-product-descriptions.mjs
 *   node scripts/update-product-descriptions.mjs --apply
 */

import { createClient } from "@supabase/supabase-js";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA_DIR = join(__dirname, "data");
const UPDATES_PATH = join(DATA_DIR, "product-description-updates.json");
const BACKUP_PATH = join(DATA_DIR, "product-descriptions-backup.json");

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

const apply = process.argv.includes("--apply");

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required env: ${name}`);
    process.exit(1);
  }
  return value;
}

function normaliseHtml(html) {
  if (html == null) return "";
  return String(html).replace(/\r\n/g, "\n").trim();
}

function loadUpdates() {
  if (!existsSync(UPDATES_PATH)) {
    console.error(`Updates file not found: ${UPDATES_PATH}`);
    process.exit(1);
  }
  const raw = JSON.parse(readFileSync(UPDATES_PATH, "utf8"));
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    console.error("Updates file must be a map of shopify_handle → entry");
    process.exit(1);
  }
  return raw;
}

function loadBackup() {
  if (!existsSync(BACKUP_PATH)) return [];
  const raw = JSON.parse(readFileSync(BACKUP_PATH, "utf8"));
  return Array.isArray(raw) ? raw : [];
}

function saveBackup(entries) {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(BACKUP_PATH, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
}

/**
 * Ensure originals are backed up for handles about to change.
 * Only inserts when shopify_handle is not already present.
 * @returns {number} number of new backup rows written
 */
function upsertMissingBackups(backup, productsByHandle, handlesToWrite) {
  const existing = new Set(
    backup.map((row) => row.shopify_handle).filter(Boolean)
  );
  let added = 0;
  for (const handle of handlesToWrite) {
    if (existing.has(handle)) continue;
    const product = productsByHandle.get(handle);
    if (!product) continue;
    backup.push({
      id: product.id,
      title: product.title,
      shopify_handle: product.shopify_handle,
      product_type: product.product_type,
      status: product.status,
      description_html: product.description_html ?? "",
    });
    existing.add(handle);
    added += 1;

    const descPath = join(DATA_DIR, `desc-${handle}.html`);
    if (!existsSync(descPath)) {
      writeFileSync(descPath, product.description_html ?? "", "utf8");
    }
  }
  if (added > 0) saveBackup(backup);
  return added;
}

async function main() {
  const updates = loadUpdates();
  const handles = Object.keys(updates);
  console.log(
    `Mode: ${apply ? "APPLY" : "DRY-RUN"} · updates file: ${handles.length} handles`
  );

  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: products, error } = await supabase
    .from("products")
    .select(
      "id, title, shopify_handle, product_type, status, description_html"
    )
    .not("shopify_handle", "is", null);

  if (error) {
    console.error(`Failed to fetch products: ${error.message}`);
    process.exit(1);
  }

  const productsByHandle = new Map(
    (products ?? [])
      .filter((p) => p.shopify_handle)
      .map((p) => [p.shopify_handle, p])
  );

  /** @type {string[]} */
  const matched = [];
  /** @type {string[]} */
  const missingInDb = [];
  /** @type {string[]} */
  const wouldUpdate = [];
  /** @type {string[]} */
  const unchanged = [];
  /** @type {string[]} */
  const left = [];
  /** @type {string[]} */
  const updated = [];
  /** @type {string[]} */
  const errors = [];

  for (const handle of handles) {
    const entry = updates[handle];
    const product = productsByHandle.get(handle);
    if (!product) {
      missingInDb.push(handle);
      console.log(`  ✗ missing in DB: ${handle}`);
      continue;
    }
    matched.push(handle);

    const action = entry.action ?? "rewrite";
    const newHtml = normaliseHtml(entry.html ?? "");
    const currentHtml = normaliseHtml(product.description_html);
    const differs = newHtml !== currentHtml;

    const note = entry.notes ? ` · ${entry.notes}` : "";
    console.log(
      `  • ${handle} [${action}] ${product.title}${note}`
    );

    if (action === "leave" && !differs) {
      left.push(handle);
      unchanged.push(handle);
      console.log(`      leave (identical)`);
      continue;
    }

    if (!differs) {
      unchanged.push(handle);
      console.log(`      unchanged (html already matches)`);
      continue;
    }

    wouldUpdate.push(handle);
    console.log(
      `      ${apply ? "updating" : "would update"} (${currentHtml.length} → ${newHtml.length} chars)`
    );

    if (!apply) continue;

    const backup = loadBackup();
    const added = upsertMissingBackups(backup, productsByHandle, [handle]);
    if (added > 0) {
      console.log(`      backup: added ${added} original(s)`);
    }

    const { error: updateError } = await supabase
      .from("products")
      .update({ description_html: newHtml })
      .eq("id", product.id);

    if (updateError) {
      errors.push(handle);
      console.log(`      ERROR: ${updateError.message}`);
    } else {
      updated.push(handle);
      console.log(`      written`);
    }
  }

  const dbOnly = [...productsByHandle.keys()].filter(
    (h) => !Object.prototype.hasOwnProperty.call(updates, h)
  );

  console.log("\n—— Summary ——");
  console.log(`  updates file handles : ${handles.length}`);
  console.log(`  matched in DB        : ${matched.length}`);
  console.log(`  missing in DB        : ${missingInDb.length}`);
  console.log(`  DB handles not in file: ${dbOnly.length}`);
  if (dbOnly.length) {
    for (const h of dbOnly) console.log(`    - ${h}`);
  }
  console.log(
    `  would update / updated: ${apply ? updated.length : wouldUpdate.length}`
  );
  console.log(`  unchanged            : ${unchanged.length}`);
  if (apply) {
    console.log(`  left (action=leave)  : ${left.length}`);
    console.log(`  errors               : ${errors.length}`);
    console.log("\nUpdated handles:");
    for (const h of updated) console.log(`  ✓ ${h}`);
    console.log("\nUnchanged handles:");
    for (const h of unchanged) console.log(`  · ${h}`);
    if (errors.length) {
      console.log("\nFailed handles:");
      for (const h of errors) console.log(`  ✗ ${h}`);
    }
  } else {
    console.log("\nWould update:");
    for (const h of wouldUpdate) console.log(`  → ${h}`);
    console.log("\nWould leave unchanged:");
    for (const h of unchanged) console.log(`  · ${h}`);
    console.log("\n(Re-run with --apply to write.)");
  }

  if (missingInDb.length || errors.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
