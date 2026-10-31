import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TasksTab } from './TasksTab';
import { AZURE_FUNDAMENTALS } from '@/lib/data/seed/azureCloud';
import { KEYS } from '@/lib/data/keys';
import type { Member } from '@/lib/types';
import { weekSummary } from '@/lib/course-helpers';

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
    selectTask: vi.fn(),
    moreOpen: null,
    setMoreOpen: () => {},
    deepStep: null,
    gateNote: () => null,
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
  it('shows the role rows and objective cards, each saying whose it is', () => {
    const { container } = mount();
    // Each role task's title twice: once on its objective card, once on its row (R143: the AI extension is a fifth, optional row).
    for (const t of week1.filter((t) => !t.track)) expect(screen.getAllByText(t.title).length).toBeGreaterThanOrEqual(2);
    const cards = screen.getAllByRole('button', { name: /tasks? · ~/ });
    expect(cards).toHaveLength(4);
    expect(cards.filter((b) => (b as HTMLButtonElement).disabled)).toHaveLength(0);
    expect(container.textContent).toContain('Yours · Security Operations (SecOps Engineer)');
    expect(container.textContent).toContain('Platform Build (Infrastructure Admin) · 1 task');
    expect(screen.getAllByText('Your task').length).toBeGreaterThanOrEqual(1); // the row's badge (R100: the rule moved into the objectives' how-to-read)
    expect(screen.getAllByText('Platform Build · open to anyone').length).toBeGreaterThan(0); // R116: another role's row says it is open
    expect(container.textContent).toContain('Everyone can open and do any of them');
  });

  it('R99: the week’s picture is on the tab, pinned to the week on screen, with its caption', async () => {
    const { weekVisualsOf } = await import('@/lib/content/read');
    const { courseDocument } = await import('@/lib/content/docs');
    const v = weekVisualsOf(courseDocument('azure-fundamentals')!).find((x) => x.week === 2)!;
    mount({ effectiveWeek: 2, teamWeekStats: { 1: 100, 2: 0 } });
    expect(screen.getAllByRole('heading', { name: 'What you build this week' })).toHaveLength(1); // R100: once, not twice
    // R157: every course opens on its network picture; the build picture is the second option of the switch.
    expect(document.querySelector('[data-net-root]')).not.toBeNull();
    fireEvent.click(document.querySelector('[data-picture-pick="build"]')!);
    expect(screen.getByRole('img', { name: /week 2/ })).toBeInTheDocument();
    expect(screen.getByText(v.caption)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('a teammate’s task opens in the runner, with checkboxes and a line saying whose it is', () => {
    const infra = week1.find((t) => t.role === 'infra')!;
    mount({ expanded: new Set([infra.id]) });
    expect(screen.getByLabelText('Step 1 done')).toBeInTheDocument();
    expect(screen.getByText(/This task is for:/).textContent).toContain('Platform Build (Infrastructure Admin)');
    expect(screen.getByText(/anyone on the team can do it/)).toBeInTheDocument();
  });

  it('a task a teammate finished reads done, by name, and its card is done', () => {
    const infra = week1.find((t) => t.role === 'infra')!;
    const { container } = mount({
      teamTaskStats: stats((id) => (id === infra.id ? 100 : 0)),
      teamTaskProgress: { [infra.id]: [{ memberId: 'ada', displayName: 'Ada', role: 'infra', pct: 100 }, { memberId: 'm1', displayName: 'Grace', role: 'secops', pct: 0 }] },
    });
    expect(container.textContent).toContain('Done by Ada');
    expect(screen.getByText('Done by Ada')).toBeInTheDocument();
    expect(container.querySelector('[data-task-you]')?.textContent).toMatch(/^You: 0 of \d+ steps$/); // R118: the member's own count sits beside the team's
    const card = screen.getAllByRole('button', { name: /tasks? · ~/ }).find((b) => b.textContent?.includes(infra.title))!;
    expect(card.textContent).toContain('Platform Build (Infrastructure Admin) · 1 task');
    expect(card.className).toContain('bg-ok-soft');
  });

  it('R100: an objective that is its one task is named once, on the row', () => {
    const { container } = mount();
    const single = weekSummary(C, 'secops', 1).objectives.filter((o) => o.tasks.length === 1 && o.tasks[0].title === o.label);
    for (const o of single) {
      const section = container.querySelector(`#objective-${o.id}`)!;
      expect(section.querySelector('h3'), `${o.label}: no duplicate heading`).toBeNull();
    }
  });
});

describe('TasksTab — R100 split view and focus mode', () => {
  // The harness mocks matchMedia with a plain vi.fn, so swap the function and put it back by hand.
  const prevMedia = window.matchMedia;
  const wide = (matches: boolean) => {
    window.matchMedia = ((q: string) => ({ matches, media: q, addEventListener: () => {}, removeEventListener: () => {} }) as unknown as MediaQueryList) as typeof window.matchMedia;
  };
  afterEach(() => {
    window.matchMedia = prevMedia;
  });

  it('at 1100px the rows select, one is current, and the runner is in the pane', () => {
    wide(true);
    const infra = week1.find((t) => t.role === 'infra')!;
    const selectTask = vi.fn();
    const { container } = mount({ expanded: new Set([infra.id]), selectTask });
    expect(container.querySelector('[data-layout="split"]')).not.toBeNull();
    const current = container.querySelectorAll('.stratum-task [aria-current="true"]');
    expect(current).toHaveLength(1);
    expect(current[0].textContent).toContain(infra.title);
    const pane = container.querySelector('#task-pane')!;
    expect(pane).not.toBeNull();
    expect(pane.querySelector('[data-task-runner]')).not.toBeNull();
    expect(screen.getByRole('heading', { name: new RegExp(infra.title) })).toHaveAttribute('id', 'task-pane-head');
    // No accordion body under the row.
    expect(container.querySelector(`#task-${infra.id}-body`)).toBeNull();
    // A click on another row asks the page to make it the one open task.
    const other = week1.find((t) => t.id !== infra.id)!;
    fireEvent.click(screen.getAllByRole('button').find((b) => b.textContent?.includes(other.title) && b.closest('.stratum-task'))!);
    expect(selectTask).toHaveBeenCalledWith(other);
    // The thumbnail stays in the list while the pane holds a task.
    expect(screen.getByRole('button', { name: 'Expand' })).toBeInTheDocument();
  });

  it('with nothing open, the pane draws the week at full size and the list has no thumbnail', () => {
    wide(true);
    const { container } = mount();
    expect(container.querySelector('#task-pane')).toBeNull();
    expect(container.querySelector('[data-layout="split"] > :last-child [data-week-visual-panel]')).not.toBeNull();
    expect(screen.queryByRole('button', { name: /Expand|Shrink/ })).toBeNull();
    expect(screen.getAllByRole('heading', { name: 'What you build this week' })).toHaveLength(1);
  });

  it('focus mode hides the rail, the tray, the picture and the objectives, and keeps the rows', () => {
    const { container } = mount({ focusMode: true });
    expect(container.querySelector('#week-rail')).toBeNull();
    expect(screen.queryByRole('list', { name: 'Gems earned by week' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'What you build this week' })).toBeNull();
    expect(screen.queryByRole('list', { name: /Objectives this/ })).toBeNull();
    expect(container.querySelector('[data-focus-hint]')).not.toBeNull();
    expect(container.querySelectorAll('.stratum-task').length).toBe(5);
    expect(document.getElementById('tasks-head')).not.toBeNull();
  });
});

describe('TasksTab — R116: whose task is whose, and a gate is a note, never a lock', () => {
  const gate = { id: 1, week: 1, title: 'Foundation', description: '', requiredArtifactTypes: [], requiredTasks: [week1[0].id] };
  const note = { gate, steps: [{ taskId: week1[0].id, title: week1[0].title, role: week1[0].role, week: 1, open: 2 }] };

  it('lists the member’s own tasks above the list, with how many are done and that the others’ tasks are open too', () => {
    const own = week1.filter((t) => t.shared || t.role === 'secops');
    const { container } = mount({ teamTaskStats: stats((id) => (id === own[0].id ? 100 : 0)) });
    const strip = container.querySelector('[data-your-tasks]')!;
    expect(strip).not.toBeNull();
    expect(strip.textContent).toContain(`1 of ${own.length} done`);
    expect(strip.textContent).toContain('open to you too');
    expect(strip.querySelectorAll('[data-your-task]')).toHaveLength(own.length);
    // It sits above the list of every task.
    const list = container.querySelector('.stratum-task')!;
    expect(strip.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('a click on one of the member’s tasks opens it', () => {
    const goToTask = vi.fn();
    const own = week1.find((t) => t.role === 'secops')!;
    const { container } = mount({ goToTask });
    fireEvent.click(container.querySelector(`[data-your-task="${own.id}"]`)!);
    expect(goToTask).toHaveBeenCalledWith(expect.objectContaining({ id: own.id }));
  });

  it('every row says whose it is, in words', () => {
    const { container } = mount();
    const chips = [...container.querySelectorAll('.stratum-task [data-owner]')].map((c) => c.getAttribute('data-owner'));
    expect(chips).toHaveLength(week1.length);
    expect(chips).toContain('yours');
    expect(chips).toContain('other');
  });

  it('an opened task of another role says, in full and not behind a tooltip, that it is open to the whole team', () => {
    const infra = week1.find((t) => t.role === 'infra')!;
    const { container } = mount({ expanded: new Set([infra.id]), teamTaskProgress: { [infra.id]: [{ memberId: 'ada', displayName: 'Ada', role: 'infra', pct: 0 }] } });
    const line = container.querySelector('[data-owner-explain="other"]')!;
    expect(line.textContent).toContain('Platform Build (Infrastructure Admin), held by Ada.');
    expect(line.textContent).toContain('Open to you: anyone on the team can do it, and it counts for the team');
  });

  it('an opened task of the member’s own says so', () => {
    const own = week1.find((t) => t.role === 'secops')!;
    const { container } = mount({ expanded: new Set([own.id]) });
    expect(container.querySelector('[data-owner-explain="yours"]')?.textContent).toContain('(that’s you)');
  });

  it('a week behind an uncleared gate is OPEN: its rows and objectives render beside a note that names what is left, as links', () => {
    const goToTask = vi.fn();
    const { container } = mount({ gateNote: (w) => (w === 1 ? note : null), goToTask });
    expect(container.querySelector('[data-gate-note="1"]')).not.toBeNull();
    expect(screen.getByText('Gate 1 is not cleared yet. This week is open.')).toBeInTheDocument();
    expect(container.querySelectorAll('.stratum-task')).toHaveLength(5);
    expect(screen.getAllByRole('button', { name: /tasks? · ~/ }).filter((b) => (b as HTMLButtonElement).disabled)).toHaveLength(0);
    const open = screen.getByRole('list', { name: 'Still open for Gate 1' });
    expect(open.textContent).toContain('2 steps left');
    fireEvent.click(screen.getByRole('button', { name: week1[0].title, hidden: false }));
    expect(goToTask).toHaveBeenCalledWith(expect.objectContaining({ id: week1[0].id }));
  });

  it('no note when the gate is cleared, and no padlock anywhere on the tab', () => {
    const { container } = mount();
    expect(container.querySelector('[data-gate-note]')).toBeNull();
    expect(container.querySelector('.lucide-lock')).toBeNull();
  });

  it('the week rail flags a week whose gate is not cleared with a word for assistive tech, never a lock', () => {
    const { container } = mount({ gateNote: (w) => (w === 2 ? note : null), teamWeekStats: { 1: 100, 2: 0 } });
    expect(screen.getByLabelText('gate not cleared yet')).toBeInTheDocument();
    expect(container.querySelector('[aria-label="locked"]')).toBeNull();
  });

  it('Focus mode keeps only the rows and the open task: the strip steps aside', () => {
    const { container } = mount({ focusMode: true });
    expect(container.querySelector('[data-your-tasks]')).toBeNull();
    expect(container.querySelectorAll('.stratum-task')).toHaveLength(5);
  });
});

describe('TasksTab — R118: one word for done', () => {
  it('every row carries the team’s state, and an opened task repeats it with the member’s own count and checks', () => {
    const infra = week1.find((t) => t.role === 'infra')!;
    const { container } = mount({ expanded: new Set([infra.id]), teamTaskStats: stats((id) => (id === infra.id ? 100 : 0)), teamTaskProgress: { [infra.id]: [{ memberId: 'ada', displayName: 'Ada', role: 'infra', pct: 100 }] } });
    const states = [...container.querySelectorAll('.stratum-task > button [data-task-state]')].map((e) => e.getAttribute('data-task-state'));
    expect(states).toHaveLength(week1.length);
    expect(states.filter((s) => s === 'done')).toHaveLength(1);
    const header = container.querySelector('[data-task-header-state]')!;
    expect(header.textContent).toContain('Done by Ada');
    expect(header.textContent).toMatch(/You: 0 of \d+ steps/);
  });

  it('the week header says its bar is the team’s, and shows the member’s own beside it only when it differs', () => {
    const { container, rerender } = mount({ teamWeekStats: { 1: 50 }, weekStats: { 1: 20 } });
    expect(container.querySelector('#tasks-head')?.textContent).toContain('50%');
    expect(container.querySelector('#tasks-head')?.textContent).toContain('team');
    expect(container.querySelector('[data-week-you]')?.textContent).toBe('You 20%');
    rerender(<div />);
    const same = mount({ teamWeekStats: { 1: 40 }, weekStats: { 1: 40 } });
    expect(same.container.querySelector('[data-week-you]')).toBeNull();
  });

  it('the week rail says what its tick means: every task done for the team', () => {
    const { container } = mount({ teamWeekStats: { 1: 100 } });
    expect(container.querySelector('#week-rail [aria-label="every task done for the team"]')).not.toBeNull();
  });

  it('a finished objective says Done in words for assistive tech, not just a tick', () => {
    const own = week1.find((t) => t.role === 'secops')!;
    const { container } = mount({ teamTaskStats: stats((id) => (id === own.id ? 100 : 0)) });
    expect(container.textContent).toContain('Done:');
  });
});
