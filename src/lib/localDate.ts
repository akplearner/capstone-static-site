/**
 * Dates a student reads, in the timezone the student is in.
 *
 * `new Date().toISOString()` is UTC. Sliced to ten characters it is a date, and
 * for the four hours after 8pm on the US east coast — the hours a class actually
 * works in — it is TOMORROW'S date. That was shipping in three places:
 *
 *   - the Evidence Log row `EvidenceHasher` copies to the clipboard, on a course
 *     whose point is a defensible chain of custody
 *   - the `date` printed on every generated deliverable
 *   - the day buckets the streak metric counts, so an evening session split
 *     across UTC midnight read as two days and a late one as tomorrow
 *
 * All three want wall-clock time where the person is, which is what
 * `Date`'s local getters give and `toISOString` never does.
 *
 * The UTC form is still right for the wire — a `timestamptz` column, an export's
 * `generatedAt` — and those call `toISOString` directly. The rule is about who
 * reads it, not about which format is better.
 */

const pad = (n: number) => String(n).padStart(2, '0');

/** `YYYY-MM-DD` in local time. Defaults to now. */
export function localDay(ms: number = Date.now()): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** `YYYY-MM-DD HH:MM` in local time, to the minute. Defaults to now. */
export function localStamp(ms: number = Date.now()): string {
  const d = new Date(ms);
  return `${localDay(ms)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
