"use client";

import { useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { MAILERLITE_LANDINGS } from "@/lib/content/types";
import { useMailerLiteIframeSubmit } from "@/lib/mailerlite/useMailerLiteIframeSubmit";
import styles from "./free-guide.module.css";

export type FreeGuideLandingKey = keyof typeof MAILERLITE_LANDINGS;

type Props = {
  landing: FreeGuideLandingKey;
  /** Wrapper id for in-page jump links */
  anchorId: string;
  variant?: "hero" | "footer";
  /** Apply MailerLite embed id once on the primary form only (avoid duplicate DOM ids). */
  primary?: boolean;
};

type FieldError = {
  field: "email" | "consent";
  message: string;
};

const CONSENT_ERROR = "Please confirm that you agree to receive email updates.";

/**
 * Free-guide signup — posts to the existing MailerLite public form for the
 * given landing. Does not use API keys. Submits into a hidden iframe, then
 * navigates to /pages/check-your-inbox once MailerLite responds.
 *
 * Consent checkbox is front-end gating only (no invented MailerLite payload
 * field). Verified embeds are email + ml-submit.
 */
export default function FreeGuideSignupForm({
  landing,
  anchorId,
  variant = "hero",
  primary = false,
}: Props) {
  const { formCode, embedId } = MAILERLITE_LANDINGS[landing];
  const mlAction = `https://static.mailerlite.com/webforms/submit/${encodeURIComponent(formCode)}`;
  const inputId = useId();
  const consentId = useId();
  const errorId = `${inputId}-error`;
  const fineId = `${inputId}-fine`;
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<FieldError | null>(null);
  const { iframeName, statusId, submitting, onSubmit: onMlSubmit, iframeProps } =
    useMailerLiteIframeSubmit({
      instanceKey: `${landing}-${variant}-${anchorId}`,
    });

  function validateEmail(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return "Enter your email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return "Enter a valid email address.";
    }
    return null;
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const emailMessage = validateEmail(email);
    if (emailMessage) {
      event.preventDefault();
      setError({ field: "email", message: emailMessage });
      return;
    }
    if (!consent) {
      event.preventDefault();
      setError({ field: "consent", message: CONSENT_ERROR });
      return;
    }
    setError(null);
    onMlSubmit(event);
  }

  return (
    <div
      id={anchorId}
      className={variant === "footer" ? styles.formWrapFooter : styles.formWrap}
    >
      <form
        className={`ml-block-form ${styles.form}`}
        action={mlAction}
        data-code={formCode}
        method="post"
        target={iframeName}
        {...(primary ? { id: embedId } : {})}
        noValidate
        onSubmit={onSubmit}
        aria-busy={submitting || undefined}
      >
        <div className={styles.emailField}>
          <label className="visually-hidden" htmlFor={inputId}>
            Your email address
          </label>
          <input
            id={inputId}
            className={styles.input}
            type="email"
            name="fields[email]"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error?.field === "email") setError(null);
            }}
            placeholder="Your email address"
            autoComplete="email"
            inputMode="email"
            required
            aria-invalid={error?.field === "email" ? true : undefined}
            aria-describedby={
              error?.field === "email" ? errorId : fineId
            }
          />
        </div>

        <div className={styles.consent}>
          <input
            id={consentId}
            className={styles.consentInput}
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              if (e.target.checked && error?.field === "consent") {
                setError(null);
              }
            }}
            required
            aria-required="true"
            aria-invalid={error?.field === "consent" ? true : undefined}
            aria-describedby={
              error?.field === "consent" ? errorId : fineId
            }
          />
          <label className={styles.consentLabel} htmlFor={consentId}>
            I agree to receive occasional email updates from Jiu Jitsu
            Brotherhood. I can unsubscribe at any time.
          </label>
        </div>

        {error ? (
          <p id={errorId} className={styles.error} role="alert">
            {error.message}
          </p>
        ) : null}

        <p
          id={statusId}
          className="visually-hidden"
          role="status"
          aria-live="polite"
        >
          {submitting ? "Submitting your guide request." : ""}
        </p>

        <p id={fineId} className={styles.fine}>
          We will email you the requested guide when you submit the form.{" "}
          <Link href="/pages/terms-conditions" className={styles.fineLink}>
            Terms
          </Link>{" "}
          ·{" "}
          <Link href="/pages/privacy-policy" className={styles.fineLink}>
            Privacy Policy
          </Link>
          .
        </p>

        <input type="hidden" name="ml-submit" value="1" />
        <button className={styles.submit} type="submit" disabled={submitting}>
          {submitting ? "Submitting…" : "Send me the guide"}
        </button>
      </form>

      <iframe {...iframeProps} />
    </div>
  );
}
