/**
 * Shared comment types aligned with content_comments migration.
 * Public-safe fields only — never include author_email / ip / user_agent.
 */

export const COMMENT_STATUSES = [
  "pending",
  "published",
  "spam",
  "rejected",
  "deleted",
] as const;

export type CommentStatus = (typeof COMMENT_STATUSES)[number];

export const MODERATION_ACTIONS = [
  "approve",
  "reject",
  "spam",
  "unspam",
  "edit",
  "delete",
  "restore",
  "reply",
] as const;

export type ModerationAction = (typeof MODERATION_ACTIONS)[number];

/** Columns safe for anon / public SELECT. */
export const PUBLIC_COMMENT_SELECT =
  "id, content_id, parent_id, status, author_display_name, body_text, body_html, is_official_reply, source_created_at, published_at, created_at" as const;

export type PublicComment = {
  id: string;
  content_id: string;
  parent_id: string | null;
  status: CommentStatus;
  author_display_name: string;
  body_text: string;
  body_html: string | null;
  is_official_reply: boolean;
  source_created_at: string | null;
  published_at: string | null;
  created_at: string;
};

export type PublicCommentThread = {
  comment: PublicComment;
  replies: PublicComment[];
};

/** Admin list row — email is admin-only and must never appear in public queries. */
export type AdminCommentRow = PublicComment & {
  source: string;
  moderated_at: string | null;
  content_title: string | null;
  content_type: string | null;
  content_canonical_path: string | null;
  author_email: string | null;
};

export const OFFICIAL_REPLY_DISPLAY_NAME = "Jiu Jitsu Brotherhood";

export const COMMENT_LIMITS = {
  nameMax: 120,
  emailMax: 254,
  bodyMax: 5000,
  minSubmitMs: 2500,
  /** Durable rate limits via content_comment_private (existing schema). */
  maxPerIpPerHour: 5,
  maxPerEmailPerHour: 3,
} as const;
