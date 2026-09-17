"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import styles from "@/app/admin/admin.module.css";

const STORAGE_KEY = "kjj-admin-search-details-open";

type Props = {
  children: ReactNode;
  header: ReactNode;
  summary: ReactNode;
};

export function AdminSearchDetailsCollapse({
  children,
  header,
  summary,
}: Props) {
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const reactId = useId();
  const panelId = `${reactId}-panel`;
  const buttonId = `${reactId}-toggle`;

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") {
        setOpen(true);
      }
    } catch {
      // Ignore storage access failures (private mode, blocked, etc.).
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, open ? "1" : "0");
    } catch {
      // Ignore storage write failures.
    }
  }, [open, hydrated]);

  return (
    <div className={styles.searchDetails}>
      {header}
      {summary}

      <div className={styles.trafficFooter}>
        <button
          id={buttonId}
          type="button"
          className={styles.searchDetailsToggle}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <span>Search details</span>
          <span
            className={`${styles.searchDetailsChevron}${
              open ? ` ${styles.searchDetailsChevronOpen}` : ""
            }`}
            aria-hidden="true"
          >
            ▾
          </span>
        </button>
      </div>

      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={`${styles.searchDetailsPanel}${
          open ? ` ${styles.searchDetailsPanelOpen}` : ""
        }`}
        aria-hidden={!open}
        // Keep closed panel content out of the tab order.
        inert={!open ? true : undefined}
      >
        <div className={styles.searchDetailsPanelInner}>{children}</div>
      </div>
    </div>
  );
}
