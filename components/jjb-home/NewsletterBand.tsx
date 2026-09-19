"use client";

import { useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { MAILERLITE_NEWSLETTER } from "@/lib/content/types";
import styles from "./jjb-home.module.css";
import formStyles from "./newsletter-form.module.css";

/** Canonical JJB legal paths (matches lib/jjb-legal/pages.ts + footer). */
const TERMS_PATH = "/pages/terms-conditions";
const PRIVACY_PATH = "/pages/privacy-policy";

/**
 * Homepage newsletter band — posts to the existing MailerLite public form
 * (1006228 / c4j4j4). Native HTML POST only; no universal ML script, coupon
 * redirect, or legacy store/podcast URLs.
 */
export default function NewsletterBand() {
  const { formCode, embedId, submitUrl } = MAILERLITE_NEWSLETTER;
  const emailId = useId();
  const consentId = useId();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(_event: FormEvent<HTMLFormElement>) {
    // Native HTML5 validation (required email + consent) runs first.
    // This handler only fires when the form is valid.
    setPending(true);
    setSubmitted(true);
    window.setTimeout(() => setPending(false), 2500);
  }

  return (
    <section
      className={`${styles.newsletterBand} ${styles.bandRed}`}
      aria-labelledby="newsletter-heading"
    >
      <div className={`${styles.wide} ${styles.newsletter}`}>
        <div className={styles.newsletterCopy}>
          <p className={styles.kicker}>Newsletter</p>
          <h2 id="newsletter-heading">More Jiu Jitsu. Less noise.</h2>
          <p className={styles.newsletterLead}>
            New articles, techniques and occasional updates from Jiu Jitsu
            Brotherhood.
          </p>
        </div>

        <form
          id={embedId}
          className={`ml-block-form ${formStyles.form}`}
          action={submitUrl}
          data-code={formCode}
          method="post"
          target="_blank"
          onSubmit={onSubmit}
        >
          <div className={formStyles.row}>
            <label className="visually-hidden" htmlFor={emailId}>
              Your email address
            </label>
            <input
              id={emailId}
              className={formStyles.input}
              type="email"
              name="fields[email]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              autoComplete="email"
              inputMode="email"
              required
              aria-required="true"
              aria-describedby={
                submitted ? `${emailId}-success` : `${emailId}-fine`
              }
            />
            <button
              className={formStyles.submit}
              type="submit"
              disabled={pending}
            >
              {pending ? "Sending…" : "Keep me updated"}
            </button>
          </div>

          <div className={formStyles.consent}>
            <input
              id={consentId}
              className={formStyles.consentInput}
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              required
              aria-required="true"
            />
            <label className={formStyles.consentLabel} htmlFor={consentId}>
              I consent to receive email updates from Jiu Jitsu Brotherhood and
              agree to the{" "}
              <Link href={TERMS_PATH} className={formStyles.fineLink}>
                Terms and Conditions
              </Link>{" "}
              and{" "}
              <Link href={PRIVACY_PATH} className={formStyles.fineLink}>
                Privacy Policy
              </Link>
              .
            </label>
          </div>

          <input type="hidden" name="ml-submit" value="1" />
          <input type="hidden" name="anticsrf" value="true" />

          {submitted ? (
            <p
              id={`${emailId}-success`}
              className={formStyles.success}
              role="status"
              aria-live="polite"
            >
              Your subscription request was received. Check your inbox to
              confirm if prompted — subscription is not complete until any
              confirmation step is finished.
            </p>
          ) : null}

          <p id={`${emailId}-fine`} className={formStyles.fine}>
            No spam. Just Jiu Jitsu. Unsubscribe anytime.
          </p>
        </form>
      </div>
    </section>
  );
}
