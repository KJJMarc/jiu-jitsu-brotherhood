/**
 * JJB must never attach to Kingston Jiu Jitsu production Supabase.
 * Set JJB_SUPABASE_PROJECT_REF to the dedicated JJB project ref after creation;
 * it must match NEXT_PUBLIC_SUPABASE_URL.
 */

import {
  getSupabaseUrl,
  isSupabaseConfigured,
} from "@/lib/supabase/env";

function projectRefFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname;
    const m = host.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

export function getConfiguredJjbProjectRef(): string | null {
  return (
    process.env.JJB_SUPABASE_PROJECT_REF?.trim() ||
    projectRefFromUrl(getSupabaseUrl())
  );
}

export type JjbSupabaseSafety =
  | { ok: true; projectRef: string }
  | { ok: false; reason: string };

/**
 * Positive identification that env points at a dedicated JJB project.
 * Without JJB_SUPABASE_PROJECT_REF explicitly set, we refuse "ready to migrate"
 * even if URL/keys exist — prevents accidental KJJ attachment.
 */
export function assessJjbSupabaseProject(): JjbSupabaseSafety {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      reason:
        "No Supabase URL/anon key configured. Create a dedicated JJB Supabase project and set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const urlRef = projectRefFromUrl(getSupabaseUrl());
  const declared = process.env.JJB_SUPABASE_PROJECT_REF?.trim();

  if (!declared) {
    return {
      ok: false,
      reason:
        "JJB_SUPABASE_PROJECT_REF is not set. Set it to the dedicated JJB project ref (must match the URL) before applying migrations or importing content.",
    };
  }

  if (!urlRef) {
    return {
      ok: false,
      reason: "NEXT_PUBLIC_SUPABASE_URL is not a *.supabase.co project URL.",
    };
  }

  if (declared !== urlRef) {
    return {
      ok: false,
      reason: `JJB_SUPABASE_PROJECT_REF (${declared}) does not match URL project ref (${urlRef}).`,
    };
  }

  const blocklist = (process.env.JJB_SUPABASE_BLOCKLIST_REFS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (blocklist.includes(urlRef)) {
    return {
      ok: false,
      reason:
        "Configured project ref is on JJB_SUPABASE_BLOCKLIST_REFS (KJJ / forbidden). Refuse to proceed.",
    };
  }

  return { ok: true, projectRef: urlRef };
}

/** Public/content reads: soft-fail when not configured. */
export function isJjbContentBackendAvailable(): boolean {
  return isSupabaseConfigured();
}

/** Hard gate for migrations / importer --write. */
export function assertJjbSupabaseReadyForWrites(): string {
  const assessment = assessJjbSupabaseProject();
  if (!assessment.ok) {
    throw new Error(`JJB Supabase not ready: ${assessment.reason}`);
  }
  return assessment.projectRef;
}
