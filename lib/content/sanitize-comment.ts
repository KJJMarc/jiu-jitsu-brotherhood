/**
 * Strict HTML allowlist for imported / displayed comments.
 * Narrower than editorial article sanitisation — no images, tables, headings.
 */

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "em",
  "b",
  "i",
  "a",
]);

const VOID_TAGS = new Set(["br"]);

function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sanitizeHref(href: string): string | null {
  const trimmed = href.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  if (trimmed.startsWith("mailto:") && !/[\s<>]/.test(trimmed)) return trimmed;
  return null;
}

/**
 * Strip disallowed tags/attributes. Text nodes escaped.
 * Scripts/event handlers never survive.
 */
export function sanitizeCommentHtml(input: string): string {
  if (!input) return "";
  let html = input.replace(/<script\b[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<style\b[\s\S]*?<\/style>/gi, "");

  return html.replace(
    /<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>|([^<]+)/g,
    (full, tagName?: string, attrs?: string, text?: string) => {
      if (text != null) return escapeText(text);
      if (!tagName) return "";
      const name = tagName.toLowerCase();
      const isClose = full.startsWith("</");
      if (!ALLOWED_TAGS.has(name)) return "";
      if (isClose) return VOID_TAGS.has(name) ? "" : `</${name}>`;
      if (VOID_TAGS.has(name)) return `<${name}>`;
      if (name === "a") {
        const hrefMatch = (attrs ?? "").match(/\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
        const rawHref = hrefMatch
          ? (hrefMatch[2] ?? hrefMatch[3] ?? hrefMatch[4] ?? "")
          : "";
        const safe = sanitizeHref(rawHref);
        if (!safe) return "";
        return `<a href="${escapeText(safe)}" rel="noopener noreferrer">`;
      }
      return `<${name}>`;
    },
  );
}

/** Plain text → escaped paragraph HTML for new JJB comments. */
export function plainTextToCommentHtml(text: string): string {
  const escaped = escapeText(text.trim());
  if (!escaped) return "";
  return `<p>${escaped.replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br>")}</p>`;
}
