import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FixTextPanel, FIX_PANEL_COPY } from './FixTextPanel';
import { SECURITY_PLUS } from '@/lib/data/seed/securityPlus';
import { FIX_SUMMARY, readField, type FixDraft } from '@/lib/contentFix';
import type { IssueDto } from '@/lib/issueInbox';
import type { Course } from '@/lib/types';

/**
 * R121 — the fix panel: the words of the task or step a report names, each in a box, the
 * checks beside the field they are about, one line of why, and a save that closes the report.
 */
const course = SECURITY_PLUS as Course;
// A step that shows output and has a self-check token, so the verify rule can be tripped.
const task = course.tasks.find((t) => t.steps.some((s) => s.verify?.length && s.expectedOutput && s.instruction))!;
const step = task.steps.find((s) => s.verify?.length && s.expectedOutput && s.instruction)!;
const stepNo = task.steps.indexOf(step) + 1;

const issue = (over: Partial<IssueDto> = {}): IssueDto => ({
  schema: 'capstone-issue/1',
  id: 'r1',
  courseId: course.id,
  courseTitle: course.title,
  week: task.week,
  weekTitle: null,
  taskId: task.id,
  taskTitle: task.title,
  taskRole: task.role,
  taskRoleName: task.role,
  stepId: step.id,
  stepTitle: step.title,
  stepNumber: stepNo,
  kind: 'unclear',
  note: 'which flag?',
  reporter: { name: 'Ada Lovelace', role: task.role, roleName: task.role, teamId: 'T1' },
  reportedAt: '2026-10-12T14:05:00.000Z',
  contentVersion: '1.0',
  status: 'open',
  resolution: null,
  orphan: false,
  ...over,
});

function setup(over: { course?: Course; issue?: IssueDto; others?: IssueDto[]; onSave?: (d: FixDraft, r: { resolveIds: string[]; note: string }) => Promise<boolean>; labTokens?: ReadonlySet<string> } = {}) {
  const onSave = vi.fn(over.onSave ?? (async () => true));
  const view = render(<FixTextPanel course={over.course ?? course} issue={over.issue ?? issue()} others={over.others ?? []} labTokens={over.labTokens} onSave={onSave} />);
  const open = () => fireEvent.click(view.container.querySelector('[data-fix-open]')!);
  const box = (field: string) => view.container.querySelector(`[data-fix-field="${field}"] input, [data-fix-field="${field}"] textarea`) as HTMLInputElement | HTMLTextAreaElement;
  const type = (field: string, value: string) => fireEvent.change(box(field), { target: { value } });
  const fields = () => [...view.container.querySelectorAll('[data-fix-field]')].map((e) => e.getAttribute('data-fix-field'));
  const save = () => view.container.querySelector('[data-fix-save]') as HTMLButtonElement;
  const problems = () => [...view.container.querySelectorAll('[data-fix-problem]')].map((e) => e.getAttribute('data-fix-problem'));
  return { ...view, onSave, open, box, type, fields, save, problems };
}

