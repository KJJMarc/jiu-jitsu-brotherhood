/** Shared admin article types and form helpers (safe for client components). */

export const ADMIN_ARTICLES_PATH = "/admin/articles/";
export const ADMIN_ARTICLE_NEW_PATH = "/admin/articles/new/";

export function adminArticleEditPath(id: string): string {
  return `/admin/articles/${id}/edit/`;
}

export function adminArticlePreviewPath(id: string): string {
  return `/admin/articles/${id}/preview/`;
}

export type ArticleListSortDir = "asc" | "desc";

export type ArticleStatus = "draft" | "published";

export type AdminArticleListItem = {
  id: string;
  title: string;
  slug: string;
  status: ArticleStatus;
  published_at: string | null;
  updated_at: string;
};

export type AdminArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body_paragraphs: string[] | null;
  body_html: string | null;
  youtube_ids: string[] | null;
  categories: string[] | null;
  image_path: string | null;
  image_alt: string | null;
  status: ArticleStatus;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
};

export type ArticleWriteInput = {
  title: string;
  slug: string;
  excerpt: string;
  body_paragraphs: string[];
  body_html: string | null;
  youtube_ids: string[];
  categories: string[];
  image_path: string | null;
  image_alt: string | null;
  status: ArticleStatus;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Slugify a title into the DB-safe kebab format. */
export function slugifyArticleTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function splitLinesToList(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function splitCsvToList(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Format timestamptz for `<input type="datetime-local">` in Europe/London. */
export function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>;

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/** Parse a datetime-local value as Europe/London wall time → ISO. */
export function fromDatetimeLocalValue(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const withSeconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)
    ? `${trimmed}:00`
    : trimmed;

  const match = withSeconds.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/,
  );
  if (!match) {
    const fallback = new Date(withSeconds);
    if (Number.isNaN(fallback.getTime())) return null;
    return fallback.toISOString();
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);

  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const wall = Object.fromEntries(
    formatter
      .formatToParts(new Date(utcGuess))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>;

  const asLondonWallMs = Date.UTC(
    Number(wall.year),
    Number(wall.month) - 1,
    Number(wall.day),
    Number(wall.hour),
    Number(wall.minute),
    Number(wall.second),
  );

  return new Date(utcGuess - (asLondonWallMs - utcGuess)).toISOString();
}

export function validateArticleWriteInput(
  input: ArticleWriteInput,
  isReservedSlug: (slug: string) => boolean,
): string | null {
  if (!input.title.trim()) return "Title is required.";
  if (!input.slug.trim()) return "Slug is required.";
  if (!SLUG_PATTERN.test(input.slug)) {
    return "Slug must be lowercase letters, numbers, and hyphens only.";
  }
  if (isReservedSlug(input.slug)) {
    return `Slug “${input.slug}” is reserved for a site page.`;
  }
  if (input.status === "published" && !input.published_at) {
    return "Published articles need a published date.";
  }
  return null;
}
