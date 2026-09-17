import Image from "next/image";
import Link from "next/link";
import { site, externalLinks, venues } from "@/lib/site";
import { getSiteSettings } from "@/lib/site-settings.server";
import { getActiveSocialLinks } from "@/lib/site-settings";
import styles from "./Footer.module.css";

const quickLinks = [
  { label: "About", href: "/about/" },
  { label: "Classes", href: "/classes/" },
  { label: "Membership", href: "/join-us/" },
  { label: "News", href: "/news/" },
  { label: "Find Us", href: "/locations/" },
  { label: "Contact", href: "/contact/" },
];

const memberLinks = [
  { label: "Book a Free Trial", href: externalLinks.freeTrial },
  { label: "Adult Timetable", href: "/timetable/", internal: true },
  { label: "Kids Timetable", href: "/kids-timetable/", internal: true },
  { label: "Online Portal", href: externalLinks.onlinePortal },
  { label: "Club Shop", href: externalLinks.shop, internal: true },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy-policy/" },
  { label: "Cookie Policy", href: "/cookie-policy/" },
  { label: "Child Protection Policy", href: "/child-protection-policy/" },
  { label: "Terms & Conditions", href: "/terms-and-conditions/" },
];

export default async function Footer() {
  const year = new Date().getFullYear();
  const settings = await getSiteSettings();
  const socials = getActiveSocialLinks(settings);

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.top}`}>
        <div className={styles.brandCol}>
          <span className={styles.logoChip}>
            <Image
              src="/images/logo.png"
              alt="Kingston Jiu Jitsu"
              width={720}
              height={187}
              className={styles.logo}
            />
          </span>
          <p className={styles.blurb}>
            Brazilian Jiu Jitsu for all ages and levels in Kingston upon Thames.
            Proud members of the Mauricio Gomes Legacy Team.
          </p>
          {socials.length > 0 ? (
            <ul className={styles.socials} aria-label="Social media">
              {socials.map((s) => (
                <li key={s.key}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d={s.icon} fill="currentColor" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <nav className={styles.col} aria-label="Footer">
          <h2 className={styles.colTitle}>Explore</h2>
          <ul>
            {quickLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className={styles.col} aria-label="Members and booking">
          <h2 className={styles.colTitle}>Members</h2>
          <ul>
            {memberLinks.map((l) => (
              <li key={l.href}>
                {"internal" in l && l.internal ? (
                  <Link href={l.href}>{l.label}</Link>
                ) : (
                  <a href={l.href} target="_blank" rel="noopener noreferrer">
                    {l.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.col}>
          <h2 className={styles.colTitle}>Get in Touch</h2>
          <ul className={styles.contact}>
            <li>
              <a href={site.phoneHref}>{site.phone}</a>
            </li>
            <li>
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </li>
          </ul>
          <h3 className={styles.venueHead}>Where we train</h3>
          <address className={styles.venues}>
            {venues.map((v) => (
              <span key={v.name}>
                <strong>{v.name}</strong>
                {v.street}, {v.locality}, {v.postcode}
              </span>
            ))}
          </address>
        </div>
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
