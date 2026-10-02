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

/** R98: a step a teammate ticked is done for the team; your own ticks stay yours. */
describe('GuidedTaskRunner — done for the team', () => {
  const task = SERVER_PLUS.tasks.find((t) => t.id === 'sp-w1-install')!;
  const [s1, s2] = task.steps;
  const ada = { [s1.id]: [{ memberId: 'ada', displayName: 'Ada' }] };

  it('shows a teammate’s tick as done, named, and will not untick it', () => {
    localStorage.clear();
    const { container } = render(<GuidedTaskRunner task={task} courseId="server-plus" memberId="m1" teamSteps={ada} />);
    const box = screen.getByLabelText('Step 1 done') as HTMLInputElement;
    expect(box.checked).toBe(true);
    expect(container.textContent).toContain('done by Ada');
    fireEvent.click(box);
    expect((screen.getByLabelText('Step 1 done') as HTMLInputElement).checked).toBe(true);
    expect(Object.keys(localStorage).some((k) => k.includes('completion'))).toBe(false);
  });

  it('your own tick is written under your id only, and the task completes on the team’s ticks together', () => {
    localStorage.clear();
    const required = task.steps.filter((s) => !s.optional);
    const others = Object.fromEntries(required.slice(1).map((s) => [s.id, [{ memberId: 'ada', displayName: 'Ada' }]]));
    const { container } = render(<GuidedTaskRunner task={task} courseId="server-plus" memberId="m1" teamSteps={others} onNext={() => {}} />);
    expect(container.textContent).not.toContain('Task complete');
    fireEvent.click(screen.getByLabelText('Step 1 done'));
    const keys = Object.keys(localStorage).filter((k) => k.includes('completion'));
    expect(keys).toHaveLength(1);
    expect(keys[0]).toContain('_m1_');
    expect(keys[0]).not.toContain('ada');
    expect(keys[0]).toContain(s1.id);
    expect(container.textContent).toContain('Task complete');
    void s2;
  });

  it('R100: the stamp is one chip that copies itself, and the facts sit in one row', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const stamped = SERVER_PLUS.tasks.find((t) => t.steps.some((s) => s.verify?.length))!;
    const { container } = render(<GuidedTaskRunner task={stamped} courseId="server-plus" memberId="m1" />);
    const chip = container.querySelector('button[data-stamp]') as HTMLButtonElement;
    expect(chip).not.toBeNull();
    expect(chip.textContent).toContain('Your stamp:');
    expect(chip.textContent).toContain(chip.dataset.stamp!);
    expect(chip.title).toContain('echo ');
    fireEvent.click(chip);
    expect(writeText).toHaveBeenCalledWith(chip.dataset.stamp);
    // The explanation is the tooltip, not a paragraph in the header.
    expect(container.textContent).not.toContain('include it in every output');
    expect(screen.getByRole('group', { name: 'How to work the steps' })).toBeInTheDocument();
  });

  it('R100: → and ← page through the steps, Esc closes, and the keys stay out of a textarea or a handled event', () => {
    const { container } = render(<GuidedTaskRunner task={task} courseId="server-plus" memberId="m1" />);
    const open = () => container.querySelectorAll('li[id^="step-"] [aria-expanded="true"]');
    expect(open()).toHaveLength(0);
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(open()).toHaveLength(1);
    expect(container.querySelector(`#step-${task.steps[0].id} [aria-expanded="true"]`)).not.toBeNull();
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(container.querySelector(`#step-${task.steps[1].id} [aria-expanded="true"]`)).not.toBeNull();
    expect(open()).toHaveLength(1);
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(container.querySelector(`#step-${task.steps[0].id} [aria-expanded="true"]`)).not.toBeNull();
    // Typing: the keys are the textarea's.
    const ta = document.createElement('textarea');
    container.appendChild(ta);
    ta.focus();
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(container.querySelector(`#step-${task.steps[0].id} [aria-expanded="true"]`)).not.toBeNull();
    ta.remove();
    (document.activeElement as HTMLElement | null)?.blur();
    // A widget that handled the key already keeps it.
    const handled = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true, bubbles: true });
    handled.preventDefault();
    window.dispatchEvent(handled);
    expect(container.querySelector(`#step-${task.steps[0].id} [aria-expanded="true"]`)).not.toBeNull();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(open()).toHaveLength(0);
  });
});
