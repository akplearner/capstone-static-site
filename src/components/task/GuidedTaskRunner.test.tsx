import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GuidedTaskRunner } from './GuidedTaskRunner';
import { SERVER_PLUS } from '@/lib/data/seed/serverPlus';

vi.mock('next/navigation', () => ({ useParams: () => ({ courseId: 'server-plus' }), useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/lib/useCourse', async (orig) => {
  const real = await orig<typeof import('@/lib/useCourse')>();
  const { courseDocument } = await import('@/lib/content/docs');
  return { ...real, useCourseDocument: () => courseDocument('server-plus')! };
});

/** R80: a task opens as a plain list of step titles; a click opens one step. */
describe('GuidedTaskRunner — Show all, collapsed', () => {
  const task = SERVER_PLUS.tasks.find((t) => t.id === 'sp-w1-install')!;

  it('opens in Show all with every step closed', () => {
    render(<GuidedTaskRunner task={task} courseId="server-plus" memberId="m1" />);
    expect(screen.getByRole('button', { name: /Show all/ })).toHaveAttribute('aria-pressed', 'true');
    const rungs = screen.getAllByRole('button', { expanded: false });
    expect(rungs.length).toBeGreaterThanOrEqual(task.steps.length);
    expect(screen.queryByText('Show me how')).toBeNull();
  });

  it('a click opens exactly that step', () => {
    render(<GuidedTaskRunner task={task} courseId="server-plus" memberId="m1" />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(task.steps[1].title) }));
    expect(screen.getAllByText('Show me how')).toHaveLength(1);
  });

  it('a deep link opens only the step it names', () => {
    render(<GuidedTaskRunner task={task} courseId="server-plus" memberId="m1" initialStepId={task.steps[2].id} />);
    expect(screen.getAllByText('Show me how')).toHaveLength(1);
    expect(screen.getByRole('button', { name: new RegExp(task.steps[2].title) })).toHaveAttribute('aria-expanded', 'true');
  });
});
