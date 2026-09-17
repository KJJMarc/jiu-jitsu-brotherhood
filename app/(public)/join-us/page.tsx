import type { Metadata } from "next";
import { membershipGroups, externalLinks } from "@/lib/site";
import FinalCta from "@/components/home/FinalCta";
import styles from "@/components/pages.module.css";

export const metadata: Metadata = {
  title: "Join Us",
  description:
    "Membership options for Kingston Jiu Jitsu — adult, short-term and kids memberships. Start with a free trial, then set up your Direct Debit securely.",
  alternates: { canonical: "/join-us/" },
};

export default function JoinUsPage() {
  return (
    <>
      <section className="pagehero">
        <div className="container">
          <p className="eyebrow">Join the Team</p>
          <h1>Start your Kingston Jiu Jitsu membership</h1>
          <p>
            Choose the membership that best fits your training. New to the club?
            Start with a free trial class first — there&apos;s no obligation.
          </p>
          <div className={styles.ctaRow}>
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

      <section className="section">
        <div className="container">
          <p className={styles.note}>
            <strong>Before you continue:</strong> we use DFC FastDD to securely
            manage our Direct Debit memberships. After choosing your membership
            below, click through to FastDD and select the matching option on
            their page.
          </p>

          {membershipGroups.map((group) => (
            <div key={group.heading} className={styles.priceGroup}>
              <h2>{group.heading}</h2>
              <p>{group.intro}</p>
              <div className={styles.priceGrid}>
                {group.tiers.map((tier) => (
                  <div
                    key={tier.name}
                    className={`${styles.priceCard} ${tier.featured ? styles.featured : ""}`}
                  >
                    {tier.badge && <span className={styles.badge}>{tier.badge}</span>}
                    <p className={styles.priceName}>{tier.name}</p>
                    <p className={styles.priceAmount}>{tier.price}</p>
                    <p className={styles.priceTerm}>{tier.term}</p>
                    <ul>
                      {tier.points.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                    <a
                      className="btn btn--outline"
                      href={externalLinks.membership}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Set Up Membership
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <FinalCta />
    </>
  );
}
