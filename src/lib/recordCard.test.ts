import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { categoryForms, categoryTaskIds, monthsBefore, recordCards, relevanceOf, type RecordCourseInput } from './recordCard';
import { RECORD_CATEGORIES } from './docs/recordCategories';
import { skillProfile } from './skillProfile';
import { SEED_COURSES, courseDto } from './content/dto';
import { certOf, deliverablesOf, skillsOf } from './content/read';
import { getTasksByRole, isGradedWeek, isSetupWeek } from './course-helpers';
import { verifiableSteps } from './evidenceLedger';
import { validate, type JsonSchema } from './schema/validate';
import type { StepEvidence } from './data/types';

/**
 * R133 — the fourteen cards: every category across every course, the tier at ten
 * verified uses across courses, the six-month trend from the verification
 * stamps against the page clock, the relevance from the work roles' areas, and
 * the published shape.
 */
const schema = JSON.parse(readFileSync(resolve(process.cwd(), 'content', 'schemas', 'record-category.schema.json'), 'utf8')) as JsonSchema;
const DAY = 24 * 60 * 60 * 1000;
const ASOF = Date.UTC(2026, 9, 27, 12);

function courseInput(courseId: string, verifiedKeys: string[], stampAt: (i: number) => number, over: Partial<RecordCourseInput> = {}): RecordCourseInput {
  const course = SEED_COURSES.find((c) => c.id === courseId)!;
  const doc = courseDto(course.id);
  const registry = skillsOf(doc);
  const role = course.roles[0].id;
  const evidence: Record<string, StepEvidence> = {};
  verifiedKeys.forEach((k, i) => {
    const [taskId, stepId] = k.split('::');
    evidence[k] = { courseId: course.id, taskId, stepId, verified: true, method: 'verified-output', matchedTokens: 1, totalTokens: 1, attempts: 1, firstAttemptAt: stampAt(i) - 60_000, verifiedAt: stampAt(i) };
  });
  const done = new Set(verifiedKeys);
  const isStepDone = (t: string, s: string) => done.has(`${t}::${s}`);
  const deliverables = deliverablesOf(doc);
  const profile = skillProfile({ course, role, memberId: 'me', isStepDone, evidence, artifacts: [], registry, cert: certOf(doc), deliverables, asOf: ASOF });
  return { course, role, profile, evidence, receipts: null, artifacts: [], isStepDone, registry, deliverables, capstoneFiled: false, clearedWeeks: [], ...over };
}
const checkable = (courseId: string) => {
  const course = SEED_COURSES.find((c) => c.id === courseId)!;
  return getTasksByRole(course, course.roles[0].id).filter((t) => !isSetupWeek(course, t.week) && isGradedWeek(course, t.week)).flatMap((t) => verifiableSteps(t.steps.filter((s) => !s.optional)).map((s) => `${t.id}::${s.id}`));
};

