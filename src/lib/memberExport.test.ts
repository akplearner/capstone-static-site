import { describe, it, expect } from 'vitest';
import { RECORD_CATEGORIES } from './docs/recordCategories';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validate, type JsonSchema } from './schema/validate';
import { buildCredential, buildMemberProfile, profileJson, PROFILE_FILENAME, type MemberCourseRow } from './memberExport';
import { skillProfile, skillPortfolio } from './skillProfile';
import { kpiBoard, defaultMeasure } from './kpiBoard';
import { courseMetrics, portfolioSummary } from './metrics';
import { SEED_COURSES, courseDto } from './content/dto';
import { certOf, deliverablesOf, skillsOf } from './content/read';
import { MEMBER_PROFILE_SCHEMA, ONTOLOGY_VERSION } from './docs/ontology';
import { sha256Text } from './evidenceLedger';

/**
 * R109 — the one builder behind the portfolio's and the dashboard's exports:
 * the profile and the credential validate against their published schemas,
 * the credential carries no proof, the digest is the caller's, and nothing
 * the page computed for display leaks into the file.
 */
const DIR = resolve(process.cwd(), 'content', 'schemas');
const schema = (name: string) => JSON.parse(readFileSync(resolve(DIR, `${name}.schema.json`), 'utf8')) as JsonSchema;

const course = SEED_COURSES[0];
const doc = courseDto(course.id);
const registry = skillsOf(doc);
const role = course.roles[0].id;
const first = course.tasks.find((t) => t.week === 1 && t.role === role);
const done = new Set([`${first?.id}::${first?.steps[0]?.id}`]);
const artifacts = [{ courseId: course.id, sha256: 'a'.repeat(64), filename: '20260101_Team01_nmap_scan.txt', sizeBytes: 10, nameOk: true, hashedAt: 1 }];
const profile = skillProfile({
  course,
  role,
  memberId: 'me',
  isStepDone: (t, s) => done.has(`${t}::${s}`),
  evidence: {},
  artifacts,
  registry,
  cert: certOf(doc),
  deliverables: deliverablesOf(doc),
  team: { docs: {}, status: [], submissions: [], reviews: [], currentWeek: 1 },
  own: { notes: [], reports: [] },
});
const metrics = courseMetrics({ course, role, taskPercent: {}, evidence: {}, artifacts: [] });
const board = kpiBoard({ profile, registry, cert: certOf(doc), measure: defaultMeasure(registry, role), outcome: { capstoneFiled: false, weeksCleared: 0, weeksTotal: 4 }, ontologyVersion: ONTOLOGY_VERSION });
const workRoles = (registry.WORK_ROLE_OF[role] ?? []).flatMap((id) => registry.WORK_ROLES.filter((w) => w.id === id));
const row: MemberCourseRow = { courseId: course.id, title: course.title, role: course.roles[0].name, stage: 1, capstoneFiled: false, metrics, skills: profile, artifacts, workRoles, board, examCode: certOf(doc).CERT?.code ?? null };
const input = { subject: 'me', copy: registry.COPY, pathId: null, summary: portfolioSummary([metrics]), skills: skillPortfolio([profile]), rows: [row], generatedAt: '2026-10-13T00:00:00.000Z' };

