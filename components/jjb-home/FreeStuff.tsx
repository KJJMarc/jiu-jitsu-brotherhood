import Image from "next/image";
import Link from "next/link";
import type { HomeResource } from "@/lib/home/prototype";
import styles from "./jjb-home.module.css";

type Props = {
  resources: HomeResource[];
};

export default function FreeStuff({ resources }: Props) {
  return (
    <section
      id="free-stuff"
      className={`${styles.band} ${styles.bandRed}`}
      aria-labelledby="free-stuff-heading"
    >
      <div className={styles.wide}>
        <div className={styles.freeHead}>
          <p className={styles.kicker}>Resources</p>
          <h2 id="free-stuff-heading">Free stuff</h2>
          <p className={styles.freeIntro}>
            Two free guides packed with practical advice for getting started -
            and getting better - at Jiu Jitsu.
          </p>
        </div>

        <div className={styles.freeGrid}>
          {resources.map((resource) => (
            <Link
              key={resource.href}
              href={resource.href}
              className={styles.freeCard}
            >
              <div className={styles.freeCover}>
                <Image
                  src={resource.image.src}
                  alt={resource.image.alt}
                  width={resource.image.width}
                  height={resource.image.height}
                  className={styles.freeCoverImg}
                  sizes="(max-width: 719px) 70vw, 20rem"
                />
              </div>
              <h3 className={styles.freeTitle}>{resource.title}</h3>
              <p className={styles.freeDesc}>{resource.description}</p>
              <span className={styles.freeGet}>Get it free</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
