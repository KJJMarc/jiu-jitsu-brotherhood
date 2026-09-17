import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { externalLinks } from "@/lib/site";
import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

const suggestions = [
  { label: "Home", href: "/" },
  { label: "Classes", href: "/classes/" },
  { label: "Join Us", href: "/join-us/" },
  { label: "How to Find Us", href: "/locations/" },
  { label: "Get in Touch", href: "/contact/" },
];

export default function NotFound() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <section className={styles.wrap}>
          <div className="container">
            <p className={styles.code}>404</p>
            <h1 className={styles.title}>We couldn&apos;t pin that page</h1>
            <p className={styles.lead}>
              The page you&apos;re looking for may have moved or doesn&apos;t exist.
              Let&apos;s get you back on the mats — try one of these instead.
            </p>

            <ul className={styles.links}>
              {suggestions.map((s) => (
                <li key={s.href}>
                  <Link href={s.href}>{s.label}</Link>
                </li>
              ))}
            </ul>

            <div className={styles.actions}>
              <Link className="btn btn--outline" href="/">
                Back to Home
              </Link>
              <a
                className="btn btn--primary"
                href={externalLinks.freeTrial}
                target="_blank"
                rel="noopener noreferrer"
              >
                Book a Free Trial
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
