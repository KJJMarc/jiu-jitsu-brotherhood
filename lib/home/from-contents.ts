import type { ContentRecord } from "@/lib/content/types";
import type { HomeArticle } from "@/lib/home/prototype";

/** Clip copy for homepage lead / cards — prefers word boundary under max. */
export function clipSeoDescription(
  text: string | null | undefined,
  max = 160,
): string {
  const cleaned = (text ?? "").replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  if (cleaned.length <= max) return cleaned;
  const slice = cleaned.slice(0, max - 1);
  const at = slice.lastIndexOf(" ");
  const base = (at > 80 ? slice.slice(0, at) : slice).trimEnd();
  return `${base}…`;
}

export function contentToHomeArticle(row: ContentRecord): HomeArticle {
  const publishedAt = row.published_at
    ? row.published_at.slice(0, 10)
    : "";

  return {
    title: row.title,
    href: row.canonical_path,
    publishedAt,
    excerpt: clipSeoDescription(row.seo_description || row.excerpt, 160),
    image: {
      src:
        row.featured_image_url?.trim() ||
        "/images/jjb/ouroboros-circle-shadow.png",
      alt: row.featured_image_alt?.trim() || row.title,
      width: 1280,
      height: 720,
    },
  };
}

/** Belt-system homepage / SEO blurb (short enough for the featured card). */
export const BELT_SYSTEM_SEO_DESCRIPTION =
  "What each BJJ belt really means — key goals, skills and mindset from white to black.";

if (BELT_SYSTEM_SEO_DESCRIPTION.length > 160) {
  throw new Error("BELT_SYSTEM_SEO_DESCRIPTION exceeds 160 characters.");
}