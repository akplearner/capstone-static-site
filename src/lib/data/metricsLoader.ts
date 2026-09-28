'use client';

import { getBrowserClient } from '../supabase/client';
import { isSupabaseConfigured } from '../supabase/config';
import { courseRepo } from './index';
import { localStorageProgressRepo } from './localStorageProgressRepo';
import { getRequiredStepCount, getTasksByRole } from '../course-helpers';
import { AGREEMENTS, missingAcceptances } from '../legal/agreements';
import { localAcceptances } from '../legal/acceptances';

/**
 * Everything the admin metrics page shows, in one load (R86): every account
 * with its signup date, staff flags, last activity and acknowledgement
 * status, and every enrolment with a rough progress figure.
 *
 * Progress here is deliberately the cheap number — steps ticked over the
 * role's required steps — because this page answers "how is the platform
 * doing", not "how is this student doing"; the cohort dashboard owns the
 * careful per-student view. And deliberately absent, forever: lab access,
 * notes, private state. Metrics count activity, they do not read work.
 */

export interface MetricsEnrolment {
  courseId: string;
  courseTitle: string;
  teamId: string;
  role: string;
  cohort: string;
  joinedAt: number;
  /** Steps ticked ÷ the role's required steps, capped at 100. */
  percent: number;
}

export interface MetricsUser {
  id: string;
  displayName: string;
  avatarUrl?: string;
  isInstructor: boolean;
  isAdmin: boolean;
  signedUpAt: number;
  lastSeenAt: number | null;
  /** Agreement ids still unaccepted at their current version. */
  missingAgreements: string[];
  enrolments: MetricsEnrolment[];
}

export interface MetricsData {
  mode: 'cloud' | 'local';
  users: MetricsUser[];
  agreementsTotal: number;
}

function percentFor(courseId: string, role: string, ticked: number): number {
  const course = courseRepo.get(courseId);
  if (!course) return 0;
  const total = getTasksByRole(course, role).reduce((n, t) => n + getRequiredStepCount(t), 0);
  if (total === 0) return 0;
  return Math.min(100, Math.round((ticked / total) * 100));
}

export async function loadMetrics(): Promise<MetricsData> {
  if (!isSupabaseConfigured()) return loadMetricsLocal();
  const supabase = getBrowserClient();
  if (!supabase) return loadMetricsLocal();

  const [profiles, memberships, completions, acceptances] = await Promise.all([
    supabase.from('profiles').select('id, display_name, avatar_url, created_at, last_seen_at, is_instructor, is_admin'),
    supabase.from('memberships').select('user_id, course_id, team_id, role, cohort, joined_at'),
    supabase.from('step_completions').select('user_id, course_id'),
    supabase.from('agreement_acceptances').select('user_id, agreement_id, version'),
  ]);

  const ticks = new Map<string, number>(); // `${userId}::${courseId}` → count
  for (const c of completions.data ?? []) {
    const k = `${String(c.user_id)}::${String(c.course_id)}`;
    ticks.set(k, (ticks.get(k) ?? 0) + 1);
  }
  const signed = new Map<string, Record<string, number>>();
  for (const a of acceptances.data ?? []) {
    const uid = String(a.user_id);
    const m = signed.get(uid) ?? {};
    m[String(a.agreement_id)] = Math.max(m[String(a.agreement_id)] ?? 0, Number(a.version ?? 0));
    signed.set(uid, m);
  }
  const enrolments = new Map<string, MetricsEnrolment[]>();
  for (const m of memberships.data ?? []) {
    const uid = String(m.user_id);
    const courseId = String(m.course_id);
    const role = String(m.role);
    const list = enrolments.get(uid) ?? [];
    list.push({
      courseId,
      courseTitle: courseRepo.get(courseId)?.title ?? courseId,
      teamId: String(m.team_id),
      role,
      cohort: String(m.cohort ?? ''),
      joinedAt: m.joined_at ? Date.parse(String(m.joined_at)) : 0,
      percent: percentFor(courseId, role, ticks.get(`${uid}::${courseId}`) ?? 0),
    });
    enrolments.set(uid, list);
  }

  const users: MetricsUser[] = (profiles.data ?? []).map((p) => {
    const id = String(p.id);
    return {
      id,
      displayName: String(p.display_name ?? '') || 'Unnamed',
      avatarUrl: p.avatar_url ? String(p.avatar_url) : undefined,
      isInstructor: !!p.is_instructor,
      isAdmin: !!p.is_admin,
      signedUpAt: p.created_at ? Date.parse(String(p.created_at)) : 0,
      lastSeenAt: p.last_seen_at ? Date.parse(String(p.last_seen_at)) : null,
      missingAgreements: missingAcceptances(signed.get(id) ?? {}).map((a) => a.id),
      enrolments: (enrolments.get(id) ?? []).sort((a, b) => a.courseId.localeCompare(b.courseId)),
    };
  });
  users.sort((a, b) => b.signedUpAt - a.signedUpAt);
  return { mode: 'cloud', users, agreementsTotal: AGREEMENTS.length };
}

/** Offline: what this device knows — its rosters and its own acceptance log. */
function loadMetricsLocal(): MetricsData {
  const users = new Map<string, MetricsUser>();
  const deviceMissing = missingAcceptances(localAcceptances()).map((a) => a.id);
  for (const course of courseRepo.list()) {
    for (const m of localStorageProgressRepo.getRoster(course.id)) {
      const u = users.get(m.memberId) ?? {
        id: m.memberId,
        displayName: m.displayName || 'Unnamed',
        avatarUrl: m.avatarUrl,
        isInstructor: false,
        isAdmin: false,
        signedUpAt: m.joinedAt ?? 0,
        lastSeenAt: null,
        missingAgreements: deviceMissing,
        enrolments: [],
      };
      const ticked = localStorageProgressRepo.getCompletionKeySet(course.id, m.memberId).size;
      u.enrolments.push({
        courseId: course.id,
        courseTitle: course.title,
        teamId: m.teamId,
        role: m.role,
        cohort: m.cohort,
        joinedAt: m.joinedAt ?? 0,
        percent: percentFor(course.id, m.role, ticked),
      });
      users.set(m.memberId, u);
    }
  }
  return { mode: 'local', users: [...users.values()].sort((a, b) => b.signedUpAt - a.signedUpAt), agreementsTotal: AGREEMENTS.length };
}
