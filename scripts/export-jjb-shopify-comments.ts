/**
 * JJB Phase 2 — read-only Shopify Admin GraphQL comments export.
 *
 * - Never mutates Shopify (queries only).
 * - Never writes to Supabase (optional read-only mapping SELECT).
 * - Writes raw PII only under gitignored imports/shopify/private/.
 * - Logs aggregates only (no emails, IPs, or comment bodies).
 *
 * Usage:
 *   npm run export:jjb-comments
 *   node --env-file=.env.local --import tsx scripts/export-jjb-shopify-comments.ts
 *
 * Required env (local ignored file / shell only — never commit):
 *   SHOPIFY_SHOP_DOMAIN=jiu-jitsu-brotherhood.myshopify.com
 *   Either:
 *     SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET
 *       (Dev Dashboard app — client_credentials grant → short-lived token)
 *     or SHOPIFY_ADMIN_ACCESS_TOKEN
 *       (legacy Admin API access token, if you have one)
 * Optional:
 *   SHOPIFY_ADMIN_API_VERSION=2026-07
 */

import { createHash } from "node:crypto";
import {
  chmodSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PRIVATE_DIR = join(root, "imports/shopify/private");
const RAW_PATH = join(PRIVATE_DIR, "comments.jsonl");
const RAW_PARTIAL = join(PRIVATE_DIR, "comments.jsonl.partial");
const MANIFEST_PATH = join(PRIVATE_DIR, "comments-manifest.json");
const MANIFEST_PARTIAL = join(PRIVATE_DIR, "comments-manifest.json.partial");
const MAPPING_PATH = join(PRIVATE_DIR, "comments-mapping.jsonl");
const MAPPING_PARTIAL = join(PRIVATE_DIR, "comments-mapping.jsonl.partial");

/** From Phase 1 audit — preserve as unmapped_article, never discard. */
const KNOWN_UNMAPPED_ARTICLE_GIDS = new Set([
  "gid://shopify/Article/405425782844", // autism benefits
  "gid://shopify/Article/405425520700", // weight cutting
  "gid://shopify/Article/605902209306", // low-back pain
]);

const DEFAULT_API_VERSION = "2026-07";
const PAGE_SIZE = 50;
const MAX_RETRIES = 8;

type MappingClass =
  | "mapped_article"
  | "mapped_technique"
  | "mapped_other_content"
  | "unmapped_article"
  | "missing_source_article"
  | "ambiguous";

type ContentsRow = {
  id: string;
  type: string;
  handle: string;
  title: string;
  canonical_path: string;
  status: string;
  source_shopify_gid: string | null;
};

/**
 * Resolve an Admin API access token without logging it.
 * Prefer Dev Dashboard client credentials; fall back to a static Admin token.
 */
async function resolveAdminAccessToken(): Promise<{
  token: string;
  source: "client_credentials" | "admin_access_token";
}> {
  const staticToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim();
  const clientId = process.env.SHOPIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET?.trim();

  if (clientId && clientSecret) {
    const url = `https://${shopDomain()}/admin/oauth/access_token`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      const safe = detail.replace(/shpat_[a-zA-Z0-9]+/g, "[redacted]");
      throw new Error(
        `Shopify client_credentials token request failed HTTP ${res.status}${safe ? `: ${safe.slice(0, 200)}` : ""}. Confirm the app is installed on this shop and has read_content.`,
      );
    }
    const json = (await res.json()) as {
      access_token?: string;
      scope?: string;
      expires_in?: number;
    };
    if (!json.access_token) {
      throw new Error("Shopify token response missing access_token");
    }
    // Never log access_token. Scope string is non-secret and useful for audits.
    if (json.scope) {
      console.log(`[export] token scopes: ${json.scope}`);
    }
    if (typeof json.expires_in === "number") {
      console.log(`[export] token expires_in=${json.expires_in}s`);
    }
    return { token: json.access_token, source: "client_credentials" };
  }

  if (staticToken) {
    return { token: staticToken, source: "admin_access_token" };
  }

  throw new Error(
    "Missing Shopify credentials. Set SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET (preferred) or SHOPIFY_ADMIN_ACCESS_TOKEN in .env.local. Do not paste secrets into chat.",
  );
}

