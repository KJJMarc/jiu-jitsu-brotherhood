/**
 * KJJ academy hub paths with no JJB replacement. Paths are stored without a
 * trailing slash. `/about` and `/contact` are NOT listed here — they are
 * live JJB Shopify aliases that 301 to `/pages/about` and `/pages/contact`.
 *
 * Class/instructor slugs are listed here (not imported from the KJJ content
 * modules) so middleware does not bundle academy copy into the Edge runtime.
 */
export const RETIRED_ACADEMY_HUB_PATHS = [
  "/timetable",
  "/kids-timetable",
  "/classes",
  "/join-us",
  "/locations",
  "/instructors",
  "/beginners-programme",
  "/kids-class-information",
  "/book-a-class",
  "/class-timetable",
  "/yoga-classes",
  "/judo-for-bjj-classes",
  "/adult-belt-rankings",
  "/junior-belt-rankings",
  "/training-etiquette-safety",
  "/child-protection-policy",
  "/zelim-tatarashvili",
  "/contact-us",
  "/about-us",
  "/category/adults_classes",
  "/category/kids_classes",
  "/category/events",
] as const;

const RETIRED_ACADEMY_SLUGS = new Set([
  "adult-classes",
  "beginners-classes",
  "kids-classes",
  "ladies-classes",
  "no-gi-classes",
  "muay-thai-classes",
  "tnt-takedowns-n-transitions",
  "open-mats",
  "seminars-and-events",
  "master-mauricio-gomes",
  "marc-barton",
  "yiyang-ng",
  "andreas-wichmann",
  "simon-marshall",
  "dan-lau",
  "clare-barton",
  "ray-stokes",
  "iacopo-sassi",
  "charlie-villaroman",
]);

export function isRetiredAcademyPath(normalisedPath: string): boolean {
  if ((RETIRED_ACADEMY_HUB_PATHS as readonly string[]).includes(normalisedPath)) {
    return true;
  }
  const slug = normalisedPath.replace(/^\//, "");
  if (!slug || slug.includes("/")) return false;
  return RETIRED_ACADEMY_SLUGS.has(slug);
}
