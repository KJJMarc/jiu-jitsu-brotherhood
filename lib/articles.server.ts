import "server-only";

import { createSupabasePublicClient } from "@/lib/supabase/public";
import type { NewsPost } from "@/lib/news";

export type ArticleRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body_paragraphs: string[] | null;
  body_html: string | null;
  youtube_ids: string[] | null;
  categories: string[] | null;
  image_path: string | null;
  image_alt: string | null;
  status: "draft" | "published";
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
};

/** Map a published articles row to the existing NewsPost shape used by the UI. */
export function articleRowToNewsPost(row: ArticleRow): NewsPost {
  const publishedAt = row.published_at ?? new Date(0).toISOString();
  // Preserve a stable string for formatDate / sitemap; ISO is accepted.
  const date = publishedAt.includes("T")
    ? publishedAt.replace(/\.\d{3}Z$/, "").replace("T", " ").replace(/Z$/, "")
    : publishedAt;

  return {
    title: row.title,
    slug: row.slug,
    date,
    cats: row.categories ?? [],
    yt: row.youtube_ids ?? [],
    excerpt: row.excerpt ?? "",
    paras: row.body_paragraphs ?? [],
    bodyHtml: row.body_html,
    image: row.image_path,
    imageAlt: row.image_alt,
  };
}

const ARTICLE_PUBLIC_COLUMNS =
  "id, title, slug, excerpt, body_paragraphs, body_html, youtube_ids, categories, image_path, image_alt, status, published_at, seo_title, seo_description";

export async function listPublishedArticlesFromSupabase(): Promise<NewsPost[]> {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_PUBLIC_COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list published articles: ${error.message}`);
  }

  return ((data ?? []) as ArticleRow[]).map(articleRowToNewsPost);
}

export async function getPublishedArticleFromSupabase(
  slug: string,
): Promise<NewsPost | undefined> {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_PUBLIC_COLUMNS)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load article "${slug}": ${error.message}`);
  }

  if (!data) return undefined;
  return articleRowToNewsPost(data as ArticleRow);
}

export async function listPublishedArticleSlugsFromSupabase(): Promise<
  string[]
> {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from("articles")
    .select("slug")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list article slugs: ${error.message}`);
  }

  return (data ?? []).map((row) => row.slug as string);
}
