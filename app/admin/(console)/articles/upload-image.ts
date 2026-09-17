"use server";

import { randomUUID } from "crypto";
import { requireAdmin } from "@/lib/admin/auth.server";
import {
  ARTICLE_IMAGES_BUCKET,
  articleImageValidationError,
  buildArticleImageObjectPath,
  normalizeArticleImageMime,
} from "@/lib/admin/article-image-upload";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UploadArticleImageResult =
  | { ok: true; publicUrl: string; path: string }
  | { ok: false; error: string };

/**
 * Upload a featured image to the KJJ `article-images` Storage bucket (public).
 * Uploaded objects are publicly addressable by URL (including draft articles).
 * Uses the cookie-backed anon client + requireAdmin (AAL2) — never the service role.
 */
export async function uploadArticleFeaturedImage(
  formData: FormData,
): Promise<UploadArticleImageResult> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "Choose an image file to upload." };
  }

  const validationError = articleImageValidationError(file);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const mime = normalizeArticleImageMime(file.type, file.name);
  if (!mime) {
    return {
      ok: false,
      error: "Only JPG, JPEG, PNG, and WebP images are allowed.",
    };
  }

  const objectPath = buildArticleImageObjectPath(
    file.name,
    mime,
    randomUUID(),
  );

  try {
    const supabase = await createSupabaseServerClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(ARTICLE_IMAGES_BUCKET)
      .upload(objectPath, buffer, {
        contentType: mime,
        upsert: false,
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("[article-image-upload]", uploadError.message);
      return {
        ok: false,
        error:
          uploadError.message.includes("Bucket not found") ||
          uploadError.message.includes("not found")
            ? "Storage bucket is not set up yet. Create the article-images bucket and policies first."
            : `Upload failed: ${uploadError.message}`,
      };
    }

    const { data } = supabase.storage
      .from(ARTICLE_IMAGES_BUCKET)
      .getPublicUrl(objectPath);

    if (!data?.publicUrl) {
      return { ok: false, error: "Upload succeeded but no public URL was returned." };
    }

    return {
      ok: true,
      publicUrl: data.publicUrl,
      path: objectPath,
    };
  } catch (error) {
    console.error("[article-image-upload]", error);
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Upload failed unexpectedly.",
    };
  }
}
