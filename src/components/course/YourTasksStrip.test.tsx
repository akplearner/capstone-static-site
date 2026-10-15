import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { YourTasksStrip } from './YourTasksStrip';

const tasks = [
  { id: 'a', title: 'Create the resource group', number: 1, done: true },
  { id: 'b', title: 'Write the access matrix', number: 3, done: false },
];

/** R116 — which tasks are mine this week, at a glance. */
describe('YourTasksStrip', () => {
  it('names the member’s tasks, how many are done, and that the others’ tasks are open to them too', () => {
    const { container } = render(<YourTasksStrip unit="week" color="#abc" tasks={tasks} onGo={() => {}} />);
    expect(screen.getByRole('heading', { name: /Your tasks this week/ })).toHaveTextContent('1 of 2 done');
    expect(screen.getByText('The other roles’ tasks below are open to you too.')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-your-task]')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Create the resource group, done' })).toHaveTextContent('1. Create the resource group');
    expect(screen.getByRole('button', { name: 'Write the access matrix, not done yet' })).toHaveTextContent('3. Write the access matrix');
  });

  it('a chip opens its task', () => {
    const onGo = vi.fn();
    render(<YourTasksStrip unit="week" color="#abc" tasks={tasks} onGo={onGo} />);
    fireEvent.click(screen.getByRole('button', { name: /Write the access matrix/ }));
    expect(onGo).toHaveBeenCalledWith('b');
  });

  it('a role with nothing this week is told to pick any task, which counts for the team', () => {
    render(<YourTasksStrip unit="phase" color="#abc" tasks={[]} onGo={() => {}} />);
    expect(screen.getByText('No task of yours this phase. Pick any task below: it counts for the team.')).toBeInTheDocument();
    expect(screen.queryByText(/done$/)).toBeNull();
  });
});
