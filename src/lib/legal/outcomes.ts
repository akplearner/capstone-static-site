'use client';

import { getBrowserClient } from '../supabase/client';
import { isSupabaseConfigured } from '../supabase/config';
import { KEYS } from '../data/keys';
import { safeSetItem } from '../data/safeStorage';
import { notifyStore } from '../useClientStore';

/**
 * R110 — the consented learner outcome: where the work took a member, in
 * their own words, appended each time it is saved (the `learner_outcomes`
 * table of migration 0013; one list per device offline). The latest row is
 * the current answer. Instructors never read rows: `outcome_counts()` hands
 * them counts per status for a course, and nothing at all below five
 * members — the same floor `outcomeBands` applies offline.
 */
export const OUTCOME_STATUS = {
  studying: 'Still studying',
  searching: 'Searching for a role',
  placed: 'Placed in a role',
  promoted: 'Promoted in a role',
  'not-seeking': 'Not seeking a role',
} as const;

export type OutcomeStatus = keyof typeof OUTCOME_STATUS;
export const OUTCOME_STATUSES = Object.keys(OUTCOME_STATUS) as OutcomeStatus[];

export interface LearnerOutcome {
  recordedAt: number;
  status: OutcomeStatus;
  roleTitle: string;
  /** Visible to the member alone; never leaves the row. */
  employer: string;
  /** `YYYY-MM` or empty. */
  startedOn: string;
  /** courseId → used at work. */
  usedAtWork: Record<string, boolean>;
}

export interface OutcomeCount {
  status: OutcomeStatus;
  members: number;
}

/** Below this many answers nothing is counted, in SQL and here. */
export const OUTCOME_K = 5;

export function isOutcomeStatus(s: string): s is OutcomeStatus {
  return s in OUTCOME_STATUS;
}

export function latestOutcome(rows: LearnerOutcome[]): LearnerOutcome | null {
  let best: LearnerOutcome | null = null;
  for (const r of rows) if (!best || r.recordedAt > best.recordedAt) best = r;
  return best;
}

/** Counts per status over the latest answer of each member; empty below the floor. Pure. */
export function outcomeBands(latestRows: LearnerOutcome[]): OutcomeCount[] {
  if (latestRows.length < OUTCOME_K) return [];
  const counts = new Map<OutcomeStatus, number>();
  for (const r of latestRows) counts.set(r.status, (counts.get(r.status) ?? 0) + 1);
  return OUTCOME_STATUSES.filter((s) => counts.has(s)).map((status) => ({ status, members: counts.get(status) ?? 0 }));
}

export function localOutcomes(): LearnerOutcome[] {
  if (typeof window === 'undefined') return [];
  try {
    const rows = JSON.parse(localStorage.getItem(KEYS.outcomes) ?? '[]') as LearnerOutcome[];
    return Array.isArray(rows) ? rows.filter((r) => isOutcomeStatus(r.status)) : [];
  } catch {
    return [];
  }
}

export function saveLocalOutcome(o: Omit<LearnerOutcome, 'recordedAt'>): void {
  if (typeof window === 'undefined') return;
  const rows = localOutcomes();
  rows.push({ ...o, recordedAt: Date.now() });
  safeSetItem(KEYS.outcomes, JSON.stringify(rows));
  notifyStore();
}

export async function fetchCloudOutcomes(): Promise<LearnerOutcome[] | null> {
  const supabase = getBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from('learner_outcomes').select('recorded_at, status, role_title, employer, started_on, used_at_work');
  if (error) {
    console.error('outcome read failed', error.message);
    return null;
  }
  return (data ?? [])
    .filter((r) => isOutcomeStatus(String(r.status)))
    .map((r) => ({
      recordedAt: Date.parse(String(r.recorded_at ?? '')) || 0,
      status: String(r.status) as OutcomeStatus,
      roleTitle: String(r.role_title ?? ''),
      employer: String(r.employer ?? ''),
      startedOn: String(r.started_on ?? ''),
      usedAtWork: (r.used_at_work ?? {}) as Record<string, boolean>,
    }));
}

export async function saveOutcomeInCloud(userId: string, o: Omit<LearnerOutcome, 'recordedAt'>): Promise<boolean> {
  const supabase = getBrowserClient();
  if (!supabase) return false;
  const { error } = await supabase.from('learner_outcomes').insert({
    user_id: userId,
    status: o.status,
    role_title: o.roleTitle,
    employer: o.employer,
    started_on: o.startedOn,
    used_at_work: o.usedAtWork,
  });
  if (error) {
    console.error('outcome write failed', error.message);
    return false;
  }
  return true;
}

/**
 * Counts per status for a course: the SQL function in cloud mode (instructors
 * only; nothing below the floor), the device's own answers through the same
 * floor offline, where one device can never reach it.
 */
export async function fetchOutcomeCounts(courseId: string): Promise<OutcomeCount[]> {
  if (!isSupabaseConfigured()) return outcomeBands(latestOutcome(localOutcomes()) ? [latestOutcome(localOutcomes())!] : []);
  const supabase = getBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('outcome_counts', { c: courseId });
  if (error) {
    console.error('outcome counts read failed', error.message);
    return [];
  }
  return ((data ?? []) as { status: string; members: number }[]).filter((r) => isOutcomeStatus(r.status)).map((r) => ({ status: r.status as OutcomeStatus, members: Number(r.members) }));
}
