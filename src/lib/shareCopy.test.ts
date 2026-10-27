import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validate, type JsonSchema } from './schema/validate';
import { skillProfile, skillPortfolio } from './skillProfile';
import { kpiBoard, defaultMeasure } from './kpiBoard';
import { courseMetrics, portfolioSummary } from './metrics';
import { SEED_COURSES, courseDto } from './content/dto';
import { certOf, deliverablesOf, skillsOf } from './content/read';
import { ONTOLOGY_VERSION } from './docs/ontology';
import { buildMemberProfile, type MemberCourseRow, type MemberProfileExport } from './memberExport';
import { getTasksByRole } from './course-helpers';
import { verifiableSteps } from './evidenceLedger';
import type { StepEvidence } from './data/types';
import { SHARE_LIMIT_BYTES, copyBytes, courseSizes, hydrateShareCourse, kb, shareProfileCopy, shareRow } from './shareCopy';
import { shareProblem } from '../../supabase/functions/_shared/shareGuard';

/**
 * R124 — the copy a link serves has to fit in 256 KB. The full export carried every row of every
 * course, reached or not: one large course came to 100 KB, thirteen to 525 KB, and a member with four
 * courses could not make a link at all. These tests build the largest record there can be (every
 * course finished, every checkable step verified, twelve hashed files in each) and hold the compact
 * copy to the cap, so a later round that adds to the profile finds out here, not in a member's dialog.
 */
const DIR = resolve(process.cwd(), 'content', 'schemas');
const memberSchema = JSON.parse(readFileSync(resolve(DIR, 'member-profile.schema.json'), 'utf8')) as JsonSchema;

function complete(courseId: string): MemberCourseRow {
  const course = SEED_COURSES.find((c) => c.id === courseId)!;
  const doc = courseDto(course.id);
  const registry = skillsOf(doc);
  const role = course.roles[0]?.id ?? '';
  const evidence: Record<string, StepEvidence> = {};
  const taskPercent: Record<string, number> = {};
  for (const t of getTasksByRole(course, role)) {
    taskPercent[t.id] = 100;
    for (const s of verifiableSteps(t.steps)) evidence[`${t.id}::${s.id}`] = { courseId: course.id, taskId: t.id, stepId: s.id, verified: true, method: 'verified-output', matchedTokens: 2, totalTokens: 2, outputSha256: 'a'.repeat(64), attempts: 1, firstAttemptAt: 1, verifiedAt: 2 };
  }
  const artifacts = Array.from({ length: 12 }, (_, i) => ({ courseId: course.id, sha256: `${i}`.repeat(64).slice(0, 64), filename: `20260101_Team01_scan_${i}.txt`, sizeBytes: 1000, week: 1 + (i % 4), nameOk: true, hashedAt: 1000 + i }));
  const profile = skillProfile({ course, role, memberId: 'me', isStepDone: () => true, evidence, artifacts, registry, cert: certOf(doc), deliverables: deliverablesOf(doc), team: { docs: {}, status: [], submissions: [], reviews: [], currentWeek: 4 }, own: { notes: [], reports: [] }, asOf: 3 });
  const board = kpiBoard({ profile, registry, cert: certOf(doc), measure: defaultMeasure(registry, role), outcome: { capstoneFiled: true, weeksCleared: 4, weeksTotal: 4 }, ontologyVersion: ONTOLOGY_VERSION });
  const workRoles = (registry.WORK_ROLE_OF[role] ?? []).flatMap((id) => registry.WORK_ROLES.filter((w) => w.id === id));
  return { courseId: course.id, title: course.title, role: course.roles[0].name, stage: 5, capstoneFiled: true, metrics: courseMetrics({ course, role, taskPercent, evidence, artifacts }), skills: profile, artifacts, workRoles, board, examCode: certOf(doc).CERT?.code ?? null };
}

const ROWS = SEED_COURSES.map((c) => complete(c.id));
const WORDS = skillsOf(courseDto(SEED_COURSES[0].id));
const profileOf = (rows: MemberCourseRow[]): MemberProfileExport =>
  buildMemberProfile({ subject: 'A member', copy: WORDS.COPY, pathId: null, summary: portfolioSummary(rows.map((r) => r.metrics)), skills: skillPortfolio(rows.map((r) => r.skills)), rows, generatedAt: '2026-10-16T00:00:00.000Z' });
