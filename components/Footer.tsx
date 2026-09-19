import Image from "next/image";
import Link from "next/link";
import {
  site,
  footerExploreNav,
  footerShopNav,
  footerInfoNav,
} from "@/lib/site";
import { headerLogo } from "@/lib/brand";
import { JJB_LEGAL_ENTITY } from "@/lib/legal-entity";
import {
  getActiveSocialLinks,
  getDefaultSiteSettings,
} from "@/lib/site-settings";
import { getSiteSettings } from "@/lib/site-settings.server";
import styles from "./Footer.module.css";

export default async function Footer() {
  const year = new Date().getFullYear();
  const defaults = getDefaultSiteSettings();
  const settings = await getSiteSettings();
  // Prefer admin/DB values when set; fall back to static JJB profiles in site.ts.
  const socials = getActiveSocialLinks({
    facebook_url: settings.facebook_url || defaults.facebook_url,
    instagram_url: settings.instagram_url || defaults.instagram_url,
    twitter_url: settings.twitter_url || defaults.twitter_url,
    youtube_url: settings.youtube_url || defaults.youtube_url,
    tiktok_url: settings.tiktok_url || defaults.tiktok_url,
  });

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
          <p className={styles.companyLine}>
            {JJB_LEGAL_ENTITY.operatorLegalName} trading as{" "}
            {JJB_LEGAL_ENTITY.tradingName}. Company number{" "}
            {JJB_LEGAL_ENTITY.companyNumber}. Registered office:{" "}
            {JJB_LEGAL_ENTITY.registeredOffice}.{" "}
            <a href={`mailto:${JJB_LEGAL_ENTITY.email}`}>
              {JJB_LEGAL_ENTITY.email}
            </a>
            {" · "}
            <a href={`tel:${JJB_LEGAL_ENTITY.telephone.replace(/\s+/g, "")}`}>
              {JJB_LEGAL_ENTITY.telephone}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
