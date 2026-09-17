import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { signOutAdminAction } from "@/app/admin/actions";
import { resolveAdminMfaStatus } from "@/lib/admin/mfa.server";
import { ADMIN_MFA_SETUP_PATH } from "@/lib/admin/paths";
import MfaVerifyForm from "./VerifyForm";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Enter authenticator code",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminMfaVerifyPage() {
  const mfa = await resolveAdminMfaStatus();
  if (mfa.kind === "needs_enrollment") {
    redirect(ADMIN_MFA_SETUP_PATH);
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
          <h1>Enter authenticator code</h1>
          <p>
            Open your authenticator app and enter the current 6-digit code to
            continue to the admin area.
          </p>
        </div>

        <MfaVerifyForm />

        <form action={signOutAdminAction} className={styles.mfaFooterAction}>
          <button type="submit" className={styles.textButton}>
            Sign out and return to login
          </button>
        </form>
      </div>
    </div>
  );
}
