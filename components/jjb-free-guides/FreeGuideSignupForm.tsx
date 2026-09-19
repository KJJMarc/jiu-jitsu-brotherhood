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

/**
 * Free-guide signup — posts to the existing MailerLite public form for the
 * given landing. Does not use API keys. Submits into a hidden iframe, then
 * navigates to /pages/check-your-inbox once MailerLite responds.
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
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { iframeName, statusId, submitting, onSubmit: onMlSubmit, iframeProps } =
    useMailerLiteIframeSubmit({
      instanceKey: `${landing}-${variant}-${anchorId}`,
    });

  function validate(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return "Enter your email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return "Enter a valid email address.";
    }
    return null;
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const message = validate(email);
    if (message) {
      event.preventDefault();
      setError(message);
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
        <div className={styles.row}>
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
              if (error) setError(null);
            }}
            placeholder="Your email address"
            autoComplete="email"
            inputMode="email"
            required
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${inputId}-error` : `${inputId}-fine`}
            disabled={submitting}
          />
          <input type="hidden" name="ml-submit" value="1" />
          <button className={styles.submit} type="submit" disabled={submitting}>
            {submitting ? "Submitting…" : "Send me the guide"}
          </button>
        </div>

        {error ? (
          <p id={`${inputId}-error`} className={styles.error} role="alert">
            {error}
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

        <p id={`${inputId}-fine`} className={styles.fine}>
          By downloading this guide you also consent to receive email updates
          from Jiu Jitsu Brotherhood. Unsubscribe anytime.{" "}
          <Link href="/pages/terms-conditions" className={styles.fineLink}>
            Terms
          </Link>{" "}
          ·{" "}
          <Link href="/pages/privacy-policy" className={styles.fineLink}>
            Privacy Policy
          </Link>
          .
        </p>
      </form>

      <iframe {...iframeProps} />
    </div>
  );
}
