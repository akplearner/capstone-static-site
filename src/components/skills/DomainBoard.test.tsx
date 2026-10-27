import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { DomainBoard } from './DomainBoard';
import { domainSections } from '@/lib/skillDomainsView';
import { SKILL_DOMAINS } from '@/lib/docs/skillDomains';
import { skillProfile } from '@/lib/skillProfile';
import { defaultMeasure, kpiBoard } from '@/lib/kpiBoard';
import { SEED_COURSES, courseDto } from '@/lib/content/dto';
import { certOf, deliverablesOf, skillsOf } from '@/lib/content/read';
import { ONTOLOGY_VERSION } from '@/lib/docs/ontology';
import { getTasksByRole, isSetupWeek } from '@/lib/course-helpers';
import { verifiableSteps } from '@/lib/evidenceLedger';
import type { StepEvidence } from '@/lib/data/types';

const course = SEED_COURSES.find((c) => c.id === 'server-plus')!;
const doc = courseDto(course.id);
const registry = skillsOf(doc);
const cert = certOf(doc);
const role = course.roles[0].id;
const keys = getTasksByRole(course, role).filter((t) => !isSetupWeek(course, t.week)).flatMap((t) => verifiableSteps(t.steps.filter((s) => !s.optional)).map((s) => `${t.id}::${s.id}`));

function sectionsOf(verified: string[]) {
  const evidence: Record<string, StepEvidence> = {};
  verified.forEach((k, i) => {
    const [taskId, stepId] = k.split('::');
    evidence[k] = { courseId: course.id, taskId, stepId, verified: true, method: 'verified-output', matchedTokens: 1, totalTokens: 1, attempts: 1, firstAttemptAt: 1_000 + i, verifiedAt: 2_000 + i };
  });
  const done = new Set(verified);
  const profile = skillProfile({ course, role, memberId: 'me', isStepDone: (t, s) => done.has(`${t}::${s}`), evidence, artifacts: [], registry, cert, deliverables: deliverablesOf(doc) });
  const measure = defaultMeasure(registry, role);
  const board = kpiBoard({ profile, registry, cert, measure, outcome: { capstoneFiled: false, weeksCleared: 0, weeksTotal: 4 }, ontologyVersion: ONTOLOGY_VERSION });
  return domainSections(profile, board, SKILL_DOMAINS, measure);
}

/** R133 — eight sections, the first open; a domain with nothing evidenced says so; a verified step lists its rows. */
describe('DomainBoard', () => {
  it('renders the eight domains, the first open, with the gap count and no row when nothing is evidenced', () => {
    const { container } = render(<DomainBoard sections={sectionsOf([])} content={registry} />);
    const sections = container.querySelectorAll('[data-domain-section]');
    expect(sections).toHaveLength(8);
    expect([...sections].map((s) => s.getAttribute('data-domain-section'))).toEqual(SKILL_DOMAINS.map((d) => d.id));
    expect(container.querySelector('[data-domain-section="technical-capability"] [data-domain-empty]')).not.toBeNull();
    expect(Number(container.querySelector('[data-domain-section="technical-capability"]')?.getAttribute('data-gaps'))).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-domain-row]')).toHaveLength(0);
    expect(container.innerHTML).toContain(registry.COPY.skillDomainsHeading);
  });

  it('lists only the rows with evidence, with their frequency, and opens another domain on click', () => {
    const { container } = render(<DomainBoard sections={sectionsOf(keys.slice(0, 3))} content={registry} />);
    const rows = container.querySelectorAll('[data-domain-section="technical-capability"] [data-domain-row]');
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) expect(r.querySelector('[data-frequency]')?.textContent).toMatch(/\d+/);
    expect(container.querySelector('[data-domain-section="technical-capability"] [data-domain-score]')?.textContent).toMatch(/\d+ \/ 100/);
    const problem = container.querySelector<HTMLButtonElement>('[data-domain-section="problem-solving"] button')!;
    fireEvent.click(problem);
    expect(problem.getAttribute('aria-expanded')).toBe('true');
    expect(container.querySelector('[data-domain-section="problem-solving"] [data-domain-kpis]')).not.toBeNull();
  });
});
