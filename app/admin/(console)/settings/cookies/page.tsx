import type { Metadata } from "next";
import Link from "next/link";
import { AdminFormSection } from "@/components/admin/AdminFormSection";
import {
  isGoogleTagConfigured,
  isMetaPixelConfigured,
} from "@/lib/tracking-settings";
import { getTrackingSettings } from "@/lib/tracking-settings.server";
import styles from "@/app/admin/admin.module.css";

export const metadata: Metadata = {
  title: "Cookies & Privacy",
};

export default async function AdminCookiesPrivacyPage() {
  const tracking = await getTrackingSettings();
  const googleConfigured = isGoogleTagConfigured(tracking);
  const metaConfigured = isMetaPixelConfigured(tracking);

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>Website</p>
        <h1>Cookies &amp; Privacy</h1>
      </header>

      <AdminFormSection
        title="Cookie consent"
        description="Optional analytics and marketing tools only run with visitor consent."
      >
        <ul className={styles.statusList}>
          <li>
            <span className={styles.badgeOk}>Always active</span>
            Necessary cookies
          </li>
          <li>
            <span className={styles.badgeSoon}>Consent required</span>
            Analytics cookies
          </li>
          <li>
            <span className={styles.badgeSoon}>Consent required</span>
            Marketing cookies
          </li>
          <li>
            <span className={styles.badgeSoon}>Pages</span>
            Cookie Policy — Managed under Content → Pages
          </li>
        </ul>

        <div className={styles.formActions}>
          <a
            className={styles.secondaryButtonLink}
            href="/cookie-policy/"
            target="_blank"
            rel="noopener noreferrer"
          >
            View Cookie Policy
          </a>
          <a
            className={styles.primaryButtonLink}
            href="/cookie-policy/?manage-cookies=1"
            target="_blank"
            rel="noopener noreferrer"
          >
            Test Cookie Preferences
          </a>
        </div>
      </AdminFormSection>

      <AdminFormSection
        title="Privacy &amp; data requests"
        description="Privacy requests should be handled across all systems where personal data is stored."
      >
        <ul className={styles.statusList}>
          <li>
            <span className={styles.badgeSoon}>Pages</span>
            Privacy Policy — Managed under Content → Pages
          </li>
        </ul>

        <div className={styles.formActions}>
          <a
            className={styles.secondaryButtonLink}
            href="/privacy-policy/"
            target="_blank"
            rel="noopener noreferrer"
          >
            View Privacy Policy
          </a>
        </div>
      </AdminFormSection>

      <AdminFormSection title="Consent configuration">
        <ul className={styles.statusList}>
          <li>
            {googleConfigured ? (
              <span className={styles.badgeOk}>Configured</span>
            ) : (
              <span className={styles.badgeSoon}>Not configured</span>
            )}
            Google Analytics / Google tracking
          </li>
          <li>
            {metaConfigured ? (
              <span className={styles.badgeOk}>Configured</span>
            ) : (
              <span className={styles.badgeSoon}>Not configured</span>
            )}
            Meta Pixel
          </li>
        </ul>
        <p className={styles.fieldHint}>
          Managed under{" "}
          <Link href="/admin/settings/tracking/">Tracking &amp; Pixels</Link>.
        </p>
      </AdminFormSection>
    </div>
  );
}
