import "server-only";

import {
  getGoogleAccessToken,
  GOOGLE_SCOPE_ANALYTICS_READONLY,
} from "@/lib/google/auth.server";

/**
 * OAuth access token for the Analytics Data API (cached in-process).
 * Uses the shared Google service-account helper with analytics.readonly scope.
 */
export async function getGa4AccessToken(): Promise<string> {
  return getGoogleAccessToken([GOOGLE_SCOPE_ANALYTICS_READONLY]);
}
