import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';

/**
 * R121 — the issues page, end to end on this device: the admin opens a report, fixes the text
 * it names, and the fix is a numbered revision that closes the reports about it; the Fixes view
 * shows it with its version, reverts it, and marks it in code. An instructor who is not an admin
 * sees the reports and none of the fixing.
 */
const auth = vi.hoisted(() => ({ isAdmin: true }));
vi.mock('@/lib/useInstructorAuth', () => ({ useInstructorAuth: () => ({ isAdmin: auth.isAdmin, unlocked: true, ready: true }) }));
vi.mock('@/lib/useAuth', () => ({ useAuth: () => ({ profile: { displayName: 'Ana Admin', avatarUrl: null } }) }));
vi.mock('@/components/SiteNav', () => ({ Crumbs: () => null }));
const download = vi.hoisted(() => ({ calls: [] as { name: string; text: string }[] }));
vi.mock('@/lib/download', () => ({ downloadText: (name: string, text: string) => download.calls.push({ name, text }) }));

const { default: IssuesPage } = await import('./page');
const { courseRepo, contentFixesRepo } = await import('@/lib/data');
const { invalidateContentFixes } = await import('@/lib/data/localStorageContentFixesRepo');
const { invalidateCourseCache } = await import('@/lib/data/localStorageCourseRepo');
const { KEYS } = await import('@/lib/data/keys');
const { readField } = await import('@/lib/contentFix');
const { baseCourse } = await import('@/lib/content/docs');

const ID = 'security-plus';
const base = baseCourse(ID)!;
const task = base.tasks[0];
const step = task.steps[0];

const report = (id: string, who: string, status = 'open') => ({
  id,
  courseId: ID,
  taskId: task.id,
  teamId: '2026-10-t1',
  memberId: `acct-${id}`,
  kind: 'unclear',
  note: `${who} could not follow the step`,
  status,
  at: Date.parse('2026-10-12T14:05:00Z'),
  stepId: step.id,
  week: task.week,
  reporterName: who,
  reporterRole: task.role,
  contentVersion: '1.0',
});

const reports = () => JSON.parse(localStorage.getItem(KEYS.taskReports(ID))!) as { id: string; status: string; resolutionNote?: string; fixRevision?: number }[];

beforeEach(() => {
  localStorage.clear();
  invalidateContentFixes();
  invalidateCourseCache();
  download.calls.length = 0;
  auth.isAdmin = true;
  localStorage.setItem(KEYS.taskReports(ID), JSON.stringify([report('r1', 'Ada Lovelace'), report('r2', 'Ben Carter')]));
});

const waitForBoard = async () => {
  await waitFor(() => expect(document.querySelector('[data-issue="r1"]')).not.toBeNull());
};

