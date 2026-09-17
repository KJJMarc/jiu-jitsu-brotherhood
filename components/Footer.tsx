import Image from "next/image";
import Link from "next/link";
import { site, primaryNav } from "@/lib/site";
import { headerLogo } from "@/lib/brand";
import styles from "./Footer.module.css";

const legalLinks = [
  { label: "Privacy Policy", href: "/pages/privacy-policy" },
  { label: "Cookie Policy", href: "/cookie-policy" },
  { label: "Terms & Conditions", href: "/pages/terms-conditions" },
];

export default async function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.top}`}>
        <div className={styles.brandCol}>
          <Link href="/" className={`${styles.logoLink} ${styles.logoChip}`} aria-label={`${site.name} home`}>
            <Image
              src={headerLogo.src}
              alt={headerLogo.alt}
              width={headerLogo.width}
              height={headerLogo.height}
              className={styles.logo}
            />
          </Link>
          <p className={styles.blurb}>{site.description}</p>
        </div>

        <nav className={styles.col} aria-label="Footer">
          <h2 className={styles.colTitle}>Explore</h2>
          <ul>
            {primaryNav.map((l) => (
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
            © {year} {site.name}. All rights reserved.
          </p>
          <nav className={styles.legalLinks} aria-label="Legal">
            {legalLinks.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
