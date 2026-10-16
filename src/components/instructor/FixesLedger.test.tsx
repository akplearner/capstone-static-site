import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { FixesLedger, LEDGER_COPY } from './FixesLedger';
import { SECURITY_PLUS } from '@/lib/data/seed/securityPlus';
import { changesFrom, fixDraft, foldDraft, ledger, newFix, revertDraft, type ContentFix, type LedgerRow } from '@/lib/contentFix';
import type { Course } from '@/lib/types';

/**
 * R121 — the ledger: every revision with who, when, where, what changed and where it
 * stands, newest first; revert and mark-in-code for the admin; the two downloads.
 */
const base = SECURITY_PLUS as Course;
const task = base.tasks[0];
const [s1, s2] = task.steps;
const at = (n: number) => `2026-10-${String(10 + n).padStart(2, '0')}T09:00:00.000Z`;
const stamp = (revision: number, by = 'Ana Admin') => ({ id: `f${revision}`, revision, docVersion: 1, by, at: at(revision) });

const fix1 = newFix(base.id, fixDraft('Reword the first step', changesFrom(base, { taskId: task.id, stepId: s1.id }, { title: 'Reworded first step' }), ['rep-a']), stamp(1));
const fix2 = newFix(base.id, fixDraft('Reword it again', [{ taskId: task.id, stepId: s1.id, field: 'title', before: 'Reworded first step', after: 'Reworded twice' }], []), stamp(2));
const fix3 = newFix(base.id, fixDraft('Fix the second step', changesFrom(base, { taskId: task.id, stepId: s2.id }, { whatItMeans: 'A corrected sentence.' }), ['rep-b', 'rep-gone']), stamp(3, 'Ben Admin'));

function setup(fixes: ContentFix[], over: Partial<Parameters<typeof FixesLedger>[0]> = {}) {
  const rows: LedgerRow[] = ledger(base, fixes);
  const effective = { ...base, revision: fixes.reduce((n, f) => Math.max(n, f.revision), 0) } as Course;
  const handlers = { onRevert: vi.fn<(fix: ContentFix) => Promise<boolean>>(async () => true), onFold: vi.fn<(revisions: number[], foldedIn: string) => Promise<boolean>>(async () => true), onBundle: vi.fn(), onDocument: vi.fn() };
  const view = render(
    <FixesLedger course={effective} rows={rows} reporters={(id) => ({ 'rep-a': 'Ada Lovelace', 'rep-b': 'Ben Carter' })[id]} canEdit needsUpdate={false} local={false} {...handlers} {...over} />
  );
  const ids = () => [...view.container.querySelectorAll('[data-fix-row]')].map((e) => Number(e.getAttribute('data-fix-row')));
  const row = (rev: number) => view.container.querySelector(`[data-fix-row="${rev}"]`) as HTMLElement;
  return { ...view, ...handlers, ids, row };
}

