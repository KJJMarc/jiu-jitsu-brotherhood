/**
 * Deterministic HTML sanitisation for JJB editorial content (Phase 2D §R/S).
 * Does not rewrite prose text nodes. YouTube iframes become embed markers.
 */

const YT_ID_RE =
  /(?:youtube\.com\/(?:embed\/|watch\?v=|shorts\/)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([A-Za-z0-9_-]{11})/i;

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "a",
  "ul",
  "ol",
  "li",
  "h2",
  "h3",
  "h4",
  "blockquote",
  "figure",
  "figcaption",
  "img",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "hr",
  "span",
  "div",
]);

const VOID_TAGS = new Set(["br", "hr", "img"]);

export function extractYoutubeId(value: string): string | null {
  const m = value.match(YT_ID_RE);
  return m?.[1] ?? null;
}

export function extractYoutubeIdsFromHtml(html: string): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  const iframeRe = /<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi;
  let m: RegExpExecArray | null;
  while ((m = iframeRe.exec(html))) {
    const id = extractYoutubeId(m[0]);
    if (id && !seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
  }
  const looseRe = /https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|youtube-nocookie\.com)[^\s"'<>]*/gi;
  while ((m = looseRe.exec(html))) {
    const id = extractYoutubeId(m[0]);
    if (id && !seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
  }
  return ids;
}

function youtubeMarker(id: string): string {
  return `<div data-jjb-youtube="${id}" class="jjb-youtube"></div>`;
}

/** Replace YouTube iframes with markers; drop other iframes. */
export function replaceYoutubeIframesWithMarkers(html: string): {
  html: string;
  youtubeIds: string[];
} {
  const youtubeIds: string[] = [];
  const seen = new Set<string>();
  const htmlOut = html.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, (block) => {
    const id = extractYoutubeId(block);
    if (!id) return "";
    if (!seen.has(id)) {
      seen.add(id);
      youtubeIds.push(id);
    }
    return youtubeMarker(id);
  });
  return { html: htmlOut, youtubeIds };
}

