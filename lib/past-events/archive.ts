/**
 * Curated Past Events archive (newest → oldest).
 * Verified dates from the Sep 2026 Past Events inventory approval.
 * Canonical URLs are historical Shopify paths — never invent alternate event URLs.
 */

export type PastEventKind =
  | "seminar"
  | "competition"
  | "charity"
  | "network_history";

export type PastEventArchiveEntry = {
  /** Stable key matching contents.handle where possible */
  handle: string;
  canonicalPath: string;
  title: string;
  /** ISO date (YYYY-MM-DD) used for sort + display */
  eventDate: string;
  location: string | null;
  /** Short contextual blurb for the archive index */
  blurb: string;
  kind: PastEventKind;
  /** Eyebrow on detail pages */
  eyebrow: string;
  /** Optional local image override for the archive index card */
  imageSrc?: string;
  /**
   * Optional curated HTML for network-history detail pages.
   * When set, replaces the slim past-event poster/blurb layout.
   */
  bodyHtml?: string;
};

/** Newest → oldest. Order is authoritative for /pages/past-events. */
export const PAST_EVENTS_ARCHIVE: PastEventArchiveEntry[] = [
  {
    handle: "oli-geddes-foundation-charity-event-kingston-jiu-jitsu",
    canonicalPath:
      "/pages/oli-geddes-foundation-charity-event-kingston-jiu-jitsu",
    title: "Oli Geddes Foundation Seminar",
    eventDate: "2026-05-24",
    location: "Kingston upon Thames",
    blurb:
      "Three hours of teaching from four black belts in support of the Oli Geddes Foundation.",
    kind: "charity",
    eyebrow: "Past Event",
    imageSrc: "/images/jjb/oli-geddes-foundation-seminar.jpg",
  },
  {
    handle: "kids-club-network-interclub-competition-2026",
    canonicalPath: "/products/kids-club-network-interclub-competition-2026",
    title: "Kids Club Network Competition",
    eventDate: "2026-03-22",
    location: "Kingston upon Thames",
    blurb:
      "A friendly interclub competition for young athletes from across the Club Network.",
    kind: "competition",
    eyebrow: "Past Event",
  },
  {
    handle: "jiu-jitsu-brotherhood-club-network-adults-competition",
    canonicalPath:
      "/products/jiu-jitsu-brotherhood-club-network-adults-competition",
    title: "Adults Club Network Competition",
    eventDate: "2025-11-02",
    location: "Kingston upon Thames",
    blurb:
      "A supportive Club Network adults competition with guaranteed matches.",
    kind: "competition",
    eyebrow: "Past Event",
  },
  {
    handle: "summer-super-seminar-2025",
    canonicalPath: "/products/summer-super-seminar-2025",
    title: "Summer Super Seminar",
    eventDate: "2025-06-08",
    location: null,
    blurb:
      "An afternoon of teaching from three Club Network instructors.",
    kind: "seminar",
    eyebrow: "Past Event",
  },
  {
    handle: "2nd-summer-seaside-special-super-seminar",
    canonicalPath: "/products/2nd-summer-seaside-special-super-seminar",
    title: "Summer Seaside Special",
    eventDate: "2024-06-23",
    location: "Worthing",
    blurb:
      "The second Summer Seaside Special — a full day of Club Network teaching by the coast.",
    kind: "seminar",
    eyebrow: "Past Event",
  },
  {
    handle: "spring-super-seminar",
    canonicalPath: "/blogs/blog/spring-super-seminar",
    title: "Spring Super Seminar",
    eventDate: "2023-04-30",
    location: "Kingston upon Thames",
    blurb:
      "Four hours of teaching from four black belts, followed by an open mat.",
    kind: "seminar",
    eyebrow: "Past Event",
    imageSrc: "/images/jjb/spring-super-seminar.jpg",
  },
  {
    handle: "summer-seaside-special",
    canonicalPath: "/blogs/blog/summer-seaside-special",
    title: "Summer Seaside Special",
    eventDate: "2022-08-20",
    location: "Worthing",
    blurb:
      "The first Club Network super seminar — five hours of teaching from five black belts, then an open mat.",
    kind: "seminar",
    eyebrow: "Past Event",
    imageSrc: "/images/jjb/summer-seaside-special.jpg",
  },
  {
    handle: "bjj-in-kingston-upon-thames",
    canonicalPath: "/pages/bjj-in-kingston-upon-thames",
    title: "BJJ in Kingston-Upon-Thames",
    eventDate: "2015-09-20",
    location: "Kingston upon Thames",
    blurb:
      "High-quality Brazilian Jiu Jitsu classes in Kingston-upon-Thames — a thriving community of over 500 students.",
    kind: "network_history",
    eyebrow: "Network History",
    /** Restored Shopify page copy; student count updated to 500. */
    bodyHtml: `
<p><strong>High-Quality Brazilian Jiu Jitsu Classes in Kingston-Upon-Thames</strong></p>
<p>Kingston Jiu Jitsu is a Brazilian Jiu-Jitsu (BJJ) academy based in Kingston-upon-Thames.</p>
<p>Starting with just a handful of students in 2012, Kingston Jiu Jitsu has blossomed into a thriving community of over 500 students. Experience the warmth of our extended family atmosphere, guided by head instructor Marc Barton, a black belt mentored by the legendary Mauricio Gomes. Start your journey of personal growth at Kingston Jiu Jitsu.</p>
<p>Kingston Jiu Jitsu is renowned for its welcoming atmosphere and strong team spirit. As proud members of the Mauricio Gomes Legacy Team, we uphold the highest standards of excellence in our training.</p>
<p>If you would like to find out more about any of our classes or to book a FREE TRIAL CLASS please:</p>
<ul>
<li>email us at: <a href="mailto:admin@kingstonjiujitsu.com">admin@kingstonjiujitsu.com</a></li>
<li>or call us on: <a href="tel:+447584131335">07584 131335</a></li>
</ul>
`.trim(),
  },
];

export function pastEventArchiveByPath(
  path: string,
): PastEventArchiveEntry | undefined {
  return PAST_EVENTS_ARCHIVE.find((e) => e.canonicalPath === path);
}

export function pastEventArchiveByHandle(
  handle: string,
): PastEventArchiveEntry | undefined {
  return PAST_EVENTS_ARCHIVE.find((e) => e.handle === handle);
}

/** Ticket-product URLs that must render as past_event editorial (no shop UI). */
export const PAST_EVENT_PRODUCT_PATHS = new Set(
  PAST_EVENTS_ARCHIVE.filter((e) => e.canonicalPath.startsWith("/products/")).map(
    (e) => e.canonicalPath,
  ),
);

export function formatPastEventDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
