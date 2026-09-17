import { site, social, venues } from "@/lib/site";

/** Singleton row id for public.site_settings. */
export const SITE_SETTINGS_ID = "site" as const;

export type SiteSettings = {
  id: typeof SITE_SETTINGS_ID;
  academy_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  twitter_url: string | null;
  default_seo_title: string | null;
  default_seo_description: string | null;
  created_at?: string;
  updated_at?: string;
};

export type SiteSettingsWriteInput = {
  academy_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  twitter_url: string | null;
  default_seo_title: string | null;
  default_seo_description: string | null;
};

const DEFAULT_ADDRESS = venues
  .map((v) => `${v.name}, ${v.street}, ${v.locality} ${v.postcode}`)
  .join("\n");

const DEFAULT_SEO_TITLE = `${site.name} | Brazilian Jiu Jitsu in Kingston upon Thames`;

/** Static fallbacks when Supabase is unavailable or the row is missing. */
export function getDefaultSiteSettings(): SiteSettings {
  return {
    id: SITE_SETTINGS_ID,
    academy_name: site.name,
    contact_email: site.email,
    contact_phone: site.phone,
    address: DEFAULT_ADDRESS,
    instagram_url: social.instagram,
    facebook_url: social.facebook,
    youtube_url: social.youtube,
    tiktok_url: null,
    twitter_url: social.twitter,
    default_seo_title: DEFAULT_SEO_TITLE,
    default_seo_description: site.description,
  };
}

export type PublicSocialLink = {
  key: "facebook" | "instagram" | "twitter" | "youtube" | "tiktok";
  label: string;
  href: string;
  icon: string;
};

const SOCIAL_ICON_PATHS: Record<PublicSocialLink["key"], string> = {
  facebook:
    "M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H17V3.6c-.29-.04-1.3-.12-2.46-.12-2.43 0-4.09 1.48-4.09 4.2v2.34H7.7V13h2.75v8z",
  instagram:
    "M12 2.7c3.04 0 3.4.01 4.6.07 1.11.05 1.71.24 2.11.4.53.2.91.45 1.31.85.4.4.65.78.85 1.31.16.4.35 1 .4 2.11.06 1.2.07 1.56.07 4.6s-.01 3.4-.07 4.6c-.05 1.11-.24 1.71-.4 2.11-.2.53-.45.91-.85 1.31-.4.4-.78.65-1.31.85-.4.16-1 .35-2.11.4-1.2.06-1.56.07-4.6.07s-3.4-.01-4.6-.07c-1.11-.05-1.71-.24-2.11-.4a3.5 3.5 0 0 1-1.31-.85 3.5 3.5 0 0 1-.85-1.31c-.16-.4-.35-1-.4-2.11C2.71 15.4 2.7 15.04 2.7 12s.01-3.4.07-4.6c.05-1.11.24-1.71.4-2.11.2-.53.45-.91.85-1.31.4-.4.78-.65 1.31-.85.4-.16 1-.35 2.11-.4C8.6 2.71 8.96 2.7 12 2.7m0 2.03c-2.99 0-3.34.01-4.52.07-.85.04-1.31.18-1.62.3-.41.16-.7.35-1 .66-.31.3-.5.59-.66 1-.12.31-.26.77-.3 1.62-.06 1.18-.07 1.53-.07 4.52s.01 3.34.07 4.52c.04.85.18 1.31.3 1.62.16.41.35.7.66 1 .3.31.59.5 1 .66.31.12.77.26 1.62.3 1.18.06 1.53.07 4.52.07s3.34-.01 4.52-.07c.85-.04 1.31-.18 1.62-.3.41-.16.7-.35 1-.66.31-.3.5-.59.66-1 .12-.31.26-.77.3-1.62.06-1.18.07-1.53.07-4.52s-.01-3.34-.07-4.52c-.04-.85-.18-1.31-.3-1.62a2.7 2.7 0 0 0-.66-1 2.7 2.7 0 0 0-1-.66c-.31-.12-.77-.26-1.62-.3-1.18-.06-1.53-.07-4.52-.07m0 3.45a4.32 4.32 0 1 1 0 8.64 4.32 4.32 0 0 1 0-8.64m0 2.03a2.29 2.29 0 1 0 0 4.58 2.29 2.29 0 0 0 0-4.58m4.55-3.7a1.01 1.01 0 1 1 0 2.02 1.01 1.01 0 0 1 0-2.02",
  twitter:
    "M17.53 3H20l-5.9 6.74L21 21h-5.4l-4.23-5.53L6.53 21H4l6.3-7.2L3.3 3h5.53l3.82 5.06zm-.95 16.5h1.36L7.5 4.4H6.04z",
  youtube:
    "M21.6 7.2s-.19-1.36-.78-1.96c-.75-.79-1.58-.79-1.96-.83C16.13 4.2 12 4.2 12 4.2h-.01s-4.12 0-6.86.21c-.38.05-1.21.05-1.96.83-.59.6-.78 1.96-.78 1.96S2.2 8.8 2.2 10.4v1.5c0 1.6.2 3.2.2 3.2s.19 1.36.78 1.96c.75.79 1.73.76 2.17.85 1.57.15 6.66.2 6.66.2s4.13-.01 6.87-.22c.38-.05 1.21-.05 1.96-.84.59-.6.78-1.96.78-1.96s.2-1.6.2-3.2v-1.5c0-1.6-.2-3.2-.2-3.2M9.9 13.7V8.9l5.3 2.4z",
  tiktok:
    "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .56.04.82.12v-3.57a6.27 6.27 0 0 0-.82-.05A6.34 6.34 0 0 0 3.15 15.3 6.34 6.34 0 0 0 9.5 21.64a6.34 6.34 0 0 0 6.34-6.34V8.73a8.2 8.2 0 0 0 4.79 1.53V6.82a4.84 4.84 0 0 1-1.04-.13z",
};

/**
 * Existing public social locations only (footer / contact / JSON-LD).
 * Blank or null URLs are omitted so icons/links hide.
 */
export function getActiveSocialLinks(
  settings: Pick<
    SiteSettings,
    | "facebook_url"
    | "instagram_url"
    | "twitter_url"
    | "youtube_url"
    | "tiktok_url"
  >,
): PublicSocialLink[] {
  const candidates: Array<{
    key: PublicSocialLink["key"];
    label: string;
    href: string | null | undefined;
  }> = [
    { key: "facebook", label: "Facebook", href: settings.facebook_url },
    { key: "instagram", label: "Instagram", href: settings.instagram_url },
    { key: "twitter", label: "X (Twitter)", href: settings.twitter_url },
    { key: "youtube", label: "YouTube", href: settings.youtube_url },
    { key: "tiktok", label: "TikTok", href: settings.tiktok_url },
  ];

  return candidates
    .map((item) => {
      const href = item.href?.trim() ?? "";
      if (!href) return null;
      return {
        key: item.key,
        label: item.label,
        href,
        icon: SOCIAL_ICON_PATHS[item.key],
      };
    })
    .filter((item): item is PublicSocialLink => item !== null);
}

export function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
