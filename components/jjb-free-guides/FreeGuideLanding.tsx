import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import FreeGuideSignupForm, {
  type FreeGuideLandingKey,
} from "@/components/jjb-free-guides/FreeGuideSignupForm";
import styles from "./free-guide.module.css";

export type FreeGuideTheme = {
  title: string;
  body: string;
};

export type FreeGuideCover = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

type Props = {
  landing: FreeGuideLandingKey;
  eyebrow: string;
  title: string;
  titleId: string;
  subhead: string;
  lead: string;
  highlights: readonly string[];
  cover: FreeGuideCover;
  attribution: string;
  themesEyebrow: string;
  themesHeading: string;
  themesHeadingId: string;
  themes: readonly FreeGuideTheme[];
  finalHeading: string;
  finalHeadingId: string;
  finalLead: ReactNode;
  heroSignupId: string;
  footerSignupId: string;
};

/**
 * Shared free-guide landing shell — Beginner's Guide and Suck Less companions.
 */
export default function FreeGuideLanding({
  landing,
  eyebrow,
  title,
  titleId,
  subhead,
  lead,
  highlights,
  cover,
  attribution,
  themesEyebrow,
  themesHeading,
  themesHeadingId,
  themes,
  finalHeading,
  finalHeadingId,
  finalLead,
  heroSignupId,
  footerSignupId,
}: Props) {
  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby={titleId}>
        <div className={`container ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>{eyebrow}</p>
            <h1 id={titleId} className={styles.title}>
              {title}
            </h1>
            <p className={styles.subhead}>{subhead}</p>
            <p className={styles.lead}>{lead}</p>

            <ul className={styles.highlights}>
              {highlights.map((item) => (
                <li key={item} className={styles.highlight}>
                  <span className={styles.highlightMark} aria-hidden="true" />
                  <p className={styles.highlightText}>{item}</p>
                </li>
              ))}
            </ul>

            <FreeGuideSignupForm
              landing={landing}
              anchorId={heroSignupId}
              primary
            />
          </div>

          <div className={styles.heroCover}>
            <div className={styles.coverStack}>
              <Image
                src={cover.src}
                alt={cover.alt}
                width={cover.width}
                height={cover.height}
                className={styles.coverImg}
                priority
                sizes="(max-width: 899px) 78vw, 42vw"
              />
              <p className={styles.attribution}>{attribution}</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.inside} aria-labelledby={themesHeadingId}>
        <div className={`container ${styles.insideInner}`}>
          <p className={styles.kicker}>{themesEyebrow}</p>
          <h2 id={themesHeadingId} className={styles.sectionTitle}>
            {themesHeading}
          </h2>
          <ul className={styles.themeGrid}>
            {themes.map((theme, index) => (
              <li key={theme.title} className={styles.themeCard}>
                <p className={styles.themeIndex}>
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3>{theme.title}</h3>
                <p>{theme.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={styles.finalCta} aria-labelledby={finalHeadingId}>
        <div className={`container ${styles.finalInner}`}>
          <h2 id={finalHeadingId} className={styles.finalTitle}>
            {finalHeading}
          </h2>
          <p className={styles.finalLead}>{finalLead}</p>
          <FreeGuideSignupForm
            landing={landing}
            anchorId={footerSignupId}
            variant="footer"
          />
        </div>
      </section>
    </div>
  );
}

/** Jump link used in final-CTA copy back to the hero signup. */
export function FreeGuideSignupJump({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={styles.finalJump}>
      {children}
    </Link>
  );
}
