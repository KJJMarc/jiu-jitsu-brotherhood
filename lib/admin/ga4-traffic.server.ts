import "server-only";

import { unstable_cache } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth.server";
import {
  googleAnalyticsPropertyUrl,
  percentChange,
  type WebsiteTrafficMetrics,
  type WebsiteTrafficResult,
} from "@/lib/admin/ga4-traffic";
import { getGa4AccessToken } from "@/lib/ga4/auth.server";
import { getGa4PropertyId, isGa4ReportingConfigured } from "@/lib/ga4/env";

type DateRange = {
  startDate: string;
  endDate: string;
  name?: string;
};

type MetricRef = { name: string };

type RunReportRequest = {
  dateRanges: DateRange[];
  metrics: MetricRef[];
};

type RunReportResponse = {
  dimensionHeaders?: Array<{ name?: string }>;
  metricHeaders?: Array<{ name?: string }>;
  rows?: Array<{
    dimensionValues?: Array<{ value?: string }>;
    metricValues?: Array<{ value?: string }>;
  }>;
  rowCount?: number;
};

type GoogleApiError = {
  message?: string;
  status?: string;
  details?: unknown;
};

function parseMetric(value: string | undefined): number {
  if (!value) return 0;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : 0;
}

/** Accept "360613226" or "properties/360613226"; reject Measurement IDs. */
function normalizePropertyId(raw: string): string {
  const id = raw.trim().replace(/^properties\//i, "");
  if (!/^\d+$/.test(id)) {
    throw new Error(
      "GA4_PROPERTY_ID must be the numeric property ID (e.g. 360613226).",
    );
  }
  return id;
}

/**
 * Read a GA4 error body once via text(), then log safely.
 * Never logs Authorization, JWT, access tokens, or service-account material.
 */
async function logAndThrowGa4HttpError(
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

  console.error("[admin/ga4-traffic] GA4 API error", {
    label,
    httpStatus: response.status,
    message: message ?? null,
    status: status ?? null,
    details: details ?? null,
    rawBodyPreview: parseFailed ? rawText.slice(0, 1000) : null,
  });

  throw new Error(
    message
      ? `GA4 runReport failed (${response.status}): ${message}`
      : `GA4 runReport failed (${response.status}).`,
  );
}

/** Safe structural summary — metrics/dimensions only, never credentials. */
function logReportStructure(label: string, report: RunReportResponse): void {
  console.info("[admin/ga4-traffic] report structure", {
    label,
    dimensionHeaders: (report.dimensionHeaders ?? []).map((h) => h.name ?? null),
    metricHeaders: (report.metricHeaders ?? []).map((h) => h.name ?? null),
    rowCount: report.rowCount ?? report.rows?.length ?? 0,
    rows: (report.rows ?? []).map((row) => ({
      dimensionValues: (row.dimensionValues ?? []).map((d) => d.value ?? null),
      metricValues: (row.metricValues ?? []).map((m) => m.value ?? null),
    })),
  });
}

async function runReport(
  propertyId: string,
  accessToken: string,
  body: RunReportRequest,
  label: string,
): Promise<RunReportResponse> {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      // Body contains only dateRanges + metrics — no auth material.
      body: JSON.stringify(body),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    await logAndThrowGa4HttpError(response, label);
  }

  const report = (await response.json()) as RunReportResponse;
  logReportStructure(label, report);
  return report;
}

function metricIndex(body: RunReportRequest, metricName: string): number {
  return body.metrics.findIndex((m) => m.name === metricName);
}

/** Single date-range report with no dimensions → one totals row. */
function readSingleRangeTotals(
  report: RunReportResponse,
  body: RunReportRequest,
): { activeUsers: number; screenPageViews: number } {
  const activeIdx = metricIndex(body, "activeUsers");
  const pageIdx = metricIndex(body, "screenPageViews");
  const row = report.rows?.[0];

  return {
    activeUsers:
      activeIdx >= 0 ? parseMetric(row?.metricValues?.[activeIdx]?.value) : 0,
    screenPageViews:
      pageIdx >= 0 ? parseMetric(row?.metricValues?.[pageIdx]?.value) : 0,
  };
}

/**
 * Multi-range report helper used only for debug comparison logging.
 * Keys by dateRange dimension value (custom name or date_range_N).
 */
function readMultiRangeByDimension(
  report: RunReportResponse,
  body: RunReportRequest,
): Record<string, { activeUsers: number; screenPageViews: number }> {
  const activeIdx = metricIndex(body, "activeUsers");
  const pageIdx = metricIndex(body, "screenPageViews");
  const out: Record<string, { activeUsers: number; screenPageViews: number }> =
    {};

  for (const row of report.rows ?? []) {
    const name = row.dimensionValues?.[0]?.value ?? "";
    if (!name) continue;
    out[name] = {
      activeUsers:
        activeIdx >= 0 ? parseMetric(row.metricValues?.[activeIdx]?.value) : 0,
      screenPageViews:
        pageIdx >= 0 ? parseMetric(row.metricValues?.[pageIdx]?.value) : 0,
    };
  }

  return out;
}

