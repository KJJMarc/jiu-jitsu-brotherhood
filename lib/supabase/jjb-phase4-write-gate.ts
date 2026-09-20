/**
 * Hard write gate for JJB Phase 4 comments schema/import.
 * Refuses legacy JWT keys and any non-JJB / blocklisted project.
 * Never logs or returns credential values.
 */

import {
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
} from "@/lib/supabase/env";
import { assessJjbSupabaseProject } from "@/lib/supabase/jjb-project";

export const JJB_AUTHORISED_PROJECT_REF = "ftdrmuggvejpbkybpwgt";
export const JJB_HARD_BLOCKLIST_REFS = ["rfabtdqvbgdjzuakvkee"] as const;

export type Phase4WriteGate =
  | { ok: true; projectRef: string }
  | { ok: false; reason: string };

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

function keyKind(
  value: string | undefined,
): "sb_publishable_" | "sb_secret_" | "legacy_jwt" | "missing" | "other" {
  if (!value) return "missing";
  if (value.startsWith("sb_publishable_")) return "sb_publishable_";
  if (value.startsWith("sb_secret_")) return "sb_secret_";
  if (value.startsWith("eyJ")) return "legacy_jwt";
  return "other";
}

/**
 * Mandatory Phase 4 pre-write checks. Abort on any failure.
 */
export function assessJjbPhase4WriteGate(): Phase4WriteGate {
  const assessment = assessJjbSupabaseProject();
  if (!assessment.ok) {
    return { ok: false, reason: assessment.reason };
  }

  const urlRef = projectRefFromUrl(getSupabaseUrl());
  if (!urlRef) {
    return {
      ok: false,
      reason: "NEXT_PUBLIC_SUPABASE_URL is not a *.supabase.co project URL.",
    };
  }

  if (urlRef !== JJB_AUTHORISED_PROJECT_REF) {
    return {
      ok: false,
      reason: `URL project ref is not the authorised JJB ref (${JJB_AUTHORISED_PROJECT_REF}).`,
    };
  }

  if (assessment.projectRef !== JJB_AUTHORISED_PROJECT_REF) {
    return {
      ok: false,
      reason: `JJB_SUPABASE_PROJECT_REF is not the authorised JJB ref (${JJB_AUTHORISED_PROJECT_REF}).`,
    };
  }

  const envBlocklist = (process.env.JJB_SUPABASE_BLOCKLIST_REFS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const blocklist = new Set<string>([
    ...JJB_HARD_BLOCKLIST_REFS,
    ...envBlocklist,
  ]);

  // urlRef / assessment.projectRef already required to equal JJB_AUTHORISED;
  // still refuse if that authorised ref were ever added to a blocklist by mistake.
  if (blocklist.has(urlRef) || blocklist.has(assessment.projectRef)) {
    return {
      ok: false,
      reason:
        "Configured project ref is blocklisted (KJJ / forbidden). Refuse to proceed.",
    };
  }

  const anonKind = keyKind(getSupabaseAnonKey());
  if (anonKind !== "sb_publishable_") {
    return {
      ok: false,
      reason:
        `NEXT_PUBLIC_SUPABASE_ANON_KEY must begin with sb_publishable_ (observed kind: ${anonKind}). Aborting before writes.`,
    };
  }

  const serviceKind = keyKind(getSupabaseServiceRoleKey());
  if (serviceKind !== "sb_secret_") {
    return {
      ok: false,
      reason:
        `SUPABASE_SERVICE_ROLE_KEY must begin with sb_secret_ (observed kind: ${serviceKind}). Aborting before writes.`,
    };
  }

  return { ok: true, projectRef: urlRef };
}

export function assertJjbPhase4WriteGate(): string {
  const gate = assessJjbPhase4WriteGate();
  if (!gate.ok) {
    throw new Error(`JJB Phase 4 write gate failed: ${gate.reason}`);
  }
  return gate.projectRef;
}
