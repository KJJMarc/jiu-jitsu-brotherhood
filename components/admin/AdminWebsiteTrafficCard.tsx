import styles from "@/app/admin/admin.module.css";
import {
  formatCompactNumber,
  formatPercentChange,
  type WebsiteTrafficResult,
} from "@/lib/admin/ga4-traffic";

type Props = {
  traffic: WebsiteTrafficResult;
};

export function AdminWebsiteTrafficCard({ traffic }: Props) {
  if (traffic.status !== "ok") {
    return (
      <article className={styles.trafficCard} aria-label="Website traffic">
        <div className={styles.trafficCardHeader}>
          <h2 className={styles.trafficCardTitle}>Website traffic</h2>
          <p className={styles.trafficCardPeriod}>Last 30 days</p>
        </div>
        <p className={styles.trafficUnavailable}>Traffic data unavailable</p>
      </article>
    );
  }

  const { metrics } = traffic;
  const change = metrics.visitorsChangePercent;
  const changeClass =
    change == null
      ? styles.trafficChangeNeutral
      : change > 0
        ? styles.trafficChangeUp
        : change < 0
          ? styles.trafficChangeDown
          : styles.trafficChangeNeutral;

  return (
    <article className={styles.trafficCard} aria-label="Website traffic">
      <div className={styles.trafficCardHeader}>
        <h2 className={styles.trafficCardTitle}>Website traffic</h2>
        <p className={styles.trafficCardPeriod}>Last 30 days</p>
      </div>

      <div className={styles.trafficInlineMetrics}>
        <p className={styles.trafficInlineStat}>
          <span className={styles.trafficInlineValue}>
            {formatCompactNumber(metrics.visitors30d)}
          </span>
          <span className={styles.trafficInlineLabel}>Visitors</span>
          <span className={`${styles.trafficInlineChange} ${changeClass}`}>
            {change == null ? "—" : formatPercentChange(change)}
          </span>
        </p>
        <p className={styles.trafficInlineStat}>
          <span className={styles.trafficInlineValue}>
            {formatCompactNumber(metrics.pageViews30d)}
          </span>
          <span className={styles.trafficInlineLabel}>Page views</span>
        </p>
        <p className={styles.trafficInlineStat}>
          <span className={styles.trafficInlineValue}>
            {formatCompactNumber(metrics.visitorsToday)}
          </span>
          <span className={styles.trafficInlineLabel}>Visitors today</span>
        </p>
      </div>

      <p className={styles.trafficFooter}>
        <a
          href={metrics.googleAnalyticsUrl}
          className={styles.trafficGaLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          View in Google Analytics →
        </a>
      </p>
    </article>
  );
}
