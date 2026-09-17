import Image from "next/image";
import Link from "next/link";
import {
  site,
  footerExploreNav,
  footerShopNav,
  footerInfoNav,
} from "@/lib/site";
import { headerLogo } from "@/lib/brand";
import styles from "./Footer.module.css";

export default async function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.top}`}>
        <div className={styles.brandCol}>
          <Link
            href="/"
            className={`${styles.logoLink} ${styles.logoChip}`}
            aria-label={`${site.name} home`}
          >
            <Image
              src={headerLogo.src}
              alt={headerLogo.alt}
              width={headerLogo.width}
              height={headerLogo.height}
              className={styles.logo}
            />
          </Link>
          <p className={styles.blurb}>{site.footerBlurb}</p>
        </div>

        <nav className={styles.col} aria-label="Explore">
          <h2 className={styles.colTitle}>Explore</h2>
          <ul>
            {footerExploreNav.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className={styles.col} aria-label="Shop">
          <h2 className={styles.colTitle}>Shop</h2>
          <ul>
            {footerShopNav.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className={styles.col} aria-label="Information">
          <h2 className={styles.colTitle}>Information</h2>
          <ul>
            {footerInfoNav.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className={styles.bottom}>
        <div className={`container ${styles.bottomBar}`}>
          <p>
            <span className={styles.copyMark} aria-hidden="true">
              {"\u00A9"}
            </span>{" "}
            {year} {site.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
