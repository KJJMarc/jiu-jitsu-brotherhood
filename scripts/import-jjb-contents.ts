/**
 * JJB Shopify → contents dry-run importer (Phase 2D / 2E).
 *
 * Default: dry-run only. Never writes unless --write AND JJB Supabase gates pass.
 * Does not copy private export into git. Does not rewrite editorial prose.
 *
 * Usage:
 *   npx tsx scripts/import-jjb-contents.ts
 *   npx tsx scripts/import-jjb-contents.ts --write   # refused without JJB project gate
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  simpleChecksum,
  shouldSkipUnchanged,
  transformShopifyHtml,
  type TransformEvent,
} from "../lib/content/import/transforms";
import { defaultCanonicalPath } from "../lib/content/paths";
import { MAILERLITE_LANDINGS } from "../lib/content/types";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_EXPORT =
  "imports/shopify/private/jjb-shopify-audit-20260916-091414";

const write = process.argv.includes("--write");
const exportDir = (() => {
  const idx = process.argv.indexOf("--export");
  return idx >= 0 && process.argv[idx + 1]
    ? process.argv[idx + 1]
    : DEFAULT_EXPORT;
})();

type ShopifyArticle = {
  id: string;
  title: string;
  handle: string;
  body: string;
  summary?: string;
  tags?: string[];
  isPublished: boolean;
  publishedAt?: string;
  updatedAt?: string;
  author?: { name?: string };
  blog?: { handle?: string; title?: string };
  image?: { url?: string; altText?: string };
  metafields?: { nodes?: { key: string; value: string }[] };
};

type ShopifyPage = {
  id: string;
  title: string;
  handle: string;
  body: string;
  bodySummary?: string;
  isPublished: boolean;
  publishedAt?: string;
  updatedAt?: string;
  templateSuffix?: string | null;
  metafields?: { nodes?: { key: string; value: string }[] };
};

type PlannedRow = {
  type: "article" | "technique" | "past_event" | "page";
  handle: string;
  blog_handle: string | null;
  title: string;
  status: "draft" | "published" | "archived";
  published_at: string | null;
  excerpt: string;
  body_html: string | null;
  seo_title: string | null;
  seo_description: string | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  youtube_ids: string[];
  tags_source: string[];
  tags_public: string[];
  canonical_path: string;
  source_shopify_gid: string;
  source_shopify_author: string | null;
  source_updated_at: string | null;
  template: string | null;
  mailerlite_form_code: string | null;
  mailerlite_embed_id: string | null;
  transform_codes: string[];
  action: "upsert" | "skip_redirect_only" | "skip_410" | "seed_mailerlite";
};

const EVENT_ARTICLE_CANONICALS = new Set([
  "summer-seaside-special",
  "spring-super-seminar",
]);

const EVENT_PAGE_REDIRECTS = new Set([
  "summer-seaside-special",
  "spring-super-seminar",
]);

const SKIP_410_PAGES = new Set([
  "closed-jiu-jitsu-master-academy",
  "closed-bjj-building-blocks-and-bjj-learning-sites",
  "jiu-jitsu-training-secrets",
  "home",
  "your-discount-coupon",
  "thank-you",
  "thank-you-1",
  "cant-find-that",
  "blog",
]);

function mf(
  nodes: { key: string; value: string }[] | undefined,
  key: string,
): string | null {
  const hit = nodes?.find((n) => n.key === key);
  return hit?.value?.trim() || null;
}

function planArticle(a: ShopifyArticle): PlannedRow | null {
  const blog = a.blog?.handle;
  if (blog !== "blog" && blog !== "techniques") return null;

  const isEvent =
    blog === "blog" && EVENT_ARTICLE_CANONICALS.has(a.handle);
  const type = isEvent
    ? "past_event"
    : blog === "techniques"
      ? "technique"
      : "article";

  const transformed = transformShopifyHtml(a.body || "");
  const canonical_path = defaultCanonicalPath({
    type,
    handle: a.handle,
    blog_handle: blog === "blog" ? "blog" : blog,
  });

  return {
    type,
    handle: a.handle,
    blog_handle: type === "technique" ? "techniques" : "blog",
    title: a.title,
    status: a.isPublished ? "published" : "draft",
    published_at: a.publishedAt || null,
    excerpt: (a.summary || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    body_html: transformed.html || null,
    seo_title: mf(a.metafields?.nodes, "title_tag"),
    seo_description: mf(a.metafields?.nodes, "description_tag"),
    featured_image_url: a.image?.url || null,
    featured_image_alt: a.image?.altText || null,
    youtube_ids: transformed.youtubeIds,
    tags_source: a.tags || [],
    tags_public: [],
    canonical_path,
    source_shopify_gid: a.id,
    source_shopify_author: a.author?.name || null,
    source_updated_at: a.updatedAt || null,
    template: null,
    mailerlite_form_code: null,
    mailerlite_embed_id: null,
    transform_codes: [...new Set(transformed.events.map((e) => e.code))],
    action: "upsert",
  };
}

function planPage(p: ShopifyPage): PlannedRow {
  if (EVENT_PAGE_REDIRECTS.has(p.handle)) {
    return {
      type: "page",
      handle: p.handle,
      blog_handle: null,
      title: p.title,
      status: "archived",
      published_at: null,
      excerpt: "",
      body_html: null,
      seo_title: null,
      seo_description: null,
      featured_image_url: null,
      featured_image_alt: null,
      youtube_ids: [],
      tags_source: [],
      tags_public: [],
      canonical_path: `/pages/${p.handle}`,
      source_shopify_gid: p.id,
      source_shopify_author: null,
      source_updated_at: p.updatedAt || null,
      template: null,
      mailerlite_form_code: null,
      mailerlite_embed_id: null,
      transform_codes: [],
      action: "skip_redirect_only",
    };
  }

  if (SKIP_410_PAGES.has(p.handle)) {
    return {
      type: "page",
      handle: p.handle,
      blog_handle: null,
      title: p.title,
      status: "archived",
      published_at: null,
      excerpt: "",
      body_html: null,
      seo_title: null,
      seo_description: null,
      featured_image_url: null,
      featured_image_alt: null,
      youtube_ids: [],
      tags_source: [],
      tags_public: [],
      canonical_path: `/pages/${p.handle}`,
      source_shopify_gid: p.id,
      source_shopify_author: null,
      source_updated_at: p.updatedAt || null,
      template: null,
      mailerlite_form_code: null,
      mailerlite_embed_id: null,
      transform_codes: [],
      action: "skip_410",
    };
  }

  const isMailer =
    p.handle === MAILERLITE_LANDINGS.beginnersGuide.handle ||
    p.handle === MAILERLITE_LANDINGS.suckLess.handle;

  if (isMailer) {
    const landing =
      p.handle === MAILERLITE_LANDINGS.beginnersGuide.handle
        ? MAILERLITE_LANDINGS.beginnersGuide
        : MAILERLITE_LANDINGS.suckLess;
    return {
      type: "page",
      handle: p.handle,
      blog_handle: null,
      title: p.title,
      status: "draft",
      published_at: null,
      excerpt: "",
      body_html: null,
      seo_title: mf(p.metafields?.nodes, "title_tag"),
      seo_description: mf(p.metafields?.nodes, "description_tag"),
      featured_image_url: null,
      featured_image_alt: null,
      youtube_ids: [],
      tags_source: [],
      tags_public: [],
      canonical_path: landing.canonicalPath,
      source_shopify_gid: p.id,
      source_shopify_author: null,
      source_updated_at: p.updatedAt || null,
      template: "mailerlite_landing",
      mailerlite_form_code: landing.formCode,
      mailerlite_embed_id: landing.embedId,
      transform_codes: [],
      action: "seed_mailerlite",
    };
  }

  const isEventPage =
    p.handle === "welsh-winter-special" ||
    p.handle === "oli-geddes-foundation-charity-event-kingston-jiu-jitsu";
  const type = isEventPage ? "past_event" : "page";
  const transformed = transformShopifyHtml(p.body || "");

  return {
    type,
    handle: p.handle,
    blog_handle: null,
    title: p.title,
    status: p.isPublished ? "published" : "draft",
    published_at: p.publishedAt || null,
    excerpt: (p.bodySummary || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
    body_html: transformed.html || null,
    seo_title: mf(p.metafields?.nodes, "title_tag"),
    seo_description: mf(p.metafields?.nodes, "description_tag"),
    featured_image_url: null,
    featured_image_alt: null,
    youtube_ids: transformed.youtubeIds,
    tags_source: [],
    tags_public: [],
    canonical_path: `/pages/${p.handle}`,
    source_shopify_gid: p.id,
    source_shopify_author: null,
    source_updated_at: p.updatedAt || null,
    template: null,
    mailerlite_form_code: null,
    mailerlite_embed_id: null,
    transform_codes: [...new Set(transformed.events.map((e: TransformEvent) => e.code))],
    action: "upsert",
  };
}

function main() {
  const absExport = join(root, exportDir);
  if (!existsSync(join(absExport, "articles.json"))) {
    console.error(
      `Export not found at ${exportDir}. Place the private audit extract locally (gitignored) or pass --export <path>.`,
    );
    process.exit(1);
  }

  const articles = JSON.parse(
    readFileSync(join(absExport, "articles.json"), "utf8"),
  ) as ShopifyArticle[];
  const pages = JSON.parse(
    readFileSync(join(absExport, "pages.json"), "utf8"),
  ) as ShopifyPage[];

  const planned: PlannedRow[] = [];
  for (const a of articles) {
    const row = planArticle(a);
    if (row) planned.push(row);
  }
  for (const p of pages) planned.push(planPage(p));

  // Past events index shell (not in Shopify)
  planned.push({
    type: "page",
    handle: "past-events",
    blog_handle: null,
    title: "Past Events",
    status: "draft",
    published_at: null,
    excerpt: "Archive of Jiu Jitsu Brotherhood seminars and competitions.",
    body_html: "<p>Past events will be listed here after migration.</p>",
    seo_title: null,
    seo_description: null,
    featured_image_url: null,
    featured_image_alt: null,
    youtube_ids: [],
    tags_source: [],
    tags_public: [],
    canonical_path: "/pages/past-events",
    source_shopify_gid: "jjb:seed:past-events",
    source_shopify_author: null,
    source_updated_at: null,
    template: "default",
    mailerlite_form_code: null,
    mailerlite_embed_id: null,
    transform_codes: [],
    action: "upsert",
  });

  const summary = {
    mode: write ? "WRITE" : "DRY_RUN",
    exportDir,
    totals: {
      planned: planned.length,
      upsert: planned.filter((r) => r.action === "upsert").length,
      seed_mailerlite: planned.filter((r) => r.action === "seed_mailerlite")
        .length,
      skip_redirect_only: planned.filter(
        (r) => r.action === "skip_redirect_only",
      ).length,
      skip_410: planned.filter((r) => r.action === "skip_410").length,
      withYoutube: planned.filter((r) => r.youtube_ids.length > 0).length,
    },
    byType: planned.reduce(
      (acc, r) => {
        if (r.action === "upsert" || r.action === "seed_mailerlite") {
          acc[r.type] = (acc[r.type] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    ),
    sampleTransforms: planned
      .filter((r) => r.transform_codes.length)
      .slice(0, 8)
      .map((r) => ({
        path: r.canonical_path,
        codes: r.transform_codes,
      })),
    idempotencyDemo: (() => {
      const sample = planned.find((r) => r.body_html);
      if (!sample?.body_html) return null;
      const checksum = simpleChecksum(sample.body_html);
      return {
        path: sample.canonical_path,
        checksum,
        skipIfSame: shouldSkipUnchanged({
          existingSourceUpdatedAt: sample.source_updated_at,
          incomingSourceUpdatedAt: sample.source_updated_at,
          existingBodyChecksum: checksum,
          incomingBodyChecksum: checksum,
        }),
      };
    })(),
    reportHash: createHash("sha256")
      .update(JSON.stringify(planned.map((p) => p.source_shopify_gid)))
      .digest("hex")
      .slice(0, 16),
  };

  const reportPath = join(root, "tmp/jjb-contents-import-dry-run.json");
  try {
    writeFileSync(
      reportPath,
      JSON.stringify({ summary, planned: planned.map((p) => ({
        ...p,
        body_html: p.body_html ? `[${p.body_html.length} chars]` : null,
      })) }, null, 2),
    );
    console.log(`Wrote report ${reportPath}`);
  } catch {
    console.log("(Could not write tmp report; printing summary only)");
  }

  console.log(JSON.stringify(summary, null, 2));

  if (write) {
    console.error(
      "\n--write refused in Phase 2E foundation: apply only after a dedicated JJB Supabase project is configured and gated (JJB_SUPABASE_PROJECT_REF).",
    );
    console.error(
      "No database writes were attempted. Re-run after provisioning (see Phase 2E report).",
    );
    process.exit(2);
  }
}

main();
