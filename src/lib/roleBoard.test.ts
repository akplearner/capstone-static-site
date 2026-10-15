import { describe, it, expect } from 'vitest';
import { ROLE_BOARD_COPY, fill, holdersLabel, roleBoard, roleCoverage, type BoardInput } from './roleBoard';
import { AZURE_FUNDAMENTALS } from './data/seed/azureCloud';
import { getProgressSteps } from './course-helpers';
import { calculateProgress } from './utils';
import type { Course, RosterEntry } from './types';

/**
 * R119 — the team's roles board. A role says who a task is FOR, never who may
 * do it; the board shows every role beside its holders on the member's own team
 * and the week's tasks, and marks a role nobody holds as open.
 */
const C = AZURE_FUNDAMENTALS; // arch, infra, dev, secops: one task each per week
const TEAM = '2026-09-t1';
const seat = (memberId: string, role: string, displayName: string, teamId = TEAM): RosterEntry => ({ memberId, teamId, role, displayName, cohort: '2026-09', joinedAt: 1 });
const me = { memberId: 'm-grace', teamId: TEAM, role: 'secops', displayName: 'Grace' };
const input = (over: Partial<BoardInput> = {}): BoardInput => ({
  course: C,
  week: 1,
  viewer: me,
  roster: [seat('m-grace', 'secops', 'Grace'), seat('m-ada', 'arch', 'Ada'), seat('m-ben', 'infra', 'Ben')],
  teamTaskStats: {},
  youTaskStats: {},
  teammates: {},
  ...over,
});
const roleOf = (board: ReturnType<typeof roleBoard>, id: string) => board.roles.find((r) => r.id === id)!;

describe('roleBoard', () => {
  it('puts the viewer’s own role first and the others in the course’s order', () => {
    const board = roleBoard(input());
    expect(board.roles.map((r) => r.id)).toEqual(['secops', 'arch', 'infra', 'dev']);
    expect(board.roles[0].you).toBe(true);
    expect(board.roles.slice(1).every((r) => !r.you)).toBe(true);
    // A viewer whose role is not in the course keeps the course's order whole.
    const gone = roleBoard(input({ viewer: { ...me, role: 'removed' } }));
    expect(gone.roles.map((r) => r.id)).toEqual(['arch', 'infra', 'dev', 'secops']);
    expect(gone.roles.some((r) => r.you)).toBe(false);
  });

  it('lists the holders from the viewer’s own team only, the viewer first, by display name', () => {
    const board = roleBoard(
      input({
        roster: [seat('m-grace', 'secops', 'Grace'), seat('m-zed', 'secops', 'Zed'), seat('m-amy', 'secops', 'Amy'), seat('m-other', 'arch', 'Elsewhere', '2026-09-t2'), seat('m-ada', 'arch', 'Ada')],
      })
    );
    expect(roleOf(board, 'secops').holders).toEqual([
      { name: 'Grace', you: true },
      { name: 'Amy', you: false },
      { name: 'Zed', you: false },
    ]);
    expect(roleOf(board, 'arch').holders).toEqual([{ name: 'Ada', you: false }]);
    expect(JSON.stringify(board)).not.toContain('Elsewhere');
  });

  it('marks a role nobody on the team holds as open, and a held role never', () => {
    const board = roleBoard(input());
    expect(roleOf(board, 'dev').vacant).toBe(true);
    expect(roleOf(board, 'dev').holders).toEqual([]);
    for (const id of ['secops', 'arch', 'infra']) expect(roleOf(board, id).vacant, id).toBe(false);
    // A role held only on ANOTHER team is open on this one.
    const other = roleBoard(input({ roster: [seat('m-grace', 'secops', 'Grace'), seat('m-dev', 'dev', 'Dev', '2026-09-t2')] }));
    expect(roleOf(other, 'dev').vacant).toBe(true);
  });

  it('never reads the viewer’s own role as open, even before the roster has caught up with them', () => {
    const board = roleBoard(input({ roster: [seat('m-ada', 'arch', 'Ada')] }));
    expect(roleOf(board, 'secops').vacant).toBe(false);
    expect(roleOf(board, 'secops').holders).toEqual([{ name: 'Grace', you: true }]);
    // A solo member sees every other role open: the whole team is them.
    const solo = roleBoard(input({ roster: [] }));
    expect(solo.roles.filter((r) => r.vacant).map((r) => r.id)).toEqual(['arch', 'infra', 'dev']);
  });

  it('names a teammate with no display name “Unnamed”, never an id', () => {
    const board = roleBoard(input({ roster: [seat('m-grace', 'secops', 'Grace'), seat('m-blank', 'arch', '  ')] }));
    expect(roleOf(board, 'arch').holders).toEqual([{ name: ROLE_BOARD_COPY.unnamed, you: false }]);
  });

  it('carries no member id anywhere in the board', () => {
    const roster = [seat('m-grace', 'secops', 'Grace'), seat('m-ada', 'arch', 'Ada'), seat('m-ben', 'infra', 'Ben')];
    const json = JSON.stringify(roleBoard(input({ roster })));
    for (const m of roster) expect(json, m.memberId).not.toContain(m.memberId);
  });

  it('gives each role its own tasks this week, with whose each is to the viewer', () => {
    const board = roleBoard(input());
    const mine = roleOf(board, 'secops').tasks;
    expect(mine.map((t) => t.task.id)).toEqual(['az-w1-secops']);
    expect(mine[0].ownership).toBe('yours');
    const archTask = roleOf(board, 'arch').tasks;
    expect(archTask.map((t) => t.task.id)).toEqual(['az-w1-arch']);
    expect(archTask[0].ownership).toBe('other');
    // Another week, other tasks.
    expect(roleOf(roleBoard(input({ week: 2 })), 'dev').tasks.map((t) => t.task.id)).toEqual(['az-w2-dev']);
    // A week with no tasks leaves every role on the board, empty.
    const empty = roleBoard(input({ week: 99 }));
    expect(empty.roles).toHaveLength(4);
    expect(empty.roles.every((r) => r.tasks.length === 0)).toBe(true);
  });

  it('puts a shared task in its own group, owned by everyone, and out of every role', () => {
    const shared: Course = { ...C, tasks: C.tasks.map((t) => (t.id === 'az-w1-arch' ? { ...t, shared: true } : t)) };
    const board = roleBoard(input({ course: shared }));
    expect(board.shared.map((t) => t.task.id)).toEqual(['az-w1-arch']);
    expect(board.shared[0].ownership).toBe('shared');
    expect(board.roles.flatMap((r) => r.tasks).map((t) => t.task.id)).not.toContain('az-w1-arch');
  });

  it('says where each task stands for the team, and what only the viewer did', () => {
    const arch = C.tasks.find((t) => t.id === 'az-w1-arch')!;
    const of = getProgressSteps(arch).length;
    const board = roleBoard(
      input({
        teamTaskStats: { 'az-w1-arch': 100, 'az-w1-infra': calculateProgress(1, getProgressSteps(C.tasks.find((t) => t.id === 'az-w1-infra')!).length) },
        youTaskStats: { 'az-w1-arch': 0 },
        teammates: { 'az-w1-arch': [{ memberId: 'm-ada', displayName: 'Ada', pct: 100 }, { memberId: 'm-grace', displayName: 'Grace', pct: 0 }] },
      })
    );
    const a = roleOf(board, 'arch').tasks[0].state;
    expect(a.kind).toBe('done');
    expect(a.team).toEqual({ done: of, of });
    expect(a.you.done).toBe(0);
    expect(a.doneBy).toEqual(['Ada']);
    expect(roleOf(board, 'infra').tasks[0].state.kind).toBe('in-progress');
    expect(roleOf(board, 'dev').tasks[0].state.kind).toBe('not-started');
  });
});

