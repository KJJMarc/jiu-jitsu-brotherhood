import Image from "next/image";
import { compactMark } from "@/lib/brand";
import styles from "./jjb-home.module.css";

export default function OuroborosBand() {
  return (
    <section className={styles.ouro} aria-labelledby="ouroboros-heading">
      <Image
        src={compactMark.src}
        alt=""
        width={compactMark.width}
        height={compactMark.height}
        className={styles.ouroMark}
        aria-hidden="true"
        priority={false}
      />
      <div className={`${styles.wide} ${styles.ouroInner}`}>
        <div className={styles.ouroAccent} aria-hidden="true" />
        <h2 id="ouroboros-heading">The circle continues</h2>
        <p>
          Learn. Share. Pass it on. Jiu Jitsu is built on knowledge passed from
          one person to another, and there is always something more to discover.
        </p>
      </div>
    </section>
  );
}
