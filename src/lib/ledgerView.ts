/**
 * The evidence ledger as rows a person can read, filter and export.
 *
 * The ledger has existed since R-early as records keyed `${taskId}::${stepId}`
 * plus hashed artifacts, but the only view of it was an aggregate on the
 * portfolio. These are the rows the ledger page renders; the hrefs are the R68
 * deep links, so "Re-verify" opens the exact step.
 */
import type { Course } from './types';
import type { EvidenceArtifact, StepEvidence } from './data/types';
import { getTaskById } from './course-helpers';
import { methodLabel } from './evidenceLedger';
import { toCsv } from './csv';
import { localStamp } from './localDate';

export interface LedgerStepRow {
  taskId: string;
  taskTitle: string;
  stepId: string;
  stepTitle: string;
  week: number;
  method: string;
  verified: boolean;
  matched: number;
  total: number;
  attempts: number;
  verifiedAt?: number;
  href: string;
}

export interface LedgerArtifactRow {
  sha256: string;
  filename: string;
  sizeBytes: number;
  week?: number;
  deliverableId?: string;
  nameOk: boolean;
  hashedAt: number;
}

export function ledgerRows(course: Course, evidence: Record<string, StepEvidence>): LedgerStepRow[] {
  const rows: LedgerStepRow[] = [];
  for (const rec of Object.values(evidence)) {
    const task = getTaskById(course, rec.taskId);
    const step = task?.steps.find((s) => s.id === rec.stepId);
    rows.push({
      taskId: rec.taskId,
      taskTitle: task?.title ?? rec.taskId,
      stepId: rec.stepId,
      stepTitle: step?.title ?? rec.stepId,
      week: task?.week ?? 0,
      method: methodLabel(rec.method),
      verified: rec.verified,
      matched: rec.matchedTokens,
      total: rec.totalTokens,
      attempts: rec.attempts,
      verifiedAt: rec.verifiedAt ?? rec.firstAttemptAt,
      href: `/courses/${course.id}?tab=tasks&week=${task?.week ?? 1}&task=${rec.taskId}&step=${rec.stepId}`,
    });
  }
  return rows.sort((a, b) => a.week - b.week || a.taskId.localeCompare(b.taskId) || a.stepId.localeCompare(b.stepId));
}

export function artifactRows(artifacts: EvidenceArtifact[]): LedgerArtifactRow[] {
  return artifacts
    .map((a) => ({ sha256: a.sha256, filename: a.filename, sizeBytes: a.sizeBytes, week: a.week, deliverableId: a.deliverableId, nameOk: a.nameOk, hashedAt: a.hashedAt }))
    .sort((a, b) => (a.week ?? 99) - (b.week ?? 99) || a.filename.localeCompare(b.filename));
}

export type WeekFilter = number | 'all';

export function filterWeek<T extends { week?: number }>(rows: T[], week: WeekFilter): T[] {
  return week === 'all' ? rows : rows.filter((r) => (r.week ?? 0) === week);
}

export function ledgerCsv(course: Course, steps: LedgerStepRow[], artifacts: LedgerArtifactRow[]): string {
  const header = ['course', 'kind', 'week', 'task', 'step', 'method', 'verified', 'matched', 'total', 'attempts', 'at', 'filename', 'sha256', 'size_bytes', 'name_ok'];
  const body: (string | number | boolean)[][] = [
    ...steps.map((s) => [course.id, 'step', s.week, s.taskTitle, s.stepTitle, s.method, s.verified, s.matched, s.total, s.attempts, s.verifiedAt ? localStamp(s.verifiedAt) : '', '', '', '', '']),
    ...artifacts.map((a) => [course.id, 'artifact', a.week ?? '', '', '', 'file-hash', true, '', '', '', a.hashedAt ? localStamp(a.hashedAt) : '', a.filename, a.sha256, a.sizeBytes, a.nameOk]),
  ];
  return toCsv(header, body);
}
