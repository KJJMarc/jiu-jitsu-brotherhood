import "server-only";

import { createSign } from "node:crypto";
import { getGa4ServiceAccountJson } from "@/lib/ga4/env";

export const GOOGLE_SCOPE_ANALYTICS_READONLY =
  "https://www.googleapis.com/auth/analytics.readonly";

export const GOOGLE_SCOPE_WEBMASTERS_READONLY =
  "https://www.googleapis.com/auth/webmasters.readonly";

type ServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

type CachedToken = {
  accessToken: string;
  expiresAtMs: number;
};

const tokenCache = new Map<string, CachedToken>();

function parseServiceAccount(): ServiceAccount {
  const raw = getGa4ServiceAccountJson();
  if (!raw) {
    throw new Error("GA4_SERVICE_ACCOUNT_JSON is not configured.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("GA4_SERVICE_ACCOUNT_JSON is not valid JSON.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("GA4_SERVICE_ACCOUNT_JSON must be a JSON object.");
  }

  const record = parsed as Record<string, unknown>;
  const clientEmail = record.client_email;
  const privateKeyRaw = record.private_key;
  const tokenUri = record.token_uri;

  if (typeof clientEmail !== "string" || !clientEmail) {
    throw new Error("GA4 service account JSON is missing client_email.");
  }
  if (typeof privateKeyRaw !== "string" || !privateKeyRaw) {
    throw new Error("GA4 service account JSON is missing private_key.");
  }

  return {
    client_email: clientEmail,
    private_key: privateKeyRaw.replace(/\\n/g, "\n"),
    token_uri:
      typeof tokenUri === "string" && tokenUri
        ? tokenUri
        : "https://oauth2.googleapis.com/token",
  };
}

function base64UrlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function createSignedJwt(account: ServiceAccount, scope: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: account.client_email,
    scope,
    aud: account.token_uri,
    iat: now,
    exp: now + 3600,
  };

  const unsigned = `${base64UrlJson(header)}.${base64UrlJson(payload)}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(account.private_key, "base64url");
  return `${unsigned}.${signature}`;
}

/**
 * OAuth access token for Google APIs (cached in-process per scope set).
 * Reuses GA4_SERVICE_ACCOUNT_JSON. Never log the token.
 */
export async function getGoogleAccessToken(scopes: string[]): Promise<string> {
  const scope = [...scopes].sort().join(" ");
  const now = Date.now();
  const cached = tokenCache.get(scope);
  if (cached && cached.expiresAtMs > now + 60_000) {
    return cached.accessToken;
  }

  const account = parseServiceAccount();
  const assertion = createSignedJwt(account, scope);

  const response = await fetch(account.token_uri!, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Google token request failed (${response.status}).`);
  }

  const body = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!body.access_token) {
    throw new Error("Google token response did not include access_token.");
  }

  const expiresInSec =
    typeof body.expires_in === "number" && body.expires_in > 0
      ? body.expires_in
      : 3600;

  tokenCache.set(scope, {
    accessToken: body.access_token,
    expiresAtMs: now + expiresInSec * 1000,
  });

  return body.access_token;
}
