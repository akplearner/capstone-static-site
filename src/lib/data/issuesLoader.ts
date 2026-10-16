'use client';

import { getBrowserClient } from '../supabase/client';
import { isSupabaseConfigured } from '../supabase/config';
import type { Course } from '../types';
import type { TaskReport } from './types';
import type { IssuePeople } from '../issueInbox';
import { isPendingReport } from '../reportKinds';
import { taskReportFromRow } from './supabaseCache';
import { localStorageProgressRepo } from './localStorageProgressRepo';
import { localStorageTaskReportsRepo } from './localStorageFeatureRepos';
import { selectAll } from './selectAll';
import { isMissingSchema } from './schemaErrors';

/**
 * Every reported issue across every course, whichever storage mode is live (R120).
 *
 * Like the cohort loader this bypasses `supabaseCache`: the cache holds the
 * caller's own course rows, and an instructor on no team has none. The instructor
 * policies (0008, 0010) let this read every report, every membership and every
 * profile; three selects and the rows are shaped here. localStorage mode reads what
 * this browser holds, per course, and the page says so.
 */
export interface IssuesData {
  mode: 'cloud' | 'local';
  reports: TaskReport[];
  /** What the roster and profiles know, for reports filed before names and roles were recorded with them. */
  people: IssuePeople;
  /** Migration 0016 has not been applied: the step, role and version columns and the new statuses do not exist yet. */
  needsUpdate: boolean;
}

const key = (courseId: string, memberId: string) => `${courseId}::${memberId}`;

function peopleFrom(names: Map<string, string>, roles: Map<string, string>, resolvers: Map<string, string>): IssuePeople {
  return {
    nameOf: (id) => names.get(id),
    roleOf: (courseId, id) => roles.get(key(courseId, id)),
    // The offline studio has one operator and no account: say so rather than show an id.
    resolverName: (id) => resolvers.get(id) ?? (id === 'instructor' ? 'Instructor' : undefined),
  };
}

export function loadIssuesLocal(courses: readonly Course[]): IssuesData {
  const reports: TaskReport[] = [];
  const names = new Map<string, string>();
  const roles = new Map<string, string>();
  for (const c of courses) {
    reports.push(...localStorageTaskReportsRepo.list(c.id));
    for (const m of localStorageProgressRepo.getRoster(c.id)) {
      names.set(m.memberId, m.displayName);
      roles.set(key(c.id, m.memberId), m.role);
    }
  }
  return { mode: 'local', reports, people: peopleFrom(names, roles, new Map()), needsUpdate: false };
}

export async function loadIssues(courses: readonly Course[]): Promise<IssuesData> {
  const supabase = isSupabaseConfigured() ? getBrowserClient() : null;
  if (!supabase) return loadIssuesLocal(courses);
  // The one cheap way to learn whether 0016 has been applied: ask for a column it adds.
  const probe = await supabase.from('task_reports').select('step_id').limit(1);
  const needsUpdate = !!probe.error && isMissingSchema(probe.error);
  const [rows, members, profiles] = await Promise.all([
    selectAll((from, to) => supabase.from('task_reports').select('*').order('created_at', { ascending: false }).order('id').range(from, to)),
    selectAll((from, to) => supabase.from('memberships').select('user_id, course_id, role, display_name').order('user_id').order('course_id').range(from, to)),
    supabase.from('profiles').select('id, display_name'),
  ]);
  const names = new Map<string, string>();
  const roles = new Map<string, string>();
  const resolvers = new Map<string, string>();
  for (const p of profiles.data ?? []) {
    const name = String(p.display_name ?? '');
    if (name) {
      names.set(String(p.id), name);
      resolvers.set(String(p.id), name);
    }
  }
  for (const m of members.data) {
    const id = String(m.user_id);
    // A membership's own display name beats the profile's when both exist: it is what teammates saw.
    if (m.display_name) names.set(id, String(m.display_name));
    roles.set(key(String(m.course_id), id), String(m.role));
  }
  return { mode: 'cloud', reports: rows.data.map((r) => taskReportFromRow(r as Record<string, unknown>)), people: peopleFrom(names, roles, resolvers), needsUpdate };
}

/** Pending reports per course, for the instructor home's cards; a failed read is an empty count, never an error on the page. */
export async function loadPendingCounts(courses: readonly Course[]): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  const supabase = isSupabaseConfigured() ? getBrowserClient() : null;
  if (!supabase) {
    for (const c of courses) {
      const n = localStorageTaskReportsRepo.list(c.id).filter((r) => isPendingReport(r.status)).length;
      if (n > 0) counts[c.id] = n;
    }
    return counts;
  }
  const { data } = await selectAll((from, to) => supabase.from('task_reports').select('course_id').in('status', ['open', 'in_progress']).order('created_at').order('id').range(from, to));
  for (const r of data) counts[String(r.course_id)] = (counts[String(r.course_id)] ?? 0) + 1;
  return counts;
}
