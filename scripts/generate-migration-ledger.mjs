/**
 * Compile docs/rebuild/JJB-phase-2a-url-inventory.csv into an Edge-safe
 * TypeScript module. Do not edit the generated file by hand.
 */
import { parse } from "csv-parse/sync";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const csvPath = join(root, "docs/rebuild/JJB-phase-2a-url-inventory.csv");
const outPath = join(root, "lib/migration/ledger.generated.ts");

function stripTrailingSlash(pathname) {
  if (!pathname || pathname === "/") return "/";
  if (pathname.startsWith("?")) return pathname;
  if (pathname.startsWith("http://") || pathname.startsWith("https://")) {
    return pathname;
  }
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

function parseQuerySource(raw) {
  const q = raw.startsWith("?") ? raw.slice(1) : raw;
  const params = new URLSearchParams(q);
  const entries = [...params.entries()];
  if (entries.length !== 1) {
    throw new Error(`Expected a single query param in source ${raw}`);
  }
  return { param: entries[0][0], value: entries[0][1] };
}

const csv = readFileSync(csvPath, "utf8");
const rows = parse(csv, { columns: true, skip_empty_lines: true, trim: true });

/** @type {Record<string, string>} */
const redirects = {};
/** @type {Set<string>} */
const gone = new Set();
/** @type {Set<string>} */
const preserve = new Set();
/** @type {Array<{param: string, value: string, action: "301"|"410", destination: string|null}>} */
const queryMigrations = [];
const collisions = [];

for (const row of rows) {
  const raw = row.old_shopify_url;
  const action = row.action;
  const destRaw = row.proposed_nextjs_url;
  const dest =
    destRaw === "(gone)" ? null : stripTrailingSlash(destRaw);

  if (raw.startsWith("?")) {
    const { param, value } = parseQuerySource(raw);
    if (action !== "301" && action !== "410") {
      throw new Error(`Query source ${raw} has action ${action}`);
    }
    queryMigrations.push({
      param,
      value,
      action,
      destination: action === "301" ? dest : null,
    });
    continue;
  }

  const src = stripTrailingSlash(raw);

  if (action === "PRESERVE") {
    if (redirects[src] || gone.has(src)) {
      collisions.push({ src, action, dest, existing: "redirect-or-gone" });
    }
    preserve.add(src);
    continue;
  }

  if (action === "410") {
    if (preserve.has(src) || redirects[src]) {
      collisions.push({ src, action, dest, existing: "preserve-or-redirect" });
    }
    gone.add(src);
    continue;
  }

  if (action === "301") {
    if (!dest) throw new Error(`301 ${src} has empty destination`);
    if (preserve.has(src) || gone.has(src)) {
      collisions.push({ src, action, dest, existing: "preserve-or-gone" });
    }
    if (redirects[src] && redirects[src] !== dest) {
      collisions.push({
        src,
        action,
        dest,
        existing: redirects[src],
      });
      continue;
    }
    redirects[src] = dest;
  }
}

if (redirects["/shop"] !== "/collections/all") {
  throw new Error(
    `Expected approved /shop → /collections/all; got ${redirects["/shop"] ?? "(missing)"}`,
  );
}

if (gone.has("/shop") || preserve.has("/shop")) {
  throw new Error("/shop must remain a 301 to /collections/all");
}

if (redirects["/collections"]) {
  throw new Error(
    "Do not restore stale /collections → /collections/enso-3-0; /collections must stay PRESERVE",
  );
}

const chains = Object.entries(redirects).filter(([, dest]) => dest in redirects);
if (chains.length) {
  throw new Error(
    `Redirect chains in compiled ledger: ${chains.map(([s, d]) => `${s}→${d}→${redirects[d]}`).join("; ")}`,
  );
}

const homepageDumps = Object.entries(redirects).filter(
  ([src, dest]) => dest === "/" && src !== "/pages/home",
);
if (homepageDumps.length) {
  throw new Error(
    `Homepage dumps: ${homepageDumps.map(([s]) => s).join(", ")}`,
  );
}

if (collisions.length) {
  throw new Error(
    `Ledger collisions: ${JSON.stringify(collisions.slice(0, 8), null, 2)}`,
  );
}

function dumpObject(obj) {
  const keys = Object.keys(obj).sort();
  return keys.map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(obj[k])},`).join("\n");
}

function dumpArray(arr) {
  return [...arr]
    .sort()
    .map((v) => `  ${JSON.stringify(v)},`)
    .join("\n");
}

const file = `/* eslint-disable */
/**
 * GENERATED from docs/rebuild/JJB-phase-2a-url-inventory.csv
 * by scripts/generate-migration-ledger.mjs — do not edit by hand.
 */
export const inventoryRedirects: Record<string, string> = {
${dumpObject(redirects)}
};

export const inventoryGone: string[] = [
${dumpArray(gone)}
];

export const inventoryPreserve: string[] = [
${dumpArray(preserve)}
];

export const queryMigrations: Array<{
  param: string;
  value: string;
  action: "301" | "410";
  destination: string | null;
}> = ${JSON.stringify(queryMigrations, null, 2)};
`;

writeFileSync(outPath, file);
console.log(
  `Wrote ${outPath} (${Object.keys(redirects).length} redirects, ${gone.size} gone, ${preserve.size} preserve, ${queryMigrations.length} query)`,
);
