import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { RoleBoard } from './RoleBoard';
import { roleBoard, ROLE_BOARD_COPY } from '@/lib/roleBoard';
import { splitRoleName } from '@/lib/docs/roles';
import { AZURE_FUNDAMENTALS } from '@/lib/data/seed/azureCloud';
import type { Course, RosterEntry } from '@/lib/types';

/**
 * R119 — the team's roles board: the viewer's role first and marked "You", every
 * other role "open to anyone", and a role nobody holds marked open with one
 * click to take it behind a short confirm.
 */
const C = AZURE_FUNDAMENTALS; // arch, infra, dev, secops
const TEAM = '2026-09-t1';
const seat = (memberId: string, role: string, displayName: string): RosterEntry => ({ memberId, teamId: TEAM, role, displayName, cohort: '2026-09', joinedAt: 1 });
const me = { memberId: 'm-grace', teamId: TEAM, role: 'secops', displayName: 'Grace' };
const fn = (id: string) => splitRoleName(C.roles.find((r) => r.id === id)!.name).fn;

function setup(over: { course?: Course; roster?: RosterEntry[]; onTake?: (id: string) => Promise<{ ok: boolean; reason?: 'team-full' | 'network' }> } = {}) {
  const course = over.course ?? C;
  const board = roleBoard({
    course,
    week: 1,
    viewer: me,
    roster: over.roster ?? [seat('m-grace', 'secops', 'Grace'), seat('m-ada', 'arch', 'Ada'), seat('m-ben', 'infra', 'Ben')],
    teamTaskStats: {},
    youTaskStats: {},
    teammates: {},
  });
  const onOpenTask = vi.fn();
  const onOpenTasks = vi.fn();
  const onTake = vi.fn(over.onTake ?? (async () => ({ ok: true })));
  const view = render(<RoleBoard board={board} unit="week" teamName="Team 1" onOpenTask={onOpenTask} onOpenTasks={onOpenTasks} onTake={onTake} />);
  const card = (id: string) => view.container.querySelector<HTMLElement>(`[data-board-role="${id}"]`)!;
  return { ...view, board, card, onOpenTask, onOpenTasks, onTake };
}

