import "server-only";

import { unstable_cache } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth.server";
import {
  percentChange,
  searchConsolePropertyUrl,
  type SearchConsoleMetrics,
  type SearchConsoleResult,
  type SearchConsoleRow,
} from "@/lib/admin/search-console";
import {
  getGoogleAccessToken,
  GOOGLE_SCOPE_WEBMASTERS_READONLY,
} from "@/lib/google/auth.server";
import {
  getSearchConsoleSiteUrl,
  isSearchConsoleConfigured,
} from "@/lib/search-console/env";

type SearchAnalyticsRow = {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
};

type SearchAnalyticsResponse = {
  rows?: SearchAnalyticsRow[];
  responseAggregationType?: string;
};

type GoogleApiError = {
  message?: string;
  status?: string;
  details?: unknown;
};

/** Search Console data is typically delayed ~2–3 days; use a conservative lag. */
const DATA_LAG_DAYS = 3;
const PERIOD_DAYS = 28;

function utcTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addUtcDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Build two non-overlapping 28-day windows ending DATA_LAG_DAYS before today.
 * Inclusive ranges: start = end - 27 days.
 */
export function buildSearchConsolePeriods(todayIso = utcTodayIso()): {
  currentStart: string;
  currentEnd: string;
  previousStart: string;
  previousEnd: string;
} {
  const currentEnd = addUtcDays(todayIso, -DATA_LAG_DAYS);
  const currentStart = addUtcDays(currentEnd, -(PERIOD_DAYS - 1));
  const previousEnd = addUtcDays(currentStart, -1);
  const previousStart = addUtcDays(previousEnd, -(PERIOD_DAYS - 1));
  return { currentStart, currentEnd, previousStart, previousEnd };
}

async function logAndThrowHttpError(
  response: Response,
  label: string,
): Promise<never> {
  const rawText = await response.text();
  let message: string | undefined;
  let status: string | undefined;
  let details: unknown;
  let parseFailed = false;

  try {
    const parsed = JSON.parse(rawText) as { error?: GoogleApiError };
    message =
      typeof parsed.error?.message === "string"
        ? parsed.error.message
        : undefined;
    status =
      typeof parsed.error?.status === "string"
        ? parsed.error.status
        : undefined;
    details = parsed.error?.details;
  } catch {
    parseFailed = true;
  }

  console.error("[admin/search-console] API error", {
    label,
    httpStatus: response.status,
    message: message ?? null,
    status: status ?? null,
    details: details ?? null,
    rawBodyPreview: parseFailed ? rawText.slice(0, 1000) : null,
  });

  throw new Error(
    message
      ? `Search Console query failed (${response.status}): ${message}`
      : `Search Console query failed (${response.status}).`,
  );
}

function mapRows(rows: SearchAnalyticsRow[] | undefined): SearchConsoleRow[] {
  return (rows ?? []).map((row) => ({
    keys: row.keys ?? [],
    clicks: typeof row.clicks === "number" ? row.clicks : 0,
    impressions: typeof row.impressions === "number" ? row.impressions : 0,
    ctr: typeof row.ctr === "number" ? row.ctr : 0,
    position: typeof row.position === "number" ? row.position : 0,
  }));
}

function readTotals(response: SearchAnalyticsResponse): {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
} {
  const row = response.rows?.[0];
  if (!row) {
    return { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  }
  return {
    clicks: typeof row.clicks === "number" ? row.clicks : 0,
    impressions: typeof row.impressions === "number" ? row.impressions : 0,
    ctr: typeof row.ctr === "number" ? row.ctr : 0,
    position: typeof row.position === "number" ? row.position : 0,
  };
}

async function querySearchAnalytics(args: {
  siteUrl: string;
  accessToken: string;
  startDate: string;
  endDate: string;
  dimensions?: string[];
  rowLimit?: number;
  label: string;
}): Promise<SearchAnalyticsResponse> {
  const encodedSite = encodeURIComponent(args.siteUrl);
  const response = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: args.startDate,
        endDate: args.endDate,
        type: "web",
        dataState: "final",
        ...(args.dimensions ? { dimensions: args.dimensions } : {}),
        ...(args.rowLimit != null ? { rowLimit: args.rowLimit } : {}),
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    await logAndThrowHttpError(response, args.label);
  }

  return (await response.json()) as SearchAnalyticsResponse;
}

async function fetchSearchConsoleMetrics(
  siteUrl: string,
): Promise<SearchConsoleMetrics> {
  const accessToken = await getGoogleAccessToken([
    GOOGLE_SCOPE_WEBMASTERS_READONLY,
  ]);
  const periods = buildSearchConsolePeriods();

  const [currentRes, previousRes, queriesRes, pagesRes] = await Promise.all([
    querySearchAnalytics({
      siteUrl,
      accessToken,
      startDate: periods.currentStart,
      endDate: periods.currentEnd,
      label: "current-28d-totals",
    }),
    querySearchAnalytics({
      siteUrl,
      accessToken,
      startDate: periods.previousStart,
      endDate: periods.previousEnd,
      label: "previous-28d-totals",
    }),
    querySearchAnalytics({
      siteUrl,
      accessToken,
      startDate: periods.currentStart,
      endDate: periods.currentEnd,
      dimensions: ["query"],
      rowLimit: 5,
      label: "top-queries",
    }),
    querySearchAnalytics({
      siteUrl,
      accessToken,
      startDate: periods.currentStart,
      endDate: periods.currentEnd,
      dimensions: ["page"],
      rowLimit: 5,
      label: "top-pages",
    }),
  ]);

  const current = readTotals(currentRes);
  const previous = readTotals(previousRes);

  console.info("[admin/search-console] dashboard metrics", {
    siteUrl,
    startDate: periods.currentStart,
    endDate: periods.currentEnd,
    clicks: current.clicks,
    impressions: current.impressions,
    previousClicks: previous.clicks,
  });

  return {
    startDate: periods.currentStart,
    endDate: periods.currentEnd,
    clicks: current.clicks,
    impressions: current.impressions,
    ctr: current.ctr,
    position: current.position,
    previousClicks: previous.clicks,
    clicksChangePercent: percentChange(current.clicks, previous.clicks),
    topQueries: mapRows(queriesRes.rows),
    topPages: mapRows(pagesRes.rows),
    siteUrl,
    searchConsoleUrl: searchConsolePropertyUrl(siteUrl),
  };
}

const getCachedSearchConsoleMetrics = unstable_cache(
  async (siteUrl: string) => fetchSearchConsoleMetrics(siteUrl),
  ["admin-search-console-v1"],
  { revalidate: 1800 },
);

/**
 * Admin Dashboard Google Search (Search Console) summary.
 * Never throws to the page — returns a quiet unavailable state instead.
 */
export async function getAdminSearchConsole(): Promise<SearchConsoleResult> {
  await requireAdmin();

  if (!isSearchConsoleConfigured()) {
    return { status: "unavailable" };
  }

  const siteUrl = getSearchConsoleSiteUrl();
  if (!siteUrl) {
    return { status: "unavailable" };
  }

  try {
    const metrics = await getCachedSearchConsoleMetrics(siteUrl);
    return { status: "ok", metrics };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Search Console request failed.";
    console.error("[admin/search-console]", message);
    return { status: "unavailable" };
  }
}