describe('holdersLabel and fill', () => {
  it('reads as a sentence, with the viewer as “you”', () => {
    expect(holdersLabel([])).toBe('');
    expect(holdersLabel([{ name: 'Grace', you: true }])).toBe('Held by you');
    expect(holdersLabel([{ name: 'Grace', you: true }, { name: 'Ada', you: false }])).toBe('Held by you and Ada');
    expect(holdersLabel([{ name: 'Ada', you: false }, { name: 'Ben', you: false }, { name: 'Cy', you: false }])).toBe('Held by Ada, Ben and Cy');
  });

  it('fills named slots and leaves an unknown one visible', () => {
    expect(fill(ROLE_BOARD_COPY.title, { unit: 'week' })).toBe('Your team’s roles this week');
    expect(fill('{a} and {b}', { a: 'x' })).toBe('x and {b}');
  });
});

describe('roleCoverage', () => {
  it('lists, per team, the roles nobody holds, in the course’s order', () => {
    const roster = [seat('a', 'arch', 'A', '2026-09-t2'), seat('b', 'infra', 'B', '2026-09-t2'), seat('c', 'secops', 'C', '2026-09-t1'), seat('d', 'dev', 'D', '2026-09-t1'), seat('e', 'arch', 'E', '2026-09-t1'), seat('f', 'infra', 'F', '2026-09-t1')];
    const cover = roleCoverage(C, roster);
    expect(cover.map((t) => t.teamId)).toEqual(['2026-09-t1', '2026-09-t2']);
    expect(cover[0]).toMatchObject({ members: 4, open: [] });
    expect(cover[1].members).toBe(2);
    expect(cover[1].open.map((r) => r.id)).toEqual(['dev', 'secops']);
  });

  it('is empty for an empty roster, and counts a removed role as no holder of any role', () => {
    expect(roleCoverage(C, [])).toEqual([]);
    const ghost = roleCoverage(C, [seat('g', 'removed', 'G')]);
    expect(ghost[0].open.map((r) => r.id)).toEqual(['arch', 'infra', 'dev', 'secops']);
  });
});