describe('RoleBoard', () => {
  it('is one section named for the week, with the viewer’s own role first and marked You', () => {
    const { container, card } = setup();
    const section = container.querySelector('#roles')!;
    expect(section.getAttribute('aria-labelledby')).toBe('roles-title');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Your team’s roles this week');
    expect(screen.getByText(ROLE_BOARD_COPY.lede)).toBeInTheDocument();
    const cards = [...container.querySelectorAll('[data-board-role]')];
    expect(cards.map((c) => c.getAttribute('data-board-role'))).toEqual(['secops', 'arch', 'infra', 'dev']);
    expect(card('secops')).toHaveAttribute('data-you');
    expect(within(card('secops')).getByText('You')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-board-you]')).toHaveLength(1);
    expect(card('secops').querySelector('[data-board-holders]')).toHaveTextContent('Held by you');
    expect(card('arch').querySelector('[data-board-holders]')).toHaveTextContent('Held by Ada');
  });

  it('says on every task whose it is and where it stands: yours, or another role’s and open to anyone', () => {
    const { card } = setup();
    const mine = card('secops').querySelector('[data-board-task]')!;
    expect(within(mine as HTMLElement).getByText('Your task')).toBeInTheDocument();
    expect(mine.querySelector('[data-task-state="not-started"]')).toHaveTextContent('Not started');
    const theirs = card('arch').querySelector('[data-board-task]')!;
    expect(theirs.querySelector('[data-owner="other"]')).toHaveTextContent(`${fn('arch')} · open to anyone`);
    expect(theirs.querySelector('[data-task-state]')).not.toBeNull();
    // Nothing on the board is a padlock or a disabled control.
    expect(screen.queryAllByRole('button').filter((b) => b.hasAttribute('disabled'))).toEqual([]);
  });

  it('opens a task in Tasks from its title, and the whole week from the link', () => {
    const { card, board, onOpenTask, onOpenTasks } = setup();
    const arch = board.roles.find((r) => r.id === 'arch')!.tasks[0].task;
    fireEvent.click(within(card('arch')).getByRole('button', { name: arch.title }));
    expect(onOpenTask).toHaveBeenCalledWith(arch);
    fireEvent.click(screen.getByRole('button', { name: ROLE_BOARD_COPY.openTasks }));
    expect(onOpenTasks).toHaveBeenCalledTimes(1);
  });

  it('marks a role nobody holds as open, says any teammate can cover it, and offers it; a held role offers nothing', () => {
    const { card, container } = setup();
    const dev = card('dev');
    expect(dev).toHaveAttribute('data-vacant');
    expect(within(dev).getByText(ROLE_BOARD_COPY.openRole)).toBeInTheDocument();
    expect(within(dev).getByText(ROLE_BOARD_COPY.nobody)).toBeInTheDocument();
    expect(within(dev).getByText(ROLE_BOARD_COPY.cover)).toBeInTheDocument();
    expect(within(dev).getByRole('button', { name: `${ROLE_BOARD_COPY.take}: ${fn('dev')}` })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-take-role]')).toHaveLength(1);
    for (const id of ['secops', 'arch', 'infra']) {
      expect(card(id)).not.toHaveAttribute('data-vacant');
      expect(card(id).querySelector('[data-take-role]')).toBeNull();
    }
  });

  it('asks before moving: the confirm names both roles and the team, and Cancel changes nothing', async () => {
    const { card, onTake } = setup();
    fireEvent.click(within(card('dev')).getByRole('button', { name: /Take this role/ }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: `Take ${fn('dev')}?` })).toBeInTheDocument();
    const body = dialog.querySelector('[data-take-confirm]')!.textContent!;
    expect(body).toContain('Team 1');
    expect(body).toContain(fn('dev'));
    expect(body).toContain(fn('secops'));
    expect(body).toContain('Steps you ticked stay ticked');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(onTake).not.toHaveBeenCalled();
  });

  it('takes the role on confirm, and closes', async () => {
    const { card, onTake } = setup();
    fireEvent.click(within(card('dev')).getByRole('button', { name: /Take this role/ }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: ROLE_BOARD_COPY.take }));
    await waitFor(() => expect(onTake).toHaveBeenCalledWith('dev'));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('keeps the dialog open and says why when the move did not land', async () => {
    const { card, onTake } = setup({ onTake: async () => ({ ok: false, reason: 'network' }) });
    fireEvent.click(within(card('dev')).getByRole('button', { name: /Take this role/ }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: ROLE_BOARD_COPY.take }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(ROLE_BOARD_COPY.failed);
    expect(onTake).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // The button is usable again for a second try.
    expect(within(dialog).getByRole('button', { name: ROLE_BOARD_COPY.take })).not.toBeDisabled();
  });

  it('draws a shared task in its own group, owned by everyone', () => {
    const shared: Course = { ...C, tasks: C.tasks.map((t) => (t.id === 'az-w1-arch' ? { ...t, shared: true } : t)) };
    const { container, card } = setup({ course: shared });
    const group = container.querySelector('[data-board-shared]')!;
    expect(within(group as HTMLElement).getByRole('heading', { name: ROLE_BOARD_COPY.shared })).toBeInTheDocument();
    expect(group.querySelector('[data-owner="shared"]')).toHaveTextContent('Everyone');
    expect(card('arch').querySelector('[data-board-task]')).toBeNull();
    expect(within(card('arch')).getByText('No task of its own this week.')).toBeInTheDocument();
  });

  it('on a week of shared work only, no card repeats “no task of its own”; the roles still show their holders and an open role its button', () => {
    const sharedOnly: Course = { ...C, tasks: C.tasks.map((t) => (t.week === 1 ? { ...t, shared: true } : t)) };
    const { container, card } = setup({ course: sharedOnly });
    expect(container.querySelectorAll('[data-board-shared] [data-board-task]')).toHaveLength(4);
    expect(container.textContent).not.toContain('No task of its own');
    expect(card('arch').querySelector('[data-board-holders]')).toHaveTextContent('Held by Ada');
    expect(within(card('dev')).getByRole('button', { name: /Take this role/ })).toBeInTheDocument();
  });

  it('shows no shared group when the week has no shared task', () => {
    const { container } = setup();
    expect(container.querySelector('[data-board-shared]')).toBeNull();
  });
});
