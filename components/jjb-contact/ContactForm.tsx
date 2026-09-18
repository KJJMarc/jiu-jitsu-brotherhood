"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  submitContactFormAction,
  type ContactFormState,
} from "./actions";
import styles from "./jjb-contact.module.css";

const initialState: ContactFormState = { ok: false, error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className={styles.submit} type="submit" disabled={pending}>
      {pending ? "Sending…" : "Send message"}
    </button>
  );
}

type Props = {
  /** Server-rendered timestamp for bot timing checks. */
  formStartedAt: number;
};

export default function ContactForm({ formStartedAt }: Props) {
  const [state, formAction] = useFormState(submitContactFormAction, initialState);

  if (state.ok && !state.error) {
    return (
      <div className={styles.success} role="status" aria-live="polite">
        <p className={styles.successTitle}>Message sent</p>
        <p>
          Thanks for getting in touch. We&apos;ll reply as soon as we can.
        </p>
      </div>
    );
  }

  return (
    <form className={styles.form} action={formAction} noValidate>
      <input type="hidden" name="_t" value={String(formStartedAt)} />

      {/* Honeypot — visually hidden; leave empty */}
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor="contact-company">Company</label>
        <input
          id="contact-company"
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
        <label htmlFor="contact-name">Name</label>
        <input
          id="contact-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          maxLength={120}
          aria-invalid={state.fieldErrors?.name ? true : undefined}
          aria-describedby={
            state.fieldErrors?.name ? "contact-name-error" : undefined
          }
        />
        {state.fieldErrors?.name ? (
          <p id="contact-name-error" className={styles.fieldError}>
            {state.fieldErrors.name}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor="contact-email">Email</label>
        <input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          maxLength={254}
          aria-invalid={state.fieldErrors?.email ? true : undefined}
          aria-describedby={
            state.fieldErrors?.email ? "contact-email-error" : undefined
          }
        />
        {state.fieldErrors?.email ? (
          <p id="contact-email-error" className={styles.fieldError}>
            {state.fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor="contact-subject">Subject</label>
        <input
          id="contact-subject"
          name="subject"
          type="text"
          autoComplete="off"
          required
          maxLength={160}
          aria-invalid={state.fieldErrors?.subject ? true : undefined}
          aria-describedby={
            state.fieldErrors?.subject ? "contact-subject-error" : undefined
          }
        />
        {state.fieldErrors?.subject ? (
          <p id="contact-subject-error" className={styles.fieldError}>
            {state.fieldErrors.subject}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor="contact-message">Message</label>
        <textarea
          id="contact-message"
          name="message"
          rows={7}
          required
          maxLength={5000}
          aria-invalid={state.fieldErrors?.message ? true : undefined}
          aria-describedby={
            state.fieldErrors?.message ? "contact-message-error" : undefined
          }
        />
        {state.fieldErrors?.message ? (
          <p id="contact-message-error" className={styles.fieldError}>
            {state.fieldErrors.message}
          </p>
        ) : null}
      </div>

      <SubmitButton />
    </form>
  );
}
