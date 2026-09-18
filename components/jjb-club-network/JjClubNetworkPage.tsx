import Link from "next/link";
import ClubNetworkExplorer from "@/components/jjb-club-network/ClubNetworkExplorer";
import styles from "./jjb-club-network.module.css";

/**
 * Dedicated JJB Club Network page.
 * Routed only from /pages/jiu-jitsu-brotherhood-club-network.
 * Does not use ContentDocument / CMS body.
 */
export default function JjClubNetworkPage() {
  return (
    <div className={styles.page}>
      <section
        className={styles.bookend}
        aria-labelledby="club-network-heading"
      >
        <div className={`container ${styles.bookendGrid}`}>
          <div className={styles.bookendMain}>
            <p className={styles.eyebrow}>Club Network</p>
            <h1 id="club-network-heading" className={styles.introTitle}>
              Find a Brotherhood academy
            </h1>
            <p className={styles.introLead}>
              The Jiu Jitsu Brotherhood Club Network connects independent
              academies around the world through friendship, shared knowledge
              and a love of the art. It isn&apos;t an affiliation, grading
              organisation or competition team.
            </p>
            <p className={styles.introHint}>
              Tap a pin or academy card to explore.
            </p>
          </div>
          {/* Reserves the same aside column as the closing bookend */}
          <div className={styles.bookendAside} aria-hidden="true" />
        </div>
      </section>

      <ClubNetworkExplorer />

      <section
        className={`${styles.bookend} ${styles.bookendDark}`}
        aria-labelledby="network-means-heading"
      >
        <div className={`container ${styles.bookendGrid}`}>
          <div className={styles.bookendMain}>
            <p className={styles.closingKicker}>What the network means</p>
            <h2 id="network-means-heading" className={styles.closingTitle}>
              Independent academies. Shared spirit.
            </h2>
            <p className={styles.closingBody}>
              Each academy runs independently. There are no network membership
              fees, JJB does not control gradings, and this is not a competition
              team or franchise.
            </p>
            <p className={styles.closingBody}>
              What we share is friendship, seminars, camps and community.
              Members visiting another network academy currently receive two
              weeks of free training.
            </p>
          </div>

          <aside
            className={styles.bookendAside}
            aria-labelledby="network-events-label"
          >
            <p id="network-events-label" className={styles.closingEventsLabel}>
              Events &amp; Seminars
            </p>
            <Link href="/pages/past-events" className={styles.closingEventsLink}>
              Explore past events →
            </Link>
          </aside>
        </div>
      </section>
    </div>
  );
}
