/**
 * Apply comment email blocklist migration, then block a spam email and
 * mark matching comments as spam.
 *
 * Usage:
 *   node --env-file=.env.local --import tsx scripts/block-spam-comment-email.ts --apply --email=anitaburns68@gmail.com
 *
 * Without --apply: dry-run counts only.
 * Never prints PII beyond the email passed on the CLI and row counts.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const MIGRATION_PATH = join(
  root,
  "supabase/migrations/20260924120000_comment_email_blocklist.sql",
);

function getDbUrl(): string | null {
  return (
    process.env.SUPABASE_DB_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    null
  );
}

function argValue(name: string): string | null {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length).trim() : null;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

async function main() {
  const apply = hasFlag("apply");
  const email = (argValue("email") || "anitaburns68@gmail.com").toLowerCase();
  const applySchema = !hasFlag("skip-schema");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  if (applySchema) {
    const dbUrl = getDbUrl();
    if (!dbUrl) {
      console.error(
        "No SUPABASE_DB_URL/DATABASE_URL — apply migration SQL in the Supabase SQL Editor first:",
        MIGRATION_PATH,
      );
      if (apply) {
        throw new Error("Cannot --apply without DB URL or prior schema apply.");
      }
    } else if (!existsSync(MIGRATION_PATH)) {
      throw new Error(`Missing migration: ${MIGRATION_PATH}`);
    } else if (apply) {
      const sql = readFileSync(MIGRATION_PATH, "utf8");
      const tmp = join(tmpdir(), `jjb-blocklist-${Date.now()}.sql`);
      writeFileSync(tmp, sql, "utf8");
      try {
        execFileSync("psql", [dbUrl, "-v", "ON_ERROR_STOP=1", "-f", tmp], {
          stdio: ["ignore", "pipe", "pipe"],
        });
        console.log("Applied blocklist migration.");
      } finally {
        try {
          unlinkSync(tmp);
        } catch {
          /* ignore */
        }
      }
    } else {
      console.log("Dry-run: would apply", MIGRATION_PATH);
    }
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: siblings, error: sibError } = await supabase
    .from("content_comment_private")
    .select("comment_id")
    .eq("author_email", email);
  if (sibError) throw new Error(sibError.message);

  const ids = (siblings ?? []).map((s) => s.comment_id as string).filter(Boolean);
  console.log(`Matched private rows for email: ${ids.length}`);

  if (ids.length === 0) {
    if (apply) {
      const { error } = await supabase.from("content_comment_email_blocklist").upsert({
        email,
        note: "ops_cleanup_anita_herbal_spam",
        source_comment_id: null,
      });
      if (error) throw new Error(error.message);
      console.log("Email blocked (no matching comments).");
    } else {
      console.log("Dry-run: would block email with 0 comments.");
    }
    return;
  }

  const { data: targets, error: targetError } = await supabase
    .from("content_comments")
    .select("id, status")
    .in("id", ids);
  if (targetError) throw new Error(targetError.message);

  const byStatus: Record<string, number> = {};
  for (const t of targets ?? []) {
    const s = String(t.status);
    byStatus[s] = (byStatus[s] ?? 0) + 1;
  }
  console.log("Status breakdown:", byStatus);

  const toSpam = (targets ?? []).filter(
    (t) => t.status !== "spam" && t.status !== "deleted",
  );
  console.log(`Would mark as spam: ${toSpam.length}`);

  if (!apply) {
    console.log("Dry-run only. Re-run with --apply to block + spam.");
    return;
  }

  const { error: blockError } = await supabase
    .from("content_comment_email_blocklist")
    .upsert({
      email,
      note: "ops_cleanup_anita_herbal_spam",
      source_comment_id: ids[0] ?? null,
    });
  if (blockError) throw new Error(`blocklist upsert: ${blockError.message}`);

  if (toSpam.length > 0) {
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("content_comments")
      .update({
        status: "spam",
        moderated_at: now,
      })
      .in(
        "id",
        toSpam.map((t) => t.id),
      );
    if (updateError) throw new Error(`spam update: ${updateError.message}`);
  }

  console.log(`Done. Blocked email; marked ${toSpam.length} comment(s) as spam.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
