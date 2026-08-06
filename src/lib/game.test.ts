import { describe, it, expect } from 'vitest';
import { CYSA_PLUS } from './data/seed/cysa';
import { getTasksByRole } from './course-helpers';
import { deriveCrewProgress } from './game';
import { deriveStoneStage, STONE_STAGES } from './quarry';

// The stone replaced XP deliberately: a point score can drift from the work, and
// students can't check it. Everything here is derived from completion data, so
// these tests are really asserting "the stone cannot flatter you".

describe('deriveStoneStage', () => {
  // A four-week course whose weeks cut stages 1-4 in order.
  const arc = (n: number) => [undefined, 1, 2, 3, 4][n] as 1 | 2 | 3 | 4 | undefined;
  const run = (clearedWeeks: number[], capstoneFiled = false) =>
    deriveStoneStage({ clearedWeeks, totalWeeks: 4, capstoneFiled, stageOf: arc });

  it('starts uncut and advances one stage per week cleared', () => {
    expect(run([])).toBe(0);
    expect(run([1])).toBe(1);
    expect(run([1, 2])).toBe(2);
    expect(run([1, 2, 3])).toBe(3);
  });

  it('reaches Hardened on the last week — the stage the old count-based math skipped', () => {
    // Regression: deriving the stage from the *number* of cleared weeks jumped
    // straight to the final stage here, so stage 4 could never be cut on a 4-week course.
    expect(run([1, 2, 3, 4])).toBe(4);
    expect(STONE_STAGES[4].name).toBe('Hardened');
  });

  it('gives Master only when every week is cleared AND the capstone is filed', () => {
    expect(run([1, 2, 3, 4], false)).toBe(4);
    expect(run([1, 2, 3], true)).toBe(3);
    expect(run([1, 2, 3, 4], true)).toBe(5);
  });

  it('takes the highest cut, not the count — weeks can be cleared out of order', () => {
    expect(run([3])).toBe(3);
    expect(run([4, 1])).toBe(4);
  });

  it('never exceeds the defined stages, however many weeks are cleared', () => {
    for (const cleared of [[], [1], [1, 2, 3, 4], [1, 2, 3, 4, 9, 12]]) {
      const stage = run(cleared);
      expect(stage).toBeLessThanOrEqual(STONE_STAGES.length - 1);
      expect(stage).toBeGreaterThanOrEqual(0);
    }
  });

  it('falls back to week order for a course with no authored arc', () => {
    // Instructor-authored courses carry no `stage`; they must still advance.
    const noArc = (clearedWeeks: number[]) =>
      deriveStoneStage({ clearedWeeks, totalWeeks: 4, capstoneFiled: false });
    expect(noArc([1, 2])).toBe(2);
    expect(noArc([1, 2, 3, 4])).toBe(4);
  });

  it('stays uncut when there are no weeks to clear', () => {
    expect(deriveStoneStage({ clearedWeeks: [], totalWeeks: 0, capstoneFiled: true })).toBe(0);
  });
});

describe('deriveCrewProgress', () => {
  const none: Record<number, number> = {};

  it('is uncut with no milestones before any work', () => {
    const c = deriveCrewProgress(CYSA_PLUS, 'blue', none, {});
    expect(c.stage).toBe(0);
    expect(c.stepsDone).toBe(0);
    expect(c.weeksCleared).toBe(0);
    expect(c.milestones.every((m) => !m.earned)).toBe(true);
  });

  it('counts a finished task as an operational service', () => {
    const task = getTasksByRole(CYSA_PLUS, 'blue', 1)[0];
    const c = deriveCrewProgress(CYSA_PLUS, 'blue', none, { [task.id]: 100 });
    expect(c.stepsDone).toBe(task.steps.length);
    expect(c.milestones.find((m) => m.id === 'surveyed')?.earned).toBe(true);
    expect(c.milestones.find((m) => m.id === 'first-service')?.earned).toBe(true);
    // A task is not a week, so the stone has not been cut yet.
    expect(c.stage).toBe(0);
  });

  it('does not let the setup week cut the stone', () => {
    // Week 0 at 100% must not advance the capstone: it is opt-in lab building.
    const c = deriveCrewProgress(CYSA_PLUS, 'blue', { 0: 100 }, {});
    expect(c.weeksCleared).toBe(0);
    expect(c.stage).toBe(0);
    expect(c.milestones.find((m) => m.id === 'capstone')?.earned).toBe(false);
  });

  it('cuts every stage of the arc as the weeks clear', () => {
    // The point of authoring the arc: no stage is skipped on the way up.
    const seen = new Set<number>();
    const progress: Record<number, number> = {};
    for (const w of CYSA_PLUS.weeks.filter((x) => x.number > 0)) {
      progress[w.number] = 100;
      seen.add(deriveCrewProgress(CYSA_PLUS, 'blue', { ...progress }, {}).stage);
    }
    expect([...seen].sort()).toEqual([1, 2, 3, 4]);
  });

  it('stops at Secured until the capstone is filed, then reaches Master', () => {
    const all: Record<number, number> = {};
    CYSA_PLUS.weeks.forEach((w) => {
      all[w.number] = 100;
    });

    const unfiled = deriveCrewProgress(CYSA_PLUS, 'blue', all, {});
    expect(unfiled.weeksCleared).toBe(unfiled.weeksTotal);
    expect(unfiled.stage).toBe(4);
    expect(unfiled.milestones.find((m) => m.id === 'capstone')?.earned).toBe(false);

    const filed = deriveCrewProgress(CYSA_PLUS, 'blue', all, {}, true);
    expect(filed.stage).toBe(5);
    expect(filed.milestones.find((m) => m.id === 'capstone')?.earned).toBe(true);
    expect(filed.milestones.find((m) => m.id === 'halfway')?.earned).toBe(true);
  });

  it('awards nothing to a role with no tasks at all', () => {
    const c = deriveCrewProgress(CYSA_PLUS, 'nobody', { 1: 100, 2: 100 }, {});
    expect(c.weeksTotal).toBe(0);
    expect(c.stepsTotal).toBe(0);
    expect(c.milestones.find((m) => m.id === 'capstone')?.earned).toBe(false);
  });
});
