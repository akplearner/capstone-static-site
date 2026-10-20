import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { IssuesBoard, ISSUES_COPY } from './IssuesBoard';
import { AZURE_FUNDAMENTALS } from '@/lib/data/seed/azureCloud';
import { SECURITY_PLUS } from '@/lib/data/seed/securityPlus';
import type { IssuesData } from '@/lib/data/issuesLoader';
import type { TaskReport } from '@/lib/data/types';
import type { IssueDto } from '@/lib/issueInbox';
import { splitRoleName } from '@/lib/docs/roles';
import { allText } from '@/test/pdfRead';

/**
 * R120 — the inbox: four tabs with true counts, filters that only offer what exists,
 * a group-by-task view, who/when/where/role/version on every card, and the
 * instructor's status and note.
 */
const download = vi.hoisted(() => ({ calls: [] as { name: string; text: string; type?: string }[], files: [] as { name: string; bytes: Uint8Array; type?: string }[] }));
vi.mock('@/lib/download', () => ({
  downloadText: (name: string, text: string, type?: string) => download.calls.push({ name, text, type }),
  downloadBytes: (name: string, bytes: Uint8Array, type?: string) => download.files.push({ name, bytes, type }),
}));

const A = AZURE_FUNDAMENTALS;
const S = SECURITY_PLUS;
const arch = A.tasks.find((t) => t.id === 'az-w1-arch')!;
const dev = A.tasks.find((t) => t.id === 'az-w1-dev')!;
const red = S.tasks.find((t) => t.role === 'red' && t.week === 2)!;
const at = (iso: string) => Date.parse(iso);

const base = { teamId: '2026-10-t1', memberId: 'acct-1', kind: 'broken' as const, note: '', status: 'open' as const };
const reports: TaskReport[] = [
  { ...base, id: 'a', courseId: A.id, taskId: arch.id, kind: 'unclear', note: 'Which subscription?', reporterName: 'Ada Lovelace', reporterRole: 'infra', contentVersion: '1.7', at: at('2026-10-12T14:05:00Z') },
  { ...base, id: 'b', courseId: A.id, taskId: arch.id, kind: 'broken', note: 'az login fails', stepId: arch.steps[1].id, reporterName: 'Ben Carter', reporterRole: 'dev', status: 'in_progress', at: at('2026-10-11T09:00:00Z') },
  { ...base, id: 'c', courseId: S.id, taskId: red.id, kind: 'outdated', note: 'Old screenshot', reporterName: 'Cy Young', reporterRole: 'red', teamId: '2026-10-t2', status: 'resolved', resolutionNote: 'Updated the screenshot', resolvedAt: at('2026-10-13T08:00:00Z'), resolvedBy: 'acct-ivy', at: at('2026-10-10T00:00:00Z') },
  { ...base, id: 'd', courseId: A.id, taskId: dev.id, kind: 'question', note: 'Why a VNet?', reporterName: 'Ada Lovelace', reporterRole: 'infra', status: 'wont_fix', resolutionNote: 'Explained in week 2.', at: at('2026-10-09T00:00:00Z') },
];
const data = (over: Partial<IssuesData> = {}): IssuesData => ({
  mode: 'cloud',
  reports,
  people: { nameOf: () => undefined, roleOf: () => undefined, resolverName: (id) => (id === 'acct-ivy' ? 'Ivy Instructor' : undefined) },
  needsUpdate: false,
  ...over,
});

