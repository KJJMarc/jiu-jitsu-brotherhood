/**
 * Timetable data is owned entirely by Dojo Director. We fetch the public,
 * read-only JSON API server-side (ISR, revalidate 300s) and render it natively.
 * Nothing is stored locally — Dojo Director remains the single source of truth.
 */

const API_BASE = "https://www.dojodirector.com/api/public/clubs";

export const timetableClubs = {
  adults: "kingston-jiu-jitsu",
  kids: "kingston-jiu-jitsu-kids",
} as const;

export type TimetableClass = {
  id: string;
  name: string;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  venue: string | null;
  programme: string | null;
  ageGroup: string | null;
  instructor: string | null;
};

export type TimetableDay = {
  day: string;
  dayOfWeek: number; // 1 = Monday … 6 = Saturday, 0 = Sunday
  classes: TimetableClass[];
};

export type TimetableVenue = {
  name: string;
  days: TimetableDay[]; // always 7 entries, Monday → Sunday
};

export type Timetable = {
  clubName: string;
  venues: TimetableVenue[]; // one section per venue, in API order
};

// Dojo Director uses the JS convention where Sunday = 0. We keep Monday first
// and place Sunday last for display.
const WEEK = [
  { dayOfWeek: 1, day: "Monday" },
  { dayOfWeek: 2, day: "Tuesday" },
  { dayOfWeek: 3, day: "Wednesday" },
  { dayOfWeek: 4, day: "Thursday" },
  { dayOfWeek: 5, day: "Friday" },
  { dayOfWeek: 6, day: "Saturday" },
  { dayOfWeek: 0, day: "Sunday" },
];

type ApiClass = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  venue: string | null;
  programme: string | null;
  ageGroup: string | null;
  instructor: string | null;
};
type ApiResponse = {
  club?: { name?: string };
  venues?: { name: string; days: { dayOfWeek: number; classes: ApiClass[] }[] }[];
};

/**
 * Fetch and normalise a club's timetable. Merges classes from all venues into a
 * Monday→Sunday structure, each day's classes sorted by start time. Returns
 * null if the API cannot be reached or returns an error (caller shows a
 * friendly fallback rather than crashing).
 */
export async function getTimetable(clubSlug: string): Promise<Timetable | null> {
  let data: ApiResponse;
  try {
    const res = await fetch(`${API_BASE}/${clubSlug}/timetable`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    data = (await res.json()) as ApiResponse;
  } catch {
    return null;
  }

  if (!data || !Array.isArray(data.venues)) return null;

  const venues: TimetableVenue[] = data.venues.map((venue) => {
    const byDay = new Map<number, TimetableClass[]>();
    for (const day of venue.days ?? []) {
      const list = byDay.get(day.dayOfWeek) ?? [];
      for (const c of day.classes ?? []) {
        list.push({
          id: c.id,
          name: c.name,
          startTime: c.startTime,
          endTime: c.endTime,
          venue: c.venue ?? venue.name ?? null,
          programme: c.programme ?? null,
          ageGroup: c.ageGroup ?? null,
          instructor: c.instructor ?? null,
        });
      }
      byDay.set(day.dayOfWeek, list);
    }
    const days: TimetableDay[] = WEEK.map(({ dayOfWeek, day }) => ({
      day,
      dayOfWeek,
      classes: (byDay.get(dayOfWeek) ?? []).sort((a, b) =>
        a.startTime.localeCompare(b.startTime),
      ),
    }));
    return { name: venue.name, days };
  });

  return { clubName: data.club?.name ?? "Kingston Jiu Jitsu", venues };
}

/** Format "HH:mm" (24h) as "6:00 pm" (UK style, lowercase am/pm). */
export function formatTime(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const period = h < 12 ? "am" : "pm";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour12} ${period}` : `${hour12}:${mStr} ${period}`;
}

/** "6 pm–7 pm" range for a class. */
export function formatRange(start: string, end: string): string {
  return `${formatTime(start)}–${formatTime(end)}`;
}
