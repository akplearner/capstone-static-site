import { describe, expect, it } from 'vitest';
import { SEED_COURSES, courseDto } from './content/dto';
import { certOf, deliverablesOf, skillsOf } from './content/read';
import { skillProfile, type SkillProfileInput } from './skillProfile';
import { defaultMeasure, kpiBoard } from './kpiBoard';
import { ONTOLOGY_VERSION } from './docs/ontology';
import { projectRecord, recordConflicts } from './docs/projectRecord';
import { validationActivities } from './validation/activities';
import { validationPlanOf } from './validation/plan';
import type { DeliverableData } from './docs/types';
import type { ValidationAnswer } from './data/types';

const course = SEED_COURSES.find((c) => c.id === 'server-plus')!;
const doc = courseDto(course.id);
const registry = skillsOf(doc);
const cert = certOf(doc);
const deliverables = deliverablesOf(doc);
const docs: Record<string, DeliverableData> = {
  srv_business_reqs: { fields: {}, groups: { machines: [{ hostname: 'websrv', zone: 'vmbr1 — DMZ' }, { hostname: 'linuxsrv', zone: 'vmbr2 — private' }] } },
  srv_ip_plan: { fields: {}, groups: { addresses: [{ hostname: 'websrv', zone: 'vmbr1 — DMZ', address: '172.16.0.10/24', gateway: '172.16.0.1', dns: '192.168.0.2' }, { hostname: 'linuxsrv', zone: 'vmbr2 — private', address: '192.168.0.3/24', gateway: '192.168.0.1', dns: '192.168.0.2' }] } },
};
const plan = validationPlanOf(course);
const recallWeek = plan.find((p) => p.kind === 'recall')!.week;

function input(over: Partial<SkillProfileInput> = {}): SkillProfileInput {
  return { course, role: 'net', memberId: 'me', isStepDone: () => false, evidence: {}, artifacts: [], registry, cert, deliverables, ...over };
}
const board = (i: SkillProfileInput) => kpiBoard({ profile: skillProfile(i), registry, cert, measure: defaultMeasure(registry, 'net'), outcome: { capstoneFiled: false, weeksCleared: 0, weeksTotal: 4 }, ontologyVersion: ONTOLOGY_VERSION });
const kpi = (i: SkillProfileInput, id: string) => board(i).kpis.find((k) => k.id === id)!;

/** R140 — the validation family reads the answers against the activities the record generates; the seventh score stands on them. */
describe('R140 — validationIndicators', () => {
  it('without the team docs or the answers the rows are not loaded; with both and no checkpoint reached, nothing to count yet', () => {
    expect(kpi(input(), 'kpi.validation.recall-accuracy').loaded).toBe(false);
    expect(kpi(input({ team: { docs, status: [], submissions: [], reviews: [], currentWeek: 1 } }), 'kpi.validation.recall-accuracy').loaded).toBe(false);
    const early = kpi(input({ team: { docs, status: [], submissions: [], reviews: [], currentWeek: 1 }, own: { notes: [], reports: [], validation: [] } }), 'kpi.validation.recall-accuracy');
    expect(early.loaded).toBe(true);
    expect(early.applies).toBe(false);
    expect(early.notMeasured).toBe('yet');
  });

  it('at the recall checkpoint, a correct answer counts, a wrong latest answer does not, and a retry that corrects it does', () => {
    const record = projectRecord(docs, deliverables);
    const acts = validationActivities({ course, defs: deliverables, record, conflicts: recordConflicts(record), checkpoint: { kind: 'recall', week: recallWeek } });
    const recalls = acts.filter((a) => a.kind === 'recall');
    expect(recalls.length).toBeGreaterThanOrEqual(2);
    const a = (activityId: string, correct: boolean, at: number): ValidationAnswer => ({ courseId: course.id, memberId: 'me', teamId: 't', activityId, checkpoint: recallWeek, kind: 'recall', recordKey: 'k', answerSha256: 'a'.repeat(64), correct, explanation: '', at });
    const team = { docs, status: [], submissions: [], reviews: [], currentWeek: recallWeek };
    const one = kpi(input({ team, own: { notes: [], reports: [], validation: [a(recalls[0].id, true, 1), a(recalls[1].id, false, 2)] } }), 'kpi.validation.recall-accuracy');
    expect(one).toMatchObject({ value: 1, of: 2, pct: 50, applies: true });
    const retried = kpi(input({ team, own: { notes: [], reports: [], validation: [a(recalls[0].id, true, 1), a(recalls[1].id, false, 2), a(recalls[1].id, true, 3)] } }), 'kpi.validation.recall-accuracy');
    expect(retried).toMatchObject({ value: 2, of: 2, pct: 100 });
    // The course skill board passes no week: a checkpoint the member answered is reached all the same.
    const noWeek = kpi(input({ team: { ...team, currentWeek: 0 }, own: { notes: [], reports: [], validation: [a(recalls[0].id, true, 1)] } }), 'kpi.validation.recall-accuracy');
    expect(noWeek).toMatchObject({ value: 1, of: 1, applies: true });
    // Another member's answers are not mine.
    const theirs = kpi(input({ team, own: { notes: [], reports: [], validation: [{ ...a(recalls[0].id, true, 1), memberId: 'them' }] } }), 'kpi.validation.recall-accuracy');
    expect(theirs.notMeasured).toBe('yet');
    const score = board(input({ team, own: { notes: [], reports: [], validation: [a(recalls[0].id, true, 1)] } })).scores.find((s) => s.id === 'score.understanding')!;
    expect(score.loaded).toBe(true);
    expect(score.counted).toBeGreaterThanOrEqual(1);
  });

  it('minutes on task is a count of whole minutes over the role’s tasks from the timers, and never scored', () => {
    const taskId = course.tasks[0].id;
    const k = kpi(input({ own: { notes: [], reports: [], timers: { [taskId]: { elapsedMs: 125 * 60_000, runningSince: null }, elsewhere: { elapsedMs: 10 * 60_000, runningSince: null } } } }), 'kpi.validation.time-on-task');
    expect(k).toMatchObject({ value: 125, of: 0, unit: 'count', scored: false, loaded: true, applies: true });
    expect(kpi(input({ own: { notes: [], reports: [] } }), 'kpi.validation.time-on-task').loaded).toBe(false);
  });
});
