"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  submitContentCommentAction,
  type CommentFormState,
} from "./actions";
import { COMMENT_LIMITS } from "@/lib/content/comments-types";
import styles from "./Comments.module.css";

const initialState: CommentFormState = { ok: false, error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className={styles.submit} type="submit" disabled={pending}>
      {pending ? "Submitting…" : "Post comment"}
    </button>
  );
}

type Props = {
  contentId: string;
  formStartedAt: number;
};

export default function CommentForm({ contentId, formStartedAt }: Props) {
  const [state, formAction] = useFormState(
    submitContentCommentAction,
    initialState,
  );

  if (state.ok && !state.error) {
    return (
      <div className={styles.success} role="status" aria-live="polite">
        <p className={styles.successTitle}>Comment received</p>
        <p>Thanks — your comment is awaiting moderation.</p>
      </div>
    );
  }

  return (
    <form className={styles.form} action={formAction} noValidate>
      <h3 className={styles.formTitle}>Leave a comment</h3>
      <p className={styles.formHint}>
        Comments are moderated before they appear.
      </p>

      <input type="hidden" name="content_id" value={contentId} />
      <input type="hidden" name="_t" value={String(formStartedAt)} />

      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor={`comment-company-${contentId}`}>Company</label>
        <input
          id={`comment-company-${contentId}`}
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {state.error ? (
        <p className={styles.formError} role="alert">
          {state.error}
        </p>
      ) : null}

      <div className={styles.field}>
        <label htmlFor={`comment-name-${contentId}`}>Name</label>
        <input
          id={`comment-name-${contentId}`}
          name="name"
          type="text"
          autoComplete="name"
          required
          maxLength={COMMENT_LIMITS.nameMax}
          aria-invalid={state.fieldErrors?.name ? true : undefined}
          aria-describedby={
            state.fieldErrors?.name
              ? `comment-name-error-${contentId}`
              : undefined
          }
        />
        {state.fieldErrors?.name ? (
          <p
            id={`comment-name-error-${contentId}`}
            className={styles.fieldError}
          >
            {state.fieldErrors.name}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor={`comment-email-${contentId}`}>Email</label>
        <input
          id={`comment-email-${contentId}`}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          maxLength={COMMENT_LIMITS.emailMax}
          aria-invalid={state.fieldErrors?.email ? true : undefined}
          aria-describedby={
            state.fieldErrors?.email
              ? `comment-email-error-${contentId}`
              : undefined
          }
        />
        {state.fieldErrors?.email ? (
          <p
            id={`comment-email-error-${contentId}`}
            className={styles.fieldError}
          >
            {state.fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor={`comment-body-${contentId}`}>Comment</label>
        <textarea
          id={`comment-body-${contentId}`}
          name="body"
          required
          maxLength={COMMENT_LIMITS.bodyMax}
          aria-invalid={state.fieldErrors?.body ? true : undefined}
          aria-describedby={
            state.fieldErrors?.body
              ? `comment-body-error-${contentId}`
              : undefined
          }
        />
        {state.fieldErrors?.body ? (
          <p
            id={`comment-body-error-${contentId}`}
            className={styles.fieldError}
          >
            {state.fieldErrors.body}
          </p>
        ) : null}
      </div>

      <SubmitButton />
    </form>
  );
}
