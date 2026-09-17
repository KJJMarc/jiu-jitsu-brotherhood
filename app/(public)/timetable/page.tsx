import type { Metadata } from "next";
import Link from "next/link";
import { getTimetable, timetableClubs } from "@/lib/timetable";
import { externalLinks } from "@/lib/site";
import TimetableGrid from "@/components/timetable/TimetableGrid";
import FinalCta from "@/components/home/FinalCta";
import styles from "@/components/pages.module.css";

export const metadata: Metadata = {
  title: "Adult Timetable",
  description:
    "The weekly adult class timetable for Kingston Jiu Jitsu — Brazilian Jiu Jitsu, No-Gi, Muay Thai, women's classes and open mats across the week.",
  alternates: { canonical: "/timetable/" },
};

export default async function AdultTimetablePage() {
  const data = await getTimetable(timetableClubs.adults);

  return (
    <>
      <section className="pagehero">
        <div className="container">
          <h1>Adult Timetable</h1>
          <p>
            Our weekly adult classes, from beginners and fundamentals to
            advanced, No-Gi, Muay Thai and open mats. New to the club? Start with
            a free trial.
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
          </div>
        </div>
      </section>

      <section className={styles.classContentSection}>
        <div className="container">
          {data ? (
            <TimetableGrid data={data} />
          ) : (
            <div className={styles.timetableError}>
              <h2>The timetable is temporarily unavailable</h2>
              <p>
                We couldn&apos;t load the live timetable just now. Please try
                again shortly, or{" "}
                <Link href="/contact/">get in touch</Link> and we&apos;ll be
                happy to help with class times.
              </p>
            </div>
          )}
        </div>
      </section>

      <FinalCta />
    </>
  );
}
