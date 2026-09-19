import Link from "next/link";
import styles from "./jjb-check-your-inbox.module.css";

/**
 * Shared MailerLite confirmation landing for free-guide and newsletter signups.
 * Routed at /pages/check-your-inbox. Does not link to PDF downloads.
 */
export default function JjCheckYourInboxPage() {
  return (
    <div className={styles.page}>
      <div className={`container ${styles.inner}`}>
        <article className={styles.card} aria-labelledby="check-inbox-heading">
          <h1 id="check-inbox-heading" className={styles.title}>
            Check your inbox
          </h1>
          <p className={styles.intro}>
            We&apos;ve sent you a confirmation email. Click the button in that
            email to complete your signup.
          </p>
          <p className={styles.guideNote}>
            If you requested a free guide, it will be sent separately after you
            confirm your email.
          </p>
          <p className={styles.help}>
            Can&apos;t see the email? Check your spam, junk or promotions
            folder.
          </p>
          <div className={styles.actions}>
            <Link className={`btn btn--outline ${styles.homeLink}`} href="/">
              Return to Jiu Jitsu Brotherhood
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}
