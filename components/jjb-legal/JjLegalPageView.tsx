import ManageCookiesButton from "@/components/ManageCookiesButton";
import OptionalCancellationForm from "@/components/jjb-legal/OptionalCancellationForm";
import type { JjLegalPage } from "@/lib/jjb-legal/pages";
import styles from "@/components/pages.module.css";

export default function JjLegalPageView({ page }: { page: JjLegalPage }) {
  return (
    <>
      <section className="pagehero no-print">
        <div className="container">
          <p className="eyebrow">Legal</p>
          <h1>{page.title}</h1>
          <p>Last updated: {page.lastUpdatedLabel}</p>
        </div>
      </section>

      <section
        className={`section${
          page.showOptionalCancellationForm ? " legal-print-form-page" : ""
        }`}
      >
        <div className="container">
          <div className={`${styles.prose} ${styles.legal}`}>
            {page.slug === "cookies" ? (
              <div className={`${styles.cookieManage} no-print`}>
                <ManageCookiesButton />
              </div>
            ) : null}
            <div
              className={`${styles.legalBody} no-print-when-form`}
              dangerouslySetInnerHTML={{ __html: page.bodyHtml }}
            />
            {page.showOptionalCancellationForm ? (
              <OptionalCancellationForm />
            ) : null}
            {page.bodyHtmlAfterForm ? (
              <div
                className={`${styles.legalBody} no-print-when-form`}
                dangerouslySetInnerHTML={{ __html: page.bodyHtmlAfterForm }}
              />
            ) : null}
            {page.slug === "cookies" ? (
              <div className={`${styles.cookieManage} no-print`}>
                <ManageCookiesButton />
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
