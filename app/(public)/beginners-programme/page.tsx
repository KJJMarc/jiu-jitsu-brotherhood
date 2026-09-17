import type { Metadata } from "next";
import Link from "next/link";
import FinalCta from "@/components/home/FinalCta";
import styles from "@/components/pages.module.css";

export const metadata: Metadata = {
  title: "Our Beginners' Programme",
  description:
    "A structured introduction to Brazilian Jiu Jitsu at Kingston Jiu Jitsu — two weekly beginners' classes, the fundamentals you'll learn, and no experience needed to start.",
  alternates: { canonical: "/beginners-programme/" },
};

export default function BeginnersProgrammePage() {
  return (
    <>
      <section className="pagehero">
        <div className="container">
          <p className="eyebrow">Getting started</p>
          <h1>Our Beginners’ Programme</h1>
          <p>
            Starting Brazilian Jiu Jitsu doesn’t need to be complicated. Our
            beginners’ programme gives you a structured introduction to the most
            important positions, movements and techniques, building your
            knowledge gradually as you train.
          </p>
        </div>
      </section>

      <section className={styles.classContentSection}>
        <div className="container">
          <div className={styles.prose}>
          <h2>Beginners’ classes</h2>
          <p>
            We run two classes each week that are ideal for people starting their
            Jiu Jitsu journey:
          </p>
          <ul className={styles.ticks}>
            <li>Monday, 6 pm — Beginners Only (White Belts)</li>
            <li>Friday, 7 pm — Fundamentals Class (All Belt Levels)</li>
          </ul>
          <p>
            Both sessions follow the same curriculum, giving you the opportunity
            to practise and revisit important techniques as you develop.
          </p>

          <h2>What you’ll learn</h2>
          <p>
            Our programme gives you the foundations you need to train safely,
            confidently and eventually progress towards your blue belt. It
            includes:
          </p>
          <ul className={styles.ticks}>
            <li>Fundamental movements and escapes</li>
            <li>
              The key positions of Jiu Jitsu, including guard, mount, side
              control and back control
            </li>
            <li>Essential submissions and sweeps</li>
            <li>Basic takedowns and self-defence</li>
            <li>How to train safely and effectively with different partners</li>
          </ul>

          <h2>No experience needed</h2>
          <p>
            You don’t need to be fit, flexible or have any previous martial arts
            experience before starting. We’ll teach you what you need to know from
            the beginning, and you can progress at your own pace.
          </p>

          <p className={styles.backLink}>
            <Link href="/beginners-classes/">← Back to Beginners’ Classes</Link>
          </p>
          </div>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
