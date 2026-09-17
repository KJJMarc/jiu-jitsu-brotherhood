/**
 * JJB content system types (Phase 2D / 2E).
 * Public URLs are governed by canonical_path, not by type alone.
 */

export const CONTENT_TYPES = [
  "article",
  "technique",
  "past_event",
  "page",
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];

export const CONTENT_STATUSES = ["draft", "published", "archived"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export type ContentRecord = {
  id: string;
  type: ContentType;
  handle: string;
  blog_handle: string | null;
  title: string;
  status: ContentStatus;
  published_at: string | null;
  excerpt: string;
  body_html: string | null;
  seo_title: string | null;
  seo_description: string | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  featured_image_asset_id: string | null;
  youtube_ids: string[];
  tags_public: string[];
  tags_source: string[];
  template: string | null;
  noindex: boolean;
  author_id: string | null;
  event_starts_at: string | null;
  event_ends_at: string | null;
  event_location_label: string | null;
  canonical_path: string;
  source_shopify_gid: string | null;
  source_shopify_author: string | null;
  source_updated_at: string | null;
  source_payload: Record<string, unknown> | null;
  mailerlite_form_code: string | null;
  mailerlite_embed_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ContentListItem = Pick<
  ContentRecord,
  | "id"
  | "type"
  | "handle"
  | "blog_handle"
  | "title"
  | "status"
  | "published_at"
  | "canonical_path"
  | "updated_at"
  | "noindex"
  | "template"
>;

export type ContentWriteInput = {
  type: ContentType;
  handle: string;
  blog_handle?: string | null;
  title: string;
  status: ContentStatus;
  published_at?: string | null;
  excerpt?: string;
  body_html?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  featured_image_url?: string | null;
  featured_image_alt?: string | null;
  youtube_ids?: string[];
  tags_public?: string[];
  tags_source?: string[];
  template?: string | null;
  noindex?: boolean;
  author_id?: string | null;
  event_starts_at?: string | null;
  event_ends_at?: string | null;
  event_location_label?: string | null;
  canonical_path: string;
  mailerlite_form_code?: string | null;
  mailerlite_embed_id?: string | null;
};

/** Known Free Stuff MailerLite public form identifiers (not secrets). */
export const MAILERLITE_LANDINGS = {
  beginnersGuide: {
    canonicalPath: "/pages/beginners-guide-to-bjj-signup",
    handle: "beginners-guide-to-bjj-signup",
    formCode: "n2l0c2",
    embedId: "mlb2-1721794",
  },
  suckLess: {
    canonicalPath: "/pages/how-to-suck-less-at-jiu-jitsu",
    handle: "how-to-suck-less-at-jiu-jitsu",
    formCode: "a1f8n6",
    embedId: "mlb2-1722026",
  },
} as const;

export const CONTENT_SELECT_COLUMNS = [
  "id",
  "type",
  "handle",
  "blog_handle",
  "title",
  "status",
  "published_at",
  "excerpt",
  "body_html",
  "seo_title",
  "seo_description",
  "featured_image_url",
  "featured_image_alt",
  "featured_image_asset_id",
  "youtube_ids",
  "tags_public",
  "tags_source",
  "template",
  "noindex",
  "author_id",
  "event_starts_at",
  "event_ends_at",
  "event_location_label",
  "canonical_path",
  "source_shopify_gid",
  "source_shopify_author",
  "source_updated_at",
  "source_payload",
  "mailerlite_form_code",
  "mailerlite_embed_id",
  "created_at",
  "updated_at",
].join(", ");
