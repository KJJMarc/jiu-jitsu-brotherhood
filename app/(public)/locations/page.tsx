import type { Metadata } from "next";
import Link from "next/link";
import { venues, site, externalLinks } from "@/lib/site";
import FinalCta from "@/components/home/FinalCta";
import styles from "@/components/pages.module.css";

export const metadata: Metadata = {
  title: "How to Find Us",
  description:
    "Where Kingston Jiu Jitsu trains in Kingston upon Thames — Tiffin Sports Centre and St John's Parish Hall. Get directions and book your free trial.",
  alternates: { canonical: "/locations/" },
};

export default function LocationsPage() {
  return (
    <>
      <section className="pagehero">
        <div className="container">
          <p className="eyebrow">How to find us</p>
          <h1>Where we train</h1>
          <p>
            We run classes at two venues in Kingston upon Thames. Come along for a
            free trial — we&apos;d love to welcome you to the mats.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <ul className={styles.cardGrid}>
            {venues.map((v) => (
              <li key={v.name} className={styles.card}>
                <h3>{v.name}</h3>
                <address>
                  {v.street}
                  <br />
                  {v.locality}
                  <br />
                  {v.postcode}
                </address>
                <div className={styles.mapFrame}>
                  <iframe
                    src={v.mapEmbed}
                    title={`Map showing ${v.name}, ${v.postcode}`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>
                <a
                  className={styles.link}
                  href={v.maps}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get directions →
                </a>
              </li>
            ))}
          </ul>

          <div className={styles.note} style={{ marginTop: "2rem" }}>
            Not sure which class or venue is right for you? Call us on{" "}
            <a href={site.phoneHref}>{site.phone}</a> or email{" "}
            <a href={`mailto:${site.email}`}>{site.email}</a> and we&apos;ll point
            you in the right direction.
          </div>

          <div className={styles.ctaRow}>
            <a
              className="btn btn--primary"
              href={externalLinks.freeTrial}
              target="_blank"
              rel="noopener noreferrer"
            >
              Book a Free Trial
            </a>
            <Link className="btn btn--outline" href="/classes/">
              Explore Our Classes
            </Link>
          </div>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
