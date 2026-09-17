import Image from "next/image";
import { localAssets } from "@/lib/home/prototype";
import styles from "./jjb-home.module.css";

export default function SummersJourney() {
  const image = localAssets.summer;

  return (
    <section
      className={`${styles.bandTight} ${styles.bandRed}`}
      aria-labelledby="summer-heading"
    >
      <div className={`${styles.wide} ${styles.summer}`}>
        <div className={styles.summerCopy}>
          <p className={styles.kicker}>Community</p>
          <h2 id="summer-heading">Help Summer Fight Leukaemia Again</h2>
          <p>
            Summer, the daughter of Ray - Head Kids instructor at Kingston Jiu
            Jitsu - is battling leukaemia for the third time. If you are able, a
            donation helps her family through the months of treatment ahead.
          </p>
          <a
            className={styles.summerLink}
            href="https://www.gofundme.com/f/summer-and-her-family-2hrja"
            target="_blank"
            rel="noopener noreferrer"
          >
            Donate on GoFundMe
          </a>
        </div>
        <div className={styles.summerMedia}>
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            sizes="(max-width: 799px) 68vw, 22rem"
          />
        </div>
      </div>
    </section>
  );
}
