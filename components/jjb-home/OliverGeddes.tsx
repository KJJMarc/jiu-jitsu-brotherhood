import Image from "next/image";
import { localAssets } from "@/lib/home/prototype";
import styles from "./jjb-home.module.css";

/**
 * Memorial / support treatment for the Oliver Geddes Foundation.
 * Portrait cropped from the existing foundation composite (source file retained
 * in Shopify CDN; this local crop is presentation-only). Copy is live HTML.
 */
export default function OliverGeddes() {
  const portrait = localAssets.oliPortrait;

  return (
    <section
      className={`${styles.band} ${styles.bandBlack}`}
      aria-labelledby="oli-heading"
    >
      <div className={`${styles.wide} ${styles.oli}`}>
        <div className={styles.oliPortrait}>
          <Image
            src={portrait.src}
            alt={portrait.alt}
            width={portrait.width}
            height={portrait.height}
            sizes="(max-width: 859px) 70vw, 26rem"
            unoptimized
          />
        </div>

        <div className={styles.oliCopy}>
          <p className={styles.kicker}>Community</p>
          <p className={styles.oliLead}>
            Jiu Jitsu Brotherhood supports the
          </p>
          <h2 id="oli-heading" className={styles.oliName}>
            Oliver Geddes Foundation
          </h2>
          <p className={styles.oliYears}>
            In memory of our friend
            <br />
            Oliver Geddes
            <br />
            <span className={styles.oliDates}>1984-2025</span>
          </p>
          <a
            className={styles.oliSupport}
            href="https://www.justgiving.com/crowdfunding/olivergeddesfoundation"
            target="_blank"
            rel="noopener noreferrer"
          >
            Support the Foundation
          </a>
        </div>
      </div>
    </section>
  );
}
