export type WebsiteTrafficMetrics = {
  /** activeUsers over the current 30-day window (includes today). */
  visitors30d: number;
  /** activeUsers over the preceding non-overlapping 30-day window. */
  visitorsPrevious30d: number;
  /** screenPageViews over the current 30-day window. */
  pageViews30d: number;
  /** activeUsers for today only. */
  visitorsToday: number;
  /** Percent change vs previous 30 days; null when previous is 0. */
  visitorsChangePercent: number | null;
  propertyId: string;
  googleAnalyticsUrl: string;
};

export type WebsiteTrafficResult =
  | { status: "ok"; metrics: WebsiteTrafficMetrics }
  | { status: "unavailable" };

export function percentChange(
  current: number,
  previous: number,
): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-GB").format(value);
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

export function googleAnalyticsPropertyUrl(propertyId: string): string {
  return `https://analytics.google.com/analytics/web/#/p${encodeURIComponent(propertyId)}/`;
}
