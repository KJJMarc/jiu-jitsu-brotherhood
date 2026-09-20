/**
 * JJB Phase 4 — import prepared Shopify comments into Supabase.
 *
 * Default: dry-run (no writes).
 * Live writes: --apply (requires Phase 4 write gate).
 *
 * Usage:
 *   npm run import:jjb-comments
 *   npm run import:jjb-comments:apply
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  assertJjbPhase4WriteGate,
  assessJjbPhase4WriteGate,
  JJB_AUTHORISED_PROJECT_REF,
} from "../lib/supabase/jjb-phase4-write-gate";
import {
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  requireSupabaseUrl,
} from "../lib/supabase/env";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PRIVATE_DIR = join(root, "imports/shopify/private");
const MANIFEST_PATH = join(PRIVATE_DIR, "comments-manifest.json");
const RAW_PATH = join(PRIVATE_DIR, "comments.jsonl");
const READY_PATH = join(PRIVATE_DIR, "comments-import-ready.jsonl");

const EXPECTED_PHASE2_SHA256 =
  "d8e43872d217690cad6a460b5e50d49fdabf71d7feeaa5f30d8ecf9dae35baa1";
const EXPECTED_IMPORT_READY_SHA256 =
  "60fb1fc88a09b15013d525533fa532fbb53b6ce18e87272987718aee718c2497";

const EXCLUDED_ARTICLE_HANDLES = new Set([
  "5-ways-jiujitsu-benefits-children-autism",
  "cut-weight-jiu-jitsu-competitions",
]);

const BATCH_SIZE = 25;

type ReadyRow = {
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

type ExistingComment = {
  id: string;
  content_id: string;
  parent_id: string | null;
  status: string;
  author_display_name: string;
  body_text: string;
  body_html: string | null;
  is_official_reply: boolean;
  source: string;
  source_shopify_comment_gid: string | null;
  source_shopify_article_gid: string | null;
  source_created_at: string | null;
  published_at: string | null;
};

type Plan = {
  to_insert: ReadyRow[];
  identical_existing: number;
  conflicts: number;
  conflict_gids: string[];
  by_status: Record<string, number>;
  by_content_type: Record<string, number>;
  excluded_in_ready_file: number;
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

function bump(map: Record<string, number>, key: string): void {
  map[key] = (map[key] ?? 0) + 1;
}

function verifyImmutableSources(): ReadyRow[] {
  if (!existsSync(MANIFEST_PATH) || !existsSync(RAW_PATH) || !existsSync(READY_PATH)) {
    throw new Error("Missing Phase 2/3 private artefacts under imports/shopify/private/");
  }

  const rawSha = sha256File(RAW_PATH);
  if (rawSha !== EXPECTED_PHASE2_SHA256) {
    throw new Error(
      `Phase 2 comments.jsonl SHA mismatch. expected=${EXPECTED_PHASE2_SHA256} actual=${rawSha}`,
    );
  }

  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as {
    files: { sha256_comments_jsonl: string };
  };
  if (manifest.files.sha256_comments_jsonl !== EXPECTED_PHASE2_SHA256) {
    throw new Error("Phase 2 manifest SHA does not match expected digest");
  }

  const readyBody = readFileSync(READY_PATH);
  const readySha = createHash("sha256").update(readyBody).digest("hex");
  if (readySha !== EXPECTED_IMPORT_READY_SHA256) {
    throw new Error(
      `Import-ready SHA mismatch. expected=${EXPECTED_IMPORT_READY_SHA256} actual=${readySha}`,
    );
  }

  const rows = readJsonl<ReadyRow>(READY_PATH);
  if (rows.length !== 70) {
    throw new Error(`Expected exactly 70 import-ready rows, got ${rows.length}`);
  }

  const gids = new Set<string>();
  const ids = new Set<string>();
  let excludedInReady = 0;

  for (const row of rows) {
    if (row.source !== "shopify") {
      throw new Error("Non-shopify row in import-ready file");
    }
    if (!row.source_shopify_comment_gid) {
      throw new Error("Missing source_shopify_comment_gid");
    }
    if (gids.has(row.source_shopify_comment_gid)) {
      throw new Error("Duplicate source GID in import-ready file");
    }
    if (ids.has(row.id)) {
      throw new Error("Duplicate deterministic id in import-ready file");
    }
    gids.add(row.source_shopify_comment_gid);
    ids.add(row.id);

    if (
      EXCLUDED_ARTICLE_HANDLES.has(row._meta?.content_handle) ||
      row._meta?.mapping_class === "unmapped_article"
    ) {
      excludedInReady += 1;
    }

    if (!row.private || typeof row.private !== "object") {
      throw new Error("Import-ready row missing private block");
    }
  }

  if (excludedInReady !== 0) {
    throw new Error(
      `Import-ready file contains ${excludedInReady} intentionally excluded record(s) — refuse import`,
    );
  }

  return rows;
}

function publicComparable(row: ReadyRow | ExistingComment) {
  return {
    id: row.id,
    content_id: row.content_id,
    parent_id: row.parent_id ?? null,
    status: row.status,
    author_display_name: row.author_display_name,
    body_text: row.body_text,
    body_html: row.body_html ?? null,
    is_official_reply: row.is_official_reply,
    source: row.source,
    source_shopify_comment_gid: row.source_shopify_comment_gid,
    source_shopify_article_gid: row.source_shopify_article_gid,
    source_created_at: row.source_created_at
      ? new Date(row.source_created_at).toISOString()
      : null,
    published_at: row.published_at
      ? new Date(row.published_at).toISOString()
      : null,
  };
}

function rowsEqual(a: ReadyRow, b: ExistingComment): boolean {
  return (
    JSON.stringify(publicComparable(a)) === JSON.stringify(publicComparable(b))
  );
}

function serviceClient(): SupabaseClient {
  const url = requireSupabaseUrl();
  const key = getSupabaseServiceRoleKey();
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

function anonClient(): SupabaseClient {
  const url = requireSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!key) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY missing");
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

async function fetchExistingByGids(
  supabase: SupabaseClient,
  gids: string[],
): Promise<Map<string, ExistingComment>> {
  const map = new Map<string, ExistingComment>();
  for (let i = 0; i < gids.length; i += BATCH_SIZE) {
    const batch = gids.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from("content_comments")
      .select(
        [
          "id",
          "content_id",
          "parent_id",
          "status",
          "author_display_name",
          "body_text",
          "body_html",
          "is_official_reply",
          "source",
          "source_shopify_comment_gid",
          "source_shopify_article_gid",
          "source_created_at",
          "published_at",
        ].join(","),
      )
      .in("source_shopify_comment_gid", batch);

    if (error) {
      throw new Error(`Failed to load existing comments: ${error.message}`);
    }
    for (const row of (data ?? []) as ExistingComment[]) {
      if (row.source_shopify_comment_gid) {
        map.set(row.source_shopify_comment_gid, row);
      }
    }
  }
  return map;
}

function buildPlan(ready: ReadyRow[], existing: Map<string, ExistingComment>): Plan {
  const plan: Plan = {
    to_insert: [],
    identical_existing: 0,
    conflicts: 0,
    conflict_gids: [],
    by_status: {},
    by_content_type: {},
    excluded_in_ready_file: 0,
  };

  for (const row of ready) {
    bump(plan.by_status, row.status);
    bump(plan.by_content_type, row._meta.content_type);

    const found = existing.get(row.source_shopify_comment_gid);
    if (!found) {
      plan.to_insert.push(row);
      continue;
    }
    if (rowsEqual(row, found)) {
      plan.identical_existing += 1;
      continue;
    }
    plan.conflicts += 1;
    // GID only — never log bodies/emails/names
    plan.conflict_gids.push(row.source_shopify_comment_gid);
  }

  return plan;
}

function logPlan(plan: Plan, mode: "dry-run" | "apply"): void {
  console.log(`[import] mode=${mode}`);
  console.log(`[import] project_ref=${JJB_AUTHORISED_PROJECT_REF}`);
  console.log(`[import] predicted_inserts=${plan.to_insert.length}`);
  console.log(`[import] identical_existing=${plan.identical_existing}`);
  console.log(`[import] conflicts=${plan.conflicts}`);
  console.log(`[import] by_status=${JSON.stringify(plan.by_status)}`);
  console.log(`[import] by_content_type=${JSON.stringify(plan.by_content_type)}`);
  console.log(`[import] excluded_in_ready_file=${plan.excluded_in_ready_file}`);
  if (plan.conflicts > 0) {
    console.log(
      `[import] conflict_source_gid_count=${plan.conflict_gids.length} (GIDs omitted from log for safety; see exit)`,
    );
  }
}

async function applyInserts(
  supabase: SupabaseClient,
  rows: ReadyRow[],
): Promise<void> {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const publicRows = batch.map((r) => ({
      id: r.id,
      content_id: r.content_id,
      parent_id: r.parent_id,
      status: r.status,
      author_display_name: r.author_display_name,
      body_text: r.body_text,
      body_html: r.body_html,
      is_official_reply: r.is_official_reply,
      source: r.source,
      source_shopify_comment_gid: r.source_shopify_comment_gid,
      source_shopify_article_gid: r.source_shopify_article_gid,
      source_created_at: r.source_created_at,
      published_at: r.published_at,
    }));

    const { error: publicError } = await supabase
      .from("content_comments")
      .insert(publicRows);
    if (publicError) {
      throw new Error(
        `Insert content_comments batch ${i / BATCH_SIZE + 1} failed: ${publicError.message}`,
      );
    }

    const privateRows = batch.map((r) => ({
      comment_id: r.id,
      author_email: r.private.author_email,
      ip_hash: r.private.ip_hash,
      user_agent: r.private.user_agent,
    }));

    const { error: privateError } = await supabase
      .from("content_comment_private")
      .insert(privateRows);
    if (privateError) {
      throw new Error(
        `Insert content_comment_private batch ${i / BATCH_SIZE + 1} failed: ${privateError.message}. Public rows for this batch may already exist — re-run dry-run; do not auto-delete.`,
      );
    }

    console.log(
      `[import] inserted batch ${i / BATCH_SIZE + 1}: ${batch.length} (running ${Math.min(i + batch.length, rows.length)}/${rows.length})`,
    );
  }
}

async function reconcile(supabase: SupabaseClient): Promise<Record<string, number | boolean>> {
  const { data: comments, error } = await supabase
    .from("content_comments")
    .select(
      "id, status, source, source_shopify_comment_gid, parent_id, is_official_reply, content_id",
    );
  if (error) throw new Error(`Reconcile load failed: ${error.message}`);

  const rows = comments ?? [];
  const gids = new Set<string>();
  let published = 0;
  let pending = 0;
  let shopify = 0;
  let official = 0;
  let parents = 0;
  const contentIds = new Set<string>();

  for (const r of rows) {
    if (r.status === "published") published += 1;
    if (r.status === "pending") pending += 1;
    if (r.source === "shopify") shopify += 1;
    if (r.is_official_reply) official += 1;
    if (r.parent_id) parents += 1;
    if (r.source_shopify_comment_gid) gids.add(r.source_shopify_comment_gid);
    if (r.content_id) contentIds.add(r.content_id);
  }

  const { data: contents, error: contentsError } = await supabase
    .from("contents")
    .select("id, type")
    .in("id", [...contentIds]);
  if (contentsError) {
    throw new Error(`Contents lookup failed: ${contentsError.message}`);
  }
  const typeById = new Map(
    (contents ?? []).map((c: { id: string; type: string }) => [c.id, c.type]),
  );

  let article = 0;
  let technique = 0;
  let missingContent = 0;
  for (const r of rows) {
    const t = typeById.get(r.content_id);
    if (!t) missingContent += 1;
    else if (t === "article") article += 1;
    else if (t === "technique") technique += 1;
  }

  const { count: privateCount, error: privateError } = await supabase
    .from("content_comment_private")
    .select("*", { count: "exact", head: true });
  if (privateError) {
    throw new Error(`Private count failed: ${privateError.message}`);
  }

  return {
    total_comments: rows.length,
    published,
    pending,
    shopify_source: shopify,
    unique_shopify_gids: gids.size,
    duplicate_source_gids: shopify - gids.size,
    missing_content_references: missingContent,
    article_comments: article,
    technique_comments: technique,
    official_replies: official,
    parent_relationships: parents,
    private_rows: privateCount ?? 0,
  };
}

async function verifyRls(): Promise<Record<string, number | boolean | string>> {
  const anon = anonClient();

  const { count: publishedCount, error: pubErr } = await anon
    .from("content_comments")
    .select("*", { count: "exact", head: true });
  if (pubErr) {
    return { rls_ok: false, reason: `anon content_comments: ${pubErr.message}` };
  }

  const { data: sample, error: sampleErr } = await anon
    .from("content_comments")
    .select("id, status, author_display_name, body_text")
    .limit(5);
  if (sampleErr) {
    return { rls_ok: false, reason: `anon sample: ${sampleErr.message}` };
  }

  const statuses = new Set((sample ?? []).map((r: { status?: string }) => r.status));
  const onlyPublished = [...statuses].every((s) => s === "published");

  // Private columns must not exist on the public table
  const { error: bleedErr } = await anon
    .from("content_comments")
    .select("author_email, ip_hash, user_agent")
    .limit(1);
  const privateColumnsAbsentOnPublic =
    bleedErr != null && /author_email|ip_hash|user_agent|column/i.test(bleedErr.message);

  const { count: privateAnonCount, error: privateAnonErr } = await anon
    .from("content_comment_private")
    .select("*", { count: "exact", head: true });

  const { count: eventsAnonCount, error: eventsAnonErr } = await anon
    .from("content_comment_moderation_events")
    .select("*", { count: "exact", head: true });

  // Expect permission/RLS denial or zero rows with error — never a successful private dump
  const privateBlocked = privateAnonErr != null || (privateAnonCount ?? 0) === 0;
  const eventsBlocked = eventsAnonErr != null || (eventsAnonCount ?? 0) === 0;

  return {
    rls_ok:
      publishedCount === 69 &&
      onlyPublished &&
      privateBlocked &&
      eventsBlocked &&
      privateColumnsAbsentOnPublic,
    anon_published_count: publishedCount ?? -1,
    anon_sample_only_published: onlyPublished,
    anon_private_readable: !(privateAnonErr != null),
    anon_private_count: privateAnonCount ?? -1,
    anon_moderation_events_readable: !(eventsAnonErr != null),
    anon_moderation_events_count: eventsAnonCount ?? -1,
    private_columns_absent_on_public_table: privateColumnsAbsentOnPublic,
  };
}

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  console.log("[import] JJB comments importer");
  console.log(`[import] dry_run_default=${!apply}`);

  const gate = assessJjbPhase4WriteGate();
  if (!gate.ok) {
    console.error(`[import] WRITE GATE FAILED: ${gate.reason}`);
    console.error(
      "[import] No database writes performed. Restore sb_publishable_ / sb_secret_ keys in .env.local (editor only), then re-run.",
    );
    process.exitCode = 1;
    return;
  }

  const projectRef = assertJjbPhase4WriteGate();
  console.log(`[import] write_gate_ok project_ref=${projectRef}`);

  const ready = verifyImmutableSources();
  console.log("[import] phase2_sha_ok=true");
  console.log(`[import] import_ready_sha_ok=true count=${ready.length}`);

  const supabase = serviceClient();

  // Table existence / emptiness conflict check
  const { count: existingTotal, error: existErr } = await supabase
    .from("content_comments")
    .select("*", { count: "exact", head: true });
  if (existErr) {
    throw new Error(
      `content_comments not readable (apply schema first?): ${existErr.message}`,
    );
  }

  const existing = await fetchExistingByGids(
    supabase,
    ready.map((r) => r.source_shopify_comment_gid),
  );
  const plan = buildPlan(ready, existing);
  logPlan(plan, apply ? "apply" : "dry-run");

  if (plan.conflicts > 0) {
    throw new Error(
      `Aborting: ${plan.conflicts} source-ID conflict(s) where existing row differs from prepared record. No writes.`,
    );
  }

  if (!apply) {
    console.log("[import] DRY-RUN complete — no writes");
    if (existingTotal === 0 || existingTotal == null) {
      console.log("[import] schema appears empty of comments (pre-import)");
    }
    // Still run reconcile/rls only when data already present
    if ((existingTotal ?? 0) > 0) {
      const counts = await reconcile(supabase);
      console.log(`[import] reconcile=${JSON.stringify(counts)}`);
      const rls = await verifyRls();
      console.log(`[import] rls=${JSON.stringify(rls)}`);
    }
    return;
  }

  if (plan.to_insert.length === 0) {
    console.log("[import] nothing to insert — already idempotent");
  } else {
    await applyInserts(supabase, plan.to_insert);
  }

  const counts = await reconcile(supabase);
  console.log(`[import] reconcile=${JSON.stringify(counts)}`);

  const expectedOk =
    counts.total_comments === 70 &&
    counts.published === 69 &&
    counts.pending === 1 &&
    counts.unique_shopify_gids === 70 &&
    counts.duplicate_source_gids === 0 &&
    counts.missing_content_references === 0 &&
    counts.article_comments === 66 &&
    counts.technique_comments === 4 &&
    counts.official_replies === 0 &&
    counts.parent_relationships === 0 &&
    counts.private_rows === 70;

  if (!expectedOk) {
    throw new Error(
      `Post-import reconcile mismatch: ${JSON.stringify(counts)}`,
    );
  }

  const rls = await verifyRls();
  console.log(`[import] rls=${JSON.stringify(rls)}`);
  if (!rls.rls_ok) {
    throw new Error(`RLS verification failed: ${JSON.stringify(rls)}`);
  }

  console.log("[import] SUCCESS");
}

main().catch((err) => {
  console.error("[import] FAILED");
  console.error(err instanceof Error ? err.message : "Unknown error");
  process.exitCode = 1;
});
