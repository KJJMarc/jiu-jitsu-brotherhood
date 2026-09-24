"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  moderateCommentAction,
  officialReplyAction,
  spamAndBlockAction,
  type AdminCommentActionState,
} from "@/app/admin/(console)/comments/actions";
import type { AdminCommentRow } from "@/lib/content/comments-types";
import type { CommentStatus } from "@/lib/content/comments-types";
import styles from "@/app/admin/admin.module.css";

const initial: AdminCommentActionState = {
  ok: false,
  error: null,
  message: null,
};

function ActionButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.secondaryButton} disabled={pending}>
      {pending ? "…" : label}
    </button>
  );
}

function actionsForStatus(status: CommentStatus): Array<{
  action: string;
  label: string;
}> {
  switch (status) {
    case "pending":
      return [
        { action: "approve", label: "Approve" },
        { action: "reject", label: "Reject" },
        { action: "spam", label: "Spam" },
        { action: "delete", label: "Delete" },
      ];
    case "published":
      return [
        { action: "reject", label: "Reject" },
        { action: "spam", label: "Spam" },
        { action: "delete", label: "Delete" },
      ];
    case "rejected":
      return [
        { action: "approve", label: "Approve" },
        { action: "spam", label: "Spam" },
        { action: "delete", label: "Delete" },
        { action: "restore", label: "Restore" },
      ];
    case "spam":
      return [
        { action: "unspam", label: "Unspam" },
        { action: "delete", label: "Delete" },
        { action: "restore", label: "Restore" },
      ];
    case "deleted":
      return [{ action: "restore", label: "Restore" }];
    default:
      return [];
  }
}

function canSpamAndBlock(status: CommentStatus): boolean {
  return status === "pending" || status === "published" || status === "rejected";
}

function ModerateForms({ comment }: { comment: AdminCommentRow }) {
  const [state, formAction] = useFormState(moderateCommentAction, initial);
  const [blockState, blockAction] = useFormState(spamAndBlockAction, initial);
  const actions = actionsForStatus(comment.status);

  return (
    <div>
      {state.error ? (
        <p className={styles.formError} role="alert">
          {state.error}
        </p>
      ) : null}
      {state.ok && state.message ? (
        <p className={styles.formSuccess} role="status">
          {state.message}
        </p>
      ) : null}
      {blockState.error ? (
        <p className={styles.formError} role="alert">
          {blockState.error}
        </p>
      ) : null}
      {blockState.ok && blockState.message ? (
        <p className={styles.formSuccess} role="status">
          {blockState.message}
        </p>
      ) : null}
      <div className={styles.inlineActions}>
        {actions.map(({ action, label }) => (
          <form key={action} action={formAction}>
            <input type="hidden" name="comment_id" value={comment.id} />
            <input type="hidden" name="action" value={action} />
            <ActionButton label={label} />
          </form>
        ))}
        {canSpamAndBlock(comment.status) ? (
          <form action={blockAction}>
            <input type="hidden" name="comment_id" value={comment.id} />
            <ActionButton label="Spam & block" />
          </form>
        ) : null}
      </div>
    </div>
  );
}

function ReplyForm({ parentId }: { parentId: string }) {
  const [state, formAction] = useFormState(officialReplyAction, initial);

  return (
    <form action={formAction} className={styles.stackForm}>
      <input type="hidden" name="parent_id" value={parentId} />
      <label className={styles.fieldLabel} htmlFor={`reply-${parentId}`}>
        Official reply
      </label>
      <textarea
        id={`reply-${parentId}`}
        name="body"
        rows={3}
        required
        maxLength={5000}
        className={styles.textarea}
      />
      {state.error ? (
        <p className={styles.formError} role="alert">
          {state.error}
        </p>
      ) : null}
      {state.ok && state.message ? (
        <p className={styles.formSuccess} role="status">
          {state.message}
        </p>
      ) : null}
      <ActionButton label="Publish reply" />
    </form>
  );
}

export default function AdminCommentRowActions({
  comment,
}: {
  comment: AdminCommentRow;
}) {
  const canReply = !comment.parent_id && comment.status !== "deleted";

  return (
    <div className={styles.commentActions}>
      <ModerateForms comment={comment} />
      {canReply ? <ReplyForm parentId={comment.id} /> : null}
    </div>
  );
}
