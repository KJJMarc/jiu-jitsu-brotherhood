/** Client-safe admin tracking-settings helpers. */

import {
  emptyToNull,
  type TrackingSettingsWriteInput,
} from "@/lib/tracking-settings";

export type {
  TrackingSettings,
  TrackingSettingsWriteInput,
} from "@/lib/tracking-settings";

export const ADMIN_TRACKING_SETTINGS_PATH = "/admin/settings/tracking/";

export function validateTrackingSettingsWriteInput(
  input: TrackingSettingsWriteInput,
): string | null {
  if (input.meta_pixel_enabled) {
    if (!input.meta_pixel_id) {
      return "Meta Pixel ID is required when Meta Pixel tracking is enabled.";
    }
    if (!/^\d{5,20}$/.test(input.meta_pixel_id)) {
      return "Meta Pixel ID must be a numeric ID from Events Manager.";
    }
  } else if (input.meta_pixel_id && !/^\d{5,20}$/.test(input.meta_pixel_id)) {
    return "Meta Pixel ID must be a numeric ID from Events Manager.";
  }

  if (input.google_enabled) {
    if (!input.google_tag_id) {
      return "Google tag ID is required when Google tracking is enabled.";
    }
    if (
      !/^AW-\d+$/i.test(input.google_tag_id) &&
      !/^G-[A-Z0-9]+$/i.test(input.google_tag_id)
    ) {
      return "Google tag ID must look like AW-XXXXXXXX or G-XXXXXXXX.";
    }
  } else if (input.google_tag_id) {
    if (
      !/^AW-\d+$/i.test(input.google_tag_id) &&
      !/^G-[A-Z0-9]+$/i.test(input.google_tag_id)
    ) {
      return "Google tag ID must look like AW-XXXXXXXX or G-XXXXXXXX.";
    }
  }

  if (input.google_ads_conversion_label) {
    if (!/^[A-Za-z0-9_-]+$/.test(input.google_ads_conversion_label)) {
      return "Google Ads conversion label looks invalid.";
    }
  }

  return null;
}

export function trackingSettingsFromFormData(
  formData: FormData,
): TrackingSettingsWriteInput {
  return {
    meta_pixel_enabled: formData.get("meta_pixel_enabled") === "on",
    meta_pixel_id: emptyToNull(String(formData.get("meta_pixel_id") ?? "")),
    google_enabled: formData.get("google_enabled") === "on",
    google_tag_id: emptyToNull(String(formData.get("google_tag_id") ?? "")),
    google_ads_conversion_label: emptyToNull(
      String(formData.get("google_ads_conversion_label") ?? ""),
    ),
  };
}
