import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { classes, externalLinks, site } from "@/lib/site";
import FinalCta from "@/components/home/FinalCta";
import styles from "@/components/pages.module.css";

export const metadata: Metadata = {
  title: "Classes",
  description:
    "Brazilian Jiu Jitsu, no-gi grappling, women's, kids, beginners, open mats, TNT and Muay Thai classes at Kingston Jiu Jitsu in Kingston upon Thames.",
  alternates: { canonical: "/classes/" },
};

export default function ClassesPage() {
  return (
    <>
      <section className="pagehero">
        <div className="container">
          <p className="eyebrow">Find your class</p>
          <h1>Classes for every journey</h1>
          <p>
            From your first day on the mats to competition and beyond, our
            programmes are built for all ages and experience levels. Your first
            class is always free.
          </p>
          <div className={styles.ctaRow}>
            <a
              className="btn btn--primary"
              href={externalLinks.freeTrial}
              target="_blank"
              rel="noopener noreferrer"
            >
              Book a Free Trial
            </a>
            <a className="btn btn--outline" href={site.phoneHref}>
              Call {site.phone}
            </a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <ul className={styles.classList}>
            {classes.map((c, i) => (
              <li
                key={c.slug}
                id={c.slug}
                className={`${styles.classRow} ${i % 2 === 1 ? styles.reverse : ""}`}
              >
                <div className={styles.media}>
                  <Image
                    src={c.image}
                    alt={c.alt}
                    fill
                    sizes="(max-width: 760px) 100vw, 50vw"
                  />
                </div>
                <div>
                  <h2>{c.title}</h2>
                  <p>{c.body}</p>
                  <Link className={styles.link} href={c.href}>
                    Learn more →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
