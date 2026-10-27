import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { RecordCategories, Sparkline } from './RecordCategories';
import { CATEGORY_DEFS, RECORD_CATEGORIES } from '@/lib/docs/recordCategories';
import { SKILLS_COPY } from '@/lib/docs/skillsCopy';
import type { RecordCategoryCard } from '@/lib/recordCard';

const card = (id: RecordCategoryCard['id'], verifiedUses: number, over: Partial<RecordCategoryCard> = {}): RecordCategoryCard => ({
  id,
  utilization: verifiedUses + 2,
  verifiedUses,
  successRate: { value: verifiedUses, of: verifiedUses + 2 },
  courses: ['Server+'],
  projects: [],
  trend: [0, 1, 0, 2, 3, 1],
  evidenceCount: 4,
  relevance: 62,
  tier: verifiedUses >= 10 ? 'professional' : 'building',
  threshold: 10,
  ...over,
});

/** R133 — fourteen cards, the tier pill reads professional or building n/10, the figures print, a card opens. */
describe('RecordCategories', () => {
  it('renders fourteen cards in order with the tier and the seven figures', () => {
    const cards = RECORD_CATEGORIES.map((id, i) => card(id, i));
    const onToggle = vi.fn();
    const { container } = render(<RecordCategories cards={cards} defs={CATEGORY_DEFS} copy={SKILLS_COPY} open={null} onToggle={onToggle} panelId="p" />);
    const items = container.querySelectorAll('[data-record-category]');
    expect(items).toHaveLength(14);
    expect([...items].map((x) => x.getAttribute('data-record-category'))).toEqual(RECORD_CATEGORIES);
    expect(container.querySelector('[data-record-category="tools"] [data-tier-pill]')?.textContent).toBe(`${SKILLS_COPY.board.tierBuilding} 0/10`);
    expect(container.querySelector('[data-record-category="decisions"] [data-tier-pill]')?.textContent).toBe(SKILLS_COPY.board.tierProfessional);
    expect(container.querySelector('[data-record-category="decisions"]')?.getAttribute('data-tier')).toBe('professional');
    expect(container.querySelector('[data-record-category="commands"] [data-verified-uses]')?.textContent).toBe('1');
    expect(container.querySelector('[data-record-category="commands"] [data-success-rate]')?.textContent).toBe('33%');
    expect(container.querySelector('[data-record-category="commands"] [data-relevance]')?.textContent).toBe('62%');
    expect(container.querySelectorAll('[data-sparkline]')).toHaveLength(14);
    fireEvent.click(container.querySelector('[data-record-category="tools"]')!);
    expect(onToggle).toHaveBeenCalledWith('tools');
  });

  it('a card with nothing prints dashes, never hides; the sparkline scales to its tallest month', () => {
    const { container } = render(<RecordCategories cards={[card('projects', 0, { utilization: 0, successRate: { value: 0, of: 0 }, courses: [], trend: [0, 0, 0, 0, 0, 0] })]} defs={CATEGORY_DEFS} copy={SKILLS_COPY} open="projects" onToggle={() => {}} panelId="p" />);
    expect(container.querySelector('[data-success-rate]')?.textContent).toBe('—');
    expect(container.querySelector('[data-record-category="projects"]')?.getAttribute('aria-expanded')).toBe('true');
    const { container: spark } = render(<Sparkline values={[1, 4, 2]} label="t" />);
    const heights = [...spark.querySelectorAll('rect')].map((r) => Number(r.getAttribute('height')));
    expect(Math.max(...heights)).toBe(18);
    expect(heights[1]).toBe(18);
    expect(spark.querySelector('svg')?.getAttribute('aria-label')).toBe('t: 1, 4, 2');
  });
});
