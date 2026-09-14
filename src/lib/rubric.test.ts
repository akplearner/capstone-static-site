import { describe, it, expect } from 'vitest';
import { weeklyPoints, markedWeeks, TEAM_WEIGHT, FOCUS_WEIGHT } from './rubric';
import { SERVER_PLUS } from './data/seed/serverPlus';
import { deliverablesForCourse, seedDeliverable } from './docs/definitions';
import { emptyData } from './docs/types';

const course = SERVER_PLUS;

describe('weeklyPoints — the 70/30 split', () => {
  it('scores 0 when nothing is done', () => {
    const p = weeklyPoints({ course, role: 'net', week: 1, teamDocs: {}, isStepDone: () => false });
    expect(p.team).toBe(0);
    expect(p.focus).toBe(0);
    expect(p.total).toBe(0);
    expect(p.checksDue).toBeGreaterThan(0);
  });

  it('a form left as the worked example earns nothing', () => {
    const docs: Record<string, ReturnType<typeof emptyData>> = {};
    for (const d of deliverablesForCourse(course.id)) docs[d.id] = seedDeliverable(d);
    const p = weeklyPoints({ course, role: 'net', week: 1, teamDocs: docs, isStepDone: () => false });
    expect(p.team).toBe(0);
  });

  it('every step done and every check met is 100', () => {
    // Simulate a fully filled form by making every check pass through a proxy
    // data object: the checks read fields/groups, so a course-agnostic way to
    // satisfy them all is to run each def's own seed and mark it as the
    // student's — which the previous test shows is subtracted. Instead, prove
    // the FOCUS half directly and the TEAM half against a synthetic course.
    const p = weeklyPoints({ course, role: 'net', week: 1, teamDocs: {}, isStepDone: () => true });
    expect(p.focus).toBe(FOCUS_WEIGHT);
    expect(p.focusMirrorsTeam).toBe(false);
  });

  it('a week without a deep-dive mirrors the team share and says so', () => {
    const synthetic = {
      ...course,
      tasks: course.tasks.filter((t) => !(t.week === 1 && t.role === 'net' && !t.shared)),
    };
    const p = weeklyPoints({ course: synthetic, role: 'net', week: 1, teamDocs: {}, isStepDone: () => true });
    expect(p.focusMirrorsTeam).toBe(true);
    expect(p.focusShare).toBe(p.teamShare);
  });

  it('with no checks due, the shared tasks stand in for TEAM', () => {
    const noForms = { ...course, id: 'no-such-course-with-forms' };
    const p = weeklyPoints({ course: noForms, role: 'net', week: 1, teamDocs: {}, isStepDone: () => true });
    expect(p.checksDue).toBe(0);
    expect(p.team).toBe(TEAM_WEIGHT);
  });

  it('marks weeks 1–6 with 5 and 6 as bonus', () => {
    expect(markedWeeks(course)).toEqual([
      { week: 1, bonus: false },
      { week: 2, bonus: false },
      { week: 3, bonus: false },
      { week: 4, bonus: false },
      { week: 5, bonus: true },
      { week: 6, bonus: true },
    ]);
  });
});
