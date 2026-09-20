/**
 * Shared constants/helpers for Contents CMS featured-image uploads.
 * Images land in the public `content-images` bucket under `media/`
 * (AAL2 admin write — see baseline storage policies).
 */

export const CONTENT_IMAGES_BUCKET = "content-images";
export const CONTENT_IMAGES_FOLDER = "media";

/**
 * 4 MiB — under Next/Vercel Server Action body limits (4.5MB) while remaining
 * inside the content-images Storage bucket limit (5 MiB).
 */
export const CONTENT_IMAGE_MAX_BYTES = 4 * 1024 * 1024;

export const CONTENT_IMAGE_ACCEPT =
  "image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

export const CONTENT_IMAGE_ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function normalizeContentImageMime(
  mime: string,
  fileName: string,
): string | null {
  const lowerMime = mime.trim().toLowerCase();
  if (CONTENT_IMAGE_ALLOWED_MIME.has(lowerMime)) {
    return lowerMime === "image/jpg" ? "image/jpeg" : lowerMime;
  }

  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return null;
}

/** Strip path segments and unsafe characters; keep a short readable stem. */
export function sanitizeContentImageBaseName(fileName: string): string {
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

export function buildContentImageObjectPath(
  fileName: string,
  mime: string,
  uniqueId: string,
): string {
  const ext = EXT_BY_MIME[mime] ?? "jpg";
  const stem = sanitizeContentImageBaseName(fileName);
  return `${CONTENT_IMAGES_FOLDER}/${uniqueId}-${stem}.${ext}`;
}

export function contentImageValidationError(
  file: Pick<File, "name" | "type" | "size">,
): string | null {
  const mime = normalizeContentImageMime(file.type, file.name);
  if (!mime) {
    return "Only JPG, JPEG, PNG, and WebP images are allowed.";
  }
  if (file.size <= 0) {
    return "The selected file is empty.";
  }
  if (file.size > CONTENT_IMAGE_MAX_BYTES) {
    return `Image must be ${Math.round(CONTENT_IMAGE_MAX_BYTES / (1024 * 1024))} MB or smaller.`;
  }
  return null;
}
