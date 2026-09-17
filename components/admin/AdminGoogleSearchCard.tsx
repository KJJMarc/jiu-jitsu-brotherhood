import styles from "@/app/admin/admin.module.css";
import { AdminSearchDetailsCollapse } from "@/components/admin/AdminSearchDetailsCollapse";
import {
  formatCompactNumber,
  formatCtr,
  formatPercentChange,
  formatPosition,
  shortenPageUrl,
  type SearchConsoleResult,
} from "@/lib/admin/search-console";

type Props = {
  search: SearchConsoleResult;
};

export function AdminGoogleSearchCard({ search }: Props) {
  if (search.status !== "ok") {
    return (
      <article className={styles.trafficCard} aria-label="Google Search">
        <div className={styles.trafficCardHeader}>
          <h2 className={styles.trafficCardTitle}>Google Search</h2>
          <p className={styles.trafficCardPeriod}>Last 28 days</p>
        </div>
        <p className={styles.trafficUnavailable}>
          Search Console data unavailable
        </p>
      </article>
    );
  }

  const { metrics } = search;
  const change = metrics.clicksChangePercent;
  const changeClass =
    change == null
      ? styles.trafficChangeNeutral
      : change > 0
        ? styles.trafficChangeUp
        : change < 0
          ? styles.trafficChangeDown
          : styles.trafficChangeNeutral;

  const periodTitle = `${metrics.startDate} → ${metrics.endDate}`;

  return (
    <article className={styles.trafficCard} aria-label="Google Search">
      <AdminSearchDetailsCollapse
        header={
          <div className={styles.trafficCardHeader}>
            <h2 className={styles.trafficCardTitle}>Google Search</h2>
            <p className={styles.trafficCardPeriod} title={periodTitle}>
              Last 28 days
            </p>
          </div>
        }
        summary={
          <div className={styles.trafficInlineMetrics}>
            <p className={styles.trafficInlineStat}>
              <span className={styles.trafficInlineValue}>
                {formatCompactNumber(metrics.clicks)}
              </span>
              <span className={styles.trafficInlineLabel}>Search clicks</span>
              <span className={`${styles.trafficInlineChange} ${changeClass}`}>
                {change == null ? "—" : formatPercentChange(change)}
              </span>
            </p>
            <p className={styles.trafficInlineStat}>
              <span className={styles.trafficInlineValue}>
                {formatCompactNumber(metrics.impressions)}
              </span>
              <span className={styles.trafficInlineLabel}>Impressions</span>
            </p>
            <p className={styles.trafficInlineStat}>
              <span className={styles.trafficInlineValue}>
                {formatCtr(metrics.ctr)}
              </span>
              <span className={styles.trafficInlineLabel}>Average CTR</span>
            </p>
            <p className={styles.trafficInlineStat}>
              <span className={styles.trafficInlineValue}>
                {formatPosition(metrics.position)}
              </span>
              <span className={styles.trafficInlineLabel}>Average position</span>
            </p>
          </div>
        }
      >
        <div className={styles.searchBreakdownGrid}>
          <div>
            <h3 className={styles.searchBreakdownTitle}>Top queries</h3>
            {metrics.topQueries.length === 0 ? (
              <p className={styles.searchEmpty}>No query data</p>
            ) : (
              <ul className={styles.searchBreakdownList}>
                {metrics.topQueries.map((row) => (
                  <li key={row.keys[0] ?? JSON.stringify(row)}>
                    <span
                      className={styles.searchBreakdownKey}
                      title={row.keys[0]}
                    >
                      {row.keys[0] || "—"}
                    </span>
                    <span className={styles.searchBreakdownMeta}>
                      {formatCompactNumber(row.clicks)} clicks ·{" "}
                      {formatCtr(row.ctr)} CTR
                      {typeof row.position === "number" &&
                      Number.isFinite(row.position) &&
                      row.position > 0
                        ? ` · pos ${formatPosition(row.position)}`
                        : null}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className={styles.searchBreakdownTitle}>Top pages</h3>
            {metrics.topPages.length === 0 ? (
              <p className={styles.searchEmpty}>No page data</p>
            ) : (
              <ul className={styles.searchBreakdownList}>
                {metrics.topPages.map((row) => {
                  const page = row.keys[0] ?? "";
                  return (
                    <li key={page || JSON.stringify(row)}>
                      <span className={styles.searchBreakdownKey} title={page}>
                        {shortenPageUrl(page) || "—"}
                      </span>
                      <span className={styles.searchBreakdownMeta}>
                        {formatCompactNumber(row.clicks)} clicks · pos{" "}
                        {formatPosition(row.position)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <p className={styles.trafficFooter}>
          <a
            href={metrics.searchConsoleUrl}
            className={styles.trafficGaLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            View in Search Console →
          </a>
        </p>
      </AdminSearchDetailsCollapse>
    </article>
  );
}
