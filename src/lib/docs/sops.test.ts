import { describe, it, expect } from 'vitest';
import { DELIVERABLE_SOPS, SOPS, TASK_SOPS, sopOf } from './sops';
import { controlOf, standardOf } from './standards';
import { SEED_COURSES } from '../content/dto';
import { seedDeliverablesForCourse } from './definitions';

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const KINDS = ['runbook', 'change', 'release', 'incident', 'recovery', 'custody', 'scope', 'baseline', 'patching', 'handover', 'risk', 'policy', 'access', 'monitoring', 'inventory', 'governance', 'audit', 'assessment', 'design', 'build'];

describe('R107 — the SOP register', () => {
  it('every SOP kind has a short label, a definition in the register and standard references that resolve', () => {
    expect(new Set(SOPS.map((s) => s.id)).size).toBe(SOPS.length);
    for (const s of SOPS) {
      expect(s.id).toMatch(/^sop\.[a-z0-9][a-z0-9-]*$/);
      expect(words(s.label), `${s.id} label ≤ 6 words`).toBeLessThanOrEqual(6);
      expect(words(s.definition), `${s.id} definition ≤ 25 words`).toBeLessThanOrEqual(25);
      expect(KINDS).toContain(s.kind);
      expect(s.standardRefs.length, `${s.id} is anchored`).toBeGreaterThan(0);
      for (const ref of s.standardRefs) expect(controlOf(ref) ?? standardOf(ref), `${s.id} → ${ref}`).toBeTruthy();
      for (const text of [s.label, s.definition]) {
        expect(text, `${s.id}: second person`).not.toMatch(/\b(you|your|yours|we|our)\b/i);
        expect(text, `${s.id}: em dash or emoji`).not.toMatch(/—|\p{Extended_Pictographic}/u);
        expect(text, `${s.id}: contraction`).not.toMatch(/\b\w+n[’']t\b|\b\w+[’'](re|ll|ve|m)\b|\b(it|that|what|there|here)[’']s\b/i);
      }
    }
  });

  it('every form map names a real form of its course and zero to three SOP kinds that exist; every task map a real task', () => {
    for (const [courseId, forms] of Object.entries(DELIVERABLE_SOPS)) {
      const defs = seedDeliverablesForCourse(courseId);
      expect(defs.length, courseId).toBeGreaterThan(0);
      for (const [formId, ids] of Object.entries(forms)) {
        expect(defs.some((d) => d.id === formId), `${courseId}/${formId} is a form`).toBe(true);
        expect(ids.length, `${courseId}/${formId} ≤ 3 kinds`).toBeLessThanOrEqual(3);
        for (const id of ids) expect(sopOf(id), `${courseId}/${formId} → ${id}`).toBeTruthy();
      }
    }
    for (const [courseId, tasks] of Object.entries(TASK_SOPS)) {
      const course = SEED_COURSES.find((c) => c.id === courseId);
      expect(course, courseId).toBeTruthy();
      for (const [taskId, ids] of Object.entries(tasks)) {
        expect(course!.tasks.some((t) => t.id === taskId), `${courseId}/${taskId} is a task`).toBe(true);
        expect(ids.length, `${courseId}/${taskId} ≤ 3 kinds`).toBeLessThanOrEqual(3);
        for (const id of ids) expect(sopOf(id), `${courseId}/${taskId} → ${id}`).toBeTruthy();
      }
    }
  });
});