describe('FixesLedger', () => {
  it('says so when a course has no fixes, and offers no bundle', () => {
    const { container } = setup([]);
    expect(screen.getByText(LEDGER_COPY.none)).toBeInTheDocument();
    expect(container.querySelector('[data-fixes-bundle]')).toBeDisabled();
    expect(container.querySelector('[data-fixes-banner]')).toBeNull();
    expect(container.querySelector('[data-fixes-version]')!.textContent).toBe('v1.0');
  });

  it('lists the newest first, each with its version, kind, state, who, when and the reports it answers', () => {
    const { ids, row, container } = setup([fix1, fix2, fix3]);
    expect(ids()).toEqual([3, 2, 1]);
    expect(container.querySelector('[data-fixes-version]')!.textContent, 'the course’s version heads the list').toBe('v1.3');
    const r3 = row(3);
    expect(r3.querySelector('[data-fix-version]')!.textContent).toBe('v1.3');
    expect(r3.textContent).toContain('Fix');
    expect(r3.textContent).toContain('Live');
    expect(r3.textContent).toContain('Ben Admin');
    expect(r3.textContent).toContain('Fix the second step');
    // A report the roster no longer knows is counted, not shown as an id.
    expect(r3.textContent).toContain('answers Ben Carter');
    expect(row(1).textContent).toContain('answers Ada Lovelace');
    expect(row(2).textContent).not.toContain('answers');
    for (const rev of [1, 2, 3]) expect(row(rev).querySelector('[data-fix-state-chip]')!.textContent).toBe('Live');
  });

  it('names each person once, and counts the reports when one person filed several', () => {
    const twice = newFix(base.id, fixDraft('Answer both', changesFrom(base, { taskId: task.id, stepId: s2.id }, { title: 'Answered' }), ['rep-a', 'rep-a2', 'rep-b']), stamp(1));
    const { row } = setup([twice], { reporters: (id) => ({ 'rep-a': 'Ada Lovelace', 'rep-a2': 'Ada Lovelace', 'rep-b': 'Ben Carter' })[id] });
    expect(row(1).textContent).toContain('answers Ada Lovelace, Ben Carter (3 reports)');
    expect(row(1).textContent).not.toContain('Ada Lovelace, Ada Lovelace');
    const unknown = newFix(base.id, fixDraft('Answer', changesFrom(base, { taskId: task.id, stepId: s2.id }, { title: 'Answered' }), ['x', 'y']), stamp(1));
    const again = setup([unknown], { reporters: () => undefined });
    expect(again.row(1).textContent).toContain('answers 2 reports');
  });

  it('shows each change in place, before and after, labelled in words and never by colour alone', () => {
    const { row } = setup([fix1]);
    const changes = row(1).querySelector('[data-fix-changes]') as HTMLDetailsElement;
    expect(changes.textContent).toContain('1 change');
    const one = changes.querySelector('[data-fix-change]')!;
    expect(one.textContent).toContain(task.title);
    expect(one.textContent).toContain(`Step 1: ${s1.title}`);
    expect(one.textContent).toContain('Step title');
    const was = within(one as HTMLElement).getByText(LEDGER_COPY.was).parentElement!;
    const now = within(one as HTMLElement).getByText(LEDGER_COPY.now).parentElement!;
    expect(was.textContent).toContain(s1.title);
    expect(now.textContent).toContain('Reworded first step');
  });

  it('counts the states, and says how many live fixes are not in the code yet', () => {
    const revert = newFix(base.id, revertDraft(fix3), stamp(4));
    const fold = newFix(base.id, foldDraft([1], 'deploy of 20 October'), stamp(5));
    const { container, row } = setup([fix1, fix3, revert, fold]);
    const count = (k: string) => container.querySelector(`[data-fixes-count="${k}"]`)!.textContent;
    expect([count('live'), count('in_code'), count('reverted')]).toEqual(['0 live', '1 in code', '1 reverted']);
    expect(container.querySelector('[data-fixes-banner]')).toBeNull();
    expect(row(1).querySelector('[data-fix-state-chip]')!.textContent).toBe('In code');
    expect(row(3).querySelector('[data-fix-state-chip]')!.textContent).toBe('Reverted');
    expect(row(4).getAttribute('data-fix-kind')).toBe('revert');
    expect(row(5).textContent).toContain('Marked in code');
    expect(row(5).textContent).toContain('shipped in deploy of 20 October');
    expect(row(4).querySelector('[data-fix-state-chip]'), 'a revert is a record, not a state').toBeNull();
  });

  it('banners the live fixes that are not in the code, with what to do', () => {
    const { container, rerender } = setup([fix1]);
    expect(container.querySelector('[data-fixes-banner]')!.textContent).toContain(LEDGER_COPY.liveOne);
    expect(container.querySelector('[data-fixes-banner]')!.textContent).toContain('Download the fix bundle');
    rerender(<FixesLedger course={base} rows={ledger(base, [fix1, fix3])} reporters={() => undefined} canEdit needsUpdate={false} local={false} onRevert={async () => true} onFold={async () => true} onBundle={() => {}} onDocument={() => {}} />);
    expect(container.querySelector('[data-fixes-banner]')!.textContent).toContain('2 live fixes are not in the code yet.');
  });

  it('reverts a fix that is still the text, after a confirmation, and says why one cannot be reverted yet', async () => {
    const { container, row, onRevert } = setup([fix1, fix2, fix3]);
    // Revision 1’s text was changed again by revision 2: revert that first.
    expect(row(1).querySelector('[data-fix-revert]')).toBeDisabled();
    expect(row(1).querySelector('[data-fix-blocked]')!.textContent).toBe('Changed again in revision 2. Revert that first.');
    expect(row(2).querySelector('[data-fix-revert]')).toBeEnabled();
    expect(row(2).querySelector('[data-fix-blocked]')).toBeNull();
    fireEvent.click(row(3).querySelector('[data-fix-revert]')!);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(LEDGER_COPY.revertBody)).toBeInTheDocument();
    expect(screen.getByRole('dialog').textContent).toContain('Fix the second step');
    expect(onRevert).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onRevert).not.toHaveBeenCalled();
    fireEvent.click(row(3).querySelector('[data-fix-revert]')!);
    fireEvent.click(container.ownerDocument.querySelector('[data-fix-revert-confirm]')!);
    await waitFor(() => expect(onRevert).toHaveBeenCalledTimes(1));
    expect(onRevert.mock.calls[0][0]).toMatchObject({ revision: 3 });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('marks the picked live fixes as in code, with where they shipped', async () => {
    const { container, row, onFold } = setup([fix1, fix3]);
    const fold = container.querySelector('[data-fixes-fold]') as HTMLButtonElement;
    expect(fold).toBeDisabled();
    fireEvent.click(row(1).querySelector('[data-fix-pick]')!);
    fireEvent.click(row(3).querySelector('[data-fix-pick]')!);
    expect(fold.textContent).toContain('(2)');
    fireEvent.click(fold);
    fireEvent.change(container.ownerDocument.querySelector('[data-fold-in]')!, { target: { value: 'deploy of 20 October' } });
    fireEvent.click(container.ownerDocument.querySelector('[data-fix-fold-confirm]')!);
    await waitFor(() => expect(onFold).toHaveBeenCalledTimes(1));
    expect(onFold).toHaveBeenCalledWith([1, 3], 'deploy of 20 October');
    await waitFor(() => expect(container.querySelector('[data-fixes-fold]')).toBeDisabled());
  });

  it('keeps the selection when the record could not be saved', async () => {
    const onFold = vi.fn<(revisions: number[], foldedIn: string) => Promise<boolean>>(async () => false);
    const { container, row } = setup([fix1], { onFold });
    fireEvent.click(row(1).querySelector('[data-fix-pick]')!);
    fireEvent.click(container.querySelector('[data-fixes-fold]')!);
    fireEvent.click(container.ownerDocument.querySelector('[data-fix-fold-confirm]')!);
    await waitFor(() => expect(onFold).toHaveBeenCalledTimes(1));
    expect((row(1).querySelector('[data-fix-pick]') as HTMLInputElement).checked).toBe(true);
  });

  it('offers a reader no moves: no revert, no selection, no mark in code', () => {
    const { container, row } = setup([fix1], { canEdit: false });
    expect(row(1).querySelector('[data-fix-revert]')).toBeNull();
    expect(row(1).querySelector('[data-fix-pick]')).toBeNull();
    expect(container.querySelector('[data-fixes-fold]')).toBeNull();
    expect(container.querySelector('[data-fixes-bundle]')).toBeEnabled();
  });

  it('downloads the bundle and the live document', () => {
    const { container, onBundle, onDocument } = setup([fix1]);
    fireEvent.click(container.querySelector('[data-fixes-bundle]')!);
    fireEvent.click(container.querySelector('[data-fixes-document]')!);
    expect(onBundle).toHaveBeenCalledTimes(1);
    expect(onDocument).toHaveBeenCalledTimes(1);
  });

  it('says when the database needs its update, and that the ledger is this device’s offline', () => {
    const { container, rerender } = setup([], { needsUpdate: true, local: true });
    expect(container.querySelector('[data-fixes-update]')!.textContent).toContain('migration 0017');
    expect(screen.getByText(LEDGER_COPY.local)).toBeInTheDocument();
    rerender(<FixesLedger course={base} rows={[]} reporters={() => undefined} canEdit needsUpdate={false} local={false} onRevert={async () => true} onFold={async () => true} onBundle={() => {}} onDocument={() => {}} />);
    expect(container.querySelector('[data-fixes-update]')).toBeNull();
  });

  it('a fix whose text changed underneath it is stale and says so', () => {
    const stale = newFix(base.id, fixDraft('Gone stale', [{ taskId: task.id, stepId: s1.id, field: 'title', before: 'Not the text', after: 'Whatever' }], []), stamp(1));
    const { row, container } = setup([stale]);
    expect(row(1).querySelector('[data-fix-state-chip]')!.textContent).toBe('Stale');
    expect(container.querySelector('[data-fixes-count="stale"]')!.textContent).toBe('1 stale');
    expect(row(1).querySelector('[data-fix-revert]'), 'a stale fix has nothing to revert').toBeNull();
  });

  it('says everything in the register: impersonal, plain, no second person', () => {
    for (const [key, text] of Object.entries(LEDGER_COPY)) {
      expect(text, key).not.toMatch(/\b(you|your|yours|we|our)\b/i);
      expect(text, key).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });
});
