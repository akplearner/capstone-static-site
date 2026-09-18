import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { SEED_COURSES, courseDto, courseIndex, toJson, DTO_SCHEMA, topologyData } from './dto';
import * as serverTopology from '@/lib/serverTopology';
import * as labTopology from '@/lib/labTopology';
import { GLOSSARY } from '@/lib/glossary';

const DIR = resolve(process.cwd(), 'content', 'courses');
const read = (name: string) => readFileSync(resolve(DIR, name), 'utf8');

/**
 * The committed JSON is a snapshot of the seeds, and a snapshot is only worth
 * keeping if it cannot quietly fall behind. Every course is regenerated here
 * and compared byte-for-byte with the file on disk.
 */
describe('content/courses — the JSON snapshot of every course', () => {
  it.each(SEED_COURSES.map((c) => c.id))('%s.json is current', (id) => {
    const file = `${id}.json`;
    expect(existsSync(resolve(DIR, file)), `${file} missing — run: npm run content:export`).toBe(true);
    const onDisk = read(file);
    const fresh = toJson(courseDto(id));
    if (onDisk !== fresh) {
      // A deep-equal diff reads far better than a 200 KB string diff.
      expect(JSON.parse(onDisk), `seed changed: run \`npm run content:export\` and commit content/`).toEqual(JSON.parse(fresh));
    }
    expect(onDisk).toBe(fresh);
  });

  it('index.json is current and counts what the files hold', () => {
    const fresh = courseIndex();
    expect(JSON.parse(read('index.json')), 'run: npm run content:export').toEqual(fresh);
    for (const entry of fresh.courses) {
      const dto = JSON.parse(read(entry.file));
      expect(dto.schema).toBe(DTO_SCHEMA);
      expect(dto.course.tasks.length).toBe(entry.tasks);
      expect(dto.deliverables.length).toBe(entry.deliverables);
    }
  });

  it('never carries a live function — only markers that say where one was', () => {
    const walk = (v: unknown, path: string, out: string[]) => {
      if (typeof v === 'function') out.push(path);
      else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`, out));
      else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`, out);
    };
    for (const c of SEED_COURSES) {
      const fns: string[] = [];
      walk(courseDto(c.id), c.id, fns);
      expect(fns).toEqual([]);
    }
    // …and the markers are where the checks are: every DoD check keeps its label.
    const sp = courseDto('server-plus');
    const checks = sp.deliverables.flatMap((d) => d.dod ?? []);
    expect(checks.length).toBeGreaterThan(20);
    for (const ch of checks) {
      expect(typeof ch.label).toBe('string');
      expect(ch.test).toEqual({ $fn: 'test' });
    }
  });

  it('the Server+ snapshot carries the guide and the addressing, not only the seed', () => {
    const sp = JSON.parse(read('server-plus.json'));
    expect(sp.procedures.filter((p: { week: number }) => p.week === 6)).toHaveLength(10);
    expect(sp.procedureWeeks.map((w: { number: number }) => w.number)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(sp.topology.OPS.team.rule).toBe('10.20.T');
    expect(sp.topology.HOST.rule).toBe('10.10.30.T');
    expect(sp.generatedFrom).toContain('src/lib/docs/serverProcedures.ts');
  });

  it('a SOC course carries its lab topology; a course without one carries none', () => {
    // Only CySA+ declares a SocTopology today; Security+ and MSSP have none, and
    // an empty `topology` block would suggest an addressing plan that does not exist.
    const cysa = JSON.parse(read('cysa-plus.json'));
    expect(cysa.topology?.SOC?.soc?.ip).toBe('10.10.100.100');
    expect(cysa.generatedFrom).toContain('src/lib/labTopology.ts');
    for (const id of ['security-plus', 'mssp']) {
      expect(JSON.parse(read(`${id}.json`)).topology, id).toBeUndefined();
    }
  });
});

/**
 * R73: the export cannot quietly fall behind the model.
 *
 * The topology section used to be a hand-written list of nine names. Nine more
 * constants were added to `serverTopology.ts` over three rounds — the published
 * ports, the cross-zone allows, the tailnet admin model, the site, the machine
 * list — and not one of them reached `content/`, because nobody remembered to
 * extend the list. Nothing failed, so nobody found out.
 *
 * These assertions make omission impossible rather than unlikely: the export is
 * computed from the module, and the guard checks the computed set against the
 * module's own data exports.
 */
describe('the DTO exports the whole model, not a remembered subset', () => {
  const dataExports = (mod: Record<string, unknown>) =>
    Object.keys(mod).filter((k) => typeof mod[k] !== 'function' && mod[k] !== undefined).sort();

  it('every data export of serverTopology.ts reaches server-plus.json', () => {
    const dto = courseDto('server-plus');
    const missing = dataExports(serverTopology as unknown as Record<string, unknown>)
      .filter((k) => !(k in (dto.topology ?? {})));
    expect(missing, `add to the topology export: ${missing.join(', ')}`).toEqual([]);
  });

  it('every data export of labTopology.ts reaches the SOC courses', () => {
    const dto = courseDto('cysa-plus');
    // SOC_TOPOLOGY_BY_COURSE is narrowed to this course's own entry as `SOC`.
    const missing = dataExports(labTopology as unknown as Record<string, unknown>)
      .filter((k) => k !== 'SOC_TOPOLOGY_BY_COURSE')
      .filter((k) => !(k in (dto.topology ?? {})));
    expect(missing, `add to the topology export: ${missing.join(', ')}`).toEqual([]);
  });

  it('topologyData drops behaviour and keeps data', () => {
    const out = topologyData({ A: 1, B: () => 2, C: undefined, D: ['x'] });
    expect(Object.keys(out)).toEqual(['A', 'D']);
  });

  it('the shared content every course renders is in every document', () => {
    for (const c of SEED_COURSES) {
      const dto = courseDto(c.id);
      expect(Object.keys(dto.glossary ?? {}).length, `${c.id} glossary`).toBe(Object.keys(GLOSSARY).length);
      expect(dto.marking, `${c.id} marking`).toEqual({ teamWeight: 70, focusWeight: 30 });
    }
  });

  it('a course that collects lab access exports the fields it collects', () => {
    const dto = courseDto('server-plus');
    const fields = (dto.labAccess as { fields?: { key: string }[] } | undefined)?.fields ?? [];
    expect(fields.map((f) => f.key)).toContain('PVE_HOST');
    // …and the tool switch it offers, with both tools named.
    expect(Object.keys((dto.iacTools as { tools?: object })?.tools ?? {})).toEqual(['terraform', 'opentofu']);
  });
});
