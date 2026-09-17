export type SearchConsoleRow = {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type SearchConsoleMetrics = {
  /** Inclusive start of the current 28-day window (YYYY-MM-DD). */
  startDate: string;
  /** Inclusive end of the current 28-day window (YYYY-MM-DD). */
  endDate: string;
  clicks: number;
  impressions: number;
  /** Click-through rate as a fraction (0–1), from Search Console. */
  ctr: number;
  /** Average position from Search Console. */
  position: number;
  previousClicks: number;
  /** Percent change in clicks vs previous 28 days; null when previous is 0. */
  clicksChangePercent: number | null;
  topQueries: SearchConsoleRow[];
  topPages: SearchConsoleRow[];
  siteUrl: string;
  searchConsoleUrl: string;
};

export type SearchConsoleResult =
  | { status: "ok"; metrics: SearchConsoleMetrics }
  | { status: "unavailable" };

export function percentChange(
  current: number,
  previous: number,
): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-GB").format(Math.round(value));
}

export function formatPercentChange(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const absolute = Math.abs(rounded).toLocaleString("en-GB", {
    maximumFractionDigits: 1,
  });
  if (rounded > 0) return `↑ ${absolute}%`;
  if (rounded < 0) return `↓ ${absolute}%`;
  return `${absolute}%`;
}

/** Format CTR fraction (e.g. 0.106) as a percentage string. */
export function formatCtr(ctr: number): string {
  const pct = ctr * 100;
  return `${pct.toLocaleString("en-GB", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  })}%`;
}

export function formatPosition(position: number): string {
  return position.toLocaleString("en-GB", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  });
}

export function searchConsolePropertyUrl(siteUrl: string): string {
  return `https://search.google.com/search-console/performance/search-analytics?resource_id=${encodeURIComponent(siteUrl)}`;
}

/** Short label for a landing page URL on the dashboard. */
export function shortenPageUrl(page: string): string {
  try {
    const url = new URL(page);
    const path = `${url.pathname}${url.search}` || "/";
    return path.length > 48 ? `${path.slice(0, 45)}…` : path;
  } catch {
    return page.length > 48 ? `${page.slice(0, 45)}…` : page;
  }
}
