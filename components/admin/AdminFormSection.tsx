"use client";

import styles from "@/app/admin/admin.module.css";

export function AdminFormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.formSection}>
      <header className={styles.formSectionHeader}>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </header>
      <div className={styles.formSectionBody}>{children}</div>
    </section>
  );
}
