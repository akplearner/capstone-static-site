import { courseDto } from './content/dto';
import { certOf, deliverablesOf, skillsOf } from './content/read';
import { getTasksByRole, isGradedWeek } from './course-helpers';
import { verifiableSteps } from './evidenceLedger';
import { decisionKey, type DeliverableData, type DeliverableDef } from './docs/types';
import type { SkillProfileInput } from './skillProfile';
import type { StepEvidence } from './data/types';
import type { DeliverableStatus } from './docs/lifecycle';
import { projectRecord, recordConflicts } from './docs/projectRecord';
import { checkpointsReached } from './validation/plan';
import { validationActivities } from './validation/activities';

/**
 * R137 — a member who did EVERYTHING a course offers a role, as data: every checkable step verified,
 * every form filled past its seed rows, every decision chosen by the drafter, every form approved, a
 * calendar, a review queue, a flag raised and cleared. `kpiBoard.allCourses.test.ts` runs every course
 * and role through the pipeline with it; `scripts/kpi-debt.ts` prints what each course still cannot
 * measure. Not a test file, so both can import it.
 */
export const T0 = Date.parse('2026-09-07T09:00:00Z');
export const ME = 'member-1';
export const TEAM = '2026-09-t01';

export function fullDocs(defs: DeliverableDef[], role: string): DeliverableData[] {
  return defs.map((d) => {
    const fields: Record<string, string> = {};
    const groups: Record<string, Record<string, string>[]> = {};
    for (const sec of d.sections) {
      if (sec.kind === 'fields') for (const f of sec.fields) fields[f.field] = f.type === 'select' ? (f.options?.[0] ?? 'yes') : f.type === 'number' ? '4' : f.type === 'ipv4' ? '10.0.0.1' : f.type === 'date' ? '2026-09-07' : 'Filled by the test member with enough words to pass a minimum-length check on the field.';
      else if (sec.kind === 'group') {
        // Past the seed rows: a copy of each seed row with every value changed, plus one more; `withoutSeedRows` keeps only those.
        const seed = sec.group.seed ?? [];
        const made = (i: number) => Object.fromEntries(sec.group.columns.map((c) => [c.field, c.type === 'select' ? (c.options?.[0] ?? 'fixed') : c.type === 'ipv4' ? `10.0.${i}.1` : c.type === 'number' ? String(i + 1) : `resolved fixed pass ok yes done closed ${i}`]));
        groups[sec.group.group] = [...seed.map((_, i) => made(i)), made(seed.length)];
      } else if (sec.kind === 'decision' && (d.raci?.drafts === role || d.owner === role)) {
        const k = decisionKey(sec.block.id);
        fields[k] = sec.block.options[0].id;
        fields[`${k}:by`] = ME;
        fields[`${k}:at`] = String(T0 + 3600_000);
        for (const q of sec.block.questions) fields[q.field] = 'Chosen for the reasons the test states at length so the required questions read as answered.';
      }
    }
    return { fields, groups };
  });
}

export function fullMemberInput(courseId: string, role: string): SkillProfileInput & { deliverables: DeliverableDef[] } {
  const doc = courseDto(courseId);
  const course = doc.course;
  const registry = skillsOf(doc);
  const cert = certOf(doc);
  const deliverables = deliverablesOf(doc);
  const tasks = getTasksByRole(course, role).filter((t) => isGradedWeek(course, t.week));
  const evidence: Record<string, StepEvidence> = {};
  const done = new Set<string>();
  let n = 0;
  for (const t of tasks) {
    for (const s of t.steps.filter((x) => !x.optional)) done.add(`${t.id}::${s.id}`);
    for (const s of verifiableSteps(t.steps.filter((x) => !x.optional))) {
      n += 1;
      const first = T0 + n * 600_000;
      evidence[`${t.id}::${s.id}`] = { courseId, taskId: t.id, stepId: s.id, verified: true, method: 'verified-output', matchedTokens: 1, totalTokens: 1, attempts: n % 3 === 0 ? 2 : 1, firstAttemptAt: first, verifiedAt: first + 5 * 60_000 + (n % 2) * 8 * 86_400_000 };
    }
  }
  const docsList = fullDocs(deliverables, role);
  const docs: Record<string, DeliverableData> = Object.fromEntries(deliverables.map((d, i) => [d.id, docsList[i]]));
  const status: DeliverableStatus[] = deliverables.flatMap((d) => [
    { courseId, teamId: TEAM, deliverableId: d.id, status: 'in_review', changedBy: ME, role: d.raci?.drafts ?? role, note: '', version: 1, at: T0 + 1000 },
    { courseId, teamId: TEAM, deliverableId: d.id, status: 'approved', changedBy: ME, role: d.raci?.approves ?? role, note: '', version: 1, at: T0 + 2000 },
  ]);
  const reviews = deliverables.map((d) => ({ courseId, teamId: TEAM, deliverableId: d.id, week: d.weeks[0] ?? 1, status: 'approved' as const, comment: '', reviewer: 'Ivy', at: T0 + 3000 }));
  const lastWeek = Math.max(1, ...course.weeks.filter((w) => isGradedWeek(course, w.number)).map((w) => w.number));
  // R140: a member who did everything answered every validation activity the record generates, correctly.
  const record = projectRecord(docs, deliverables);
  const conflicts = recordConflicts(record);
  const activities = checkpointsReached(course, lastWeek).flatMap((checkpoint) => validationActivities({ course, defs: deliverables, record, conflicts, checkpoint }));
  const validation = activities.map((a, i) => ({ courseId, memberId: ME, teamId: TEAM, activityId: a.id, checkpoint: a.checkpoint, kind: a.kind, recordKey: a.recordKey, answerSha256: 'b'.repeat(64), correct: a.kind === 'explain' ? null : true, explanation: '', at: T0 + 5000 + i }));
  return {
    course,
    role,
    memberId: ME,
    isStepDone: (t, s) => done.has(`${t}::${s}`),
    evidence,
    artifacts: [{ courseId, taskId: tasks[0]?.id ?? 't', week: 1, filename: '20260907_Team01_evidence.txt', sha256: 'a'.repeat(64), hashedAt: T0 + 4000, nameOk: true } as never],
    registry,
    cert,
    deliverables,
    team: { docs, status, submissions: [], reviews, currentWeek: lastWeek, marks: [] },
    own: { notes: [], reports: [], flagEvents: [{ courseId, memberId: ME, taskId: tasks[0]?.id ?? 't', stepId: 's', kind: 'raised', at: T0 }, { courseId, memberId: ME, taskId: tasks[0]?.id ?? 't', stepId: 's', kind: 'cleared', at: T0 + 60_000 }], peerReviews: { done: 1, assigned: 1 }, validation, timers: { [tasks[0]?.id ?? 't']: { elapsedMs: 90 * 60_000, runningSince: null } } },
    asOf: T0 + 40 * 86_400_000,
    receipts: null,
    rehashes: [],
    weekDue: (week: number) => T0 + (week + 1) * 7 * 86_400_000,
  };
}

