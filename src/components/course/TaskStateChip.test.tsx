import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskStateChip } from './TaskStateChip';
import { taskState } from '@/lib/taskState';
import { AZURE_FUNDAMENTALS } from '@/lib/data/seed/azureCloud';
import { getProgressSteps } from '@/lib/course-helpers';

const task = AZURE_FUNDAMENTALS.tasks.find((t) => getProgressSteps(t).length >= 3)!;

/** R118 — the state of a task as an icon plus words, never colour alone. */
describe('TaskStateChip', () => {
  it('not started, in progress and done each say so in words, with their own icon', () => {
    const { container, rerender } = render(<TaskStateChip state={taskState(task, 0, 0)} />);
    expect(screen.getByText('Not started')).toBeInTheDocument();
    expect(container.querySelector('[data-task-state="not-started"] svg')).not.toBeNull();
    rerender(<TaskStateChip state={taskState(task, 34, 34)} />);
    expect(container.querySelector('[data-task-state="in-progress"]')?.textContent).toMatch(/^In progress · \d of \d steps$/);
    rerender(<TaskStateChip state={taskState(task, 100, 100)} />);
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(container.querySelector('[data-task-state="done"] svg')).not.toBeNull();
  });

  it('a task a teammate finished says by whom, and the member’s own count sits beside it', () => {
    const { container } = render(<TaskStateChip state={taskState(task, 100, 0, ['Ada'])} />);
    expect(screen.getByText('Done by Ada')).toBeInTheDocument();
    expect(container.querySelector('[data-task-you]')?.textContent).toMatch(/^You: 0 of \d steps$/);
  });

  it('no second chip when the member’s own figure is the team’s', () => {
    const { container } = render(<TaskStateChip state={taskState(task, 100, 100)} />);
    expect(container.querySelector('[data-task-you]')).toBeNull();
  });

  it('shows the verified checks only when asked, and only when the task has some', () => {
    const withChecks = taskState(task, 0, 0, [], { done: 1, of: 2 });
    const { container, rerender } = render(<TaskStateChip state={withChecks} />);
    expect(container.querySelector('[data-task-verified]')).toBeNull();
    rerender(<TaskStateChip state={withChecks} withVerified />);
    expect(container.querySelector('[data-task-verified]')?.textContent).toBe('Checks verified 1 of 2');
  });
});
