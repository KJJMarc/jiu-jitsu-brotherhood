"use server";

import { redirect } from "next/navigation";
import {
  ADMIN_AUTH_CONFIRM_PATH,
  ADMIN_FORGOT_PASSWORD_PATH,
  ADMIN_LOGIN_PATH,
  ADMIN_RESET_PASSWORD_PATH,
} from "@/lib/admin/paths";
import { getAdminPublicOrigin } from "@/lib/admin/site-url.server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type PasswordActionState = {
  error: string | null;
  success: string | null;
};

const GENERIC_RESET_MESSAGE =
  "If an account exists for that email, we've sent password reset instructions.";

function recoveryRedirectTo(): string {
  const origin = getAdminPublicOrigin();
  const next = encodeURIComponent(ADMIN_RESET_PASSWORD_PATH);
  return `${origin}${ADMIN_AUTH_CONFIRM_PATH}?next=${next}`;
}

export async function requestPasswordResetAction(
  _prev: PasswordActionState,
  formData: FormData,
): Promise<PasswordActionState> {
  if (!isSupabaseConfigured()) {
    return {
      error: "Password reset is not configured yet.",
      success: null,
    };
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address.", success: null };
  }

  try {
    const supabase = await createSupabaseServerClient();
    // Ignore Auth errors deliberately — always return the same message
    // so this endpoint cannot be used for account enumeration.
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: recoveryRedirectTo(),
    });
  } catch {
    // Same generic response on unexpected failures.
  }

  return { error: null, success: GENERIC_RESET_MESSAGE };
}

export async function updatePasswordAction(
  _prev: PasswordActionState,
  formData: FormData,
): Promise<PasswordActionState> {
  if (!isSupabaseConfigured()) {
    return {
      error: "Password update is not configured yet.",
      success: null,
    };
  }

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (password.length < 10) {
    return {
      error: "Password must be at least 10 characters.",
      success: null,
    };
  }

  if (password !== confirm) {
    return {
      error: "Passwords do not match.",
      success: null,
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error:
        "This reset link is invalid or has expired. Request a new one from the login page.",
      success: null,
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return {
      error: error.message || "Could not update password.",
      success: null,
    };
  }

  await supabase.auth.signOut();
  redirect(`${ADMIN_LOGIN_PATH}?reset=success`);
}

/** Used when the reset page is opened without a valid recovery session. */
export async function redirectToForgotPassword() {
  redirect(ADMIN_FORGOT_PASSWORD_PATH);
}