describe('FixTextPanel', () => {
  it('is closed until asked, then shows the words of the step the report names, as a student reads them', () => {
    const { container, open, fields, box } = setup();
    expect(container.querySelector('[data-fix-body]')).toBeNull();
    expect(screen.getByRole('button', { name: FIX_PANEL_COPY.open })).toHaveAttribute('aria-expanded', 'false');
    open();
    expect(screen.getByRole('button', { name: FIX_PANEL_COPY.close })).toHaveAttribute('aria-expanded', 'true');
    expect(fields()).toEqual(expect.arrayContaining(['title', 'description', 'instruction', 'expectedOutput', 'whatItMeans']));
    expect(box('title').value).toBe(step.title);
    expect(box('expectedOutput').value).toBe(step.expectedOutput);
    expect((container.querySelector('[data-fix-target]') as HTMLSelectElement).value).toBe(step.id);
    // The task itself, and every step, can be chosen.
    expect([...container.querySelectorAll('[data-fix-target] option')].map((o) => o.textContent)).toEqual([FIX_PANEL_COPY.whole, ...task.steps.map((s, i) => `Step ${i + 1}: ${s.title}`)]);
    expect((container.querySelector('[data-fix-summary]') as HTMLInputElement).value).toBe(FIX_SUMMARY.unclear);
    expect(container.querySelector('[data-fix-save]')).toBeDisabled();
  });

  it('a report about a whole task opens on the task’s own words', () => {
    const { open, fields, box } = setup({ issue: issue({ stepId: null, stepTitle: null, stepNumber: null }) });
    open();
    expect(fields()).toEqual(expect.arrayContaining(['title', 'objective']));
    expect(box('title').value).toBe(task.title);
  });

  it('marks a changed field, counts the changes, and saves a fix that closes this report', async () => {
    const { container, open, type, save, onSave } = setup();
    open();
    type('whatItMeans', 'A short, corrected sentence.');
    const li = container.querySelector('[data-fix-field="whatItMeans"]')!;
    expect(li.getAttribute('data-changed')).toBe('true');
    expect(li.textContent).toContain(FIX_PANEL_COPY.changed);
    expect(container.querySelector('[data-fix-count]')!.textContent).toBe('1 field changed');
    expect(save()).toBeEnabled();
    fireEvent.change(container.querySelector('[data-fix-summary]')!, { target: { value: 'Say it in one sentence' } });
    fireEvent.change(container.querySelector('[data-fix-note]')!, { target: { value: 'Reworded' } });
    fireEvent.click(save());
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const [draft, resolution] = onSave.mock.calls[0];
    expect(draft).toEqual({
      kind: 'fix',
      summary: 'Say it in one sentence',
      changes: [{ taskId: task.id, stepId: step.id, field: 'whatItMeans', before: step.whatItMeans, after: 'A short, corrected sentence.' }],
      issueIds: ['r1'],
      reverts: null,
      folds: [],
      foldedIn: '',
    });
    expect(resolution).toEqual({ resolveIds: ['r1'], note: 'Reworded' });
    await waitFor(() => expect(container.querySelector('[data-fix-body]')).toBeNull());
  });

  it('a field put back as it was is not a change', () => {
    const { container, open, type, save } = setup();
    open();
    type('title', `${step.title} (edited)`);
    expect(container.querySelector('[data-fix-count]')!.textContent).toBe('1 field changed');
    type('title', step.title);
    expect(container.querySelector('[data-fix-count]')!.textContent).toBe('0 fields changed');
    expect(save()).toBeDisabled();
  });

  it('leaves the report open when asked to, and offers to close the others about the same text', async () => {
    const other = (id: string) => issue({ id, reporter: { name: id, role: null, roleName: null, teamId: 'T1' } });
    const { container, open, type, save, onSave } = setup({ others: [other('r2'), other('r3')] });
    open();
    type('title', `${step.title} (edited)`);
    const also = container.querySelector('[data-fix-also]') as HTMLInputElement;
    expect(also.parentElement!.textContent).toContain('(2)');
    expect(also.checked).toBe(false);
    fireEvent.click(also);
    fireEvent.click(save());
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0].issueIds).toEqual(['r1', 'r2', 'r3']);
    expect(onSave.mock.calls[0][1].resolveIds).toEqual(['r1', 'r2', 'r3']);
  });

  it('with “resolved” unticked it saves the fix and closes nothing, and the others cannot be ticked', async () => {
    const { container, open, type, save, onSave } = setup({ others: [issue({ id: 'r2' })] });
    open();
    type('title', `${step.title} (edited)`);
    fireEvent.click(container.querySelector('[data-fix-resolve]')!);
    expect(container.querySelector('[data-fix-also]')).toBeDisabled();
    expect(container.querySelector('[data-fix-note]')).toBeNull();
    fireEvent.click(save());
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0].issueIds).toEqual([]);
    expect(onSave.mock.calls[0][1].resolveIds).toEqual([]);
  });

  it('says beside the field why a change cannot be saved, and does not save it', () => {
    const { open, type, save, problems, container } = setup();
    open();
    // The self-check token must stay in the output shown.
    type('expectedOutput', 'Nothing useful here');
    expect(problems()).toEqual(['verify']);
    const verify = container.querySelector('[data-fix-field="expectedOutput"] [data-fix-problem]')!;
    expect(verify.textContent).toMatch(/self-check looks for “.+” in the output shown/);
    expect(verify).toHaveAttribute('role', 'alert');
    expect(save()).toBeDisabled();
    type('expectedOutput', step.expectedOutput!);
    expect(problems()).toEqual([]);
    // The reading budget.
    type('instruction', Array.from({ length: 45 }, () => 'word').join(' '));
    expect(problems()).toEqual(['budget']);
    expect(save()).toBeDisabled();
    type('instruction', step.instruction!);
    // A line of why is required.
    type('title', `${step.title} (edited)`);
    fireEvent.change(container.querySelector('[data-fix-summary]')!, { target: { value: '   ' } });
    expect(problems()).toEqual(['summary']);
    expect(save()).toBeDisabled();
  });

  it('refuses a change over text that moved since the panel opened', () => {
    const { container, open, type, rerender, problems, save } = setup();
    open();
    type('title', `${step.title} (edited)`);
    // Someone else's fix lands while the panel is open: the text it was typed over is no longer there.
    const moved = {
      ...course,
      tasks: course.tasks.map((t) => (t.id !== task.id ? t : { ...t, steps: t.steps.map((s) => (s.id !== step.id ? s : { ...s, title: 'Someone else’s title' })) })),
    } as Course;
    expect(readField(moved, { taskId: task.id, stepId: step.id }, 'title')).toBe('Someone else’s title');
    rerender(<FixTextPanel course={moved} issue={issue()} others={[]} onSave={async () => true} />);
    expect(problems()).toEqual(['stale']);
    expect(container.querySelector('[data-fix-field="title"] [data-fix-problem]')!.textContent).toMatch(/changed after the panel opened/);
    expect(save()).toBeDisabled();
  });

  it('choosing another text starts over, and a refused save keeps the edits', async () => {
    const { container, open, type, save, onSave, fields } = setup({ onSave: async () => false });
    open();
    type('title', `${step.title} (edited)`);
    fireEvent.change(container.querySelector('[data-fix-target]')!, { target: { value: '' } });
    expect(container.querySelector('[data-fix-count]')!.textContent).toBe('0 fields changed');
    expect(fields()).toEqual(expect.arrayContaining(['title', 'objective']));
    type('title', `${task.title} (edited)`);
    fireEvent.click(save());
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0].changes).toEqual([{ taskId: task.id, field: 'title', before: task.title, after: `${task.title} (edited)` }]);
    expect(container.querySelector('[data-fix-body]'), 'a save that failed leaves the panel and the edits where they were').not.toBeNull();
    expect(container.querySelector('[data-fix-count]')!.textContent).toBe('1 field changed');
  });

  it('renders nothing for a task that is no longer in the course', () => {
    const { container } = setup({ issue: issue({ taskId: 'removed-task', orphan: true }) });
    expect(container.querySelector('[data-fix-panel]')).toBeNull();
  });

  it('checks the lab placeholders a fix adds when it is told which the course fills in', () => {
    const { open, type, problems } = setup({ labTokens: new Set(['<kali-ip>']) });
    open();
    type('instruction', 'SSH to <kali-ipp> as the admin.');
    expect(problems()).toEqual(['placeholder']);
    type('instruction', 'SSH to <kali-ip> as the admin.');
    expect(problems()).toEqual([]);
  });

  it('says everything in the register: impersonal, plain, no second person', () => {
    for (const [key, text] of Object.entries(FIX_PANEL_COPY)) {
      expect(text, key).not.toMatch(/\b(you|your|yours|we|our)\b/i);
      expect(text, key).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });
});
