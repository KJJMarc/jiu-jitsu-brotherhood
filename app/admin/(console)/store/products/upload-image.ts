"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth.server";
import {
  PRODUCT_IMAGES_BUCKET,
  buildProductImageObjectPath,
  normalizeProductImageMime,
  productImageValidationError,
} from "@/lib/admin/product-image-upload";
import {
  ADMIN_STORE_PATH,
  ADMIN_STORE_PRODUCTS_PATH,
  adminStoreProductEditPath,
} from "@/lib/admin/store";
import { addAdminProductImage } from "@/lib/admin/store.server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UploadProductImageResult =
  | { ok: true; publicUrl: string; path: string }
  | { ok: false; error: string };

/**
 * Upload a product image to the `product-images` Storage bucket (public).
 * Uses the cookie-backed anon client + requireAdmin (AAL2) — never the service role.
 * Images are not linked from the public site until a later launch phase.
 */
export async function uploadProductImage(
  formData: FormData
): Promise<UploadProductImageResult> {
  await requireAdmin();

  const productId = String(formData.get("product_id") ?? "").trim();
  if (!productId) {
    return { ok: false, error: "Missing product id." };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "Choose an image file to upload." };
  }

  const validationError = productImageValidationError(file);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const mime = normalizeProductImageMime(file.type, file.name);
  if (!mime) {
    return {
      ok: false,
      error: "Only JPG, JPEG, PNG, and WebP images are allowed.",
    };
  }

  const objectPath = buildProductImageObjectPath(
    file.name,
    mime,
    randomUUID()
  );

  try {
    const supabase = await createSupabaseServerClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(objectPath, buffer, {
        contentType: mime,
        upsert: false,
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("[product-image-upload]", uploadError.message);
      return {
        ok: false,
        error:
          uploadError.message.includes("Bucket not found") ||
          uploadError.message.includes("not found")
            ? "Storage bucket is not set up yet. Apply the product-images migration first."
            : `Upload failed: ${uploadError.message}`,
      };
    }

    const { data } = supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .getPublicUrl(objectPath);

    if (!data?.publicUrl) {
      return {
        ok: false,
        error: "Upload succeeded but no public URL was returned.",
      };
    }

    const altText = String(formData.get("alt_text") ?? "").trim() || null;
    await addAdminProductImage({
      productId,
      storagePath: objectPath,
      publicUrl: data.publicUrl,
      altText,
      sourceType: "storage",
    });

    revalidatePath(adminStoreProductEditPath(productId));
    revalidatePath(ADMIN_STORE_PATH);
    revalidatePath(ADMIN_STORE_PRODUCTS_PATH);

    return { ok: true, publicUrl: data.publicUrl, path: objectPath };
  } catch (error) {
    console.error("[product-image-upload]", error);
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Upload failed unexpectedly.",
    };
  }
}
