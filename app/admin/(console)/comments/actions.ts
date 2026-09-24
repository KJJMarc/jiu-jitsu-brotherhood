"use server";

import { revalidatePath } from "next/cache";
import {
  blockEmailAndSpamRelated,
  createOfficialReply,
  moderateComment,
} from "@/lib/content/comments-admin.server";
import type { ModerationAction } from "@/lib/content/comments-types";

export type AdminCommentActionState = {
  ok: boolean;
  error: string | null;
  message?: string | null;
};

const ALLOWED: Exclude<ModerationAction, "edit" | "reply" | "block_email">[] = [
  "approve",
  "reject",
  "spam",
  "unspam",
  "delete",
  "restore",
];

function isAllowed(
  value: string,
): value is Exclude<ModerationAction, "edit" | "reply" | "block_email"> {
  return (ALLOWED as string[]).includes(value);
}

export async function moderateCommentAction(
  _prev: AdminCommentActionState,
  formData: FormData,
): Promise<AdminCommentActionState> {
  const commentId =
    typeof formData.get("comment_id") === "string"
      ? String(formData.get("comment_id")).trim()
      : "";
  const actionRaw =
    typeof formData.get("action") === "string"
      ? String(formData.get("action")).trim()
      : "";

  if (!commentId || !isAllowed(actionRaw)) {
    return { ok: false, error: "Invalid moderation request." };
  }

  const result = await moderateComment({
    commentId,
    action: actionRaw,
  });

  revalidatePath("/admin/comments/");
  revalidatePath("/admin/");
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, error: null, message: `Action “${actionRaw}” applied.` };
}

export async function spamAndBlockAction(
  _prev: AdminCommentActionState,
  formData: FormData,
): Promise<AdminCommentActionState> {
  const commentId =
    typeof formData.get("comment_id") === "string"
      ? String(formData.get("comment_id")).trim()
      : "";
  if (!commentId) {
    return { ok: false, error: "Invalid moderation request." };
  }

  const result = await blockEmailAndSpamRelated(commentId);
  revalidatePath("/admin/comments/");
  revalidatePath("/admin/");
  if (!result.ok) return { ok: false, error: result.error };
  return {
    ok: true,
    error: null,
    message: `Email blocked. Marked ${result.spamCount} comment(s) as spam.`,
  };
}

export async function officialReplyAction(
  _prev: AdminCommentActionState,
  formData: FormData,
): Promise<AdminCommentActionState> {
  const parentId =
    typeof formData.get("parent_id") === "string"
      ? String(formData.get("parent_id")).trim()
      : "";
  const body =
    typeof formData.get("body") === "string"
      ? String(formData.get("body")).trim()
      : "";

  if (!parentId) {
    return { ok: false, error: "Missing parent comment." };
  }

  const result = await createOfficialReply({ parentId, body });
  revalidatePath("/admin/comments/");
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, error: null, message: "Official reply published." };
}
