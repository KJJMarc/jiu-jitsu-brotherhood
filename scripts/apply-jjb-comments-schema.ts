/**
 * JJB Phase 4 — apply ONLY the content_comments schema migration.
 *
 * Does not run `supabase db push` (would apply unrelated historical migrations).
 * Requires a Postgres connection URL in the environment for DDL:
 *   SUPABASE_DB_URL or DATABASE_URL (never commit; never log the value).
 *
 * Usage:
 *   npm run apply:jjb-comments-schema          # validate + dry inspect
 *   npm run apply:jjb-comments-schema -- --apply
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertJjbPhase4WriteGate,
  assessJjbPhase4WriteGate,
  JJB_AUTHORISED_PROJECT_REF,
} from "../lib/supabase/jjb-phase4-write-gate";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const MIGRATION_PATH = join(
  root,
  "supabase/migrations/20260920120000_content_comments.sql",
);

function getDbUrl(): string | null {
  const raw =
    process.env.SUPABASE_DB_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    "";
  return raw || null;
}

function redactUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}:${u.port || "(default)"}${u.pathname}`;
  } catch {
    return "(unparseable)";
  }
}

function validateMigrationSql(sql: string): void {
  if (sql.includes("NEW\\.updated_at") || sql.includes("NEW\\\\.updated_at")) {
    throw new Error("Migration contains escaped NEW.updated_at — refuse");
  }
  if (sql.includes("\\~\\*") || sql.includes("\\\\~\\\\*")) {
    throw new Error("Migration contains escaped ~* operator — refuse");
  }
  if (sql.includes("```")) {
    throw new Error("Migration contains Markdown fences — refuse");
  }
  if (!sql.includes("NEW.updated_at")) {
    throw new Error("Migration missing NEW.updated_at trigger body");
  }
  if (!sql.includes("~*")) {
    throw new Error("Migration missing ~* email check");
  }
  if (!sql.includes("CREATE TABLE IF NOT EXISTS public.content_comments")) {
    throw new Error("Migration missing content_comments table");
  }
  if (!sql.includes("CREATE TABLE IF NOT EXISTS public.content_comment_private")) {
    throw new Error("Migration missing content_comment_private table");
  }
  if (
    !sql.includes(
      "CREATE TABLE IF NOT EXISTS public.content_comment_moderation_events",
    )
  ) {
    throw new Error("Migration missing content_comment_moderation_events table");
  }
  if (!sql.includes("ENABLE ROW LEVEL SECURITY")) {
    throw new Error("Migration missing RLS enablement");
  }
}

function which(bin: string): string | null {
  try {
    return execFileSync("which", [bin], { encoding: "utf8" }).trim() || null;
  } catch {
    return null;
  }
}

function main(): void {
  const apply = process.argv.includes("--apply");
  console.log("[schema] JJB comments schema applicator");
  console.log(`[schema] migration=${MIGRATION_PATH}`);
  console.log(`[schema] authorised_ref=${JJB_AUTHORISED_PROJECT_REF}`);

  if (!existsSync(MIGRATION_PATH)) {
    throw new Error("Migration file missing");
  }

  const sql = readFileSync(MIGRATION_PATH, "utf8");
  validateMigrationSql(sql);
  console.log("[schema] sql_static_validation=OK");

  const gate = assessJjbPhase4WriteGate();
  if (!gate.ok) {
    console.error(`[schema] WRITE GATE FAILED: ${gate.reason}`);
    console.error("[schema] No DDL executed.");
    process.exitCode = 1;
    return;
  }
  assertJjbPhase4WriteGate();
  console.log(`[schema] write_gate_ok project_ref=${gate.projectRef}`);

  const dbUrl = getDbUrl();
  if (!dbUrl) {
    console.error(
      "[schema] BLOCKER: no SUPABASE_DB_URL / DATABASE_URL / POSTGRES_URL in environment.",
    );
    console.error(
      "[schema] PostgREST/service_role cannot execute DDL. Authorised options:",
    );
    console.error(
      "[schema]   1) Set SUPABASE_DB_URL locally to the JJB Postgres URI (editor only; do not paste in chat), then re-run with --apply",
    );
    console.error(
      "[schema]   2) Paste supabase/migrations/20260920120000_content_comments.sql into the JJB Supabase SQL Editor and run it once",
    );
    console.error(
      "[schema] Do NOT run `supabase db push` — it would apply unrelated historical migrations.",
    );
    process.exitCode = 1;
    return;
  }

  // Ensure the connection target hostname embeds the authorised project ref when using supabase hosts
  try {
    const host = new URL(dbUrl).hostname;
    if (
      host.includes("supabase") &&
      !host.includes(JJB_AUTHORISED_PROJECT_REF) &&
      !host.includes("pooler.supabase.com")
    ) {
      throw new Error(
        `DB host ${host} does not look like authorised JJB project`,
      );
    }
    // For pooler hosts, require user to include project ref in username (typical: postgres.PROJECTREF)
    const user = decodeURIComponent(new URL(dbUrl).username || "");
    if (host.includes("pooler.supabase.com") && !user.includes(JJB_AUTHORISED_PROJECT_REF)) {
      throw new Error(
        "Pooler DB URL username must include authorised JJB project ref",
      );
    }
    console.log(`[schema] db_target=${redactUrl(dbUrl)}`);
  } catch (err) {
    console.error(
      `[schema] DB URL safety check failed: ${err instanceof Error ? err.message : "unknown"}`,
    );
    process.exitCode = 1;
    return;
  }

  if (!apply) {
    console.log("[schema] DRY-RUN — SQL validated; DB URL present; no DDL executed");
    console.log("[schema] Re-run with --apply to execute this single migration file only");
    return;
  }

  const psql = which("psql");
  if (!psql) {
    console.error(
      "[schema] BLOCKER: `psql` not found on PATH. Install PostgreSQL client tools, or apply via SQL Editor.",
    );
    process.exitCode = 1;
    return;
  }

  const tmp = join(tmpdir(), `jjb-comments-schema-${Date.now()}.sql`);
  try {
    writeFileSync(tmp, sql, { encoding: "utf8", mode: 0o600 });
    execFileSync(
      psql,
      [
        dbUrl,
        "-v",
        "ON_ERROR_STOP=1",
        "-f",
        tmp,
      ],
      {
        stdio: ["ignore", "inherit", "inherit"],
        env: { ...process.env, PGPASSWORD: undefined },
      },
    );
    console.log("[schema] SUCCESS — single-file migration applied");
  } finally {
    if (existsSync(tmp)) unlinkSync(tmp);
  }
}

try {
  main();
} catch (err) {
  console.error("[schema] FAILED");
  console.error(err instanceof Error ? err.message : "Unknown error");
  process.exitCode = 1;
}
