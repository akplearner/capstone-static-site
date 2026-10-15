// taskOwnership.ts — whose a task is, from where one member stands (R116).
//
// A role says who a task is FOR, never who may do it (R98): if the person
// holding it is away, anyone on the team takes it and the week is done for the
// team when the work is done. So a task is one of three things to a member:
// theirs, the whole team's, or another role's and open to them too. Pure: no
// clock, no store, so every surface that draws a task says the same thing.

import type { Task } from './types';

export type Ownership = 'yours' | 'shared' | 'other';

/** Theirs (`yours`), the whole team's (`shared`), or another role's (`other`, open to anyone). */
export function taskOwnership(task: Pick<Task, 'role' | 'shared'>, role: string): Ownership {
  if (task.shared) return 'shared';
  return task.role === role ? 'yours' : 'other';
}

/** The words for each kind, written once so a row, a header and a list never drift apart. */
export const OWNER_COPY = {
  yours: 'Your task',
  shared: 'Everyone',
  other: 'open to anyone',
  /** The sentence an opened task states, in full. `{role}` is the role's name. */
  explain: {
    yours: 'This task is for: {role} (that’s you).',
    shared: 'A shared task: the whole team does it together, and it counts for everyone.',
    other: 'This task is for: {role}{holder}. Open to you: anyone on the team can do it, and it counts for the team; say who did it in the document.',
  },
  /** The tooltip on another role's chip. */
  openTip: '{role}’s task: anyone on the team can do it, and it counts for the team.',
} as const;

/** Fill `{role}` (and `{holder}`: ", held by Ada", or nothing) in one of the sentences above. */
export function ownerSentence(template: string, roleName: string, holder?: string): string {
  return template.replace('{role}', roleName).replace('{holder}', holder ? `, held by ${holder}` : '');
}
