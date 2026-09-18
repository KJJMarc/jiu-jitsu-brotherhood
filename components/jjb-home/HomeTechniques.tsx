import Image from "next/image";
import Link from "next/link";
import type { HomeTechnique } from "@/lib/home/prototype";
import styles from "./jjb-home.module.css";

type Props = {
  techniques: HomeTechnique[];
};

export default function HomeTechniques({ techniques }: Props) {
  return (
    <section
      className={`${styles.band} ${styles.bandBlack} ${styles.techBand}`}
      aria-labelledby="techniques-heading"
    >
      <div className={styles.wide}>
        <div className={styles.headRow}>
          <div>
            <p className={styles.kicker}>Instruction</p>
            <h2 id="techniques-heading">Learn something new</h2>
          </div>
          <Link className={styles.textLink} href="/blogs/techniques">
            Explore all techniques
          </Link>
        </div>

        <div className={styles.techGrid}>
          {techniques.map((technique) => (
            <Link
              key={technique.href}
              href={technique.href}
              className={styles.techCard}
            >
              <div className={styles.techFrame}>
                <Image
                  src={technique.image.src}
                  alt={technique.image.alt}
                  width={technique.image.width}
                  height={technique.image.height}
                  sizes="(max-width: 799px) 80vw, 33vw"
                />
                <span className={styles.techPlay} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M9.5 7.5v9l7.5-4.5-7.5-4.5z" />
                  </svg>
                </span>
              </div>
              <h3 className={styles.techTitle}>{technique.title}</h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
