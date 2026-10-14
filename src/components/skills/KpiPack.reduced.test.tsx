import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { KpiPack } from './KpiPack';
import { courseDto } from '@/lib/content/dto';
import { certOf, deliverablesOf, skillsOf } from '@/lib/content/read';
import { skillProfile } from '@/lib/skillProfile';
import { defaultMeasure, kpiBoard } from '@/lib/kpiBoard';
import { ONTOLOGY_VERSION } from '@/lib/docs/ontology';
import { SKILLS_COPY } from '@/lib/docs/skillsCopy';

/** R109 — with reduced motion on, the pack declares itself still: no halo breathes, the hero lands at once. */
vi.mock('@/lib/useReducedMotionSafe', () => ({ useReducedMotionSafe: () => true }));

describe('KpiPack under reduced motion', () => {
  it('declares itself still, breathes nothing, and prints the final hero value on the first render', () => {
    const doc = courseDto('security-plus');
    const registry = skillsOf(doc);
    const profile = skillProfile({ course: doc.course, role: 'blue', memberId: 'me', isStepDone: () => false, evidence: {}, artifacts: [], registry, cert: certOf(doc), deliverables: deliverablesOf(doc), team: { docs: {}, status: [], submissions: [], reviews: [], currentWeek: 1 } });
    const board = kpiBoard({ profile, registry, cert: certOf(doc), measure: defaultMeasure(registry, 'blue'), outcome: { capstoneFiled: true, weeksCleared: 1, weeksTotal: 4 }, ontologyVersion: ONTOLOGY_VERSION });
    const { container } = render(<KpiPack board={board} defs={registry.KPIS} families={registry.KPI_FAMILIES} copy={registry.COPY.board} href="/courses/security-plus/skills" persistenceLabel={SKILLS_COPY.abilityLabels.persistence} />);
    expect(container.querySelector('[data-kpi-pack]')?.getAttribute('data-motion')).toBe('off');
    expect(container.querySelectorAll('.qa-breathe')).toHaveLength(0);
    expect(container.querySelector('button[data-kpi="kpi.outcome.capstone-filed"]')?.getAttribute('data-lit')).toBe('true');
    const hero = container.querySelector('[data-kpi-hero]')!;
    expect(hero.querySelector('[aria-hidden]')?.textContent).toBe(hero.querySelector('.sr-only')?.textContent);
  });
});
