import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TasksTab } from './TasksTab';
import { AZURE_FUNDAMENTALS } from '@/lib/data/seed/azureCloud';
import { KEYS } from '@/lib/data/keys';
import type { Member } from '@/lib/types';

vi.mock('next/navigation', () => ({ useParams: () => ({ courseId: 'azure-fundamentals' }), useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/lib/useCourse', async (orig) => {
  const real = await orig<typeof import('@/lib/useCourse')>();
  const { courseDocument } = await import('@/lib/content/docs');
  return { ...real, useCourseDocument: () => courseDocument('azure-fundamentals')! };
});

/**
 * R98 — every task of the week is a row for every member, with its role on
 * it; the student's own is marked "Yours"; a teammate's opens in the runner.
 */
const C = AZURE_FUNDAMENTALS;
const me: Member = { memberId: 'm1', courseId: C.id, teamId: 't1', role: 'secops', displayName: 'Grace', cohort: '2026-09' };
const week1 = C.tasks.filter((t) => t.week === 1);
const stats = (pct: (id: string) => number) => Object.fromEntries(week1.map((t) => [t.id, pct(t.id)]));

function mount(over: Partial<Parameters<typeof TasksTab>[0]> = {}) {
  const expanded = new Set<string>();
  const props: Parameters<typeof TasksTab>[0] = {
    course: C,
    member: me,
    ownRole: C.roles.find((r) => r.id === 'secops'),
    unit: 'week',
    weekStats: {},
    taskStats: stats(() => 0),
    teamWeekStats: { 1: 0 },
    teamTaskStats: stats(() => 0),
    teamSteps: {},
    activeWeek: 1,
    effectiveWeek: 1,
    sortedWeeks: [...C.weeks].sort((a, b) => a.number - b.number),
    nextTask: week1.find((t) => t.role === 'secops'),
    nextIncompleteAfter: () => undefined,
    stuckByTask: {},
    teamTaskProgress: {},
    openReportsByTask: {},
    cohortCal: null,
    expanded,
    setExpanded: (f) => {
      const next = typeof f === 'function' ? f(expanded) : f;
      expanded.clear();
      next.forEach((id) => expanded.add(id));
    },
    toggleTask: (t) => (expanded.has(t.id) ? expanded.delete(t.id) : expanded.add(t.id)),
    moreOpen: null,
    setMoreOpen: () => {},
    deepStep: null,
    weekLocked: () => false,
    priorGateForWeek: () => undefined,
    pickWeek: () => {},
    openAndScrollWeek: () => {},
    goToTask: () => {},
    selectTab: () => {},
    onProgressChange: () => {},
    ...over,
  };
  return render(<TasksTab {...props} />);
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(KEYS.roster(C.id), JSON.stringify([{ ...me, joinedAt: 1 }, { memberId: 'ada', teamId: 't1', role: 'infra', displayName: 'Ada', cohort: '2026-09', joinedAt: 1 }]));
});

describe('TasksTab — every task open to every member', () => {
  it('shows four rows and four enabled objective cards, each saying whose it is', () => {
    const { container } = mount();
    // Each title twice: once on its objective card, once on its row.
    for (const t of week1) expect(screen.getAllByText(t.title).length).toBeGreaterThanOrEqual(2);
    const cards = screen.getAllByRole('button', { name: /task · ~/ });
    expect(cards).toHaveLength(4);
    expect(cards.filter((b) => (b as HTMLButtonElement).disabled)).toHaveLength(0);
    expect(container.textContent).toContain('Yours · Security & Ops');
    expect(container.textContent).toContain('Infrastructure Admin · 1 task');
    expect(screen.getAllByText('Yours').length).toBeGreaterThanOrEqual(2); // the row's badge, and the note that names it
    expect(screen.getAllByText('Infrastructure Admin').length).toBeGreaterThan(0);
    expect(container.textContent).toContain('Everyone can open and do any of them');
  });

  it('a teammate’s task opens in the runner, with checkboxes and a line saying whose it is', () => {
    const infra = week1.find((t) => t.role === 'infra')!;
    mount({ expanded: new Set([infra.id]) });
    expect(screen.getByLabelText('Step 1 done')).toBeInTheDocument();
    expect(screen.getByText(/This task is for:/).textContent).toContain('Infrastructure Admin');
    expect(screen.getByText(/anyone on the team can do it/)).toBeInTheDocument();
  });

  it('a task a teammate finished reads done, by name, and its card is done', () => {
    const infra = week1.find((t) => t.role === 'infra')!;
    const { container } = mount({
      teamTaskStats: stats((id) => (id === infra.id ? 100 : 0)),
      teamTaskProgress: { [infra.id]: [{ memberId: 'ada', displayName: 'Ada', role: 'infra', pct: 100 }, { memberId: 'm1', displayName: 'Grace', role: 'secops', pct: 0 }] },
    });
    expect(container.textContent).toContain('Done by Ada');
    expect(screen.getByLabelText('Done by Ada')).toBeInTheDocument();
    const card = screen.getAllByRole('button', { name: /task · ~/ }).find((b) => b.textContent?.includes(infra.title))!;
    expect(card.textContent).toContain('Infrastructure Admin · 1 task');
    expect(card.className).toContain('bg-ok-soft');
  });
});
