import newsData from "./news.json";
import { formatArticleDate } from "@/lib/article-dates";
import { isReservedArticleSlug } from "@/lib/article-slugs";

export type NewsPost = {
  title: string;
  slug: string;
  date: string;
  cats: string[];
  yt: string[];
  excerpt: string;
  paras: string[];
  /** Optional TipTap HTML body; when set, public pages prefer this over paras. */
  bodyHtml?: string | null;
  image: string | null;
  imageAlt?: string | null;
};

export type ArticlesSource = "json" | "supabase";

/**
 * Public article data source.
 * Default remains "json" until Preview/Production cutover is approved.
 */
export function getArticlesSource(): ArticlesSource {
  const raw = process.env.ARTICLES_SOURCE?.trim().toLowerCase();
  return raw === "supabase" ? "supabase" : "json";
}

/** Legacy JSON posts, excluding reserved slugs (unchanged filtering rules). */
export const postsFromJson: NewsPost[] = (newsData as NewsPost[]).filter(
  (p) => p.slug && !isReservedArticleSlug(p.slug),
);

/** @deprecated Prefer listPublishedPosts() — kept for sync JSON callers. */
export const posts: NewsPost[] = postsFromJson;

export const postSlugs: string[] = postsFromJson.map((p) => p.slug);

export function getPostFromJson(slug: string): NewsPost | undefined {
  return postsFromJson.find((p) => p.slug === slug);
}

/** @deprecated Prefer getPublishedPost() when source may be Supabase. */
export function getPost(slug: string): NewsPost | undefined {
  return getPostFromJson(slug);
}

export function formatDate(d: string): string {
  return formatArticleDate(d);
}

export async function listPublishedPosts(): Promise<NewsPost[]> {
  if (getArticlesSource() === "supabase") {
    const { listPublishedArticlesFromSupabase } = await import(
      "@/lib/articles.server"
    );
    return listPublishedArticlesFromSupabase();
  }
  return postsFromJson;
}

export async function getPublishedPost(
  slug: string,
): Promise<NewsPost | undefined> {
  if (getArticlesSource() === "supabase") {
    const { getPublishedArticleFromSupabase } = await import(
      "@/lib/articles.server"
    );
    return getPublishedArticleFromSupabase(slug);
  }
  return getPostFromJson(slug);
}

export async function listPublishedPostSlugs(): Promise<string[]> {
  if (getArticlesSource() === "supabase") {
    const { listPublishedArticleSlugsFromSupabase } = await import(
      "@/lib/articles.server"
    );
    return listPublishedArticleSlugsFromSupabase();
  }
  return postsFromJson.map((p) => p.slug);
}
