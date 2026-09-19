import "server-only";

import { requireAdmin } from "@/lib/admin/auth.server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  CONTENT_SELECT_COLUMNS,
  CONTENT_TYPES,
  type ContentListItem,
  type ContentRecord,
  type ContentStatus,
  type ContentType,
  type ContentWriteInput,
} from "@/lib/content/types";
import {
  defaultBlogHandle,
  defaultCanonicalPath,
  isValidCanonicalPath,
  isValidHandle,
  normalizeCanonicalPath,
} from "@/lib/content/paths";
import { sanitizeContentHtml } from "@/lib/content/sanitize";
import { decodeBasicHtmlEntities } from "@/lib/rich-text/html";

export const ADMIN_CONTENT_PATH = "/admin/content/";
export const ADMIN_CONTENT_NEW_PATH = "/admin/content/new/";

export function adminContentEditPath(id: string): string {
  return `/admin/content/${id}/edit/`;
}

export function adminContentPreviewPath(id: string): string {
  return `/admin/content/${id}/preview/`;
}

function decodePlain(value: string | null | undefined): string | null {
  if (value == null) return null;
  const decoded = decodeBasicHtmlEntities(value.trim());
  return decoded || null;
}

export function validateContentWriteInput(
  input: ContentWriteInput,
): string | null {
  if (!CONTENT_TYPES.includes(input.type)) return "Invalid content type.";
  if (!input.title?.trim()) return "Title is required.";
  if (!isValidHandle(input.handle)) {
    return "Handle must be lowercase kebab-case (a-z, 0-9, hyphens).";
  }
  const path = normalizeCanonicalPath(input.canonical_path);
  if (!isValidCanonicalPath(path)) return "Invalid canonical path.";
  if (input.status === "published" && !input.published_at) {
    return "Published content requires a publication date.";
  }
  if (input.type === "article" && input.blog_handle !== "blog") {
    return "Articles must use blog_handle=blog.";
  }
  if (input.type === "technique" && input.blog_handle !== "techniques") {
    return "Techniques must use blog_handle=techniques.";
  }
  if (input.type === "page" && input.blog_handle) {
    return "Pages must not set blog_handle.";
  }
  return null;
}

function prepareWritePayload(input: ContentWriteInput) {
  const blog_handle = defaultBlogHandle(input.type, input.blog_handle);
  const canonical_path = normalizeCanonicalPath(
    input.canonical_path ||
      defaultCanonicalPath({
        type: input.type,
        handle: input.handle,
        blog_handle,
      }),
  );

  const rawHtml = input.body_html?.trim() || null;
  const sanitised = rawHtml ? sanitizeContentHtml(rawHtml) : null;
  const youtube_ids =
    input.youtube_ids && input.youtube_ids.length > 0
      ? input.youtube_ids
      : sanitised?.youtubeIds ?? [];

  return {
    type: input.type,
    handle: input.handle.trim(),
    blog_handle,
    title: decodeBasicHtmlEntities(input.title.trim()),
    status: input.status,
    published_at: input.status === "published" ? input.published_at : input.published_at ?? null,
    excerpt: decodeBasicHtmlEntities(input.excerpt?.trim() ?? ""),
    body_html: sanitised?.html ?? null,
    seo_title: decodePlain(input.seo_title),
    seo_description: decodePlain(input.seo_description),
    featured_image_url: input.featured_image_url?.trim() || null,
    featured_image_alt: decodePlain(input.featured_image_alt),
    youtube_ids,
    tags_public: input.tags_public ?? [],
    tags_source: input.tags_source ?? [],
    template: input.template?.trim() || null,
    noindex: Boolean(input.noindex),
    author_id: input.author_id || null,
    event_starts_at: input.event_starts_at || null,
    event_ends_at: input.event_ends_at || null,
    event_location_label: input.event_location_label?.trim() || null,
    canonical_path,
    mailerlite_form_code: input.mailerlite_form_code?.trim() || null,
    mailerlite_embed_id: input.mailerlite_embed_id?.trim() || null,
  };
}

export async function listAdminContents(filters?: {
  type?: ContentType | "all";
  status?: ContentStatus | "all";
  query?: string;
}): Promise<ContentListItem[]> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  let request = supabase
    .from("contents")
    .select(
      "id, type, handle, blog_handle, title, status, published_at, canonical_path, updated_at, noindex, template",
    )
    .order("updated_at", { ascending: false });

  if (filters?.type && filters.type !== "all") {
    request = request.eq("type", filters.type);
  }
  if (filters?.status && filters.status !== "all") {
    request = request.eq("status", filters.status);
  }
  const q = filters?.query?.trim().replace(/[^a-zA-Z0-9\s\-']/g, "");
  if (q) {
    request = request.or(
      `title.ilike.%${q}%,handle.ilike.%${q}%,canonical_path.ilike.%${q}%`,
    );
  }

  const { data, error } = await request;
  if (error) throw new Error(`Failed to list contents: ${error.message}`);
  return (data ?? []) as ContentListItem[];
}

export async function getAdminContent(
  id: string,
): Promise<ContentRecord | null> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("contents")
    .select(CONTENT_SELECT_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Failed to load content: ${error.message}`);
  return (data as ContentRecord | null) ?? null;
}

/** Admin/preview: any status by id. */
export async function getContentForPreview(
  id: string,
): Promise<ContentRecord | null> {
  return getAdminContent(id);
}

export async function createAdminContent(
  input: ContentWriteInput,
): Promise<ContentRecord> {
  await requireAdmin();
  const err = validateContentWriteInput(input);
  if (err) throw new Error(err);

  const supabase = await createSupabaseServerClient();
  const payload = prepareWritePayload(input);
  const { data, error } = await supabase
    .from("contents")
    .insert(payload)
    .select(CONTENT_SELECT_COLUMNS)
    .single();
  if (error) throw new Error(`Failed to create content: ${error.message}`);
  return data as unknown as ContentRecord;
}

export async function updateAdminContent(
  id: string,
  input: ContentWriteInput,
): Promise<ContentRecord> {
  await requireAdmin();
  const err = validateContentWriteInput(input);
  if (err) throw new Error(err);

  const supabase = await createSupabaseServerClient();
  const payload = prepareWritePayload(input);
  const { data, error } = await supabase
    .from("contents")
    .update(payload)
    .eq("id", id)
    .select(CONTENT_SELECT_COLUMNS)
    .single();
  if (error) throw new Error(`Failed to update content: ${error.message}`);
  return data as unknown as ContentRecord;
}
