"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ADMIN_CONTENT_PATH,
  adminContentEditPath,
  createAdminContent,
  updateAdminContent,
} from "@/lib/content/admin.server";
import type { ContentStatus, ContentType, ContentWriteInput } from "@/lib/content/types";
import { defaultBlogHandle, defaultCanonicalPath } from "@/lib/content/paths";

export type ContentFormState = { error: string | null };

function readList(formData: FormData, name: string): string[] {
  return String(formData.get(name) ?? "")
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function formToInput(formData: FormData): ContentWriteInput {
  const type = String(formData.get("type") ?? "article") as ContentType;
  const handle = String(formData.get("handle") ?? "").trim();
  const blogFromForm = String(formData.get("blog_handle") ?? "").trim();
  const blog_handle = defaultBlogHandle(
    type,
    blogFromForm || (type === "past_event" ? "blog" : null),
  );
  let canonical_path = String(formData.get("canonical_path") ?? "").trim();
  if (!canonical_path) {
    canonical_path = defaultCanonicalPath({ type, handle, blog_handle });
  }

  return {
    type,
    handle,
    blog_handle,
    title: String(formData.get("title") ?? ""),
    status: String(formData.get("status") ?? "draft") as ContentStatus,
    published_at: String(formData.get("published_at") ?? "").trim() || null,
    excerpt: String(formData.get("excerpt") ?? ""),
    body_html: String(formData.get("body_html") ?? "") || null,
    seo_title: String(formData.get("seo_title") ?? "").trim() || null,
    seo_description: String(formData.get("seo_description") ?? "").trim() || null,
    featured_image_url:
      String(formData.get("featured_image_url") ?? "").trim() || null,
    featured_image_alt:
      String(formData.get("featured_image_alt") ?? "").trim() || null,
    youtube_ids: readList(formData, "youtube_ids"),
    tags_public: readList(formData, "tags_public"),
    tags_source: readList(formData, "tags_source"),
    template: String(formData.get("template") ?? "").trim() || null,
    noindex: formData.get("noindex") === "on",
    event_starts_at: String(formData.get("event_starts_at") ?? "").trim() || null,
    event_ends_at: String(formData.get("event_ends_at") ?? "").trim() || null,
    event_location_label:
      String(formData.get("event_location_label") ?? "").trim() || null,
    canonical_path,
    mailerlite_form_code:
      String(formData.get("mailerlite_form_code") ?? "").trim() || null,
    mailerlite_embed_id:
      String(formData.get("mailerlite_embed_id") ?? "").trim() || null,
  };
}

export async function createContentAction(
  _prev: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  try {
    const created = await createAdminContent(formToInput(formData));
    revalidatePath(ADMIN_CONTENT_PATH);
    redirect(adminContentEditPath(created.id));
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    return {
      error: error instanceof Error ? error.message : "Failed to create content.",
    };
  }
}

export async function updateContentAction(
  _prev: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  try {
    const id = String(formData.get("id") ?? "");
    if (!id) return { error: "Missing content id." };
    await updateAdminContent(id, formToInput(formData));
    revalidatePath(ADMIN_CONTENT_PATH);
    revalidatePath(adminContentEditPath(id));
    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to update content.",
    };
  }
}
