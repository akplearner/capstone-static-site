import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReportIssueDialog } from './ReportIssueDialog';
import { AZURE_FUNDAMENTALS } from '@/lib/data/seed/azureCloud';
import { courseRepo, taskReportsRepo } from '@/lib/data';
import { contentVersion } from '@/lib/contentVersion';
import type { Member } from '@/lib/types';

/**
 * R120 — a report names the step when the reporter picks one, and records who filed
 * it, in what role, in which week, and which version of the course they saw.
 */
vi.mock('@/lib/useRequireAuth', () => ({ useRequireAuth: () => ({ guard: (_what: string, write: () => void) => { write(); return true; } }) }));

const C = AZURE_FUNDAMENTALS;
const task = C.tasks.find((t) => t.steps.length >= 3)!;
const me: Member = { memberId: 'm-grace', courseId: C.id, teamId: '2026-10-t1', role: task.role, displayName: 'Grace Hopper', cohort: '2026-10' };
const version = contentVersion(courseRepo.get(C.id)?.version);

beforeEach(() => localStorage.clear());

const open = () => {
  render(<ReportIssueDialog courseId={C.id} task={task} member={me} />);
  fireEvent.click(screen.getByRole('button', { name: /Report an issue/ }));
};

describe('ReportIssueDialog — R120', () => {
  it('offers the whole task and every step of it, and says what is sent with the report', () => {
    open();
    const picker = document.querySelector<HTMLSelectElement>('select[data-report-step]')!;
    expect([...picker.options].map((o) => o.value)).toEqual(['', ...task.steps.map((s) => s.id)]);
    expect(picker.options[0].textContent).toBe('The whole task');
    expect(picker.options[1].textContent).toMatch(/^Step 1: /);
    expect(document.querySelector('[data-report-stamp]')!.textContent).toContain(`course version ${version}`);
  });

  it('files the step, week, name, role and version with the report', () => {
    open();
    const step = task.steps[1];
    fireEvent.change(document.querySelector('select[data-report-step]')!, { target: { value: step.id } });
    fireEvent.click(screen.getByLabelText(/Something is broken/));
    fireEvent.change(screen.getByPlaceholderText(/The command in step 3/), { target: { value: '  the flag is rejected  ' } });
    fireEvent.click(screen.getByRole('button', { name: /Send report/ }));
    const [r] = taskReportsRepo.list(C.id);
    expect(r).toMatchObject({
      courseId: C.id,
      taskId: task.id,
      teamId: me.teamId,
      memberId: me.memberId,
      kind: 'broken',
      note: 'the flag is rejected',
      status: 'open',
      stepId: step.id,
      week: task.week,
      reporterName: 'Grace Hopper',
      reporterRole: task.role,
      contentVersion: version,
    });
  });

  it('takes the whole note when it is typed a key at a time (R123: it used to take one character)', async () => {
    const user = userEvent.setup();
    open();
    const field = screen.getByPlaceholderText(/The command in step 3/);
    const said = 'The command in step 3 returns an error, and the flag is rejected.';
    await user.type(field, said);
    expect(field).toHaveValue(said);
    expect(field, 'focus stayed in the field').toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: /Send report/ }));
    expect(taskReportsRepo.list(C.id)[0].note).toBe(said);
  });

  it('files a report on the whole task when no step is picked', () => {
    open();
    fireEvent.click(screen.getByRole('button', { name: /Send report/ }));
    const [r] = taskReportsRepo.list(C.id);
    expect(r.stepId).toBeUndefined();
    expect(r.week).toBe(task.week);
    expect(r.kind).toBe('unclear');
  });
});
