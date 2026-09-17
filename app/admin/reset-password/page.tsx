import type { Metadata } from "next";
import AdminWordmark from "@/components/admin/AdminWordmark";
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
          <AdminWordmark className={styles.loginLogo} />
          <h1>Set new password</h1>
          <p>Choose a new password for your Jiu Jitsu Brotherhood admin account.</p>
        </div>
        <ResetPasswordForm hasSession={hasSession} />
      </div>
    </div>
  );
}
