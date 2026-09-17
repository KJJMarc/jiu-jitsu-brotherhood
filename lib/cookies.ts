/**
 * Cookie consent configuration and the "legal minimum" register of cookies used
 * on the site. This module is the single source of truth for:
 *   - the consent banner and the cookie policy page (human-readable info), and
 *   - the shape of the stored consent record.
 *
 * When a backend/admin dashboard is added later, this register (and the
 * ConsentRecord payload) can be moved to / mirrored in the database with no
 * change to the banner's public behaviour.
 */

export const cookieConsent = {
  /** First-party cookie that stores the visitor's choice (proof of consent). */
  cookieName: "kjj_cookie_consent",
  /**
   * Bump when the cookie policy materially changes — existing visitors are then
   * re-prompted because their stored version no longer matches.
   */
  version: 2,
  /** How long the consent choice is remembered (PECR-friendly ~6 months). */
  maxAgeDays: 182,
} as const;

export type CookieCategoryId = "necessary" | "analytics" | "marketing";

export type CookieDetail = {
  name: string;
  provider: string;
  purpose: string;
  duration: string;
};

export type CookieCategory = {
  id: CookieCategoryId;
  name: string;
  /** Strictly-necessary cookies cannot be declined. */
  required: boolean;
  description: string;
  /** Cookies currently set in this category (empty = none active yet). */
  cookies: CookieDetail[];
};

/**
 * The register of cookies. Keep this accurate to what the site actually sets.
 * Analytics/marketing are listed so the categories exist for consent, but are
 * only populated once those services are switched on in a later phase.
 */
export const cookieCategories: CookieCategory[] = [
  {
    id: "necessary",
    name: "Strictly necessary",
    required: true,
    description:
      "Required for the website to function and to remember your cookie choice. These are always on and do not require consent.",
    cookies: [
      {
        name: cookieConsent.cookieName,
        provider: "Kingston Jiu Jitsu",
        purpose: "Stores your cookie preferences so we don't ask again.",
        duration: "6 months",
      },
    ],
  },
  {
    id: "analytics",
    name: "Analytics",
    required: false,
    description:
      "Help us understand how visitors use the site so we can improve it. Set only with your consent.",
    cookies: [
      {
        name: "_ga / _ga_*",
        provider: "Google Analytics",
        purpose: "Distinguishes visitors when a GA4 Measurement ID (G-…) is enabled in Admin → Tracking & Pixels.",
        duration: "Up to 2 years",
      },
    ],
  },
  {
    id: "marketing",
    name: "Marketing",
    required: false,
    description:
      "Used to measure and improve our advertising. Set only with your consent.",
    cookies: [
      {
        name: "_fbp",
        provider: "Meta",
        purpose: "Stores browser info for Meta Pixel advertising when enabled in Admin → Tracking & Pixels.",
        duration: "3 months",
      },
      {
        name: "_gcl_au",
        provider: "Google Ads",
        purpose: "Conversion linker cookie when a Google Ads tag (AW-…) is enabled in Admin → Tracking & Pixels.",
        duration: "90 days",
      },
    ],
  },
];

/**
 * The stored consent record — the legal minimum we keep: which optional
 * categories were accepted, the policy version agreed to, and when.
 */
export type ConsentRecord = {
  version: number;
  /** ISO 8601 timestamp of when the choice was made. */
  date: string;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

/** Consent when the visitor accepts everything. */
export function acceptAll(): ConsentRecord {
  return {
    version: cookieConsent.version,
    date: new Date().toISOString(),
    necessary: true,
    analytics: true,
    marketing: true,
  };
}

/** Consent when the visitor rejects all optional cookies. */
export function rejectAll(): ConsentRecord {
  return {
    version: cookieConsent.version,
    date: new Date().toISOString(),
    necessary: true,
    analytics: false,
    marketing: false,
  };
}

/** Read + validate the stored consent from document.cookie (client only). */
export function readConsent(): ConsentRecord | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${cookieConsent.cookieName}=`));
  if (!match) return null;
  try {
    const value = decodeURIComponent(match.split("=").slice(1).join("="));
    const parsed = JSON.parse(value) as ConsentRecord;
    // Re-prompt if the stored policy version is out of date.
    if (parsed.version !== cookieConsent.version) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Persist a consent record to a first-party cookie (client only). */
export function writeConsent(record: ConsentRecord): void {
  if (typeof document === "undefined") return;
  const maxAge = cookieConsent.maxAgeDays * 24 * 60 * 60;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    `${cookieConsent.cookieName}=` +
    encodeURIComponent(JSON.stringify(record)) +
    `; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
  // Let any consent-aware scripts react immediately.
  window.dispatchEvent(new CustomEvent("kjj-consent-change", { detail: record }));
}
