/**
 * Server-only Google Search Console configuration.
 * Reuses GA4_SERVICE_ACCOUNT_JSON for auth. Never expose via NEXT_PUBLIC_*.
 * Do not default to a Kingston Jiu Jitsu property.
 */

import { getGa4ServiceAccountJson } from "@/lib/ga4/env";

/**
 * Search Console property URL, e.g. sc-domain:jiujitsubrotherhood.com
 * or https://www.jiujitsubrotherhood.com/
 */
export function getSearchConsoleSiteUrl(): string | undefined {
  return process.env.SEARCH_CONSOLE_SITE_URL?.trim() || undefined;
}

export function isSearchConsoleConfigured(): boolean {
  return Boolean(getGa4ServiceAccountJson() && getSearchConsoleSiteUrl());
}
