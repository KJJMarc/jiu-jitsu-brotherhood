"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  clubNetworkAcademies,
  clubNetworkMapPins,
  type ClubAcademy,
} from "@/lib/club-network/academies";
import styles from "./jjb-club-network.module.css";

const NetworkMap = dynamic(() => import("./NetworkMap"), {
  ssr: false,
  loading: () => <div className={styles.mapSkeleton} aria-hidden="true" />,
});

function AcademyCard({
  academy,
  selected,
  onSelect,
}: {
  academy: ClubAcademy;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <article
      id={`academy-${academy.id}`}
      className={selected ? `${styles.card} ${styles.cardSelected}` : styles.card}
    >
      <button
        type="button"
        className={styles.cardHit}
        onClick={onSelect}
        aria-pressed={selected}
      >
        <span className={styles.cardLogo}>
          <Image
            src={academy.logoSrc}
            alt=""
            width={96}
            height={96}
            className={styles.cardLogoImg}
          />
        </span>
        <span className={styles.cardBody}>
          <h3 className={styles.cardTitle}>{academy.name}</h3>
          <p className={styles.cardCity}>
            {academy.venues.length > 1
              ? academy.venues.map((v) => v.city).join(" · ")
              : academy.venues[0]?.city}
          </p>
        </span>
      </button>

      <div className={styles.cardDetails}>
        {academy.venues.map((venue) => (
          <div key={venue.id} className={styles.venueBlock}>
            {venue.label ? (
              <p className={styles.venueLabel}>{venue.label}</p>
            ) : null}
            <address className={styles.address}>
              {venue.addressLines.map((line) => (
                <span key={line}>
                  {line}
                  <br />
                </span>
              ))}
            </address>
            <a
              className={styles.directions}
              href={venue.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on map
            </a>
          </div>
        ))}
        <a
          className={styles.website}
          href={academy.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {academy.websiteLabel}
        </a>
      </div>
    </article>
  );
}

export default function ClubNetworkExplorer() {
  const pins = useMemo(() => clubNetworkMapPins(), []);
  const [selectedAcademyId, setSelectedAcademyId] = useState<string | null>(
    null,
  );
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);

  const onSelectVenue = useCallback((venueId: string, academyId: string) => {
    setSelectedVenueId(venueId);
    setSelectedAcademyId(academyId);
    const el = document.getElementById(`academy-${academyId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  const onSelectAcademy = useCallback((academy: ClubAcademy) => {
    setSelectedAcademyId(academy.id);
    setSelectedVenueId(academy.venues[0]?.id ?? null);
  }, []);

  return (
    <>
      <section className={styles.mapSection} aria-label="Academy map">
        <div className={styles.mapBand}>
          <NetworkMap
            pins={pins}
            selectedVenueId={selectedVenueId}
            onSelectVenue={onSelectVenue}
          />
        </div>
      </section>

      <section
        className={styles.academiesSection}
        aria-labelledby="academies-heading"
      >
        <div className="container">
          <p className={styles.kicker}>Academies</p>
          <h2 id="academies-heading" className={styles.sectionTitle}>
            The Club Network
          </h2>
          <ul className={styles.grid}>
            {clubNetworkAcademies.map((academy) => (
              <li key={academy.id}>
                <AcademyCard
                  academy={academy}
                  selected={selectedAcademyId === academy.id}
                  onSelect={() => onSelectAcademy(academy)}
                />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
