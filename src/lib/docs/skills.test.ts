import { describe, it, expect } from 'vitest';
import { AREA_LABEL, SKILLS, TASK_SKILLS, objectiveRef, skillOf } from './skills';
import { CERTS } from './certs';
import { controlOf, standardOf } from './standards';
import { SEED_COURSES } from '../content/dto';

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const DOMAIN_REFS = new Set(Object.values(CERTS).flatMap((c) => c.domains.map((d) => objectiveRef(c.code, d.id))));

describe('R107 — the competency ontology', () => {
  it('every node has a stable id, a semver, a short imperative label, an area and objective references that resolve', () => {
    expect(new Set(SKILLS.map((n) => n.id)).size).toBe(SKILLS.length);
    for (const n of SKILLS) {
      expect(n.id).toMatch(/^comp\.[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/);
      expect(n.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(words(n.label), `${n.id} label ≤ 8 words`).toBeLessThanOrEqual(8);
      expect(n.label, `${n.id} label starts with a capital`).toMatch(/^[A-Z]/);
      expect(n.label).not.toMatch(/\b(you|your)\b|—|\p{Extended_Pictographic}/iu);
      expect(AREA_LABEL[n.area], `${n.id} area ${n.area} has a label`).toBeTruthy();
      expect(n.id.startsWith(`comp.${n.area}.`)).toBe(true);
      expect(n.objectiveRefs.length, `${n.id} is anchored`).toBeGreaterThan(0);
      for (const ref of n.objectiveRefs) expect(DOMAIN_REFS.has(ref) || !!controlOf(ref) || !!standardOf(ref), `${n.id} → ${ref}`).toBe(true);
      for (const p of n.parents ?? []) expect(skillOf(p), `${n.id} parent ${p}`).toBeTruthy();
    }
    expect(objectiveRef('SOC 2 · ISO 27001', 'c2')).toBe('SOC-2-ISO-27001.c2');
    expect(objectiveRef('SY0-701', 'd4')).toBe('SY0-701.d4');
  });

  it('every task map names a real task and one to three nodes that exist, and every node is mapped by some course', () => {
    const used = new Set<string>();
    for (const [courseId, tasks] of Object.entries(TASK_SKILLS)) {
      const course = SEED_COURSES.find((c) => c.id === courseId);
      expect(course, courseId).toBeTruthy();
      for (const [taskId, ids] of Object.entries(tasks)) {
        expect(course!.tasks.some((t) => t.id === taskId), `${courseId}/${taskId} is a task`).toBe(true);
        expect(ids.length, `${courseId}/${taskId} one to three`).toBeGreaterThanOrEqual(1);
        expect(ids.length, `${courseId}/${taskId} one to three`).toBeLessThanOrEqual(3);
        for (const id of ids) {
          expect(skillOf(id), `${courseId}/${taskId} → ${id}`).toBeTruthy();
          used.add(id);
        }
      }
    }
    const unused = SKILLS.filter((n) => !used.has(n.id) && !n.deprecated).map((n) => n.id);
    expect(unused, 'a node nobody maps to does not exist').toEqual([]);
  });
});
