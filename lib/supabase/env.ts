/**
 * Shared Supabase environment helpers for the dedicated Jiu Jitsu Brotherhood
 * project. Never put SUPABASE_SERVICE_ROLE_KEY behind a NEXT_PUBLIC_ prefix.
 */

/** Trim and strip a single layer of wrapping quotes from Vercel/env pastes. */
function sanitiseEnvValue(value: string | undefined): string | undefined {
  if (value == null) return undefined;
  let trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed || undefined;
}

export function getSupabaseUrl(): string | undefined {
  return sanitiseEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getSupabaseAnonKey(): string | undefined {
  return sanitiseEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getSupabaseServiceRoleKey(): string | undefined {
  return sanitiseEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

export function requireSupabaseUrl(): string {
  const url = getSupabaseUrl();
  if (!url) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL. Add the JJB Supabase project URL.",
    );
  }
  return url;
}

export function requireSupabaseAnonKey(): string {
  const key = getSupabaseAnonKey();
  if (!key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Add the JJB Supabase anon key.",
    );
  }
  return key;
}
