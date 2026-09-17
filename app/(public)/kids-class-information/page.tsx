import type { Metadata } from "next";
import Link from "next/link";
import SitePageView from "@/components/SitePageView";
import { getPublishedSitePage } from "@/lib/site-pages.server";
import styles from "@/components/pages.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const cms = await getPublishedSitePage("kids-class-information");
  return {
    title: cms?.seoTitle || cms?.title || "Kids' Class Information",
    description:
      cms?.seoDescription ||
      "Practical information for parents of children training at Kingston Jiu Jitsu — membership and term times, the kids' behaviour policy and uniform.",
    alternates: { canonical: "/kids-class-information/" },
  };
}

const behaviour: { label: string; text: string }[] = [
  {
    label: "Respect",
    text: "Respect your instructors and training partners, and never use your skills to hurt others.",
  },
  {
    label: "Safe training",
    text: "Listen, drill slowly when learning, and always stop when a partner taps or says stop.",
  },
  {
    label: "Effort",
    text: "Work hard, be attentive and help your partner by taking turns.",
  },
  {
    label: "Language",
    text: "No rude, racist or sexist language, and no making fun of training partners.",
  },
  {
    label: "Punctuality",
    text: "Arrive on time so you can warm up properly.",
  },
  {
    label: "Sportsmanship",
    text: "Be gracious in victory and defeat. Bullying is never acceptable.",
  },
  {
    label: "Parental responsibility",
    text: "Your child remains your responsibility until they are in the training room.",
  },
];

function StaticKidsClassInformationPage() {
  return (
    <>
      <section className="pagehero">
        <div className="container">
          <p className="eyebrow">For parents</p>
          <h1>Kids’ Class Information</h1>
          <p>
            Everything you need to know about our children’s classes —
            membership and term times, our behaviour policy and uniform.
          </p>
        </div>
      </section>

      <section className={styles.classContentSection}>
        <div className="container">
          <div className={styles.prose}>
            <h2>Membership &amp; term times</h2>
            <p>
              Our kids’ membership runs throughout the year, but classes are
              term time only. The membership price already takes the school
              holidays into account. The cost of the term-time classes is simply
              spread into regular payments over the 4, 8 or 12 months of your
              selected contract. You are not being charged for classes during
              the school holidays when no classes are running.
            </p>

            <h3>Autumn term 2026</h3>
            <ul className={styles.ticks}>
              <li>Classes start back on Monday 7th September</li>
              <li>
                Two-week half-term break: 19th October – 1st November inclusive
              </li>
              <li>Last class of term: 6th December</li>
            </ul>

            <h2>Kids’ behaviour policy</h2>
            <ul className={styles.ticks}>
              {behaviour.map((b) => (
                <li key={b.label}>
                  <strong>{b.label}:</strong> {b.text}
                </li>
              ))}
            </ul>

            <h2>Uniform</h2>
            <p>
              Kingston Jiu Jitsu uniform is compulsory for all children training
              at the club. We have all sizes available. Please contact{" "}
              <a href="mailto:admin@kingstonjiujitsu.com">
                admin@kingstonjiujitsu.com
              </a>{" "}
              for more information.
            </p>

            <p className={styles.backLink}>
              <Link href="/kids-classes/">← Back to Kids’ Classes</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

export default async function KidsClassInformationPage() {
  const cms = await getPublishedSitePage("kids-class-information");
  if (cms) return <SitePageView page={cms} />;
  return <StaticKidsClassInformationPage />;
}
