"use client";

import { useEffect } from "react";
import styles from "@/app/admin/admin.module.css";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin] route error", error);
  }, [error]);

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>Admin</p>
        <h1>Something went wrong</h1>
        <p className={styles.lead}>
          {error.message || "An unexpected error occurred in the admin area."}
          {error.digest ? (
            <>
              {" "}
              <span className={styles.tableMeta}>Digest: {error.digest}</span>
            </>
          ) : null}
        </p>
      </header>
      <section className={styles.panel}>
        <button type="button" className={styles.primaryButton} onClick={reset}>
          Try again
        </button>
      </section>
    </div>
  );
}
