import Image from "next/image";
import styles from "./jjb-home.module.css";

const ouroborosShadow = {
  src: "/images/jjb/ouroboros-circle-shadow.png",
  width: 912,
  height: 950,
} as const;

export default function OuroborosBand() {
  return (
    <section className={styles.ouro} aria-labelledby="ouroboros-heading">
      <Image
        src={ouroborosShadow.src}
        alt=""
        width={ouroborosShadow.width}
        height={ouroborosShadow.height}
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
