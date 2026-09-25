import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";
import { stripTrailingSlash } from "../lib/canonical.ts";
import {
  EXTRA_REDIRECTS,
  LEDGER_OVERRIDES,
} from "../lib/migration/overrides.ts";
import { resolveMigration } from "../lib/migration/resolve.ts";
import {
  inventoryGone,
  inventoryPreserve,
  inventoryRedirects,
} from "../lib/migration/ledger.generated.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const csvPath = join(root, "docs/rebuild/JJB-phase-2a-url-inventory.csv");

type CsvRow = {
  old_shopify_url: string;
  content_type: string;
  current_handle_slug: string;
  proposed_nextjs_url: string;
  action: string;
  notes: string;
};

const rows = parse(readFileSync(csvPath, "utf8"), {
  columns: true,
  skip_empty_lines: true,
  trim: true,
}) as CsvRow[];

assert.equal(rows.length, 588, "CSV row count drifted from the accepted 588-row inventory");

const nextConfig = readFileSync(join(root, "next.config.mjs"), "utf8");
assert.match(nextConfig, /trailingSlash:\s*false/);
assert.doesNotMatch(nextConfig, /destination:\s*"\/news/);
assert.doesNotMatch(nextConfig, /enso-3-0/);

function decision(
  pathname: string,
  search = "",
) {
  return resolveMigration(pathname, new URLSearchParams(search));
}

// --- Representative public contracts ---
assert.deepEqual(decision("/"), { kind: "pass" });
assert.deepEqual(decision("/blogs/blog"), { kind: "pass" });
assert.deepEqual(decision("/blogs/blog/a-brief-history-of-bjj"), { kind: "pass" });
assert.deepEqual(decision("/blogs/techniques"), { kind: "pass" });
assert.deepEqual(decision("/collections/all"), { kind: "pass" });
assert.deepEqual(decision("/collections"), { kind: "pass" });
assert.deepEqual(decision("/cart"), { kind: "pass" });
assert.deepEqual(decision("/search"), { kind: "pass" });
assert.deepEqual(decision("/blogs/news"), { kind: "pass" });

assert.deepEqual(decision("/news"), {
  kind: "redirect",
  location: "/blogs/blog",
  status: 301,
});
assert.deepEqual(decision("/news/"), {
  kind: "redirect",
  location: "/blogs/blog",
  status: 301,
});
assert.deepEqual(decision("/shop"), { kind: "pass" });
assert.deepEqual(decision("/shop/"), { kind: "pass" });
assert.deepEqual(decision("/blog"), {
  kind: "redirect",
  location: "/pages/blog",
  status: 301,
});
assert.deepEqual(decision("/about"), {
  kind: "redirect",
  location: "/pages/about",
  status: 301,
});
assert.deepEqual(decision("/about/"), {
  kind: "redirect",
  location: "/pages/about",
  status: 301,
});
assert.deepEqual(decision("/contact"), {
  kind: "redirect",
  location: "/pages/contact",
  status: 301,
});

assert.deepEqual(decision("/collections/enso-3-0"), {
  kind: "redirect",
  location: "/collections/gis",
  status: 301,
});
assert.equal(decision("/collections").kind, "pass");

assert.deepEqual(decision("/thank-you"), { kind: "gone" });
assert.deepEqual(decision("/pages/thank-you"), { kind: "gone" });
assert.deepEqual(decision("/collections/books"), { kind: "gone" });
assert.deepEqual(decision("/membership-access"), { kind: "gone" });
assert.deepEqual(decision("/classes"), { kind: "gone" });
assert.deepEqual(decision("/adult-classes"), { kind: "gone" });

assert.deepEqual(decision("/shop/bag"), { kind: "pass" });
assert.deepEqual(decision("/shop/astrum-gi"), { kind: "pass" });
assert.equal(decision("/shop/checkout").kind, "pass");
assert.equal(decision("/shop/checkout/return").kind, "pass");

assert.deepEqual(decision("/", "page_id=4958"), {
  kind: "redirect",
  location: "/pages/beginners-guide-to-bjj-signup",
  status: 301,
});
assert.deepEqual(decision("/", "p=4942"), { kind: "gone" });
assert.equal(decision("/blogs/blog", "page=2").kind, "pass");

const Kingston = decision("/pages/bjj-in-kingston-upon-thames");
assert.equal(
  Kingston.kind,
  "pass",
  "Kingston page must stay on JJB (Past Events network history) — not redirect off-site",
);
assert.equal(decision("/pages/past-events").kind, "pass");
assert.equal(
  decision("/products/summer-super-seminar-2025").kind,
  "pass",
);
assert.equal(
  decision("/products/kids-club-network-interclub-competition-2026").kind,
  "pass",
);

// --- Full CSV audit (must match exactly; no unresolved discrepancies) ---
const discrepancies: string[] = [];
let preserveN = 0;
let redirectN = 0;
let goneN = 0;

for (const row of rows) {
  const raw = row.old_shopify_url;
  if (raw.startsWith("?")) {
    const params = new URLSearchParams(raw.startsWith("?") ? raw.slice(1) : raw);
    const got = decision("/", params.toString());
    if (row.action === "410") {
      assert.equal(got.kind, "gone", raw);
      goneN += 1;
    } else if (row.action === "301") {
      assert.equal(got.kind, "redirect", raw);
      if (got.kind === "redirect") {
        assert.equal(got.location, stripTrailingSlash(row.proposed_nextjs_url), raw);
      }
      redirectN += 1;
    }
    continue;
  }

  const src = stripTrailingSlash(raw);
  const override = LEDGER_OVERRIDES.find((o) => o.path === src);
  const got = decision(src);

  if (override) {
    assert.equal(got.kind, "redirect", src);
    if (got.kind === "redirect") {
      assert.equal(got.location, override.implementedDestination, src);
    }
    if (row.proposed_nextjs_url !== override.implementedDestination) {
      discrepancies.push(
        `${src}: CSV ${row.action} ${row.proposed_nextjs_url} → implemented ${override.implementedAction} ${override.implementedDestination} (${override.reason})`,
      );
    }
    redirectN += 1;
    continue;
  }

  if (row.action === "PRESERVE") {
    assert.equal(got.kind, "pass", `${src} should pass (${row.content_type})`);
    preserveN += 1;
  } else if (row.action === "410") {
    assert.equal(got.kind, "gone", `${src} should be 410`);
    goneN += 1;
  } else if (row.action === "301") {
    const dest =
      row.proposed_nextjs_url === "(gone)"
        ? null
        : row.proposed_nextjs_url.startsWith("http")
          ? row.proposed_nextjs_url
          : stripTrailingSlash(row.proposed_nextjs_url);
    assert.equal(got.kind, "redirect", `${src} should 301`);
    if (got.kind === "redirect") {
      assert.equal(got.location, dest, src);
    }
    redirectN += 1;
  } else {
    throw new Error(`Unknown action ${row.action} for ${src}`);
  }
}

assert.equal(
  discrepancies.length,
  0,
  `unexpected CSV discrepancies:\n${discrepancies.join("\n")}`,
);
assert.equal(inventoryRedirects["/shop"], "/collections/all");
assert.ok(inventoryPreserve.includes("/collections"));
assert.ok(inventoryPreserve.includes("/collections/all"));

const redirectDests = Object.values(inventoryRedirects);
for (const dest of redirectDests) {
  if (dest.startsWith("http")) continue;
  assert.equal(
    dest in inventoryRedirects,
    false,
    `redirect chain via ${dest}`,
  );
}

assert.ok(inventoryPreserve.includes("/"));
assert.ok(inventoryGone.includes("/collections/books"));
assert.equal("/collections" in inventoryRedirects, false);

for (const extra of EXTRA_REDIRECTS) {
  const got = decision(extra.path);
  if (extra.action === "301") {
    assert.equal(got.kind, "redirect");
    if (got.kind === "redirect") assert.equal(got.location, extra.destination);
  }
}

assert.ok(!nextConfig.includes("KINGSTON_SITE"));

console.log(
  `Phase 2B routing tests passed. CSV ${rows.length} rows (preserve-like ${preserveN}, 301 ${redirectN}, 410 ${goneN}). No unresolved discrepancies.`,
);
console.log(
  `Ledger sizes: ${Object.keys(inventoryRedirects).length} redirects, ${inventoryGone.length} gone, ${inventoryPreserve.length} preserve.`,
);