function sanitizeHref(href: string): string | null {
  const trimmed = href.trim();
  if (!trimmed) return null;
  if (/^(https?:|mailto:|tel:|#|\/)/i.test(trimmed) && !/^javascript:/i.test(trimmed)) {
    return trimmed;
  }
  return null;
}

/**
 * Strip legacy Shopify Club Network promo footers (dashed rule + “learn more”
 * + map screenshot). Keeps in-body Club Network mentions intact.
 */
export function stripClubNetworkPromoFooter(html: string): string {
  let out = html.replace(
    /<(?:div|p)\b[^>]*>\s*-{10,}\s*<\/(?:div|p)>\s*<(?:div|p)\b[^>]*>\s*You can learn more about the Jiu Jitsu Brotherhood Club Network[\s\S]*$/i,
    "",
  );
  // Fallback when the dashed rule was already lost but the promo + map remain.
  out = out.replace(
    /<(?:div|p)\b[^>]*>\s*You can learn more about the Jiu Jitsu Brotherhood Club Network[\s\S]*?Screenshot_2022-10-17[\s\S]*$/i,
    "",
  );
  return out.trimEnd();
}

/**
 * Allowlist sanitiser. Strips scripts/styles/handlers; keeps editorial tags;
 * converts YouTube iframes to markers.
 */
export function sanitizeContentHtml(raw: string): {
  html: string;
  youtubeIds: string[];
} {
  const { html: withMarkers, youtubeIds } = replaceYoutubeIframesWithMarkers(
    stripClubNetworkPromoFooter(raw),
  );

  let out = withMarkers
    .replace(/<\s*(script|style|object|embed|link|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|object|embed|link|meta)\b[^>]*\/?\s*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");

  // Strip data-mce / TinyMCE noise attributes without touching text
  out = out.replace(/\sdata-mce-[\w-]*=("[^"]*"|'[^']*')/gi, "");

  // Tag allowlist pass (opening/closing/self-closing)
  out = out.replace(/<\/?([a-zA-Z0-9]+)(\s[^>]*)?>/g, (full, tagName: string, attrs = "") => {
    const tag = tagName.toLowerCase();
    const isClose = full.startsWith("</");

    if (tag === "div" && /data-jjb-youtube=/i.test(full)) {
      const idMatch = full.match(/data-jjb-youtube=["']([A-Za-z0-9_-]{11})["']/i);
      if (idMatch) return youtubeMarker(idMatch[1]);
    }

    if (!ALLOWED_TAGS.has(tag)) return "";

    if (isClose) return VOID_TAGS.has(tag) ? "" : `</${tag}>`;

    if (tag === "a") {
      const hrefMatch = attrs.match(/\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const rawHref = hrefMatch
        ? (hrefMatch[2] ?? hrefMatch[3] ?? hrefMatch[4] ?? "")
        : "";
      const href = sanitizeHref(rawHref);
      if (!href) return "<span>";
      const titleMatch = attrs.match(/\btitle\s*=\s*("([^"]*)"|'([^']*)')/i);
      const title = titleMatch?.[2] ?? titleMatch?.[3];
      const rel =
        href.startsWith("http")
          ? ' rel="noopener noreferrer"'
          : "";
      const target = href.startsWith("http") ? ' target="_blank"' : "";
      return `<a href="${escapeAttr(href)}"${title ? ` title="${escapeAttr(title)}"` : ""}${rel}${target}>`;
    }

    if (tag === "img") {
      const srcMatch = attrs.match(/\bsrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const rawSrc = srcMatch
        ? (srcMatch[2] ?? srcMatch[3] ?? srcMatch[4] ?? "")
        : "";
      if (!rawSrc || !/^(https?:|\/)/i.test(rawSrc) || /^javascript:/i.test(rawSrc)) {
        return "";
      }
      const altMatch = attrs.match(/\balt\s*=\s*("([^"]*)"|'([^']*)')/i);
      const alt = altMatch?.[2] ?? altMatch?.[3] ?? "";
      const widthMatch = attrs.match(/\bwidth\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const heightMatch = attrs.match(/\bheight\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const width = widthMatch?.[2] ?? widthMatch?.[3] ?? widthMatch?.[4];
      const height = heightMatch?.[2] ?? heightMatch?.[3] ?? heightMatch?.[4];
      return `<img src="${escapeAttr(rawSrc)}" alt="${escapeAttr(alt)}" loading="lazy"${
        width && /^\d+$/.test(width) ? ` width="${width}"` : ""
      }${height && /^\d+$/.test(height) ? ` height="${height}"` : ""}>`;
    }

    if (VOID_TAGS.has(tag)) return `<${tag}>`;
    return `<${tag}>`;
  });

  return { html: out, youtubeIds };
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Split sanitised HTML into render segments: html chunks and youtube ids.
 */
export function splitContentHtmlForRender(
  html: string,
): Array<{ type: "html"; html: string } | { type: "youtube"; id: string }> {
  const cleaned = rewriteKnownContentImages(stripClubNetworkPromoFooter(html));
  const parts: Array<
    { type: "html"; html: string } | { type: "youtube"; id: string }
  > = [];
  const re = /<div data-jjb-youtube="([A-Za-z0-9_-]{11})" class="jjb-youtube"><\/div>/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cleaned))) {
    if (m.index > last) {
      parts.push({ type: "html", html: cleaned.slice(last, m.index) });
    }
    parts.push({ type: "youtube", id: m[1] });
    last = m.index + m[0].length;
  }
  if (last < cleaned.length) {
    parts.push({ type: "html", html: cleaned.slice(last) });
  }
  return parts;
}

/**
 * Belt-system article: swap the legacy Shopify diagram for the local JJB asset.
 * Idempotent if body_html already points at the local path.
 */
const BELT_SYSTEM_SHOPIFY_IMG_RE =
  /https?:\/\/cdn\.shopify\.com\/s\/files\/1\/0363\/5125\/files\/brazilian-jiu-jitsu-belts-21[^"'>\s]*/gi;
/** In-article diagram only — not the card/featured thumbnail. */
const BELT_SYSTEM_BODY_IMG = "/images/jjb/bjj-belt-system.jpg";

export function rewriteKnownContentImages(html: string): string {
  return html
    .replace(BELT_SYSTEM_SHOPIFY_IMG_RE, BELT_SYSTEM_BODY_IMG)
    // Undo accidental earlier rewrite that pointed the body at the thumbnail.
    .replace(
      /src=(["'])\/images\/jjb\/bjj-belt-system-thumbnail\.png\1/gi,
      `src=$1${BELT_SYSTEM_BODY_IMG}$1`,
    );
}
