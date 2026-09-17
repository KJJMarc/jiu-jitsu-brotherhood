import "server-only";

import { requireAdmin } from "@/lib/admin/auth.server";
import {
  validateTrackingSettingsWriteInput,
  type TrackingSettingsWriteInput,
} from "@/lib/admin/tracking-settings";
import {
  TRACKING_SETTINGS_ID,
  getDefaultTrackingSettings,
  type TrackingSettings,
} from "@/lib/tracking-settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type {
  TrackingSettings,
  TrackingSettingsWriteInput,
} from "@/lib/admin/tracking-settings";

export {
  ADMIN_TRACKING_SETTINGS_PATH,
  trackingSettingsFromFormData,
  validateTrackingSettingsWriteInput,
} from "@/lib/admin/tracking-settings";

const TRACKING_SETTINGS_COLUMNS =
  "id, meta_pixel_enabled, meta_pixel_id, google_enabled, google_tag_id, google_ads_conversion_label, created_at, updated_at";

function mapRow(row: Record<string, unknown>): TrackingSettings {
  return {
    id: TRACKING_SETTINGS_ID,
    meta_pixel_enabled: Boolean(row.meta_pixel_enabled),
    meta_pixel_id: (row.meta_pixel_id as string | null) ?? null,
    google_enabled: Boolean(row.google_enabled),
    google_tag_id: (row.google_tag_id as string | null) ?? null,
    google_ads_conversion_label:
      (row.google_ads_conversion_label as string | null) ?? null,
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
  };
}

export type GetAdminTrackingSettingsResult = {
  settings: TrackingSettings;
  errorMessage: string | null;
};

export async function getAdminTrackingSettings(): Promise<GetAdminTrackingSettingsResult> {
  await requireAdmin();
  const fallback = getDefaultTrackingSettings();

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("tracking_settings")
      .select(TRACKING_SETTINGS_COLUMNS)
      .eq("id", TRACKING_SETTINGS_ID)
      .maybeSingle();

    if (error) {
      console.error("[admin/tracking-settings] load failed", error.message);
      return { settings: fallback, errorMessage: error.message };
    }
    if (!data) {
      return {
        settings: fallback,
        errorMessage:
          "No tracking_settings row found. Apply migration 20260912140000_tracking_settings.sql, then refresh.",
      };
    }
    return {
      settings: mapRow(data as Record<string, unknown>),
      errorMessage: null,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load tracking settings.";
    console.error("[admin/tracking-settings] load threw", message);
    return { settings: fallback, errorMessage: message };
  }
}

export async function updateAdminTrackingSettings(
  input: TrackingSettingsWriteInput,
): Promise<void> {
  await requireAdmin();
  const validationError = validateTrackingSettingsWriteInput(input);
  if (validationError) throw new Error(validationError);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tracking_settings")
    .upsert(
      {
        id: TRACKING_SETTINGS_ID,
        meta_pixel_enabled: input.meta_pixel_enabled,
        meta_pixel_id: input.meta_pixel_id,
        google_enabled: input.google_enabled,
        google_tag_id: input.google_tag_id,
        google_ads_conversion_label: input.google_ads_conversion_label,
      },
      { onConflict: "id" },
    )
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to save tracking settings: ${error.message}`);
  }
  if (!data) {
    throw new Error(
      "Tracking settings were not saved. Check Supabase grants/RLS for tracking_settings.",
    );
  }
}
