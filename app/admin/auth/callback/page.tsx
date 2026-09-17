import type { Metadata } from "next";
import Image from "next/image";
import { ADMIN_RESET_PASSWORD_PATH } from "@/lib/admin/paths";
import { safeAdminRedirectPath } from "@/lib/admin/site-url.server";
import ConfirmSessionClient from "../confirm/ConfirmSessionClient";
import styles from "@/app/admin/admin.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Completing sign-in",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Legacy Auth redirect path (same client handler as /admin/auth/confirm/).
 * Kept so older emails still work; fragment tokens require a page, not a
 * Route Handler.
 */
export default async function AdminAuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = safeAdminRedirectPath(
    params.next,
    ADMIN_RESET_PASSWORD_PATH,
  );

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
          <h1>Admin account</h1>
          <p>Finishing your invite or password reset…</p>
        </div>
        <ConfirmSessionClient nextPath={nextPath} />
      </div>
    </div>
  );
}
