import { describe, expect, it } from 'vitest';
import { SEED_COURSES } from '../content/dto';
import { seedDeliverablesForCourse } from '../docs/definitions';
import { projectRecord, recordConflicts } from '../docs/projectRecord';
import { docsFromSeeds } from '../docs/projectRecord.test';
import type { DeliverableData } from '../docs/types';
import { LIMITS, distractorsFor, hash32, judgeAnswer, stableShuffle, validationActivities } from './activities';
import { validationPlanOf } from './plan';

const srv = SEED_COURSES.find((c) => c.id === 'server-plus')!;
const defs = seedDeliverablesForCourse('server-plus');
const docs: Record<string, DeliverableData> = {
  srv_business_reqs: { fields: {}, groups: { machines: [{ hostname: 'websrv', zone: 'vmbr1 — DMZ' }, { hostname: 'linuxsrv', zone: 'vmbr2 — private' }] } },
  srv_ip_plan: { fields: {}, groups: { addresses: [{ hostname: 'websrv', zone: 'vmbr1 — DMZ', address: '172.16.0.10/24', gateway: '172.16.0.1', dns: '192.168.0.2' }, { hostname: 'linuxsrv', zone: 'vmbr2 — private', address: '192.168.0.3/24', gateway: '192.168.0.1', dns: '192.168.0.2' }] } },
  srv_standards: { fields: {}, groups: { ports: [{ host: 'websrv', port: '80/tcp', service: 'nginx', who: 'x', decision: 'Keep — justified' }, { host: 'websrv', port: '443/tcp', service: 'nginx', who: 'x', decision: 'Keep — justified' }] } },
  srv_bringup: { fields: { 'decision:raid': 'raid10' }, groups: { vms: [{ hostname: 'websrv', vcpu: '2', ram_gb: '4', disk_gb: '40' }, { hostname: 'linuxsrv', vcpu: '2', ram_gb: '4', disk_gb: '40' }] } },
};
const record = projectRecord(docs, defs);
const conflicts = recordConflicts(record);
const plan = validationPlanOf(srv);
const recall = plan.find((p) => p.kind === 'recall')!;
const apply = plan.find((p) => p.kind === 'apply')!;
const gen = (checkpoint = recall, r = record, c = conflicts) => validationActivities({ course: srv, defs, record: r, conflicts: c, checkpoint });

/**
 * R140 — the activities are generated from the record only, deterministically,
 * and never reveal the recorded value in a prompt.
 */
