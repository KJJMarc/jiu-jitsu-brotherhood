/**
 * Shared helpers for public content search (/blogs/blog, /blogs/techniques).
 */

const SEARCH_FIELDS = [
  "title",
  "excerpt",
  "seo_title",
  "seo_description",
  "handle",
  "body_html",
] as const;

const MARC_BARTON_QUERY_RE =
  /^(dr\.?\s+)?marc(\s+barton)?$|^barton$/i;

/** Strip ILIKE wildcards / PostgREST separators from a user token. */
export function sanitizeSearchToken(raw: string): string {
  return raw.replace(/[%_,.()"'\\]/g, " ").replace(/\s+/g, "").trim().slice(0, 48);
}

export function tokenizeSearchQuery(q: string): string[] {
  const cleaned = q.replace(/[%_,.()]/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  const tokens: string[] = [];
  const seen = new Set<string>();
  for (const part of cleaned.split(" ")) {
    const token = sanitizeSearchToken(part);
    if (!token) continue;
    const key = token.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tokens.push(token);
  }
  return tokens.slice(0, 8);
}

export function isMarcBartonSearchQuery(tokens: string[]): boolean {
  if (tokens.length === 0) return false;
  return MARC_BARTON_QUERY_RE.test(tokens.join(" "));
}

function quoteIlikePattern(token: string): string {
  // PostgREST needs quoted values when the pattern contains spaces / specials.
  const pattern = `%${token}%`;
  return `"${pattern.replace(/"/g, '\\"')}"`;
}

/** OR-clause matching one token across searchable content fields. */
export function contentTokenOrFilter(token: string): string {
  const quoted = quoteIlikePattern(token);
  return SEARCH_FIELDS.map((field) => `${field}.ilike.${quoted}`).join(",");
}
