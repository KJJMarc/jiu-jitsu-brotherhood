/**
 * Shared constants/helpers for Articles CMS featured-image uploads.
 * Images land in the public `article-images` bucket (URLs work for draft and
 * published articles). Writes are gated in app code + Storage policies by AAL2 admins.
 */

export const ARTICLE_IMAGES_BUCKET = "article-images";
export const ARTICLE_IMAGES_FOLDER = "featured";

/**
 * 4 MiB — under Next/Vercel Server Action body limits (4.5MB) while remaining
 * inside the article-images Storage bucket limit (5 MiB).
 */
export const ARTICLE_IMAGE_MAX_BYTES = 4 * 1024 * 1024;

export const ARTICLE_IMAGE_ACCEPT =
  "image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

export const ARTICLE_IMAGE_ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function normalizeArticleImageMime(mime: string, fileName: string): string | null {
  const lowerMime = mime.trim().toLowerCase();
  if (ARTICLE_IMAGE_ALLOWED_MIME.has(lowerMime)) {
    return lowerMime === "image/jpg" ? "image/jpeg" : lowerMime;
  }

  // Some browsers omit type; fall back to extension.
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return null;
}

/** Strip path segments and unsafe characters; keep a short readable stem. */
export function sanitizeArticleImageBaseName(fileName: string): string {
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

export function buildArticleImageObjectPath(
  fileName: string,
  mime: string,
  uniqueId: string,
): string {
  const ext = EXT_BY_MIME[mime] ?? "jpg";
  const stem = sanitizeArticleImageBaseName(fileName);
  return `${ARTICLE_IMAGES_FOLDER}/${uniqueId}-${stem}.${ext}`;
}

export function articleImageValidationError(
  file: Pick<File, "name" | "type" | "size">,
): string | null {
  const mime = normalizeArticleImageMime(file.type, file.name);
  if (!mime) {
    return "Only JPG, JPEG, PNG, and WebP images are allowed.";
  }
  if (file.size <= 0) {
    return "The selected file is empty.";
  }
  if (file.size > ARTICLE_IMAGE_MAX_BYTES) {
    return `Image must be ${Math.round(ARTICLE_IMAGE_MAX_BYTES / (1024 * 1024))} MB or smaller.`;
  }
  return null;
}
