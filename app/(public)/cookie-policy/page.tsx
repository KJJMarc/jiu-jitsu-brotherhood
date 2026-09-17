import type { Metadata } from "next";
import { cookieConsent } from "@/lib/cookies";
import ManageCookiesButton from "@/components/ManageCookiesButton";
import SitePageView from "@/components/SitePageView";
import { getPublishedSitePage } from "@/lib/site-pages.server";
import styles from "@/components/pages.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const cms = await getPublishedSitePage("cookie-policy");
  return {
    title: cms?.seoTitle || cms?.title || "Cookie Policy",
    description:
      cms?.seoDescription ||
      "How Jiu Jitsu Brotherhood uses cookies and similar technologies, the categories of cookies we use, and how to manage your cookie preferences.",
    alternates: { canonical: "/cookie-policy" },
  };
}

function StaticCookiePolicyPage() {
  return (
    <>
      <section className="pagehero">
        <div className="container">
          <h1>Cookie Policy</h1>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className={`${styles.prose} ${styles.legal}`}>
            <p>
              This policy explains how Jiu Jitsu Brotherhood uses cookies and
              similar technologies on this website, and how you can manage your
              choices.
            </p>
            <p>
              Cookies are small text files stored on your device when you visit
              a website. Some cookies are necessary for the website to work
              properly. Others, such as analytics or marketing cookies, are only
              used with your consent.
            </p>
            <p>
              You can choose which categories of optional cookies you allow. You
              can change or withdraw your consent at any time using the{" "}
              <strong>Manage Cookie Preferences</strong> button below.
            </p>

            <div className={styles.cookieManage}>
              <ManageCookiesButton />
            </div>

            <h2>Categories of cookies we use</h2>

            <h3>Strictly necessary cookies (always on)</h3>
            <p>
              These cookies are required for the website to function correctly
              and may also be used to remember your cookie preferences. They
              cannot be switched off through our cookie controls and do not
              require your consent.
            </p>
            <table className={styles.cookieTable}>
              <thead>
                <tr>
                  <th>Cookie</th>
                  <th>Provider</th>
                  <th>Purpose</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>{cookieConsent.cookieName}</code>
                  </td>
                  <td>Jiu Jitsu Brotherhood</td>
                  <td>
                    Stores your cookie preferences so we can remember your
                    choices.
                  </td>
                  <td>6 months</td>
                </tr>
              </tbody>
            </table>

            <h3>Analytics cookies</h3>
            <p>
              Analytics cookies help us understand how visitors use our website,
              for example which pages are visited, how visitors arrive at the
              site and how they interact with its content. This information helps
              us understand website performance and improve the experience for
              visitors.
            </p>
            <p>Analytics cookies are only set when you give your consent.</p>
            <p>
              Details of the analytics cookies used, including their provider,
              purpose and duration, will be made available through our cookie
              preferences controls where applicable.
            </p>

            <h3>Marketing cookies</h3>
            <p>
              Marketing cookies and similar technologies may be used to help us
              understand the effectiveness of our advertising, measure
              conversions and improve the relevance and performance of our
              marketing campaigns.
            </p>
            <p>Marketing cookies are only set when you give your consent.</p>
            <p>
              Details of the marketing cookies and similar technologies used,
              including their provider, purpose and duration, will be made
              available through our cookie preferences controls where
              applicable.
            </p>

            <h2>Your cookie choices</h2>
            <p>
              You can choose whether to accept or reject optional cookies.
              Rejecting optional cookies will not prevent you from using the
              main features of the website.
            </p>
            <p>
              You can change or withdraw your consent at any time using the{" "}
              <strong>Manage Cookie Preferences</strong> button on this page.
            </p>
            <p>
              Changing your preferences will apply to future use of optional
              cookies. You can also remove cookies that have already been stored
              on your device through your browser settings.
            </p>

            <h2>Managing cookies in your browser</h2>
            <p>
              Most browsers allow you to view, block or delete cookies through
              their settings. You can also configure your browser to block some
              or all cookies.
            </p>
            <p>
              Please be aware that blocking strictly necessary cookies may
              affect how some parts of the website work.
            </p>

            <h2>Third-party services</h2>
            <p>
              We may use third-party services for purposes such as website
              analytics or measuring the effectiveness of our advertising. Where
              these services use cookies or similar technologies that require
              consent, they will only be activated after you have given the
              relevant consent.
            </p>
            <p>
              We will update information about the cookies and similar
              technologies used when new services are introduced or existing
              services change.
            </p>

            <h2>Changes to this policy</h2>
            <p>
              We may update this Cookie Policy from time to time, including when
              we introduce new technologies or change the services used on the
              website.
            </p>
            <p>
              If we make a change that materially affects the consent you have
              previously given, we may ask you to review your cookie choices
              again.
            </p>
            <p>
              <strong>Current policy version: {cookieConsent.version}</strong>
            </p>

            <h2>Contact</h2>
            <p>
              If you have any questions about our use of cookies or similar
              technologies, please use the contact details published on this
              site once they are available.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

export default async function CookiePolicyPage() {
  const cms = await getPublishedSitePage("cookie-policy");
  if (cms) return <SitePageView page={cms} />;
  return <StaticCookiePolicyPage />;
}
