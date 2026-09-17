/** Singleton tracking / pixel settings for the public marketing site. */

export const TRACKING_SETTINGS_ID = "site" as const;

export type TrackingSettings = {
  id: typeof TRACKING_SETTINGS_ID;
  meta_pixel_enabled: boolean;
  meta_pixel_id: string | null;
  google_enabled: boolean;
  google_tag_id: string | null;
  google_ads_conversion_label: string | null;
  created_at?: string;
  updated_at?: string;
};

export type TrackingSettingsWriteInput = {
  meta_pixel_enabled: boolean;
  meta_pixel_id: string | null;
  google_enabled: boolean;
  google_tag_id: string | null;
  google_ads_conversion_label: string | null;
};

export function getDefaultTrackingSettings(): TrackingSettings {
  return {
    id: TRACKING_SETTINGS_ID,
    meta_pixel_enabled: false,
    meta_pixel_id: null,
    google_enabled: false,
    google_tag_id: null,
    google_ads_conversion_label: null,
  };
}

export function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/** Meta Pixel is ready to load when enabled and ID is numeric. */
export function isMetaPixelConfigured(settings: TrackingSettings): boolean {
  return (
    settings.meta_pixel_enabled &&
    Boolean(settings.meta_pixel_id?.trim()) &&
    /^\d{5,20}$/.test(settings.meta_pixel_id!.trim())
  );
}

/** Google tag is ready when enabled and ID looks like AW-… or G-…. */
export function isGoogleTagConfigured(settings: TrackingSettings): boolean {
  const id = settings.google_tag_id?.trim() ?? "";
  return (
    settings.google_enabled &&
    (/^AW-\d+$/i.test(id) || /^G-[A-Z0-9]+$/i.test(id))
  );
}
