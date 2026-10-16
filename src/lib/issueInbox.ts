// issueInbox.ts — the reported issues, as one list an admin can work (R120).
//
// A report is filed against a task (and, since 0016, a step) by a member in a role,
// against one version of one course. The admin needs the whole picture in one place:
// who reported it and when, in which course, week, task and step, in what role, which
// version they saw, where it stands, and what was done. This module joins a report to
// the course it is about and answers the questions the inbox asks: filter, group by
// task (where the content needs fixing), count by tab, export. Pure: no clock, no
// store; the loader hands it rows. Names and roles are the ones recorded when the
// report was FILED, so a student who is moved later does not rewrite what they said.
// No member id leaves this module: an issue names a person, never an account.

import type { Course } from './types';
import type { TaskReport } from './data/types';
import { getRoleDef, getTaskById, getWeekDef } from './course-helpers';
import { REPORT_KINDS, isPendingReport, reportKindLabel, reportStatusLabel, type ReportStatus } from './reportKinds';
import { toCsv } from './csv';

export const ISSUE_SCHEMA = 'capstone-issue/1';

/** One report, joined to its course: the shape the inbox draws and the export publishes (`content/schemas/issue.schema.json`). */
export interface IssueDto {
  schema: typeof ISSUE_SCHEMA;
  id: string;
  courseId: string;
  courseTitle: string;
  week: number | null;
  weekTitle: string | null;
  taskId: string;
  taskTitle: string;
  /** The role the task is for, which is not always the reporter's: every task is open to the whole team. */
  taskRole: string | null;
  taskRoleName: string | null;
  stepId: string | null;
  stepTitle: string | null;
  /** 1-based, as the student saw it. */
  stepNumber: number | null;
  kind: string;
  note: string;
  reporter: { name: string; role: string | null; roleName: string | null; teamId: string };
  /** ISO 8601; empty when the report carries no time. */
  reportedAt: string;
  /** The course version the reporter saw, "1.7"; null on a report filed before 0016. */
  contentVersion: string | null;
  status: ReportStatus;
  resolution: { note: string; at: string | null; by: string | null; fixRevision: number | null } | null;
  /** The task or the step it names is no longer in the course. */
  orphan: boolean;
}

/** What the roster and the profiles know, for reports filed before names and roles were recorded with them. */
export interface IssuePeople {
  nameOf: (memberId: string) => string | undefined;
  roleOf: (courseId: string, memberId: string) => string | undefined;
  /** Who closed it: a name, never an id. */
  resolverName: (memberId: string) => string | undefined;
}

const iso = (ms: number | undefined) => (ms !== undefined && Number.isFinite(ms) && ms > 0 ? new Date(ms).toISOString() : '');

/** Join every report to its course and sort newest first. A course or task that is gone still lists, flagged `orphan`. */
export function buildIssues(courses: readonly Course[], reports: readonly TaskReport[], people: IssuePeople): IssueDto[] {
  const rows = reports.map((r): IssueDto => {
    const course = courses.find((c) => c.id === r.courseId);
    const task = course ? getTaskById(course, r.taskId) : undefined;
    const stepIndex = task && r.stepId ? task.steps.findIndex((s) => s.id === r.stepId) : -1;
    const week = task?.week ?? r.week ?? null;
    const roleId = r.reporterRole || people.roleOf(r.courseId, r.memberId) || null;
    const closed = r.status === 'resolved' || r.status === 'wont_fix';
    const hasResolution = closed || !!r.resolutionNote;
    return {
      schema: ISSUE_SCHEMA,
      id: r.id,
      courseId: r.courseId,
      courseTitle: course?.title ?? r.courseId,
      week,
      weekTitle: course && week !== null ? (getWeekDef(course, week)?.title ?? null) : null,
      taskId: r.taskId,
      taskTitle: task?.title ?? r.taskId,
      taskRole: task?.role ?? null,
      taskRoleName: course && task ? (getRoleDef(course, task.role)?.name ?? task.role) : null,
      stepId: r.stepId ?? null,
      stepTitle: stepIndex >= 0 ? task!.steps[stepIndex].title : null,
      stepNumber: stepIndex >= 0 ? stepIndex + 1 : null,
      kind: r.kind,
      note: r.note,
      reporter: {
        name: r.reporterName || people.nameOf(r.memberId) || 'Unnamed',
        role: roleId,
        roleName: roleId ? (course ? (getRoleDef(course, roleId)?.name ?? roleId) : roleId) : null,
        teamId: r.teamId,
      },
      reportedAt: iso(r.at),
      contentVersion: r.contentVersion || null,
      status: r.status,
      resolution: hasResolution
        ? { note: r.resolutionNote ?? '', at: iso(r.resolvedAt) || null, by: (r.resolvedBy && people.resolverName(r.resolvedBy)) || null, fixRevision: r.fixRevision ?? null }
        : null,
      orphan: !task || (!!r.stepId && stepIndex < 0),
    };
  });
  return rows.sort((a, b) => (a.reportedAt < b.reportedAt ? 1 : a.reportedAt > b.reportedAt ? -1 : a.id.localeCompare(b.id)));
}

