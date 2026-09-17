/**
 * Customer-facing product kind labels for the private storefront preview
 * (and future public shop). Maps internal product_type + title cues —
 * does not change database product_type.
 */

export type StorefrontProductKind =
  | "Merchandise"
  | "Class"
  | "Course"
  | "Event";

export function storefrontProductKindLabel(input: {
  productType: "physical" | "non_shipping";
  title: string;
  slug?: string | null;
}): StorefrontProductKind {
  if (input.productType === "physical") return "Merchandise";

  const haystack = `${input.title} ${input.slug ?? ""}`.toLowerCase();

  // Seminars / competitions first so they never fall through as Class/Course.
  if (
    /\b(seminar|competition|tournament|event)\b/.test(haystack)
  ) {
    return "Event";
  }

  // Multi-week / beginners programmes.
  if (/\b(course|beginners?|beginner)\b/.test(haystack)) {
    return "Course";
  }

  // Single sessions / drop-ins.
  if (/\b(drop[\s-]?in|class|payment)\b/.test(haystack)) {
    return "Class";
  }

  // Safe default for other non-shipping items.
  return "Class";
}

/** Strip Shopify-ish inline noise so storefront CSS controls presentation. */
export function sanitizeStorefrontDescriptionHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<\/?(?:meta|style|script)[^>]*>/gi, "")
    .replace(/\sstyle=(?:"[^"]*"|'[^']*')/gi, "")
    .replace(/\sdata-[a-z0-9_-]+=(?:"[^"]*"|'[^']*')/gi, "")
    .replace(/\sclass=(?:"[^"]*"|'[^']*')/gi, "")
    .replace(/\s(?:width|height)=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/<p>\s*<\/p>/gi, "")
    .trim();
}