describe('the issues page — fixing the text from a report', () => {
  it('fixes the step a report names, closes the reports about it against the new revision, and the course reads the new words', async () => {
    render(<IssuesPage />);
    await waitForBoard();
    const card = document.querySelector('[data-issue="r1"]') as HTMLElement;
    fireEvent.click(card.querySelector('[data-fix-open]')!);
    const target = card.querySelector('[data-fix-target]') as HTMLSelectElement;
    expect(target.value, 'it opens on the step the reporter named').toBe(step.id);

    const title = card.querySelector('[data-fix-field="title"] input') as HTMLInputElement;
    fireEvent.change(title, { target: { value: 'A step that reads clearly' } });
    fireEvent.change(card.querySelector('[data-fix-summary]')!, { target: { value: 'Rename the step so it says what it does' } });
    fireEvent.click(card.querySelector('[data-fix-also]')!);
    fireEvent.change(card.querySelector('[data-fix-note]')!, { target: { value: 'Renamed the step' } });
    fireEvent.click(card.querySelector('[data-fix-save]')!);

    await waitFor(() => expect(contentFixesRepo.list(ID)).toHaveLength(1));
    const fix = contentFixesRepo.list(ID)[0];
    expect(fix).toMatchObject({ revision: 1, kind: 'fix', summary: 'Rename the step so it says what it does', by: 'Ana Admin' });
    expect(fix.issueIds.sort()).toEqual(['r1', 'r2']);
    expect(fix.changes).toEqual([{ taskId: task.id, stepId: step.id, field: 'title', before: step.title, after: 'A step that reads clearly' }]);

    // Both reports are closed against revision 1, with the note.
    await waitFor(() => expect(reports().every((r) => r.status === 'resolved')).toBe(true));
    expect(reports().map((r) => [r.fixRevision, r.resolutionNote])).toEqual([[1, 'Renamed the step'], [1, 'Renamed the step']]);

    // The course every student reads has the new words and the new version.
    const course = courseRepo.get(ID)!;
    expect(readField(course, { taskId: task.id, stepId: step.id }, 'title')).toBe('A step that reads clearly');
    expect(course.revision).toBe(1);
    expect(step.title, 'the shipped course is untouched').not.toBe('A step that reads clearly');

    // The reports show where they were fixed.
    fireEvent.click(screen.getByRole('tab', { name: /Complete/ }));
    await waitFor(() => expect(document.querySelectorAll('[data-issue-fix]')).toHaveLength(2));
    expect(document.querySelector('[data-issue-fix]')!.textContent).toContain('fixed in revision 1');
  });

  it('keeps the fix and leaves the report open when it is not ticked to close', async () => {
    render(<IssuesPage />);
    await waitForBoard();
    const card = document.querySelector('[data-issue="r1"]') as HTMLElement;
    fireEvent.click(card.querySelector('[data-fix-open]')!);
    fireEvent.change(card.querySelector('[data-fix-field="title"] input')!, { target: { value: 'Renamed, report left open' } });
    fireEvent.click(card.querySelector('[data-fix-resolve]')!);
    fireEvent.click(card.querySelector('[data-fix-save]')!);
    await waitFor(() => expect(contentFixesRepo.list(ID)).toHaveLength(1));
    expect(contentFixesRepo.list(ID)[0].issueIds).toEqual([]);
    expect(reports().map((r) => r.status)).toEqual(['open', 'open']);
  });

  it('the Fixes view lists the revision with its version, reverts it, marks the rest in code, and downloads the bundle', async () => {
    render(<IssuesPage />);
    await waitForBoard();
    const card = document.querySelector('[data-issue="r1"]') as HTMLElement;
    fireEvent.click(card.querySelector('[data-fix-open]')!);
    fireEvent.change(card.querySelector('[data-fix-field="title"] input')!, { target: { value: 'First reword' } });
    fireEvent.click(card.querySelector('[data-fix-save]')!);
    await waitFor(() => expect(contentFixesRepo.list(ID)).toHaveLength(1));

    fireEvent.click(screen.getByRole('tab', { name: 'Fixes' }));
    const ledger = await waitFor(() => {
      const el = document.querySelector('[data-fixes-ledger]');
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });
    expect((document.querySelector('[data-fixes-course]') as HTMLSelectElement).value, 'opens on the course that has a fix').toBe(ID);
    const row = ledger.querySelector('[data-fix-row="1"]') as HTMLElement;
    expect(row.querySelector('[data-fix-version]')!.textContent).toBe('v1.1');
    expect(row.textContent).toContain('Ana Admin');
    expect(row.textContent).toContain('answers Ada Lovelace');
    expect(ledger.querySelector('[data-fixes-version]')!.textContent).toBe('v1.1');

    fireEvent.click(ledger.querySelector('[data-fixes-bundle]')!);
    expect(download.calls[0].name).toMatch(/^security-plus_fixes_v1\.1_\d{4}-\d{2}-\d{2}\.json$/);
    const bundle = JSON.parse(download.calls[0].text);
    expect(bundle).toMatchObject({ schema: 'capstone-content-fixes/1', courseId: ID, version: '1.1' });
    expect(bundle.seedFile, 'the file to fold it into').toMatch(/seed\/securityPlus\.ts$/);
    expect(bundle.live[0].changes[0]).toMatchObject({ field: 'title', before: step.title, after: 'First reword', stepTitle: step.title });

    fireEvent.click(ledger.querySelector('[data-fixes-document]')!);
    expect(JSON.parse(download.calls[1].text)).toMatchObject({ revision: 1, schema: 'capstone-course-dto/1' });

    // Revert: a new revision, and the words are back.
    fireEvent.click(row.querySelector('[data-fix-revert]')!);
    fireEvent.click(document.querySelector('[data-fix-revert-confirm]')!);
    await waitFor(() => expect(contentFixesRepo.list(ID)).toHaveLength(2));
    expect(contentFixesRepo.list(ID)[1]).toMatchObject({ revision: 2, kind: 'revert', reverts: 1 });
    expect(readField(courseRepo.get(ID)!, { taskId: task.id, stepId: step.id }, 'title')).toBe(step.title);
    await waitFor(() => expect(document.querySelector('[data-fix-row="1"]')!.getAttribute('data-fix-state')).toBe('reverted'));
    expect(document.querySelector('[data-fixes-version]')!.textContent).toBe('v1.2');
  });

  it('marks live fixes as in code and moves them out of the banner', async () => {
    render(<IssuesPage />);
    await waitForBoard();
    const card = document.querySelector('[data-issue="r1"]') as HTMLElement;
    fireEvent.click(card.querySelector('[data-fix-open]')!);
    fireEvent.change(card.querySelector('[data-fix-field="title"] input')!, { target: { value: 'Folded title' } });
    fireEvent.click(card.querySelector('[data-fix-save]')!);
    await waitFor(() => expect(contentFixesRepo.list(ID)).toHaveLength(1));
    fireEvent.click(screen.getByRole('tab', { name: 'Fixes' }));
    await waitFor(() => expect(document.querySelector('[data-fixes-banner]')).not.toBeNull());
    fireEvent.click(document.querySelector('[data-fix-pick]')!);
    fireEvent.click(document.querySelector('[data-fixes-fold]')!);
    fireEvent.change(document.querySelector('[data-fold-in]')!, { target: { value: 'deploy of 20 October' } });
    fireEvent.click(document.querySelector('[data-fix-fold-confirm]')!);
    await waitFor(() => expect(contentFixesRepo.list(ID)).toHaveLength(2));
    expect(contentFixesRepo.list(ID)[1]).toMatchObject({ revision: 2, kind: 'fold', folds: [1], foldedIn: 'deploy of 20 October' });
    await waitFor(() => expect(document.querySelector('[data-fixes-banner]')).toBeNull());
    expect(document.querySelector('[data-fix-row="1"]')!.getAttribute('data-fix-state')).toBe('in_code');
    expect(readField(courseRepo.get(ID)!, { taskId: task.id, stepId: step.id }, 'title'), 'a fold changes no text').toBe('Folded title');
  });
});

describe('the issues page — an instructor who is not an admin', () => {
  it('sees the reports and can move their status, but is offered no fixing and no Fixes view', async () => {
    auth.isAdmin = false;
    render(<IssuesPage />);
    await waitForBoard();
    expect(document.querySelector('[data-fix-open]')).toBeNull();
    expect(document.querySelector('[data-issues-view]')).toBeNull();
    const card = document.querySelector('[data-issue="r1"]') as HTMLElement;
    expect(within(card).getByLabelText(/Status of the report by Ada Lovelace/)).toBeInTheDocument();
  });
});
