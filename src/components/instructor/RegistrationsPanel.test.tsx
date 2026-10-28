import { describe, it, expect } from 'vitest';
import { render, within } from '@testing-library/react';
import { RegistrationsPanel } from './RegistrationsPanel';
import { AZURE_FUNDAMENTALS } from '@/lib/data/seed/azureCloud';
import { splitRoleName } from '@/lib/docs/roles';
import { ROLE_BOARD_COPY } from '@/lib/roleBoard';
import type { CohortData } from '@/lib/data/cohortLoader';
import type { RosterEntry } from '@/lib/types';

/**
 * R119 — above the registrations table, one line per team that has a role
 * nobody holds, so staff see a gap before a document waits on it.
 */
const C = AZURE_FUNDAMENTALS; // arch, infra, dev, secops
const seat = (memberId: string, role: string, teamId: string): RosterEntry => ({ memberId, teamId, role, displayName: memberId, cohort: '2026-09', joinedAt: 1 });
const data = (roster: RosterEntry[]): CohortData => ({
  mode: 'local',
  roster,
  completions: new Set(),
  evidence: {},
  docs: {},
  stuck: [],
  reviews: [],
  reports: [],
  profiles: {},
  submissions: [],
  peerReviews: [],
  assignedCounts: {},
  cohortDates: [],
  marks: {},
  flagEvents: {},
  peerReviewCounts: {},
  status: {},
  artifacts: {},
});
const fn = (id: string) => splitRoleName(C.roles.find((r) => r.id === id)!.name).fn;
const mount = (roster: RosterEntry[]) => render(<RegistrationsPanel course={C} data={data(roster)} onChanged={() => {}} />);

describe('RegistrationsPanel — open roles', () => {
  it('names, for each team with a gap, the roles nobody on it holds; a full team has no line', () => {
    const { container } = mount([
      seat('a', 'arch', '2026-09-t1'), seat('b', 'infra', '2026-09-t1'), seat('c', 'dev', '2026-09-t1'), seat('d', 'secops', '2026-09-t1'),
      seat('e', 'arch', '2026-09-t2'), seat('f', 'infra', '2026-09-t2'),
    ]);
    const lines = container.querySelectorAll('[data-team-open]');
    expect([...lines].map((l) => l.getAttribute('data-team-open'))).toEqual(['2026-09-t2']);
    const line = lines[0] as HTMLElement;
    expect(line).toHaveTextContent('Team 2');
    expect(line).toHaveTextContent(`2 members · ${ROLE_BOARD_COPY.coverage.open}:`);
    expect(within(line).getByText(fn('dev'))).toBeInTheDocument();
    expect(within(line).getByText(fn('secops'))).toBeInTheDocument();
    expect(within(line).queryByText(fn('arch'))).toBeNull();
    expect(container.textContent).not.toContain(ROLE_BOARD_COPY.coverage.none);
  });

  it('says every team holds every role when none has a gap', () => {
    const { container } = mount([seat('a', 'arch', '2026-09-t1'), seat('b', 'infra', '2026-09-t1'), seat('c', 'dev', '2026-09-t1'), seat('d', 'secops', '2026-09-t1')]);
    expect(container.querySelectorAll('[data-team-open]')).toHaveLength(0);
    expect(container.querySelector('[data-role-coverage]')).toHaveTextContent(ROLE_BOARD_COPY.coverage.none);
  });

  it('draws nothing about coverage for an empty roster, and says “1 member” for a team of one', () => {
    const empty = mount([]);
    expect(empty.container.querySelector('[data-role-coverage]')).toBeNull();
    empty.unmount();
    const solo = mount([seat('a', 'arch', '2026-09-t1')]);
    expect(solo.container.querySelector('[data-team-open]')).toHaveTextContent('1 member ·');
  });
});