const ALL = profileOf(ROWS);

describe('the copy a link carries fits the cap', () => {
  it('holds every course finished, with room, where the full export was more than twice the cap', () => {
    const full = copyBytes(ALL);
    const compact = copyBytes(shareProfileCopy(ALL));
    expect(ROWS).toHaveLength(SEED_COURSES.length);
    expect(full, 'the full export is why a link failed').toBeGreaterThan(SHARE_LIMIT_BYTES * 1.5);
    expect(compact, 'every course of the platform, finished, in one link').toBeLessThan(SHARE_LIMIT_BYTES);
    expect(compact / full, 'about half, or less').toBeLessThan(0.55);
  });

  it('holds the four largest courses together in under half the cap', () => {
    const sizes = ROWS.map((r) => [r.courseId, copyBytes(shareProfileCopy(ALL, [r.courseId]))] as const).sort((a, b) => b[1] - a[1]);
    const four = sizes.slice(0, 4).map(([id]) => id);
    expect(copyBytes(shareProfileCopy(ALL, four))).toBeLessThan(SHARE_LIMIT_BYTES / 2);
  });

  it('is accepted by the share function’s own guard, and the guard still refuses a copy over the cap', () => {
    const copy = shareProfileCopy(ALL) as unknown as Record<string, unknown>;
    expect(shareProblem({ kind: 'profile', days: 30, label: '', snapshot: copy })).toBeNull();
    expect(shareProblem({ kind: 'profile', days: 30, label: '', snapshot: { ...copy, blob: 'x'.repeat(SHARE_LIMIT_BYTES) } })).toBe('too-large');
  });

  it('validates against the published member-profile schema, which says a link’s copy is smaller', () => {
    expect(validate(shareProfileCopy(ALL), memberSchema)).toEqual([]);
    expect(validate(shareProfileCopy(ALL, [ROWS[0].courseId]), memberSchema)).toEqual([]);
    expect(validate(ALL, memberSchema), 'the full export still validates').toEqual([]);
    expect(JSON.stringify(memberSchema.description)).toContain('R124');
  });
});

