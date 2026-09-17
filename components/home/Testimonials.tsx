import { testimonials, externalLinks } from "@/lib/site";
import styles from "./home.module.css";

export default function Testimonials() {
  return (
    <section className="section" aria-labelledby="reviews-heading">
      <div className="container">
        <div className="section-head section-head--center">
          <p className="eyebrow">From our community</p>
          <h2 id="reviews-heading">Loved by families, beginners and competitors</h2>
          <p>
            Hear from the people who make Kingston Jiu Jitsu what it is —
            beginners taking their first steps, parents watching their children
            grow in confidence, and experienced grapplers who’ve found a home on
            our mats.
          </p>
        </div>

        <ul className={styles.reviewGrid}>
          {testimonials.map((t) => (
            <li key={t.author} className={styles.review}>
              <div className={styles.stars} aria-label="Five out of five stars">
                {"★★★★★"}
              </div>
              <blockquote className={styles.reviewQuote}>{t.quote}</blockquote>
              <cite className={styles.reviewAuthor}>{t.author}</cite>
            </li>
          ))}
        </ul>

        <div className={styles.reviewCta}>
          <a
            className="btn btn--outline"
            href={externalLinks.googleReviews}
            target="_blank"
            rel="noopener noreferrer"
          >
            Read More Reviews
          </a>
        </div>
      </div>
    </section>
  );
}
