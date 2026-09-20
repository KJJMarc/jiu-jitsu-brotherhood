"use server";

import { submitPublicCommentFromForm } from "@/lib/content/comments-submit.server";
import type { CommentSubmitResult } from "@/lib/content/comments-submit.server";

export type CommentFormState = {
  ok: boolean;
  error: string | null;
  fieldErrors?: {
    name?: string;
    email?: string;
    body?: string;
  };
};

export async function submitContentCommentAction(
  _prev: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  const result: CommentSubmitResult = await submitPublicCommentFromForm(formData);
  if (result.ok) {
    return { ok: true, error: null };
  }
  return {
    ok: false,
    error: result.error,
    fieldErrors: result.fieldErrors,
  };
}