describe('what the copy keeps and drops', () => {
  const course = shareProfileCopy(ALL, ['security-plus']).courses[0];

  it('keeps the member’s figures, the KPIs, the files hashed and the work roles, and drops what only their own pages use', () => {
    const full = ALL.courses.find((c) => c.courseId === 'security-plus')!;
    expect(course.metrics).toEqual(full.metrics);
    // R132: a KPI keeps its figures; family, metric, unit and scored come back from the ontology by id; a score keeps its value and what it stands on.
    expect(course.kpis.map((k) => [k.id, k.value, k.of, k.pct, k.loaded, k.fact])).toEqual(full.kpis.map((k) => [k.id, k.value, k.of, k.pct, k.loaded, k.fact]));
    expect(course.kpis.every((k) => !('family' in k) && !('unit' in k))).toBe(true);
    expect(course.scores.map((x) => [x.id, x.value, x.counted, x.of, x.loaded])).toEqual(full.scores.map((x) => [x.id, x.value, x.counted, x.of, x.loaded]));
    expect(course.scores.every((x) => !('components' in x))).toBe(true);
    expect(course.timing).toEqual(full.timing);
    expect(course.artifacts).toEqual(full.artifacts);
    expect(course.workRoles).toEqual(full.workRoles);
    expect(course.skills.denominator).toBe(full.skills.denominator);
    expect('gaps' in course.skills).toBe(false);
    expect('abilities' in course.skills).toBe(false);
    expect(shareProfileCopy(ALL).summary).toEqual(ALL.summary);
    expect(shareProfileCopy(ALL).signature).toBeNull();
  });

  it('writes a reached row as its id and level and the counters that are not zero, and the reader puts the words back', () => {
    const reached = ROWS.find((r) => r.courseId === 'security-plus')!.skills.rows.skills.find((r) => r.level === 'verified')!;
    const row = shareRow(reached);
    expect(row).toMatchObject({ id: reached.id, level: 'verified', verifiedSteps: reached.verifiedSteps, tickedSteps: reached.tickedSteps });
    expect(Object.values(row).every((v) => v !== 0 && v !== undefined), 'no zero counter and nothing undefined').toBe(true);
    for (const dropped of ['dimension', 'label', 'standardRefs', 'tasks', 'deliverables', 'next', 'exercisedTasks', 'doneTasks', 'selfAttestedSteps', 'draftedByMember']) expect(dropped in row, dropped).toBe(false);
    // R130: the reader resolves the words from the course document, by id, in every dimension.
    const full = ROWS.find((r) => r.courseId === 'security-plus')!.skills;
    const doc = courseDto('security-plus');
    const back = hydrateShareCourse(course.skills, skillsOf(doc), certOf(doc).CERT);
    // R132: the retention and execution rows stay out of a copy (a reader derives them from the skills rows and the KPIs).
    for (const dim of (Object.keys(full.rows) as (keyof typeof full.rows)[]).filter((d) => d !== 'retention' && d !== 'execution')) {
      expect(back.rows[dim].map((r) => [r.dimension, r.id, r.label])).toEqual(full.rows[dim].map((r) => [r.dimension, r.id, r.label]));
      for (const r of back.rows[dim]) {
        const orig = full.rows[dim].find((x) => x.id === r.id)!;
        if (orig.level !== 'not-started' && orig.standardRefs?.length) expect(r.standardRefs, `${dim} ${r.id} references`).toEqual(orig.standardRefs);
      }
    }
    // A copy from before this round carries its labels; the reader keeps them, and an unknown id is shown under its id.
    const old = hydrateShareCourse({ ...course.skills, rows: { skills: [{ id: 'comp.gone', level: 'verified', label: 'An old label' }, { id: 'comp.unknown', level: 'practised' }] } }, skillsOf(doc), certOf(doc).CERT);
    expect(old.rows.skills.map((r) => r.label)).toEqual(['An old label', 'comp.unknown']);
  });

  it('keeps a row not reached as an id and a level, so the denominator survives', () => {
    const base = ROWS[0].skills.rows.skills[0];
    expect(shareRow({ ...base, level: 'not-started', tickedSteps: 0, verifiedSteps: 0, artifacts: 0, lastVerifiedAt: undefined, current: undefined })).toEqual({ id: base.id, level: 'not-started' });
    const started = course.skills.rows;
    for (const dimension of Object.keys(ROWS[0].skills.rows).filter((d) => d !== 'retention' && d !== 'execution')) expect(started[dimension].length, dimension).toBe(ROWS.find((r) => r.courseId === 'security-plus')!.skills.rows[dimension as keyof (typeof ROWS)[0]['skills']['rows']].length);
  });

  it('chooses courses by id, in the member’s order, and leaves the rest out', () => {
    const two = shareProfileCopy(ALL, ['ccna', 'security-plus']);
    expect(two.courses.map((c) => c.courseId)).toEqual(SEED_COURSES.map((c) => c.id).filter((id) => id === 'ccna' || id === 'security-plus'));
    expect(shareProfileCopy(ALL, []).courses).toEqual([]);
    expect(shareProfileCopy(ALL, ['no-such-course']).courses).toEqual([]);
  });
});

describe('sizes as the dialog shows them', () => {
  it('writes a size whole, at least 1 KB', () => {
    expect(kb(0)).toBe('1 KB');
    expect(kb(1024)).toBe('1 KB');
    expect(kb(150 * 1024)).toBe('150 KB');
    expect(kb(SHARE_LIMIT_BYTES)).toBe('256 KB');
  });

  it('measures each course on its own through the page’s builder', () => {
    const ids = ROWS.map((r) => r.courseId);
    const sizes = courseSizes((chosen) => shareProfileCopy(ALL, chosen), ids);
    expect(Object.keys(sizes)).toEqual(ids);
    expect(sizes['server-plus'], 'the largest course is the largest number').toBe(Math.max(...Object.values(sizes)));
    for (const id of ids) expect(sizes[id], id).toBe(copyBytes(shareProfileCopy(ALL, [id])));
  });
});
