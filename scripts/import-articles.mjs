#!/usr/bin/env node
/**
 * One-off / idempotent import of lib/news.json → public.articles
 *
 * Usage:
 *   node --env-file=.env.local scripts/import-articles.mjs --dry-run
 *   node --env-file=.env.local scripts/import-articles.mjs
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Dates in news.json are interpreted as Europe/London wall times.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const dryRun = process.argv.includes("--dry-run");

const CLASS_PAGE_SLUGS = [
  "adult-classes",
  "beginners-classes",
  "kids-classes",
  "ladies-classes",
  "no-gi-classes",
  "muay-thai-classes",
  "tnt-takedowns-n-transitions",
  "open-mats",
  "seminars-and-events",
];

const RESERVED = new Set([
  "about",
  "classes",
  "join-us",
  "locations",
  "contact",
  "news",
  "admin",
  "login",
  "mfa",
  "api",
  "timetable",
  "kids-timetable",
  "beginners-programme",
  "kids-class-information",
  "cookie-policy",
  "instructors",
  "sitemap.xml",
  "robots.txt",
  ...CLASS_PAGE_SLUGS,
]);

function parseEuropeLondonDateTime(legacy) {
  const normalized = String(legacy).trim().replace(" ", "T");
  const match = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/,
  );
  if (!match) {
    const fallback = new Date(normalized);
    if (Number.isNaN(fallback.getTime())) {
      throw new Error(`Invalid article date: ${legacy}`);
    }
    return fallback;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);

  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(new Date(utcGuess))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  const asLondonWallMs = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );

  return new Date(utcGuess - (asLondonWallMs - utcGuess));
}

function loadPosts() {
  const raw = JSON.parse(
    readFileSync(join(ROOT, "lib/news.json"), "utf8"),
  );
  if (!Array.isArray(raw)) {
    throw new Error("lib/news.json must be an array");
  }
  return raw;
}

function toRow(post) {
  const slug = String(post.slug ?? "").trim();
  const title = String(post.title ?? "").trim();
  if (!slug || !title) {
    throw new Error(`Post missing slug/title: ${JSON.stringify(post).slice(0, 120)}`);
  }
  if (RESERVED.has(slug)) {
    throw new Error(`Reserved slug cannot be imported: ${slug}`);
  }

  const publishedAt = parseEuropeLondonDateTime(post.date).toISOString();

  return {
    title,
    slug,
    excerpt: String(post.excerpt ?? ""),
    body_paragraphs: Array.isArray(post.paras) ? post.paras.map(String) : [],
    youtube_ids: Array.isArray(post.yt) ? post.yt.map(String) : [],
    categories: Array.isArray(post.cats) ? post.cats.map(String) : [],
    image_path: post.image ? String(post.image) : null,
    image_alt: title,
    status: "published",
    published_at: publishedAt,
    seo_title: null,
    seo_description: null,
  };
}

async function main() {
  const posts = loadPosts().filter(
    (p) => p.slug && !RESERVED.has(String(p.slug)),
  );
  const rows = posts.map(toRow);

  console.log(
    `Prepared ${rows.length} articles from news.json (Europe/London dates).`,
  );

  if (dryRun) {
    console.log("Dry run — no database writes.");
    console.log("Sample:", JSON.stringify(rows[0], null, 2));
    console.log(`Would upsert ${rows.length} rows on conflict(slug).`);
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
    );
    process.exit(1);
  }
  if (anonKey && serviceKey === anonKey) {
    console.error("SUPABASE_SERVICE_ROLE_KEY must not be the anon key.");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const chunkSize = 50;
  let upserted = 0;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from("articles")
      .upsert(chunk, { onConflict: "slug" })
      .select("slug");

    if (error) {
      console.error("Upsert failed:", error.message);
      process.exit(1);
    }
    upserted += data?.length ?? chunk.length;
    console.log(`Upserted ${upserted}/${rows.length}`);
  }

  console.log(`Done. ${upserted} articles upserted as published.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
