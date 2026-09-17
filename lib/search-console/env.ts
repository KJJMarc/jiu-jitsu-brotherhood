/**
 * Server-only Google Search Console configuration.
 * Reuses GA4_SERVICE_ACCOUNT_JSON for auth. Never expose via NEXT_PUBLIC_*.
 */

import { getGa4ServiceAccountJson } from "@/lib/ga4/env";

/** Default domain property for Kingston Jiu Jitsu. */
export const DEFAULT_SEARCH_CONSOLE_SITE_URL =
  "sc-domain:kingstonjiujitsu.com";

/**
 * Search Console property URL, e.g. sc-domain:kingstonjiujitsu.com
 * or https://www.kingstonjiujitsu.com/
 */
export function getSearchConsoleSiteUrl(): string | undefined {
  const fromEnv = process.env.SEARCH_CONSOLE_SITE_URL?.trim();
  if (fromEnv) return fromEnv;
  // Fall back to the known domain property when the shared SA JSON is present.
  if (getGa4ServiceAccountJson()) return DEFAULT_SEARCH_CONSOLE_SITE_URL;
  return undefined;
}

export function isSearchConsoleConfigured(): boolean {
  return Boolean(getGa4ServiceAccountJson() && getSearchConsoleSiteUrl());
}
