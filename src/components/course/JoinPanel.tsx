'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { RoleIcon } from '@/components/team/RoleIcon';
import { SignInPanel } from '@/components/auth/SignInPanel';
import { progressRepo } from '@/lib/data';
import { useClientStore, EMPTY_OBJECT, notifyStore } from '@/lib/useClientStore';
import { getRoleDef } from '@/lib/course-helpers';
import { hasSpecificGuide, roleGuide, worksLabel } from '@/lib/roleGuide';
import { useCourseDocument } from '@/lib/useCourse';
import { roleGuidesOf } from '@/lib/content/read';
import { getMonthlyCohorts } from '@/lib/utils';
import { composeTeamId, parseTeamId, teamLabel } from '@/lib/team';
import type { Course, Member } from '@/lib/types';

// Monthly cohorts (YYYY-MM), generated for the next 12 months.
const COHORTS = getMonthlyCohorts(12);

/** Inline enrollment: pick a team (capacity-aware) and role without leaving the page. */
export function JoinPanel({
  course,
  member,
  userId,
  requireAuth,
  onJoined,
}: {
  course: Course;
  member: Member | null;
  /** Supabase auth user id (null when signed out). Becomes the member id. */
  userId: string | null;
  /** When true (Supabase configured), joining requires sign-in first. */
  requireAuth: boolean;
  onJoined: (m: Member) => void;
}) {
  const teamCount = course.teamCount ?? 3;
  const cap = course.teamCapacity ?? 0; // 0 = unlimited
  const teamIds = Array.from({ length: Math.max(1, teamCount) }, (_, i) => String(i + 1));

  const guides = roleGuidesOf(useCourseDocument());
  const [editing, setEditing] = useState(!member);
  const counts = useClientStore<Record<string, number>>(
    () => progressRepo.getTeamCounts(course.id),
    EMPTY_OBJECT
  );
  const [name, setName] = useState(member?.displayName ?? '');
  const [cohort, setCohort] = useState(member?.cohort ?? COHORTS[0]);
  // The picker holds the bare team NUMBER; the cohort-scoped id is composed on
  // submit (see src/lib/team.ts — Team 1 of one class session must never share
  // stores with Team 1 of another).
  const [team, setTeam] = useState(member ? parseTeamId(member.teamId).num : teamIds[0]);
  const [role, setRole] = useState(member?.role ?? course.roles[0]?.id ?? '');
  const [error, setError] = useState<string | null>(null);

  // Counts are keyed by the scoped id, so capacity fills per class session.
  const usedOf = (t: string) => counts[composeTeamId(cohort, t)] ?? 0;
  // A team is full only for students not already on it.
  const isFull = (t: string) =>
    cap > 0 && usedOf(t) >= cap && !(member && member.teamId === composeTeamId(cohort, t));

  const submit = () => {
    if (!name.trim()) {
      setError('Please enter your name to continue.');
      return;
    }
    // When auth is on, the Supabase user id IS the member id (stable across devices);
    // otherwise fall back to the local synthesized id.
    const newMember: Member = {
      memberId:
        userId ?? member?.memberId ?? `${course.id}-${cohort}-${team}-${role}-${Date.now()}`,
      courseId: course.id,
      teamId: composeTeamId(cohort, team),
      role,
      displayName: name.trim(),
      cohort,
    };
    const res = progressRepo.joinTeam(course, newMember);
    if (!res.ok) {
      setError(
        res.reason === 'team-full'
          ? 'That team is full — pick another team.'
          : 'Could not join this team. Try again.'
      );
      notifyStore();
      return;
    }
    setError(null);
    setEditing(false);
    onJoined(newMember);
  };

  // Auth gate: when Supabase is on, you must sign in before joining a team so your
  // progress is tied to your account and visible to teammates.
  if (requireAuth && !userId) {
    return (
      <SignInPanel
        title="Sign in to join a team"
        subtitle="Joining a team saves your progress to your account and lets your teammates see your work. Sign in to continue — you can keep browsing the course either way."
      />
    );
  }

  // Compact summary once enrolled.
  if (member && !editing) {
    const rd = getRoleDef(course, member.role);
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg depth-edge bg-panel p-5">
        <div className="flex items-center gap-3">
          <RoleIcon iconName={rd?.icon} className="h-7 w-7" color={rd?.color} />
          <div>
            <div className="font-semibold text-ink">{member.displayName}</div>
            <div className="text-sm text-muted">
              {teamLabel(member.teamId)} · {rd?.name ?? member.role} · {member.cohort}
            </div>
          </div>
        </div>
        <Button variant="secondary" onClick={() => setEditing(true)}>
          Change team or role
        </Button>
      </div>
    );
  }

  return (
    <div className="depth-lift space-y-5 rounded-[var(--radius-card)] bg-accent-soft/50 p-6">
      <div>
        <h2 className="text-xl font-bold text-ink">Join this course</h2>
        <p className="mt-1 text-sm text-muted">
          Pick a team and a role to unlock the weekly tasks below.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="block text-sm font-medium text-body">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Your name"
            className="mt-2 w-full rounded-lg bg-panel px-4 py-2 text-ink"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-body">Cohort</span>
          <select
            value={cohort}
            onChange={(e) => setCohort(e.target.value)}
            className="mt-2 w-full rounded-lg bg-panel px-4 py-2 text-ink"
          >
            {COHORTS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <span className="block text-sm font-medium text-body">Team</span>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {teamIds.map((t) => {
            const full = isFull(t);
            const selected = team === t;
            return (
              <button
                key={t}
                type="button"
                disabled={full}
                onClick={() => setTeam(t)}
                // Selection is a TIER, not an outline: the chosen team sits
                // proud of the others and the accent fill names it. A full team
                // is sunk and dimmed.
                className={`rounded-[var(--radius-control)] px-3 py-2 text-sm font-medium transition-colors ${
                  selected
                    ? 'depth-lift bg-accent-soft text-accent-ink'
                    : full
                      ? 'depth-sunk cursor-not-allowed bg-panel-2 text-muted opacity-60'
                      : 'depth-edge depth-hover bg-panel text-body'
                }`}
              >
                <span>Team {t}</span>
                <span className="mt-0.5 block text-2xs font-normal">
                  {cap > 0 ? `${usedOf(t)}/${cap}${full ? ' · Full' : ''}` : `${usedOf(t)} joined`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {course.roles.length > 0 && (
        <div>
          <span className="block text-sm font-medium text-body">Role</span>
          <div className="mt-2 space-y-2">
            {course.roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={`flex w-full items-center gap-3 rounded-[var(--radius-control)] px-4 py-3 text-left transition-colors ${
                  role === r.id ? 'depth-lift bg-accent-soft' : 'depth-edge depth-hover bg-panel'
                }`}
              >
                <RoleIcon iconName={r.icon} className="mt-0.5 h-5 w-5 shrink-0" color={r.color} />
                <span>
                  <span className="block font-medium text-ink">{r.name}</span>
                  {/* The line that tells the roles APART: the authored role
                      guide where one exists, else the role's mission. */}
                  {hasSpecificGuide(guides, r.id) ? (
                    <>
                      <span className="block text-xs text-muted">{roleGuide(guides, r.id).blurb}</span>
                      <span className="mt-0.5 block text-2xs text-muted">
                        {worksLabel(roleGuide(guides, r.id).works)}
                      </span>
                    </>
                  ) : (
                    <span className="block text-xs text-muted">{r.mission}</span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex items-center gap-3">
        <Button onClick={submit} size="lg">
          {member ? 'Save changes' : 'Join course'}
        </Button>
        {member && (
          <Button variant="secondary" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
