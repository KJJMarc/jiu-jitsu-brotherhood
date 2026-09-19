/**
 * Deterministic Shopify HTML / link transforms for the JJB importer (Phase 2D §T).
 * Pure functions — no prose rewriting. Safe to unit-test without Supabase.
 */

import { stripTrailingSlash } from "@/lib/canonical";
import {
  extractYoutubeIdsFromHtml,
  sanitizeContentHtml,
} from "@/lib/content/sanitize";
import { decodeBasicHtmlEntities } from "@/lib/rich-text/html";

export type TransformCode =
  | "HTTPS_WWW"
  | "STORE_HOST"
  | "STRIP_TRAIL"
  | "WP_UPLOAD"
  | "BAD_HREF"
  | "YOUTUBE_MARKER"
  | "STRIP_MCE"
  | "SANITIZE";

export type TransformEvent = {
  code: TransformCode;
  detail: string;
};

const HOST_RE =
  /https?:\/\/(?:www\.)?jiujitsubrotherhood\.com/gi;
const STORE_RE = /https?:\/\/store\.jiujitsubrotherhood\.com/gi;
const HTTP_WWW_RE = /http:\/\/(?:www\.)?jiujitsubrotherhood\.com/gi;

/** Plain text from Shopify HTML/summary — strips tags and decodes entities. */
export function plainTextFromShopifyHtml(raw: string): string {
  return decodeBasicHtmlEntities(
    raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
  );
}

export function transformInternalLinks(html: string): {
  html: string;
  events: TransformEvent[];
} {
  const events: TransformEvent[] = [];
  let out = html;

  out = out.replace(HTTP_WWW_RE, (match) => {
    events.push({ code: "HTTPS_WWW", detail: match });
    return match.replace(/^http:/i, "https:");
  });

  out = out.replace(STORE_RE, (match) => {
    events.push({ code: "STORE_HOST", detail: match });
    return match.replace(
      /https?:\/\/store\.jiujitsubrotherhood\.com/i,
      "https://www.jiujitsubrotherhood.com",
    );
  });

  // Normalise trailing slashes on same-host absolute JJB paths in hrefs
  out = out.replace(
    /href=(["'])(https:\/\/www\.jiujitsubrotherhood\.com[^"']+|\/[^"']+)\1/gi,
    (_full, quote: string, href: string) => {
      if (href.includes("wp-content/uploads")) {
        events.push({ code: "WP_UPLOAD", detail: href });
        return `href=${quote}${href}${quote}`;
      }
      try {
        const isAbs = href.startsWith("http");
        const url = isAbs
          ? new URL(href)
          : new URL(href, "https://www.jiujitsubrotherhood.com");
        const nextPath = stripTrailingSlash(url.pathname) || "/";
        if (nextPath !== url.pathname) {
          events.push({ code: "STRIP_TRAIL", detail: href });
          url.pathname = nextPath;
          const next = isAbs
            ? url.toString()
            : `${nextPath}${url.search}${url.hash}`;
          return `href=${quote}${next}${quote}`;
        }
      } catch {
        events.push({ code: "BAD_HREF", detail: href });
      }
      return `href=${quote}${href}${quote}`;
    },
  );

  // Drop clearly non-URL hrefs (garbage %20 author blobs etc.)
  out = out.replace(/href=(["'])([^"']*)\1/gi, (full, quote: string, href: string) => {
    if (!href) return full;
    if (/^(https?:|mailto:|tel:|#|\/)/i.test(href)) return full;
    if (/^www\./i.test(href)) {
      events.push({ code: "BAD_HREF", detail: href });
      return `href=${quote}https://${href}${quote}`;
    }
    events.push({ code: "BAD_HREF", detail: href });
    return "href=\"#\"";
  });

  // Count host normalisations already covered
  void HOST_RE;

  return { html: out, events };
}

export function transformShopifyHtml(raw: string): {
  html: string;
  youtubeIds: string[];
  events: TransformEvent[];
} {
  const link = transformInternalLinks(raw);
  const beforeSanitizeIds = extractYoutubeIdsFromHtml(link.html);
  const sanitised = sanitizeContentHtml(link.html);
  const events: TransformEvent[] = [
    ...link.events,
    ...beforeSanitizeIds.map(
      (id): TransformEvent => ({
        code: "YOUTUBE_MARKER",
        detail: id,
      }),
    ),
    { code: "SANITIZE", detail: "allowlist" },
  ];
  if (/data-mce-/i.test(raw)) {
    events.push({ code: "STRIP_MCE", detail: "data-mce attributes" });
  }
  return {
    html: sanitised.html,
    youtubeIds: sanitised.youtubeIds.length
      ? sanitised.youtubeIds
      : beforeSanitizeIds,
    events,
  };
}

/** Idempotent upsert decision without DB. */
export function shouldSkipUnchanged(input: {
  existingSourceUpdatedAt: string | null | undefined;
  incomingSourceUpdatedAt: string | null | undefined;
  existingBodyChecksum: string | null | undefined;
  incomingBodyChecksum: string;
}): boolean {
  if (!input.existingSourceUpdatedAt || !input.incomingSourceUpdatedAt) {
    return false;
  }
  if (input.existingSourceUpdatedAt !== input.incomingSourceUpdatedAt) {
    return false;
  }
  if (!input.existingBodyChecksum) return false;
  return input.existingBodyChecksum === input.incomingBodyChecksum;
}

export function simpleChecksum(value: string): string {
  // Non-crypto stable hash for dry-run / skip logic (not a security boundary).
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) | 0;
  }
  return `c${(h >>> 0).toString(16)}`;
}
