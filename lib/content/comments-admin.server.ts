import "server-only";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth.server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  plainTextToCommentHtml,
} from "@/lib/content/sanitize-comment";
import {
  COMMENT_LIMITS,
  COMMENT_STATUSES,
  OFFICIAL_REPLY_DISPLAY_NAME,
  type AdminCommentRow,
  type CommentStatus,
  type ModerationAction,
  type PublicComment,
} from "@/lib/content/comments-types";

export type { AdminCommentRow };

export type AdminCommentCounts = Record<CommentStatus | "all", number>;

const ADMIN_SELECT =
  "id, content_id, parent_id, status, author_display_name, body_text, body_html, is_official_reply, source_created_at, published_at, created_at, source, moderated_at";

function isCommentStatus(value: string): value is CommentStatus {
  return (COMMENT_STATUSES as readonly string[]).includes(value);
}

async function appendModerationEvent(input: {
  commentId: string;
  actorUserId: string;
  action: ModerationAction;
  fromStatus: string | null;
  toStatus: string | null;
  note?: string | null;
}): Promise<void> {
  const admin = getSupabaseAdminClient();
  const { error } = await admin.from("content_comment_moderation_events").insert({
    comment_id: input.commentId,
    actor_user_id: input.actorUserId,
    action: input.action,
    from_status: input.fromStatus,
    to_status: input.toStatus,
    note: input.note ?? null,
  });
  if (error) {
    throw new Error(`Moderation event failed: ${error.message}`);
  }
}

async function revalidateContentPath(contentId: string): Promise<void> {
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("contents")
    .select("canonical_path")
    .eq("id", contentId)
    .maybeSingle();
  if (data?.canonical_path) {
    revalidatePath(data.canonical_path);
  }
  revalidatePath("/admin/comments/");
}

export async function getAdminCommentCounts(): Promise<AdminCommentCounts> {
  await requireAdmin();
  const admin = getSupabaseAdminClient();
  const counts: AdminCommentCounts = {
    all: 0,
    pending: 0,
    published: 0,
    spam: 0,
    rejected: 0,
    deleted: 0,
  };

  const { count: allCount, error: allError } = await admin
    .from("content_comments")
    .select("*", { count: "exact", head: true });
  if (allError) throw new Error(allError.message);
  counts.all = allCount ?? 0;

  for (const status of COMMENT_STATUSES) {
    const { count, error } = await admin
      .from("content_comments")
      .select("*", { count: "exact", head: true })
      .eq("status", status);
    if (error) throw new Error(error.message);
    counts[status] = count ?? 0;
  }

  return counts;
}

