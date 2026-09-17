/**
 * Parse a naive legacy datetime ("YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DDTHH:mm:ss")
 * as Europe/London wall time and return a Date (UTC instant).
 */
export function parseEuropeLondonDateTime(legacy: string): Date {
  const normalized = legacy.trim().replace(" ", "T");
  const match = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/,
  );
  if (!match) {
    const fallback = new Date(normalized);
    if (Number.isNaN(fallback.getTime())) {
      throw new Error(`Invalid article date: ${legacy}`);
    }
    return fallback;
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

  const parts = Object.fromEntries(
    formatter
      .formatToParts(new Date(utcGuess))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>;

  const asLondonWallMs = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );

  const offset = asLondonWallMs - utcGuess;
  return new Date(utcGuess - offset);
}

/** Format an article date for public en-GB display in Europe/London. */
export function formatArticleDate(value: string | Date): string {
  const date =
    value instanceof Date ? value : parseEuropeLondonDateTime(value);

  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value.slice(0, 10) : "";
  }

  return date.toLocaleDateString("en-GB", {
    timeZone: "Europe/London",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
