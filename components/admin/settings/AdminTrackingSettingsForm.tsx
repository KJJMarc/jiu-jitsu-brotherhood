"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { AdminFormSection } from "@/components/admin/AdminFormSection";
import {
  updateTrackingSettingsAction,
  type TrackingSettingsFormState,
} from "@/app/admin/(console)/settings/tracking/actions";
import {
  isGoogleTagConfigured,
  isMetaPixelConfigured,
  type TrackingSettings,
} from "@/lib/tracking-settings";
import styles from "@/app/admin/admin.module.css";

const initialState: TrackingSettingsFormState = {
  error: null,
  success: null,
};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.primaryButton} disabled={pending}>
      {pending ? "Saving…" : "Save Pixel Settings"}
    </button>
  );
}

function formatUpdatedAt(value?: string): string | null {
  if (!value) return null;
  try {
    return new Date(value).toLocaleString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

export default function AdminTrackingSettingsForm({
  settings,
}: {
  settings: TrackingSettings;
}) {
  const [state, formAction] = useFormState(
    updateTrackingSettingsAction,
    initialState,
  );

  const metaReady = isMetaPixelConfigured(settings);
  const googleReady = isGoogleTagConfigured(settings);
  const updatedLabel = formatUpdatedAt(settings.updated_at);

  return (
    <>
      <form className={styles.articleForm} action={formAction}>
        <AdminFormSection
          title="Academy tracking pixels"
          description="Configure Meta Pixel and Google tags for public Kingston Jiu Jitsu marketing pages. Scripts only load after cookie consent."
        >
          <div className={styles.trackingBlock}>
            <label className={styles.checkRow}>
              <input
                type="checkbox"
                name="meta_pixel_enabled"
                defaultChecked={settings.meta_pixel_enabled}
              />
              <span>Enable Meta Pixel tracking</span>
            </label>
            <div className={styles.field}>
              <label htmlFor="meta_pixel_id">Meta Pixel ID</label>
              <input
                id="meta_pixel_id"
                name="meta_pixel_id"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="e.g. 3277399695814581"
                defaultValue={settings.meta_pixel_id ?? ""}
              />
              <p className={styles.fieldHint}>
                Find this in Meta Events Manager → Data Sources → Pixel.
              </p>
            </div>
          </div>

          <div className={styles.trackingBlock}>
            <label className={styles.checkRow}>
              <input
                type="checkbox"
                name="google_enabled"
                defaultChecked={settings.google_enabled}
              />
              <span>Enable Google tracking</span>
            </label>
            <div className={styles.field}>
              <label htmlFor="google_tag_id">
                Google tag ID or GA4 Measurement ID
              </label>
              <input
                id="google_tag_id"
                name="google_tag_id"
                type="text"
                autoComplete="off"
                placeholder="AW-XXXXXXXX or G-XXXXXXXX"
                defaultValue={settings.google_tag_id ?? ""}
              />
              <p className={styles.fieldHint}>
                Use an <code>AW-</code> ID for Google Ads / remarketing, or a{" "}
                <code>G-</code> ID for GA4 reporting.
              </p>
            </div>
            <div className={styles.field}>
              <label htmlFor="google_ads_conversion_label">
                Google Ads conversion label
              </label>
              <input
                id="google_ads_conversion_label"
                name="google_ads_conversion_label"
                type="text"
                autoComplete="off"
                placeholder="Optional — from Ads conversion send_to"
                defaultValue={settings.google_ads_conversion_label ?? ""}
              />
              <p className={styles.fieldHint}>
                Trial enquiry conversions usually fire on Dojo Director thank-you
                pages. Store the label here for parity; marketing-site pageviews
                still use the Google tag above after consent.
              </p>
            </div>
          </div>
        </AdminFormSection>

        {state.error ? (
          <p className={styles.formError} role="alert">
            {state.error}
          </p>
        ) : null}
        {state.success ? (
          <p className={styles.formSuccess} role="status">
            {state.success}
          </p>
        ) : null}

        <div className={styles.formActions}>
          <SaveButton />
          <Link className={styles.secondaryButtonLink} href="/admin/settings/tracking/">
            Cancel
          </Link>
        </div>
      </form>

      <section className={styles.panel}>
        <div className={styles.trackingStatusHeader}>
          <h2>Tracking status</h2>
          <a
            className={styles.secondaryButtonCompact}
            href="/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Test Tracking
          </a>
        </div>
        <p className={styles.fieldHint}>
          Status reflects saved admin settings. Live browser verification still
          needs Meta Pixel Helper / Google Tag Assistant on a public page after
          accepting cookies.
        </p>
        <div className={styles.trackingStatusGrid}>
          <article className={styles.trackingStatusCard}>
            <p className={styles.statLabel}>Meta Pixel</p>
            <p className={styles.trackingStatusValue}>
              {metaReady ? (
                <span className={styles.badgeOk}>Configured</span>
              ) : (
                <span className={styles.badgeSoon}>Inactive</span>
              )}
            </p>
            <p className={styles.statHint}>
              {metaReady
                ? `ID ${settings.meta_pixel_id}`
                : "Enable Meta and save a numeric Pixel ID."}
            </p>
            {updatedLabel ? (
              <p className={styles.statHint}>Settings updated {updatedLabel}</p>
            ) : null}
          </article>
          <article className={styles.trackingStatusCard}>
            <p className={styles.statLabel}>Google tag</p>
            <p className={styles.trackingStatusValue}>
              {googleReady ? (
                <span className={styles.badgeOk}>Configured</span>
              ) : (
                <span className={styles.badgeSoon}>Inactive</span>
              )}
            </p>
            <p className={styles.statHint}>
              {googleReady
                ? `ID ${settings.google_tag_id}`
                : "Enable Google and save an AW- or G- tag ID."}
            </p>
            {settings.google_ads_conversion_label ? (
              <p className={styles.statHint}>
                Conversion label saved ({settings.google_ads_conversion_label})
              </p>
            ) : null}
          </article>
        </div>
      </section>

      <section className={styles.panel}>
        <h2>Setup guide</h2>
        <div className={styles.setupGuide}>
          <details open>
            <summary>How to find your Meta Pixel ID</summary>
            <ol>
              <li>Open Meta Events Manager.</li>
              <li>
                Select <strong>Data Sources</strong> in the left menu, then choose
                your Pixel.
              </li>
              <li>Copy the numeric Pixel ID shown at the top of the overview.</li>
              <li>Paste it into the Meta Pixel ID field above and save.</li>
            </ol>
          </details>

          <details>
            <summary>How to find your Google Tag ID</summary>
            <ol>
              <li>
                <strong>Google Ads:</strong> use the Google tag ID from Tools →
                Conversions → your conversion action (format{" "}
                <code>AW-XXXXXXXX</code>).
              </li>
              <li>
                <strong>GA4 reporting:</strong> use Admin → Data streams →
                Measurement ID (format <code>G-XXXXXXXX</code>).
              </li>
              <li>Paste the ID into the Google tag ID field above and save.</li>
            </ol>
          </details>

          <details>
            <summary>
              How to create a Google Ads trial enquiry conversion action
            </summary>
            <ol>
              <li>
                Sign in to Google Ads and open Goals → Conversions → Summary.
              </li>
              <li>
                Click <strong>+ New conversion action</strong>, then choose{" "}
                <strong>Website</strong>.
              </li>
              <li>
                Select category <strong>Lead</strong> and goal{" "}
                <strong>Submit lead form</strong> (or Contact).
              </li>
              <li>
                Name it clearly (e.g. “Trial Enquiry - Kingston Jiu Jitsu”).
              </li>
              <li>
                Choose <strong>Use Google tag</strong>, then create the action.
              </li>
              <li>
                Open the conversion action and copy the{" "}
                <strong>Conversion label</strong> (the part after the slash in{" "}
                <code>send_to</code>).
              </li>
              <li>
                Enter the <code>AW-</code> tag ID and conversion label here, then
                save. Keep the same values in Dojo Director Pixel Settings for
                the trial enquiry thank-you page.
              </li>
              <li>
                In your Leads campaign, set this conversion action as the primary
                optimisation goal.
              </li>
            </ol>
          </details>

          <details>
            <summary>How to verify Meta using Pixel Helper</summary>
            <ol>
              <li>Install the Meta Pixel Helper extension in Chrome.</li>
              <li>
                Open a public academy page (or use <strong>Test Tracking</strong>
                ) in the same browser and accept cookies if prompted.
              </li>
              <li>
                Click the Pixel Helper icon — you should see your Pixel ID and a{" "}
                <code>PageView</code> event.
              </li>
              <li>
                Trial enquiry <code>Lead</code> events are verified on the Dojo
                Director thank-you flow, not on this marketing site alone.
              </li>
            </ol>
          </details>

          <details>
            <summary>
              How to verify Google tags before launching ads
            </summary>
            <ol>
              <li>
                Install Google Tag Assistant (Legacy or Companion) in Chrome.
              </li>
              <li>
                Open the public site homepage and accept analytics/marketing
                cookies.
              </li>
              <li>
                Confirm the <code>AW-</code> or <code>G-</code> tag loads (
                <code>page_view</code>).
              </li>
              <li>
                For lead conversions, submit a test trial enquiry on Dojo
                Director and confirm a single conversion /{" "}
                <code>generate_lead</code> event there.
              </li>
              <li>
                In Google Ads → Goals → Conversions, check the trial enquiry
                action (may take up to 24 hours).
              </li>
            </ol>
          </details>
        </div>
      </section>
    </>
  );
}
