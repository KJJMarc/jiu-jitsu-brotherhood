/**
 * Pure Mollie API-key resolution (no I/O).
 * Used by the server Mollie client and by unit tests.
 *
 * Live keys require an explicit MOLLIE_ALLOW_LIVE=true opt-in and are blocked
 * on Vercel preview/development so supporting live in code cannot accidentally
 * flip non-production deployments to LIVE.
 */

export type MollieKeyMode = "test" | "live";

export type MollieKeyEnv = {
  MOLLIE_API_KEY?: string;
  MOLLIE_ALLOW_LIVE?: string;
  VERCEL_ENV?: string;
};

export type MollieKeyResolution =
  | { ok: true; key: string; mode: MollieKeyMode }
  | { ok: false; error: string };

function readEnv(env?: MollieKeyEnv): MollieKeyEnv {
  return env ?? (process.env as MollieKeyEnv);
}

export function mollieAllowLiveEnabled(env?: MollieKeyEnv): boolean {
  return readEnv(env).MOLLIE_ALLOW_LIVE?.trim() === "true";
}

export function isVercelNonProduction(env?: MollieKeyEnv): boolean {
  const vercelEnv = readEnv(env).VERCEL_ENV?.trim();
  return vercelEnv === "preview" || vercelEnv === "development";
}

/** Resolve and validate the configured Mollie API key without logging it. */
export function resolveMollieApiKey(env?: MollieKeyEnv): MollieKeyResolution {
  const source = readEnv(env);
  const key = source.MOLLIE_API_KEY?.trim() ?? "";
  if (!key) {
    return {
      ok: false,
      error:
        "MOLLIE_API_KEY is not configured. Add a Mollie API key as a server-side environment variable.",
    };
  }

  if (key.startsWith("test_")) {
    return { ok: true, key, mode: "test" };
  }

  if (key.startsWith("live_")) {
    if (!mollieAllowLiveEnabled(source)) {
      return {
        ok: false,
        error:
          "Live Mollie keys are blocked. Set MOLLIE_ALLOW_LIVE=true (Production) to enable controlled LIVE payments.",
      };
    }
    if (isVercelNonProduction(source)) {
      return {
        ok: false,
        error:
          "Live Mollie keys are not allowed on Vercel preview/development deployments.",
      };
    }
    return { ok: true, key, mode: "live" };
  }

  return {
    ok: false,
    error:
      "MOLLIE_API_KEY must start with test_ (TEST) or live_ (LIVE, requires MOLLIE_ALLOW_LIVE=true).",
  };
}

/** Configured payment mode when the key is valid; otherwise null. */
export function getMollieConfiguredMode(env?: MollieKeyEnv): MollieKeyMode | null {
  const resolved = resolveMollieApiKey(env);
  return resolved.ok ? resolved.mode : null;
}

