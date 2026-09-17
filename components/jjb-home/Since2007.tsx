import Image from "next/image";
import Link from "next/link";
import { localAssets } from "@/lib/home/prototype";
import styles from "./jjb-home.module.css";

export default function Since2007() {
  const photo = localAssets.historyPhoto;

  return (
    <section
      className={`${styles.band} ${styles.bandRed}`}
      aria-labelledby="since-2007-heading"
    >
      <div className={`${styles.wide} ${styles.history}`}>
        <div>
          <h2 id="since-2007-heading">Jiu Jitsu is meant to be shared</h2>
          <p>
            Jiu Jitsu Brotherhood was established in 2007 around a simple idea:
            the art gets better when knowledge moves freely between people.
          </p>
          <p>
            Techniques matter - but so do the people we train with, learn from
            and meet along the way. Nearly two decades on, that is still the
            centre of what we do.
          </p>
          <Link className={styles.historyCta} href="/pages/about">
            About Jiu Jitsu Brotherhood
          </Link>
        </div>

        <div className={styles.historyMedia}>
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(max-width: 899px) 100vw, 48vw"
            style={{ objectFit: "cover", objectPosition: photo.position }}
          />
        </div>
      </div>
    </section>
  );
}
