import { describe, it, expect } from 'vitest';
import { skillProfile, skillPortfolio, type SkillProfile } from './skillProfile';
import { courseMetrics } from './metrics';
import { kpiBoard, defaultMeasure } from './kpiBoard';
import { SEED_COURSES, courseDto } from './content/dto';
import { certOf, deliverablesOf, skillsOf } from './content/read';
import { getTasksByRole, isGradedWeek } from './course-helpers';
import { verifiableSteps } from './evidenceLedger';
import { ONTOLOGY_VERSION } from './docs/ontology';
import { applyEarned, candidatesFrom, keptFromEarlier, mergeLedger, earnedKey, type EarnedRow } from './earnedSkills';
import { DETAIL_COPY, RECORD_METRICS, metricDetail, primaryCount, type CourseFacts, type MetricDetail } from './recordDetail';
import type { EvidenceArtifact, StepEvidence } from './data/types';
import type { Course } from './types';

/**
 * R126 — each figure on the record opens to what it is made of. The lists are built from the step
 * set the figure counts, so these tests hold each list to the number the page prints for it, on a real
 * course, for one course and for two, and again after a reset, when the ledger holds what was earned.
 */
interface Run {
  ticked: (taskId: string, stepId: string) => boolean;
  verified: Set<string>;
}
const key = (t: string, s: string) => `${t}::${s}`;
const roleOf = (c: Course) => c.roles[0].id;
const graded = (c: Course) => getTasksByRole(c, roleOf(c)).filter((t) => isGradedWeek(c, t.week));
const everything = (c: Course): Run => ({ ticked: () => true, verified: new Set(graded(c).flatMap((t) => verifiableSteps(t.steps.filter((s) => !s.optional)).map((s) => key(t.id, s.id)))) });
const nothing: Run = { ticked: () => false, verified: new Set() };
const firstTasks = (c: Course, n: number): Run => {
  const ids = new Set(graded(c).slice(0, n).map((t) => t.id));
  return { ticked: (t) => ids.has(t), verified: new Set(graded(c).slice(0, n).flatMap((t) => verifiableSteps(t.steps.filter((s) => !s.optional)).map((s) => key(t.id, s.id)))) };
};

const evidenceOf = (c: Course, run: Run): Record<string, StepEvidence> =>
  Object.fromEntries([...run.verified].map((k, i) => [k, { courseId: c.id, taskId: k.split('::')[0], stepId: k.split('::')[1], verified: true, method: 'verified-output', matchedTokens: 1, totalTokens: 1, attempts: 1, firstAttemptAt: 86_400_000 * (1 + (i % 3)), verifiedAt: 86_400_000 * (1 + (i % 3)) + 1000 } as StepEvidence]));
const artifactsOf = (c: Course): EvidenceArtifact[] => Array.from({ length: 3 }, (_, i) => ({ courseId: c.id, sha256: `${i}`.repeat(64).slice(0, 64), filename: `20260101_Team01_scan_${i}.txt`, sizeBytes: 2048, week: 1, nameOk: i !== 2, hashedAt: 86_400_000 * (2 + i) }));

function factsFor(courseId: string, run: Run, ledger: readonly EarnedRow[] = []): { facts: CourseFacts; live: SkillProfile } {
  const course = SEED_COURSES.find((c) => c.id === courseId)!;
  const doc = courseDto(courseId);
  const registry = skillsOf(doc);
  const evidence = evidenceOf(course, run);
  const artifacts = run === nothing ? [] : artifactsOf(course);
  const live = skillProfile({ course, role: roleOf(course), memberId: 'me', isStepDone: run.ticked, evidence, artifacts, registry, cert: certOf(doc), deliverables: deliverablesOf(doc), team: { docs: {}, status: [], submissions: [], reviews: [], currentWeek: 4 }, own: { notes: [], reports: [] }, asOf: 3 });
  const profile = applyEarned(live, ledger);
  const mine = ledger.filter((e) => e.courseId === courseId);
  const clearedWeeks = [...new Set(graded(course).map((t) => t.week))].filter((w) => graded(course).filter((t) => t.week === w).every((t) => t.steps.filter((s) => !s.optional).every((s) => run.ticked(t.id, s.id))));
  return {
    live,
    facts: {
      course, role: roleOf(course), profile, isStepDone: run.ticked, evidence, receipts: null, artifacts, earned: mine,
      kept: keptFromEarlier(live, mine).map(earnedKey), capstoneFiled: false, clearedWeeks,
      cites: (row) => row.deliverables.some((id) => (registry.CONTROL_OF[id] ?? []).length > 0),
    },
  };
}
const section = (d: MetricDetail, id: string) => d.sections.find((s) => s.id === id)?.items ?? [];

