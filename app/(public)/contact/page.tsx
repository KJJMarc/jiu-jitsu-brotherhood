import type { Metadata } from "next";
import { site, venues, externalLinks } from "@/lib/site";
import { getActiveSocialLinks } from "@/lib/site-settings";
import { getSiteSettings } from "@/lib/site-settings.server";
import FinalCta from "@/components/home/FinalCta";
import styles from "@/components/pages.module.css";

export const metadata: Metadata = {
  title: "Get in Touch",
  description:
    "Get in touch with Kingston Jiu Jitsu. Call, email or message us on social media, or book your free trial class online.",
  alternates: { canonical: "/contact/" },
};

const icons = {
  phone:
    "M6.62 10.79a15.15 15.15 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.32.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.24 1.02z",
  mail:
    "M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2m0 4-8 5-8-5V6l8 5 8-5z",
  whatsapp:
    "M19.05 4.94A9.82 9.82 0 0 0 12.04 2C6.58 2 2.14 6.44 2.14 11.9c0 1.75.46 3.45 1.32 4.95L2 22l5.28-1.38a9.86 9.86 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.64-1.03-5.13-2.89-7zM12.04 20.2h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.13.82.84-3.05-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23a8.2 8.2 0 0 1 5.82 2.42 8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.69 8.24-8.23 8.24zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.22.25-.86.84-.86 2.05s.88 2.38 1 2.54c.12.16 1.73 2.64 4.19 3.7.59.25 1.04.4 1.4.52.59.19 1.12.16 1.54.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29z",
  calendar:
    "M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1M5 8v11h14V8z",
};

const actions = [
  {
    label: `Call ${site.phone}`,
    sub: "Speak to the team",
    href: site.phoneHref,
    icon: icons.phone,
  },
  {
    label: "Send an Email",
    sub: site.email,
    href: `mailto:${site.email}`,
    icon: icons.mail,
  },
  {
    label: "WhatsApp Message",
    sub: "Message us on WhatsApp",
    href: "https://wa.me/447584131335",
    external: true,
    icon: icons.whatsapp,
  },
  {
    label: "Book a Free Trial",
    sub: "Your first class is free",
    href: externalLinks.freeTrial,
    external: true,
    icon: icons.calendar,
  },
];

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const socials = getActiveSocialLinks(settings);

  return (
    <>
      <section className="pagehero">
        <div className="container">
          <p className="eyebrow">Get in touch</p>
          <h1>We&apos;d love to hear from you</h1>
          <p>
            To book a free trial class, or for any other enquiries, reach out and
            we&apos;ll get back to you as quickly as possible.
          </p>
        </div>
      </section>

      <section className="section">
        <div className={`container ${styles.contactGrid}`}>
          <div>
            <div className={styles.actionGrid}>
              {actions.map((a) => (
                <a
                  key={a.label}
                  className={styles.actionCard}
                  href={a.href}
                  {...(a.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  <span className={styles.actionIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                      <path d={a.icon} fill="currentColor" />
                    </svg>
                  </span>
                  <span className={styles.actionText}>
                    <span className={styles.actionLabel}>{a.label}</span>
                    <span className={styles.actionSub}>{a.sub}</span>
                  </span>
                </a>
              ))}
            </div>

            {socials.length > 0 ? (
              <div className={styles.followBlock}>
                <span>Follow us</span>
                <div className={styles.socialRow}>
                  {socials.map((s) => (
                    <a
                      key={s.key}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                        <path d={s.icon} fill="currentColor" />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <ul className={styles.venueGrid}>
            {venues.map((v) => (
              <li key={v.name} className={styles.card}>
                <h3>{v.name}</h3>
                <address>
                  {v.street}, {v.locality}, {v.postcode}
                </address>
                <a
                  className={styles.link}
                  href={v.maps}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get directions →
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
