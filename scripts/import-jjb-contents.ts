/**
 * JJB Shopify → contents dry-run importer (Phase 2D / 2E).
 *
 * Default: dry-run only. Never writes unless --write AND JJB Supabase gates pass.
 * Does not copy private export into git. Does not rewrite editorial prose.
 *
 * Usage:
 *   npx tsx scripts/import-jjb-contents.ts
 *   npx tsx scripts/import-jjb-contents.ts --only article
 *   npx tsx scripts/import-jjb-contents.ts --only article --write
 *   npx tsx scripts/import-jjb-contents.ts --only technique
 *   npx tsx scripts/import-jjb-contents.ts --only technique --write
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import {
  plainTextFromShopifyHtml,
  simpleChecksum,
  shouldSkipUnchanged,
  transformShopifyHtml,
  type TransformEvent,
} from "../lib/content/import/transforms";
import { decodeBasicHtmlEntities } from "../lib/rich-text/html";
import { defaultCanonicalPath } from "../lib/content/paths";
import { MAILERLITE_LANDINGS } from "../lib/content/types";
import { BELT_SYSTEM_SEO_DESCRIPTION } from "../lib/home/from-contents";
import {
  assertJjbSupabaseReadyForWrites,
} from "../lib/supabase/jjb-project";
import {
  getSupabaseServiceRoleKey,
  requireSupabaseUrl,
} from "../lib/supabase/env";

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
const onlyType = (() => {
  const idx = process.argv.indexOf("--only");
  const value = idx >= 0 ? process.argv[idx + 1] : null;
  if (!value) return null;
  if (
    value !== "article" &&
    value !== "technique" &&
    value !== "past_event" &&
    value !== "page"
  ) {
    console.error(
      `--only must be one of: article, technique, past_event, page (got ${value})`,
    );
    process.exit(1);
  }
  return value;
})();

/**
 * Shopify page reclassified as an article while preserving its public URL.
 * Featured image is a local JJB asset (not present on the Shopify page).
 */
