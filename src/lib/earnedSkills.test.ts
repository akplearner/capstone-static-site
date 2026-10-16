import { describe, it, expect } from 'vitest';
import { skillProfile, skillPortfolio, type SkillProfile } from './skillProfile';
import { SEED_COURSES, courseDto } from './content/dto';
import { certOf, deliverablesOf, skillsOf } from './content/read';
import { getTasksByRole } from './course-helpers';
import { verifiableSteps } from './evidenceLedger';
import type { StepEvidence } from './data/types';
import { EARNED_DIMENSIONS, applyEarned, candidatesFrom, earnedKey, keptFromEarlier, mergeLedger, viaOf, type EarnedRow } from './earnedSkills';

/**
 * R125 — a skill earned stays earned. The profile is a projection over the progress a member has
 * now, so a reset emptied it; the ledger keeps the highest level reached, only ever adds and raises,
 * and is laid over the live profile. These tests run the real thing on a real course: a first run
 * to the end, a reset, and a retake that does less, the same, or more.
 */
const course = SEED_COURSES.find((c) => c.id === 'security-plus')!;
const doc = courseDto(course.id);
const role = course.roles[0].id;
const tasks = getTasksByRole(course, role);

type Run = { ticked: (taskId: string, stepId: string) => boolean; verified: Set<string> };
const keyOf = (t: string, s: string) => `${t}::${s}`;
const everything: Run = { ticked: () => true, verified: new Set(tasks.flatMap((t) => verifiableSteps(t.steps).map((s) => keyOf(t.id, s.id)))) };
const nothing: Run = { ticked: () => false, verified: new Set() };
/** The first n tasks, ticked and verified; the rest untouched. */
const firstTasks = (n: number): Run => {
  const ids = new Set(tasks.slice(0, n).map((t) => t.id));
  return { ticked: (t) => ids.has(t), verified: new Set(tasks.slice(0, n).flatMap((t) => verifiableSteps(t.steps).map((s) => keyOf(t.id, s.id)))) };
};
const factsOf = (run: Run) => ({
  isStepDone: run.ticked,
  evidence: Object.fromEntries([...run.verified].map((k) => [k, { courseId: course.id, taskId: k.split('::')[0], stepId: k.split('::')[1], verified: true, method: 'verified-output', matchedTokens: 1, totalTokens: 1, attempts: 1, firstAttemptAt: 1, verifiedAt: 2 } as StepEvidence])),
});
function profileOf(run: Run): SkillProfile {
  const f = factsOf(run);
  return skillProfile({ course, role, memberId: 'me', isStepDone: f.isStepDone, evidence: f.evidence, artifacts: [], registry: skillsOf(doc), cert: certOf(doc), deliverables: deliverablesOf(doc), team: { docs: {}, status: [], submissions: [], reviews: [], currentWeek: 4 }, own: { notes: [], reports: [] }, asOf: 3 });
}
const reached = (p: SkillProfile) => EARNED_DIMENSIONS.flatMap((d) => p.rows[d]).filter((r) => r.level !== 'not-started').length;
const row = (over: Partial<EarnedRow> = {}): EarnedRow => ({ dimension: 'skills', id: 'comp.x', courseId: 'c1', level: 'practised', firstAt: 100, levelAt: 100, via: [], ...over });

describe('mergeLedger — the rule', () => {
  it('adds a row the ledger does not hold, and says it changed', () => {
    const r = mergeLedger([], [row()]);
    expect(r.ledger).toEqual([row()]);
    expect(r.changed).toEqual([row()]);
  });

  it('raises a row to a higher level: the level, when it got there and the steps change; the first time and the course do not', () => {
    const held = row({ firstAt: 100, levelAt: 100, courseId: 'c1', via: [{ taskId: 't', stepIds: ['a'] }] });
    const r = mergeLedger([held], [row({ level: 'verified', firstAt: 900, levelAt: 900, courseId: 'c2', via: [{ taskId: 't', stepIds: ['b'] }] })]);
    expect(r.changed).toEqual([{ ...held, level: 'verified', levelAt: 900, via: [{ taskId: 't', stepIds: ['b'] }] }]);
    expect(r.changed[0].firstAt, 'first reached stays').toBe(100);
    expect(r.changed[0].courseId, 'where it was first reached stays').toBe('c1');
  });

  it('never lowers, rewrites or re-dates: a candidate at or below the held level changes nothing', () => {
    const held = row({ level: 'verified', firstAt: 100, levelAt: 200, via: [{ taskId: 't', stepIds: ['a'] }] });
    for (const level of ['practised', 'verified'] as const) {
      const r = mergeLedger([held], [row({ level, firstAt: 999, levelAt: 999, courseId: 'c9', via: [] })]);
      expect(r.changed, level).toEqual([]);
      expect(r.ledger, 'the same array').toEqual([held]);
    }
  });

  it('is idempotent, and the order of candidates does not matter to the levels', () => {
    const cands = [row({ id: 'a', level: 'verified' }), row({ id: 'a', level: 'practised' }), row({ id: 'b', level: 'reviewed' })];
    const once = mergeLedger([], cands);
    expect(mergeLedger(once.ledger, cands).changed).toEqual([]);
    const reversed = mergeLedger([], [...cands].reverse());
    const levels = (l: readonly EarnedRow[]) => Object.fromEntries(l.map((r) => [r.id, r.level]));
    expect(levels(reversed.ledger)).toEqual(levels(once.ledger));
    expect(levels(once.ledger)).toEqual({ a: 'verified', b: 'reviewed' });
  });

  it('keeps a row per dimension and id: the same id in two dimensions is two rows', () => {
    const r = mergeLedger([], [row({ dimension: 'skills', id: 'x' }), row({ dimension: 'tools', id: 'x' })]);
    expect(r.ledger.map(earnedKey).sort()).toEqual(['skills:x', 'tools:x']);
  });
});

