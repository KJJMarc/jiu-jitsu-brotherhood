import Image from "next/image";
import Link from "next/link";
import { localAssets } from "@/lib/home/prototype";
import styles from "./jjb-home.module.css";

export default function HomeHero() {
  const hero = localAssets.hero;

  return (
    <section className={styles.hero} aria-labelledby="home-hero-heading">
      <div className={styles.heroMedia}>
        <Image
          src={hero.src}
          alt={hero.alt}
          fill
          priority
          sizes="100vw"
          className={styles.heroImg}
          style={{ objectPosition: hero.position }}
        />
        <div className={styles.heroScrim} aria-hidden="true" />
      </div>

      <div className={styles.wide}>
        <div className={styles.heroInner}>
          <p className={styles.heroEst}>Established 2007</p>
          <h1 id="home-hero-heading" className={styles.heroTitle}>
            Sharing knowledge.
            <br />
            Building community.
            <br />
            Honouring the art.
          </h1>
          <p className={styles.heroLead}>
            Since 2007, Jiu Jitsu Brotherhood has been sharing techniques, ideas
            and stories from the mats, bringing together people who believe there
            is always more to learn.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.heroPrimary} href="/blogs/blog">
              Browse Articles
            </Link>
            <Link className={styles.heroSecondary} href="/blogs/techniques">
              Explore Techniques
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
