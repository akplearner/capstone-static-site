import { describe, it, expect } from 'vitest';
import { WORK_ROLES, WORK_ROLE_OF, workRoleOf, workRolesOf } from './workRoles';
import { AREA_LABEL, SKILLS } from './skills';
import { SEED_COURSES } from '../content/dto';

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/**
 * R108 — the work-role crosswalk: every row names areas that exist and
 * holds the nodes of those areas; every course role prepares for at least
 * one work role; every work role is reached by some course; the register.
 */
describe('R108 — work roles', () => {
  it('rows are unique, in the register, anchored to existing areas, and hold the nodes of those areas', () => {
    expect(new Set(WORK_ROLES.map((w) => w.id)).size).toBe(WORK_ROLES.length);
    const nodeIds = new Set(SKILLS.map((n) => n.id));
    for (const w of WORK_ROLES) {
      expect(w.id).toMatch(/^role\.[a-z0-9][a-z0-9-]*$/);
      expect(words(w.label), `${w.id} label ≤ 8 words`).toBeLessThanOrEqual(8);
      expect(w.framework).toBe('NICE');
      if (w.niceId) expect(w.niceId).toMatch(/^[A-Z]{2}-[A-Z]{3}-\d{3}$/);
      expect(w.checkedYear).toBeGreaterThanOrEqual(2017);
      expect(w.url).toMatch(/^https:\/\//);
      expect(w.areas.length).toBeGreaterThan(0);
      for (const a of w.areas) expect(AREA_LABEL, `${w.id} area ${a}`).toHaveProperty(a);
      expect(w.requiredCompetencies.length, `${w.id} holds nodes`).toBeGreaterThan(0);
      for (const id of w.requiredCompetencies) expect(nodeIds.has(id), `${w.id} node ${id}`).toBe(true);
      expect(w.requiredCompetencies).toEqual(SKILLS.filter((n) => w.areas.includes(n.area)).map((n) => n.id));
      expect(w.label, `${w.id}: em dash or emoji`).not.toMatch(/—|\p{Extended_Pictographic}/u);
      expect(workRoleOf(w.id)).toBe(w);
    }
  });

  it('every course role prepares for at least one work role, every mapped id resolves, and every work role is reached', () => {
    const reached = new Set<string>();
    for (const c of SEED_COURSES) {
      const map = WORK_ROLE_OF[c.id];
      expect(map, `${c.id} is mapped`).toBeDefined();
      for (const r of c.roles) {
        const ids = map[r.id] ?? [];
        expect(ids.length, `${c.id}/${r.id} prepares for a work role`).toBeGreaterThan(0);
        for (const id of ids) {
          expect(workRoleOf(id), `${c.id}/${r.id} → ${id}`).toBeDefined();
          reached.add(id);
        }
        expect(workRolesOf(c.id, r.id).map((w) => w.id)).toEqual(ids);
      }
      for (const role of Object.keys(map)) expect(c.roles.some((r) => r.id === role), `${c.id} maps an unknown role ${role}`).toBe(true);
    }
    for (const w of WORK_ROLES) expect(reached.has(w.id), `${w.id} is reached by a course`).toBe(true);
    expect(workRolesOf('security-plus', 'nobody')).toEqual([]);
  });
});
