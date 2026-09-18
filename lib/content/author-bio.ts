import type { ContentRecord } from "@/lib/content/types";

/** Canonical Marc Barton bio shown on his articles. */
export const MARC_BARTON_BIO = {
  heading: "About the author",
  paragraphs: [
    "Marc Barton is a Brazilian Jiu Jitsu black belt, educator, and former doctor with a background in human physiology and medicine. He holds a BSc in Physiology and an MBBS medical degree, and spent over a decade working on the frontline in emergency and intensive care medicine.",
    "Now teaching Jiu Jitsu full time as the head instructor at Kingston Jiu Jitsu, Marc brings a rare blend of scientific depth and real-world experience to his coaching. His approach focuses on biomechanics, skill progression, and longevity – especially for those training into their 30s, 40s, and beyond.",
  ],
  kingstonHref: "https://www.kingstonjiujitsu.com",
  kingstonLabel: "Kingston Jiu Jitsu",
} as const;

const ABOUT_HEADING_RE = /About the authors?/i;
const MARC_BIO_SIGNATURE_RE =
  /Marc Barton is a Brazilian Jiu Jitsu black belt/i;

/**
 * Strip a trailing “About the author(s)” block from editorial HTML so we can
 * render a consistent component instead (avoids duplicates / partial bios).
 */
export function stripAboutAuthorSection(html: string): string {
  if (!html || !ABOUT_HEADING_RE.test(html)) return html;

  // Match a heading/paragraph whose visible text starts with “About the author”
  // (allow nested bold/italic/span wrappers), then drop everything after it.
  const stripped = html.replace(
    /<(?:p|h2|h3|h4)\b[^>]*>\s*(?:<(?:b|strong|em|i|span)\b[^>]*>\s*)*About the authors?\s*(?:<\/(?:b|strong|em|i|span)>\s*)*<\/(?:p|h2|h3|h4)>[\s\S]*$/i,
    "",
  );
  return stripped.replace(/(?:<p[^>]*>\s*(?:&nbsp;|\s)*<\/p>\s*)+$/i, "").trimEnd();
}

/** Guest / co-author bios that should stay in the article body. */
export function hasNonMarcAboutAuthor(html: string | null | undefined): boolean {
  if (!html || !ABOUT_HEADING_RE.test(html)) return false;
  return !MARC_BIO_SIGNATURE_RE.test(html);
}

/**
 * Attach the canonical Marc Barton bio on articles that are his (or that have
 * no guest about block). Guest-author about sections are left untouched.
 */
export function shouldAttachMarcBartonBio(content: ContentRecord): boolean {
  if (content.type !== "article") return false;
  const author = (content.source_shopify_author || "").trim().toLowerCase();
  if (author.includes("marc barton")) return true;
  if (hasNonMarcAboutAuthor(content.body_html)) return false;
  // JJB shopify author is usually “JJB Admin”; treat as Marc unless a guest bio exists.
  return true;
}
