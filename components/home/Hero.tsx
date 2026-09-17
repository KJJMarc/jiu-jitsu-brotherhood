import Image from "next/image";
import { externalLinks } from "@/lib/site";
import styles from "./home.module.css";

export default function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-heading">
      <div className={styles.heroMedia}>
        <Image
          src="/images/hero.jpg"
          alt="Kingston Jiu Jitsu members training together on the mats"
          fill
          priority
          sizes="100vw"
          className={styles.heroImg}
        />
        <div className={styles.heroScrim} />
      </div>

      <div className={`container ${styles.heroInner}`}>
        <p className={styles.heroEyebrow}>Established in 2012</p>
        <h1 id="hero-heading" className={styles.heroTitle}>
          Kingston&apos;s home for Brazilian Jiu Jitsu
        </h1>
        <p className={styles.heroLead}>
          A welcoming, family-friendly academy for all ages and levels — proud
          members of the Mauricio Gomes Legacy Team.
        </p>
        <div className={styles.heroActions}>
          <a
            className="btn btn--primary btn--lg"
            href={externalLinks.freeTrial}
            target="_blank"
            rel="noopener noreferrer"
          >
            Book a Free Trial
          </a>
          <a className="btn btn--ghost btn--lg" href="#classes">
            Explore Our Classes
          </a>
        </div>
      </div>
    </section>
  );
}