describe('every figure holds its list to its number — one course, everything done', () => {
  const course = SEED_COURSES.find((c) => c.id === 'security-plus')!;
  const { facts, live } = factsFor('security-plus', everything(course));
  const taskPercent = Object.fromEntries(graded(course).map((t) => [t.id, 100]));
  const metrics = courseMetrics({ course, role: roleOf(course), taskPercent, evidence: facts.evidence, artifacts: facts.artifacts });
  const portfolio = skillPortfolio([live]);
  const board = kpiBoard({ profile: live, registry: skillsOf(courseDto(course.id)), cert: certOf(courseDto(course.id)), measure: defaultMeasure(skillsOf(courseDto(course.id)), roleOf(course)), outcome: { capstoneFiled: false, weeksCleared: facts.clearedWeeks.length, weeksTotal: facts.clearedWeeks.length }, ontologyVersion: ONTOLOGY_VERSION });
  const detail = (m: (typeof RECORD_METRICS)[number]) => metricDetail(m, [facts]);

  it('steps done: the ticked steps the figure counts', () => {
    expect(metrics.stepsDone).toBeGreaterThan(5);
    expect(primaryCount(detail('steps-done'))).toBe(metrics.stepsDone);
  });

  it('steps verified: the verified steps, each with its task, a link and when', () => {
    const d = detail('steps-verified');
    expect(primaryCount(d)).toBe(metrics.verified);
    for (const item of section(d, 'primary')) {
      expect(item.href).toMatch(/^\/courses\/security-plus\?tab=tasks&week=\d+&task=[\w-]+$/);
      expect(item.sub).toMatch(/Week \d+ · /);
      expect(item.marks).toContain('verified');
      expect(item.at).toBeGreaterThan(0);
    }
  });

  it('commands verified: the commands of the verified steps that run one', () => {
    const d = detail('commands');
    const items = section(d, 'primary');
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((i) => !!i.code)).toBe(true);
    expect(new Set(items.map((i) => i.key.split('#')[0])).size, 'one step per figure unit').toBe(live.abilities.commandSteps.value);
  });

  it('skills verified, tools used and exam domains: the rows the figures count', () => {
    expect(primaryCount(detail('skills'))).toBe(portfolio.skillsVerified.length);
    expect(primaryCount(detail('tools'))).toBe(portfolio.toolsUsed.length);
    expect(primaryCount(detail('domains'))).toBe(portfolio.domainsVerified);
  });

  it('procedures: those reached, with the ones followed to standard marked, as many as the figure counts', () => {
    const d = detail('procedures');
    const followed = section(d, 'primary').filter((i) => i.marks?.includes('followed to standard')).length;
    expect(followed).toBe(board.kpis.find((k) => k.id === 'kpi.procedure.followed-to-standard')!.value);
    expect(primaryCount(d)).toBe(board.kpis.find((k) => k.id === 'kpi.procedure.followed-to-standard')!.of);
  });

  it('files hashed, newest first, and days worked as the figure counts them', () => {
    const files = detail('evidence');
    expect(primaryCount(files)).toBe(metrics.artifacts);
    const at = section(files, 'primary').map((i) => i.at!);
    expect([...at].sort((a, b) => b - a)).toEqual(at);
    expect(section(files, 'primary').some((i) => i.marks?.includes('name off convention'))).toBe(true);
    expect(primaryCount(detail('days'))).toBe(metrics.activeDays);
  });

  it('weeks sealed, tasks done and the capstone', () => {
    expect(primaryCount(detail('weeks-sealed'))).toBe(facts.clearedWeeks.length);
    expect(primaryCount(detail('tasks-done'))).toBe(graded(course).filter((t) => t.steps.some((s) => !s.optional)).length);
    const cap = detail('capstones');
    expect(section(cap, 'primary')).toEqual([expect.objectContaining({ label: course.title, marks: ['open'] })]);
    expect(primaryCount(metricDetail('capstones', [{ ...facts, capstoneFiled: true }]))).toBe(1);
    expect(section(metricDetail('capstones', [{ ...facts, capstoneFiled: true }]), 'primary')[0].marks).toEqual(['filed']);
  });

  it('every figure has a sentence saying what it counts, and the supporting lists name the steps, commands, tools and procedures behind it', () => {
    for (const m of RECORD_METRICS) {
      const d = detail(m);
      expect(d.rule, m).toBe(DETAIL_COPY.rule[m]);
      expect(d.rule, m).not.toMatch(/\b(you|your|we|our)\b/i);
    }
    const d = detail('steps-verified');
    expect(section(d, 'commands').length).toBeGreaterThan(0);
    expect(section(d, 'tools').length).toBeGreaterThan(0);
    expect(section(d, 'procedures').length).toBeGreaterThanOrEqual(0);
    for (const m of RECORD_METRICS) for (const s of detail(m).sections) expect(new Set(s.items.map((i) => i.key)).size, `${m}/${s.id}: keys are unique`).toBe(s.items.length);
  });
});

