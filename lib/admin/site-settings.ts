/** Client-safe admin site-settings helpers. */

import { emptyToNull, type SiteSettingsWriteInput } from "@/lib/site-settings";

export type { SiteSettings, SiteSettingsWriteInput } from "@/lib/site-settings";

export const ADMIN_SITE_SETTINGS_PATH = "/admin/settings/";

export function validateSiteSettingsWriteInput(
  input: SiteSettingsWriteInput,
): string | null {
  if (input.contact_email) {
    const email = input.contact_email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Contact email looks invalid.";
    }
  }

  for (const [label, value] of [
    ["Instagram URL", input.instagram_url],
    ["Facebook URL", input.facebook_url],
    ["YouTube URL", input.youtube_url],
    ["TikTok URL", input.tiktok_url],
    ["X (Twitter) URL", input.twitter_url],
  ] as const) {
    if (!value) continue;
    try {
      const url = new URL(value);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return `${label} must start with http:// or https://.`;
      }
    } catch {
      return `${label} must be a valid URL.`;
    }
  }

  return null;
}

export function siteSettingsFromFormData(
  formData: FormData,
): SiteSettingsWriteInput {
  return {
    academy_name: emptyToNull(String(formData.get("academy_name") ?? "")),
    contact_email: emptyToNull(String(formData.get("contact_email") ?? "")),
    contact_phone: emptyToNull(String(formData.get("contact_phone") ?? "")),
    address: emptyToNull(String(formData.get("address") ?? "")),
    instagram_url: emptyToNull(String(formData.get("instagram_url") ?? "")),
    facebook_url: emptyToNull(String(formData.get("facebook_url") ?? "")),
    youtube_url: emptyToNull(String(formData.get("youtube_url") ?? "")),
    tiktok_url: emptyToNull(String(formData.get("tiktok_url") ?? "")),
    twitter_url: emptyToNull(String(formData.get("twitter_url") ?? "")),
    default_seo_title: emptyToNull(
      String(formData.get("default_seo_title") ?? ""),
    ),
    default_seo_description: emptyToNull(
      String(formData.get("default_seo_description") ?? ""),
    ),
  };
}
