import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

const suggestions = [
  { label: "Home", href: "/" },
  { label: "Articles", href: "/blogs/blog" },
  { label: "Shop", href: "/collections/all" },
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
            <h1 className={styles.title}>Page not found</h1>
            <p className={styles.lead}>
              The page you&apos;re looking for may have moved or doesn&apos;t exist.
            </p>

            <ul className={styles.links}>
              {suggestions.map((s) => (
                <li key={s.href}>
                  <Link href={s.href}>{s.label}</Link>
                </li>
              ))}
            </ul>

            <div className={styles.actions}>
              <Link className="btn btn--primary" href="/">
                Back to Home
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
