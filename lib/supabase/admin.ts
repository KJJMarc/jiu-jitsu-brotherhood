import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  requireSupabaseUrl,
} from "@/lib/supabase/env";

export const MISSING_SERVICE_ROLE_KEY_MESSAGE =
  "SUPABASE_SERVICE_ROLE_KEY is missing. Add the KJJ project service_role secret " +
  "(server-only, never NEXT_PUBLIC_). Find it in Supabase → Project Settings → API.";

const INVALID_SERVICE_ROLE_KEY_MESSAGE =
  "SUPABASE_SERVICE_ROLE_KEY must be the service_role secret, not the anon/publishable key.";

const WRONG_JWT_ROLE_MESSAGE =
  "SUPABASE_SERVICE_ROLE_KEY is present but is not a service_role credential " +
  "(JWT role claim is not service_role). Re-copy the service_role key from " +
  "Supabase → Project Settings → API (legacy JWT) or the secret key (sb_secret_…).";

type ServiceRoleKeyFormat =
  | "missing"
  | "legacy_jwt"
  | "secret"
  | "publishable"
  | "unknown";

/**
 * Decode a legacy Supabase API JWT payload enough to read the `role` claim.
 * Does not verify the signature. Never log or return the raw token.
 */
function readJwtRoleClaim(jwt: string): string | null {
  try {
    const parts = jwt.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const json =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf8");
    const parsed = JSON.parse(json) as { role?: unknown };
    return typeof parsed.role === "string" ? parsed.role : null;
  } catch {
    return null;
  }
}

function inspectServiceRoleKey(key: string | undefined): {
  format: ServiceRoleKeyFormat;
  jwtRoleClaim: string | null;
} {
  if (!key) return { format: "missing", jwtRoleClaim: null };
  if (key.startsWith("sb_secret_")) {
    return { format: "secret", jwtRoleClaim: null };
  }
  if (key.startsWith("sb_publishable_")) {
    return { format: "publishable", jwtRoleClaim: null };
  }
  if (key.startsWith("eyJ")) {
    return {
      format: "legacy_jwt",
      jwtRoleClaim: readJwtRoleClaim(key),
    };
  }
  return { format: "unknown", jwtRoleClaim: null };
}

function resolveServiceRoleKey(): string {
  const serviceRoleKey = getSupabaseServiceRoleKey();
  const anonKey = getSupabaseAnonKey();

  if (!serviceRoleKey) {
    throw new Error(MISSING_SERVICE_ROLE_KEY_MESSAGE);
  }

  const { format, jwtRoleClaim } = inspectServiceRoleKey(serviceRoleKey);

  if (
    format === "publishable" ||
    (anonKey && serviceRoleKey === anonKey)
  ) {
    throw new Error(INVALID_SERVICE_ROLE_KEY_MESSAGE);
  }

  if (format === "legacy_jwt") {
    if (jwtRoleClaim == null) {
      throw new Error(
        "SUPABASE_SERVICE_ROLE_KEY looks like a JWT but could not be parsed. " +
          "Re-copy the service_role key from Supabase → Project Settings → API.",
      );
    }
    if (jwtRoleClaim !== "service_role") {
      throw new Error(
        `${WRONG_JWT_ROLE_MESSAGE} Observed JWT role claim: ${jwtRoleClaim}.`,
      );
    }
  }

  if (format === "unknown") {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY format is not recognised. Expected a legacy " +
        "service_role JWT (eyJ…) or a secret key (sb_secret_…). Re-copy it from " +
        "Supabase → Project Settings → API.",
    );
  }

  return serviceRoleKey;
}

/**
 * Service-role client for trusted server-side operations only
 * (e.g. inviting admins). Never import from Client Components.
 */
export function getSupabaseAdminClient(): SupabaseClient {
  const supabaseUrl = requireSupabaseUrl();
  const serviceRoleKey = resolveServiceRoleKey();

  // Pass the key as createClient's second argument — supabase-js sets apikey /
  // Authorization. Do not inject user cookies; this client must stay service-role.
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (url, init) => fetch(url, { ...init, cache: "no-store" }),
    },
  });
}

/**
 * Same as getSupabaseAdminClient(), but returns null when the service-role
 * key is missing/invalid instead of throwing. Use for optional enrichment.
 */
export function tryGetSupabaseAdminClient(): SupabaseClient | null {
  try {
    return getSupabaseAdminClient();
  } catch (error) {
    console.error(
      "[supabase-admin]",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