describe('the ledger over a real course', () => {
  const first = profileOf(everything);
  const banked = mergeLedger([], candidatesFrom(first, course, factsOf(everything), 1000)).ledger as EarnedRow[];

  it('a first run to the end earns rows in every dimension the course has, each stamped with the steps behind it', () => {
    expect(reached(first)).toBeGreaterThan(20);
    expect(banked).toHaveLength(reached(first));
    for (const dimension of ['skills', 'tools', 'procedures', 'standards', 'domains'] as const) expect(banked.some((e) => e.dimension === dimension), dimension).toBe(true);
    const verified = banked.find((e) => e.level === 'verified' && e.dimension === 'skills')!;
    expect(verified.via.length).toBeGreaterThan(0);
    for (const v of verified.via) {
      const task = course.tasks.find((t) => t.id === v.taskId)!;
      expect(task, 'the task exists in the course').toBeTruthy();
      for (const stepId of v.stepIds) expect(task.steps.some((s) => s.id === stepId), `${v.taskId}/${stepId}`).toBe(true);
    }
    expect(banked.every((e) => e.firstAt === 1000 && e.levelAt === 1000 && e.courseId === course.id)).toBe(true);
  });

  it('after a reset the live profile has nothing, and the ledger gives the record back exactly as it was earned', () => {
    const reset = profileOf(nothing);
    expect(reached(reset)).toBe(0);
    const kept = applyEarned(reset, banked);
    expect(kept.rows.skills.map((r) => [r.id, r.level])).toEqual(first.rows.skills.map((r) => [r.id, r.level]));
    for (const d of EARNED_DIMENSIONS) expect(kept.rows[d].map((r) => r.level), d).toEqual(first.rows[d].map((r) => r.level));
    expect(skillPortfolio([kept])).toEqual(skillPortfolio([first]));
    expect(kept.gaps.skills, 'what was earned is no longer a gap').toEqual(first.gaps.skills);
    expect(keptFromEarlier(reset, banked)).toHaveLength(banked.length);
    expect(keptFromEarlier(first, banked), 'nothing is "kept" while the run itself holds it').toEqual([]);
  });

  it('the counters stay live: the retake says what the retake has done', () => {
    const kept = applyEarned(profileOf(nothing), banked);
    expect(kept.rows.skills.every((r) => r.tickedSteps === 0 && r.verifiedSteps === 0)).toBe(true);
    expect(kept.rows.skills.some((r) => r.level === 'verified')).toBe(true);
  });

  it('a retake that does less changes nothing in the ledger, however long it goes on', () => {
    const half = profileOf(firstTasks(1));
    const r = mergeLedger(banked, candidatesFrom(half, course, factsOf(firstTasks(1)), 5000));
    expect(r.changed).toEqual([]);
    expect(r.ledger).toBe(banked);
  });

  it('a retake that goes further adds only what was missing and raises what was practised, leaving the rest as it was', () => {
    const early = firstTasks(2);
    const earlyLedger = mergeLedger([], candidatesFrom(profileOf(early), course, factsOf(early), 1000)).ledger;
    const full = mergeLedger(earlyLedger, candidatesFrom(profileOf(everything), course, factsOf(everything), 9000));
    expect(full.changed.length).toBeGreaterThan(0);
    const before = new Map(earlyLedger.map((e) => [earnedKey(e), e]));
    for (const c of full.changed) {
      const was = before.get(earnedKey(c));
      if (was) {
        expect(c.firstAt, 'a raised row keeps when it was first reached').toBe(1000);
        expect(c.levelAt).toBe(9000);
      } else {
        expect(c.firstAt, 'a new row is dated now').toBe(9000);
      }
    }
    for (const e of earlyLedger) {
      const now = full.ledger.find((x) => earnedKey(x) === earnedKey(e))!;
      expect(now.firstAt, 'nothing earned was re-dated').toBe(1000);
      expect(['practised', 'verified', 'reviewed'].indexOf(now.level), 'nothing was lowered').toBeGreaterThanOrEqual(['practised', 'verified', 'reviewed'].indexOf(e.level));
    }
    expect(full.ledger).toHaveLength(reached(profileOf(everything)));
  });

  it('only this course’s rows are raised, and a live row above its entry is left alone', () => {
    const elsewhere = banked.map((e) => ({ ...e, courseId: 'another-course' }));
    const reset = profileOf(nothing);
    expect(applyEarned(reset, elsewhere), 'an entry for another course raises nothing here').toBe(reset);
    expect(applyEarned(reset, [])).toBe(reset);
    const above = applyEarned(first, banked.map((e) => ({ ...e, level: 'practised' as const })));
    expect(above, 'a live level above the earned one is not touched').toBe(first);
  });

  it('names the steps behind a row: verified ones once it is verified, ticked ones while it is practised', () => {
    const f = factsOf(everything);
    const verified = first.rows.skills.find((r) => r.level === 'verified')!;
    for (const v of viaOf(verified, course, f)) for (const s of v.stepIds) expect(f.evidence[`${v.taskId}::${s}`]?.verified, 'a verified row names verified steps').toBe(true);
    const ticks = firstTasks(1);
    const practised = viaOf({ tasks: tasks.slice(0, 1).map((t) => t.id), level: 'practised' }, course, factsOf(ticks));
    expect(practised.length).toBeGreaterThan(0);
    expect(viaOf({ tasks: ['no-such-task'], level: 'verified' }, course, f)).toEqual([]);
  });
});
