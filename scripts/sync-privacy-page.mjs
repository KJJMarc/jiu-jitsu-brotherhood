/**
 * Sync Privacy Policy static copy into site_pages.body_html (CMS).
 *
 * Usage:
 *   node --env-file=.env.local scripts/sync-privacy-page.mjs
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

const helper = join(process.cwd(), "scripts", `_sync-privacy-html-${process.pid}.ts`);
writeFileSync(
  helper,
  `import { getStaticSitePageHtml } from "@/lib/site-pages";
const html = getStaticSitePageHtml("privacy-policy");
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
if (!html.includes("Last updated: 14 September 2026")) {
  console.error("Generated HTML is missing the updated date — aborting.");
  process.exit(1);
}
if (!html.includes("1. Who We Are")) {
  console.error("Generated HTML is missing expected Privacy Policy heading — aborting.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const { data, error } = await supabase
  .from("site_pages")
  .update({
    body_html: html,
    title: "Privacy Policy",
    status: "published",
    seo_description:
      "How Kingston Jiu Jitsu collects, uses, stores and shares personal information.",
    updated_at: new Date().toISOString(),
  })
  .eq("slug", "privacy-policy")
  .select("slug, updated_at")
  .maybeSingle();

if (error) {
  console.error(error.message);
  process.exit(1);
}

console.log("Synced privacy-policy", {
  updated_at: data?.updated_at,
  htmlLen: html.length,
  hasWhoWeAre: html.includes("1. Who We Are"),
  hasUpdatedDate: html.includes("Last updated: 14 September 2026"),
});
