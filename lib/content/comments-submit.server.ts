import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { assessJjbPhase4WriteGate } from "@/lib/supabase/jjb-phase4-write-gate";
import {
  plainTextToCommentHtml,
} from "@/lib/content/sanitize-comment";
import { COMMENT_LIMITS } from "@/lib/content/comments-types";

export type CommentSubmitResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
      fieldErrors?: {
        name?: string;
        email?: string;
        body?: string;
      };
    };

function trimField(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function hashIp(ip: string | null): string | null {
  if (!ip || !ip.trim()) return null;
  return createHash("sha256")
    .update("jjb:comment-ip:v1:")
    .update(ip.trim())
    .digest("hex");
}

async function clientIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip")?.trim() || null;
}

/**
 * Durable abuse control using existing content_comment_private columns
 * (ip_hash + author_email + created_at). No schema change required.
 */
async function assertRateLimits(input: {
  ipHash: string | null;
  email: string;
}): Promise<string | null> {
  const admin = getSupabaseAdminClient();
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  if (input.ipHash) {
    const { count, error } = await admin
      .from("content_comment_private")
      .select("*", { count: "exact", head: true })
      .eq("ip_hash", input.ipHash)
      .gte("created_at", since);
    if (error) {
      console.error("[comments] rate-limit ip check failed", error.message);
      return "Unable to submit right now. Please try again later.";
    }
    if ((count ?? 0) >= COMMENT_LIMITS.maxPerIpPerHour) {
      return "Too many comments from this network. Please try again later.";
    }
  }

  const { count: emailCount, error: emailError } = await admin
    .from("content_comment_private")
    .select("*", { count: "exact", head: true })
    .eq("author_email", input.email)
    .gte("created_at", since);
  if (emailError) {
    console.error("[comments] rate-limit email check failed", emailError.message);
    return "Unable to submit right now. Please try again later.";
  }
  if ((emailCount ?? 0) >= COMMENT_LIMITS.maxPerEmailPerHour) {
    return "Too many comments from this email. Please try again later.";
  }

  return null;
}

export async function isCommentEmailBlocked(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("content_comment_email_blocklist")
    .select("email")
    .eq("email", normalized)
    .maybeSingle();
  if (error) {
    console.error("[comments] blocklist check failed", error.message);
    // Fail open if the table is missing/misconfigured so legitimate posts still work.
    return false;
  }
  return Boolean(data?.email);
}

/**
 * Public comment submission. Always creates status=pending.
 * Email / IP hash only in content_comment_private.
 */
export async function submitPublicComment(input: {
  contentId: string;
  name: string;
  email: string;
  body: string;
  honeypot: string;
  startedAtRaw: string;
}): Promise<CommentSubmitResult> {
  // Honeypot — silent success (do not reveal detection).
  if (input.honeypot) {
    return { ok: true };
  }

  const startedAt = Number(input.startedAtRaw);
  if (
    !Number.isFinite(startedAt) ||
    Date.now() - startedAt < COMMENT_LIMITS.minSubmitMs
  ) {
    return { ok: false, error: "Please wait a moment and try again." };
  }

  const gate = assessJjbPhase4WriteGate();
  if (!gate.ok) {
    console.error("[comments] submit gate failed", gate.reason);
    return {
      ok: false,
      error: "Comments are temporarily unavailable. Please try again later.",
    };
  }

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const body = input.body.trim();
  const contentId = input.contentId.trim();

  const fieldErrors: NonNullable<Extract<CommentSubmitResult, { ok: false }>["fieldErrors"]> =
    {};

  if (!name) fieldErrors.name = "Enter your name.";
  else if (name.length > COMMENT_LIMITS.nameMax)
    fieldErrors.name = "Name is too long.";

  if (!email) fieldErrors.email = "Enter your email address.";
  else if (!isValidEmail(email))
    fieldErrors.email = "Enter a valid email address.";

  if (!body) fieldErrors.body = "Enter your comment.";
  else if (body.length > COMMENT_LIMITS.bodyMax)
    fieldErrors.body = "Comment is too long.";

  if (!contentId) {
    return { ok: false, error: "Invalid page reference." };
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors,
    };
  }

  if (await isCommentEmailBlocked(email)) {
    // Silent success — same posture as honeypot (do not tip off blocked senders).
    return { ok: true };
  }

  const admin = getSupabaseAdminClient();

  const { data: content, error: contentError } = await admin
    .from("contents")
    .select("id, type, status")
    .eq("id", contentId)
    .maybeSingle();

  if (contentError || !content) {
    return { ok: false, error: "This page cannot accept comments." };
  }
  if (content.type !== "article" && content.type !== "technique") {
    return { ok: false, error: "This page cannot accept comments." };
  }
  if (content.status !== "published") {
    return { ok: false, error: "This page cannot accept comments." };
  }

  const ipHash = hashIp(await clientIp());
  const rateError = await assertRateLimits({ ipHash, email });
  if (rateError) {
    return { ok: false, error: rateError };
  }

  const id = randomUUID();
  const bodyHtml = plainTextToCommentHtml(body);
  const now = new Date().toISOString();

  const { error: insertError } = await admin.from("content_comments").insert({
    id,
    content_id: contentId,
    parent_id: null,
    status: "pending",
    author_display_name: name,
    body_text: body,
    body_html: bodyHtml,
    is_official_reply: false,
    source: "jjb",
    source_shopify_comment_gid: null,
    source_shopify_article_gid: null,
    source_created_at: now,
    published_at: null,
  });

  if (insertError) {
    console.error("[comments] insert failed", insertError.message);
    return {
      ok: false,
      error: "We could not save your comment. Please try again shortly.",
    };
  }

  const { error: privateError } = await admin
    .from("content_comment_private")
    .insert({
      comment_id: id,
      author_email: email,
      ip_hash: ipHash,
      user_agent: null,
    });

  if (privateError) {
    console.error("[comments] private insert failed", privateError.message);
    // Soft-delete public row so we do not leave orphan without contact path
    await admin
      .from("content_comments")
      .update({ status: "deleted" })
      .eq("id", id);
    return {
      ok: false,
      error: "We could not save your comment. Please try again shortly.",
    };
  }

  // Optional admin notify — intentionally no-op in Phase 5 (no live emails).
  // Failures must never undo a valid submission.
  try {
    // reserved for Phase 5b notification hook
  } catch (notifyError) {
    console.error(
      "[comments] notify skipped",
      notifyError instanceof Error ? notifyError.message : notifyError,
    );
  }

  return { ok: true };
}

/** Thin FormData adapter for the server action. */
export async function submitPublicCommentFromForm(
  formData: FormData,
): Promise<CommentSubmitResult> {
  return submitPublicComment({
    contentId: trimField(formData.get("content_id")),
    name: trimField(formData.get("name")),
    email: trimField(formData.get("email")),
    body: trimField(formData.get("body")),
    honeypot: trimField(formData.get("company")),
    startedAtRaw: trimField(formData.get("_t")),
  });
}
