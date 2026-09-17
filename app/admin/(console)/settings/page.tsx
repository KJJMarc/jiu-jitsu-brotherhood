import type { Metadata } from "next";
import AdminSiteSettingsForm from "@/components/admin/settings/AdminSiteSettingsForm";
import { getAdminSiteSettings } from "@/lib/admin/site-settings.server";
import styles from "@/app/admin/admin.module.css";

export const metadata: Metadata = {
  title: "Site Settings",
};

export default async function AdminSiteSettingsPage() {
  const { settings, errorMessage } = await getAdminSiteSettings();

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>Website</p>
        <h1>Site Settings</h1>
      </header>

      {errorMessage ? (
        <section className={styles.panel}>
          <p className={styles.formError} role="alert">
            Could not load settings from Supabase: <code>{errorMessage}</code>
            <br />
            Showing codebase defaults. Apply{" "}
            <code>supabase/migrations/20260912130000_site_settings.sql</code>{" "}
            (includes GRANTs), then refresh.
          </p>
        </section>
      ) : null}

      <AdminSiteSettingsForm settings={settings} />
    </div>
  );
}