/** Lightweight pending count for admin nav badge. */
export async function getPendingCommentCount(): Promise<number> {
  await requireAdmin();
  const admin = getSupabaseAdminClient();
  const { count, error } = await admin
    .from("content_comments")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function listAdminComments(input: {
  status?: string | null;
  limit?: number;
}): Promise<AdminCommentRow[]> {
  await requireAdmin();
  const admin = getSupabaseAdminClient();
  const limit = Math.min(Math.max(input.limit ?? 100, 1), 200);

  let query = admin
    .from("content_comments")
    .select(ADMIN_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (input.status && input.status !== "all" && isCommentStatus(input.status)) {
    query = query.eq("status", input.status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Array<
    PublicComment & { source: string; moderated_at: string | null }
  >;
  if (rows.length === 0) return [];

  const contentIds = [...new Set(rows.map((r) => r.content_id))];
  const commentIds = rows.map((r) => r.id);

  const [{ data: contents }, { data: privateRows }] = await Promise.all([
    admin
      .from("contents")
      .select("id, title, type, canonical_path")
      .in("id", contentIds),
    admin
      .from("content_comment_private")
      .select("comment_id, author_email")
      .in("comment_id", commentIds),
  ]);

  const contentById = new Map(
    (contents ?? []).map((c: {
      id: string;
      title: string;
      type: string;
      canonical_path: string;
    }) => [c.id, c]),
  );
  const emailByComment = new Map(
    (privateRows ?? []).map((p: { comment_id: string; author_email: string | null }) => [
      p.comment_id,
      p.author_email,
    ]),
  );

  return rows.map((row) => {
    const content = contentById.get(row.content_id);
    return {
      ...row,
      content_title: content?.title ?? null,
      content_type: content?.type ?? null,
      content_canonical_path: content?.canonical_path ?? null,
      author_email: emailByComment.get(row.id) ?? null,
    };
  });
}

type ModerateInput = {
  commentId: string;
  action: Exclude<ModerationAction, "edit" | "reply" | "block_email">;
};

const TRANSITIONS: Record<
  Exclude<ModerationAction, "edit" | "reply" | "block_email">,
  { to: CommentStatus; from?: CommentStatus[] }
> = {
  approve: { to: "published", from: ["pending", "rejected"] },
  reject: { to: "rejected", from: ["pending", "published"] },
  spam: { to: "spam", from: ["pending", "published", "rejected", "deleted"] },
  unspam: { to: "pending", from: ["spam"] },
  delete: { to: "deleted" },
  restore: { to: "pending", from: ["deleted", "spam", "rejected"] },
};

export async function moderateComment(
  input: ModerateInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireAdmin();
  const admin = getSupabaseAdminClient();
  const transition = TRANSITIONS[input.action];
  if (!transition) return { ok: false, error: "Unknown action." };

  const { data: row, error } = await admin
    .from("content_comments")
    .select("id, status, content_id, published_at")
    .eq("id", input.commentId)
    .maybeSingle();

  if (error || !row) return { ok: false, error: "Comment not found." };

  if (transition.from && !transition.from.includes(row.status as CommentStatus)) {
    return {
      ok: false,
      error: `Cannot ${input.action} a comment in status “${row.status}”.`,
    };
  }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status: transition.to,
    moderated_at: now,
    moderated_by: session.userId,
  };
  if (input.action === "approve") {
    patch.published_at = row.published_at || now;
  }

  const { error: updateError } = await admin
    .from("content_comments")
    .update(patch)
    .eq("id", input.commentId);
  if (updateError) return { ok: false, error: updateError.message };

  await appendModerationEvent({
    commentId: input.commentId,
    actorUserId: session.userId,
    action: input.action,
    fromStatus: row.status,
    toStatus: transition.to,
  });

  await revalidateContentPath(row.content_id);
  return { ok: true };
}

/**
 * Mark comment (and siblings sharing the same private email) as spam, and
 * block that email from future public submissions.
 */
export async function blockEmailAndSpamRelated(
  commentId: string,
): Promise<
  | { ok: true; emailBlocked: true; spamCount: number }
  | { ok: false; error: string }
> {
  const session = await requireAdmin();
  const admin = getSupabaseAdminClient();

  const { data: row, error } = await admin
    .from("content_comments")
    .select("id, status, content_id")
    .eq("id", commentId)
    .maybeSingle();
  if (error || !row) return { ok: false, error: "Comment not found." };

  const { data: priv, error: privError } = await admin
    .from("content_comment_private")
    .select("author_email")
    .eq("comment_id", commentId)
    .maybeSingle();
  if (privError) return { ok: false, error: privError.message };

  const email = priv?.author_email?.trim().toLowerCase() ?? "";
  if (!email || !email.includes("@")) {
    return {
      ok: false,
      error: "No email on file for this comment — cannot block.",
    };
  }

  const { error: blockError } = await admin
    .from("content_comment_email_blocklist")
    .upsert(
      {
        email,
        created_by: session.userId,
        note: "spam_and_block",
        source_comment_id: commentId,
      },
      { onConflict: "email", ignoreDuplicates: false },
    );
  if (blockError) return { ok: false, error: blockError.message };

  const { data: siblings, error: sibError } = await admin
    .from("content_comment_private")
    .select("comment_id")
    .eq("author_email", email);
  if (sibError) return { ok: false, error: sibError.message };

  const siblingIds = (siblings ?? [])
    .map((s) => s.comment_id as string)
    .filter(Boolean);
  const ids = Array.from(new Set([commentId, ...siblingIds]));

  const { data: targets, error: targetError } = await admin
    .from("content_comments")
    .select("id, status, content_id")
    .in("id", ids)
    .neq("status", "deleted");
  if (targetError) return { ok: false, error: targetError.message };

  const now = new Date().toISOString();
  const toSpam = (targets ?? []).filter((t) => t.status !== "spam");
  if (toSpam.length > 0) {
    const { error: updateError } = await admin
      .from("content_comments")
      .update({
        status: "spam",
        moderated_at: now,
        moderated_by: session.userId,
      })
      .in(
        "id",
        toSpam.map((t) => t.id),
      );
    if (updateError) return { ok: false, error: updateError.message };
  }

  // Audit: block on the source comment; spam transitions on each changed row.
  await appendModerationEvent({
    commentId,
    actorUserId: session.userId,
    action: "block_email",
    fromStatus: row.status,
    toStatus: "spam",
    note: `blocked_email_siblings:${toSpam.length}`,
  });

  for (const target of toSpam) {
    if (target.id === commentId) {
      await appendModerationEvent({
        commentId: target.id,
        actorUserId: session.userId,
        action: "spam",
        fromStatus: target.status,
        toStatus: "spam",
        note: "via_spam_and_block",
      });
    } else {
      await appendModerationEvent({
        commentId: target.id,
        actorUserId: session.userId,
        action: "spam",
        fromStatus: target.status,
        toStatus: "spam",
        note: `via_spam_and_block_from:${commentId}`,
      });
    }
  }

  const contentIds = new Set(
    (targets ?? []).map((t) => t.content_id as string).filter(Boolean),
  );
  for (const contentId of contentIds) {
    await revalidateContentPath(contentId);
  }

  return { ok: true, emailBlocked: true, spamCount: toSpam.length };
}

/** One-off / ops: block an email and spam all matching comments. */
export async function blockEmailAndSpamByAddress(
  emailRaw: string,
  note = "ops_cleanup",
): Promise<
  | { ok: true; spamCount: number }
  | { ok: false; error: string }
> {
  const session = await requireAdmin();
  const email = emailRaw.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { ok: false, error: "Invalid email." };
  }

  const admin = getSupabaseAdminClient();
  const { error: blockError } = await admin
    .from("content_comment_email_blocklist")
    .upsert(
      {
        email,
        created_by: session.userId,
        note,
        source_comment_id: null,
      },
      { onConflict: "email" },
    );
  if (blockError) return { ok: false, error: blockError.message };

  const { data: siblings, error: sibError } = await admin
    .from("content_comment_private")
    .select("comment_id")
    .eq("author_email", email);
  if (sibError) return { ok: false, error: sibError.message };

  const ids = (siblings ?? []).map((s) => s.comment_id as string).filter(Boolean);
  if (ids.length === 0) return { ok: true, spamCount: 0 };

  const { data: targets, error: targetError } = await admin
    .from("content_comments")
    .select("id, status, content_id")
    .in("id", ids)
    .neq("status", "deleted");
  if (targetError) return { ok: false, error: targetError.message };

  const now = new Date().toISOString();
  const toSpam = (targets ?? []).filter((t) => t.status !== "spam");
  if (toSpam.length > 0) {
    const { error: updateError } = await admin
      .from("content_comments")
      .update({
        status: "spam",
        moderated_at: now,
        moderated_by: session.userId,
      })
      .in(
        "id",
        toSpam.map((t) => t.id),
      );
    if (updateError) return { ok: false, error: updateError.message };
  }

  for (const target of toSpam) {
    await appendModerationEvent({
      commentId: target.id,
      actorUserId: session.userId,
      action: "spam",
      fromStatus: target.status,
      toStatus: "spam",
      note: `ops_block_email:${email}`,
    });
  }

  const contentIds = new Set(
    (targets ?? []).map((t) => t.content_id as string).filter(Boolean),
  );
  for (const contentId of contentIds) {
    await revalidateContentPath(contentId);
  }

  return { ok: true, spamCount: toSpam.length };
}

export async function createOfficialReply(input: {
  parentId: string;
  body: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireAdmin();
  const body = input.body.trim();
  if (!body) return { ok: false, error: "Enter a reply." };
  if (body.length > COMMENT_LIMITS.bodyMax) {
    return { ok: false, error: "Reply is too long." };
  }

  const admin = getSupabaseAdminClient();
  const { data: parent, error } = await admin
    .from("content_comments")
    .select("id, content_id, parent_id, status")
    .eq("id", input.parentId)
    .maybeSingle();

  if (error || !parent) return { ok: false, error: "Parent comment not found." };
  if (parent.parent_id) {
    return {
      ok: false,
      error: "Replies are only allowed on top-level comments.",
    };
  }

  const id = randomUUID();
  const now = new Date().toISOString();
  const { error: insertError } = await admin.from("content_comments").insert({
    id,
    content_id: parent.content_id,
    parent_id: parent.id,
    status: "published",
    author_display_name: OFFICIAL_REPLY_DISPLAY_NAME,
    body_text: body,
    body_html: plainTextToCommentHtml(body),
    is_official_reply: true,
    source: "jjb",
    source_shopify_comment_gid: null,
    source_shopify_article_gid: null,
    source_created_at: now,
    published_at: now,
    moderated_at: now,
    moderated_by: session.userId,
  });

  if (insertError) return { ok: false, error: insertError.message };

  await appendModerationEvent({
    commentId: id,
    actorUserId: session.userId,
    action: "reply",
    fromStatus: null,
    toStatus: "published",
    note: `reply_to:${parent.id}`,
  });

  await revalidateContentPath(parent.content_id);
  return { ok: true };
}
