import { describe, it, expect } from 'vitest';
import { domainSections, hasEvidence } from './skillDomainsView';
import { SKILL_DOMAINS } from './docs/skillDomains';
import { skillProfile } from './skillProfile';
import { defaultMeasure, kpiBoard } from './kpiBoard';
import { SEED_COURSES, courseDto } from './content/dto';
import { certOf, deliverablesOf, skillsOf } from './content/read';
import { ONTOLOGY_VERSION } from './docs/ontology';
import { getTasksByRole, isSetupWeek } from './course-helpers';
import { verifiableSteps } from './evidenceLedger';
import type { StepEvidence } from './data/types';

/**
 * R133 — the eight domains list only the rows with evidence behind them, count
 * the rest as gaps, carry their KPIs and score off the board, and read the
 * work role's requirement onto a skills row.
 */
const course = SEED_COURSES.find((c) => c.id === 'server-plus')!;
const doc = courseDto(course.id);
const registry = skillsOf(doc);
const cert = certOf(doc);
const deliverables = deliverablesOf(doc);
const role = course.roles[0].id;
const keys = getTasksByRole(course, role).filter((t) => !isSetupWeek(course, t.week)).flatMap((t) => verifiableSteps(t.steps.filter((s) => !s.optional)).map((s) => `${t.id}::${s.id}`));
const measure = defaultMeasure(registry, role);

function build(verified: string[]) {
  const evidence: Record<string, StepEvidence> = {};
  verified.forEach((k, i) => {
    const [taskId, stepId] = k.split('::');
    evidence[k] = { courseId: course.id, taskId, stepId, verified: true, method: 'verified-output', matchedTokens: 1, totalTokens: 1, attempts: 1, firstAttemptAt: 1_000 + i, verifiedAt: 2_000 + i };
  });
  const done = new Set(verified);
  const profile = skillProfile({ course, role, memberId: 'me', isStepDone: (t, s) => done.has(`${t}::${s}`), evidence, artifacts: [], registry, cert, deliverables });
  const board = kpiBoard({ profile, registry, cert, measure, outcome: { capstoneFiled: false, weeksCleared: 0, weeksTotal: 4 }, ontologyVersion: ONTOLOGY_VERSION });
  return domainSections(profile, board, SKILL_DOMAINS, measure);
}

describe('domainSections', () => {
  it('is eight sections in registry order; with nothing verified every registry row is a gap and no row is listed', () => {
    const sections = build([]);
    expect(sections.map((s) => s.def.id)).toEqual(SKILL_DOMAINS.map((d) => d.id));
    const technical = sections.find((s) => s.def.id === 'technical-capability')!;
    expect(technical.rows).toEqual([]);
    expect(technical.gaps).toBeGreaterThan(0);
    expect(technical.kpis.map((k) => k.id)).toEqual(technical.def.kpis);
    expect(technical.score?.id).toBe('score.tool-proficiency');
    // The denominators exist (the course has verifiable command steps), so the score stands on them at zero.
    expect(technical.score?.value).toBe(0);
  });

  it('a verified step lists its skill, tool and domain rows with their frequency, and a skill the role requires says so', () => {
    const sections = build(keys.slice(0, 3));
    const technical = sections.find((s) => s.def.id === 'technical-capability')!;
    expect(technical.rows.length).toBeGreaterThan(0);
    for (const r of technical.rows) {
      expect(hasEvidence(r.row)).toBe(true);
      expect(r.frequency).toBeGreaterThan(0);
      expect(r.frequency).toBeLessThanOrEqual(r.frequencyOf);
      expect(['skills', 'tools', 'domains']).toContain(r.row.dimension);
      if (r.row.dimension === 'skills') expect(r.required).toBe(measure.requiredCompetencies.includes(r.row.id));
    }
    expect(technical.rows.map((r) => r.row.level)).toEqual([...technical.rows.map((r) => r.row.level)].sort((a, b) => ['not-started', 'practised', 'verified', 'reviewed'].indexOf(b) - ['not-started', 'practised', 'verified', 'reviewed'].indexOf(a)));
    expect(technical.score?.loaded).toBe(true);
    expect(technical.score?.value).toBeGreaterThan(0);
  });

  it('a fact row with uses is evidence; one without is a gap', () => {
    const sections = build(keys.slice(0, 2));
    const problem = sections.find((s) => s.def.id === 'problem-solving')!;
    // The retries row exists with no uses yet: a gap, not a listed row.
    expect(problem.rows.find((r) => r.row.id === 'trouble.retries')).toBeUndefined();
    expect(problem.gaps).toBeGreaterThanOrEqual(1);
    expect(hasEvidence({ ...sections[0].rows[0].row, uses: 2, successes: 0 })).toBe(true);
    expect(hasEvidence({ ...sections[0].rows[0].row, uses: 0, successes: 0 })).toBe(false);
  });
});
