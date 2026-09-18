import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { SEED_COURSES, courseDto, courseIndex, toJson, DTO_SCHEMA, topologyData, serialisable } from './dto';
import { ContentError, courseFromJson, fnMarkerPaths, validateCourse } from './load';
import { predicateErrors } from '@/lib/docs/predicate';
import {
  getRequiredStepCount,
  getTaskById,
  getTasksByRole,
  getWeekNumbers,
  isGradedWeek,
  weekSummary,
} from '../course-helpers';
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
    // …and the checks are whole: a rule the evaluator can read, not a marker
    // saying a function used to be here.
    const sp = courseDto('server-plus');
    const checks = sp.deliverables.flatMap((d) => d.dod ?? []);
    expect(checks.length).toBeGreaterThan(20);
    for (const ch of checks) {
      expect(typeof ch.label).toBe('string');
      expect(predicateErrors(ch.when, ch.label)).toEqual([]);
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

/**
 * R74: the course loads back out of its own JSON, and the app cannot tell.
 *
 * The snapshot test above proves the writer is current. It says nothing about
 * whether the document is COMPLETE — a field the writer forgot would be missing
 * from both sides and the test would still pass. This one reads the committed
 * file back and runs the helpers the UI actually calls over the result, so a
 * field the render path needs and the document lacks fails here.
 *
 * `serialisable` on both sides is deliberate rather than lazy: Definition-of-Done
 * checks are still TypeScript functions, so the document holds a marker where a
 * check was. The exact list of those paths is pinned below, which is what turns
 * a known gap into a number that has to go down.
 */
describe('a course loads from its own document', () => {
  const read = (id: string) => readFileSync(resolve(DIR, `${id}.json`), 'utf8');

  it.each(SEED_COURSES.map((c) => c.id))('%s round-trips through JSON', (id) => {
    const seed = SEED_COURSES.find((c) => c.id === id)!;
    const loaded = courseFromJson(read(id));
    expect(serialisable(loaded)).toEqual(serialisable(seed));
  });

  it.each(SEED_COURSES.map((c) => c.id))('%s renders the same through the UI helpers', (id) => {
    const seed = SEED_COURSES.find((c) => c.id === id)!;
    const loaded = courseFromJson(read(id));

    // The derivations every course page runs, over both courses.
    expect(getWeekNumbers(loaded)).toEqual(getWeekNumbers(seed));
    for (const w of getWeekNumbers(seed)) {
      expect(isGradedWeek(loaded, w), `week ${w} graded`).toBe(isGradedWeek(seed, w));
      for (const role of seed.roles) {
        const a = getTasksByRole(loaded, role.id, w).map((t) => t.id);
        const b = getTasksByRole(seed, role.id, w).map((t) => t.id);
        expect(a, `week ${w} / ${role.id}`).toEqual(b);
        expect(weekSummary(loaded, role.id, w)).toEqual(weekSummary(seed, role.id, w));
      }
    }
    for (const t of seed.tasks) {
      const got = getTaskById(loaded, t.id);
      expect(got, `task ${t.id} missing from the document`).toBeDefined();
      expect(getRequiredStepCount(got!), `required steps of ${t.id}`).toBe(getRequiredStepCount(t));
    }
  });

  it('every command survives the trip with its machine, sample and text', () => {
    const loaded = courseFromJson(read('server-plus'));
    const seed = SEED_COURSES.find((c) => c.id === 'server-plus')!;
    const flat = (c: typeof seed) =>
      c.tasks.flatMap((t) => t.steps.flatMap((s) => (s.commands ?? []).map((x) => [x.cmd, x.on, x.sample, x.explain])));
    expect(flat(loaded)).toEqual(flat(seed));
    // And the trip did not leave an unresolved topology symbol behind.
    for (const [cmd] of flat(loaded)) expect(String(cmd)).not.toMatch(/<[a-z][a-zA-Z0-9]*\.[a-zA-Z0-9_.-]+>/);
  });

  it('rejects a document it cannot trust, naming where', () => {
    expect(() => courseFromJson('not json')).toThrow(ContentError);
    expect(() => courseFromJson(JSON.stringify({ schema: 'other/9', course: {} }))).toThrow(/document\.schema/);
    const doc = JSON.parse(read('server-plus'));
    delete doc.course.tasks[0].steps[0].id;
    expect(() => courseFromJson(JSON.stringify(doc))).toThrow(/course\.tasks\[0\]\.steps\[0\]\.id/);
    expect(() => validateCourse({ id: 'x' })).toThrow(/course\.title/);
  });

  it('holds everything the app renders — no function markers left anywhere', () => {
    // This test used to pin 128 markers: every Definition-of-Done check and
    // every computed form column was a TypeScript function, so the document held
    // `{"$fn": …}` where the rule should be. An instructor could not read a
    // check, a business instance could not change one, and the JSON could not be
    // the source the app loads from. The vocabulary in `docs/predicate.ts` made
    // them data, and the number that mattered is now zero.
    const byCourse = Object.fromEntries(
      SEED_COURSES.map((c) => [c.id, fnMarkerPaths(courseDto(c.id))])
    );
    expect(Object.fromEntries(Object.entries(byCourse).map(([k, v]) => [k, v.length]))).toEqual({
      'security-plus': 0,
      mssp: 0,
      'cysa-plus': 0,
      'server-plus': 0,
    });
    // And zero on disk too, not only in a freshly-built DTO.
    for (const c of SEED_COURSES) expect(read(c.id), c.id).not.toContain('"$fn"');
  });
});
