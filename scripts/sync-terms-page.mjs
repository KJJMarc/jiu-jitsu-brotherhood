/**
 * Sync Terms & Conditions static copy into site_pages.body_html (CMS).
 * Keeps PayPal markers so SitePageView can rehydrate the hosted buttons.
 *
 * Usage:
 *   node --env-file=.env.local scripts/sync-terms-page.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { spawnSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const helper = join(process.cwd(), "scripts", `_sync-terms-html-${process.pid}.ts`);
writeFileSync(
  helper,
  `import { getStaticSitePageHtml } from "@/lib/site-pages";
const html = getStaticSitePageHtml("terms-and-conditions");
process.stdout.write(html);
`,
);

const result = spawnSync(
  join(process.cwd(), "node_modules/.bin/tsx"),
  [helper],
  { encoding: "utf8", cwd: process.cwd() },
);
try {
  unlinkSync(helper);
} catch {
  /* ignore */
}

if (result.status !== 0) {
  console.error(result.stderr || result.stdout);
  process.exit(result.status ?? 1);
}

const html = result.stdout;
if (!html.includes("{{paypal:")) {
  console.error("Generated HTML is missing PayPal markers — aborting.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const { data, error } = await supabase
  .from("site_pages")
  .update({
    body_html: html,
    title: "Terms & Conditions",
    status: "published",
    updated_at: new Date().toISOString(),
  })
  .eq("slug", "terms-and-conditions")
  .select("slug, updated_at")
  .maybeSingle();

if (error) {
  console.error(error.message);
  process.exit(1);
}

console.log("Synced terms-and-conditions", {
  updated_at: data?.updated_at,
  htmlLen: html.length,
  paypalMarkers: (html.match(/\{\{paypal:/g) || []).length,
  hasLicencePanel: html.includes("kjj-licence-panel"),
});