describe('nothing counted, nothing listed', () => {
  it('an empty run lists nothing for any figure', () => {
    const { facts } = factsFor('security-plus', nothing);
    for (const m of RECORD_METRICS.filter((x) => x !== 'capstones')) expect(metricDetail(m, [facts]).sections, m).toEqual([]);
    expect(metricDetail('steps-done', []).sections).toEqual([]);
  });
});

describe('two courses', () => {
  const a = factsFor('security-plus', everything(SEED_COURSES.find((c) => c.id === 'security-plus')!));
  const b = factsFor('cysa-plus', everything(SEED_COURSES.find((c) => c.id === 'cysa-plus')!));

  it('says which course each item came from, and lists a skill once however many courses reached it', () => {
    const d = metricDetail('steps-verified', [a.facts, b.facts]);
    expect(section(d, 'primary').every((i) => /Security\+|CySA\+/.test(i.sub ?? ''))).toBe(true);
    const portfolio = skillPortfolio([a.live, b.live]);
    expect(primaryCount(metricDetail('skills', [a.facts, b.facts]))).toBe(portfolio.skillsVerified.length);
    expect(primaryCount(metricDetail('tools', [a.facts, b.facts]))).toBe(portfolio.toolsUsed.length);
    expect(primaryCount(metricDetail('capstones', [a.facts, b.facts]))).toBe(2);
  });
});

describe('after a reset: what the ledger holds is listed, with the steps it was earned from', () => {
  const course = SEED_COURSES.find((c) => c.id === 'security-plus')!;
  const first = factsFor('security-plus', everything(course));
  const ledger = mergeLedger([], candidatesFrom(first.live, course, { isStepDone: first.facts.isStepDone, evidence: first.facts.evidence }, 5_000_000)).ledger;
  const after = factsFor('security-plus', nothing, ledger);

  it('the figures that count the record keep their lists, marked as kept, dated by the ledger', () => {
    const skills = metricDetail('skills', [after.facts]);
    expect(primaryCount(skills)).toBe(primaryCount(metricDetail('skills', [first.facts])));
    const items = section(skills, 'primary');
    expect(items.every((i) => i.marks?.includes('kept'))).toBe(true);
    expect(items.every((i) => i.at === 5_000_000)).toBe(true);
    const steps = section(skills, 'actions');
    expect(steps.length, 'the steps it was earned from are named').toBeGreaterThan(0);
    expect(steps.every((i) => i.marks?.includes('kept') && i.marks?.includes('verified'))).toBe(true);
    expect(section(skills, 'commands').length).toBeGreaterThan(0);
  });

  it('the figures that count the work in progress start again from nothing', () => {
    for (const m of ['steps-done', 'steps-verified', 'commands', 'evidence', 'days', 'tasks-done', 'weeks-sealed'] as const) expect(metricDetail(m, [after.facts]).sections, m).toEqual([]);
  });
});
