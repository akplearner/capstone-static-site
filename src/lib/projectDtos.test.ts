import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SEED_COURSES } from './content/dto';
import { seedDeliverablesForCourse } from './docs/definitions';
import { projectRecord, recordConflicts } from './docs/projectRecord';
import { docsFromSeeds } from './docs/projectRecord.test';
import { validationPlanOf } from './validation/plan';
import { validationActivities } from './validation/activities';
import { projectArchitectureOf } from './projectArchitecture';
import { projectInfrastructureOf } from './projectInfrastructure';
import { validate, type JsonSchema } from './schema/validate';
import type { DeliverableVersion, ValidationAnswer } from './data/types';

const schema = (n: string) => JSON.parse(readFileSync(resolve(process.cwd(), 'content', 'schemas', `${n}.schema.json`), 'utf8')) as JsonSchema;
const archSchema = schema('project-architecture');
const infraSchema = schema('project-infrastructure');

/** R141 — the two team-level documents validate on every course's worked example and read the history and the answers. */
describe('R141 — the project architecture and infrastructure documents', () => {
  it('validate on every course’s worked example', () => {
    for (const c of SEED_COURSES) {
      const defs = seedDeliverablesForCourse(c.id);
      const record = projectRecord(docsFromSeeds(defs), defs);
      const conflicts = recordConflicts(record);
      const checkpoints = validationPlanOf(c);
      const activities = checkpoints.flatMap((checkpoint) => validationActivities({ course: c, defs, record, conflicts, checkpoint }));
      const arch = projectArchitectureOf({ courseId: c.id, teamId: 't1', record, conflicts, history: [], checkpoints, activities, answers: [] });
      expect(validate(arch, archSchema), `${c.id} architecture`).toEqual([]);
      expect(arch.version).toBe(1);
      expect(arch.validationCheckpoints.map((x) => x.week)).toEqual(checkpoints.map((x) => x.week));
      const infra = projectInfrastructureOf({ courseId: c.id, teamId: 't1', record, history: [] });
      expect(validate(infra, infraSchema), `${c.id} infrastructure`).toEqual([]);
    }
  });

  it('reads the history as versions and ownership, the sizes against the capacity, and the answers per checkpoint', () => {
    const defs = seedDeliverablesForCourse('server-plus');
    const course = SEED_COURSES.find((c) => c.id === 'server-plus')!;
    const docs = {
      srv_business_reqs: { fields: {}, groups: { machines: [{ hostname: 'websrv', zone: 'vmbr1 — DMZ' }, { hostname: 'linuxsrv', zone: 'vmbr2 — private' }] } },
      srv_hardware: { fields: {}, groups: { discovery: [{ component: 'CPU model & cores', command: 'lscpu', found: '16C / 32T', notes: '' }, { component: 'Memory size, type & ECC', command: 'dmidecode', found: '32 GB RDIMM', notes: '' }] } },
      srv_bringup: { fields: { 'decision:raid': 'raid10', 'decision:raid:by': 'ada', 'decision:raid:at': '1700000000000' }, groups: { vms: [{ hostname: 'websrv', vcpu: '2', ram_gb: '4', disk_gb: '40' }, { hostname: 'linuxsrv', vcpu: '2', ram_gb: '4', disk_gb: '60' }] } },
      srv_ip_plan: { fields: {}, groups: { addresses: [{ hostname: 'websrv', zone: 'x', address: '172.16.0.10/24', gateway: '172.16.0.1', dns: '192.168.0.2' }], published: [{ host_port: '80/tcp', to: 'websrv:80', service: 'nginx', why: 'x', proof: 'x' }] } },
    };
    const record = projectRecord(docs, defs);
    const conflicts = recordConflicts(record);
    const history: DeliverableVersion[] = [
      { deliverableId: 'srv_ip_plan', data: { fields: {}, groups: {} }, updatedBy: null, updatedAt: 1, replacedBy: 'ada', replacedAt: 2 },
      { deliverableId: 'srv_ip_plan', data: { fields: {}, groups: {} }, updatedBy: 'ada', updatedAt: 2, replacedBy: 'bob', replacedAt: 3 },
      { deliverableId: 'srv_bringup', data: { fields: {}, groups: {} }, updatedBy: null, updatedAt: 1, replacedBy: 'ada', replacedAt: 5 },
    ];
    const checkpoints = validationPlanOf(course);
    const activities = checkpoints.flatMap((checkpoint) => validationActivities({ course, defs, record, conflicts, checkpoint }));
    const recall = activities.find((a) => a.kind === 'recall')!;
    const answers: ValidationAnswer[] = [
      { courseId: 'server-plus', memberId: 'ada', teamId: 't1', activityId: recall.id, checkpoint: recall.checkpoint, kind: 'recall', recordKey: recall.recordKey, answerSha256: 'a'.repeat(64), correct: false, explanation: '', at: 1 },
      { courseId: 'server-plus', memberId: 'ada', teamId: 't1', activityId: recall.id, checkpoint: recall.checkpoint, kind: 'recall', recordKey: recall.recordKey, answerSha256: 'b'.repeat(64), correct: true, explanation: '', at: 2 },
    ];
    const arch = projectArchitectureOf({ courseId: 'server-plus', teamId: 't1', record, conflicts, history, checkpoints, activities, answers });
    expect(validate(arch, archSchema)).toEqual([]);
    expect(arch.version).toBe(4);
    expect(arch.historicalChanges.map((h) => h.replacedAt)).toEqual([2, 3, 5]);
    expect(arch.designDecisions).toEqual([{ key: 'srv_bringup.decision:raid', label: expect.any(String), value: 'raid10', form: 'srv_bringup', enteredBy: 'ada', enteredAt: 1700000000000 }]);
    const cp = arch.validationCheckpoints.find((c) => c.week === recall.checkpoint)!;
    expect(cp).toMatchObject({ answered: 1, correct: 1 });
    expect(cp.offered).toBeGreaterThanOrEqual(1);

    const infra = projectInfrastructureOf({ courseId: 'server-plus', teamId: 't1', record, history });
    expect(validate(infra, infraSchema)).toEqual([]);
    expect(infra.resourcesAllocated).toEqual({ vcpu: 4, ramGb: 8, diskGb: 100 });
    expect(infra.capacity).toMatchObject({ ramGb: 32, threads: 32 });
    expect(infra.hosts.find((h) => h.host === 'websrv')).toMatchObject({ declared: true, addresses: ['172.16.0.10/24'], vcpu: 2, ramGb: 4, diskGb: 40 });
    expect(infra.ownership).toEqual([
      { deliverableId: 'srv_bringup', lastChangedBy: 'ada', lastChangedAt: 5, versions: 1 },
      { deliverableId: 'srv_ip_plan', lastChangedBy: 'bob', lastChangedAt: 3, versions: 2 },
    ]);
    expect(infra.dependencies.map((d) => d.value)).toEqual(['websrv:80']);
  });
});
