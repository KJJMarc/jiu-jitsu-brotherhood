import type { Metadata } from "next";
import AdminWordmark from "@/components/admin/AdminWordmark";
import { redirect } from "next/navigation";
import { signOutAdminAction } from "@/app/admin/actions";
import {
  enrollAdminTotpFactor,
  resolveAdminMfaStatus,
} from "@/lib/admin/mfa.server";
import { ADMIN_MFA_VERIFY_PATH } from "@/lib/admin/paths";
import MfaSetupForm from "./SetupForm";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Set up authenticator",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminMfaSetupPage() {
  const mfa = await resolveAdminMfaStatus();
  if (mfa.kind === "needs_challenge") {
    redirect(ADMIN_MFA_VERIFY_PATH);
  }

  let enrollment: Awaited<ReturnType<typeof enrollAdminTotpFactor>>;
  try {
    enrollment = await enrollAdminTotpFactor();
  } catch {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginCard}>
          <div className={styles.loginBrand}>
            <AdminWordmark className={styles.loginLogo} />
            <h1>Set up authenticator</h1>
            <p>
              Authenticator setup could not be started. Sign out and try again,
              or confirm MFA is enabled in the Supabase project.
            </p>
          </div>
          <form action={signOutAdminAction}>
            <button type="submit" className={styles.secondaryButton}>
              Sign out
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.loginPage}>
      <div className={`${styles.loginCard} ${styles.mfaCard}`}>
        <div className={styles.loginBrand}>
          <AdminWordmark className={styles.loginLogo} />
          <h1>Set up authenticator</h1>
          <p>
            Scan the QR code with an authenticator app (Google Authenticator,
            1Password, Authy, etc.), then enter the 6-digit code to finish
            securing your admin account.
          </p>
        </div>

        <div className={styles.qrWrap}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={enrollment.qrCode}
            alt="Authenticator QR code"
            className={styles.qrImage}
            width={180}
            height={180}
          />
        </div>

        <div className={styles.secretBox}>
          <p className={styles.secretLabel}>Manual setup key</p>
          <code className={styles.secretValue}>{enrollment.secret}</code>
          <p className={styles.secretHint}>
            Use this key if you cannot scan the QR code.
          </p>
        </div>

        <MfaSetupForm factorId={enrollment.factorId} />

        <form action={signOutAdminAction} className={styles.mfaFooterAction}>
          <button type="submit" className={styles.textButton}>
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
