import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SEED_COURSES, courseDto } from './content/dto';
import { certOf, deliverablesOf, skillsOf } from './content/read';
import { ONTOLOGY_VERSION } from './docs/ontology';
import { teamRecordView, type TeamRecordFacts } from './teamRecord';
import { validate, type JsonSchema } from './schema/validate';
import type { DeliverableData } from './docs/types';
import type { RosterEntry } from './types';
import type { ValidationAnswer } from './data/types';

const schema = (n: string) => JSON.parse(readFileSync(resolve(process.cwd(), 'content', 'schemas', `${n}.schema.json`), 'utf8')) as JsonSchema;
const course = SEED_COURSES.find((c) => c.id === 'server-plus')!;
const doc = courseDto(course.id);
const members: RosterEntry[] = [
  { memberId: 'ada', teamId: 't1', role: 'net', displayName: 'Ada', cohort: '2026-09', joinedAt: 1 },
  { memberId: 'bob', teamId: 't1', role: 'lnx', displayName: 'Bob', cohort: '2026-09', joinedAt: 2 },
];
const docs: Record<string, DeliverableData> = {
  srv_business_reqs: { fields: {}, groups: { machines: [{ hostname: 'websrv', zone: 'vmbr1 — DMZ' }, { hostname: 'linuxsrv', zone: 'vmbr2 — private' }] } },
  srv_ip_plan: { fields: {}, groups: { addresses: [{ hostname: 'websrv', zone: 'x', address: '192.168.0.3/24', gateway: '1.1.1.1', dns: '1.1.1.1' }, { hostname: 'linuxsrv', zone: 'x', address: '192.168.0.3/24', gateway: '1.1.1.1', dns: '1.1.1.1' }] } },
};
const facts = (answers: ValidationAnswer[] = []): TeamRecordFacts => ({
  course, teamId: 't1', members, docs, history: [], answers,
  registry: skillsOf(doc), cert: certOf(doc), deliverables: deliverablesOf(doc), ontologyVersion: ONTOLOGY_VERSION,
  team: { status: [], submissions: [], reviews: [], currentWeek: 4, marks: [] },
  memberFacts: () => ({ isStepDone: () => false, evidence: {}, artifacts: [], own: { notes: [], reports: [], validation: answers } }),
});

/** R141 — the console's view is pure, lists the members in roster order, builds the four documents and the overlay, and ranks nobody. */
describe('R141 — teamRecordView', () => {
  it('builds the record, the conflicts, the overlay per form, the two team documents and the per-member documents', () => {
    const v = teamRecordView(facts());
    expect(v.record.hosts).toEqual(['websrv', 'linuxsrv']);
    expect(v.conflicts.map((c) => c.rule)).toContain('duplicate-address');
    expect(v.overlay.byForm.srv_ip_plan).toMatchObject({ values: 6, conflicts: 1, answered: 0 });
    expect(v.overlay.byForm.srv_business_reqs).toMatchObject({ values: 4, conflicts: 0 });
    expect(v.overlay.byForm.srv_hardware).toBeUndefined();
    expect(validate(v.architecture, schema('project-architecture'))).toEqual([]);
    expect(validate(v.infrastructure, schema('project-infrastructure'))).toEqual([]);
    expect(v.members.map((m) => m.memberId)).toEqual(['ada', 'bob']);
    for (const m of v.members) {
      expect(validate(m.competency, schema('competency')), m.memberId).toEqual([]);
      expect(validate(m.skillValidation, schema('skill-validation')), m.memberId).toEqual([]);
      expect(m.answers).toEqual([]);
    }
  });

  it('hands each member their own answers only, and counts them on the form in the overlay', () => {
    const first = teamRecordView(facts()).activities.find((x) => x.checkpoint === 4)!;
    const a = (memberId: string, at: number): ValidationAnswer => ({ courseId: 'server-plus', memberId, teamId: 't1', activityId: first.id, checkpoint: 4, kind: first.kind, recordKey: 'srv_ip_plan.addresses[0].address', answerSha256: 'a'.repeat(64), correct: false, explanation: '', at });
    const v = teamRecordView(facts([a('ada', 1), a('ada', 2), a('bob', 3), { ...a('zed', 4), teamId: 't2' }]));
    expect(v.members.find((m) => m.memberId === 'ada')!.answers).toHaveLength(2);
    expect(v.members.find((m) => m.memberId === 'bob')!.answers).toHaveLength(1);
    expect(v.overlay.byForm.srv_ip_plan.answered).toBe(3);
    expect(v.architecture.validationCheckpoints.find((c) => c.week === 4)?.answered).toBe(2);
  });
});
