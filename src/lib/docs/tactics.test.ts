import { describe, it, expect } from 'vitest';
import { PRACTICES, TACTICS, TASK_PRACTICES, TASK_TACTICS, practiceOf, tacticOf } from './tactics';
import { controlOf, standardOf } from './standards';
import { SEED_COURSES } from '../content/dto';

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

describe('R107 — tactics and practices', () => {
  it('the tactics are the published matrices: fourteen ATT&CK Enterprise and fourteen ATLAS, by id, with a URL that names the id', () => {
    expect(new Set(TACTICS.map((t) => t.id)).size).toBe(TACTICS.length);
    expect(TACTICS.filter((t) => t.matrix === 'attack-enterprise').length).toBe(14);
    expect(TACTICS.filter((t) => t.matrix === 'atlas').length).toBe(14);
    for (const t of TACTICS) {
      expect(t.id).toMatch(/^(TA\d{4}|AML\.TA\d{4})$/);
      expect(t.matrix).toBe(t.id.startsWith('AML.') ? 'atlas' : 'attack-enterprise');
      expect(t.url).toContain(t.id);
      expect(t.checkedYear).toBeGreaterThanOrEqual(2024);
      expect(words(t.label)).toBeLessThanOrEqual(4);
    }
    expect(tacticOf('TA0001')?.label).toBe('Initial Access');
    expect(tacticOf('AML.TA0004')?.label).toBe('Initial Access');
  });

  it('every practice is anchored to a control or a standard, with a short label and a definition in the register', () => {
    expect(new Set(PRACTICES.map((p) => p.id)).size).toBe(PRACTICES.length);
    for (const p of PRACTICES) {
      expect(p.id).toMatch(/^practice\.[a-z0-9][a-z0-9-]*$/);
      expect(words(p.label), `${p.id} label ≤ 6 words`).toBeLessThanOrEqual(6);
      expect(words(p.definition), `${p.id} definition ≤ 25 words`).toBeLessThanOrEqual(25);
      expect(controlOf(p.anchor) ?? standardOf(p.anchor), `${p.id} → ${p.anchor}`).toBeTruthy();
      for (const text of [p.label, p.definition]) {
        expect(text, `${p.id}: second person`).not.toMatch(/\b(you|your|yours|we|our)\b/i);
        expect(text, `${p.id}: em dash or emoji`).not.toMatch(/—|\p{Extended_Pictographic}/u);
        expect(text, `${p.id}: contraction`).not.toMatch(/\b\w+n[’']t\b|\b\w+[’'](re|ll|ve|m)\b|\b(it|that|what|there|here)[’']s\b/i);
      }
    }
    expect(practiceOf('practice.least-privilege')?.anchor).toBe('NIST.800-53.AC-6');
  });

  it('every task map names a real task and ids that exist, one to three practices per task', () => {
    for (const [map, lookup, max] of [[TASK_TACTICS, tacticOf, 3], [TASK_PRACTICES, practiceOf, 3]] as const) {
      for (const [courseId, tasks] of Object.entries(map)) {
        const course = SEED_COURSES.find((c) => c.id === courseId);
        expect(course, courseId).toBeTruthy();
        for (const [taskId, ids] of Object.entries(tasks)) {
          expect(course!.tasks.some((t) => t.id === taskId), `${courseId}/${taskId} is a task`).toBe(true);
          expect(ids.length, `${courseId}/${taskId} has one to three`).toBeGreaterThanOrEqual(1);
          expect(ids.length, `${courseId}/${taskId} has one to three`).toBeLessThanOrEqual(max);
          for (const id of ids) expect(lookup(id), `${courseId}/${taskId} → ${id}`).toBeTruthy();
        }
      }
    }
  });
});
