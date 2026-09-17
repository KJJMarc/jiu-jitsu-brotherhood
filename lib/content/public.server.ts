import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isJjbContentBackendAvailable } from "@/lib/supabase/jjb-project";
import {
  CONTENT_SELECT_COLUMNS,
  type ContentRecord,
  type ContentType,
} from "@/lib/content/types";
import { normalizeCanonicalPath } from "@/lib/content/paths";

function mapRow(row: ContentRecord | null): ContentRecord | null {
  if (!row) return null;
  return {
    ...row,
    youtube_ids: row.youtube_ids ?? [],
    tags_public: row.tags_public ?? [],
    tags_source: row.tags_source ?? [],
  };
}

async function publicClientOrNull() {
  if (!isJjbContentBackendAvailable()) return null;
  try {
    return await createSupabaseServerClient();
  } catch {
    return null;
  }
}

export async function getPublishedContentByCanonicalPath(
  path: string,
): Promise<ContentRecord | null> {
  const supabase = await publicClientOrNull();
  if (!supabase) return null;

  const canonical_path = normalizeCanonicalPath(path);
  const { data, error } = await supabase
    .from("contents")
    .select(CONTENT_SELECT_COLUMNS)
    .eq("canonical_path", canonical_path)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("[content] getPublishedContentByCanonicalPath", error.message);
    return null;
  }
  return mapRow(data as ContentRecord | null);
}

export async function getPublishedArticleByBlogHandle(
  blogHandle: string,
  handle: string,
): Promise<ContentRecord | null> {
  const supabase = await publicClientOrNull();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("contents")
    .select(CONTENT_SELECT_COLUMNS)
    .eq("blog_handle", blogHandle)
    .eq("handle", handle)
    .eq("status", "published")
    .in("type", ["article", "technique", "past_event"])
    .maybeSingle();

  if (error) {
    console.error("[content] getPublishedArticleByBlogHandle", error.message);
    return null;
  }
  return mapRow(data as ContentRecord | null);
}

export async function listPublishedByType(
  type: ContentType,
): Promise<ContentRecord[]> {
  const supabase = await publicClientOrNull();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("contents")
    .select(CONTENT_SELECT_COLUMNS)
    .eq("type", type)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("[content] listPublishedByType", error.message);
    return [];
  }
  return ((data ?? []) as unknown as ContentRecord[]).map((row) => mapRow(row)!);
}

export async function listPublishedArticles(): Promise<ContentRecord[]> {
  return listPublishedByType("article");
}

export async function listPublishedTechniques(): Promise<ContentRecord[]> {
  return listPublishedByType("technique");
}

export async function listPublishedPastEvents(): Promise<ContentRecord[]> {
  return listPublishedByType("past_event");
}

export async function getPublishedPageByHandle(
  handle: string,
): Promise<ContentRecord | null> {
  return getPublishedContentByCanonicalPath(`/pages/${handle}`);
}

/**
 * Sitemap entries: published + not noindex.
 * Empty until import; never invents rows.
 */
export async function listSitemapContentPaths(): Promise<
  { path: string; lastModified: string }[]
> {
  const supabase = await publicClientOrNull();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("contents")
    .select("canonical_path, updated_at, published_at, noindex")
    .eq("status", "published")
    .eq("noindex", false);

  if (error) {
    console.error("[content] listSitemapContentPaths", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    path: row.canonical_path as string,
    lastModified: (row.updated_at || row.published_at || new Date().toISOString()) as string,
  }));
}
