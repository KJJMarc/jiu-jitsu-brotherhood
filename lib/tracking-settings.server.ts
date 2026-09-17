import "server-only";

import { createSupabasePublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  TRACKING_SETTINGS_ID,
  getDefaultTrackingSettings,
  type TrackingSettings,
} from "@/lib/tracking-settings";

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

/**
 * Public singleton tracking settings. Falls back to disabled defaults when
 * Supabase is unset, the table is missing, or the query fails.
 */
export async function getTrackingSettings(): Promise<TrackingSettings> {
  const fallback = getDefaultTrackingSettings();
  if (!isSupabaseConfigured()) return fallback;

  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase
      .from("tracking_settings")
      .select(TRACKING_SETTINGS_COLUMNS)
      .eq("id", TRACKING_SETTINGS_ID)
      .maybeSingle();

    if (error) {
      console.error("[tracking-settings] public fetch failed", error.message);
      return fallback;
    }
    if (!data) return fallback;
    return mapRow(data as Record<string, unknown>);
  } catch (error) {
    console.error("[tracking-settings] public fetch error", error);
    return fallback;
  }
}
