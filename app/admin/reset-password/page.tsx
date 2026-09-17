import type { Metadata } from "next";
import Image from "next/image";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import ResetPasswordForm from "./ResetPasswordForm";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Set new password",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminResetPasswordPage() {
  let hasSession = false;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      hasSession = Boolean(user);
    } catch {
      hasSession = false;
    }
  }

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
          <h1>Set new password</h1>
          <p>Choose a new password for your Kingston Jiu Jitsu admin account.</p>
        </div>
        <ResetPasswordForm hasSession={hasSession} />
      </div>
    </div>
  );
}
