'use client';

import { getBrowserClient } from './supabase/client';
import { isMissingSchema } from './data/schemaErrors';

/**
 * R129 — a failure is shown to a person as a support code and the time, and kept in full on our side.
 *
 * Nothing technical belongs in front of a student or in their browser console: the database's error
 * code and message, which account it was and which page are written to `client_errors` (0020), where
 * only an admin reads them. The student is shown `E-7K2M9Q` and the time; support looks the code up.
 * Writing the log is best effort and never throws: a log that cannot be written (signed out, offline,
 * the table not created yet) still returns a code, so the message to the student is the same.
 */
export interface ErrorReport {
  /** Where it happened, short and stable: `agreements`. */
  area: string;
  /** What kind of fault, in the app's own terms: `session`, `permission`, `network`. */
  reason?: string;
  /** The database's own code and message, for the log only. */
  dbCode?: string;
  status?: number;
  message?: string;
  details?: string;
}

export interface SupportRef {
  code: string;
  /** Epoch milliseconds, as the student was shown it. */
  at: number;
}

// No 0/O/1/I/L: a code is read aloud and typed back.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function supportCode(): string {
  const pick = new Uint8Array(6);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(pick);
  else for (let i = 0; i < pick.length; i++) pick[i] = Math.floor(Math.random() * 256);
  return `E-${Array.from(pick, (b) => ALPHABET[b % ALPHABET.length]).join('')}`;
}

/** `2026-10-23 14:05 UTC`: one zone for everyone, so the code and the log agree. */
export function supportTime(at: number): string {
  const d = new Date(at);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`;
}

/** What a student reads: the code and the time, and where to take them. */
export const supportLine = (ref: SupportRef) => `Code ${ref.code} · ${supportTime(ref.at)}. Tell your instructor.`;

const cut = (v: string | undefined, max: number) => (v ? v.slice(0, max) : null);

/** Record the failure on our side and hand back what the student is shown. Never throws. */
export async function reportError(report: ErrorReport): Promise<SupportRef> {
  const ref: SupportRef = { code: supportCode(), at: Date.now() };
  try {
    const supabase = getBrowserClient();
    if (!supabase) return ref;
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) return ref;
    const { error } = await supabase.from('client_errors').insert({
      support_code: ref.code,
      client_at: new Date(ref.at).toJSON(),
      user_id: user.id,
      user_email: cut(user.email ?? undefined, 320),
      area: report.area.slice(0, 40),
      reason: cut(report.reason, 40),
      db_code: cut(report.dbCode, 40),
      http_status: report.status ?? null,
      message: cut(report.message, 2000),
      details: cut(report.details, 4000),
      path: typeof window === 'undefined' ? null : cut(window.location.pathname, 300),
      user_agent: typeof navigator === 'undefined' ? null : cut(navigator.userAgent, 400),
    });
    // A project that has not run 0020 yet answers "table not found": the student still has a code.
    if (error && !isMissingSchema(error)) return ref;
  } catch {
    /* the log is best effort */
  }
  return ref;
}
