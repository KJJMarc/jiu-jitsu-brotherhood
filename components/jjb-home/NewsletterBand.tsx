import styles from "./jjb-home.module.css";
import formStyles from "./newsletter-form.module.css";

/**
 * Homepage newsletter band.
 * Submission is intentionally unwired: no verified newsletter MailerLite
 * destination exists in the repo (only Free Stuff guide forms n2l0c2 / a1f8n6).
 * The form uses native HTML5 email validation only and does not POST elsewhere.
 */
export default function NewsletterBand() {
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
          className={formStyles.form}
          action="#newsletter-heading"
          method="get"
        >
          <div className={formStyles.row}>
            <label className="visually-hidden" htmlFor="home-newsletter-email">
              Your email address
            </label>
            <input
              id="home-newsletter-email"
              className={formStyles.input}
              type="email"
              name="email"
              placeholder="Your email address"
              autoComplete="email"
              inputMode="email"
              required
            />
            <button className={formStyles.submit} type="submit">
              Keep me updated
            </button>
          </div>
          <p className={formStyles.fine}>
            No spam. Just Jiu Jitsu. Unsubscribe anytime.
          </p>
        </form>
      </div>
    </section>
  );
}
