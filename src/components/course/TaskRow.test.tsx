import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskRow } from './TaskRow';
import { AZURE_FUNDAMENTALS } from '@/lib/data/seed/azureCloud';

/** R100 — a closed row is one line plus its objective; in select mode it is a selector. */
const C = AZURE_FUNDAMENTALS;
const task = C.tasks.find((t) => t.week === 1)!;
const owner = { name: 'Infrastructure Admin', icon: 'server', color: '#000', isYou: false };

function mount(over: Partial<Parameters<typeof TaskRow>[0]> = {}) {
  const onToggle = vi.fn();
  const renderBody = vi.fn(() => <p>the runner</p>);
  const r = render(<TaskRow course={C} task={task} joined open={false} percent={0} onToggle={onToggle} number={1} renderBody={renderBody} {...over} />);
  return { ...r, onToggle, renderBody };
}

describe('TaskRow', () => {
  it('closed: number, truncated title, chips and one objective line; the body is not built', () => {
    const { container, renderBody } = mount({ owner, isNext: true, stuckCount: 2, reportCount: 1 });
    expect(screen.getByText(task.title).className).toContain('truncate');
    expect(screen.getByText(task.objective).className).toContain('truncate');
    for (const chip of ['Next', '2 stuck', '1 issue', 'Infrastructure Admin']) expect(screen.getByText(chip)).toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute('data-open', 'false');
    expect(renderBody).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /1\./ })).toHaveAttribute('aria-expanded', 'false');
  });

  it('accordion: open builds the body under the row and lifts the row', () => {
    const { container, renderBody } = mount({ open: true, owner: { ...owner, isYou: true } });
    expect(renderBody).toHaveBeenCalled();
    expect(screen.getByText('the runner')).toBeInTheDocument();
    expect(screen.getByText('Yours')).toBeInTheDocument();
    expect(screen.queryByText(task.objective)).toBeNull();
    expect(container.firstElementChild).toHaveAttribute('data-open', 'true');
  });

  it('select: the row is current, wears the ring, keeps its objective and builds no body', () => {
    const { container, renderBody, onToggle } = mount({ mode: 'select', open: true, doneBy: ['Ada'], percent: 100 });
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
});
