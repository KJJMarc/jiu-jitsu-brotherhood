import type { Metadata } from "next";
import AdminWordmark from "@/components/admin/AdminWordmark";
import { ADMIN_RESET_PASSWORD_PATH } from "@/lib/admin/paths";
import { safeAdminRedirectPath } from "@/lib/admin/site-url.server";
import ConfirmSessionClient from "./ConfirmSessionClient";
import styles from "@/app/admin/admin.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Completing sign-in",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Client-handled entry for Supabase invite / recovery redirects.
 * Must be a page (not a Route Handler) so URL hash tokens remain available
 * in the browser for setSession, then are cleared from the address bar.
 */
export default async function AdminAuthConfirmPage({
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
          <AdminWordmark className={styles.loginLogo} />
          <h1>Admin account</h1>
          <p>Finishing your invite or password reset…</p>
        </div>
        <ConfirmSessionClient nextPath={nextPath} />
      </div>
    </div>
  );
}
