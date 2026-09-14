/**
 * The cohort calendar: a start date, and every week's due date derived from it.
 *
 * Seeds carry no dates on purpose — a course is reused every term. The cohort
 * (`YYYY-MM`, already the prefix of every team id) is what has a start date,
 * and week N is due seven days after week N-1. Week 0 — preparation — is due on
 * the start date itself.
 *
 * Everything here is local wall-clock arithmetic through `Date`'s local
 * getters, never the UTC string form (see localDate.ts for why). The one UTC value,
 * the iCalendar DTSTAMP, is built from the UTC getters directly.
 */
import { localDay } from './localDate';
import type { Course } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

/** `YYYY-MM-DD` plus `n` days, in local time (DST-safe: the constructor
 *  normalises a day overflow). */
export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(y, m - 1, d + n);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Whole days from `from` to `to` (both `YYYY-MM-DD`, local). */
export function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  const a = Date.UTC(fy, fm - 1, fd);
  const b = Date.UTC(ty, tm - 1, td);
  return Math.round((b - a) / 86_400_000);
}

/** The due date of week N for a cohort that starts on `startsOn`. */
export function weekDue(startsOn: string, week: number): string {
  return addDays(startsOn, 7 * Math.max(0, week));
}

export type DueTone = 'muted' | 'ok' | 'warn' | 'danger';

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Fri 20 Sep" for a `YYYY-MM-DD`. */
export function shortDate(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${WEEKDAY[date.getDay()]} ${d} ${MONTH[m - 1]}`;
}

/**
 * "due Fri 20 Sep · in 3 days", with a tone: `warn` inside three days,
 * `danger` once overdue, `ok` when done, else `muted`.
 */
export function dueLabel(due: string, today: string = localDay(), done = false): { text: string; tone: DueTone } {
  const n = daysBetween(today, due);
  const when = shortDate(due);
  if (done) return { text: `due ${when} · done`, tone: 'ok' };
  if (n < 0) return { text: `due ${when} · overdue by ${-n} day${n === -1 ? '' : 's'}`, tone: 'danger' };
  if (n === 0) return { text: `due ${when} · today`, tone: 'warn' };
  if (n <= 3) return { text: `due ${when} · in ${n} day${n === 1 ? '' : 's'}`, tone: 'warn' };
  return { text: `due ${when} · in ${n} days`, tone: 'muted' };
}

/** Every week with a date, for the rail, the status surface and the .ics. */
export function weekDueDates(course: Course, startsOn: string): { week: number; title: string; due: string; advanced: boolean }[] {
  return course.weeks.map((w) => ({ week: w.number, title: w.title, due: weekDue(startsOn, w.number), advanced: !!w.advanced }));
}

function icsEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

function dtstamp(now: Date): string {
  return `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
}

/**
 * An iCalendar file with one all-day event per week, importable into any
 * calendar. Hand-written: RFC 5545 needs CRLF, folded lines under 75 octets
 * (every line here is short), and a stable UID per event so re-importing
 * updates rather than duplicates.
 */
export function buildIcs({ course, cohort, startsOn, now = new Date() }: { course: Course; cohort: string; startsOn: string; now?: Date }): string {
  const stamp = dtstamp(now);
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Capstone Quarry//Cohort calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${icsEscape(`${course.title} · ${cohort}`)}`,
  ];
  for (const w of weekDueDates(course, startsOn)) {
    const day = w.due.replace(/-/g, '');
    const next = addDays(w.due, 1).replace(/-/g, '');
    lines.push(
      'BEGIN:VEVENT',
      `UID:${course.id}-${cohort}-w${w.week}@capstone-quarry`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${day}`,
      `DTEND;VALUE=DATE:${next}`,
      `SUMMARY:${icsEscape(`${course.title} — Week ${w.week} due: ${w.title}${w.advanced ? ' (advanced, optional)' : ''}`)}`,
      `DESCRIPTION:${icsEscape(`Week ${w.week} of the ${cohort} cohort. Open the course: /courses/${course.id}?tab=tasks&week=${w.week}`)}`,
      'END:VEVENT'
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}
