import { describe, it, expect } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { KpiPack } from './KpiPack';
import { courseDto } from '@/lib/content/dto';
import { certOf, deliverablesOf, skillsOf } from '@/lib/content/read';
import { skillProfile, type SkillProfileInput } from '@/lib/skillProfile';
import { defaultMeasure, kpiBoard } from '@/lib/kpiBoard';
import { ONTOLOGY_VERSION } from '@/lib/docs/ontology';
import { SKILLS_COPY } from '@/lib/docs/skillsCopy';

/**
 * R109 — the pack is sixteen labelled sockets in registry order, honest about
 * facts not handed in, readable without a pointer (one tab stop, arrows,
 * a pinned read-out), and lit only when a ratio is complete.
 */
const doc = courseDto('security-plus');
const course = doc.course;
const role = 'blue';
const registry = skillsOf(doc);
const copy = registry.COPY.board;

function boardOf(over: Partial<SkillProfileInput> = {}, outcome = { capstoneFiled: false, weeksCleared: 0, weeksTotal: 4 }) {
  const profile = skillProfile({ course, role, memberId: 'me', isStepDone: () => false, evidence: {}, artifacts: [], registry, cert: certOf(doc), deliverables: deliverablesOf(doc), ...over });
  return kpiBoard({ profile, registry, cert: certOf(doc), measure: defaultMeasure(registry, role), outcome, ontologyVersion: ONTOLOGY_VERSION });
}

const mount = (board = boardOf()) =>
  render(<KpiPack board={board} defs={registry.KPIS} families={registry.KPI_FAMILIES} copy={copy} href="/courses/security-plus/skills" persistenceLabel={SKILLS_COPY.abilityLabels.persistence} />);