/**
 * Fetch website traffic via three independent single-range runReport calls.
 * Also runs one combined multi-range request for debug comparison only.
 */
async function fetchGa4WebsiteTraffic(
  propertyId: string,
): Promise<WebsiteTrafficMetrics> {
  const accessToken = await getGa4AccessToken();
  const normalizedPropertyId = normalizePropertyId(propertyId);

  // A. Current 30 days — activeUsers + screenPageViews
  const currentBody: RunReportRequest = {
    dateRanges: [{ startDate: "29daysAgo", endDate: "today" }],
    metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
  };
  const currentReport = await runReport(
    normalizedPropertyId,
    accessToken,
    currentBody,
    "A-current-30d",
  );
  const current = readSingleRangeTotals(currentReport, currentBody);

  // B. Previous 30 days — activeUsers only
  const previousBody: RunReportRequest = {
    dateRanges: [{ startDate: "59daysAgo", endDate: "30daysAgo" }],
    metrics: [{ name: "activeUsers" }],
  };
  const previousReport = await runReport(
    normalizedPropertyId,
    accessToken,
    previousBody,
    "B-previous-30d",
  );
  const previous = readSingleRangeTotals(previousReport, previousBody);

  // C. Today — activeUsers only
  const todayBody: RunReportRequest = {
    dateRanges: [{ startDate: "today", endDate: "today" }],
    metrics: [{ name: "activeUsers" }],
  };
  const todayReport = await runReport(
    normalizedPropertyId,
    accessToken,
    todayBody,
    "C-today",
  );
  const today = readSingleRangeTotals(todayReport, todayBody);

  // Debug-only: combined multi-range request to compare against independent results.
  // Does not drive the dashboard numbers.
  try {
    const combinedBody: RunReportRequest = {
      dateRanges: [
        { startDate: "29daysAgo", endDate: "today", name: "current" },
        { startDate: "59daysAgo", endDate: "30daysAgo", name: "previous" },
        { startDate: "today", endDate: "today", name: "today" },
      ],
      metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
    };
    const combinedReport = await runReport(
      normalizedPropertyId,
      accessToken,
      combinedBody,
      "combined-multi-range-debug",
    );
    const combinedByRange = readMultiRangeByDimension(
      combinedReport,
      combinedBody,
    );
    console.info("[admin/ga4-traffic] independent vs combined", {
      independent: {
        visitors30d: current.activeUsers,
        pageViews30d: current.screenPageViews,
        visitorsPrevious30d: previous.activeUsers,
        visitorsToday: today.activeUsers,
      },
      combinedByRange,
    });
  } catch (error) {
    console.error("[admin/ga4-traffic] combined debug request failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
  }

  const visitors30d = current.activeUsers;
  const visitorsPrevious30d = previous.activeUsers;
  const pageViews30d = current.screenPageViews;
  const visitorsToday = today.activeUsers;
  const visitorsChangePercent = percentChange(
    visitors30d,
    visitorsPrevious30d,
  );

  console.info("[admin/ga4-traffic] dashboard metrics", {
    visitors30d,
    pageViews30d,
    visitorsPrevious30d,
    visitorsToday,
    visitorsChangePercent,
  });

  return {
    visitors30d,
    visitorsPrevious30d,
    pageViews30d,
    visitorsToday,
    visitorsChangePercent,
    propertyId: normalizedPropertyId,
    googleAnalyticsUrl: googleAnalyticsPropertyUrl(normalizedPropertyId),
  };
}

const getCachedGa4WebsiteTraffic = unstable_cache(
  async (propertyId: string) => fetchGa4WebsiteTraffic(propertyId),
  ["admin-ga4-website-traffic-v4"],
  { revalidate: 1800 },
);

/**
 * Admin Dashboard website traffic summary.
 * Never throws to the page — returns a quiet unavailable state instead.
 */
export async function getAdminWebsiteTraffic(): Promise<WebsiteTrafficResult> {
  await requireAdmin();

  if (!isGa4ReportingConfigured()) {
    return { status: "unavailable" };
  }

  const propertyId = getGa4PropertyId();
  if (!propertyId) {
    return { status: "unavailable" };
  }

  try {
    const metrics = await getCachedGa4WebsiteTraffic(propertyId);
    return { status: "ok", metrics };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "GA4 traffic request failed.";
    console.error("[admin/ga4-traffic]", message);
    return { status: "unavailable" };
  }
}
