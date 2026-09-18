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

/** Latest published articles for homepage (newest first). */
export async function listLatestPublishedArticles(
  limit = 5,
): Promise<ContentRecord[]> {
  const supabase = await publicClientOrNull();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("contents")
    .select(CONTENT_SELECT_COLUMNS)
    .eq("type", "article")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    console.error("[content] listLatestPublishedArticles", error.message);
    return [];
  }
  return ((data ?? []) as unknown as ContentRecord[]).map((row) => mapRow(row)!);
}

/** Latest published techniques for homepage instruction strip (newest first). */
export async function listLatestPublishedTechniques(
  limit = 3,
): Promise<ContentRecord[]> {
  const supabase = await publicClientOrNull();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("contents")
    .select(CONTENT_SELECT_COLUMNS)
    .eq("type", "technique")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    console.error("[content] listLatestPublishedTechniques", error.message);
    return [];
  }
  return ((data ?? []) as unknown as ContentRecord[]).map((row) => mapRow(row)!);
}

export type ContentIndexPage = {
  items: ContentRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  q: string;
};

/** @deprecated Prefer ContentIndexPage — same shape. */
export type ArticleIndexPage = ContentIndexPage;

async function listPublishedContentPage(
  type: "article" | "technique",
  input: {
    page?: number;
    pageSize?: number;
    q?: string;
  },
): Promise<ContentIndexPage> {
  const pageSize = Math.min(Math.max(input.pageSize ?? 12, 1), 48);
  const page = Math.max(input.page ?? 1, 1);
  const q = (input.q ?? "").trim();
  const empty: ContentIndexPage = {
    items: [],
    total: 0,
    page,
    pageSize,
    totalPages: 0,
    q,
  };

  const supabase = await publicClientOrNull();
  if (!supabase) return empty;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("contents")
    .select(CONTENT_SELECT_COLUMNS, { count: "exact" })
    .eq("type", type)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .range(from, to);

  if (q) {
    const safe = q.replace(/[%_,.()]/g, " ").replace(/\s+/g, " ").trim();
    if (safe) {
      const term = `%${safe}%`;
      query = query.or(
        `title.ilike.${term},excerpt.ilike.${term},seo_description.ilike.${term}`,
      );
    }
  }

  const { data, error, count } = await query;
  if (error) {
    console.error(`[content] listPublishedContentPage(${type})`, error.message);
    return empty;
  }

  const total = count ?? 0;
  return {
    items: ((data ?? []) as unknown as ContentRecord[]).map((row) => mapRow(row)!),
    total,
    page,
    pageSize,
    totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
    q,
  };
}

/** Paginated published articles for /blogs/blog with optional title/SEO search. */
export async function listPublishedArticlesPage(input: {
  page?: number;
  pageSize?: number;
  q?: string;
}): Promise<ContentIndexPage> {
  return listPublishedContentPage("article", input);
}

/** Paginated published techniques for /blogs/techniques with optional search. */
export async function listPublishedTechniquesPage(input: {
  page?: number;
  pageSize?: number;
  q?: string;
}): Promise<ContentIndexPage> {
  return listPublishedContentPage("technique", input);
}

export async function listPublishedTechniques(): Promise<ContentRecord[]> {
  return listPublishedByType("technique");
}

export async function listPublishedPastEvents(): Promise<ContentRecord[]> {
  const supabase = await publicClientOrNull();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("contents")
    .select(CONTENT_SELECT_COLUMNS)
    .eq("type", "past_event")
    .eq("status", "published")
    .order("event_starts_at", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("[content] listPublishedPastEvents", error.message);
    return [];
  }
  return ((data ?? []) as unknown as ContentRecord[]).map((row) => mapRow(row)!);
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
