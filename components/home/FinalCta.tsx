import { externalLinks, site } from "@/lib/site";
import styles from "./home.module.css";

export default function FinalCta() {
  return (
    <section className={styles.finalCta} aria-labelledby="cta-heading">
      <div className={`container ${styles.finalInner}`}>
        <p className={styles.finalEyebrow}>Your first class is on us</p>
        <h2 id="cta-heading" className={styles.finalTitle}>
          Ready to step on the mats?
        </h2>
        <p className={styles.finalLead}>
          Book a free trial class and experience the Kingston Jiu Jitsu family for
          yourself. No experience needed — just bring comfortable clothing and a
          willingness to learn.
        </p>
        <div className={styles.finalActions}>
          <a
            className="btn btn--primary btn--lg"
            href={externalLinks.freeTrial}
            target="_blank"
            rel="noopener noreferrer"
          >
            Book a Free Trial
          </a>
          <a className="btn btn--ghost btn--lg" href={site.phoneHref}>
            Call {site.phone}
          </a>
        </div>
      </div>
    </section>
  );
}
