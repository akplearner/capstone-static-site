import { describe, expect, it } from 'vitest';
import { SEED_COURSES } from '../content/dto';
import { seedDeliverablesForCourse } from './definitions';
import { formBase } from './recordCategories';
import { AREA_OF_KIND, RECORD_AREAS, RECORD_FIELDS, emptyRecord, projectRecord, recordConflicts, recordFieldsOf } from './projectRecord';
import type { DeliverableData, DeliverableDef } from './types';

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const allDefs = SEED_COURSES.flatMap((c) => seedDeliverablesForCourse(c.id));

/** Every seed row of every form, as the TEAM'S OWN rows (a marker column keeps them from reading as the worked example). */
export function docsFromSeeds(defs: DeliverableDef[]): Record<string, DeliverableData> {
  const docs: Record<string, DeliverableData> = {};
  for (const d of defs) {
    const groups: Record<string, Record<string, string>[]> = {};
    const fields: Record<string, string> = {};
    for (const s of d.sections) {
      // A table without a worked example gets one row of its placeholders, so every registered column is read.
      if (s.kind === 'group') groups[s.group.group] = s.group.seed?.length ? s.group.seed.map((r) => ({ ...r, own: 'yes' })) : [Object.fromEntries(s.group.columns.map((c) => [c.field, c.placeholder ?? 'recorded']))];
      if (s.kind === 'fields') for (const f of s.fields) fields[f.field] = f.placeholder ?? 'recorded';
    }
    docs[d.id] = { fields, groups };
  }
  return docs;
}

/**
 * R139 — the project record is data with a contract: every registry entry
 * resolves to a real column or field of a real form, every kind has an area,
 * every course has entries, the extractor reads the team's rows and not the
 * worked example, and keys are unique.
 */
describe('R139 — the record registry', () => {
  it('every entry resolves to a column or a field of a form that exists, with its label column beside it', () => {
    for (const f of RECORD_FIELDS) {
      const defs = allDefs.filter((d) => d.id === f.form || formBase(d.id) === f.form);
      expect(defs.length, `${f.form} exists`).toBeGreaterThan(0);
      expect(words(f.label), `${f.form}.${f.group ?? ''}${f.column ?? f.field} label ≤ 3 words`).toBeLessThanOrEqual(3);
      expect(!!f.field !== !!(f.group && f.column), `${f.form}: a field or a column, not both`).toBe(true);
      for (const d of defs) {
        if (f.field) {
          expect(d.sections.some((s) => s.kind === 'fields' && s.fields.some((x) => x.field === f.field)), `${d.id}.${f.field}`).toBe(true);
          continue;
        }
        const section = d.sections.find((s) => s.kind === 'group' && s.group.group === f.group);
        expect(section, `${d.id}.${f.group} is a table`).toBeDefined();
        const cols = section!.kind === 'group' ? section!.group.columns.map((c) => c.field) : [];
        expect(cols, `${d.id}.${f.group}.${f.column}`).toContain(f.column);
        if (f.labelFrom) expect(cols, `${d.id}.${f.group}.${f.labelFrom} (labelFrom)`).toContain(f.labelFrom);
        if (f.within?.column) expect(cols, `${d.id}.${f.group}.${f.within.column} (within)`).toContain(f.within.column);
      }
      if (f.within?.form) expect(allDefs.some((d) => formBase(d.id) === f.within!.form || d.id === f.within!.form), `${f.form}: within ${f.within.form}`).toBe(true);
      expect(RECORD_AREAS, `${f.kind} has an area`).toContain(AREA_OF_KIND[f.kind]);
      if (f.kind === 'size') expect(f.of, `${f.form}.${f.column ?? f.field}: a size says what it measures`).toBeDefined();
    }
  });

  it('every course records something in every area but decisions, which the blocks supply', () => {
    for (const c of SEED_COURSES) {
      const defs = seedDeliverablesForCourse(c.id);
      const rec = projectRecord(docsFromSeeds(defs), defs);
      expect(rec.entries.length, `${c.id} has entries`).toBeGreaterThan(0);
      expect(defs.filter((d) => recordFieldsOf(d).length > 0).length, `${c.id}: at least half its forms feed the record`).toBeGreaterThanOrEqual(Math.floor(defs.length / 2));
      for (const a of ['infrastructure', 'security', 'operations'] as const) expect(rec.byArea[a].length, `${c.id}: ${a}`).toBeGreaterThan(0);
      const keys = rec.entries.map((e) => e.key);
      expect(new Set(keys).size, `${c.id}: keys unique`).toBe(keys.length);
      for (const e of rec.entries) expect(e.area).toBe(AREA_OF_KIND[e.kind]);
    }
  });

  it('reads the team’s own rows, never the worked example, and an empty team has an empty record', () => {
    const defs = seedDeliverablesForCourse('server-plus');
    const plan = defs.find((d) => d.id === 'srv_ip_plan')!;
    const seedOnly: Record<string, DeliverableData> = { srv_ip_plan: { fields: {}, groups: { addresses: plan.sections.flatMap((s) => (s.kind === 'group' && s.group.group === 'addresses' ? s.group.seed ?? [] : [])) } } };
    expect(projectRecord(seedOnly, defs).entries).toEqual([]);
    expect(projectRecord({}, defs)).toEqual(emptyRecord());
    const own: Record<string, DeliverableData> = {
      srv_business_reqs: { fields: {}, groups: { machines: [{ hostname: 'websrv', zone: 'vmbr1 — DMZ' }] } },
      srv_ip_plan: { fields: {}, groups: { addresses: [{ hostname: 'websrv', zone: 'vmbr1 — DMZ', address: '172.16.0.10/24', gateway: '172.16.0.1', dns: '192.168.0.2' }] } },
    };
    const rec = projectRecord(own, defs);
    expect(rec.hosts).toEqual(['websrv']);
    const address = rec.entries.find((e) => e.kind === 'ipv4')!;
    expect(address).toMatchObject({ key: 'srv_ip_plan.addresses[0].address', value: '172.16.0.10/24', host: 'websrv', area: 'infrastructure', label: 'Address' });
    expect(rec.entries.find((e) => e.kind === 'dns')).toMatchObject({ value: '192.168.0.2', host: 'websrv' });
    expect(rec.byArea.infrastructure.length).toBe(rec.entries.length);
  });

  it('reads a decision with who chose and when', () => {
    const defs = seedDeliverablesForCourse('security-plus');
    const docs: Record<string, DeliverableData> = {
      hardening_baseline: { fields: { 'decision:remote-access': 'ssh-keys', 'decision:remote-access:by': 'm1', 'decision:remote-access:at': '1700000000000' }, groups: {} },
    };
    const rec = projectRecord(docs, defs);
    expect(rec.byArea.decisions).toHaveLength(1);
    expect(rec.byArea.decisions[0]).toMatchObject({ key: 'hardening_baseline.decision:remote-access', value: 'ssh-keys', enteredBy: 'm1', enteredAt: 1700000000000, kind: 'decision' });
  });

  it('the worked examples of every course contradict nothing', () => {
    for (const c of SEED_COURSES) {
      const defs = seedDeliverablesForCourse(c.id);
      const conflicts = recordConflicts(projectRecord(docsFromSeeds(defs), defs));
      expect(conflicts.filter((x) => x.severity === 'error'), `${c.id}: ${conflicts.map((x) => x.message).join('; ')}`).toEqual([]);
    }
  });
});