describe('memberExport', () => {
  it('builds a member profile that validates, stamps the time it was given, and carries only the published fields', () => {
    const p = buildMemberProfile(input);
    expect(validate(p, schema('member-profile'))).toEqual([]);
    expect(p.schema).toBe(MEMBER_PROFILE_SCHEMA);
    expect(p.ontologyVersion).toBe(ONTOLOGY_VERSION);
    expect(p.generatedAt).toBe(input.generatedAt);
    expect(p.signature).toBeNull();
    expect(p.subject.display).toBe('me');
    expect(p.courses).toHaveLength(1);
    expect(p.courses[0].kpis).toHaveLength(32);
    expect(p.courses[0].workRoles).toEqual(workRoles.map((w) => w.id));
    expect(workRoles.length).toBeGreaterThan(0);
    expect('board' in p.courses[0]).toBe(false);
    expect('examCode' in p.courses[0]).toBe(false);
    expect(JSON.parse(profileJson(p))).toEqual(p);
    expect(profileJson(p)).toBe(JSON.stringify(p, null, 2));
    expect(PROFILE_FILENAME).toBe('capstone-portfolio.json');
  });

  it('wraps the profile in an Open Badges 3.0 envelope with no proof, the caller’s digest, one result per KPI and per score and de-duplicated alignment', async () => {
    const p = buildMemberProfile(input);
    const digest = await sha256Text(profileJson(p));
    const cred = buildCredential({ profile: p, rows: [row], copy: registry.COPY, origin: 'https://capstone.example', digest });
    expect(validate(cred, schema('credential'))).toEqual([]);
    expect('proof' in cred).toBe(false);
    expect(cred.type).toEqual(['VerifiableCredential', 'OpenBadgeCredential']);
    expect(cred.issuer).toEqual({ id: 'https://capstone.example', type: 'Profile', name: registry.COPY.board.issuer });
    expect(cred.validFrom).toBe(p.generatedAt);
    expect(cred.evidence[0].id).toBe(`sha256:${digest}`);
    expect(cred.evidence[0].name).toBe(PROFILE_FILENAME);
    expect(cred.credentialSubject.result).toHaveLength(32 + 7);
    expect(cred.credentialSubject.result[0].resultDescription).toBe(`${course.id} ${board.kpis[0].id}`);
    expect(cred.claim).toBe(registry.COPY.board.credentialClaim);
    const codes = cred.credentialSubject.achievement.alignment.map((a) => a.targetCode);
    expect(new Set(codes).size).toBe(codes.length);
    const nice = cred.credentialSubject.achievement.alignment.filter((a) => a.targetFramework === 'NICE');
    expect(nice).toHaveLength(workRoles.length);
    expect(nice.map((a) => a.targetCode)).toEqual(workRoles.map((w) => w.niceId ?? w.id));
    const verifiedSkills = profile.rows.skills.filter((s) => s.level === 'verified' || s.level === 'reviewed');
    expect(cred.credentialSubject.achievement.alignment.filter((a) => a.targetFramework === 'capstone-ontology')).toHaveLength(verifiedSkills.length);
  });

  it('a row without work roles aligns to no NICE role, and the same skill proved in two courses appears once', () => {
    const p = buildMemberProfile({ ...input, rows: [{ ...row, workRoles: [] }, { ...row, courseId: 'twin', workRoles: [] }] });
    const cred = buildCredential({ profile: p, rows: [{ ...row, workRoles: [] }, { ...row, courseId: 'twin', workRoles: [] }], copy: registry.COPY, origin: 'https://capstone.example', digest: 'b'.repeat(64) });
    expect(cred.credentialSubject.achievement.alignment.filter((a) => a.targetFramework === 'NICE')).toHaveLength(0);
    const codes = cred.credentialSubject.achievement.alignment.map((a) => a.targetCode);
    expect(new Set(codes).size).toBe(codes.length);
    expect(cred.credentialSubject.result).toHaveLength(2 * (32 + 7));
    expect(cred.evidence[0].id).toBe(`sha256:${'b'.repeat(64)}`);
  });

  it('R134: the record by category rides on the export when the page hands it in, validates, and gives the credential one result per category', async () => {
    const categories = RECORD_CATEGORIES.map((id, i) => ({ id, utilization: i + 2, verifiedUses: i, successRate: { value: i, of: i + 2 }, courses: [course.title], projects: [], trend: [0, 0, 0, 0, 0, i], evidenceCount: 1, relevance: 50, tier: (i >= 10 ? 'professional' : 'building') as 'professional' | 'building', threshold: 10 }));
    const p = buildMemberProfile({ ...input, categories });
    expect(validate(p, schema('member-profile'))).toEqual([]);
    expect(p.categories).toHaveLength(14);
    expect('categories' in buildMemberProfile(input)).toBe(false);
    const cred = buildCredential({ profile: p, rows: [row], copy: registry.COPY, origin: 'https://capstone.example', digest: await sha256Text(profileJson(p)) });
    expect(validate(cred, schema('credential'))).toEqual([]);
    const results = cred.credentialSubject.result.filter((r) => r.resultDescription.startsWith('record '));
    expect(results).toHaveLength(14);
    expect(results.find((r) => r.resultDescription === 'record exam-domains')?.value).toBe('professional: 13 verified uses of 10');
    expect(results.find((r) => r.resultDescription === 'record tools')?.value).toBe('building: 0 verified uses of 10');
  });
});
