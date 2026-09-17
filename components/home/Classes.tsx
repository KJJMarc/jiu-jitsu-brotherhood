import Image from "next/image";
import Link from "next/link";
import { classes } from "@/lib/site";
import styles from "./home.module.css";

export default function Classes() {
  return (
    <section id="classes" className="section section--grey" aria-labelledby="classes-heading">
      <div className="container">
        <div className="section-head section-head--center">
          <p className="eyebrow">Find your class</p>
          <h2 id="classes-heading">Classes for every level</h2>
          <p>
            From your first day on the mats to competition and beyond, our
            programmes are built to keep you learning, growing and having fun.
          </p>
        </div>

        <ul className={styles.classGrid}>
          {classes.map((c) => (
            <li key={c.title}>
              <Link href={c.href} className={styles.classCard}>
                <span className={styles.classMedia}>
                  <Image
                    src={c.image}
                    alt={c.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                    className={styles.coverImg}
                  />
                </span>
                <span className={styles.classBody}>
                  <span className={styles.classTitle}>
                    {c.title}{" "}
                    <span className={styles.classArrow} aria-hidden="true">
                      →
                    </span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
