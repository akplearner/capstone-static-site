// roleBoard.ts — the team's roles, who holds each, and what each is doing this week (R119).
//
// A role says who a task is FOR, never who may do it (R98): the board lays every
// role of the course beside its holders on the member's OWN team and the week's
// tasks, each with whose it is to the viewer (R116) and the team's state (R118).
// A role nobody on the team holds is OPEN: any teammate may cover its documents
// (R117) and any member may take it. The instructor reads the same rule per team
// (`roleCoverage`). Pure: no clock, no store, rows in and rows out. Holders are
// display names and a "you" flag, never member ids.

import type { Course, RoleDef, RosterEntry, Task } from './types';
import { getWeekTasks } from './course-helpers';
import { isVacant } from './docs/lifecycle';
import { taskOwnership, type Ownership } from './taskOwnership';
import { doneByNames, taskState, type TaskState } from './taskState';

/** The words, written once so the board, its dialog and the instructor's line never drift apart. `{x}` is filled by `fill`. */
export const ROLE_BOARD_COPY = {
  title: 'Your team’s roles this {unit}',
  lede: 'Every task is open to the whole team. A role says who a task is for, not who may do it.',
  openTasks: 'Open them in Tasks →',
  shared: 'Everyone',
  you: 'You',
  openRole: 'Open role',
  heldBy: 'Held by',
  nobody: 'Nobody on the team holds this role.',
  cover: 'Any teammate can cover its documents.',
  take: 'Take this role',
  noTasks: 'No task of its own this {unit}.',
  confirmTitle: 'Take {role}?',
  confirmBody: 'Nobody on {team} holds {role}. Take it and you move from {from} to {role}. Steps you ticked stay ticked, and every task stays open to the whole team.',
  failed: 'Could not reach the server. Check the connection and try again.',
  full: 'That team is full.',
  taken: 'You now hold {role}.',
  unnamed: 'Unnamed',
  /** The instructor's line per team on the registrations panel. */
  coverage: { open: 'Open roles', none: 'Every team holds every role.' },
} as const;

/** Fill `{name}` placeholders in a sentence above. */
export function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (whole, k: string) => vars[k] ?? whole);
}

/** Who is looking: the member whose team and role the board is drawn from. */
export interface BoardViewer {
  memberId: string;
  teamId: string;
  role: string;
  displayName: string;
}

export interface BoardHolder {
  name: string;
  you: boolean;
}

export interface BoardTask {
  task: Task;
  /** Whose it is to the viewer: theirs, the whole team's, or another role's and open to them. */
  ownership: Ownership;
  /** The team's state, with the viewer's own count beside it. */
  state: TaskState;
}

export interface BoardRole {
  id: string;
  name: string;
  icon: string;
  color: string;
  /** The viewer holds it. */
  you: boolean;
  /** Everyone on the viewer's team who holds it, the viewer first. */
  holders: BoardHolder[];
  /** The team has members and none holds it: open to take, and its documents open to cover. */
  vacant: boolean;
  /** The role's own tasks this week, in course order. */
  tasks: BoardTask[];
}

export interface RoleBoardData {
  /** The week's shared build: everyone's, done for the team. */
  shared: BoardTask[];
  /** The viewer's role first, then the course's order. */
  roles: BoardRole[];
}

export interface BoardInput {
  course: Course;
  week: number;
  viewer: BoardViewer;
  /** The course's roster; only the viewer's team is read. */
  roster: readonly Pick<RosterEntry, 'memberId' | 'teamId' | 'role' | 'displayName'>[];
  /** The team's percent per task (done once anyone did it) and the viewer's own. */
  teamTaskStats: Record<string, number>;
  youTaskStats: Record<string, number>;
  /** Each teammate's standing per task, for "Done by Ada". */
  teammates: Record<string, readonly { memberId: string; displayName: string; pct: number }[]>;
}

const nameOf = (displayName: string) => displayName.trim() || ROLE_BOARD_COPY.unnamed;

/**
 * The board for one week: shared build first, then the viewer's own role, then
 * the rest in the course's order. A role with no task this week stays on it, so
 * the team can still see who holds it and take it when it is open.
 */
export function roleBoard({ course, week, viewer, roster, teamTaskStats, youTaskStats, teammates }: BoardInput): RoleBoardData {
  const team = roster.filter((r) => r.teamId === viewer.teamId).map((r) => ({ memberId: r.memberId, role: r.role, name: nameOf(r.displayName) }));
  // A roster that has not caught up with the viewer must never make their own role read as open.
  if (!team.some((m) => m.memberId === viewer.memberId)) team.push({ memberId: viewer.memberId, role: viewer.role, name: nameOf(viewer.displayName) });

  const tasks = getWeekTasks(course, week);
  const boardTask = (task: Task): BoardTask => ({
    task,
    ownership: taskOwnership(task, viewer.role),
    state: taskState(task, teamTaskStats[task.id] ?? 0, youTaskStats[task.id] ?? 0, doneByNames(youTaskStats[task.id] ?? 0, teammates[task.id] ?? [], viewer.memberId)),
  });
  const rolePart = (r: RoleDef): BoardRole => ({
    id: r.id,
    name: r.name,
    icon: r.icon,
    color: r.color,
    you: r.id === viewer.role,
    holders: team
      .filter((m) => m.role === r.id)
      .map((m) => ({ name: m.name, you: m.memberId === viewer.memberId }))
      .sort((a, b) => Number(b.you) - Number(a.you) || a.name.localeCompare(b.name)),
    vacant: isVacant(team, r.id),
    tasks: tasks.filter((t) => !t.shared && t.role === r.id).map(boardTask),
  });
  const own = course.roles.filter((r) => r.id === viewer.role);
  const rest = course.roles.filter((r) => r.id !== viewer.role);
  return { shared: tasks.filter((t) => t.shared).map(boardTask), roles: [...own, ...rest].map(rolePart) };
}

/** "Held by you", "Held by you and Ada", "Held by Ada, Ben and Cy"; empty when nobody holds it. */
export function holdersLabel(holders: readonly BoardHolder[]): string {
  const names = holders.map((h) => (h.you ? 'you' : h.name));
  if (names.length === 0) return '';
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  return `${ROLE_BOARD_COPY.heldBy} ${list}`;
}

export interface TeamCoverage {
  teamId: string;
  members: number;
  /** The course's roles no member of the team holds, in course order. */
  open: RoleDef[];
}

/** One entry per team on the roster, by team id: who is missing, so staff see a gap before a form waits on it. */
export function roleCoverage(course: Pick<Course, 'roles'>, roster: readonly Pick<RosterEntry, 'memberId' | 'teamId' | 'role'>[]): TeamCoverage[] {
  const teams = new Map<string, Pick<RosterEntry, 'memberId' | 'teamId' | 'role'>[]>();
  for (const m of roster) teams.set(m.teamId, [...(teams.get(m.teamId) ?? []), m]);
  return [...teams.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([teamId, members]) => ({ teamId, members: members.length, open: course.roles.filter((r) => isVacant(members, r.id)) }));
}