/** The four tabs: pending is open plus in progress; complete is resolved; won't fix is closed without a change. */
export type IssueTab = 'pending' | 'complete' | 'wont_fix' | 'all';

export function issueTab(status: string): Exclude<IssueTab, 'all'> {
  return isPendingReport(status) ? 'pending' : status === 'resolved' ? 'complete' : 'wont_fix';
}

export interface IssueFilter {
  tab?: IssueTab;
  courseId?: string;
  week?: number;
  /** A role id: the reporter's role as filed. */
  reporterRole?: string;
  /** A role id: the role the task is for. */
  taskRole?: string;
  kind?: string;
  /** A reporter's name, exactly as listed. */
  reporter?: string;
  /** Words that must all appear in the note, the titles, the reporter or the resolution. */
  q?: string;
}

export function filterIssues(rows: readonly IssueDto[], f: IssueFilter): IssueDto[] {
  const terms = (f.q ?? '').toLowerCase().split(/\s+/).filter(Boolean);
  return rows.filter((r) => {
    if (f.tab && f.tab !== 'all' && issueTab(r.status) !== f.tab) return false;
    if (f.courseId && r.courseId !== f.courseId) return false;
    if (f.week !== undefined && r.week !== f.week) return false;
    if (f.reporterRole && r.reporter.role !== f.reporterRole) return false;
    if (f.taskRole && r.taskRole !== f.taskRole) return false;
    if (f.kind && r.kind !== f.kind) return false;
    if (f.reporter && r.reporter.name !== f.reporter) return false;
    if (terms.length) {
      const hay = [r.note, r.taskTitle, r.stepTitle ?? '', r.courseTitle, r.reporter.name, r.resolution?.note ?? ''].join('\n').toLowerCase();
      if (!terms.every((t) => hay.includes(t))) return false;
    }
    return true;
  });
}

export interface IssueCounts {
  pending: number;
  complete: number;
  wontFix: number;
  total: number;
}

/** Counts per tab over the rows given: hand it the rows filtered by everything except the tab, and the tabs read true. */
export function issueCounts(rows: readonly IssueDto[]): IssueCounts {
  const counts: IssueCounts = { pending: 0, complete: 0, wontFix: 0, total: rows.length };
  for (const r of rows) {
    const t = issueTab(r.status);
    if (t === 'pending') counts.pending++;
    else if (t === 'complete') counts.complete++;
    else counts.wontFix++;
  }
  return counts;
}

export interface TaskIssueGroup {
  key: string;
  courseId: string;
  courseTitle: string;
  taskId: string;
  taskTitle: string;
  week: number | null;
  pending: number;
  total: number;
  /** Reports per kind, so "4 say it is broken" is visible before opening any. */
  kinds: Record<string, number>;
  /** The newest report's time. */
  latest: string;
  issues: IssueDto[];
}

