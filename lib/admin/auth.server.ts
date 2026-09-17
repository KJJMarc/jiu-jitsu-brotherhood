import "server-only";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  pathForAdminMfaStatus,
  resolveAdminMfaStatus,
} from "@/lib/admin/mfa.server";
import {
  ADMIN_HOME_PATH,
  ADMIN_LOGIN_PATH,
  type AdminSession,
} from "@/lib/admin/paths";

export type AdminAuthState =
  | { status: "unconfigured" }
  | { status: "signed_out" }
  | { status: "forbidden"; email: string | null }
  | {
      status: "authenticated";
      session: AdminSession;
      mfa: Awaited<ReturnType<typeof resolveAdminMfaStatus>>;
    };

/**
 * Returns whether the given auth user is on the admin allowlist.
 * Uses the cookie-backed (anon) client + RLS: users may only read their own row.
 */
export async function isAllowlistedAdmin(userId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[admin-auth] allowlist check failed", error.message);
    return false;
  }

  return Boolean(data?.user_id);
}

export async function resolveAdminAuthState(): Promise<AdminAuthState> {
  if (!isSupabaseConfigured()) {
    return { status: "unconfigured" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { status: "signed_out" };
  }

  const allowed = await isAllowlistedAdmin(user.id);
  if (!allowed) {
    return { status: "forbidden", email: user.email ?? null };
  }

  const mfa = await resolveAdminMfaStatus();

  return {
    status: "authenticated",
    session: {
      userId: user.id,
      email: user.email ?? null,
    },
    mfa,
  };
}

/**
 * Authenticated + allowlisted only (AAL1 is enough).
 * Used by MFA setup/verify pages so users can complete the second factor.
 */
export async function requireAllowlistedAdmin(): Promise<AdminSession> {
  const state = await resolveAdminAuthState();

  if (state.status === "unconfigured") {
    redirect(`${ADMIN_LOGIN_PATH}?error=config`);
  }

  if (state.status === "signed_out") {
    redirect(ADMIN_LOGIN_PATH);
  }

  if (state.status === "forbidden") {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    redirect(`${ADMIN_LOGIN_PATH}?error=denied`);
  }

  return state.session;
}

/**
 * Server-side guard for protected admin console pages and Server Actions.
 * Requires allowlist membership and AAL2 (completed TOTP MFA for this session).
 */
export async function requireAdmin(): Promise<AdminSession> {
  const state = await resolveAdminAuthState();

  if (state.status === "unconfigured") {
    redirect(`${ADMIN_LOGIN_PATH}?error=config`);
  }

  if (state.status === "signed_out") {
    redirect(ADMIN_LOGIN_PATH);
  }

  if (state.status === "forbidden") {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    redirect(`${ADMIN_LOGIN_PATH}?error=denied`);
  }

  if (state.mfa.kind !== "satisfied") {
    redirect(pathForAdminMfaStatus(state.mfa));
  }

  return state.session;
}

/**
 * After password login (or visiting /admin/login/ while signed in), send the
 * admin to the correct next step without creating MFA ↔ login loops.
 */
export async function redirectAuthenticatedAdminToNextStep(): Promise<void> {
  const state = await resolveAdminAuthState();

  if (state.status !== "authenticated") {
    return;
  }

  redirect(pathForAdminMfaStatus(state.mfa));
}

/** @deprecated Prefer redirectAuthenticatedAdminToNextStep */
export async function redirectIfAuthenticatedAdmin(): Promise<void> {
  await redirectAuthenticatedAdminToNextStep();
}
