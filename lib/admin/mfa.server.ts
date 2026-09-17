import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ADMIN_HOME_PATH,
  ADMIN_MFA_SETUP_PATH,
  ADMIN_MFA_VERIFY_PATH,
} from "@/lib/admin/paths";

export type AdminMfaStatus =
  | { kind: "needs_enrollment" }
  | { kind: "needs_challenge"; factorId: string }
  | { kind: "satisfied" };

/**
 * Resolve MFA requirements for the current Supabase session.
 * Requires MFA enrolment for every allowlisted admin (TOTP only).
 */
export async function resolveAdminMfaStatus(): Promise<AdminMfaStatus> {
  const supabase = await createSupabaseServerClient();

  const { data: aal, error: aalError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (aalError) {
    console.error("[admin-mfa] AAL check failed", aalError.message);
    return { kind: "needs_enrollment" };
  }

  if (aal.currentLevel === "aal2") {
    return { kind: "satisfied" };
  }

  const { data: factors, error: factorsError } =
    await supabase.auth.mfa.listFactors();

  if (factorsError) {
    console.error("[admin-mfa] listFactors failed", factorsError.message);
    return { kind: "needs_enrollment" };
  }

  const verifiedTotp = factors.totp.filter(
    (factor) => factor.status === "verified",
  );

  if (verifiedTotp.length === 0) {
    return { kind: "needs_enrollment" };
  }

  return {
    kind: "needs_challenge",
    factorId: verifiedTotp[0].id,
  };
}

export function pathForAdminMfaStatus(status: AdminMfaStatus): string {
  if (status.kind === "satisfied") return ADMIN_HOME_PATH;
  if (status.kind === "needs_enrollment") return ADMIN_MFA_SETUP_PATH;
  return ADMIN_MFA_VERIFY_PATH;
}

/** Remove unfinished TOTP enrolments so a fresh QR can be issued. */
export async function clearUnverifiedTotpFactors(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.mfa.listFactors();

  if (error || !data) {
    return;
  }

  const unverified = data.all.filter(
    (factor) => factor.factor_type === "totp" && factor.status === "unverified",
  );

  for (const factor of unverified) {
    await supabase.auth.mfa.unenroll({ factorId: factor.id });
  }
}

export async function enrollAdminTotpFactor(): Promise<{
  factorId: string;
  qrCode: string;
  secret: string;
}> {
  await clearUnverifiedTotpFactors();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "JJB Admin Authenticator",
  });

  if (error || !data?.id || !data.totp?.qr_code || !data.totp?.secret) {
    throw new Error("Unable to start authenticator setup.");
  }

  return {
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
  };
}

export async function verifyAdminTotpCode(input: {
  factorId: string;
  code: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const code = input.code.replace(/\s+/g, "");

  if (!/^\d{6}$/.test(code)) {
    return { ok: false, error: "Enter the 6-digit authenticator code." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId: input.factorId,
    code,
  });

  if (error) {
    return { ok: false, error: "Invalid authenticator code." };
  }

  return { ok: true };
}