function setup(over: { data?: IssuesData; onSave?: (i: IssueDto, p: { status: string; note: string }) => Promise<boolean>; initial?: Parameters<typeof IssuesBoard>[0]['initial']; renderExtra?: (i: IssueDto) => React.ReactNode } = {}) {
  const onSave = vi.fn(over.onSave ?? (async () => true));
  const onRefresh = vi.fn();
  const view = render(<IssuesBoard courses={[A, S]} data={over.data ?? data()} onSave={onSave} onRefresh={onRefresh} initial={over.initial} renderExtra={over.renderExtra} />);
  const ids = () => [...view.container.querySelectorAll('[data-issue]')].map((e) => e.getAttribute('data-issue'));
  const count = (tab: string) => view.container.querySelector(`[data-issues-count="${tab}"]`)!.textContent;
  const pick = (label: RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
  return { ...view, onSave, onRefresh, ids, count, pick };
}

beforeEach(() => {
  download.calls.length = 0;
  download.files.length = 0;
});

describe('IssuesBoard', () => {
  it('opens on the pending tab, with a true count on every tab', () => {
    const { ids, count } = setup();
    expect(screen.getByRole('tab', { name: /Pending/ })).toHaveAttribute('aria-selected', 'true');
    expect(ids().sort()).toEqual(['a', 'b']);
    expect([count('pending'), count('complete'), count('wont_fix'), count('all')]).toEqual(['2', '1', '1', '4']);
    fireEvent.click(screen.getByRole('tab', { name: /Complete/ }));
    expect(ids()).toEqual(['c']);
    fireEvent.click(screen.getByRole('tab', { name: /Won’t fix/ }));
    expect(ids()).toEqual(['d']);
    fireEvent.click(screen.getByRole('tab', { name: /All/ }));
    expect(ids().sort()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('says on every card who, when, where, in what role, on which version, and where it stands', () => {
    const { container } = setup({ initial: { tab: 'all' } });
    const a = container.querySelector('[data-issue="a"]')! as HTMLElement;
    expect(a.querySelector('[data-issue-meta]')!.textContent).toContain('Ada Lovelace');
    expect(a.querySelector('[data-issue-meta]')!.textContent).toContain(splitRoleName(A.roles.find((r) => r.id === 'infra')!.name).fn);
    expect(a.querySelector('[data-issue-meta]')!.textContent).toContain('Team 1');
    expect(a.querySelector('[data-issue-where]')!.textContent).toContain(`${A.title} › Week 1 › ${arch.title}`);
    expect(a.querySelector('[data-issue-where]')!.textContent).toContain(`task for ${splitRoleName(A.roles.find((r) => r.id === 'arch')!.name).fn}`);
    expect(within(a).getByText('saw v1.7')).toBeInTheDocument();
    expect(a.querySelector('[data-issue-status]')).toHaveAttribute('data-issue-status', 'open');
    expect(a.querySelector('[data-issue-kind]')).toHaveTextContent('Instructions unclear');
    const b = container.querySelector('[data-issue="b"]')! as HTMLElement;
    expect(b.querySelector('[data-issue-where]')!.textContent).toContain(`Step 2: ${arch.steps[1].title}`);
    expect(b.querySelector('[data-issue-status]')).toHaveTextContent('In progress');
    expect(b.querySelector('[data-issue-version]')).toBeNull();
    const c = container.querySelector('[data-issue="c"]')! as HTMLElement;
    expect(c.querySelector('[data-issue-resolution]')!.textContent).toContain('Resolved by Ivy Instructor');
    expect(c.querySelector('[data-issue-resolution]')!.textContent).toContain('Updated the screenshot');
    expect(c.querySelector('[data-issue-open]')).toHaveAttribute('href', `/courses/${S.id}?tab=tasks&week=2&task=${red.id}`);
    expect(b.querySelector('[data-issue-open]')).toHaveAttribute('href', `/courses/${A.id}?tab=tasks&week=1&task=${arch.id}&step=${arch.steps[1].id}`);
  });

  it('filters by course, week, both roles, kind, reporter and words, and the tabs count what is left', () => {
    const { ids, count, pick } = setup({ initial: { tab: 'all' } });
    pick(/^Course/, S.id);
    expect(ids()).toEqual(['c']);
    expect(count('all')).toBe('1');
    pick(/^Course/, '');
    pick(/^Reporter’s role/, 'infra');
    expect(ids().sort()).toEqual(['a', 'd']);
    pick(/^Task’s role/, 'dev');
    expect(ids()).toEqual(['d']);
    pick(/^Task’s role/, '');
    pick(/^Reporter’s role/, '');
    pick(/^Kind/, 'broken');
    expect(ids()).toEqual(['b']);
    pick(/^Kind/, '');
    pick(/^Reporter$/, 'Ada Lovelace');
    expect(ids().sort()).toEqual(['a', 'd']);
    pick(/^Reporter$/, '');
    pick(/^Week/, '2');
    expect(ids()).toEqual(['c']);
    pick(/^Week/, '');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'az login' } });
    expect(ids()).toEqual(['b']);
    expect(count('pending')).toBe('1');
    fireEvent.click(screen.getByText('Clear filters'));
    expect(ids().sort()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('offers a filter only the values that exist', () => {
    setup();
    const course = screen.getByLabelText(/^Course/) as HTMLSelectElement;
    expect([...course.options].map((o) => o.value).sort()).toEqual(['', A.id, S.id].sort());
    const kind = screen.getByLabelText(/^Kind/) as HTMLSelectElement;
    expect([...kind.options].map((o) => o.value)).toEqual(['', 'unclear', 'broken', 'question', 'outdated']);
  });

  it('groups by task by default, the task with most pending reports first, and lists flat on request', () => {
    const { container } = setup();
    const groups = [...container.querySelectorAll('[data-issue-group]')];
    expect(groups.map((g) => g.getAttribute('data-issue-group'))).toEqual([arch.id]);
    expect(groups[0].textContent).toContain('2 pending of 2');
    expect(within(groups[0] as HTMLElement).getByText(/1 instructions unclear/)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/Group by task/));
    expect(container.querySelectorAll('[data-issue-group]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-issue]')).toHaveLength(2);
  });

  it('opens a filtered view from a link: the course and the tab', () => {
    const { ids } = setup({ initial: { courseId: S.id, tab: 'complete' } });
    expect(ids()).toEqual(['c']);
    expect(screen.getByRole('tab', { name: /Complete/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('saves a status and a note for the reporter, only once something changed', async () => {
    const { container, onSave } = setup();
    const a = container.querySelector('[data-issue="a"]')! as HTMLElement;
    const save = a.querySelector('[data-issue-save]') as HTMLButtonElement;
    expect(save).toBeDisabled();
    fireEvent.change(within(a).getByLabelText(/Status of the report by Ada/), { target: { value: 'resolved' } });
    fireEvent.change(within(a).getByPlaceholderText(/What changed/), { target: { value: '  Added the subscription to step 1  ' } });
    expect(save).toBeEnabled();
    fireEvent.click(save);
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const [issue, patch] = onSave.mock.calls[0];
    expect(issue.id).toBe('a');
    expect(patch).toEqual({ status: 'resolved', note: 'Added the subscription to step 1' });
  });

  it('exports what is on screen as a CSV and a PDF, and no JSON file', () => {
    const { container } = setup();
    fireEvent.click(container.querySelector('[data-issues-csv]')!);
    fireEvent.click(container.querySelector('[data-issues-pdf]')!);
    expect(container.querySelector('[data-issues-json]')).toBeNull();
    expect(download.calls).toHaveLength(1); // the CSV is the only text file
    const [csv] = download.calls;
    expect(csv.name).toMatch(/^issues_\d{4}-\d{2}-\d{2}\.csv$/);
    expect(csv.text.split('\r\n')[0]).toContain('reported_at');
    expect(csv.text).toContain('Which subscription?');
    expect(csv.text).not.toContain('Old screenshot');
    // R127: the PDF is the same list: the pending tab, with the filters said on the first page
    const [pdf] = download.files;
    expect(pdf.name).toMatch(/^capstone-issues_\d{4}-\d{2}-\d{2}\.pdf$/);
    expect(pdf.type).toBeUndefined(); // the helper's default is application/pdf
    expect(new TextDecoder().decode(pdf.bytes.slice(0, 8))).toBe('%PDF-1.4');
    const text = allText(pdf.bytes).replace(/\s+/g, ' ');
    expect(text).toContain('Pending · all courses');
    expect(text).toContain('Which subscription?');
    expect(text).toContain('az login fails');
    expect(text).toContain('Ada Lovelace');
    expect(text).not.toContain('Old screenshot'); // resolved: not on this tab
    expect(text).not.toContain('Why a VNet?'); // won't fix: not on this tab
  });

  it('says the filters in force on the PDF, and cannot make one of an empty list', () => {
    const { container, pick } = setup({ initial: { tab: 'all' } });
    pick(/^Course/, A.id);
    pick(/^Kind/, 'broken');
    fireEvent.click(container.querySelector('[data-issues-pdf]')!);
    const text = allText(download.files[0].bytes).replace(/\s+/g, ' ');
    expect(text).toContain(`All · ${A.title} · Something is broken`);
    expect(text).toContain('az login fails');
    expect(text).not.toContain('Which subscription?');
    pick(/^Course/, S.id);
    pick(/^Kind/, 'broken');
    expect(container.querySelector('[data-issues-pdf]')).toBeDisabled();
  });

  it('says so when the database needs its update, and when it holds only this device', () => {
    const { container, rerender } = setup({ data: data({ needsUpdate: true }) });
    expect(container.querySelector('[data-issues-update]')!.textContent).toBe(ISSUES_COPY.update);
    rerender(<IssuesBoard courses={[A, S]} data={data({ mode: 'local' })} onSave={async () => true} onRefresh={() => {}} />);
    expect(screen.getByText(ISSUES_COPY.local)).toBeInTheDocument();
    expect(container.querySelector('[data-issues-update]')).toBeNull();
  });

  it('has an empty state for no reports at all and another for none that match', () => {
    const empty = setup({ data: data({ reports: [] }) });
    expect(screen.getByText(ISSUES_COPY.none)).toBeInTheDocument();
    empty.unmount();
    const { pick } = setup({ initial: { tab: 'all' } });
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzz-no-such-word' } });
    expect(screen.getByText(ISSUES_COPY.noMatch)).toBeInTheDocument();
    void pick;
  });

  it('gives the admin’s fix panel a place under each report', () => {
    const { container } = setup({ renderExtra: (i) => <div data-extra={i.id}>fix panel</div> });
    expect([...container.querySelectorAll('[data-extra]')].map((e) => e.getAttribute('data-extra')).sort()).toEqual(['a', 'b']);
  });
});
