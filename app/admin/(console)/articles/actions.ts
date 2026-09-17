"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth.server";
import {
  ADMIN_ARTICLES_PATH,
  adminArticleEditPath,
  createAdminArticle,
  fromDatetimeLocalValue,
  slugifyArticleTitle,
  splitCsvToList,
  updateAdminArticle,
  type ArticleWriteInput,
} from "@/lib/admin/articles.server";
import { htmlToParagraphs } from "@/lib/rich-text/html";

export type ArticleFormState = {
  error: string | null;
};

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function isNextRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

function parseArticleFormData(formData: FormData): ArticleWriteInput {
  const title = String(formData.get("title") ?? "").trim();
  const slugRaw = String(formData.get("slug") ?? "").trim();
  const slug = (slugRaw || slugifyArticleTitle(title)).toLowerCase();

  const statusRaw = String(formData.get("status") ?? "draft");
  const status = statusRaw === "published" ? "published" : "draft";

  const publishedRaw = String(formData.get("published_at") ?? "");
  let published_at = fromDatetimeLocalValue(publishedRaw);
  if (status === "published" && !published_at) {
    published_at = new Date().toISOString();
  }
  if (status === "draft" && !publishedRaw.trim()) {
    published_at = null;
  }

  const bodyHtmlRaw = String(formData.get("body_html") ?? "").trim();
  const body_html =
    !bodyHtmlRaw || bodyHtmlRaw === "<p></p>" ? null : bodyHtmlRaw;
  const body_paragraphs = body_html ? htmlToParagraphs(body_html) : [];

  return {
    title,
    slug,
    excerpt: String(formData.get("excerpt") ?? ""),
    body_paragraphs,
    body_html,
    youtube_ids: splitCsvToList(String(formData.get("youtube_ids") ?? "")),
    categories: splitCsvToList(String(formData.get("categories") ?? "")),
    image_path: emptyToNull(String(formData.get("image_path") ?? "")),
    image_alt: emptyToNull(String(formData.get("image_alt") ?? "")),
    status,
    published_at,
    seo_title: emptyToNull(String(formData.get("seo_title") ?? "")),
    seo_description: emptyToNull(String(formData.get("seo_description") ?? "")),
  };
}

function revalidateArticlePaths(slug: string) {
  revalidatePath(ADMIN_ARTICLES_PATH);
  revalidatePath("/blogs/blog");
  revalidatePath(`/${slug}/`);
}

export async function createArticleAction(
  _prev: ArticleFormState,
  formData: FormData,
): Promise<ArticleFormState> {
  await requireAdmin();

  try {
    const input = parseArticleFormData(formData);
    const { id } = await createAdminArticle(input);
    revalidateArticlePaths(input.slug);
    redirect(adminArticleEditPath(id));
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    return {
      error:
        error instanceof Error ? error.message : "Failed to create article.",
    };
  }
}

export async function updateArticleAction(
  _prev: ArticleFormState,
  formData: FormData,
): Promise<ArticleFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    return { error: "Missing article id." };
  }

  try {
    const input = parseArticleFormData(formData);
    await updateAdminArticle(id, input);
    revalidateArticlePaths(input.slug);
    redirect(adminArticleEditPath(id));
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    return {
      error:
        error instanceof Error ? error.message : "Failed to update article.",
    };
  }
}