function shopDomain(): string {
  const raw =
    process.env.SHOPIFY_SHOP_DOMAIN?.trim() ||
    process.env.SHOPIFY_STORE_DOMAIN?.trim() ||
    "jiu-jitsu-brotherhood.myshopify.com";
  return raw.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function apiVersion(): string {
  return (
    process.env.SHOPIFY_ADMIN_API_VERSION?.trim() || DEFAULT_API_VERSION
  );
}

function graphqlUrl(): string {
  return `https://${shopDomain()}/admin/api/${apiVersion()}/graphql.json`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function yearFromIso(iso: string | null | undefined): string {
  if (!iso) return "unknown";
  const y = iso.slice(0, 4);
  return /^\d{4}$/.test(y) ? y : "unknown";
}

function bump(map: Record<string, number>, key: string, n = 1): void {
  map[key] = (map[key] ?? 0) + n;
}

async function shopifyGraphql<T>(
  token: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  let attempt = 0;
  while (true) {
    attempt += 1;
    const res = await fetch(graphqlUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (res.status === 429 || res.status >= 500) {
      if (attempt >= MAX_RETRIES) {
        throw new Error(
          `Shopify GraphQL HTTP ${res.status} after ${MAX_RETRIES} retries`,
        );
      }
      const retryAfter = Number(res.headers.get("retry-after") || "0");
      const waitMs = Math.max(
        retryAfter * 1000,
        Math.min(30_000, 500 * 2 ** (attempt - 1)),
      );
      console.log(`[export] throttle/retry HTTP ${res.status}; wait ${waitMs}ms`);
      await sleep(waitMs);
      continue;
    }

    if (!res.ok) {
      throw new Error(`Shopify GraphQL HTTP ${res.status}`);
    }

    const json = (await res.json()) as {
      data?: T;
      errors?: { message: string; extensions?: { code?: string } }[];
      extensions?: { cost?: { throttleStatus?: { currentlyAvailable?: number } } };
    };

    if (json.errors?.length) {
      const throttled = json.errors.some(
        (e) =>
          /throttl/i.test(e.message) ||
          e.extensions?.code === "THROTTLED",
      );
      if (throttled && attempt < MAX_RETRIES) {
        const waitMs = Math.min(30_000, 1000 * 2 ** (attempt - 1));
        console.log(`[export] GraphQL throttled; wait ${waitMs}ms`);
        await sleep(waitMs);
        continue;
      }
      throw new Error(
        `Shopify GraphQL errors: ${json.errors.map((e) => e.message).join("; ")}`,
      );
    }

    if (!json.data) throw new Error("Shopify GraphQL returned no data");

    const available =
      json.extensions?.cost?.throttleStatus?.currentlyAvailable;
    if (typeof available === "number" && available < 100) {
      await sleep(400);
    }

    return json.data;
  }
}

async function restCommentCount(token: string): Promise<number | null> {
  const url = `https://${shopDomain()}/admin/api/${apiVersion()}/comments/count.json`;
  try {
    const res = await fetch(url, {
      headers: { "X-Shopify-Access-Token": token },
    });
    if (!res.ok) {
      console.log(`[export] REST comments/count HTTP ${res.status} (optional)`);
      return null;
    }
    const json = (await res.json()) as { count?: number };
    return typeof json.count === "number" ? json.count : null;
  } catch {
    console.log("[export] REST comments/count unavailable (optional)");
    return null;
  }
}

async function introspectCommentFields(token: string): Promise<Set<string>> {
  const data = await shopifyGraphql<{
    __type: { fields: { name: string }[] | null } | null;
  }>(
    token,
    `query CommentIntrospection {
      __type(name: "Comment") {
        fields { name }
      }
    }`,
  );
  const names = new Set((data.__type?.fields ?? []).map((f) => f.name));
  if (!names.size) {
    throw new Error(
      'GraphQL type "Comment" not found or empty — check API version and read_content scope.',
    );
  }
  return names;
}

function buildCommentsQuery(fields: Set<string>): string {
  const has = (n: string) => fields.has(n);
  const commentBits: string[] = ["id"];
  if (has("status")) commentBits.push("status");
  if (has("isPublished")) commentBits.push("isPublished");
  if (has("createdAt")) commentBits.push("createdAt");
  if (has("publishedAt")) commentBits.push("publishedAt");
  if (has("updatedAt")) commentBits.push("updatedAt");
  if (has("body")) commentBits.push("body");
  if (has("bodyHtml")) commentBits.push("bodyHtml");
  if (has("ip")) commentBits.push("ip");
  if (has("userAgent")) commentBits.push("userAgent");
  if (has("author")) {
    commentBits.push(`author { name email }`);
  }
  if (has("article")) {
    commentBits.push(`article {
      id
      handle
      title
      blog { id handle title }
    }`);
  }
  // Parent/reply — include only if schema exposes them
  for (const candidate of [
    "parentId",
    "parent_id",
    "parent",
    "replyTo",
    "reply_to",
  ]) {
    if (has(candidate)) {
      if (candidate === "parent" || candidate === "replyTo") {
        commentBits.push(`${candidate} { id }`);
      } else {
        commentBits.push(candidate);
      }
    }
  }

  return `query CommentsPage($first: Int!, $after: String) {
    comments(first: $first, after: $after, sortKey: ID) {
      pageInfo { hasNextPage endCursor }
      nodes {
        ${commentBits.join("\n        ")}
      }
    }
  }`;
}

type RawComment = Record<string, unknown> & {
  id?: string;
  status?: string;
  isPublished?: boolean;
  createdAt?: string;
  publishedAt?: string | null;
  updatedAt?: string | null;
  body?: string | null;
  bodyHtml?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  author?: { name?: string | null; email?: string | null } | null;
  article?: {
    id?: string | null;
    handle?: string | null;
    title?: string | null;
    blog?: {
      id?: string | null;
      handle?: string | null;
      title?: string | null;
    } | null;
  } | null;
  parent?: { id?: string } | null;
  parentId?: string | null;
};

function parentCommentId(c: RawComment): string | null {
  if (typeof c.parentId === "string" && c.parentId) return c.parentId;
  if (c.parent && typeof c.parent.id === "string") return c.parent.id;
  return null;
}

function classifyMapping(
  articleGid: string | null,
  hits: ContentsRow[],
): MappingClass {
  if (!articleGid) return "missing_source_article";
  if (hits.length > 1) return "ambiguous";
  if (hits.length === 1) {
    const t = hits[0].type;
    if (t === "article") return "mapped_article";
    if (t === "technique") return "mapped_technique";
    return "mapped_other_content";
  }
  // Preserve known Phase-1 unmapped articles explicitly
  if (KNOWN_UNMAPPED_ARTICLE_GIDS.has(articleGid)) return "unmapped_article";
  return "unmapped_article";
}

async function loadContentsByGid(): Promise<Map<string, ContentsRow[]>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const map = new Map<string, ContentsRow[]>();
  if (!url || !key) {
    console.log(
      "[export] Supabase env missing — mapping file will mark destinations unknown; raw export still proceeds.",
    );
    return map;
  }
  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await sb
    .from("contents")
    .select(
      "id,type,handle,title,canonical_path,status,source_shopify_gid",
    )
    .not("source_shopify_gid", "is", null);
  if (error) {
    throw new Error(`Supabase read-only contents select failed: ${error.message}`);
  }
  for (const row of (data ?? []) as ContentsRow[]) {
    const gid = row.source_shopify_gid;
    if (!gid) continue;
    const list = map.get(gid) ?? [];
    list.push(row);
    map.set(gid, list);
  }
  console.log(`[export] loaded ${map.size} contents rows with source_shopify_gid`);
  return map;
}

function cleanupPartials(): void {
  for (const p of [RAW_PARTIAL, MANIFEST_PARTIAL, MAPPING_PARTIAL]) {
    if (existsSync(p)) unlinkSync(p);
  }
}

function atomicReplace(partial: string, finalPath: string): void {
  renameSync(partial, finalPath);
  try {
    chmodSync(finalPath, 0o600);
  } catch {
    /* ignore */
  }
}

async function main(): Promise<void> {
  console.log("[export] JJB Shopify comments — read-only export");
  console.log(`[export] shop=${shopDomain()} api=${apiVersion()}`);

  if (!existsSync(PRIVATE_DIR)) {
    mkdirSync(PRIVATE_DIR, { recursive: true, mode: 0o700 });
  }
  try {
    chmodSync(PRIVATE_DIR, 0o700);
  } catch {
    /* ignore */
  }

  const { token, source } = await resolveAdminAccessToken();
  console.log(`[export] auth=${source}`);

  const previousRawExists = existsSync(RAW_PATH);
  cleanupPartials();

  const fieldNames = await introspectCommentFields(token);
  console.log(
    `[export] Comment fields available: ${[...fieldNames].sort().join(", ")}`,
  );
  const query = buildCommentsQuery(fieldNames);
  const hasParentField = ["parentId", "parent", "replyTo", "reply_to"].some(
    (f) => fieldNames.has(f),
  );

  const restCount = await restCommentCount(token);
  if (restCount != null) {
    console.log(`[export] REST comments/count = ${restCount}`);
  }

  const contentsByGid = await loadContentsByGid();

  const stream = createWriteStream(RAW_PARTIAL, { encoding: "utf8", mode: 0o600 });
  const mappingStream = createWriteStream(MAPPING_PARTIAL, {
    encoding: "utf8",
    mode: 0o600,
  });

  const seenIds = new Set<string>();
  let duplicateGids = 0;
  let total = 0;
  let pages = 0;
  let paginationComplete = false;
  let after: string | null = null;

  const byBlog: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const byYear: Record<string, number> = {};
  const byMapping: Record<string, number> = {};
  const byArticle: Record<string, number> = {};
  let missingArticleGid = 0;
  let missingName = 0;
  let missingEmail = 0;
  let emptyBody = 0;
  let htmlBody = 0;
  let withParent = 0;
  let earliest: string | null = null;
  let latest: string | null = null;
  const knownUnmappedCommentCounts: Record<string, number> = {
    "gid://shopify/Article/405425782844": 0,
    "gid://shopify/Article/405425520700": 0,
    "gid://shopify/Article/605902209306": 0,
  };

  try {
    while (true) {
      const data = await shopifyGraphql<{
        comments: {
          pageInfo: { hasNextPage: boolean; endCursor: string | null };
          nodes: RawComment[];
        };
      }>(token, query, { first: PAGE_SIZE, after });

      pages += 1;
      const { nodes, pageInfo } = data.comments;
      console.log(
        `[export] page ${pages}: +${nodes.length} comments (running total before dedupe check: ${total + nodes.length})`,
      );

      for (const node of nodes) {
        const id = typeof node.id === "string" ? node.id : null;
        if (!id) {
          throw new Error("Comment node missing id — aborting incomplete export");
        }
        if (seenIds.has(id)) {
          duplicateGids += 1;
          continue;
        }
        seenIds.add(id);
        total += 1;

        const articleGid =
          typeof node.article?.id === "string" ? node.article.id : null;
        const blogHandle = node.article?.blog?.handle || "(none)";
        const status = node.status || "(unknown)";
        const createdAt = node.createdAt || null;
        const body = typeof node.body === "string" ? node.body : "";
        const bodyHtml =
          typeof node.bodyHtml === "string" ? node.bodyHtml : "";
        const name = node.author?.name?.trim() || "";
        const email = node.author?.email?.trim() || "";
        const parentId = parentCommentId(node);

        if (!articleGid) missingArticleGid += 1;
        if (!name) missingName += 1;
        if (!email) missingEmail += 1;
        if (!body.trim() && !bodyHtml.trim()) emptyBody += 1;
        if (looksLikeHtml(bodyHtml) || looksLikeHtml(body)) htmlBody += 1;
        if (parentId) withParent += 1;

        bump(byBlog, blogHandle);
        bump(byStatus, status);
        bump(byYear, yearFromIso(createdAt));
        if (articleGid) bump(byArticle, articleGid);

        if (articleGid && articleGid in knownUnmappedCommentCounts) {
          knownUnmappedCommentCounts[articleGid] += 1;
        }

        if (createdAt) {
          if (!earliest || createdAt < earliest) earliest = createdAt;
          if (!latest || createdAt > latest) latest = createdAt;
        }

        const hits = articleGid ? contentsByGid.get(articleGid) ?? [] : [];
        const mappingClass = classifyMapping(articleGid, hits);
        bump(byMapping, mappingClass);

        // Full raw record for private store (PII stays in gitignored file only)
        const rawLine = JSON.stringify({
          id,
          status: node.status ?? null,
          isPublished: node.isPublished ?? null,
          createdAt: node.createdAt ?? null,
          publishedAt: node.publishedAt ?? null,
          updatedAt: node.updatedAt ?? null,
          body: node.body ?? null,
          bodyHtml: node.bodyHtml ?? null,
          ip: node.ip ?? null,
          userAgent: node.userAgent ?? null,
          author: {
            name: node.author?.name ?? null,
            email: node.author?.email ?? null,
          },
          article: {
            id: articleGid,
            handle: node.article?.handle ?? null,
            title: node.article?.title ?? null,
            blog: {
              id: node.article?.blog?.id ?? null,
              handle: node.article?.blog?.handle ?? null,
              title: node.article?.blog?.title ?? null,
            },
          },
          parentCommentId: parentId,
        });
        stream.write(rawLine + "\n");

        const primary = hits[0] ?? null;
        const mapLine = JSON.stringify({
          comment_gid: id,
          article_gid: articleGid,
          blog_handle: blogHandle === "(none)" ? null : blogHandle,
          article_handle: node.article?.handle ?? null,
          article_title: node.article?.title ?? null,
          status,
          created_at: createdAt,
          mapping_class: mappingClass,
          content_id: primary?.id ?? null,
          content_type: primary?.type ?? null,
          content_handle: primary?.handle ?? null,
          content_canonical_path: primary?.canonical_path ?? null,
          content_status: primary?.status ?? null,
          known_phase1_unmapped: articleGid
            ? KNOWN_UNMAPPED_ARTICLE_GIDS.has(articleGid)
            : false,
          // lengths only — no PII
          author_name_len: name.length,
          author_email_len: email.length,
          body_len: body.length,
          body_html_len: bodyHtml.length,
          has_html: looksLikeHtml(bodyHtml) || looksLikeHtml(body),
          has_parent: Boolean(parentId),
        });
        mappingStream.write(mapLine + "\n");
      }

      if (!pageInfo.hasNextPage) {
        paginationComplete = true;
        break;
      }
      if (!pageInfo.endCursor) {
        throw new Error(
          "hasNextPage true but endCursor missing — aborting incomplete export",
        );
      }
      after = pageInfo.endCursor;
    }

    stream.end();
    mappingStream.end();
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        stream.on("finish", () => resolve());
        stream.on("error", reject);
      }),
      new Promise<void>((resolve, reject) => {
        mappingStream.on("finish", () => resolve());
        mappingStream.on("error", reject);
      }),
    ]);

    if (!paginationComplete) {
      throw new Error("Pagination did not complete");
    }

    const rawBuf = readFileSync(RAW_PARTIAL);
    const sha256 = createHash("sha256").update(rawBuf).digest("hex");

    const articlesWithComments = Object.keys(byArticle).length;
    const restReconcile =
      restCount == null
        ? { available: false as const }
        : {
            available: true as const,
            rest_count: restCount,
            export_unique_gids: total,
            match: restCount === total,
          };

    const manifest = {
      exported_at: new Date().toISOString(),
      shop_domain: shopDomain(),
      api_version: apiVersion(),
      read_only: true,
      graphql_endpoint: `/admin/api/${apiVersion()}/graphql.json`,
      pagination: {
        page_size: PAGE_SIZE,
        pages,
        completed: paginationComplete,
      },
      schema: {
        comment_fields: [...fieldNames].sort(),
        parent_or_reply_fields_present: hasParentField,
      },
      totals: {
        comments: total,
        unique_comment_gids: seenIds.size,
        duplicate_gids_skipped: duplicateGids,
        articles_with_comments: articlesWithComments,
        missing_source_article_gid: missingArticleGid,
      },
      by_blog_handle: byBlog,
      by_status: byStatus,
      by_year: byYear,
      by_mapping_class: byMapping,
      quality: {
        missing_author_name: missingName,
        missing_author_email: missingEmail,
        empty_body: emptyBody,
        html_body: htmlBody,
        with_parent_or_reply: withParent,
      },
      dates: {
        earliest_created_at: earliest,
        latest_created_at: latest,
      },
      known_unmapped_articles: {
        note: "Phase 1 articles with no Supabase destination — comments preserved, not discarded",
        by_article_gid_comment_counts: knownUnmappedCommentCounts,
        handles: {
          "gid://shopify/Article/405425782844":
            "5-ways-jiujitsu-benefits-children-autism",
          "gid://shopify/Article/405425520700":
            "cut-weight-jiu-jitsu-competitions",
          "gid://shopify/Article/605902209306":
            "how-to-overcome-low-back-pain-in-brazilian-jiu-jitsu",
        },
      },
      rest_count_reconcile: restReconcile,
      files: {
        raw: "comments.jsonl",
        mapping: "comments-mapping.jsonl",
        sha256_comments_jsonl: sha256,
      },
      previous_raw_preserved_on_failure: previousRawExists,
    };

    writeFileSync(MANIFEST_PARTIAL, JSON.stringify(manifest, null, 2) + "\n", {
      encoding: "utf8",
      mode: 0o600,
    });

    // Promote partials only after full success
    atomicReplace(RAW_PARTIAL, RAW_PATH);
    atomicReplace(MAPPING_PARTIAL, MAPPING_PATH);
    atomicReplace(MANIFEST_PARTIAL, MANIFEST_PATH);

    console.log("[export] SUCCESS");
    console.log(`[export] comments=${total} pages=${pages} sha256=${sha256}`);
    console.log(`[export] by_status=${JSON.stringify(byStatus)}`);
    console.log(`[export] by_blog=${JSON.stringify(byBlog)}`);
    console.log(`[export] by_mapping=${JSON.stringify(byMapping)}`);
    console.log(
      `[export] known_unmapped_comment_counts=${JSON.stringify(knownUnmappedCommentCounts)}`,
    );
    if (restReconcile.available) {
      console.log(
        `[export] REST reconcile match=${restReconcile.match} rest=${restReconcile.rest_count} export=${restReconcile.export_unique_gids}`,
      );
    }
    console.log(`[export] wrote ${RAW_PATH}`);
    console.log(`[export] wrote ${MAPPING_PATH}`);
    console.log(`[export] wrote ${MANIFEST_PATH}`);
  } catch (err) {
    cleanupPartials();
    console.error(
      "[export] FAILED — previous successful export left untouched (if any).",
    );
    console.error(
      err instanceof Error ? err.message : "Unknown export error",
    );
    process.exitCode = 1;
  }
}

main();
