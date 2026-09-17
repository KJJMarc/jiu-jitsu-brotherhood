import type { Metadata } from "next";
import Image from "next/image";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import ForgotPasswordForm from "./ForgotPasswordForm";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminForgotPasswordPage() {
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
          <h1>Forgot password</h1>
          <p>
            Enter your admin email and we&apos;ll send reset instructions if an
            account exists.
          </p>
        </div>
        {configHint ? (
          <p className={styles.formError} role="status">
            {configHint}
          </p>
        ) : null}
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
