/**
 * Server-only GA4 Data API configuration.
 * Never expose these via NEXT_PUBLIC_*.
 */

export function getGa4PropertyId(): string | undefined {
  return process.env.GA4_PROPERTY_ID?.trim() || undefined;
}

/** Full service-account JSON (minified) from Google Cloud. */
export function getGa4ServiceAccountJson(): string | undefined {
  return process.env.GA4_SERVICE_ACCOUNT_JSON?.trim() || undefined;
}

export function isGa4ReportingConfigured(): boolean {
  return Boolean(getGa4PropertyId() && getGa4ServiceAccountJson());
}