const BELT_SYSTEM_HANDLE = "progression-the-belt-system";
const BELT_SYSTEM_PUBLISHED_AT = "2026-09-18T00:00:00.000Z";
const BELT_SYSTEM_FEATURED_IMAGE = {
  url: "/images/jjb/bjj-belt-system-thumbnail.png",
  alt: "The BJJ Belt System: From White to Black",
  sourceFile: "public/images/jjb/bjj-belt-system-thumbnail.png",
} as const;
/** Inline article diagram (replaces the legacy Shopify CDN graphic). */
const BELT_SYSTEM_BODY_IMAGE = {
  url: "/images/jjb/bjj-belt-system-chart.jpg",
  alt: "The Complete BJJ Belt System",
  /** Matches the historical Shopify file in any size suffix / query. */
  shopifySrcRe:
    /https?:\/\/cdn\.shopify\.com\/s\/files\/1\/0363\/5125\/files\/brazilian-jiu-jitsu-belts-21[^"'>\s]*/gi,
} as const;

function rewriteBeltSystemBodyImage(html: string): string {
  return html
    .replace(BELT_SYSTEM_BODY_IMAGE.shopifySrcRe, BELT_SYSTEM_BODY_IMAGE.url)
    .replace(
      /src=(["'])\/images\/jjb\/bjj-belt-system(?:-thumbnail\.png|\.jpg)\1/gi,
      `src=$1${BELT_SYSTEM_BODY_IMAGE.url}$1`,
    );
}

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
    excerpt: plainTextFromShopifyHtml(a.summary || ""),
    body_html: transformed.html || null,
    seo_title: decodeBasicHtmlEntities(mf(a.metafields?.nodes, "title_tag") || "") || null,
    seo_description:
      decodeBasicHtmlEntities(mf(a.metafields?.nodes, "description_tag") || "") ||
      null,
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

function planBeltSystemArticle(p: ShopifyPage): PlannedRow {
  const transformed = transformShopifyHtml(p.body || "");
  const bodyHtml = rewriteBeltSystemBodyImage(transformed.html || "");
  return {
    type: "article",
    handle: p.handle,
    blog_handle: "blog",
    title: p.title,
    status: "published",
    published_at: BELT_SYSTEM_PUBLISHED_AT,
    excerpt: BELT_SYSTEM_SEO_DESCRIPTION,
    body_html: bodyHtml || null,
    seo_title: decodeBasicHtmlEntities(mf(p.metafields?.nodes, "title_tag") || "") || null,
    seo_description: BELT_SYSTEM_SEO_DESCRIPTION,
    featured_image_url: BELT_SYSTEM_FEATURED_IMAGE.url,
    featured_image_alt: BELT_SYSTEM_FEATURED_IMAGE.alt,
    youtube_ids: transformed.youtubeIds,
    tags_source: [],
    tags_public: [],
    // Preserve the historical Shopify page URL — do not invent /blogs/blog/…
    canonical_path: `/pages/${p.handle}`,
    source_shopify_gid: p.id,
    source_shopify_author: null,
    source_updated_at: p.updatedAt || null,
    template: null,
    mailerlite_form_code: null,
    mailerlite_embed_id: null,
    transform_codes: [
      ...new Set(transformed.events.map((e: TransformEvent) => e.code)),
    ],
    action: "upsert",
  };
}

function planPage(p: ShopifyPage): PlannedRow {
  if (p.handle === BELT_SYSTEM_HANDLE) {
    return planBeltSystemArticle(p);
  }

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
      seo_title: decodeBasicHtmlEntities(mf(p.metafields?.nodes, "title_tag") || "") || null,
      seo_description:
        decodeBasicHtmlEntities(mf(p.metafields?.nodes, "description_tag") || "") ||
        null,
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
    p.handle === "oli-geddes-foundation-charity-event-kingston-jiu-jitsu" ||
    p.handle === "bjj-in-kingston-upon-thames";
  const type = isEventPage ? "past_event" : "page";
  const transformed = transformShopifyHtml(p.body || "");

  return {
    type,
    handle: p.handle,
    blog_handle: null,
    title: p.title,
    status: p.isPublished ? "published" : "draft",
    published_at: p.publishedAt || null,
    excerpt: plainTextFromShopifyHtml(p.bodySummary || ""),
    body_html: transformed.html || null,
    seo_title: decodeBasicHtmlEntities(mf(p.metafields?.nodes, "title_tag") || "") || null,
    seo_description:
      decodeBasicHtmlEntities(mf(p.metafields?.nodes, "description_tag") || "") ||
      null,
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

function plannedRowToDbPayload(row: PlannedRow) {
  return {
    type: row.type,
    handle: row.handle,
    blog_handle: row.blog_handle,
    title: row.title,
    status: row.status,
    published_at: row.published_at,
    excerpt: row.excerpt,
    body_html: row.body_html,
    seo_title: row.seo_title,
    seo_description: row.seo_description,
    featured_image_url: row.featured_image_url,
    featured_image_alt: row.featured_image_alt,
    youtube_ids: row.youtube_ids,
    tags_source: row.tags_source,
    tags_public: row.tags_public,
    template: row.template,
    noindex: false,
    canonical_path: row.canonical_path,
    source_shopify_gid: row.source_shopify_gid,
    source_shopify_author: row.source_shopify_author,
    source_updated_at: row.source_updated_at,
    mailerlite_form_code: row.mailerlite_form_code,
    mailerlite_embed_id: row.mailerlite_embed_id,
    source_payload: {
      import: "jjb-contents",
      transform_codes: row.transform_codes,
      action: row.action,
    },
  };
}

async function writeRows(rows: PlannedRow[]) {
  if (rows.length === 0) {
    throw new Error("No write candidates.");
  }

  // Gated writes: articles and techniques only (approved migration scopes).
  if (onlyType !== "article" && onlyType !== "technique") {
    throw new Error(
      "--write currently requires --only article or --only technique.",
    );
  }

  const unexpected = rows.filter(
    (r) => r.type !== onlyType || r.action !== "upsert",
  );
  if (unexpected.length > 0) {
    throw new Error(
      `Refusing write: ${unexpected.length} non-${onlyType} upsert candidates in scope.`,
    );
  }

  const projectRef = assertJjbSupabaseReadyForWrites();
  const serviceKey = getSupabaseServiceRoleKey();
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for --write.");
  }

  const supabase = createClient(requireSupabaseUrl(), serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const payloads = rows.map(plannedRowToDbPayload);
  const gids = payloads.map((p) => p.source_shopify_gid);
  const idByGid = new Map<string, string>();
  const lookupBatchSize = 80;

  for (let i = 0; i < gids.length; i += lookupBatchSize) {
    const batch = gids.slice(i, i + lookupBatchSize);
    const { data: existingRows, error: existingError } = await supabase
      .from("contents")
      .select("id, source_shopify_gid")
      .in("source_shopify_gid", batch);
    if (existingError) {
      throw new Error(`Lookup existing rows failed: ${existingError.message}`);
    }
    for (const r of existingRows ?? []) {
      idByGid.set(r.source_shopify_gid as string, r.id as string);
    }
  }

  const toInsert = payloads.filter((p) => !idByGid.has(p.source_shopify_gid));
  const toUpdate = payloads
    .filter((p) => idByGid.has(p.source_shopify_gid))
    .map((p) => ({ id: idByGid.get(p.source_shopify_gid)!, ...p }));

  const batchSize = 40;
  let inserted = 0;
  let updated = 0;

  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize);
    const { error } = await supabase.from("contents").insert(batch);
    if (error) {
      throw new Error(
        `Insert batch ${i / batchSize + 1} failed: ${error.message}`,
      );
    }
    inserted += batch.length;
    console.log(
      `Inserted batch ${i / batchSize + 1}: ${batch.length} (running ${inserted}/${toInsert.length})`,
    );
  }

  for (let i = 0; i < toUpdate.length; i += batchSize) {
    const batch = toUpdate.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((row) =>
        supabase.from("contents").update(row).eq("id", row.id),
      ),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      throw new Error(
        `Update batch ${i / batchSize + 1} failed: ${failed.error.message}`,
      );
    }
    updated += batch.length;
    console.log(
      `Updated batch ${i / batchSize + 1}: ${batch.length} (running ${updated}/${toUpdate.length})`,
    );
  }

  return {
    projectRef,
    inserted,
    updated,
    attempted: payloads.length,
  };
}

async function verifyArticlesImport() {
  const serviceKey = getSupabaseServiceRoleKey();
  if (!serviceKey) throw new Error("Missing service role key for verify.");
  const supabase = createClient(requireSupabaseUrl(), serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const countExact = async (filter: {
    type?: string;
    status?: string;
  }) => {
    let q = supabase.from("contents").select("id", { count: "exact", head: true });
    if (filter.type) q = q.eq("type", filter.type);
    if (filter.status) q = q.eq("status", filter.status);
    const { count, error } = await q;
    if (error) throw new Error(error.message);
    return count ?? 0;
  };

  const articleCount = await countExact({ type: "article" });
  const publishedArticles = await countExact({
    type: "article",
    status: "published",
  });
  const techniques = await countExact({ type: "technique" });
  const pages = await countExact({ type: "page" });
  const pastEvents = await countExact({ type: "past_event" });

  const { data: beltByHandle, error: beltHandleErr } = await supabase
    .from("contents")
    .select(
      "id, type, handle, blog_handle, title, status, published_at, canonical_path, featured_image_url",
    )
    .eq("handle", BELT_SYSTEM_HANDLE);
  if (beltHandleErr) throw new Error(beltHandleErr.message);

  const { data: beltByBlogPath, error: beltBlogErr } = await supabase
    .from("contents")
    .select("id, canonical_path, type")
    .eq("canonical_path", `/blogs/blog/${BELT_SYSTEM_HANDLE}`);
  if (beltBlogErr) throw new Error(beltBlogErr.message);

  const beltRows = beltByHandle ?? [];
  const duplicateBeltBlogUrl = (beltByBlogPath ?? []).length > 0;

  const { data: newest, error: newestErr } = await supabase
    .from("contents")
    .select("title, published_at, canonical_path, type")
    .eq("type", "article")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(5);
  if (newestErr) throw new Error(newestErr.message);

  const sampleHandles = [
    "why-every-generation-thinks-jiu-jitsu-has-changed-for-the-worse",
    "the-surprising-health-benefits-of-strength-training",
    "fear-and-courage",
  ];
  const { data: samples, error: sampleErr } = await supabase
    .from("contents")
    .select("title, handle, canonical_path, type, status")
    .eq("type", "article")
    .in("handle", sampleHandles);
  if (sampleErr) throw new Error(sampleErr.message);

  const { data: indexRows, error: indexErr } = await supabase
    .from("contents")
    .select("id, title, canonical_path, published_at")
    .eq("type", "article")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (indexErr) throw new Error(indexErr.message);

  return {
    articleCount,
    publishedArticles,
    techniques,
    pages,
    pastEvents,
    beltRows: beltRows ?? [],
    duplicateBeltBlogUrl,
    newest: newest ?? [],
    samples: samples ?? [],
    indexCount: indexRows?.length ?? 0,
    indexFirstThree: (indexRows ?? []).slice(0, 3),
    indexUsesCanonicalPaths: (indexRows ?? []).every(
      (r) => typeof r.canonical_path === "string" && r.canonical_path.startsWith("/"),
    ),
  };
}

async function main() {
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

  const inScope = onlyType
    ? planned.filter((r) => r.type === onlyType)
    : planned;
  const writeCandidates = inScope.filter(
    (r) => r.action === "upsert" || r.action === "seed_mailerlite",
  );
  const skippedInScope = inScope.filter(
    (r) => r.action === "skip_redirect_only" || r.action === "skip_410",
  );
  const outOfScope = onlyType
    ? planned.filter((r) => r.type !== onlyType)
    : [];

  const shopifyBlogArticles = articles.filter((a) => a.blog?.handle === "blog");
  const articleRows = planned.filter((r) => r.type === "article");
  const beltRow = articleRows.find((r) => r.handle === BELT_SYSTEM_HANDLE);
  const blogArticlePathsOk = articleRows
    .filter((r) => r.handle !== BELT_SYSTEM_HANDLE)
    .every((r) => r.canonical_path === `/blogs/blog/${r.handle}`);

  const featuredImageReady = existsSync(
    join(root, BELT_SYSTEM_FEATURED_IMAGE.sourceFile),
  );

  const summary = {
    mode: write ? "WRITE" : "DRY_RUN",
    exportDir,
    onlyType: onlyType ?? "all",
    source: {
      shopifyArticlesTotal: articles.length,
      shopifyBlogArticles: shopifyBlogArticles.length,
      shopifyBlogPublished: shopifyBlogArticles.filter((a) => a.isPublished)
        .length,
      shopifyBlogDraft: shopifyBlogArticles.filter((a) => !a.isPublished)
        .length,
      shopifyTechniques: articles.filter((a) => a.blog?.handle === "techniques")
        .length,
      shopifyPages: pages.length,
    },
    totals: {
      plannedAll: planned.length,
      inScope: inScope.length,
      writeCandidates: writeCandidates.length,
      skippedInScope: skippedInScope.length,
      outOfScope: outOfScope.length,
      upsert: writeCandidates.filter((r) => r.action === "upsert").length,
      seed_mailerlite: writeCandidates.filter(
        (r) => r.action === "seed_mailerlite",
      ).length,
      withYoutube: writeCandidates.filter((r) => r.youtube_ids.length > 0)
        .length,
    },
    byTypeAll: planned.reduce(
      (acc, r) => {
        if (r.action === "upsert" || r.action === "seed_mailerlite") {
          acc[r.type] = (acc[r.type] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    ),
    articlesMigration: {
      plannedArticles: articleRows.length,
      publishedArticles: articleRows.filter((r) => r.status === "published")
        .length,
      draftArticles: articleRows.filter((r) => r.status === "draft").length,
      normalBlogUrlsUnchanged: blogArticlePathsOk,
      beltSystem: beltRow
        ? {
            title: beltRow.title,
            type: beltRow.type,
            status: beltRow.status,
            canonical_path: beltRow.canonical_path,
            blog_handle: beltRow.blog_handle,
            published_at: beltRow.published_at,
            featured_image_url: beltRow.featured_image_url,
            featured_image_alt: beltRow.featured_image_alt,
            featured_image_file_present: featuredImageReady,
            featured_image_storage_note:
              "Local public asset (copied from Desktop/BJJ Belt System.png). Stored as featured_image_url on the contents row; not uploaded to Supabase Storage in this phase. Shopify CDN reference retained for normal articles only.",
            duplicateBlogUrlPlanned: articleRows.some(
              (r) =>
                r.handle === BELT_SYSTEM_HANDLE &&
                r.canonical_path === `/blogs/blog/${BELT_SYSTEM_HANDLE}`,
            ),
            seo_title: beltRow.seo_title,
            seo_description: beltRow.seo_description,
            body_chars: beltRow.body_html?.length ?? 0,
            source_shopify_gid: beltRow.source_shopify_gid,
          }
        : null,
      sampleCanonicalPaths: articleRows.slice(0, 5).map((r) => r.canonical_path),
      newestByPublishedAt: [...articleRows]
        .filter((r) => r.published_at)
        .sort((a, b) =>
          (b.published_at || "").localeCompare(a.published_at || ""),
        )
        .slice(0, 3)
        .map((r) => ({
          title: r.title,
          published_at: r.published_at,
          canonical_path: r.canonical_path,
        })),
    },
    unaffectedWhenOnlyArticle: onlyType === "article"
      ? {
          techniques: outOfScope.filter((r) => r.type === "technique").length,
          past_events: outOfScope.filter((r) => r.type === "past_event").length,
          pages: outOfScope.filter((r) => r.type === "page").length,
          note: "With --only article, write candidates are article upserts only. Techniques, past_events, and pages are planned by the full importer but excluded from this write scope.",
        }
      : null,
    sampleTransforms: writeCandidates
      .filter((r) => r.transform_codes.length)
      .slice(0, 8)
      .map((r) => ({
        path: r.canonical_path,
        codes: r.transform_codes,
      })),
    idempotencyDemo: (() => {
      const sample = writeCandidates.find((r) => r.body_html);
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
      .update(JSON.stringify(writeCandidates.map((p) => p.source_shopify_gid)))
      .digest("hex")
      .slice(0, 16),
  };

  const reportPath = join(root, "tmp/jjb-contents-import-dry-run.json");
  try {
    writeFileSync(
      reportPath,
      JSON.stringify(
        {
          summary,
          writeCandidates: writeCandidates.map((p) => ({
            ...p,
            body_html: p.body_html ? `[${p.body_html.length} chars]` : null,
          })),
          skippedInScope: skippedInScope.map((p) => ({
            type: p.type,
            handle: p.handle,
            action: p.action,
            canonical_path: p.canonical_path,
          })),
          outOfScopeCounts: outOfScope.reduce(
            (acc, r) => {
              acc[r.type] = (acc[r.type] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          ),
        },
        null,
        2,
      ),
    );
    console.log(`Wrote report ${reportPath}`);
  } catch {
    console.log("(Could not write tmp report; printing summary only)");
  }

  console.log(JSON.stringify(summary, null, 2));

  if (!write) return;

  try {
    const result = await writeRows(writeCandidates);
    const verification = await verifyArticlesImport();
    const writeReport = {
      mode: "WRITE",
      onlyType,
      ...result,
      verification,
    };
    const writeReportPath = join(root, "tmp/jjb-contents-import-write-report.json");
    writeFileSync(writeReportPath, JSON.stringify(writeReport, null, 2));
    console.log(`\nWrote verification report ${writeReportPath}`);
    console.log(JSON.stringify(writeReport, null, 2));

    if (onlyType === "technique") {
      if (verification.techniques < 1) {
        throw new Error(
          `Expected technique rows after write, found ${verification.techniques}`,
        );
      }
      if (verification.articleCount !== 121) {
        throw new Error(
          `Article count changed during technique import: expected 121, found ${verification.articleCount}`,
        );
      }
      if (verification.pages !== 0 || verification.pastEvents !== 0) {
        throw new Error(
          `Unexpected types after technique write: pages=${verification.pages} past_events=${verification.pastEvents}`,
        );
      }
    } else if (onlyType === "article") {
      if (verification.articleCount !== 121) {
        throw new Error(
          `Expected 121 article rows, found ${verification.articleCount}`,
        );
      }
      if (verification.techniques !== 0 || verification.pages !== 0 || verification.pastEvents !== 0) {
        throw new Error(
          `Non-article types were touched: techniques=${verification.techniques} pages=${verification.pages} past_events=${verification.pastEvents}`,
        );
      }
      if (verification.beltRows.length !== 1) {
        throw new Error(
          `Expected exactly 1 belt-system row, found ${verification.beltRows.length}`,
        );
      }
      if (verification.duplicateBeltBlogUrl) {
        throw new Error("Duplicate belt-system /blogs/blog/… URL exists.");
      }
      const belt = verification.beltRows[0];
      const beltPublishedMs = belt.published_at
        ? new Date(belt.published_at).getTime()
        : NaN;
      const expectedPublishedMs = new Date(BELT_SYSTEM_PUBLISHED_AT).getTime();
      if (
        belt.type !== "article" ||
        belt.canonical_path !== `/pages/${BELT_SYSTEM_HANDLE}` ||
        beltPublishedMs !== expectedPublishedMs ||
        belt.featured_image_url !== BELT_SYSTEM_FEATURED_IMAGE.url
      ) {
        throw new Error(`Belt-system row failed checks: ${JSON.stringify(belt)}`);
      }
      if (
        verification.newest[0]?.canonical_path !==
        `/pages/${BELT_SYSTEM_HANDLE}`
      ) {
        throw new Error("Belt-system article is not the newest published article.");
      }
    }
  } catch (error) {
    console.error(
      "\nWRITE FAILED:",
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
}

main();
