/**
 * Phase 5 — read-only live RLS / count checks (no writes, no PII logged).
 *
 *   npm run verify:jjb-comments-live
 */

import { createClient } from "@supabase/supabase-js";
import { assessJjbPhase4WriteGate } from "../lib/supabase/jjb-phase4-write-gate";
import {
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  requireSupabaseUrl,
} from "../lib/supabase/env";
import { PUBLIC_COMMENT_SELECT } from "../lib/content/comments-types";

async function main() {
  const gate = assessJjbPhase4WriteGate();
  if (!gate.ok) {
    console.error("[verify] gate failed:", gate.reason);
    process.exitCode = 1;
    return;
  }

  const url = requireSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  const svcKey = getSupabaseServiceRoleKey();
  if (!anonKey || !svcKey) {
    console.error("[verify] missing keys");
    process.exitCode = 1;
    return;
  }

  const anon = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const svc = createClient(url, svcKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { count: anonPublished, error: anonErr } = await anon
    .from("content_comments")
    .select("id", { count: "exact", head: true });
  if (anonErr) throw new Error(anonErr.message);

  const { count: svcTotal } = await svc
    .from("content_comments")
    .select("id", { count: "exact", head: true });
  const { count: svcPending } = await svc
    .from("content_comments")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  const { count: svcPublished } = await svc
    .from("content_comments")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");

  const { error: privateErr } = await anon
    .from("content_comment_private")
    .select("comment_id", { count: "exact", head: true });
  const { error: eventsErr } = await anon
    .from("content_comment_moderation_events")
    .select("id", { count: "exact", head: true });

  const { error: bleedErr } = await anon
    .from("content_comments")
    .select("author_email")
    .limit(1);

  const { data: sample } = await anon
    .from("content_comments")
    .select(PUBLIC_COMMENT_SELECT)
    .limit(5);
  const onlyPublished = (sample ?? []).every(
    (r: { status?: string }) => r.status === "published",
  );

  const { count: articleComments } = await svc
    .from("content_comments")
    .select("id, contents!inner(type)", { count: "exact", head: true })
    .eq("contents.type", "article");
  const { count: techniqueComments } = await svc
    .from("content_comments")
    .select("id, contents!inner(type)", { count: "exact", head: true })
    .eq("contents.type", "technique");

  const result = {
    project_ref: gate.projectRef,
    anon_published_count: anonPublished ?? -1,
    svc_total: svcTotal ?? -1,
    svc_published: svcPublished ?? -1,
    svc_pending: svcPending ?? -1,
    article_comments: articleComments ?? -1,
    technique_comments: techniqueComments ?? -1,
    anon_private_blocked: privateErr != null,
    anon_events_blocked: eventsErr != null,
    private_column_absent: bleedErr != null,
    sample_only_published: onlyPublished,
  };

  const ok =
    result.project_ref === "ftdrmuggvejpbkybpwgt" &&
    result.anon_published_count === 69 &&
    result.svc_total === 70 &&
    result.svc_published === 69 &&
    result.svc_pending === 1 &&
    result.article_comments === 66 &&
    result.technique_comments === 4 &&
    result.anon_private_blocked &&
    result.anon_events_blocked &&
    result.private_column_absent &&
    result.sample_only_published;

  console.log("[verify]", JSON.stringify(result));
  console.log(ok ? "[verify] ALL_PASS" : "[verify] FAIL");
  if (!ok) process.exitCode = 1;
}

main().catch((err) => {
  console.error("[verify] FAILED", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
