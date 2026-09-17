import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import styles from "@/components/pages.module.css";

export const metadata: Metadata = {
  title: {
    absolute: site.name,
  },
  description: site.description,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <section className="pagehero">
      <div className="container">
        <p className="eyebrow">{site.name}</p>
        <h1>{site.tagline}</h1>
        <p>{site.description}</p>
        <div className={styles.ctaRow}>
          <Link className="btn btn--primary" href="/blogs/blog">
            Articles
          </Link>
          <Link className="btn btn--outline" href="/collections/all">
            Shop
          </Link>
        </div>
      </div>
    </section>
  );
}
