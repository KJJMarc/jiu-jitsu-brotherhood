import ManageCookiesButton from "@/components/ManageCookiesButton";
import type { JjLegalPage } from "@/lib/jjb-legal/pages";
import styles from "@/components/pages.module.css";

export default function JjLegalPageView({ page }: { page: JjLegalPage }) {
  return (
    <>
      <section className="pagehero">
        <div className="container">
          <p className="eyebrow">Legal</p>
          <h1>{page.title}</h1>
          <p>Last updated: {page.lastUpdatedLabel}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className={`${styles.prose} ${styles.legal}`}>
            {page.slug === "cookies" ? (
              <div className={styles.cookieManage}>
                <ManageCookiesButton />
              </div>
            ) : null}
            <div dangerouslySetInnerHTML={{ __html: page.bodyHtml }} />
            {page.slug === "cookies" ? (
              <div className={styles.cookieManage}>
                <ManageCookiesButton />
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
