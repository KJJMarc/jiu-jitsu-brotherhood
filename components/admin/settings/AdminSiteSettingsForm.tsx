"use client";

import { useFormState, useFormStatus } from "react-dom";
import { AdminFormSection } from "@/components/admin/AdminFormSection";
import {
  updateSiteSettingsAction,
  type SiteSettingsFormState,
} from "@/app/admin/(console)/settings/actions";
import type { SiteSettings } from "@/lib/site-settings";
import styles from "@/app/admin/admin.module.css";

const initialState: SiteSettingsFormState = { error: null, success: null };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.primaryButton} disabled={pending}>
      {pending ? "Saving…" : "Save Changes"}
    </button>
  );
}

export default function AdminSiteSettingsForm({
  settings,
}: {
  settings: SiteSettings;
}) {
  const [state, formAction] = useFormState(
    updateSiteSettingsAction,
    initialState,
  );

  return (
    <form className={styles.articleForm} action={formAction}>
      <AdminFormSection
        title="Academy"
        description="Core academy contact details. Other pages still use static copy for now — this is the central source."
      >
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label htmlFor="academy_name">Academy name</label>
            <input
              id="academy_name"
              name="academy_name"
              type="text"
              defaultValue={settings.academy_name ?? ""}
              autoComplete="organization"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="contact_email">Contact email</label>
            <input
              id="contact_email"
              name="contact_email"
              type="email"
              defaultValue={settings.contact_email ?? ""}
              autoComplete="email"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="contact_phone">Contact phone</label>
            <input
              id="contact_phone"
              name="contact_phone"
              type="text"
              defaultValue={settings.contact_phone ?? ""}
              autoComplete="tel"
            />
          </div>
        </div>
        <div className={styles.field}>
          <label htmlFor="address">Address / venue text</label>
          <textarea
            id="address"
            name="address"
            rows={4}
            defaultValue={settings.address ?? ""}
            placeholder="Training venues and address lines"
          />
          <p className={styles.fieldHint}>
            Free-text venue summary. Location pages are unchanged in this phase.
          </p>
        </div>
      </AdminFormSection>

      <AdminFormSection
        title="Social Media"
        description="These URLs power the existing footer and contact social icons. Leave a field blank to hide that icon."
      >
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label htmlFor="instagram_url">Instagram URL</label>
            <input
              id="instagram_url"
              name="instagram_url"
              type="url"
              defaultValue={settings.instagram_url ?? ""}
              placeholder="https://www.instagram.com/…"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="facebook_url">Facebook URL</label>
            <input
              id="facebook_url"
              name="facebook_url"
              type="url"
              defaultValue={settings.facebook_url ?? ""}
              placeholder="https://www.facebook.com/…"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="youtube_url">YouTube URL</label>
            <input
              id="youtube_url"
              name="youtube_url"
              type="url"
              defaultValue={settings.youtube_url ?? ""}
              placeholder="https://www.youtube.com/…"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="tiktok_url">TikTok URL</label>
            <input
              id="tiktok_url"
              name="tiktok_url"
              type="url"
              defaultValue={settings.tiktok_url ?? ""}
              placeholder="https://www.tiktok.com/…"
            />
            <p className={styles.fieldHint}>
              Optional. When set, a TikTok icon appears beside the other social
              links.
            </p>
          </div>
          <div className={styles.field}>
            <label htmlFor="twitter_url">X (Twitter) URL</label>
            <input
              id="twitter_url"
              name="twitter_url"
              type="url"
              defaultValue={settings.twitter_url ?? ""}
              placeholder="https://twitter.com/…"
            />
            <p className={styles.fieldHint}>
              Already used on the public site. Blank hides the X icon.
            </p>
          </div>
        </div>
      </AdminFormSection>

      <AdminFormSection
        title="Default SEO"
        description="Site-wide fallbacks only. Page and article metadata still win when set."
      >
        <div className={styles.field}>
          <label htmlFor="default_seo_title">Default SEO title</label>
          <input
            id="default_seo_title"
            name="default_seo_title"
            type="text"
            defaultValue={settings.default_seo_title ?? ""}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="default_seo_description">
            Default meta description
          </label>
          <textarea
            id="default_seo_description"
            name="default_seo_description"
            rows={3}
            defaultValue={settings.default_seo_description ?? ""}
          />
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
      </div>
    </form>
  );
}
