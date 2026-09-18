/**
 * Post-import verification for articles-only JJB contents write.
 * Read-only. Does not write.
 */
import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  requireSupabaseUrl,
} from "../lib/supabase/env";
import { assertJjbSupabaseReadyForWrites } from "../lib/supabase/jjb-project";

const BELT = "progression-the-belt-system";

async function main() {
  const projectRef = assertJjbSupabaseReadyForWrites();
  const url = requireSupabaseUrl();
  const serviceKey = getSupabaseServiceRoleKey();
  const anonKey = getSupabaseAnonKey();
  if (!serviceKey || !anonKey) throw new Error("Missing Supabase keys");

  const service = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const anon = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const count = async (
    client: typeof service,
    type?: string,
    status?: string,
  ) => {
    let q = client.from("contents").select("id", { count: "exact", head: true });
    if (type) q = q.eq("type", type);
    if (status) q = q.eq("status", status);
    const { count: c, error } = await q;
    if (error) throw new Error(error.message);
    return c ?? 0;
  };

  const { data: beltRows, error: beltErr } = await service
    .from("contents")
    .select(
      "id, type, handle, blog_handle, title, status, published_at, canonical_path, featured_image_url",
    )
    .eq("handle", BELT);
  if (beltErr) throw new Error(beltErr.message);

  const { data: dup, error: dupErr } = await service
    .from("contents")
    .select("id")
    .eq("canonical_path", `/blogs/blog/${BELT}`);
  if (dupErr) throw new Error(dupErr.message);

  const { data: newest, error: newestErr } = await service
    .from("contents")
    .select("title, published_at, canonical_path")
    .eq("type", "article")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(5);
  if (newestErr) throw new Error(newestErr.message);

  const { data: samples, error: sampleErr } = await service
    .from("contents")
    .select("title, handle, canonical_path, status")
    .eq("type", "article")
    .in("handle", [
      "fear-and-courage",
      "the-surprising-health-benefits-of-strength-training",
      "why-every-generation-thinks-jiu-jitsu-has-changed-for-the-worse",
    ]);
  if (sampleErr) throw new Error(sampleErr.message);

  const { data: anonIndex, error: anonErr } = await anon
    .from("contents")
    .select("title, canonical_path, published_at")
    .eq("type", "article")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(5);

  const report = {
    projectRef,
    articleCount: await count(service, "article"),
    publishedArticles: await count(service, "article", "published"),
    techniques: await count(service, "technique"),
    pages: await count(service, "page"),
    pastEvents: await count(service, "past_event"),
    beltRows: beltRows ?? [],
    duplicateBeltBlogUrl: (dup ?? []).length,
    newest: newest ?? [],
    samples: samples ?? [],
    anonIndexOk: !anonErr && (anonIndex?.length ?? 0) > 0,
    anonError: anonErr?.message ?? null,
    anonTop: anonIndex ?? [],
  };

  console.log(JSON.stringify(report, null, 2));

  if (report.articleCount !== 121) process.exitCode = 1;
  if (report.techniques !== 0 || report.pages !== 0 || report.pastEvents !== 0) {
    process.exitCode = 1;
  }
  if (report.beltRows.length !== 1) process.exitCode = 1;
  if (report.duplicateBeltBlogUrl !== 0) process.exitCode = 1;
  if (report.newest[0]?.canonical_path !== `/pages/${BELT}`) process.exitCode = 1;
  if (!report.anonIndexOk) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
