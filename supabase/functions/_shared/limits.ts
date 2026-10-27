// limits.ts — the per-member caps the functions enforce (R135). Pure, no imports.
//
// An open-sign-up platform has to assume one account will try to make a
// thousand links, a stamp a second, or an email per click. The database caps
// the tables it owns (0023); these are the caps on what the functions mint or
// send. Each is counted by the database and compared here, so the number sits
// in one place and a test can read it.

/** Live (unexpired, unrevoked) candidate links one member may hold. */
export const SHARE_MAX_LIVE = 20;
/** Verification stamps one member may be issued in an hour. */
export const STAMPS_PER_HOUR = 120;
/** Report emails one member may cause in a day. */
export const NOTIFY_PER_DAY = 10;

/** True when a count (as PostgREST returns it: possibly null) has reached the cap. */
export function overCap(count: number | null | undefined, cap: number): boolean {
  return (count ?? 0) >= cap;
}

/** ISO time `ms` before `nowMs`, for a `gt('created_at', …)` filter. */
export function sinceIso(nowMs: number, ms: number): string {
  return new Date(nowMs - ms).toISOString();
}

/** One line of untrusted text for an email: no line breaks, capped. */
export function emailLine(v: unknown, cap: number): string {
  return String(v ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .trim()
    .slice(0, cap);
}

/**
 * The report email, as a fixed template. It names who, what kind, which task
 * and course; it never carries the note — the dashboard has it, and an email
 * body that quotes a free-text field is a way to send arbitrary content.
 */
export function notifyMessage(p: { who: string; kind: string; task: string; course: string }): { subject: string; text: string } {
  const who = emailLine(p.who, 80) || 'A member';
  const kind = emailLine(p.kind, 20) || 'question';
  const task = emailLine(p.task, 80);
  const course = emailLine(p.course, 60);
  return {
    subject: `[${course}] task issue: ${kind} on ${task}`,
    text: `${who} reported a ${kind} issue on task ${task} (${course}).\n\nOpen the cohort dashboard to read the note and resolve it.`,
  };
}
