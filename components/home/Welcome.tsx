import Image from "next/image";
import Link from "next/link";
import { externalLinks } from "@/lib/site";
import styles from "./home.module.css";

const stats = [
  { value: "500+", label: "Students & growing" },
  {
    value: "Since 2012",
    label: "In Kingston upon Thames",
    labelClassName: styles.statsLabelLong,
  },
  { value: "All ages", label: "& experience levels" },
  { value: "Mauricio Gomes", label: "Legacy Team" },
];

export default function Welcome() {
  return (
    <section className="section">
      <div className={`container ${styles.welcomeGrid}`}>
        <div className={styles.welcomeText}>
          <p className="eyebrow">More than just a place to train</p>
          <h2>A welcoming home for your Jiu Jitsu journey</h2>
          <p className={styles.welcomeBody}>
            Kingston Jiu Jitsu started in 2012, with Marc teaching a handful of
            friends for an hour on a Monday night. Since then, we&apos;ve grown
            into a thriving academy with hundreds of students, while keeping the
            friendly, welcoming atmosphere that has always been at the heart of
            KJJ.
          </p>
          <p className={styles.welcomeBody}>
            With classes seven days a week, there&apos;s a place for everyone,
            from complete beginners to experienced grapplers, women and children.
            Whether you want to get fit, learn a martial art, compete or simply
            enjoy training, you&apos;ll find a welcoming community and an
            experienced team of home-grown coaches.
          </p>
          <div className={styles.welcomeActions}>
            <a
              className="btn btn--primary"
              href={externalLinks.freeTrial}
              target="_blank"
              rel="noopener noreferrer"
            >
              Book a Free Trial
            </a>
            <Link className="btn btn--outline" href="/about/">
              Our Story
            </Link>
          </div>
        </div>

        <div className={styles.welcomeAside}>
          <div className={styles.welcomeImage}>
            <Image
              src="/images/community.jpg"
              alt="The Kingston Jiu Jitsu community together after a training session"
              fill
              sizes="(max-width: 900px) 100vw, 45vw"
              className={styles.coverImg}
            />
          </div>
          <ul className={styles.stats}>
            {stats.map((s) => (
              <li key={s.label}>
                <strong>{s.value}</strong>
                <span className={s.labelClassName}>{s.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
