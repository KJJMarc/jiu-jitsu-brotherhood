import "server-only";

import { requireAdmin } from "@/lib/admin/auth.server";
import {
  validateSiteSettingsWriteInput,
  type SiteSettingsWriteInput,
} from "@/lib/admin/site-settings";
import {
  SITE_SETTINGS_ID,
  getDefaultSiteSettings,
  type SiteSettings,
} from "@/lib/site-settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type {
  SiteSettings,
  SiteSettingsWriteInput,
} from "@/lib/admin/site-settings";

export {
  ADMIN_SITE_SETTINGS_PATH,
  siteSettingsFromFormData,
  validateSiteSettingsWriteInput,
} from "@/lib/admin/site-settings";

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

export type GetAdminSiteSettingsResult = {
  settings: SiteSettings;
  errorMessage: string | null;
};

export async function getAdminSiteSettings(): Promise<GetAdminSiteSettingsResult> {
  await requireAdmin();
  const fallback = getDefaultSiteSettings();

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select(SITE_SETTINGS_COLUMNS)
      .eq("id", SITE_SETTINGS_ID)
      .maybeSingle();

    if (error) {
      console.error("[admin/site-settings] load failed", error.message);
      return { settings: fallback, errorMessage: error.message };
    }
    if (!data) {
      return {
        settings: fallback,
        errorMessage:
          "No site_settings row found. Apply migration 20260912130000_site_settings.sql, then refresh.",
      };
    }
    return { settings: mapRow(data as Record<string, unknown>), errorMessage: null };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load site settings.";
    console.error("[admin/site-settings] load threw", message);
    return { settings: fallback, errorMessage: message };
  }
}

export async function updateAdminSiteSettings(
  input: SiteSettingsWriteInput,
): Promise<void> {
  await requireAdmin();
  const validationError = validateSiteSettingsWriteInput(input);
  if (validationError) throw new Error(validationError);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("site_settings")
    .upsert(
      {
        id: SITE_SETTINGS_ID,
        academy_name: input.academy_name,
        contact_email: input.contact_email,
        contact_phone: input.contact_phone,
        address: input.address,
        instagram_url: input.instagram_url,
        facebook_url: input.facebook_url,
        youtube_url: input.youtube_url,
        tiktok_url: input.tiktok_url,
        twitter_url: input.twitter_url,
        default_seo_title: input.default_seo_title,
        default_seo_description: input.default_seo_description,
      },
      { onConflict: "id" },
    )
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to save site settings: ${error.message}`);
  }
  if (!data) {
    throw new Error(
      "Site settings were not saved. Check Supabase grants/RLS for site_settings.",
    );
  }
}
