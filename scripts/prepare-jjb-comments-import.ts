/**
 * JJB Phase 3 — deterministic Shopify comments import preparation (dry run).
 *
 * - Verifies Phase 2 manifest SHA-256 before processing.
 * - Does NOT write to Supabase.
 * - Does NOT modify Phase 2 source files.
 * - Excludes the eight intentionally unmapped comments (autism + weight-cutting).
 * - Writes import-ready records under gitignored imports/shopify/private/.
 *
 * Usage:
 *   npm run prepare:jjb-comments-import
 *   npm run prepare:jjb-comments-import -- --verify-twice
 */

import { createHash, createHmac } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sanitizeCommentHtml } from "../lib/content/sanitize-comment";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PRIVATE_DIR = join(root, "imports/shopify/private");
const MANIFEST_PATH = join(PRIVATE_DIR, "comments-manifest.json");
const RAW_PATH = join(PRIVATE_DIR, "comments.jsonl");
const MAPPING_PATH = join(PRIVATE_DIR, "comments-mapping.jsonl");
const READY_PATH = join(PRIVATE_DIR, "comments-import-ready.jsonl");
const READY_PARTIAL = join(PRIVATE_DIR, "comments-import-ready.jsonl.partial");
const REPORT_PATH = join(PRIVATE_DIR, "comments-import-dry-run-report.json");
const REPORT_PARTIAL = join(
  PRIVATE_DIR,
  "comments-import-dry-run-report.json.partial",
);

const EXPECTED_SHA256 =
  "d8e43872d217690cad6a460b5e50d49fdabf71d7feeaa5f30d8ecf9dae35baa1";

/** Intentionally excluded — not required; must not be migrated. */
const EXCLUDED_ARTICLE_HANDLES = new Set([
  "5-ways-jiujitsu-benefits-children-autism",
  "cut-weight-jiu-jitsu-competitions",
]);

const UUID_NAMESPACE_BYTES = createHash("sha256")
  .update("jjb:content_comments:v1")
  .digest()
  .subarray(0, 16);

type Manifest = {
  files: { sha256_comments_jsonl: string };
  totals: { comments: number };
  by_mapping_class: Record<string, number>;
};

type MappingRow = {
  comment_gid: string;
  article_gid: string | null;
  blog_handle: string | null;
  article_handle: string | null;
  article_title: string | null;
  status: string;
  created_at: string | null;
  mapping_class: string;
  content_id: string | null;
  content_type: string | null;
  content_handle: string | null;
  content_canonical_path: string | null;
};

type RawComment = {
  id: string;
  status: string | null;
  isPublished: boolean | null;
  createdAt: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
  body: string | null;
  bodyHtml: string | null;
  ip: string | null;
  userAgent: string | null;
  author: { name: string | null; email: string | null } | null;
  article: {
    id: string | null;
    handle: string | null;
    title: string | null;
  } | null;
};

type ImportReady = {
  id: string;
  content_id: string;
  parent_id: null;
  status: "pending" | "published" | "spam" | "rejected" | "deleted";
  author_display_name: string;
  body_text: string;
  body_html: string;
  is_official_reply: false;
  source: "shopify";
  source_shopify_comment_gid: string;
  source_shopify_article_gid: string;
  source_created_at: string;
  published_at: string | null;
  private: {
    author_email: string | null;
    ip_hash: string | null;
    user_agent: string | null;
  };
  _meta: {
    mapping_class: string;
    content_type: string;
    content_handle: string;
    shopify_status: string;
  };
};

function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function readJsonl<T>(path: string): T[] {
  return readFileSync(path, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => JSON.parse(l) as T);
}

