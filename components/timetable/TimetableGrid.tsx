import { formatRange, type Timetable } from "@/lib/timetable";
import styles from "./timetable.module.css";

export default function TimetableGrid({ data }: { data: Timetable }) {
  return (
    <div className={styles.venues}>
      {data.venues.map((venue) => (
        <section key={venue.name} className={styles.venue}>
          <h2 className={styles.venueHead}>{venue.name}</h2>
          <div
            className={styles.grid}
            role="table"
            aria-label={`${venue.name} weekly timetable`}
          >
            {venue.days.map((day) => (
              <div key={day.dayOfWeek} className={styles.dayCol} role="rowgroup">
                <h3 className={styles.dayHead}>{day.day}</h3>
                {day.classes.length === 0 ? (
                  <p className={styles.empty}>No classes</p>
                ) : (
                  <ul className={styles.classList}>
                    {day.classes.map((c) => (
                      <li key={c.id} className={styles.classCard}>
                        <span className={styles.className}>{c.name}</span>
                        <span className={styles.classTime}>
                          {formatRange(c.startTime, c.endTime)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
