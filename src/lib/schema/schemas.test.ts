import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { schemaErrors, validate, type JsonSchema } from './validate';
import { ontologyFiles } from '../docs/ontology';
import { SKILLS } from '../docs/skills';
import { TOOLS } from '../docs/tools';
import { SOPS } from '../docs/sops';
import { skillProfile, skillPortfolio } from '../skillProfile';
import { kpiBoard, workRoleMeasure } from '../kpiBoard';
import { portfolioSummary, courseMetrics } from '../metrics';
import { SEED_COURSES, courseDto } from '../content/dto';
import { certOf, deliverablesOf, skillsOf } from '../content/read';
import { ONTOLOGY_VERSION } from '../docs/ontology';
import { buildMemberProfile } from '../memberExport';
import { WORK_ROLES } from '../docs/workRoles';
import { sampleProfiles } from '../content/profiles';

const DIR = resolve(process.cwd(), 'content', 'schemas');
const schema = (name: string) => JSON.parse(readFileSync(resolve(DIR, `${name}.schema.json`), 'utf8')) as JsonSchema;

/**
 * R107 — every published schema is inside the validator's subset, and a real
 * instance of each shape validates against it: the ontology's own rows, a
 * member profile built by the projection over a seed course, the course
 * index, and the integration document's example statement.
 */
