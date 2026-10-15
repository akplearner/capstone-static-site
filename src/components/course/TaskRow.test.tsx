import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskRow } from './TaskRow';
import { AZURE_FUNDAMENTALS } from '@/lib/data/seed/azureCloud';
import { taskState } from '@/lib/taskState';

/** R100 — a closed row is one line plus its objective; in select mode it is a selector. */
const C = AZURE_FUNDAMENTALS;
const task = C.tasks.find((t) => t.week === 1)!;
const role = { name: 'Platform Build (Infrastructure Admin)', icon: 'server', color: '#000' };
const owner = { kind: 'other' as const, role };
const open0 = taskState(task, 0, 0);

function mount(over: Partial<Parameters<typeof TaskRow>[0]> = {}) {
  const onToggle = vi.fn();
  const renderBody = vi.fn(() => <p>the runner</p>);
  const r = render(<TaskRow course={C} task={task} joined open={false} state={open0} onToggle={onToggle} number={1} renderBody={renderBody} {...over} />);
  return { ...r, onToggle, renderBody };
}

describe('TaskRow', () => {
  it('closed: number, truncated title, chips and one objective line; the body is not built', () => {
    const { container, renderBody } = mount({ owner, isNext: true, stuckCount: 2, reportCount: 1 });
    expect(screen.getByText(task.title).className).toContain('truncate');
    expect(screen.getByText(task.objective).className).toContain('truncate');
    for (const chip of ['Next', '2 stuck', '1 issue', 'Platform Build · open to anyone']) expect(screen.getByText(chip)).toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute('data-open', 'false');
    expect(renderBody).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /1\./ })).toHaveAttribute('aria-expanded', 'false');
  });

  it('accordion: open builds the body under the row and lifts the row', () => {
    const { container, renderBody } = mount({ open: true, owner: { kind: 'yours', role } });
    expect(renderBody).toHaveBeenCalled();
    expect(screen.getByText('the runner')).toBeInTheDocument();
    expect(screen.getByText('Your task')).toBeInTheDocument();
    expect(screen.queryByText(task.objective)).toBeNull();
    expect(container.firstElementChild).toHaveAttribute('data-open', 'true');
  });

  it('select: the row is current, wears the ring, keeps its objective and builds no body', () => {
    const { container, renderBody, onToggle } = mount({ mode: 'select', open: true, state: taskState(task, 100, 0, ['Ada']) });
    const btn = screen.getByRole('button', { name: /1\./ });
    expect(btn).toHaveAttribute('aria-current', 'true');
    expect(btn).not.toHaveAttribute('aria-expanded');
    expect(container.firstElementChild!.className).toContain('depth-current');
    expect(screen.getByText(task.objective)).toBeInTheDocument();
    expect(screen.getByText('Done by Ada')).toBeInTheDocument();
    expect(renderBody).not.toHaveBeenCalled();
    expect(container.querySelector(`#task-${task.id}-body`)).toBeNull();
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('R116: every row says whose it is, in words: yours, everyone’s, or another role’s and open to anyone', () => {
    const { container, rerender } = mount({ owner: { kind: 'yours', role } });
    expect(container.querySelector('[data-owner="yours"]')?.textContent).toBe('Your task');
    const props = { course: C, task, joined: true, open: false, state: open0, onToggle: vi.fn(), number: 1, renderBody: () => null };
    rerender(<TaskRow {...props} owner={{ kind: 'shared' }} />);
    expect(container.querySelector('[data-owner="shared"]')?.textContent).toBe('Everyone');
    rerender(<TaskRow {...props} owner={owner} />);
    const other = container.querySelector('[data-owner="other"]')!;
    expect(other.textContent).toBe('Platform Build · open to anyone');
    expect(other.getAttribute('title')).toContain('anyone on the team can do it');
  });

  it('R116: no padlock is ever drawn on a row, joined or not', () => {
    const { container, rerender } = mount({ owner });
    expect(container.querySelector('.lucide-lock')).toBeNull();
    rerender(<TaskRow course={C} task={task} joined={false} open={false} state={open0} onToggle={vi.fn()} renderBody={() => null} owner={owner} />);
    expect(container.querySelector('.lucide-lock')).toBeNull();
  });

  it('R118: every row says what state it is in, in words, and a task a teammate finished says "You: 0 of n" beside "Done by"', () => {
    const { container, rerender } = mount();
    expect(container.querySelector('[data-task-state="not-started"]')?.textContent).toBe('Not started');
    const props = { course: C, task, joined: true, open: false, onToggle: vi.fn(), number: 1, renderBody: () => null };
    rerender(<TaskRow {...props} state={taskState(task, 100, 0, ['Ada'])} />);
    expect(container.querySelector('[data-task-state="done"]')?.textContent).toBe('Done by Ada');
    expect(container.querySelector('[data-task-you]')?.textContent).toMatch(/^You: 0 of \d+ steps$/);
    rerender(<TaskRow {...props} state={taskState(task, 100, 100)} />);
    expect(container.querySelector('[data-task-state="done"]')?.textContent).toBe('Done');
    expect(container.querySelector('[data-task-you]')).toBeNull();
  });

  it('R118: Next is offered only on a task the team has not finished', () => {
    const { rerender } = mount({ isNext: true });
    expect(screen.getByText('Next')).toBeInTheDocument();
    rerender(<TaskRow course={C} task={task} joined open={false} state={taskState(task, 100, 100)} onToggle={vi.fn()} isNext renderBody={() => null} />);
    expect(screen.queryByText('Next')).toBeNull();
  });
});