describe('R140 — the validation activities', () => {
  it('an empty record gives no activity; a record gives recalls with the recorded value among four options, and ids that name the fact', () => {
    expect(gen(recall, projectRecord({}, defs), [])).toEqual([]);
    const acts = gen();
    const recalls = acts.filter((a) => a.kind === 'recall');
    expect(recalls.length).toBeGreaterThan(0);
    expect(recalls.length).toBeLessThanOrEqual(LIMITS.recall + 1);
    for (const a of recalls) {
      expect(a.id).toBe(`val:${recall.week}:recall:${a.recordKey}`);
      expect(a.options).toHaveLength(4);
      expect(a.options).toContain(a.answer);
      expect(new Set(a.options).size).toBe(4);
      expect(a.prompt, a.id).not.toContain(a.answer);
    }
    const address = recalls.find((a) => a.recordKey === 'srv_ip_plan.addresses[0].address')!;
    expect(address.answer).toBe('172.16.0.10/24');
    expect(address.prompt).toBe('What did the team record as the address for websrv?');
  });

  it('is deterministic: the same record gives the same activities, options in the same order', () => {
    expect(JSON.stringify(gen())).toBe(JSON.stringify(gen()));
    expect(stableShuffle(['a', 'b', 'c', 'd'], 'seed')).toEqual(stableShuffle(['a', 'b', 'c', 'd'], 'seed'));
    expect(stableShuffle(['a', 'b', 'c', 'd'], 'seed')).not.toEqual(stableShuffle(['a', 'b', 'c', 'd'], 'other'));
    expect(hash32('x')).toBe(hash32('x'));
  });

  it('the recall checkpoint asks for a decision among the block’s options and for explanations; the apply checkpoint asks scenarios and conflicts', () => {
    const acts = gen();
    const decision = acts.find((a) => a.recordKey === 'srv_bringup.decision:raid')!;
    expect(decision.kind).toBe('recall');
    expect(decision.options!.length).toBeGreaterThanOrEqual(3);
    expect(decision.answer).not.toBe('raid10'); // the option's label, never its id
    const explain = acts.filter((a) => a.kind === 'explain');
    expect(explain.length).toBeGreaterThan(0);
    expect(explain.length).toBeLessThanOrEqual(LIMITS.explain);
    expect(explain[0].minWords).toBe(40);
    expect(acts.some((a) => a.kind === 'apply')).toBe(false);

    const later = gen(apply);
    const scenarios = later.filter((a) => a.kind === 'apply');
    expect(scenarios.length).toBeGreaterThan(0);
    const port = scenarios.find((a) => a.prompt.includes('still free'))!;
    expect(port.options).toContain(port.answer);
    expect(['80/tcp', '443/tcp']).not.toContain(port.answer);
    const ram = scenarios.find((a) => a.prompt.includes('doubles the RAM'))!;
    expect(ram.answer).toBe('16');
    expect(ram.options).toBeUndefined();
    expect(later.some((a) => a.kind === 'explain')).toBe(false);
  });

  it('a conflict becomes a consistency task, judged by whether it is still in the record', () => {
    const clash = { ...docs, srv_ip_plan: { fields: {}, groups: { addresses: [{ hostname: 'websrv', address: '192.168.0.3/24', gateway: 'x', dns: 'x' }, { hostname: 'linuxsrv', address: '192.168.0.3/24', gateway: 'x', dns: 'x' }] } } };
    const rec = projectRecord(clash, defs);
    const conf = recordConflicts(rec);
    expect(conf.length).toBeGreaterThan(0);
    const acts = gen(apply, rec, conf);
    const task = acts.find((a) => a.kind === 'consistency')!;
    expect(task.id).toBe(`val:${apply.week}:consistency:${conf[0].id}`);
    expect(task.prompt.startsWith('Resolve: ')).toBe(true);
    expect(judgeAnswer(task, 'resolved', conf)).toBe(false);
    expect(judgeAnswer(task, 'resolved', [])).toBe(true);
  });

  it('judges a choice case- and space-insensitively, and leaves an explanation to the instructor', () => {
    const acts = gen();
    const address = acts.find((a) => a.recordKey === 'srv_ip_plan.addresses[0].address')!;
    expect(judgeAnswer(address, ' 172.16.0.10/24 ')).toBe(true);
    expect(judgeAnswer(address, '172.16.0.11/24')).toBe(false);
    expect(judgeAnswer(acts.find((a) => a.kind === 'explain')!, 'forty words of reasoning')).toBeNull();
  });

  it('distractors come from the record, the column’s options or a perturbation, never the value itself', () => {
    const e = record.entries.find((x) => x.key === 'srv_ip_plan.addresses[0].address')!;
    const d = distractorsFor(e, record, defs);
    expect(d).toHaveLength(3);
    expect(d).not.toContain(e.value);
    expect(d).toContain('192.168.0.3/24');
    const zone = record.entries.find((x) => x.kind === 'vlan')!;
    expect(distractorsFor(zone, record, defs).every((x) => x !== zone.value)).toBe(true);
  });

  it('every course’s worked example generates recall activities at its recall checkpoint, none naming the answer', () => {
    for (const c of SEED_COURSES) {
      const d = seedDeliverablesForCourse(c.id);
      const r = projectRecord(docsFromSeeds(d), d);
      const cp = validationPlanOf(c).find((p) => p.kind === 'recall')!;
      const acts = validationActivities({ course: c, defs: d, record: r, conflicts: recordConflicts(r), checkpoint: cp });
      expect(acts.length, `${c.id} asks something`).toBeGreaterThan(0);
      for (const a of acts) if (a.answer) expect(a.prompt, `${c.id} ${a.id}`).not.toContain(a.answer);
      expect(new Set(acts.map((a) => a.id)).size, `${c.id} ids unique`).toBe(acts.length);
    }
  });
});