/** Group by task, the tasks with the most pending reports first: that is where the content needs fixing. */
export function groupByTask(rows: readonly IssueDto[]): TaskIssueGroup[] {
  const groups = new Map<string, TaskIssueGroup>();
  for (const r of rows) {
    const key = `${r.courseId}::${r.taskId}`;
    const g = groups.get(key) ?? { key, courseId: r.courseId, courseTitle: r.courseTitle, taskId: r.taskId, taskTitle: r.taskTitle, week: r.week, pending: 0, total: 0, kinds: {}, latest: '', issues: [] };
    g.total++;
    if (issueTab(r.status) === 'pending') g.pending++;
    g.kinds[r.kind] = (g.kinds[r.kind] ?? 0) + 1;
    if (r.reportedAt > g.latest) g.latest = r.reportedAt;
    g.issues.push(r);
    groups.set(key, g);
  }
  return [...groups.values()].sort((a, b) => b.pending - a.pending || (a.latest < b.latest ? 1 : a.latest > b.latest ? -1 : 0) || a.taskTitle.localeCompare(b.taskTitle));
}

export interface IssueFacets {
  courses: { id: string; title: string }[];
  weeks: number[];
  reporterRoles: { id: string; name: string }[];
  taskRoles: { id: string; name: string }[];
  kinds: { id: string; label: string }[];
  reporters: string[];
}

/** What each filter offers: only values that exist in the rows, so no choice returns an empty list by construction. */
export function issueFacets(rows: readonly IssueDto[]): IssueFacets {
  const courses = new Map<string, string>();
  const weeks = new Set<number>();
  const reporterRoles = new Map<string, string>();
  const taskRoles = new Map<string, string>();
  const kinds = new Set<string>();
  const reporters = new Set<string>();
  for (const r of rows) {
    courses.set(r.courseId, r.courseTitle);
    if (r.week !== null) weeks.add(r.week);
    if (r.reporter.role) reporterRoles.set(r.reporter.role, r.reporter.roleName ?? r.reporter.role);
    if (r.taskRole) taskRoles.set(r.taskRole, r.taskRoleName ?? r.taskRole);
    kinds.add(r.kind);
    reporters.add(r.reporter.name);
  }
  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
  return {
    courses: [...courses].map(([id, title]) => ({ id, title })).sort((a, b) => a.title.localeCompare(b.title)),
    weeks: [...weeks].sort((a, b) => a - b),
    reporterRoles: [...reporterRoles].map(([id, name]) => ({ id, name })).sort(byName),
    taskRoles: [...taskRoles].map(([id, name]) => ({ id, name })).sort(byName),
    kinds: REPORT_KINDS.filter((k) => kinds.has(k.id)).map((k) => ({ id: k.id, label: k.label })),
    reporters: [...reporters].sort((a, b) => a.localeCompare(b)),
  };
}

const CSV_HEADER = ['id', 'reported_at', 'course', 'week', 'task', 'step', 'reporter', 'reporter_role', 'team', 'kind', 'note', 'content_version', 'status', 'resolution_note', 'resolved_at', 'resolved_by', 'fix_revision'];

/** The inbox as a spreadsheet: one row per report, names and titles rather than ids where a person reads them. */
export function issuesCsv(rows: readonly IssueDto[]): string {
  return toCsv(
    CSV_HEADER,
    rows.map((r) => [
      r.id,
      r.reportedAt,
      r.courseTitle,
      r.week,
      r.taskTitle,
      r.stepTitle ? `${r.stepNumber}. ${r.stepTitle}` : '',
      r.reporter.name,
      r.reporter.roleName ?? '',
      r.reporter.teamId,
      reportKindLabel(r.kind),
      r.note,
      r.contentVersion ?? '',
      reportStatusLabel(r.status),
      r.resolution?.note ?? '',
      r.resolution?.at ?? '',
      r.resolution?.by ?? '',
      r.resolution?.fixRevision ?? '',
    ])
  );
}
