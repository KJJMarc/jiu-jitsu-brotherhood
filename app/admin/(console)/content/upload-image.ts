"use server";

import { randomUUID } from "crypto";
import { requireAdmin } from "@/lib/admin/auth.server";
import {
  CONTENT_IMAGES_BUCKET,
  buildContentImageObjectPath,
  contentImageValidationError,
  normalizeContentImageMime,
} from "@/lib/admin/content-image-upload";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UploadContentImageResult =
  | { ok: true; publicUrl: string; path: string }
  | { ok: false; error: string };

/**
 * Upload a featured/thumbnail image to the `content-images` Storage bucket.
 * Objects are public under `media/` (AAL2 admin write). Uses the cookie-backed
 * anon client + requireAdmin — never the service role.
 */
export async function uploadContentFeaturedImage(
  formData: FormData,
): Promise<UploadContentImageResult> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "Choose an image file to upload." };
  }

  const validationError = contentImageValidationError(file);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const mime = normalizeContentImageMime(file.type, file.name);
  if (!mime) {
    return {
      ok: false,
      error: "Only JPG, JPEG, PNG, and WebP images are allowed.",
    };
  }

  const objectPath = buildContentImageObjectPath(
    file.name,
    mime,
    randomUUID(),
  );

  try {
    const supabase = await createSupabaseServerClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(CONTENT_IMAGES_BUCKET)
      .upload(objectPath, buffer, {
        contentType: mime,
        upsert: false,
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("[content-image-upload]", uploadError.message);
      return {
        ok: false,
        error:
          uploadError.message.includes("Bucket not found") ||
          uploadError.message.includes("not found")
            ? "Storage bucket is not set up yet. Create the content-images bucket and policies first."
            : `Upload failed: ${uploadError.message}`,
      };
    }

    const { data } = supabase.storage
      .from(CONTENT_IMAGES_BUCKET)
      .getPublicUrl(objectPath);

    if (!data?.publicUrl) {
      return {
        ok: false,
        error: "Upload succeeded but no public URL was returned.",
      };
    }

    return {
      ok: true,
      publicUrl: data.publicUrl,
      path: objectPath,
    };
  } catch (error) {
    console.error("[content-image-upload]", error);
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Upload failed unexpectedly.",
    };
  }
}
