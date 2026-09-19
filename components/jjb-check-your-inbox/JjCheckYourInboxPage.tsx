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
          <p className={styles.eyebrow}>Signup</p>
          <h1 id="check-inbox-heading" className={styles.title}>
            Check your inbox
          </h1>
          <p className={styles.intro}>
            We&apos;ve sent you an email from Jiu Jitsu Brotherhood. Please click
            the confirmation button in that email to complete your signup.
          </p>

          <ol className={styles.steps}>
            <li>Open the confirmation email.</li>
            <li>Click the confirmation button.</li>
            <li>
              Once confirmed, your signup will be complete. If you requested a
              free guide, it will arrive in a separate email shortly afterwards.
            </li>
          </ol>

          <p className={styles.help}>
            The email may take a few minutes to arrive. If you cannot see it,
            check your spam, junk or promotions folder.
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
