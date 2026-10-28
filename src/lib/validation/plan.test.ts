import { describe, expect, it } from 'vitest';
import { SEED_COURSES } from '../content/dto';
import { checkpointsReached, gradedWeekNumbers, validationPlanOf } from './plan';
import type { Course } from '../types';

const course = (id: string) => SEED_COURSES.find((c) => c.id === id)!;

/** R140 — the checkpoints follow the course's own shape; a course may set its own. */
describe('R140 — the validation plan', () => {
  it('every course has a recall checkpoint in a graded week and an apply checkpoint in the last graded week', () => {
    for (const c of SEED_COURSES) {
      const graded = gradedWeekNumbers(c);
      const plan = validationPlanOf(c);
      const recall = plan.find((p) => p.kind === 'recall')!;
      expect(recall, `${c.id} recall`).toBeDefined();
      expect(graded, `${c.id}: recall in a graded week`).toContain(recall.week);
      const last = graded[graded.length - 1];
      expect(plan.some((p) => p.week === last), `${c.id}: a checkpoint in the last graded week ${last}`).toBe(true);
      expect(plan.map((p) => p.week)).toEqual([...plan.map((p) => p.week)].sort((a, b) => a - b));
      expect(new Set(plan.map((p) => p.week)).size).toBe(plan.length);
    }
  });

  it('a four-week course recalls in week 3 and applies in week 4; CISSP recalls in week 4 and applies in week 6; Server+ extends on its advanced weeks', () => {
    expect(validationPlanOf(course('security-plus'))).toEqual([{ kind: 'recall', week: 3 }, { kind: 'apply', week: 4 }]);
    expect(validationPlanOf(course('cissp'))).toEqual([{ kind: 'recall', week: 4 }, { kind: 'apply', week: 6 }]);
    const srv = validationPlanOf(course('server-plus'));
    expect(srv.slice(0, 2)).toEqual([{ kind: 'recall', week: 3 }, { kind: 'apply', week: 4 }]);
    expect(srv.filter((p) => p.kind === 'extend').map((p) => p.week)).toEqual([5, 6, 7, 8]);
  });

  it('a course may set its own weeks, and only the checkpoints whose week has come are reached', () => {
    const own = { ...course('security-plus'), validation: { recall: 2, apply: 4, extend: [] } } as Course;
    expect(validationPlanOf(own)).toEqual([{ kind: 'recall', week: 2 }, { kind: 'apply', week: 4 }]);
    expect(checkpointsReached(own, 1)).toEqual([]);
    expect(checkpointsReached(own, 2)).toEqual([{ kind: 'recall', week: 2 }]);
    expect(checkpointsReached(own, 9)).toHaveLength(2);
    expect(validationPlanOf({ weeks: [], validation: undefined })).toEqual([]);
  });
});
