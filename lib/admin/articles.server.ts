import "server-only";

import { requireAdmin } from "@/lib/admin/auth.server";
import {
  validateArticleWriteInput,
  type AdminArticle,
  type AdminArticleListItem,
  type ArticleWriteInput,
} from "@/lib/admin/articles";
import { isReservedArticleSlug } from "@/lib/article-slugs";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type {
  AdminArticle,
  AdminArticleListItem,
  ArticleWriteInput,
} from "@/lib/admin/articles";

export {
  ADMIN_ARTICLE_NEW_PATH,
  ADMIN_ARTICLES_PATH,
  adminArticleEditPath,
  adminArticlePreviewPath,
  fromDatetimeLocalValue,
  slugifyArticleTitle,
  splitCsvToList,
  splitLinesToList,
  toDatetimeLocalValue,
} from "@/lib/admin/articles";

const ADMIN_ARTICLE_COLUMNS =
  "id, title, slug, excerpt, body_paragraphs, body_html, youtube_ids, categories, image_path, image_alt, status, published_at, seo_title, seo_description, created_at, updated_at";

function assertWritable(input: ArticleWriteInput) {
  const error = validateArticleWriteInput(input, isReservedArticleSlug);
  if (error) throw new Error(error);
}

export async function listAdminArticles(
  query?: string,
  sortDir: "asc" | "desc" = "desc",
): Promise<AdminArticleListItem[]> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  let request = supabase
    .from("articles")
    .select("id, title, slug, status, published_at, updated_at")
    // Newest published first by default; drafts (null published_at) stay at the end.
    .order("published_at", {
      ascending: sortDir === "asc",
      nullsFirst: false,
    })
    .order("updated_at", { ascending: false });

  const q = query?.trim().replace(/[^a-zA-Z0-9\s\-']/g, "");
  if (q) {
    request = request.or(`title.ilike.%${q}%,slug.ilike.%${q}%`);
  }

  const { data, error } = await request;
  if (error) {
    throw new Error(`Failed to list articles: ${error.message}`);
  }

  return (data ?? []) as AdminArticleListItem[];
}

export async function getAdminArticleCounts(): Promise<{
  published: number;
  draft: number;
}> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  // JJB editorial content lives in `contents` (type=article), not the legacy
  // Kingston `articles` table.
  const [publishedResult, draftResult] = await Promise.all([
    supabase
      .from("contents")
      .select("id", { count: "exact", head: true })
      .eq("type", "article")
      .eq("status", "published"),
    supabase
      .from("contents")
      .select("id", { count: "exact", head: true })
      .eq("type", "article")
      .eq("status", "draft"),
  ]);

  if (publishedResult.error) {
    throw new Error(
      `Failed to count published articles: ${publishedResult.error.message}`,
    );
  }
  if (draftResult.error) {
    throw new Error(
      `Failed to count draft articles: ${draftResult.error.message}`,
    );
  }

  return {
    published: publishedResult.count ?? 0,
    draft: draftResult.count ?? 0,
  };
}

export async function getAdminArticle(
  id: string,
): Promise<AdminArticle | null> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("articles")
    .select(ADMIN_ARTICLE_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load article: ${error.message}`);
  }

  return (data as AdminArticle | null) ?? null;
}

export async function createAdminArticle(
  input: ArticleWriteInput,
): Promise<{ id: string }> {
  const session = await requireAdmin();
  assertWritable(input);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("articles")
    .insert({
      ...input,
      created_by: session.userId,
      updated_by: session.userId,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error(`An article with slug “${input.slug}” already exists.`);
    }
    throw new Error(`Failed to create article: ${error.message}`);
  }

  return { id: data.id as string };
}

export async function updateAdminArticle(
  id: string,
  input: ArticleWriteInput,
): Promise<void> {
  const session = await requireAdmin();
  assertWritable(input);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("articles")
    .update({
      ...input,
      updated_by: session.userId,
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      throw new Error(`An article with slug “${input.slug}” already exists.`);
    }
    throw new Error(`Failed to update article: ${error.message}`);
  }

  if (!data) {
    throw new Error(
      "Article not found or you do not have permission to edit it.",
    );
  }
}
