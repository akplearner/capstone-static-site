import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HistoryPanel, HISTORY_COPY } from './HistoryPanel';
import type { CourseVersionEntry } from '@/lib/data/types';

/**
 * R122 — the History tab: every save of the course with its number, who and when, download any,
 * and restore any as a new version after asking.
 */
const v = (version: number, over: Partial<CourseVersionEntry> = {}): CourseVersionEntry => ({
  version,
  savedAt: Date.parse('2026-10-12T14:05:00Z') + version * 3600_000,
  by: 'Ana Admin',
  title: `CCNA edit ${version}`,
  bytes: 150_000 + version,
  ...over,
});

function setup(over: Partial<Parameters<typeof HistoryPanel>[0]> = {}) {
  const onRestore = vi.fn<(version: number) => Promise<boolean>>(async () => true);
  const onDownload = vi.fn<(version: number) => void>();
  const view = render(<HistoryPanel versions={[v(3), v(2), v(1, { by: '' })]} loaded current={3} builtIn={false} needsUpdate={false} local={false} onRestore={onRestore} onDownload={onDownload} {...over} />);
  const rows = () => [...view.container.querySelectorAll('[data-history-row]')].map((e) => Number(e.getAttribute('data-history-row')));
  const row = (n: number) => view.container.querySelector(`[data-history-row="${n}"]`) as HTMLElement;
  return { ...view, onRestore, onDownload, rows, row };
}

describe('HistoryPanel', () => {
  it('lists each save with its number, title, who, when and size, and marks the current one', () => {
    const { rows, row } = setup();
    expect(rows()).toEqual([3, 2, 1]);
    expect(row(3).textContent).toContain('v3');
    expect(row(3).textContent).toContain('Current');
    expect(row(3).textContent).toContain('CCNA edit 3');
    expect(row(3).textContent).toContain('by Ana Admin');
    expect(row(3).textContent).toMatch(/146 KB|147 KB/);
    expect(row(2).textContent).not.toContain('Current');
    expect(row(1).textContent, 'a save with no name is not left blank').toContain('by Unnamed');
    expect(row(3).querySelector('[data-history-restore]'), 'the current version has nothing to restore').toBeDisabled();
    expect(row(2).querySelector('[data-history-restore]')).toBeEnabled();
    expect(row(3).getAttribute('data-history-current')).toBe('true');
  });

  it('downloads any version', () => {
    const { row, onDownload } = setup();
    fireEvent.click(row(2).querySelector('[data-history-download]')!);
    expect(onDownload).toHaveBeenCalledWith(2);
  });

  it('asks before restoring, says nothing is lost, and restores the one chosen', async () => {
    const { row, onRestore } = setup();
    fireEvent.click(row(2).querySelector('[data-history-restore]')!);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('dialog').textContent).toContain('v2: CCNA edit 2');
    expect(screen.getByText(HISTORY_COPY.restoreBody)).toBeInTheDocument();
    expect(onRestore).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onRestore).not.toHaveBeenCalled();
    fireEvent.click(row(2).querySelector('[data-history-restore]')!);
    fireEvent.click(document.querySelector('[data-history-restore-confirm]')!);
    await waitFor(() => expect(onRestore).toHaveBeenCalledWith(2));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('says what to expect for a built-in course never edited, for a course with no saves, and while the list is still loading', () => {
    const builtIn = setup({ versions: [], builtIn: true });
    expect(screen.getByText(HISTORY_COPY.builtIn)).toBeInTheDocument();
    builtIn.unmount();
    const none = setup({ versions: [] });
    expect(screen.getByText(HISTORY_COPY.none)).toBeInTheDocument();
    none.unmount();
    const loading = setup({ versions: [], loaded: false });
    expect(loading.container.textContent).not.toContain(HISTORY_COPY.none);
  });

  it('says the database needs its update, and that this device keeps only a few saves offline', () => {
    const { container } = setup({ versions: [], needsUpdate: true, local: true });
    expect(container.querySelector('[data-history-update]')!.textContent).toContain('migration 0018');
    expect(screen.getByText(HISTORY_COPY.local)).toBeInTheDocument();
    expect(container.textContent, 'not "no versions yet" when the table does not exist').not.toContain(HISTORY_COPY.none);
  });

  it('says everything in the register: impersonal, plain, no second person', () => {
    for (const [key, text] of Object.entries(HISTORY_COPY)) {
      expect(text, key).not.toMatch(/\b(you|your|yours|we|our)\b/i);
      expect(text, key).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });
});
