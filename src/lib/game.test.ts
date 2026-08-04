import { describe, it, expect } from 'vitest';
import { CYSA_PLUS } from './data/seed/cysa';
import { getTasksByRole } from './course-helpers';
import { deriveCrewProgress } from './game';
import { deriveStoneStage, STONE_STAGES } from './quarry';

// The stone replaced XP deliberately: a point score can drift from the work, and
// students can't check it. Everything here is derived from completion data, so
// these tests are really asserting "the stone cannot flatter you".

describe('deriveStoneStage', () => {
  it('starts uncut and advances one stage per week cleared', () => {
    expect(deriveStoneStage(0, 4)).toBe(0);
    expect(deriveStoneStage(1, 4)).toBe(1);
    expect(deriveStoneStage(2, 4)).toBe(2);
    expect(deriveStoneStage(3, 4)).toBe(3);
  });

  it('reaches Master only when every week is cleared', () => {
    expect(deriveStoneStage(3, 4)).toBe(3);
    expect(deriveStoneStage(4, 4)).toBe(5);
  });

  it('never exceeds the defined stages, however many weeks are cleared', () => {
    for (const cleared of [0, 1, 5, 12, 99]) {
      const stage = deriveStoneStage(cleared, 4);
      expect(stage).toBeLessThanOrEqual(STONE_STAGES.length - 1);
      expect(stage).toBeGreaterThanOrEqual(0);
    }
  });

  it('stays uncut when there are no weeks to clear', () => {
    expect(deriveStoneStage(0, 0)).toBe(0);
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

  it('reaches Master Capstone only when every graded week is cleared', () => {
    const all: Record<number, number> = {};
    CYSA_PLUS.weeks.forEach((w) => {
      all[w.number] = 100;
    });
    const c = deriveCrewProgress(CYSA_PLUS, 'blue', all, {});
    expect(c.weeksCleared).toBe(c.weeksTotal);
    expect(c.stage).toBe(5);
    expect(c.milestones.find((m) => m.id === 'capstone')?.earned).toBe(true);
    expect(c.milestones.find((m) => m.id === 'halfway')?.earned).toBe(true);
  });

  it('awards nothing to a role with no tasks at all', () => {
    const c = deriveCrewProgress(CYSA_PLUS, 'nobody', { 1: 100, 2: 100 }, {});
    expect(c.weeksTotal).toBe(0);
    expect(c.stepsTotal).toBe(0);
    expect(c.milestones.find((m) => m.id === 'capstone')?.earned).toBe(false);
  });
});
