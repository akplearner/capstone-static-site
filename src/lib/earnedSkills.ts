import type { Course } from './types';
import type { Dimension } from './docs/metricCatalogue';
import type { SkillLevel } from './docs/skillsCopy';
import type { ProfileRow, SkillProfile, SkillProfileInput } from './skillProfile';
import { levelRank } from './skillProfile';

/**
 * R125 — the earned-skills ledger: what a member has reached, kept apart from the progress it was
 * reached with.
 *
 * The profile is a projection over the ticks and the evidence the member has NOW, so "Reset my
 * progress" (the way to retake a course) emptied the record with it: ten skills earned on the first
 * run were gone the moment the second began. The rule the admin asked for is the opposite one: a
 * skill is earned the first time it is reached; a retake only adds what is missing and never
 * lowers, rewrites or re-dates what was earned.
 *
 * So the ledger holds one row per (dimension, id): the highest level reached, the course it was
 * first reached in, when it was first reached and when it got to its level, and the steps behind
 * that level (ids only: the words come from the course). It is only ever added to and raised.
 * `mergeLedger` is the one place that rule lives, and the database enforces the same rule
 * (0019), so no client can break it. `applyEarned` lays the ledger over a live profile: a row below
 * its earned level reads at that level, so the record, the board, the exports and the link copy all
 * see what was earned.
 *
 * It follows the rest of this layer: pure, no clock (callers pass the stamps), no store, no window.
 */

export type EarnedLevel = Exclude<SkillLevel, 'not-started'>;
export type EarnedDimension = Extract<Dimension, 'skills' | 'tools' | 'procedures' | 'tactics' | 'practices' | 'standards' | 'domains'>;

/** The dimensions a member earns: every row that is reached by doing the work. */
export const EARNED_DIMENSIONS: readonly EarnedDimension[] = ['skills', 'tools', 'procedures', 'tactics', 'practices', 'standards', 'domains'];

export interface EarnedVia {
  taskId: string;
  stepIds: string[];
}

export interface EarnedRow {
  dimension: EarnedDimension;
  id: string;
  /** The course the row was first reached in. Never changes. */
  courseId: string;
  /** The highest level reached. Only ever raised. */
  level: EarnedLevel;
  /** When it was first reached, at any level, in epoch milliseconds. Never changes. */
  firstAt: number;
  /** When it reached its current level. */
  levelAt: number;
  /** The steps behind the level when it was reached: ticked steps for "practised", verified steps above that. */
  via: EarnedVia[];
}

export const earnedKey = (r: Pick<EarnedRow, 'dimension' | 'id'>) => `${r.dimension}:${r.id}`;

const EARNED_LEVELS: readonly EarnedLevel[] = ['practised', 'verified', 'reviewed'];

/** A stored row, checked: anything that is not a well-formed row is dropped rather than trusted. */
export function asEarnedRow(raw: unknown): EarnedRow | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const dimension = EARNED_DIMENSIONS.find((d) => d === r.dimension);
  const level = EARNED_LEVELS.find((l) => l === r.level);
  if (!dimension || !level || typeof r.id !== 'string' || r.id === '' || typeof r.courseId !== 'string' || r.courseId === '') return null;
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  const via: EarnedVia[] = Array.isArray(r.via)
    ? r.via.flatMap((v): EarnedVia[] => {
        const o = (v ?? {}) as Record<string, unknown>;
        return typeof o.taskId === 'string' && Array.isArray(o.stepIds) ? [{ taskId: o.taskId, stepIds: o.stepIds.filter((x): x is string => typeof x === 'string') }] : [];
      })
    : [];
  return { dimension, id: r.id, courseId: r.courseId, level, firstAt: num(r.firstAt), levelAt: num(r.levelAt) || num(r.firstAt), via };
}

/** Facts the profile was built from, handed back so the steps behind a row can be named. */
export type EarnedFacts = Pick<SkillProfileInput, 'isStepDone' | 'evidence'>;

const key = (taskId: string, stepId: string) => `${taskId}::${stepId}`;

