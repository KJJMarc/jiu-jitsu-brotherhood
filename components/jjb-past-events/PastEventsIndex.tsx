import Link from "next/link";
import type { ContentRecord } from "@/lib/content/types";
import {
  formatPastEventDate,
  PAST_EVENTS_ARCHIVE,
  type PastEventArchiveEntry,
} from "@/lib/past-events/archive";
import styles from "./jjb-past-events.module.css";

type Card = PastEventArchiveEntry & {
  imageUrl: string | null;
  imageAlt: string | null;
};

function buildCards(records: ContentRecord[]): Card[] {
  const byPath = new Map(
    records.map((r) => [r.canonical_path, r] as const),
  );
  return PAST_EVENTS_ARCHIVE.map((entry) => {
    const record = byPath.get(entry.canonicalPath);
    return {
      ...entry,
      imageUrl: entry.imageSrc ?? record?.featured_image_url ?? null,
      imageAlt: record?.featured_image_alt || entry.title,
    };
  });
}

export default function PastEventsIndex({
  records,
}: {
  records: ContentRecord[];
}) {
  const cards = buildCards(records);

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <p className={styles.eyebrow}>Archive</p>
          <h1 className={styles.title}>Past Events</h1>
          <p className={styles.lead}>
            Club Network seminars, competitions and early history — newest
            first.
          </p>
        </div>
      </header>

      <section className={styles.section} aria-label="Past events">
        <div className="container">
          <ol className={styles.timeline}>
            {cards.map((card) => (
              <li key={card.canonicalPath} className={styles.item}>
                <Link href={card.canonicalPath} className={styles.card}>
                  <div className={styles.media}>
                    {card.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={card.imageUrl}
                        alt={card.imageAlt || ""}
                        className={styles.img}
                      />
                    ) : (
                      <div className={styles.mediaFallback} aria-hidden />
                    )}
                  </div>
                  <div className={styles.body}>
                    <p className={styles.kind}>
                      {card.kind === "network_history"
                        ? "Network history"
                        : card.kind === "competition"
                          ? "Competition"
                          : card.kind === "charity"
                            ? "Charity event"
                            : "Seminar"}
                    </p>
                    <h2 className={styles.cardTitle}>{card.title}</h2>
                    <p className={styles.meta}>
                      <time dateTime={card.eventDate}>
                        {formatPastEventDate(card.eventDate)}
                      </time>
                      {card.location ? (
                        <>
                          <span aria-hidden="true"> · </span>
                          <span>{card.location}</span>
                        </>
                      ) : null}
                    </p>
                    <p className={styles.blurb}>{card.blurb}</p>
                    <span className={styles.cta}>View details →</span>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