describe('KpiPack', () => {
  it('renders twenty-eight sockets in registry order, seven families, and labels every value', () => {
    const { container } = mount();
    const sockets = [...container.querySelectorAll<HTMLButtonElement>('[data-kpi-pack] button[data-kpi]')];
    expect(sockets).toHaveLength(28);
    expect(sockets.map((b) => b.dataset.kpi)).toEqual(registry.KPIS.map((k) => k.id));
    expect(container.querySelectorAll('[data-kpi-family]')).toHaveLength(7);
    // R132: four own facts need the flag history, the review queue, the cohort calendar or the page clock, which this mount does not hand in.
    const NEEDS_MORE = ['kpi.problem-solving.flags-cleared', 'kpi.teamwork.peer-reviews-given', 'kpi.professionalism.on-time', 'kpi.growth.learning-velocity'];
    for (const b of sockets.filter((x) => x.dataset.fact !== 'team' && !NEEDS_MORE.includes(x.dataset.kpi ?? ''))) {
      expect(b.dataset.loaded, b.dataset.kpi).toBe('true');
      if (b.dataset.kpi !== 'kpi.teamwork.teammate-steps' && b.dataset.kpi !== 'kpi.problem-solving.time-to-resolution') expect(b.getAttribute('aria-label'), b.dataset.kpi).toMatch(/: \d+ of \d+/);
    }
    for (const b of sockets.filter((x) => x.dataset.fact === 'team')) {
      expect(b.dataset.loaded, b.dataset.kpi).toBe('false');
      expect(b.getAttribute('aria-label')).toMatch(new RegExp(`${copy.notLoaded.replace('.', '\\.')}$`));
      expect(b.querySelectorAll('circle'), 'a dim socket is the dashed track only').toHaveLength(1);
    }
    const firstTry = sockets.find((b) => b.dataset.kpi === 'kpi.execution.first-try')!;
    expect(firstTry.getAttribute('aria-label')).toContain(SKILLS_COPY.abilityLabels.persistence);
    expect(container.querySelector('[data-kpi-dim]')?.textContent).toContain(copy.notLoaded);
    expect(container.querySelector('[data-kpi-hero]')?.textContent).toMatch(/\d+ of \d+/);
    expect(container.querySelector('[data-skill-board-link]')?.getAttribute('href')).toBe('/courses/security-plus/skills');
    expect(container.innerHTML).not.toMatch(/\beyebrow(-muted)?\b/);
    expect(container.querySelector('[data-kpi-pack]')?.getAttribute('data-motion')).toBe('on');
  });

  it('is one tab stop: the arrows move the focus across the twenty-eight', () => {
    const { container } = mount();
    const sockets = [...container.querySelectorAll<HTMLButtonElement>('button[data-kpi]')];
    expect(sockets.filter((b) => b.tabIndex === 0)).toHaveLength(1);
    expect(sockets[0].tabIndex).toBe(0);
    fireEvent.keyDown(sockets[0], { key: 'ArrowRight' });
    expect(sockets[1].tabIndex).toBe(0);
    expect(sockets[0].tabIndex).toBe(-1);
    fireEvent.keyDown(sockets[1], { key: 'ArrowDown' });
    expect(sockets[5].tabIndex).toBe(0);
    fireEvent.keyDown(sockets[5], { key: 'End' });
    expect(sockets[27].tabIndex).toBe(0);
    fireEvent.keyDown(sockets[27], { key: 'ArrowRight' });
    expect(sockets[27].tabIndex, 'the end is the end').toBe(0);
    fireEvent.keyDown(sockets[27], { key: 'Home' });
    expect(sockets[0].tabIndex).toBe(0);
  });

  it('prints the hovered or focused socket in the read-out, and a click pins it', () => {
    const { container } = mount();
    const readout = container.querySelector('[data-kpi-readout]')!;
    expect(readout.textContent).toBe(copy.packIdle);
    const first = container.querySelector<HTMLButtonElement>('button[data-kpi]')!;
    const name = registry.KPIS[0].label;
    fireEvent.focus(first);
    expect(readout.textContent).toContain(name);
    expect(readout.textContent).toContain(' of ');
    fireEvent.blur(first);
    expect(readout.textContent).toBe(copy.packIdle);
    fireEvent.click(first);
    expect(first.getAttribute('aria-pressed')).toBe('true');
    expect(readout.textContent).toContain(name);
    fireEvent.click(first);
    expect(first.getAttribute('aria-pressed')).toBe('false');
    expect(readout.textContent).toBe(copy.packIdle);
    const team = container.querySelector<HTMLButtonElement>('button[data-fact="team"]')!;
    fireEvent.mouseEnter(team);
    expect(readout.textContent).toContain(copy.notLoaded);
    fireEvent.mouseLeave(team);
  });

  it('lights a socket only when its ratio is complete, with the breathing halo', () => {
    const board = boardOf({ team: { docs: {}, status: [], submissions: [], reviews: [], currentWeek: 1 } }, { capstoneFiled: true, weeksCleared: 1, weeksTotal: 4 });
    // R132: no KPI is complete on an empty run; light one by hand to prove the halo.
    const lit = { ...board, kpis: board.kpis.map((k) => (k.id === 'kpi.execution.dod-met' ? { ...k, value: 2, of: 2, pct: 100, loaded: true } : k)) };
    const { container } = mount(lit);
    const filed = container.querySelector<HTMLButtonElement>('button[data-kpi="kpi.execution.dod-met"]')!;
    expect(filed.dataset.lit).toBe('true');
    expect(filed.dataset.pct).toBe('100');
    expect(filed.querySelector('.qa-breathe')).not.toBeNull();
    expect(container.querySelectorAll('[data-lit="true"]')).toHaveLength(lit.kpis.filter((k) => k.loaded && k.of > 0 && k.pct === 100).length);
    const notLit = container.querySelector<HTMLButtonElement>('button[data-kpi="kpi.technical.skills-verified"]')!;
    expect(notLit.dataset.lit).toBe('false');
    expect(notLit.querySelector('.qa-breathe')).toBeNull();
  });
});
