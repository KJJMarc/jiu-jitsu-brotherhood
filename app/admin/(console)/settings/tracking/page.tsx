import type { Metadata } from "next";
import AdminTrackingSettingsForm from "@/components/admin/settings/AdminTrackingSettingsForm";
import { getAdminTrackingSettings } from "@/lib/admin/tracking-settings.server";
import styles from "@/app/admin/admin.module.css";

export const metadata: Metadata = {
  title: "Tracking & Pixels",
};

export default async function AdminTrackingSettingsPage() {
  const { settings, errorMessage } = await getAdminTrackingSettings();

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>Website</p>
        <h1>Tracking &amp; Pixels</h1>
      </header>

      {errorMessage ? (
        <section className={styles.panel}>
          <p className={styles.formError} role="alert">
            Could not load tracking settings from Supabase:{" "}
            <code>{errorMessage}</code>
            <br />
            Showing disabled defaults. Apply{" "}
            <code>supabase/migrations/20260912140000_tracking_settings.sql</code>{" "}
            (includes GRANTs), then refresh.
          </p>
        </section>
      ) : null}

      <AdminTrackingSettingsForm settings={settings} />
    </div>
  );
}
