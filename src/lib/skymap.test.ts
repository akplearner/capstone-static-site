import { describe, it, expect } from 'vitest';
import { MIN_DISTANCE, VIEW, fnv, skymapLayout } from './skymap';
import { skillProfile } from './skillProfile';
import { courseDto } from './content/dto';
import { certOf, deliverablesOf, skillsOf } from './content/read';
import { getTasksByRole, isSetupWeek } from './course-helpers';

/**
 * R108 — the competency map is deterministic and readable: the same rows
 * give the same picture, every row is one star, no two stars sit closer
 * than the minimum distance, an edge joins only rows that share a task, and
 * the constellations follow the course order.
 */
const doc = courseDto('security-plus');
const course = doc.course;
const registry = skillsOf(doc);
const rowsFor = (role: string) =>
  skillProfile({ course, role, memberId: 'me', isStepDone: () => false, evidence: {}, artifacts: [], registry, cert: certOf(doc), deliverables: deliverablesOf(doc) }).rows.skills;
const taskOrder = (role: string) => getTasksByRole(course, role).filter((t) => !isSetupWeek(course, t.week)).map((t) => t.id);

describe('skymapLayout', () => {
  it('places every row once, inside the view, no two stars within the minimum distance, deterministically', () => {
    const rows = rowsFor('blue');
    const a = skymapLayout(rows, registry.AREAS, taskOrder('blue'));
    const b = skymapLayout(rows, registry.AREAS, taskOrder('blue'));
    expect(a).toEqual(b);
    expect(a.view).toEqual({ ...VIEW });
    const stars = a.constellations.flatMap((c) => c.stars);
    expect(stars.map((s) => s.id).sort()).toEqual(rows.map((r) => r.id).sort());
    for (const s of stars) {
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x).toBeLessThanOrEqual(VIEW.w);
      expect(s.y).toBeGreaterThanOrEqual(0);
      expect(s.y).toBeLessThanOrEqual(VIEW.h);
      expect(s.level).toBe('not-started');
    }
    for (let i = 0; i < stars.length; i++) for (let j = i + 1; j < stars.length; j++) expect(Math.hypot(stars[i].x - stars[j].x, stars[i].y - stars[j].y), `${stars[i].id} ~ ${stars[j].id}`).toBeGreaterThanOrEqual(MIN_DISTANCE - 0.2);
    for (const c of a.constellations) {
      expect(c.label).toBe(registry.AREAS[c.area]);
      for (const s of c.stars) expect(s.area).toBe(c.area);
    }
  });

  it('edges join only rows that share a task, each pair once; constellations follow the course order', () => {
    const rows = rowsFor('blue');
    const order = taskOrder('blue');
    const layout = skymapLayout(rows, registry.AREAS, order);
    const byId = new Map(rows.map((r) => [r.id, r]));
    const seen = new Set<string>();
    for (const e of layout.edges) {
      expect(e.a < e.b).toBe(true);
      expect(seen.has(`${e.a}|${e.b}`)).toBe(false);
      seen.add(`${e.a}|${e.b}`);
      const shared = byId.get(e.a)!.tasks.filter((t) => byId.get(e.b)!.tasks.includes(t));
      expect(shared.length, `${e.a} ~ ${e.b}`).toBeGreaterThan(0);
    }
    const sharing = rows.flatMap((r) => rows.filter((o) => o.id > r.id && o.tasks.some((t) => r.tasks.includes(t))).map((o) => `${r.id}|${o.id}`));
    expect(layout.edges.length).toBe(sharing.length);
    const firsts = layout.constellations.map((c) => Math.min(...c.stars.map((s) => s.order)));
    expect([...firsts].sort((p, q) => p - q)).toEqual(firsts);
    const index = new Map(order.map((id, i) => [id, i]));
    for (const s of layout.constellations.flatMap((c) => c.stars)) expect(s.order).toBe(Math.min(...byId.get(s.id)!.tasks.map((t) => index.get(t) ?? order.length)));
  });

  it('empty in, empty out; the hash is stable', () => {
    expect(skymapLayout([], registry.AREAS, [])).toEqual({ view: { ...VIEW }, constellations: [], edges: [] });
    expect(fnv('comp.recon.port-scan')).toBe(fnv('comp.recon.port-scan'));
    expect(fnv('a')).not.toBe(fnv('b'));
  });
});
