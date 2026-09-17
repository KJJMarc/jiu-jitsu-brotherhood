/**
 * Shared constants/helpers for Store product-image uploads.
 * Images land in the public `product-images` bucket. Writes are gated by
 * requireAdmin (AAL2) in app code + Storage policies.
 */

export const PRODUCT_IMAGES_BUCKET = "product-images";
export const PRODUCT_IMAGES_FOLDER = "products";

/**
 * 4 MiB — under Next/Vercel Server Action body limits (4.5MB) while remaining
 * inside the product-images Storage bucket limit (5 MiB).
 */
export const PRODUCT_IMAGE_MAX_BYTES = 4 * 1024 * 1024;

export const PRODUCT_IMAGE_ACCEPT =
  "image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

export const PRODUCT_IMAGE_ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function normalizeProductImageMime(
  mime: string,
  fileName: string,
): string | null {
  const lowerMime = mime.trim().toLowerCase();
  if (PRODUCT_IMAGE_ALLOWED_MIME.has(lowerMime)) {
    return lowerMime === "image/jpg" ? "image/jpeg" : lowerMime;
  }

  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return null;
}

export function sanitizeProductImageBaseName(fileName: string): string {
  const base = fileName.split(/[/\\]/).pop() ?? "image";
  const withoutExt = base.replace(/\.[^.]+$/, "");
  const cleaned = withoutExt
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return cleaned || "image";
}

export function buildProductImageObjectPath(
  fileName: string,
  mime: string,
  uniqueId: string,
): string {
  const ext = EXT_BY_MIME[mime] ?? "jpg";
  const stem = sanitizeProductImageBaseName(fileName);
  return `${PRODUCT_IMAGES_FOLDER}/${uniqueId}-${stem}.${ext}`;
}

export function productImageValidationError(
  file: Pick<File, "name" | "type" | "size">,
): string | null {
  const mime = normalizeProductImageMime(file.type, file.name);
  if (!mime) {
    return "Only JPG, JPEG, PNG, and WebP images are allowed.";
  }
  if (file.size <= 0) {
    return "The selected file is empty.";
  }
  if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
    return `Image must be ${Math.round(PRODUCT_IMAGE_MAX_BYTES / (1024 * 1024))} MB or smaller.`;
  }
  return null;
}
