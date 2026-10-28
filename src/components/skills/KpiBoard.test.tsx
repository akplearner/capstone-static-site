import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { KpiBoard } from './KpiBoard';
import { skillProfile } from '@/lib/skillProfile';
import { defaultMeasure, kpiBoard } from '@/lib/kpiBoard';
import { SEED_COURSES, courseDto } from '@/lib/content/dto';
import { certOf, deliverablesOf, skillsOf } from '@/lib/content/read';
import { ONTOLOGY_VERSION } from '@/lib/docs/ontology';
import { SKILLS_COPY } from '@/lib/docs/skillsCopy';
import { getTasksByRole, isSetupWeek } from '@/lib/course-helpers';
import { verifiableSteps } from '@/lib/evidenceLedger';
import type { StepEvidence } from '@/lib/data/types';

/** R134 — the board prints thirty-two tiles (R140) with their units, seven scores with their components, and the timing block. */
const course = SEED_COURSES.find((c) => c.id === 'server-plus')!;
const doc = courseDto(course.id);
const registry = skillsOf(doc);
const cert = certOf(doc);
const role = course.roles[0].id;
const keys = getTasksByRole(course, role).filter((t) => !isSetupWeek(course, t.week)).flatMap((t) => verifiableSteps(t.steps.filter((s) => !s.optional)).map((s) => `${t.id}::${s.id}`));
const T0 = 1_700_000_000_000;

function boardOf(verified: string[]) {
  const evidence: Record<string, StepEvidence> = {};
  verified.forEach((k, i) => {
    const [taskId, stepId] = k.split('::');
    evidence[k] = { courseId: course.id, taskId, stepId, verified: true, method: 'verified-output', matchedTokens: 1, totalTokens: 1, attempts: 1, firstAttemptAt: T0, verifiedAt: T0 + 60_000 * [5, 30, 90][i % 3] };
  });
  const done = new Set(verified);
  const profile = skillProfile({ course, role, memberId: 'me', isStepDone: (t, s) => done.has(`${t}::${s}`), evidence, artifacts: [], registry, cert, deliverables: deliverablesOf(doc) });
  return kpiBoard({ profile, registry, cert, measure: defaultMeasure(registry, role), outcome: { capstoneFiled: false, weeksCleared: 0, weeksTotal: 4 }, ontologyVersion: ONTOLOGY_VERSION });
}
const mount = (verified: string[]) => render(<KpiBoard board={boardOf(verified)} defs={registry.KPIS} families={registry.KPI_FAMILIES} workRoles={[]} copy={SKILLS_COPY.board} persistenceLabel={SKILLS_COPY.abilityLabels.persistence} weeks={{ value: 0, of: 4 }} />);

describe('KpiBoard', () => {
  it('prints thirty-two tiles in eight families, a count with no denominator, and the timing block empty before any stamps', () => {
    const { container } = mount([]);
    expect(container.querySelectorAll('[data-kpi-family]')).toHaveLength(8);
    expect(container.querySelectorAll('li[data-kpi]')).toHaveLength(32);
    const count = container.querySelector('li[data-kpi="kpi.teamwork.teammate-steps"]')!;
    expect(count.getAttribute('data-unit')).toBe('count');
    expect(count.querySelector('.sr-only')?.textContent).toBe('0');
    expect(container.querySelector('[data-kpi-timing]')?.textContent).toContain(SKILLS_COPY.board.noTiming);
    expect(container.querySelectorAll('[data-kpi-scores] [data-score]')).toHaveLength(7);
    expect(container.querySelector('[data-kpi-scores] [data-score="score.judgment"]')?.getAttribute('data-loaded')).toBe('false');
  });

  it('prints the median minutes once steps carry both stamps, and a score with its components', () => {
    const { container } = mount(keys.slice(0, 3));
    expect(container.querySelector('[data-median-minutes]')?.textContent).toBe('30');
    expect(container.querySelector('li[data-kpi="kpi.problem-solving.time-to-resolution"]')?.textContent).toContain(SKILLS_COPY.board.timedSteps);
    const tool = container.querySelector('[data-score="score.tool-proficiency"]')!;
    expect(tool.getAttribute('data-loaded')).toBe('true');
    expect(tool.querySelectorAll('[data-score-components] li')).toHaveLength(3);
    expect(tool.textContent).toContain('/ 100');
  });
});