describe('recordCards', () => {
  it('is fourteen cards in registry order that validate, every figure zero and the tier building with nothing done', () => {
    const cards = recordCards([courseInput('server-plus', [], () => ASOF)], ASOF);
    expect(cards.map((c) => c.id)).toEqual(RECORD_CATEGORIES);
    for (const c of cards) {
      expect(validate(c, schema), c.id).toEqual([]);
      expect(c.tier).toBe('building');
      expect(c.threshold).toBe(10);
      expect(c.trend).toHaveLength(6);
      expect(c.verifiedUses).toBeLessThanOrEqual(c.utilization);
      expect(c.successRate).toEqual({ value: c.verifiedUses, of: c.utilization });
    }
    expect(cards.find((c) => c.id === 'tools')!.verifiedUses).toBe(0);
    expect(cards.find((c) => c.id === 'tools')!.courses).toEqual([]);
  });

  it('counts verified steps on the tasks of a category, names the course, and turns professional at ten verified uses across two courses', () => {
    const keys = checkable('server-plus');
    const nine = recordCards([courseInput('server-plus', keys.slice(0, 9), () => ASOF - DAY)], ASOF);
    const commands9 = nine.find((c) => c.id === 'commands')!;
    expect(commands9.verifiedUses).toBeGreaterThan(0);
    expect(commands9.verifiedUses).toBeLessThanOrEqual(9);
    expect(commands9.courses).toEqual([SEED_COURSES.find((c) => c.id === 'server-plus')!.title]);
    // Across two courses every figure is the sum of the courses' own, and the course list is the union.
    const ccna = checkable('a-plus');
    const a = courseInput('server-plus', keys.slice(0, 9), () => ASOF - DAY);
    const b = courseInput('a-plus', ccna.slice(0, 9), () => ASOF - 2 * DAY);
    const both = recordCards([a, b], ASOF);
    const onlyA = recordCards([a], ASOF);
    const onlyB = recordCards([b], ASOF);
    both.forEach((c, i) => {
      expect(c.verifiedUses, c.id).toBe(onlyA[i].verifiedUses + onlyB[i].verifiedUses);
      expect(c.utilization, c.id).toBe(onlyA[i].utilization + onlyB[i].utilization);
      expect(c.courses, c.id).toEqual([...onlyA[i].courses, ...onlyB[i].courses]);
      expect(c.tier, c.id).toBe(c.verifiedUses >= 10 ? 'professional' : 'building');
    });
    expect(both.some((c) => c.courses.length === 2), 'some category is practised in both courses').toBe(true);
    const all = recordCards([courseInput('server-plus', keys, () => ASOF - DAY)], ASOF);
    const toolsAll = all.find((c) => c.id === 'tools')!;
    expect(toolsAll.verifiedUses).toBeGreaterThanOrEqual(10);
    expect(toolsAll.tier).toBe('professional');
    expect(toolsAll.lastActivityAt).toBe(ASOF - DAY);
  });

  it('the trend buckets the verification stamps into the six months before the page clock, oldest first', () => {
    expect(monthsBefore(Date.UTC(2026, 9, 27))).toEqual(['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10']);
    const keys = checkable('server-plus').slice(0, 6);
    // Two this month, one last month, three seven months ago (outside the window).
    const stamps = [ASOF - DAY, ASOF - 2 * DAY, ASOF - 35 * DAY, ASOF - 220 * DAY, ASOF - 221 * DAY, ASOF - 222 * DAY];
    const cards = recordCards([courseInput('server-plus', keys, (i) => stamps[i])], ASOF);
    const commands = cards.find((c) => c.id === 'commands')!;
    expect(commands.trend.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(3);
    expect(commands.trend[5]).toBeGreaterThanOrEqual(0);
    const exam = cards.find((c) => c.id === 'exam-domains')!;
    expect(exam.trend[5] + exam.trend[4]).toBe(exam.trend.reduce((a, b) => a + b, 0));
  });

  it('a fault row and a decision row count as uses and successes of their categories, and a project counts weeks sealed and the capstone', () => {
    const base = courseInput('server-plus', [], () => ASOF);
    const trouble = { ...base, profile: { ...base.profile, rows: { ...base.profile.rows, troubleshooting: [{ ...base.profile.rows.skills[0], dimension: 'troubleshooting' as const, id: 'trouble.x', label: 'x', uses: 3, successes: 2, lastVerifiedAt: ASOF - DAY, level: 'verified' as const }] } } };
    const cards = recordCards([{ ...trouble, capstoneFiled: true, clearedWeeks: [1, 2] }], ASOF);
    expect(cards.find((c) => c.id === 'troubleshooting')).toMatchObject({ utilization: 3, verifiedUses: 2, tier: 'building', courses: [base.course.title], projects: [base.course.title] });
    expect(cards.find((c) => c.id === 'projects')).toMatchObject({ utilization: 2, verifiedUses: 1, evidenceCount: 1 });
  });

  it('relevance is the share of work roles whose areas the category serves; every category serves at least one role of the platform', () => {
    const roles = skillsOf(courseDto('server-plus')).WORK_ROLES;
    expect(relevanceOf('troubleshooting', [])).toBe(0);
    expect(relevanceOf('troubleshooting', [{ areas: ['ops'] }, { areas: ['grc'] }])).toBe(50);
    for (const id of RECORD_CATEGORIES) expect(relevanceOf(id, roles), id).toBeGreaterThan(0);
  });

  it('every graded task of a course lands in a category, and an approved form is evidence', () => {
    const input = courseInput('server-plus', [], () => ASOF, { status: [{ courseId: 'server-plus', teamId: 't', deliverableId: 'srv_hardware', status: 'approved', changedBy: 'x', role: 'lnx', at: ASOF, version: 1 }] });
    const tasks = categoryTaskIds(input);
    const graded = getTasksByRole(input.course, input.role).filter((t) => isGradedWeek(input.course, t.week)).map((t) => t.id);
    const covered = new Set(Object.values(tasks).flat());
    for (const id of graded) expect(covered.has(id), id).toBe(true);
    const forms = categoryForms(input);
    expect(forms.find((f) => f.id === 'srv_hardware')).toMatchObject({ approved: true });
    expect(forms.find((f) => f.id === 'srv_hardware')!.categories).toContain('architectures');
    const cards = recordCards([input], ASOF);
    expect(cards.find((c) => c.id === 'architectures')!.evidenceCount).toBeGreaterThanOrEqual(1);
  });
});
