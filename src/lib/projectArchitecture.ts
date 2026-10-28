import type { DeliverableVersion, ValidationAnswer } from './data/types';
import type { ProjectRecord, RecordConflict, RecordEntry } from './docs/projectRecord';
import type { Checkpoint } from './validation/plan';
import type { ValidationActivity } from './validation/activities';

/**
 * R141 — `capstone-project-architecture/1`: what a team's project is, as the
 * record reads it: the current version, the values by area, the design and
 * risk decisions with who and when, the history of changes (0025), the
 * conflicts, and each validation checkpoint with what was offered, answered
 * and correct. Team-level and pure; the instructor console builds it and
 * downloads it. Nothing here names a member beyond the ids the facts carry.
 */
export const PROJECT_ARCHITECTURE_SCHEMA = 'capstone-project-architecture/1';

export interface ArchitectureValue {
  key: string;
  kind: string;
  label: string;
  value: string;
  form: string;
  host?: string;
}

export interface ArchitectureDecision {
  key: string;
  label: string;
  value: string;
  form: string;
  enteredBy: string | null;
  enteredAt: number | null;
}

export interface HistoricalChange {
  deliverableId: string;
  /** When the replaced version had been saved, and by whom. */
  updatedAt: number;
  updatedBy: string | null;
  /** Who replaced it and when the database saw it. */
  replacedBy: string | null;
  replacedAt: number;
}

export interface CheckpointSummary {
  week: number;
  kind: Checkpoint['kind'];
  offered: number;
  answered: number;
  correct: number;
}

export interface ProjectArchitectureDto {
  schema: typeof PROJECT_ARCHITECTURE_SCHEMA;
  courseId: string;
  teamId: string;
  /** One more than the versions the history holds. */
  version: number;
  areas: Record<string, ArchitectureValue[]>;
  designDecisions: ArchitectureDecision[];
  riskDecisions: ArchitectureValue[];
  historicalChanges: HistoricalChange[];
  conflicts: RecordConflict[];
  validationCheckpoints: CheckpointSummary[];
}

const value = (e: RecordEntry): ArchitectureValue => ({ key: e.key, kind: e.kind, label: e.label, value: e.value, form: e.form, ...(e.host ? { host: e.host } : {}) });

export function projectArchitectureOf(input: {
  courseId: string;
  teamId: string;
  record: ProjectRecord;
  conflicts: RecordConflict[];
  history: DeliverableVersion[];
  checkpoints: Checkpoint[];
  activities: ValidationActivity[];
  answers: ValidationAnswer[];
}): ProjectArchitectureDto {
  const { record } = input;
  const latest = new Map<string, ValidationAnswer>();
  for (const a of [...input.answers].sort((x, y) => x.at - y.at)) latest.set(`${a.memberId}|${a.activityId}`, a);
  const checkpoints: CheckpointSummary[] = input.checkpoints.map((c) => {
    const acts = input.activities.filter((a) => a.checkpoint === c.week);
    const ids = new Set(acts.map((a) => a.id));
    const answered = [...latest.values()].filter((a) => ids.has(a.activityId));
    return { week: c.week, kind: c.kind, offered: acts.length, answered: answered.length, correct: answered.filter((a) => a.correct === true).length };
  });
  return {
    schema: PROJECT_ARCHITECTURE_SCHEMA,
    courseId: input.courseId,
    teamId: input.teamId,
    version: input.history.length + 1,
    areas: Object.fromEntries(Object.entries(record.byArea).map(([area, list]) => [area, list.map(value)])),
    designDecisions: record.byArea.decisions.map((e) => ({ key: e.key, label: e.label, value: e.value, form: e.form, enteredBy: e.enteredBy ?? null, enteredAt: e.enteredAt ?? null })),
    riskDecisions: record.entries.filter((e) => e.kind === 'risk' || e.kind === 'exception').map(value),
    historicalChanges: [...input.history]
      .sort((a, b) => a.replacedAt - b.replacedAt)
      .map((v) => ({ deliverableId: v.deliverableId, updatedAt: v.updatedAt, updatedBy: v.updatedBy, replacedBy: v.replacedBy, replacedAt: v.replacedAt })),
    conflicts: input.conflicts,
    validationCheckpoints: checkpoints,
  };
}
