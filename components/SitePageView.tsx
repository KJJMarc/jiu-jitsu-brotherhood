import type { ReactNode } from "react";
import ManageCookiesButton from "@/components/ManageCookiesButton";
import { cookieConsent } from "@/lib/cookies";
import { sanitizeArticleHtml } from "@/lib/rich-text/html";
import {
  MANAGE_COOKIES_MARKER,
  PAYPAL_BUTTON_MARKER_RE,
} from "@/lib/site-pages";
import type { PublicSitePage } from "@/lib/site-pages";
import styles from "@/components/pages.module.css";

function NecessaryCookiesTable() {
  return (
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
          <td>Kingston Jiu Jitsu</td>
          <td>
            Stores your cookie preferences so we can remember your choices.
          </td>
          <td>6 months</td>
        </tr>
      </tbody>
    </table>
  );
}

function PayPalHostedButton({
  buttonId,
  label,
}: {
  buttonId: string;
  label: string;
}) {
  return (
    <form
      className={styles.paypalForm}
      action="https://www.paypal.com/cgi-bin/webscr"
      method="post"
      target="_top"
    >
      <input type="hidden" name="cmd" value="_s-xclick" />
      <input type="hidden" name="hosted_button_id" value={buttonId} />
      <input type="hidden" name="currency_code" value="GBP" />
      <button type="submit" className="btn btn--primary">
        {label}
      </button>
    </form>
  );
}

function CmsHtml({ html }: { html: string }) {
  if (!html) return null;

  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(PAYPAL_BUTTON_MARKER_RE.source, "g");
  let key = 0;

  while ((match = re.exec(html)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <div
          key={`html-${key++}`}
          dangerouslySetInnerHTML={{
            __html: html.slice(lastIndex, match.index),
          }}
        />,
      );
    }
    nodes.push(
      <PayPalHostedButton
        key={`paypal-${key++}`}
        buttonId={match[1]}
        label={match[2]}
      />,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < html.length) {
    nodes.push(
      <div
        key={`html-${key++}`}
        dangerouslySetInnerHTML={{ __html: html.slice(lastIndex) }}
      />,
    );
  }

  return <>{nodes}</>;
}

/** Public renderer for managed site pages — keeps existing page chrome. */
export default function SitePageView({ page }: { page: PublicSitePage }) {
  const safeHtml = sanitizeArticleHtml(page.bodyHtml);
  const parts = safeHtml.split(MANAGE_COOKIES_MARKER);
  const isCookie = page.template === "cookie";

  return (
    <>
      <section className="pagehero">
        <div className="container">
          {page.eyebrow ? <p className="eyebrow">{page.eyebrow}</p> : null}
          <h1>{page.title}</h1>
          {page.heroLead ? <p>{page.heroLead}</p> : null}
        </div>
      </section>

      <section
        className={
          page.template === "kids" ? styles.classContentSection : "section"
        }
      >
        <div className="container">
          <div
            className={`${styles.prose}${
              page.template === "legal" || isCookie ? ` ${styles.legal}` : ""
            }`}
          >
            {parts.length === 1 ? (
              <>
                <CmsHtml html={parts[0] ?? ""} />
                {isCookie ? (
                  <>
                    <div className={styles.cookieManage}>
                      <ManageCookiesButton />
                    </div>
                    <NecessaryCookiesTable />
                  </>
                ) : null}
              </>
            ) : (
              <>
                <CmsHtml html={parts[0] ?? ""} />
                <div className={styles.cookieManage}>
                  <ManageCookiesButton />
                </div>
                {isCookie ? <NecessaryCookiesTable /> : null}
                <CmsHtml html={parts[1] ?? ""} />
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