/** The steps behind a row at its level: the verified ones once it is verified, else the ones ticked. */
export function viaOf(row: Pick<ProfileRow, 'tasks' | 'level'>, course: Course, facts: EarnedFacts): EarnedVia[] {
  const out: EarnedVia[] = [];
  for (const taskId of row.tasks) {
    const task = course.tasks.find((t) => t.id === taskId);
    if (!task) continue;
    const required = task.steps.filter((s) => !s.optional);
    const verified = required.filter((s) => facts.evidence[key(taskId, s.id)]?.verified);
    const ticked = required.filter((s) => facts.isStepDone(taskId, s.id));
    const chosen = row.level !== 'practised' && verified.length > 0 ? verified : ticked;
    if (chosen.length > 0) out.push({ taskId, stepIds: chosen.map((s) => s.id) });
  }
  return out;
}

/** What the profile says is reached right now, as ledger rows stamped `now`: the candidates for `mergeLedger`. */
export function candidatesFrom(profile: SkillProfile, course: Course, facts: EarnedFacts, now: number): EarnedRow[] {
  const out: EarnedRow[] = [];
  for (const dimension of EARNED_DIMENSIONS) {
    for (const row of profile.rows[dimension]) {
      if (row.level === 'not-started') continue;
      out.push({ dimension, id: row.id, courseId: profile.courseId, level: row.level, firstAt: now, levelAt: now, via: viaOf(row, course, facts) });
    }
  }
  return out;
}

export interface Merged {
  /** The whole ledger after the merge: the same array when nothing changed. */
  ledger: readonly EarnedRow[];
  /** The rows that were added or raised, as they now stand: what a store has to write. */
  changed: EarnedRow[];
}

/**
 * The rule, in one place. A candidate for a row the ledger does not hold is ADDED. A candidate above
 * the held level RAISES it: the level, when it got there and the steps behind it change; the first
 * time it was reached and the course it was reached in do not. A candidate at or below the held level
 * changes nothing, whatever it says: a reset cannot lower a skill, and a retake cannot re-date one.
 */
export function mergeLedger(ledger: readonly EarnedRow[], candidates: readonly EarnedRow[]): Merged {
  const held = new Map(ledger.map((r) => [earnedKey(r), r] as const));
  const changed = new Map<string, EarnedRow>();
  for (const c of candidates) {
    const k = earnedKey(c);
    const have = held.get(k);
    if (!have) {
      held.set(k, c);
      changed.set(k, c);
    } else if (levelRank(c.level) > levelRank(have.level)) {
      const raised: EarnedRow = { ...have, level: c.level, levelAt: c.levelAt, via: c.via };
      held.set(k, raised);
      changed.set(k, raised);
    }
  }
  return { ledger: changed.size === 0 ? ledger : [...held.values()], changed: [...changed.values()] };
}

/**
 * The ledger laid over a live profile. A row of THIS course that reads below its earned level reads
 * at the earned level; a row at or above it is left alone, and so is every row with no entry. The
 * counters stay live (they say what the current run has done), and the gaps are the rows still not
 * reached once the ledger is counted. With nothing to raise it returns the same object.
 */
export function applyEarned(profile: SkillProfile, ledger: readonly EarnedRow[]): SkillProfile {
  const mine = new Map(ledger.filter((e) => e.courseId === profile.courseId).map((e) => [earnedKey(e), e] as const));
  if (mine.size === 0) return profile;
  let raised = false;
  const rows = { ...profile.rows };
  for (const dimension of EARNED_DIMENSIONS) {
    let touched = false;
    const next = profile.rows[dimension].map((row) => {
      const e = mine.get(earnedKey({ dimension, id: row.id }));
      if (!e || levelRank(e.level) <= levelRank(row.level)) return row;
      touched = true;
      return { ...row, level: e.level };
    });
    if (touched) {
      rows[dimension] = next;
      raised = true;
    }
  }
  if (!raised) return profile;
  const notStarted = (list: ProfileRow[]) => list.filter((r) => r.level === 'not-started');
  return { ...profile, rows, gaps: { domains: notStarted(rows.domains), skills: notStarted(rows.skills), sops: notStarted(rows.procedures) } };
}

/** The rows of this course the ledger holds above what the live profile reads: what was kept from an earlier run. */
export function keptFromEarlier(profile: SkillProfile, ledger: readonly EarnedRow[]): EarnedRow[] {
  const mine = ledger.filter((e) => e.courseId === profile.courseId);
  return mine.filter((e) => {
    const row = profile.rows[e.dimension].find((r) => r.id === e.id);
    return !row || levelRank(row.level) < levelRank(e.level);
  });
}
