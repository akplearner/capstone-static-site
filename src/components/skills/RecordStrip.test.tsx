import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShieldCheck, Terminal } from 'lucide-react';
import { RecordDetailPanel, RecordStrip, RECORD_UI, SHOWN, type RecordTile } from './RecordStrip';
import { DETAIL_COPY, type DetailItem, type MetricDetail } from '@/lib/recordDetail';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * R126 — the strip and its panel, props only. The page counts the figures and builds the lists; these
 * draw them: a button per figure that says whether it is open, a panel that names the figure and what
 * it counts, entries with their marks, code and links, and six entries before "Show all".
 */
const tiles: RecordTile[] = [
  { id: 'steps-verified', icon: ShieldCheck, label: 'Steps verified', value: '4', sub: 'of 11 checkable', ring: { value: 4, max: 11 } },
  { id: 'evidence', icon: Terminal, label: 'Evidence hashed', value: '0', sub: 'files in the custody log' },
];
const item = (n: number, over: Partial<DetailItem> = {}): DetailItem => ({ key: `k${n}`, label: `Step ${n}`, sub: 'Week 1 · Recon', href: `/courses/c?tab=tasks&week=1&task=t${n}`, marks: ['verified'], ...over });
const detail = (n: number): MetricDetail => ({ metric: 'steps-verified', rule: 'Checkable steps whose pasted output matched.', sections: [{ id: 'primary', title: 'Steps', items: Array.from({ length: n }, (_, i) => item(i)) }] });

describe('RecordStrip', () => {
  it('a button per figure, saying whether it is open and what it controls', () => {
    const onToggle = vi.fn();
    render(<RecordStrip tiles={tiles} open="steps-verified" onToggle={onToggle} panelId="p1" />);
    const open = document.querySelector('[data-record-tile="steps-verified"]')!;
    const shut = document.querySelector('[data-record-tile="evidence"]')!;
    expect(open.getAttribute('aria-expanded')).toBe('true');
    expect(shut.getAttribute('aria-expanded')).toBe('false');
    expect(open.getAttribute('aria-controls')).toBe('p1');
    expect(open.hasAttribute('data-record-open')).toBe(true);
    fireEvent.click(shut);
    expect(onToggle).toHaveBeenCalledWith('evidence');
  });

  it('draws a ratio as a ring with its name and a plain figure as a number', () => {
    render(<RecordStrip tiles={tiles} open={null} onToggle={() => {}} panelId="p" />);
    expect(screen.getByRole('img', { name: 'Steps verified: 4 of 11' })).toBeInTheDocument();
    expect(document.querySelector('[data-record-tile="evidence"]')!.textContent).toContain('0');
  });
});

describe('RecordDetailPanel', () => {
  const panel = (d: MetricDetail, expanded: string[] = [], onExpand = vi.fn(), onClose = vi.fn()) => render(<RecordDetailPanel id="p1" title="Steps verified" detail={d} expanded={new Set(expanded)} onExpand={onExpand} onClose={onClose} />);

  it('names the figure, says what it counts, and lists each entry with its place, marks and a link', () => {
    panel(detail(2));
    expect(screen.getByRole('heading', { name: 'Steps verified: what counted' })).toBeInTheDocument();
    expect(screen.getByText('Checkable steps whose pasted output matched.')).toBeInTheDocument();
    const first = document.querySelector('[data-detail-item="k0"]')!;
    expect(first.textContent).toContain('Step 0');
    expect(first.textContent).toContain('Week 1 · Recon');
    expect(first.textContent).toContain('Verified');
    expect(first.querySelector('a')!.getAttribute('href')).toBe('/courses/c?tab=tasks&week=1&task=t0');
    expect(screen.getAllByRole('link', { name: /^Open the task: Step \d$/ })).toHaveLength(2);
  });

  it('shows a command as code, and a date for an entry that has one', () => {
    panel({ ...detail(0), sections: [{ id: 'primary', title: 'Commands', items: [item(0, { code: 'nmap -sV 10.0.0.5', at: Date.parse('2026-10-14T12:00:00') })] }] });
    expect(document.querySelector('code')!.textContent).toBe('nmap -sV 10.0.0.5');
    expect(document.querySelector('[data-detail-item]')!.textContent).toMatch(/2026-10-14/);
  });

  it(`shows ${SHOWN} entries, then all of them on request, and says how many there are`, () => {
    const onExpand = vi.fn();
    const { rerender } = panel(detail(SHOWN + 4), [], onExpand);
    expect(document.querySelectorAll('[data-detail-item]')).toHaveLength(SHOWN);
    expect(screen.getByRole('heading', { level: 4 }).textContent).toContain(`${SHOWN + 4}`);
    fireEvent.click(screen.getByRole('button', { name: `Show all ${SHOWN + 4}` }));
    expect(onExpand).toHaveBeenCalledWith('primary');
    rerender(<RecordDetailPanel id="p1" title="Steps verified" detail={detail(SHOWN + 4)} expanded={new Set(['primary'])} onExpand={onExpand} onClose={() => {}} />);
    expect(document.querySelectorAll('[data-detail-item]')).toHaveLength(SHOWN + 4);
    expect(screen.getByRole('button', { name: 'Show fewer' })).toBeInTheDocument();
  });

  it('says plainly when nothing counted, and closes', () => {
    const onClose = vi.fn();
    panel({ metric: 'steps-verified', rule: 'x', sections: [] }, [], vi.fn(), onClose);
    expect(screen.getByText(DETAIL_COPY.empty)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: RECORD_UI.closeLabel }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('the words', () => {
  it('every mark the lists can carry has a label, and the copy has no second person', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/lib/recordDetail.ts'), 'utf8');
    const emitted = new Set([...source.matchAll(/marks: \[([^\]]*)\]/g)].flatMap((m) => [...m[1].matchAll(/'([a-z][a-z ]*)'/g)].map((x) => x[1])));
    for (const level of ['practised', 'verified', 'reviewed']) emitted.add(level);
    for (const mark of emitted) expect(RECORD_UI.mark[mark], `a label for "${mark}"`).toBeTruthy();
    const words = [RECORD_UI.open, RECORD_UI.closeLabel, RECORD_UI.counted, RECORD_UI.showFewer, RECORD_UI.openTask, ...Object.values(RECORD_UI.mark), ...Object.values(DETAIL_COPY.rule), ...Object.values(DETAIL_COPY.title.primary), DETAIL_COPY.empty];
    for (const w of words) expect(w, w).not.toMatch(/\b(you|your|yours|we|our)\b/i);
  });
});
