import { classPageSlugs } from "@/lib/class-pages";

/**
 * Slugs that must never be used for articles (static routes / system paths).
 * Keep in sync with generateStaticParams consumers and App Router folders.
 */
export const RESERVED_ARTICLE_SLUGS = new Set<string>([
  "about",
  "classes",
  "join-us",
  "locations",
  "contact",
  "news",
  "admin",
  "login",
  "mfa",
  "api",
  "timetable",
  "kids-timetable",
  "beginners-programme",
  "kids-class-information",
  "cookie-policy",
  "privacy-policy",
  "child-protection-policy",
  "terms-and-conditions",
  "instructors",
  "sitemap.xml",
  "robots.txt",
  ...classPageSlugs,
]);

export function isReservedArticleSlug(slug: string): boolean {
  return RESERVED_ARTICLE_SLUGS.has(slug);
}
