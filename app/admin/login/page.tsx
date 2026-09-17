import type { Metadata } from "next";
import Image from "next/image";
import { redirectAuthenticatedAdminToNextStep } from "@/lib/admin/auth.server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import AdminLoginForm from "./LoginForm";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false, nocache: true },
};

function messageForError(code: string | undefined): string | null {
  if (code === "denied") {
    return "You do not have access to the admin area.";
  }
  if (code === "config") {
    return "Admin sign-in is not configured yet. Add the KJJ Supabase environment variables.";
  }
  if (code === "reset_link") {
    return "That password reset link is invalid or has expired. Request a new one below.";
  }
  return null;
}

function messageForSuccess(code: string | undefined): string | null {
  if (code === "success") {
    return "Password updated. Sign in with your new password.";
  }
  return null;
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string }>;
}) {
  await redirectAuthenticatedAdminToNextStep();

  const params = await searchParams;
  const queryError = messageForError(params.error);
  const querySuccess = messageForSuccess(params.reset);
  const configHint = !isSupabaseConfigured()
    ? "Supabase environment variables are not set on this deployment."
    : null;

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <div className={styles.loginBrand}>
          <Image
            src="/images/logo.png"
            alt="Kingston Jiu Jitsu"
            width={220}
            height={56}
            className={styles.loginLogo}
            priority
          />
          <h1>Admin</h1>
          <p>Sign in with your authorised Kingston Jiu Jitsu account.</p>
        </div>
        {configHint ? (
          <p className={styles.formError} role="status">
            {configHint}
          </p>
        ) : null}
        <AdminLoginForm
          initialError={queryError}
          initialSuccess={querySuccess}
        />
      </div>
    </div>
  );
}
