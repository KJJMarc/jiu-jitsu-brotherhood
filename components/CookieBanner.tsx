"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { acceptAll, rejectAll, readConsent, writeConsent } from "@/lib/cookies";
import styles from "./CookieBanner.module.css";

export default function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Show when there's no valid consent, or when opened via Manage / Test links.
    const params = new URLSearchParams(window.location.search);
    if (!readConsent() || params.has("manage-cookies")) setOpen(true);

    // Allow other UI (e.g. a "Manage cookies" link) to re-open the banner.
    const reopen = () => setOpen(true);
    window.addEventListener("kjj-open-cookie-settings", reopen);
    return () => window.removeEventListener("kjj-open-cookie-settings", reopen);
  }, []);

  if (!open) return null;

  const accept = () => {
    writeConsent(acceptAll());
    setOpen(false);
  };

  const reject = () => {
    writeConsent(rejectAll());
    setOpen(false);
  };

  return (
    <div
      className={styles.banner}
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
    >
      <div className={styles.inner}>
        <div className={styles.text}>
          <p className={styles.title}>We use cookies</p>
          <p className={styles.body}>
            We use essential cookies to make this site work. With your consent,
            we also use analytics and marketing cookies. See our{" "}
            <Link href="/cookie-policy/">Cookie Policy</Link> for details.
          </p>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={reject}
          >
            Reject Non-Essential
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={accept}
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