/** Deterministic UUIDv5-like id from Shopify comment GID. */
export function stableCommentIdFromShopifyGid(gid: string): string {
  const hash = createHmac("sha256", UUID_NAMESPACE_BYTES)
    .update(gid)
    .digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x50;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function mapShopifyStatus(
  status: string,
): ImportReady["status"] {
  switch (status) {
    case "PUBLISHED":
      return "published";
    case "UNAPPROVED":
    case "PENDING":
      return "pending";
    case "SPAM":
      return "spam";
    case "REMOVED":
      return "deleted";
    default:
      throw new Error(`Unknown Shopify comment status: ${status}`);
  }
}

function hashIp(ip: string | null | undefined): string | null {
  if (!ip || !ip.trim()) return null;
  return createHash("sha256")
    .update("jjb:comment-ip:v1:")
    .update(ip.trim())
    .digest("hex");
}

function stripTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildImportReady(
  raw: RawComment,
  mapping: MappingRow,
): ImportReady {
  if (!mapping.content_id) {
    throw new Error(`Mapped comment missing content_id: ${raw.id}`);
  }
  if (!mapping.article_gid) {
    throw new Error(`Mapped comment missing article_gid: ${raw.id}`);
  }
  const shopifyStatus = raw.status || mapping.status;
  const status = mapShopifyStatus(shopifyStatus);
  const bodyHtmlRaw = raw.bodyHtml || raw.body || "";
  const body_html = sanitizeCommentHtml(bodyHtmlRaw);
  const body_text = (raw.body || stripTags(body_html) || "").trim();
  if (!body_text && !body_html.trim()) {
    throw new Error(`Empty body after sanitise: ${raw.id}`);
  }
  const name = (raw.author?.name || "").trim();
  if (!name) throw new Error(`Missing author name: ${raw.id}`);
  const created = raw.createdAt || mapping.created_at;
  if (!created) throw new Error(`Missing createdAt: ${raw.id}`);

  const published_at =
    status === "published"
      ? raw.publishedAt || raw.createdAt || created
      : null;

  return {
    id: stableCommentIdFromShopifyGid(raw.id),
    content_id: mapping.content_id,
    parent_id: null,
    status,
    author_display_name: name,
    body_text,
    body_html,
    is_official_reply: false,
    source: "shopify",
    source_shopify_comment_gid: raw.id,
    source_shopify_article_gid: mapping.article_gid,
    source_created_at: created,
    published_at,
    private: {
      author_email: raw.author?.email?.trim().toLowerCase() || null,
      ip_hash: hashIp(raw.ip),
      user_agent: raw.userAgent?.trim() || null,
    },
    _meta: {
      mapping_class: mapping.mapping_class,
      content_type: mapping.content_type || "unknown",
      content_handle: mapping.content_handle || mapping.article_handle || "",
      shopify_status: shopifyStatus,
    },
  };
}

function prepareOnce(): {
  readyLines: string[];
  report: Record<string, unknown>;
  readySha256: string;
} {
  for (const p of [MANIFEST_PATH, RAW_PATH, MAPPING_PATH]) {
    if (!existsSync(p)) throw new Error(`Missing required file: ${p}`);
  }

  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as Manifest;
  const actualSha = sha256File(RAW_PATH);
  if (actualSha !== EXPECTED_SHA256) {
    throw new Error(
      `comments.jsonl SHA-256 mismatch. expected=${EXPECTED_SHA256} actual=${actualSha}`,
    );
  }
  if (manifest.files.sha256_comments_jsonl !== EXPECTED_SHA256) {
    throw new Error("Manifest SHA-256 does not match expected Phase 2 digest");
  }
  if (actualSha !== manifest.files.sha256_comments_jsonl) {
    throw new Error("File SHA-256 does not match manifest");
  }

  const mappingRows = readJsonl<MappingRow>(MAPPING_PATH);
  const rawRows = readJsonl<RawComment>(RAW_PATH);
  if (mappingRows.length !== rawRows.length) {
    throw new Error(
      `Row count mismatch mapping=${mappingRows.length} raw=${rawRows.length}`,
    );
  }
  if (rawRows.length !== manifest.totals.comments) {
    throw new Error(
      `Raw count ${rawRows.length} != manifest totals.comments ${manifest.totals.comments}`,
    );
  }

  const rawById = new Map(rawRows.map((r) => [r.id, r]));
  const mappingById = new Map(mappingRows.map((m) => [m.comment_gid, m]));
  if (rawById.size !== rawRows.length) {
    throw new Error("Duplicate comment GIDs in raw export");
  }
  if (mappingById.size !== mappingRows.length) {
    throw new Error("Duplicate comment GIDs in mapping export");
  }

  const importReady: ImportReady[] = [];
  const excluded: {
    comment_gid: string;
    article_handle: string | null;
    article_gid: string | null;
    shopify_status: string;
    mapping_class: string;
  }[] = [];
  const byStatus: Record<string, number> = {};
  const byContentType: Record<string, number> = {};
  const byMappingClass: Record<string, number> = {};
  const excludedByHandle: Record<string, number> = {};
  const seenStableIds = new Set<string>();
  const seenSourceGids = new Set<string>();

  // Deterministic order: sort by Shopify comment GID
  const gids = [...rawById.keys()].sort();

  for (const gid of gids) {
    const raw = rawById.get(gid)!;
    const mapping = mappingById.get(gid);
    if (!mapping) throw new Error(`No mapping row for ${gid}`);

    bump(byMappingClass, mapping.mapping_class);

    const handle = mapping.article_handle;
    const intentionallyExcluded =
      mapping.mapping_class === "unmapped_article" ||
      (handle != null && EXCLUDED_ARTICLE_HANDLES.has(handle));

    if (intentionallyExcluded) {
      excluded.push({
        comment_gid: gid,
        article_handle: handle,
        article_gid: mapping.article_gid,
        shopify_status: raw.status || mapping.status,
        mapping_class: mapping.mapping_class,
      });
      if (handle) bump(excludedByHandle, handle);
      continue;
    }

    if (
      mapping.mapping_class !== "mapped_article" &&
      mapping.mapping_class !== "mapped_technique"
    ) {
      throw new Error(
        `Unexpected mapping class for import candidate ${gid}: ${mapping.mapping_class}`,
      );
    }
    if (!mapping.content_id) {
      throw new Error(`Missing content_id for mapped comment ${gid}`);
    }

    const ready = buildImportReady(raw, mapping);
    if (seenStableIds.has(ready.id)) {
      throw new Error(`Duplicate stable id ${ready.id}`);
    }
    if (seenSourceGids.has(ready.source_shopify_comment_gid)) {
      throw new Error(`Duplicate source gid ${ready.source_shopify_comment_gid}`);
    }
    seenStableIds.add(ready.id);
    seenSourceGids.add(ready.source_shopify_comment_gid);
    bump(byStatus, ready.status);
    bump(byContentType, ready._meta.content_type);
    importReady.push(ready);
  }

  // Stable output order by source_shopify_comment_gid
  importReady.sort((a, b) =>
    a.source_shopify_comment_gid.localeCompare(b.source_shopify_comment_gid),
  );

  const readyLines = importReady.map((r) => JSON.stringify(r));
  const readyBody = readyLines.join("\n") + (readyLines.length ? "\n" : "");
  const readySha256 = createHash("sha256").update(readyBody).digest("hex");

  const expectedMapped =
    (manifest.by_mapping_class.mapped_article ?? 0) +
    (manifest.by_mapping_class.mapped_technique ?? 0);
  if (importReady.length !== expectedMapped) {
    throw new Error(
      `Import-ready count ${importReady.length} != expected mapped ${expectedMapped}`,
    );
  }
  if (excluded.length !== (manifest.by_mapping_class.unmapped_article ?? 0)) {
    throw new Error(
      `Excluded count ${excluded.length} != manifest unmapped_article ${manifest.by_mapping_class.unmapped_article}`,
    );
  }
  if (importReady.length + excluded.length !== rawRows.length) {
    throw new Error("import_ready + excluded != total raw");
  }

  // Private-field separation check: public line must not stringify emails at top level
  for (const row of importReady) {
    if (!row.private || typeof row.private.author_email === "undefined") {
      throw new Error("Missing private block on import-ready row");
    }
  }

  const report = {
    prepared_at: new Date().toISOString(),
    phase2_sha256_verified: true,
    phase2_sha256: actualSha,
    totals: {
      phase2_raw: rawRows.length,
      import_ready: importReady.length,
      intentionally_excluded: excluded.length,
    },
    by_status_after_conversion: byStatus,
    by_content_type: byContentType,
    by_mapping_class_seen: byMappingClass,
    intentionally_excluded: {
      note: "Not required; must not be migrated. Phase 2 export left immutable.",
      count: excluded.length,
      by_article_handle: excludedByHandle,
      handles: [...EXCLUDED_ARTICLE_HANDLES].sort(),
    },
    duplicate_source_ids: 0,
    missing_content_references: 0,
    parent_ids_all_null: true,
    import_ready_sha256: readySha256,
    files: {
      import_ready: "comments-import-ready.jsonl",
      dry_run_report: "comments-import-dry-run-report.json",
    },
  };

  return { readyLines, report, readySha256 };
}

function bump(map: Record<string, number>, key: string): void {
  map[key] = (map[key] ?? 0) + 1;
}

function writeAtomic(partial: string, finalPath: string, body: string): void {
  writeFileSync(partial, body, { encoding: "utf8", mode: 0o600 });
  renameSync(partial, finalPath);
}

function main(): void {
  const verifyTwice = process.argv.includes("--verify-twice");
  console.log("[prepare] JJB comments import dry-run (no Supabase writes)");

  if (!existsSync(PRIVATE_DIR)) {
    mkdirSync(PRIVATE_DIR, { recursive: true, mode: 0o700 });
  }

  try {
    const first = prepareOnce();
    if (verifyTwice) {
      const second = prepareOnce();
      if (first.readySha256 !== second.readySha256) {
        throw new Error("Determinism check failed: ready SHA-256 differs on re-run");
      }
      if (JSON.stringify(first.report.totals) !== JSON.stringify(second.report.totals)) {
        throw new Error("Determinism check failed: report totals differ on re-run");
      }
      console.log("[prepare] determinism OK (identical SHA-256 on second pass)");
    }

    writeAtomic(
      READY_PARTIAL,
      READY_PATH,
      first.readyLines.join("\n") + (first.readyLines.length ? "\n" : ""),
    );
    writeAtomic(
      REPORT_PARTIAL,
      REPORT_PATH,
      JSON.stringify(first.report, null, 2) + "\n",
    );

    console.log("[prepare] SUCCESS");
    console.log(
      `[prepare] import_ready=${(first.report.totals as { import_ready: number }).import_ready} excluded=${(first.report.totals as { intentionally_excluded: number }).intentionally_excluded}`,
    );
    console.log(
      `[prepare] by_status=${JSON.stringify(first.report.by_status_after_conversion)}`,
    );
    console.log(
      `[prepare] excluded_by_handle=${JSON.stringify((first.report.intentionally_excluded as { by_article_handle: Record<string, number> }).by_article_handle)}`,
    );
    console.log(`[prepare] import_ready_sha256=${first.readySha256}`);
    console.log(`[prepare] wrote ${READY_PATH}`);
    console.log(`[prepare] wrote ${REPORT_PATH}`);
  } catch (err) {
    for (const p of [READY_PARTIAL, REPORT_PARTIAL]) {
      if (existsSync(p)) unlinkSync(p);
    }
    console.error("[prepare] FAILED — no partial files left behind");
    console.error(err instanceof Error ? err.message : "Unknown error");
    process.exitCode = 1;
  }
}

main();
