"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { primaryNav, externalLinks, type NavItem } from "@/lib/site";
import styles from "./Header.module.css";

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  if (item.nolink || !item.href) {
    return <span className={styles.navStatic}>{item.label}</span>;
  }
  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" onClick={onNavigate}>
        {item.label}
      </a>
    );
  }
  return (
    <Link href={item.href} onClick={onNavigate}>
      {item.label}
    </Link>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>([]);

  const toggleSection = (label: string) =>
    setOpenSections((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // iOS Safari can keep body scroll-lock and stale layout widths across
  // orientation changes. Close the drawer, clear overflow, then nudge a
  // reflow after the layout viewport has updated (no overflow clipping).
  useEffect(() => {
    const onOrient = () => {
      setOpen(false);
      setOpenSections([]);
      document.body.style.overflow = "";

      const reflow = () => {
        window.scrollTo(window.scrollX, window.scrollY);
      };
      window.addEventListener("resize", reflow, { once: true });
      window.setTimeout(reflow, 120);
      window.setTimeout(reflow, 320);
    };
    window.addEventListener("orientationchange", onOrient);
    return () => window.removeEventListener("orientationchange", onOrient);
  }, []);

  const close = () => {
    setOpen(false);
    setOpenSections([]);
  };

  return (
    <>
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
        <div className={`container ${styles.bar}`}>
        <Link href="/" className={styles.brand} onClick={close} aria-label="Kingston Jiu Jitsu home">
          <Image
            src="/images/logo.png"
            alt="Kingston Jiu Jitsu"
            width={720}
            height={187}
            priority
            className={styles.logo}
          />
        </Link>

        <nav className={styles.desktopNav} aria-label="Primary">
          <ul className={styles.navList}>
            {primaryNav.map((item) => (
              <li
                key={item.label}
                className={item.children ? styles.hasChildren : undefined}
              >
                <span className={styles.navTop}>
                  <NavLink item={item} />
                  {item.children && (
                    <svg
                      className={styles.chevron}
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  )}
                </span>
                {item.children && (
                  <ul className={styles.dropdown}>
                    {item.children.map((child) => (
                      <li key={child.label}>
                        <NavLink item={child} />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.actions}>
          <a
            className={`btn btn--primary ${styles.cta}`}
            href={externalLinks.freeTrial}
            target="_blank"
            rel="noopener noreferrer"
          >
            Book a Free Trial
          </a>
          <button
            className={styles.burger}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className={open ? styles.barTop : ""} />
            <span className={open ? styles.barMid : ""} />
            <span className={open ? styles.barBot : ""} />
          </button>
        </div>
        </div>
      </header>

      {/* Mobile drawer (rendered outside <header> so position:fixed is
          relative to the viewport, not the backdrop-filtered header) */}
      <div
        className={`${styles.overlay} ${open ? styles.overlayOpen : ""}`}
        onClick={close}
        aria-hidden="true"
      />
      <div
        id="mobile-menu"
        className={`${styles.drawer} ${open ? styles.drawerOpen : ""}`}
        hidden={!open}
      >
        <nav aria-label="Mobile">
          <ul className={styles.mobileList}>
            {primaryNav.map((item) => {
              if (item.children) {
                const isSectionOpen = openSections.includes(item.label);
                const panelId = `m-${item.label.replace(/\s+/g, "-").toLowerCase()}`;
                return (
                  <li key={item.label}>
                    <button
                      type="button"
                      className={styles.mobileToggle}
                      aria-expanded={isSectionOpen}
                      aria-controls={panelId}
                      onClick={() => toggleSection(item.label)}
                    >
                      <span>{item.label}</span>
                      <svg
                        className={`${styles.mChevron} ${isSectionOpen ? styles.mChevronOpen : ""}`}
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </button>
                    <ul id={panelId} className={styles.mobileSub} hidden={!isSectionOpen}>
                      {item.children.map((child) => (
                        <li key={child.label}>
                          <NavLink item={child} onNavigate={close} />
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              }
              return (
                <li key={item.label}>
                  <NavLink item={item} onNavigate={close} />
                </li>
              );
            })}
          </ul>
          <a
            className="btn btn--primary btn--block"
            href={externalLinks.freeTrial}
            target="_blank"
            rel="noopener noreferrer"
            onClick={close}
          >
            Book a Free Trial
          </a>
        </nav>
      </div>
    </>
  );
}
