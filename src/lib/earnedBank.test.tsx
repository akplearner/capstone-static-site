import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { skillProfile, skillPortfolio, type SkillProfile } from './skillProfile';
import { SEED_COURSES, courseDto } from './content/dto';
import { certOf, deliverablesOf, skillsOf } from './content/read';
import { getTasksByRole } from './course-helpers';
import { verifiableSteps } from './evidenceLedger';
import { EARNED_DIMENSIONS } from './earnedSkills';
import { bankProfile, useBankEarned, withEarned } from './earnedBank';
import { courseRepo, earnedRepo, evidenceRepo, progressRepo, stepNotesRepo } from './data';
import { localStorageEarnedRepo } from './data/localStorageEarnedRepo';
import { invalidateCourseCache } from './data/localStorageCourseRepo';
import type { Member } from './types';

/**
 * R125 — the whole story on this device, through the real repositories: a member works a course to
 * the end, the pages bank what they reach, "Reset my progress" empties the progress, and the record
 * is still there; a retake that does less changes nothing, and one that goes further adds only what
 * was missing. This is the admin's rule, end to end.
 */
const course = SEED_COURSES.find((c) => c.id === 'security-plus')!;
const doc = courseDto(course.id);
const role = course.roles[0].id;
const me: Member = { memberId: 'me', courseId: course.id, teamId: 't1', role, displayName: 'Grace', cohort: '2026-10' };
const tasks = getTasksByRole(course, role);

const work = (taskCount: number) => {
  for (const t of tasks.slice(0, taskCount)) {
    for (const s of t.steps.filter((x) => !x.optional)) progressRepo.setCompletion({ courseId: course.id, memberId: me.memberId, taskId: t.id, stepId: s.id, completedAt: 1 });
    for (const s of verifiableSteps(t.steps)) evidenceRepo.saveStep(me.memberId, { courseId: course.id, taskId: t.id, stepId: s.id, verified: true, method: 'verified-output', matchedTokens: 1, totalTokens: 1, attempts: 1, firstAttemptAt: 1, verifiedAt: 2 });
  }
};
/** The profile as a page builds it: live, from the repositories. */
function liveProfile(): SkillProfile {
  const keySet = progressRepo.getCompletionKeySet(course.id, me.memberId);
  return skillProfile({
    course, role, memberId: me.memberId,
    isStepDone: (t, s) => progressRepo.isStepComplete(course.id, me.memberId, t, s, keySet),
    evidence: evidenceRepo.getSteps(course.id, me.memberId),
    artifacts: [], registry: skillsOf(doc), cert: certOf(doc), deliverables: deliverablesOf(doc),
    team: { docs: {}, status: [], submissions: [], reviews: [], currentWeek: 4 }, own: { notes: [], reports: [] }, asOf: 3,
  });
}
const reached = (p: SkillProfile) => EARNED_DIMENSIONS.flatMap((d) => p.rows[d]).filter((r) => r.level !== 'not-started').length;
/** What a page does after a render: lay the ledger over the live profile, bank what it reaches. */
const showPage = () => {
  const shown = withEarned(liveProfile());
  bankProfile(shown);
  return shown;
};
/** "Reset my progress", as HomeTab does it. */
const reset = () => {
  progressRepo.resetCourse(course.id, me.memberId);
  evidenceRepo.resetCourse(course.id, me.memberId);
  stepNotesRepo.resetCourse(course.id, me.memberId);
};

beforeEach(() => {
  localStorage.clear();
  window.dispatchEvent(new StorageEvent('storage'));
  invalidateCourseCache();
  progressRepo.setContext(me);
});

describe('a retake never costs a skill (R125)', () => {
  it('works on the real repositories: earnedRepo is the device ledger offline, and the course is the seed', () => {
    expect(earnedRepo).toBe(localStorageEarnedRepo);
    expect(courseRepo.get(course.id)!.tasks.length).toBeGreaterThan(0);
  });

  it('banks what a first run reaches, and the record survives "Reset my progress"', () => {
    work(tasks.length);
    const first = showPage();
    expect(reached(first)).toBeGreaterThan(20);
    expect(earnedRepo.list(course.id)).toHaveLength(reached(first));

    reset();
    const live = liveProfile();
    expect(reached(live), 'the progress is gone').toBe(0);
    expect(progressRepo.getCompletionKeySet(course.id, me.memberId).size).toBe(0);
    expect(earnedRepo.list(course.id), 'the ledger is not progress: it is still there').toHaveLength(reached(first));

    const after = showPage();
    expect(reached(after)).toBe(reached(first));
    for (const d of EARNED_DIMENSIONS) expect(after.rows[d].map((r) => r.level), d).toEqual(first.rows[d].map((r) => r.level));
    expect(skillPortfolio([after])).toEqual(skillPortfolio([first]));
    expect(after.rows.skills.every((r) => r.verifiedSteps === 0), 'the counters are the retake’s own').toBe(true);
  });

  it('a retake that does less changes nothing, and does not re-date what was earned', () => {
    work(tasks.length);
    showPage();
    const before = earnedRepo.list(course.id).map((e) => ({ ...e }));
    reset();
    work(1);
    showPage();
    showPage();
    expect(earnedRepo.list(course.id)).toEqual(before);
  });

  it('a first run that stops early, then a retake that goes further, adds only what was missing and keeps every earlier date', () => {
    work(2);
    const early = showPage();
    const earlyRows = earnedRepo.list(course.id).map((e) => ({ ...e }));
    expect(earlyRows.length).toBe(reached(early));
    reset();
    vi.spyOn(Date, 'now').mockReturnValue(9_000_000);
    work(tasks.length);
    showPage();
    vi.restoreAllMocks();
    const now = earnedRepo.list(course.id);
    expect(now.length).toBeGreaterThan(earlyRows.length);
    for (const e of earlyRows) {
      const kept = now.find((x) => x.dimension === e.dimension && x.id === e.id)!;
      expect(kept.firstAt, `${e.id}: first reached stays`).toBe(e.firstAt);
      expect(kept.courseId).toBe(e.courseId);
    }
    for (const e of now.filter((x) => !earlyRows.some((y) => y.dimension === x.dimension && y.id === x.id))) expect(e.firstAt, 'a row added by the retake is dated by the retake').toBe(9_000_000);
  });

  it('banks nothing for a member with no course context, and for a course that does not exist', () => {
    localStorage.clear();
    bankProfile(liveProfile());
    expect(earnedRepo.list()).toEqual([]);
    progressRepo.setContext(me);
    bankProfile({ ...liveProfile(), courseId: 'no-such-course' });
    expect(earnedRepo.list()).toEqual([]);
  });
});

describe('useBankEarned', () => {
  it('banks what the profiles reach once, not on every render, and again when something new is reached', () => {
    const spy = vi.spyOn(earnedRepo, 'bank');
    work(2); // the first task is the setup week, which is not part of the profile
    const { rerender } = renderHook(({ p }) => useBankEarned([p]), { initialProps: { p: liveProfile() } });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(earnedRepo.list(course.id).length).toBeGreaterThan(0);
    rerender({ p: liveProfile() });
    rerender({ p: liveProfile() });
    expect(spy, 'the same reach is not banked again').toHaveBeenCalledTimes(1);
    work(5);
    rerender({ p: liveProfile() });
    expect(spy, 'a new reach is').toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });

  it('banks nothing before anything is reached', () => {
    const spy = vi.spyOn(earnedRepo, 'bank');
    renderHook(() => useBankEarned([liveProfile()]));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(earnedRepo.list()).toEqual([]);
    spy.mockRestore();
  });
});
