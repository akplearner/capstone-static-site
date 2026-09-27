import { KEYS } from './keys';
import { safeSetItem } from './safeStorage';
import { notifyStore } from '../useClientStore';
import { localStorageProgressRepo } from './localStorageProgressRepo';
import type {
  Cohort,
  CohortRepository,
  DeliverableReview,
  ReviewRepository,
  StepNote,
  StepNotesRepository,
  StuckFlag,
  TaskReport,
  TaskReportsRepository,
} from './types';

// localStorage implementations of the three R68 stores, used when Supabase is
// not configured. Same shape as the evidence ledger: one blob per scope, read
// whole, because every reader wants the whole set at once.

function hasWindow(): boolean {
  return typeof window !== 'undefined';
}

function readJson<T>(key: string, fallback: T): T {
  if (!hasWindow()) return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function reviewKey(deliverableId: string, week: number): string {
  return `${deliverableId}::${week}`;
}

export const localStorageReviewRepo: ReviewRepository = {
  list(courseId: string, teamId: string): DeliverableReview[] {
    return readJson<DeliverableReview[]>(KEYS.reviews(courseId, teamId), []);
  },

  save(review: DeliverableReview): void {
    if (!hasWindow()) return;
    const key = KEYS.reviews(review.courseId, review.teamId);
    // One verdict per (form, week): the newest replaces the last.
    const next = readJson<DeliverableReview[]>(key, []).filter(
      (r) => reviewKey(r.deliverableId, r.week) !== reviewKey(review.deliverableId, review.week)
    );
    next.push(review);
    safeSetItem(key, JSON.stringify(next));
    notifyStore();
  },
};

export const localStorageCohortRepo: CohortRepository = {
  get(courseId: string, cohort: string): Cohort | null {
    return readJson<Cohort | null>(KEYS.cohortCalendar(courseId, cohort), null);
  },

  save(cohort: Cohort): void {
    if (!hasWindow()) return;
    safeSetItem(KEYS.cohortCalendar(cohort.courseId, cohort.cohort), JSON.stringify(cohort));
    notifyStore();
  },
};

export function stepNoteKey(taskId: string, stepId: string): string {
  return `${taskId}::${stepId}`;
}

export const localStorageStepNotesRepo: StepNotesRepository = {
  getAll(courseId: string, memberId: string): Record<string, StepNote> {
    return readJson<Record<string, StepNote>>(KEYS.stepNotes(courseId, memberId), {});
  },

  save(memberId: string, note: StepNote): void {
    if (!hasWindow()) return;
    const key = KEYS.stepNotes(note.courseId, memberId);
    const all = readJson<Record<string, StepNote>>(key, {});
    all[stepNoteKey(note.taskId, note.stepId)] = note;
    safeSetItem(key, JSON.stringify(all));
    notifyStore();
  },

  // On one device the "team" is whoever joined on this browser, which is the
  // same device-scoped truth the team block shows. The flags come out of each
  // member's own blob; the note text never leaves it.
  teamStuck(courseId: string, teamId: string): StuckFlag[] {
    if (!hasWindow()) return [];
    const out: StuckFlag[] = [];
    for (const m of localStorageProgressRepo.getRoster(courseId)) {
      if (m.teamId !== teamId) continue;
      const notes = readJson<Record<string, StepNote>>(KEYS.stepNotes(courseId, m.memberId), {});
      for (const n of Object.values(notes)) {
        if (n.stuck) out.push({ memberId: m.memberId, taskId: n.taskId, stepId: n.stepId, at: n.at });
      }
    }
    return out;
  },

  resetCourse(courseId: string, memberId: string): void {
    if (!hasWindow()) return;
    localStorage.removeItem(KEYS.stepNotes(courseId, memberId));
    notifyStore();
  },
};

// R83: task issue reports. One blob per course, mirroring the cohort repo's
// shape — on a single offline device every member shares the same list, which
// matches how the reports behave in the cloud (team-visible).
export const localStorageTaskReportsRepo: TaskReportsRepository = {
  list(courseId: string): TaskReport[] {
    if (!hasWindow()) return [];
    try {
      const raw = localStorage.getItem(KEYS.taskReports(courseId));
      return raw ? (JSON.parse(raw) as TaskReport[]) : [];
    } catch {
      return [];
    }
  },
  save(report: TaskReport): void {
    if (!hasWindow()) return;
    const all = localStorageTaskReportsRepo.list(report.courseId).filter((r) => r.id !== report.id);
    all.push(report);
    safeSetItem(KEYS.taskReports(report.courseId), JSON.stringify(all));
  },
  resolve(courseId: string, id: string): void {
    if (!hasWindow()) return;
    const all = localStorageTaskReportsRepo.list(courseId).map((r) =>
      r.id === id ? { ...r, status: 'resolved' as const } : r
    );
    safeSetItem(KEYS.taskReports(courseId), JSON.stringify(all));
  },
};
