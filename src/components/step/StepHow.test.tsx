import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StepHow, howHint } from './StepHow';
import { courseDocument } from '@/lib/content/docs';

/**
 * R97 — on the entry cloud courses the console is the task: the clicks, the
 * docs line and "What you should see" are in the open; the command and the
 * paste-to-verify box sit in a closed drawer. A course without the flag
 * renders the command block as before.
 */
const docs = { entry: courseDocument('azure-fundamentals')!, later: courseDocument('azure-administrator')! };
let current: keyof typeof docs = 'entry';

vi.mock('next/navigation', () => ({ useParams: () => ({ courseId: 'azure-fundamentals' }), useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/lib/useCourse', async (orig) => {
  const real = await orig<typeof import('@/lib/useCourse')>();
  return { ...real, useCourseDocument: () => docs[current] };
});

const step = docs.entry.course.tasks.find((t) => t.id === 'az-w1-infra')!.steps[0];
const codeStep = docs.entry.course.tasks.find((t) => t.id === 'az-w3-dev')!.steps.find((s) => s.codeToPaste)!;

describe('StepHow — R97 shell drawer', () => {
  it('on an entry course: clicks, docs and the outcome in the open; the command and verify box behind a closed drawer', () => {
    current = 'entry';
    const { container } = render(<StepHow step={step} courseId="azure-fundamentals" />);
    // Glossary tooltips split a click into several elements, so read the text as a whole.
    expect(container.textContent).toContain('Resource groups');
    expect(container.textContent).toContain('rg-capstone-team01');
    expect(screen.getByText('Read the docs:')).toBeInTheDocument();
    expect(screen.getByText('What you should see')).toBeInTheDocument();
    const drawer = screen.getByRole('button', { name: /Optional: the same step in Cloud Shell/ });
    expect(drawer).toHaveAttribute('aria-expanded', 'false');
    expect(container.textContent).not.toContain('az group create');
    expect(screen.queryByRole('textbox')).toBeNull();
    fireEvent.click(drawer);
    expect(container.textContent).toContain('the clicks above are the task');
    expect(container.textContent).toContain('az group create');
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('code the clicks paste stays in the open, under its own heading', () => {
    current = 'entry';
    render(<StepHow step={codeStep} courseId="azure-fundamentals" />);
    expect(screen.getByText('The code to paste')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Optional: the same step/ })).toBeNull();
  });

  it('on a later course the command block shows as before, with no drawer', () => {
    current = 'later';
    const later = docs.later.course.tasks.find((t) => t.id === 'az-w5-infra')!.steps[0];
    render(<StepHow step={later} courseId="azure-administrator" />);
    // R102: the commands are required work here, so the caption says so.
    expect(screen.getByText('Then run')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Optional: the same step/ })).toBeNull();
    expect(screen.queryByText('Read the docs:')).toBeNull(); // this step has none
  });

  it('R102: a step with docs shows them on any course, with its verify box in the open', () => {
    current = 'later';
    const withDocs = { ...step, docs: [{ title: 'Resource groups', url: 'https://learn.microsoft.com/azure/azure-resource-manager/management/manage-resource-groups-portal', lookFor: 'Create resource groups' }] };
    const { container } = render(<StepHow step={withDocs} courseId="azure-administrator" />);
    expect(screen.getByText('Read the docs:')).toBeInTheDocument();
    expect(container.textContent).toContain('look for Create resource groups');
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Optional: the same step/ })).toBeNull();
  });

  it('the bar counts clicks and docs where the shell is tucked away, commands and verify elsewhere', () => {
    expect(howHint(step, true)).toBe('2 clicks · what you should see · docs');
    expect(howHint(step, false)).toBe('2 actions · or 1 command · what you should see · docs · verify');
    expect(howHint(codeStep, true)).toContain('code to paste');
  });
});
