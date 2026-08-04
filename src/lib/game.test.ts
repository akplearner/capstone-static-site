import { describe, it, expect } from 'vitest';
import { CYSA_PLUS } from './data/seed/cysa';
import { getTasksByRole } from './course-helpers';
import { deriveGameState, levelForXp, XP_PER_STEP, XP_WEEK_CLEARED } from './game';

describe('levelForXp', () => {
  it('starts at level 1 with no XP', () => {
    const l = levelForXp(0);
    expect(l.level).toBe(1);
    expect(l.into).toBe(0);
    expect(l.percent).toBe(0);
    expect(l.atMax).toBe(false);
  });

  it('never goes backwards as XP increases', () => {
    let last = 0;
    for (let xp = 0; xp <= 3000; xp += 25) {
      const l = levelForXp(xp);
      expect(l.level).toBeGreaterThanOrEqual(last);
      last = l.level;
    }
  });

  it('reports progress within the current level, not overall', () => {
    const l = levelForXp(60); // level 1 spans 0-120
    expect(l.level).toBe(1);
    expect(l.into).toBe(60);
    expect(l.span).toBe(120);
    expect(l.percent).toBe(50);
  });

  it('caps cleanly at the top level instead of overflowing', () => {
    const l = levelForXp(999999);
    expect(l.atMax).toBe(true);
    expect(l.span).toBeNull();
    expect(l.percent).toBe(100);
  });
});

describe('deriveGameState', () => {
  const noProgress = { weeks: {} as Record<number, number>, tasks: {} as Record<string, number> };

  it('is all-zero and badge-free before anything is done', () => {
    const g = deriveGameState(CYSA_PLUS, 'blue', noProgress.weeks, noProgress.tasks);
    expect(g.xp).toBe(0);
    expect(g.level.level).toBe(1);
    expect(g.weeksCleared).toBe(0);
    expect(g.badges.every((b) => !b.earned)).toBe(true);
  });

  it('pays per completed step and a bonus for clearing a week', () => {
    const task = getTasksByRole(CYSA_PLUS, 'blue', 1)[0];
    const withOneTask = deriveGameState(CYSA_PLUS, 'blue', { 1: 100 }, { [task.id]: 100 });
    // Every step of that task, plus the week-cleared bonus.
    expect(withOneTask.xp).toBeGreaterThanOrEqual(XP_PER_STEP + XP_WEEK_CLEARED);
    expect(withOneTask.weeksCleared).toBe(1);
  });

  it('excludes the setup week from the weeks-cleared count', () => {
    // Week 0 at 100% must not count toward clearing the course.
    const g = deriveGameState(CYSA_PLUS, 'blue', { 0: 100 }, {});
    expect(g.weeksCleared).toBe(0);
    expect(g.weeksTotal).toBeGreaterThan(0);
    expect(g.badges.find((b) => b.id === 'capstone')?.earned).toBe(false);
  });

  it('awards the capstone badge only when every graded week is cleared', () => {
    const all: Record<number, number> = {};
    CYSA_PLUS.weeks.forEach((w) => {
      all[w.number] = 100;
    });
    const g = deriveGameState(CYSA_PLUS, 'blue', all, {});
    expect(g.weeksCleared).toBe(g.weeksTotal);
    expect(g.badges.find((b) => b.id === 'capstone')?.earned).toBe(true);
    expect(g.badges.find((b) => b.id === 'halfway')?.earned).toBe(true);
  });

  it('never awards a badge for a role with no tasks at all', () => {
    const g = deriveGameState(CYSA_PLUS, 'nobody', { 1: 100, 2: 100 }, {});
    expect(g.weeksTotal).toBe(0);
    expect(g.badges.find((b) => b.id === 'capstone')?.earned).toBe(false);
  });
});
