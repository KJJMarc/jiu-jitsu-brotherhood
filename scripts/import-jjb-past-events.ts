#!/usr/bin/env node
/**
 * Import the approved JJB Past Events archive into contents (type=past_event).
 *
 * Sources (read-only Shopify audit extract):
 * - pages.json / articles.json / products.json
 *
 * Writes curated past_event rows + ensures /pages/past-events index shell.
 * Ticket product URLs become editorial past_event pages (no shop catalogue rows).
 *
 * Usage:
 *   npx tsx scripts/import-jjb-past-events.ts
 *   npx tsx scripts/import-jjb-past-events.ts --write
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { transformShopifyHtml } from "../lib/content/import/transforms";
import {
  PAST_EVENTS_ARCHIVE,
  type PastEventArchiveEntry,
} from "../lib/past-events/archive";
import { assertJjbSupabaseReadyForWrites } from "../lib/supabase/jjb-project";
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

type ShopifyArticle = {
  id: string;
  title: string;
  handle: string;
  body: string;
  summary?: string;
  isPublished: boolean;
  publishedAt?: string;
  updatedAt?: string;
  image?: { url?: string; altText?: string };
  metafields?: { nodes?: { key: string; value: string }[] };
  blog?: { handle?: string };
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
  metafields?: { nodes?: { key: string; value: string }[] };
};

type ShopifyProduct = {
  id: string;
  title: string;
  handle: string;
  descriptionHtml?: string;
  status?: string;
  publishedAt?: string;
  updatedAt?: string;
  seo?: { title?: string | null; description?: string | null };
  media?: {
    nodes?: Array<{
      image?: { url?: string; altText?: string };
      preview?: { image?: { url?: string; altText?: string } };
    }>;
  };
};

function mf(
  nodes: { key: string; value: string }[] | undefined,
  key: string,
): string | null {
  const hit = nodes?.find((n) => n.key === key);
  return hit?.value?.trim() || null;
}

function stripHtml(raw: string): string {
  return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function eventStartsAtIso(entry: PastEventArchiveEntry): string {
  return `${entry.eventDate}T12:00:00.000Z`;
}

function firstProductImage(p: ShopifyProduct): {
  url: string | null;
  alt: string | null;
} {
  const node = p.media?.nodes?.[0];
  const url = node?.image?.url || node?.preview?.image?.url || null;
  const alt = node?.image?.altText || node?.preview?.image?.altText || null;
  return { url, alt };
}

type PlannedPastEvent = {
  type: "past_event";
  handle: string;
  blog_handle: string | null;
  title: string;
  status: "published";
  published_at: string;
  excerpt: string;
  body_html: string | null;
  seo_title: string | null;
  seo_description: string | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  youtube_ids: string[];
  canonical_path: string;
  event_starts_at: string;
  event_ends_at: null;
  event_location_label: string | null;
  source_shopify_gid: string;
  source_updated_at: string | null;
  template: string | null;
};

function planFromArchive(
  entry: PastEventArchiveEntry,
  pages: ShopifyPage[],
  articles: ShopifyArticle[],
  products: ShopifyProduct[],
): PlannedPastEvent {
  const path = entry.canonicalPath;
  const event_starts_at = eventStartsAtIso(entry);

  if (path.startsWith("/blogs/blog/")) {
    const a = articles.find((x) => x.handle === entry.handle);
    if (!a) throw new Error(`Missing article for ${entry.handle}`);
    const transformed = transformShopifyHtml(a.body || "");
    return {
      type: "past_event",
      handle: entry.handle,
      blog_handle: "blog",
      title: entry.title,
      status: "published",
      published_at: a.publishedAt || event_starts_at,
      excerpt: entry.blurb,
      body_html: transformed.html || null,
      seo_title: mf(a.metafields?.nodes, "title_tag") || a.title,
      seo_description:
        mf(a.metafields?.nodes, "description_tag") ||
        stripHtml(a.summary || "").slice(0, 160) ||
        entry.blurb,
      featured_image_url: a.image?.url || null,
      featured_image_alt: a.image?.altText || entry.title,
      youtube_ids: transformed.youtubeIds,
      canonical_path: path,
      event_starts_at,
      event_ends_at: null,
      event_location_label: entry.location,
      source_shopify_gid: a.id,
      source_updated_at: a.updatedAt || null,
      template: null,
    };
  }

  if (path.startsWith("/products/")) {
    const p = products.find((x) => x.handle === entry.handle);
    if (!p) throw new Error(`Missing product for ${entry.handle}`);
    const transformed = transformShopifyHtml(p.descriptionHtml || "");
    const image = firstProductImage(p);
    return {
      type: "past_event",
      handle: entry.handle,
      blog_handle: null,
      title: entry.title,
      status: "published",
      published_at: p.publishedAt || event_starts_at,
      excerpt: entry.blurb,
      body_html: transformed.html || null,
      seo_title: p.seo?.title || p.title,
      seo_description: p.seo?.description || entry.blurb,
      featured_image_url: image.url,
      featured_image_alt: image.alt || entry.title,
      youtube_ids: transformed.youtubeIds,
      canonical_path: path,
      event_starts_at,
      event_ends_at: null,
      event_location_label: entry.location,
      source_shopify_gid: p.id,
      source_updated_at: p.updatedAt || null,
      template: "past_event_product",
    };
  }

  // /pages/…
  const page = pages.find((x) => x.handle === entry.handle);
  if (!page) throw new Error(`Missing page for ${entry.handle}`);
  const transformed = transformShopifyHtml(page.body || "");
  const isKingston = entry.handle === "bjj-in-kingston-upon-thames";
  let bodyHtml = transformed.html || null;
  let featuredUrl: string | null = null;
  let featuredAlt: string | null = null;
  if (isKingston && bodyHtml) {
    const imgMatch = bodyHtml.match(
      /<img[^>]+src="(https:\/\/cdn\.shopify\.com[^"]+)"[^>]*>/i,
    );
    if (imgMatch) {
      featuredUrl = imgMatch[1];
      featuredAlt = "Kingston Jiu Jitsu";
      bodyHtml = bodyHtml
        .replace(/<div[^>]*>\s*<img[^>]*>\s*<\/div>/i, "")
        .replace(/<p[^>]*>\s*(?:&nbsp;|\s)*<\/p>/i, "")
        .trim();
    }
  }
  return {
    type: "past_event",
    handle: entry.handle,
    blog_handle: null,
    title: entry.title,
    status: "published",
    published_at: page.publishedAt || event_starts_at,
    excerpt: entry.blurb,
    body_html: bodyHtml,
    seo_title:
      mf(page.metafields?.nodes, "title_tag") || page.title || entry.title,
    seo_description:
      mf(page.metafields?.nodes, "description_tag") ||
      stripHtml(page.bodySummary || "").slice(0, 160) ||
      entry.blurb,
    featured_image_url: featuredUrl,
    featured_image_alt: featuredAlt,
    youtube_ids: transformed.youtubeIds,
    canonical_path: path,
    event_starts_at,
    event_ends_at: null,
    event_location_label: entry.location,
    source_shopify_gid: page.id,
    source_updated_at: page.updatedAt || null,
    template: isKingston ? "network_history" : null,
  };
}

async function main() {
  const abs = join(root, exportDir);
  for (const name of ["pages.json", "articles.json", "products.json"]) {
    if (!existsSync(join(abs, name))) {
      throw new Error(`Missing ${join(abs, name)}`);
    }
  }

  const pages = JSON.parse(
    readFileSync(join(abs, "pages.json"), "utf8"),
  ) as ShopifyPage[];
  const articles = JSON.parse(
    readFileSync(join(abs, "articles.json"), "utf8"),
  ) as ShopifyArticle[];
  const products = JSON.parse(
    readFileSync(join(abs, "products.json"), "utf8"),
  ) as ShopifyProduct[];

  const planned = PAST_EVENTS_ARCHIVE.map((entry) =>
    planFromArchive(entry, pages, articles, products),
  );

  console.log(`=== Past Events import (${write ? "WRITE" : "DRY-RUN"}) ===`);
  for (const row of planned) {
    console.log(
      `  ${row.event_starts_at.slice(0, 10)}  ${row.canonical_path}  imgs=${row.featured_image_url ? "Y" : "N"}  body=${(row.body_html || "").length}`,
    );
  }

  if (!write) {
    console.log("\nDry-run only. Re-run with --write to upsert.");
    return;
  }

  assertJjbSupabaseReadyForWrites();
  const serviceKey = getSupabaseServiceRoleKey();
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY required");
  const supabase = createClient(requireSupabaseUrl(), serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let upserted = 0;
  // Prefer matching by source_shopify_gid when an article/page already exists
  // (e.g. summer-seaside-special imported earlier as article), then path.
  for (const row of planned) {
    const payload = {
      ...row,
      tags_source: [],
      tags_public: [],
      noindex: false,
      source_shopify_author: null,
      mailerlite_form_code: null,
      mailerlite_embed_id: null,
      source_payload: {
        import: "jjb-past-events",
        archive_kind:
          PAST_EVENTS_ARCHIVE.find((e) => e.handle === row.handle)?.kind ??
          null,
      },
    };

    const { data: byGid } = await supabase
      .from("contents")
      .select("id")
      .eq("source_shopify_gid", row.source_shopify_gid)
      .maybeSingle();

    const { data: byPath } = await supabase
      .from("contents")
      .select("id")
      .eq("canonical_path", row.canonical_path)
      .maybeSingle();

    const existingId = byGid?.id || byPath?.id || null;

    if (existingId) {
      const { error } = await supabase
        .from("contents")
        .update(payload)
        .eq("id", existingId);
      if (error) throw new Error(`${row.handle}: ${error.message}`);
    } else {
      const { error } = await supabase.from("contents").insert(payload);
      if (error) throw new Error(`${row.handle}: ${error.message}`);
    }
    upserted += 1;
    console.log(`UPSERT ${row.canonical_path}`);
  }

  // Index shell is rendered by dedicated component; keep a published page
  // record so sitemap / CMS list stay coherent (body unused by UI).
  const indexPayload = {
    type: "page" as const,
    handle: "past-events",
    blog_handle: null,
    title: "Past Events",
    status: "published" as const,
    published_at: "2026-09-18T00:00:00.000Z",
    excerpt:
      "Archive of Jiu Jitsu Brotherhood Club Network seminars, competitions and network history.",
    body_html: null,
    seo_title: "Past Events | The Jiu Jitsu Brotherhood",
    seo_description:
      "Browse past Jiu Jitsu Brotherhood Club Network seminars, competitions and early network history.",
    featured_image_url: null,
    featured_image_alt: null,
    youtube_ids: [],
    tags_source: [],
    tags_public: [],
    template: "past_events_index",
    noindex: false,
    canonical_path: "/pages/past-events",
    source_shopify_gid: "jjb:seed:past-events",
    source_shopify_author: null,
    source_updated_at: null,
    mailerlite_form_code: null,
    mailerlite_embed_id: null,
    source_payload: { import: "jjb-past-events" },
  };

  const { data: indexExisting } = await supabase
    .from("contents")
    .select("id")
    .eq("canonical_path", "/pages/past-events")
    .maybeSingle();
  if (indexExisting?.id) {
    const { error } = await supabase
      .from("contents")
      .update(indexPayload)
      .eq("id", indexExisting.id);
    if (error) throw new Error(`past-events index: ${error.message}`);
  } else {
    const { error } = await supabase.from("contents").insert(indexPayload);
    if (error) throw new Error(`past-events index: ${error.message}`);
  }
  console.log("UPSERT /pages/past-events (index shell)");

  const { data: verify, error: verifyErr } = await supabase
    .from("contents")
    .select("handle,canonical_path,event_starts_at,status,type")
    .eq("type", "past_event")
    .eq("status", "published")
    .order("event_starts_at", { ascending: false });
  if (verifyErr) throw new Error(verifyErr.message);

  console.log(`\nDone. upserted=${upserted}. Published past_events:`);
  for (const row of verify ?? []) {
    console.log(
      `  ${(row.event_starts_at || "").slice(0, 10)}  ${row.canonical_path}`,
    );
  }
  if ((verify ?? []).length !== PAST_EVENTS_ARCHIVE.length) {
    throw new Error(
      `Expected ${PAST_EVENTS_ARCHIVE.length} past_events, got ${(verify ?? []).length}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
