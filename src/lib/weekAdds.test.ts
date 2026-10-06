import { describe, it, expect } from 'vitest';
import { courseDocument } from './content/docs';
import { weekVisualsOf, partsOf } from './content/read';
import { weekAdds } from './weekAdds';

/**
 * R103 — the weekly breakdown is the picture's own catalogue: every part
 * that glows in a week has a row with a purpose, and every row that names a
 * form points at a form of the course. Week 0 lists the starting parts.
 */
const ARCH_COURSES = ['security-plus', 'cysa-plus', 'mssp', 'secai-plus', 'cissp'];

describe.each(ARCH_COURSES)('R103 — this week adds · %s', (id) => {
  const doc = courseDocument(id)!;

  it('every glowing part has a catalogue row with a purpose', () => {
    const parts = new Map(partsOf(doc).map((p) => [p.id, p]));
    for (const v of weekVisualsOf(doc)) {
      const adds = weekAdds(doc, v.week);
      if (v.week === 0) {
        expect(adds.starting).toBe(true);
        expect(adds.rows.length, 'week 0 lists the starting parts').toBeGreaterThan(0);
        continue;
      }
      expect(adds.rows.map((r) => r.id).sort()).toEqual([...v.highlight].sort());
      for (const r of adds.rows) {
        expect(parts.get(r.id)?.purpose, `${r.id} purpose`).toBeTruthy();
        expect(r.purpose.length).toBeGreaterThan(0);
      }
    }
  });

  it('every row that names a form names one of the course’s forms', () => {
    const forms = new Set((doc.deliverables as { id: string }[]).map((d) => d.id));
    for (const v of weekVisualsOf(doc)) for (const r of weekAdds(doc, v.week).rows) if (r.records) expect(forms.has(r.records.id), `${r.id} → ${r.records.id}`).toBe(true);
  });
});
