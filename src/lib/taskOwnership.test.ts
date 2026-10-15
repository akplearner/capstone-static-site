import { describe, it, expect } from 'vitest';
import { OWNER_COPY, ownerSentence, taskOwnership } from './taskOwnership';
import { AZURE_FUNDAMENTALS } from './data/seed/azureCloud';
import { SERVER_PLUS } from './data/seed/serverPlus';

/**
 * R116 — a role says who a task is FOR, never who may do it. To one member a
 * task is theirs, the whole team's, or another role's and open to them too.
 */
describe('taskOwnership', () => {
  it('is yours for your role, everyone’s for a shared task, and another role’s otherwise', () => {
    expect(taskOwnership({ role: 'secops', shared: false }, 'secops')).toBe('yours');
    expect(taskOwnership({ role: 'infra', shared: false }, 'secops')).toBe('other');
    expect(taskOwnership({ role: 'infra', shared: true }, 'secops')).toBe('shared');
    expect(taskOwnership({ role: 'secops', shared: true }, 'secops')).toBe('shared');
    expect(taskOwnership({ role: 'infra' }, 'secops')).toBe('other');
  });

  it('classifies every task of a real role-split course, and every role sees at least one of each other role’s tasks as open', () => {
    const C = AZURE_FUNDAMENTALS;
    for (const role of C.roles) {
      const kinds = C.tasks.map((t) => taskOwnership(t, role.id));
      expect(kinds.filter((k) => k === 'yours').length, `${role.id} has tasks of its own`).toBeGreaterThan(0);
      expect(kinds.filter((k) => k === 'other').length, `${role.id} sees the others’ tasks`).toBeGreaterThan(0);
    }
  });

  it('a shared-track course says Everyone for the shared build', () => {
    const shared = SERVER_PLUS.tasks.filter((t) => t.shared);
    expect(shared.length).toBeGreaterThan(0);
    for (const role of SERVER_PLUS.roles) for (const t of shared) expect(taskOwnership(t, role.id)).toBe('shared');
  });
});

describe('the ownership words', () => {
  it('say once that another role’s task is open to anyone and counts for the team', () => {
    expect(OWNER_COPY.other).toBe('open to anyone');
    const s = ownerSentence(OWNER_COPY.explain.other, 'Platform Build (Infrastructure Admin)', 'Ada');
    expect(s).toContain('This task is for: Platform Build (Infrastructure Admin), held by Ada.');
    expect(s).toContain('anyone on the team can do it');
    expect(s).toContain('counts for the team');
    expect(ownerSentence(OWNER_COPY.explain.other, 'GRC')).toBe('This task is for: GRC. Open to you: anyone on the team can do it, and it counts for the team; say who did it in the document.');
    expect(ownerSentence(OWNER_COPY.explain.yours, 'GRC')).toBe('This task is for: GRC (that’s you).');
  });

  it('never mention a lock: a role is a label, not a door', () => {
    expect(JSON.stringify(OWNER_COPY).toLowerCase()).not.toMatch(/lock/);
  });
});
