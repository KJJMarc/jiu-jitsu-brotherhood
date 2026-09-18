"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import type { ClubMapPin } from "@/lib/club-network/academies";
import styles from "./jjb-club-network.module.css";
import "leaflet/dist/leaflet.css";

type Props = {
  pins: ClubMapPin[];
  selectedVenueId: string | null;
  onSelectVenue: (venueId: string, academyId: string) => void;
};

type LeafletHost = HTMLElement & { _leaflet_id?: number };

function destroyMap(container: HTMLElement | null, map: L.Map | null) {
  if (map) {
    map.remove();
  }
  if (!container) return;
  const host = container as LeafletHost;
  if (host._leaflet_id != null) {
    delete host._leaflet_id;
  }
  container.replaceChildren();
}

function pinIcon(active: boolean) {
  return L.divIcon({
    className: "",
    iconSize: [28, 36],
    iconAnchor: [14, 34],
    popupAnchor: [0, -28],
    html: `<span class="${active ? styles.mapPinActive : styles.mapPin}" aria-hidden="true"></span>`,
  });
}

/**
 * Imperative Leaflet map — avoids react-leaflet MapContainer's Strict Mode
 * "Map container is already initialized" crash on remount.
 */
export default function NetworkMap({
  pins,
  selectedVenueId,
  onSelectVenue,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const pinsRef = useRef(pins);
  const selectedRef = useRef(selectedVenueId);
  const onSelectRef = useRef(onSelectVenue);

  pinsRef.current = pins;
  selectedRef.current = selectedVenueId;
  onSelectRef.current = onSelectVenue;

  // Create / destroy the map once per mount (Strict Mode safe).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    destroyMap(container, mapRef.current);
    mapRef.current = null;
    markersRef.current.clear();

    const map = L.map(container, {
      scrollWheelZoom: false,
      worldCopyJump: true,
      center: [20, 0],
      zoom: 2,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapRef.current = map;

    const markers = markersRef.current;

    // Initial markers + fit
    const currentPins = pinsRef.current;
    for (const pin of currentPins) {
      const marker = L.marker([pin.lat, pin.lng], {
        icon: pinIcon(pin.venueId === selectedRef.current),
      });
      marker.bindPopup(
        `<div class="${styles.popup}"><strong>${escapeHtml(pin.academyName)}</strong><span>${escapeHtml(
          pin.venueLabel ? `${pin.venueLabel} · ${pin.city}` : pin.city,
        )}</span><a href="${escapeAttr(pin.websiteUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(
          pin.websiteLabel,
        )}</a></div>`,
      );
      marker.on("click", () => {
        onSelectRef.current(pin.venueId, pin.academyId);
      });
      marker.addTo(map);
      markers.set(pin.venueId, marker);
    }

    if (currentPins.length > 0) {
      const bounds = L.latLngBounds(currentPins.map((p) => [p.lat, p.lng]));
      // Leaflet measures size after layout; invalidate before fitting.
      map.invalidateSize();
      map.fitBounds(bounds.pad(0.22), { animate: false, maxZoom: 3 });
    }

    const raf = window.requestAnimationFrame(() => {
      map.invalidateSize();
      if (currentPins.length > 0) {
        const bounds = L.latLngBounds(currentPins.map((p) => [p.lat, p.lng]));
        map.fitBounds(bounds.pad(0.22), { animate: false, maxZoom: 3 });
      }
    });

    return () => {
      window.cancelAnimationFrame(raf);
      markers.clear();
      destroyMap(container, map);
      mapRef.current = null;
    };
    // pins are static for this page; markers update via the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only map lifecycle
  }, []);

  // Keep marker icons + camera in sync with selection.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const pin of pins) {
      const marker = markersRef.current.get(pin.venueId);
      if (!marker) continue;
      marker.setIcon(pinIcon(pin.venueId === selectedVenueId));
    }

    if (!selectedVenueId) return;
    const pin = pins.find((p) => p.venueId === selectedVenueId);
    if (!pin) return;
    map.flyTo([pin.lat, pin.lng], Math.max(map.getZoom(), 11), {
      duration: 0.65,
    });
  }, [pins, selectedVenueId]);

  return (
    <div className={styles.mapShell}>
      <div ref={containerRef} className={styles.mapCanvas} />
    </div>
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, "&#39;");
}
