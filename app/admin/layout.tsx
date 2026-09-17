import type { Metadata } from "next";
import styles from "./admin.module.css";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s · JJB Admin",
  },
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Minimal admin root layout — no public Header/Footer/CookieBanner.
 * Auth enforcement lives in `(console)/layout.tsx` so `/admin/login/` stays public.
 */
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.adminRoot}>{children}</div>;
}