describe('content/schemas — the published shapes validate', () => {
  it('every schema file is draft 2020-12 and inside the subset', () => {
    const files = readdirSync(DIR).filter((f) => f.endsWith('.schema.json'));
    expect(files.sort()).toEqual(['competency-node', 'course-index-entry', 'credential', 'environment-profile', 'event', 'kpi-board', 'member-profile', 'skill-profile', 'sop', 'standard', 'tool', 'work-role', 'xapi-statement'].map((n) => `${n}.schema.json`));
    for (const f of files) {
      const s = schema(f.replace('.schema.json', ''));
      expect(s.$schema, f).toBe('https://json-schema.org/draft/2020-12/schema');
      expect(schemaErrors(s), f).toEqual([]);
    }
  });

  it('the ontology rows validate: every node, tool, standard and SOP kind', () => {
    const files = ontologyFiles();
    for (const n of SKILLS) expect(validate(n, schema('competency-node')), n.id).toEqual([]);
    for (const t of TOOLS) expect(validate(t, schema('tool')), t.id).toEqual([]);
    for (const s of (files.standards as { standards: unknown[] }).standards) expect(validate(s, schema('standard')), JSON.stringify(s).slice(0, 40)).toEqual([]);
    for (const s of SOPS) expect(validate(s, schema('sop')), s.id).toEqual([]);
    expect(validate({ id: 'tool.x', label: 'X', kind: 'cli', aliases: [], tone: 'info' }, schema('tool'))).not.toEqual([]);
  });

  it('every row of the course index validates', () => {
    const index = JSON.parse(readFileSync(resolve(process.cwd(), 'content', 'courses', 'index.json'), 'utf8')) as { courses: unknown[] };
    expect(index.courses.length).toBe(SEED_COURSES.length);
    for (const row of index.courses) expect(validate(row, schema('course-index-entry')), JSON.stringify(row).slice(0, 60)).toEqual([]);
  });

  it('a member profile built by the projection over a seed course validates, and so does the export around it', () => {
    const course = SEED_COURSES[0];
    const doc = courseDto(course.id);
    const role = course.roles[0].id;
    const done = new Set([`${course.tasks.find((t) => t.week === 1 && t.role === role)?.id}::${course.tasks.find((t) => t.week === 1 && t.role === role)?.steps[0]?.id}`]);
    const profile = skillProfile({
      course,
      role,
      memberId: 'me',
      isStepDone: (t, s) => done.has(`${t}::${s}`),
      evidence: {},
      artifacts: [{ courseId: course.id, sha256: 'a'.repeat(64), filename: '20260101_Team01_nmap_scan.txt', sizeBytes: 10, nameOk: true, hashedAt: 1 }],
      registry: skillsOf(doc),
      cert: certOf(doc),
      deliverables: deliverablesOf(doc),
      team: { docs: {}, status: [], submissions: [], reviews: [], currentWeek: 1 },
      own: { notes: [], reports: [] },
    });
    expect(validate(profile, schema('skill-profile'))).toEqual([]);
    const metrics = courseMetrics({ course, role, taskPercent: {}, evidence: {}, artifacts: [] });
    const registry = skillsOf(doc);
    const board = kpiBoard({ profile, registry, cert: certOf(doc), measure: workRoleMeasure(registry.WORK_ROLES[0]), outcome: { capstoneFiled: false, weeksCleared: 0, weeksTotal: 4 }, ontologyVersion: ONTOLOGY_VERSION });
    // R109: the export is built by the one builder both pages share.
    const exported = buildMemberProfile({
      subject: 'me',
      copy: registry.COPY,
      pathId: null,
      summary: portfolioSummary([metrics]),
      skills: skillPortfolio([profile]),
      rows: [{ courseId: course.id, title: course.title, role: course.roles[0].name, stage: 0, capstoneFiled: false, metrics, skills: profile, artifacts: [{ courseId: course.id, sha256: 'a'.repeat(64), filename: 'x', sizeBytes: 1, nameOk: false, hashedAt: 1 }], workRoles: (registry.WORK_ROLE_OF[role] ?? []).flatMap((id) => registry.WORK_ROLES.filter((w) => w.id === id)), board, examCode: certOf(doc).CERT?.code ?? null }],
      generatedAt: '2026-10-13T00:00:00.000Z',
    });
    expect(validate(exported, schema('member-profile'))).toEqual([]);
    expect(validate({ ...exported, signature: 'signed' }, schema('member-profile'))).not.toEqual([]);
    expect(validate({ ...exported, schema: 'other/1' }, schema('member-profile'))).not.toEqual([]);
  });

  it('the integration document’s example statement validates, with its placeholders filled', () => {
    const statement = {
      actor: { id: 'subjectId', oidcSub: 'sub-1' },
      verb: 'validated',
      object: { platform: 'capstone-labs', refType: 'validator', refId: '0b1d2c3e' },
      result: { success: false, score: 0.2 },
      context: { competencyIds: ['comp.recon.port-scan'] },
      consentScope: ['share-cross-platform'],
      timestamp: '2026-10-13T00:00:00Z',
    };
    expect(validate(statement, schema('xapi-statement'))).toEqual([]);
    expect(validate({ ...statement, context: { competencyIds: ['tool.nmap'] } }, schema('xapi-statement'))).not.toEqual([]);
    expect(validate({ ...statement, verb: 'completed' }, schema('xapi-statement'))).not.toEqual([]);
  });

  // R108: the work roles, the sample profile, the credential envelope and the event contract.
  it('every work role validates, and the sample environment profile validates while a bad tool id fails', () => {
    for (const w of WORK_ROLES) expect(validate(w, schema('work-role')), w.id).toEqual([]);
    const [profile] = sampleProfiles();
    expect(validate(profile, schema('environment-profile'))).toEqual([]);
    expect(validate({ ...profile, tools: ['x'] }, schema('environment-profile'))).not.toEqual([]);
    expect(validate({ ...profile, workRoles: [] }, schema('environment-profile'))).not.toEqual([]);
  });

  it('the credential envelope admits no proof, and the event contract admits only the named assist levels', () => {
    const credential = {
      '@context': ['https://www.w3.org/ns/credentials/v2', 'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json'],
      type: ['VerifiableCredential', 'OpenBadgeCredential'],
      issuer: { id: 'https://capstone.example', type: 'Profile', name: 'Capstone Labs' },
      validFrom: '2026-10-13T00:00:00Z',
      credentialSubject: {
        type: ['AchievementSubject'],
        achievement: {
          id: 'https://capstone.example/achievements/member-profile',
          type: ['Achievement'],
          name: 'Capstone member profile',
          description: 'unsigned',
          criteria: { narrative: 'The steps verified and the documents filed, as the member profile lists them.' },
          alignment: [{ type: ['Alignment'], targetName: 'Scan ports and services with nmap', targetCode: 'comp.recon.port-scan', targetFramework: 'capstone-ontology' }],
        },
        result: [{ type: ['Result'], resultDescription: 'kpi.ability.skills-verified', value: '1 of 2' }],
      },
      evidence: [{ type: ['Evidence'], id: `sha256:${'a'.repeat(64)}`, name: 'capstone-portfolio.json' }],
      claim: 'unsigned',
    };
    expect(validate(credential, schema('credential'))).toEqual([]);
    expect(validate({ ...credential, proof: {} }, schema('credential'))).not.toEqual([]);
    expect(validate({ ...credential, type: ['VerifiableCredential'] }, schema('credential'))).not.toEqual([]);
    const event = {
      actor: { id: 'uuid', type: 'human' },
      verb: 'verified',
      object: { courseId: 'security-plus', taskId: 'red-w1-osint', stepId: 's1', refType: 'step', refId: 'red-w1-osint::s1' },
      result: { success: true, matched: 3, total: 3, attempts: 1 },
      context: { competencyIds: ['comp.recon.osint'], ontologyVersion: ONTOLOGY_VERSION, week: 1, assist: 'none' },
      consentScope: ['own'],
      timestamp: '2026-10-13T00:00:00Z',
    };
    expect(validate(event, schema('event'))).toEqual([]);
    expect(validate({ ...event, context: { ...event.context, assist: 'copilot' } }, schema('event'))).not.toEqual([]);
    expect(validate({ ...event, verb: 'scored' }, schema('event'))).not.toEqual([]);
  });
});
