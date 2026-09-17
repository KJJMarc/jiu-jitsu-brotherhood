import "server-only";

import { createSupabasePublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  SITE_SETTINGS_ID,
  getDefaultSiteSettings,
  type SiteSettings,
} from "@/lib/site-settings";

const SITE_SETTINGS_COLUMNS =
  "id, academy_name, contact_email, contact_phone, address, instagram_url, facebook_url, youtube_url, tiktok_url, twitter_url, default_seo_title, default_seo_description, created_at, updated_at";

function mapRow(row: Record<string, unknown>): SiteSettings {
  return {
    id: SITE_SETTINGS_ID,
    academy_name: (row.academy_name as string | null) ?? null,
    contact_email: (row.contact_email as string | null) ?? null,
    contact_phone: (row.contact_phone as string | null) ?? null,
    address: (row.address as string | null) ?? null,
    instagram_url: (row.instagram_url as string | null) ?? null,
    facebook_url: (row.facebook_url as string | null) ?? null,
    youtube_url: (row.youtube_url as string | null) ?? null,
    tiktok_url: (row.tiktok_url as string | null) ?? null,
    twitter_url: (row.twitter_url as string | null) ?? null,
    default_seo_title: (row.default_seo_title as string | null) ?? null,
    default_seo_description:
      (row.default_seo_description as string | null) ?? null,
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
  };
}

/**
 * Public singleton settings. Falls back to static lib/site.ts values when
 * Supabase is unset, the table is missing, or the query fails.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const fallback = getDefaultSiteSettings();
  if (!isSupabaseConfigured()) return fallback;

  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select(SITE_SETTINGS_COLUMNS)
      .eq("id", SITE_SETTINGS_ID)
      .maybeSingle();

    if (error) {
      console.error("[site-settings] public fetch failed", error.message);
      return fallback;
    }
    if (!data) return fallback;
    return mapRow(data as Record<string, unknown>);
  } catch (error) {
    console.error("[site-settings] public fetch error", error);
    return fallback;
  }
}
