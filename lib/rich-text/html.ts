/** Escape plain text for HTML element content. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Convert legacy plain paragraphs into TipTap-friendly HTML. */
export function paragraphsToHtml(paragraphs: string[] | null | undefined): string {
  const list = (paragraphs ?? []).map((p) => p.trim()).filter(Boolean);
  if (list.length === 0) return "<p></p>";
  return list.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
}

/**
 * Derive plain-text paragraphs from HTML for body_paragraphs fallback.
 * Keeps public JSON-era consumers working when body_html is absent.
 */
export function htmlToParagraphs(html: string): string[] {
  const normalised = html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/\s*(p|div|h[1-6]|li|blockquote)\s*>/gi, "\n")
    .replace(/<\s*\/?(ul|ol|table|thead|tbody|tr|section|article)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\r/g, "");

  return normalised
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

/**
 * Minimal allowlist sanitiser for trusted admin-authored HTML on the public site.
 * Strips scripts/handlers; keeps common article tags used by TipTap.
 */
export function sanitizeArticleHtml(html: string): string {
  let out = html.replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "");
  out = out.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  out = out.replace(/javascript:/gi, "");
  return out;
}
