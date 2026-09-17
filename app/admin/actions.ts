"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  isAllowlistedAdmin,
  requireAllowlistedAdmin,
} from "@/lib/admin/auth.server";
import {
  pathForAdminMfaStatus,
  resolveAdminMfaStatus,
  verifyAdminTotpCode,
} from "@/lib/admin/mfa.server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  ADMIN_HOME_PATH,
  ADMIN_LOGIN_PATH,
  ADMIN_MFA_SETUP_PATH,
  ADMIN_MFA_VERIFY_PATH,
} from "@/lib/admin/paths";

export type LoginActionState = {
  error: string | null;
};

export type MfaActionState = {
  error: string | null;
};

export async function signInAdminAction(
  _prev: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  if (!isSupabaseConfigured()) {
    return {
      error:
        "Admin sign-in is not configured yet. Add Supabase environment variables for the JJB project.",
    };
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: "Invalid email or password." };
  }

  const allowed = await isAllowlistedAdmin(data.user.id);
  if (!allowed) {
    await supabase.auth.signOut();
    return { error: "You do not have access to the admin area." };
  }

  const mfa = await resolveAdminMfaStatus();
  redirect(pathForAdminMfaStatus(mfa));
}

export async function signOutAdminAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect(ADMIN_LOGIN_PATH);
}

export async function verifyMfaSetupAction(
  _prev: MfaActionState,
  formData: FormData,
): Promise<MfaActionState> {
  await requireAllowlistedAdmin();

  const mfa = await resolveAdminMfaStatus();
  if (mfa.kind === "satisfied") {
    redirect(ADMIN_HOME_PATH);
  }
  if (mfa.kind === "needs_challenge") {
    redirect(ADMIN_MFA_VERIFY_PATH);
  }

  const factorId = String(formData.get("factorId") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();

  if (!factorId) {
    return { error: "Authenticator setup expired. Refresh and try again." };
  }

  const result = await verifyAdminTotpCode({ factorId, code });
  if (!result.ok) {
    return { error: result.error };
  }

  redirect(ADMIN_HOME_PATH);
}

export async function verifyMfaChallengeAction(
  _prev: MfaActionState,
  formData: FormData,
): Promise<MfaActionState> {
  await requireAllowlistedAdmin();

  const mfa = await resolveAdminMfaStatus();
  if (mfa.kind === "satisfied") {
    redirect(ADMIN_HOME_PATH);
  }
  if (mfa.kind === "needs_enrollment") {
    redirect(ADMIN_MFA_SETUP_PATH);
  }

  const code = String(formData.get("code") ?? "").trim();
  const result = await verifyAdminTotpCode({
    factorId: mfa.factorId,
    code,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  redirect(ADMIN_HOME_PATH);
}
