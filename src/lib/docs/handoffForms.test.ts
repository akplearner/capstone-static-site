import { describe, expect, it } from 'vitest';
import { SEED_COURSES, courseDto } from '../content/dto';
import { deliverablesOf } from '../content/read';
import { HANDOFF_FORMS, withHandoffForms } from './handoffForms';
import { seedDeliverablesForCourse } from './definitions';
import { isGradedWeek } from '../course-helpers';

describe('R138 — every hand-off lands in a form of its course', () => {
  it('maps every hand-off of every course to a form that exists, and the export carries it', () => {
    for (const c of SEED_COURSES) {
      const ids = new Set(deliverablesOf(courseDto(c.id)).map((d) => d.id));
      const mapped = withHandoffForms(c, seedDeliverablesForCourse(c.id));
      for (const t of mapped.tasks) for (const [i, h] of (t.handoff ?? []).entries()) {
        expect(h.deliverable, `${c.id}/${t.id} hand-off ${i + 1} names no form`).toBeTruthy();
        expect(ids.has(h.deliverable!), `${c.id}/${t.id}: ${h.deliverable}`).toBe(true);
      }
      const exported = courseDto(c.id).course;
      for (const t of exported.tasks) for (const h of t.handoff ?? []) expect(h.deliverable, `${c.id}/${t.id} exported`).toBeTruthy();
      // R138: every graded task hands something on, so every role has a hand-off to be measured on.
      for (const t of exported.tasks.filter((t) => isGradedWeek(exported, t.week))) expect(t.handoff?.length ?? 0, `${c.id}/${t.id} has a hand-off`).toBeGreaterThan(0);
    }
  });

  it('names only tasks that exist and never more forms than hand-offs', () => {
    for (const [courseId, tasks] of Object.entries(HANDOFF_FORMS)) {
      const course = SEED_COURSES.find((c) => c.id === courseId)!;
      expect(course, courseId).toBeDefined();
      for (const [taskId, forms] of Object.entries(tasks)) {
        const t = course.tasks.find((x) => x.id === taskId);
        expect(t, `${courseId}/${taskId}`).toBeDefined();
        expect(forms.length, `${courseId}/${taskId}`).toBeLessThanOrEqual(t!.handoff?.length ?? 0);
      }
    }
  });
});
