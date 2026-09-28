'use client';

import { useState } from 'react';
import { Laptop, Plus, School } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { RoleIcon } from '@/components/team/RoleIcon';
import { SignInPanel } from '@/components/auth/SignInPanel';
import { progressRepo } from '@/lib/data';
import { useClientStore, EMPTY_ARRAY, EMPTY_OBJECT, notifyStore } from '@/lib/useClientStore';
import { getRoleDef } from '@/lib/course-helpers';
import { hasSpecificGuide, roleGuide, worksLabel } from '@/lib/roleGuide';
import { useCourseDocument } from '@/lib/useCourse';
import { roleGuidesOf } from '@/lib/content/read';
import { getMonthlyCohorts } from '@/lib/utils';
import { composeTeamId, parseTeamId, teamLabel, type TeamMode } from '@/lib/team';
import { LocalLegalDialog } from '@/components/legal/AgreementGate';
import { localAcceptances } from '@/lib/legal/acceptances';
import { missingAcceptances } from '@/lib/legal/agreements';
import type { Course, Member } from '@/lib/types';

// Cohort join window (R83): only the CURRENT month's cohort is joinable, so
// everyone in a session is aligned in time. The next month shows a countdown.
const [CURRENT_COHORT, NEXT_COHORT] = getMonthlyCohorts(2);
function daysUntil(cohort: string): number {
  const opens = new Date(`${cohort}-01T00:00:00`);
  return Math.max(1, Math.ceil((opens.getTime() - Date.now()) / 86_400_000));
}

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
  const roster = useClientStore(() => progressRepo.getRoster(course.id), EMPTY_ARRAY);
  const [name, setName] = useState(member?.displayName ?? '');
  // An enrolled member keeps their cohort when editing; a new join is always
  // the current month (R83) — past cohorts are locked, future ones counted down.
  const cohort = member?.cohort ?? CURRENT_COHORT;
  // How they attend (R83): a Local classroom team or an Online lobby. Two
  // separate worlds — each mode's picker lists only its own kind of team.
  const [mode, setMode] = useState<TeamMode>(member ? parseTeamId(member.teamId).mode : 'local');
  // The picker holds the bare team NUMBER; the cohort-scoped id is composed on
  // submit (see src/lib/team.ts — Team 1 of one class session must never share
  // stores with Team 1 of another, and lobbies never mix with local teams).
  const [team, setTeam] = useState(member ? parseTeamId(member.teamId).num : teamIds[0]);
  const [role, setRole] = useState(member?.role ?? course.roles[0]?.id ?? '');
  const [error, setError] = useState<string | null>(null);

  // Counts are keyed by the scoped id, so capacity fills per class session and per mode.
  const usedOf = (t: string, m: TeamMode = mode) => counts[composeTeamId(cohort, t, m)] ?? 0;
  // A team is full only for students not already on it.
  const isFull = (t: string, m: TeamMode = mode) =>
    cap > 0 && usedOf(t, m) >= cap && !(member && member.teamId === composeTeamId(cohort, t, m));

  // The online lobbies that exist right now in this cohort, from the roster —
  // a lobby IS its members, so an empty one disappears on its own. (First
  // lobby slice, R83: join or create with live member counts; presence, chat
  // and matchmaking are deliberately later rounds.)
  const lobbies = (() => {
    const by = new Map<string, { num: string; names: string[]; avatars: (string | undefined)[] }>();
    for (const e of roster) {
      const p = parseTeamId(e.teamId);
      if (p.mode !== 'online' || p.cohort !== cohort) continue;
      const l = by.get(p.num) ?? { num: p.num, names: [], avatars: [] };
      l.names.push(e.displayName || 'Unnamed');
      l.avatars.push(e.avatarUrl);
      by.set(p.num, l);
    }
    return [...by.values()].sort((a, b) => Number(a.num) - Number(b.num));
  })();
  const nextLobbyNum = (() => {
    let n = 1;
    while (lobbies.some((l) => l.num === String(n))) n++;
    return String(n);
  })();

  const [joining, setJoining] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const submit = async () => {
    if (!name.trim()) {
      setError('Please enter your name to continue.');
      return;
    }
    // R86, offline mode: with no account to gate at sign-in, the agreements
    // front the first real act — joining. Accepted once per device; the
    // cloud path is gated app-wide by LegalGateOverlay instead.
    if (!requireAuth && missingAcceptances(localAcceptances()).length > 0) {
      setShowLegal(true);
      return;
    }
    // When auth is on, the Supabase user id IS the member id (stable across devices);
    // otherwise fall back to the local synthesized id.
    const newMember: Member = {
      memberId:
        userId ?? member?.memberId ?? `${course.id}-${cohort}-${team}-${role}-${Date.now()}`,
      courseId: course.id,
      teamId: composeTeamId(cohort, team, mode),
      role,
      displayName: name.trim(),
      cohort,
    };
    // The cloud repo confirms the membership row landed before this resolves;
    // every team-scoped write (forms, gates, flags) is refused by RLS without
    // it, so "joined" must mean the database agrees (R82).
    setJoining(true);
    const res = await Promise.resolve(progressRepo.joinTeam(course, newMember));
    setJoining(false);
    if (!res.ok) {
      setError(
        res.reason === 'team-full'
          ? 'That team is full — pick another team.'
          : 'Couldn’t reach the server to join — check your connection and try again.'
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
        <div>
          <span className="block text-sm font-medium text-body">Class session</span>
          {/* Only the current month is joinable (R83): everyone in a session
              moves through the weeks together. The next one counts down. */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-[var(--radius-control)] depth-lift bg-accent-soft px-3 py-2 text-sm font-medium text-accent-ink">
              {cohort}{member ? '' : ' · open now'}
            </span>
            {!member && (
              <span className="rounded-[var(--radius-control)] depth-sunk bg-panel-2 px-3 py-2 text-sm text-muted" title="Future sessions open on the 1st">
                {NEXT_COHORT} · opens in {daysUntil(NEXT_COHORT)}d
              </span>
            )}
          </div>
        </div>
      </div>

      <div>
        <span className="block text-sm font-medium text-body">How are you attending?</span>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode('local')}
            className={`flex items-start gap-3 rounded-[var(--radius-control)] px-4 py-3 text-left transition-colors ${
              mode === 'local' ? 'depth-lift bg-accent-soft' : 'depth-edge depth-hover bg-panel'
            }`}
          >
            <School className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <span>
              <span className="block font-medium text-ink">In class</span>
              <span className="block text-xs text-muted">Numbered teams, physical builds, your instructor in the room.</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMode('online')}
            className={`flex items-start gap-3 rounded-[var(--radius-control)] px-4 py-3 text-left transition-colors ${
              mode === 'online' ? 'depth-lift bg-accent-soft' : 'depth-edge depth-hover bg-panel'
            }`}
          >
            <Laptop className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <span>
              <span className="block font-medium text-ink">Online</span>
              <span className="block text-xs text-muted">Join an open lobby or start your own — collaborate from anywhere.</span>
            </span>
          </button>
        </div>
      </div>

      {mode === 'local' ? (
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
      ) : (
        <div>
          <span className="block text-sm font-medium text-body">Lobby</span>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {lobbies.map((l) => {
              const full = isFull(l.num, 'online');
              const selected = team === l.num;
              return (
                <button
                  key={l.num}
                  type="button"
                  disabled={full}
                  onClick={() => setTeam(l.num)}
                  className={`flex items-start justify-between gap-3 rounded-[var(--radius-control)] px-4 py-3 text-left transition-colors ${
                    selected
                      ? 'depth-lift bg-accent-soft'
                      : full
                        ? 'depth-sunk cursor-not-allowed bg-panel-2 opacity-60'
                        : 'depth-edge depth-hover bg-panel'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block font-medium text-ink">Lobby {l.num}</span>
                    <span className="block truncate text-xs text-muted">{l.names.join(', ')}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <span className="flex -space-x-1.5">
                      {l.avatars.slice(0, 3).map((a, i) =>
                        a ? (
                          // eslint-disable-next-line @next/next/no-img-element -- provider-hosted picture.
                          <img key={i} src={a} alt="" width={20} height={20} referrerPolicy="no-referrer" className="h-5 w-5 rounded-full border border-panel bg-panel-2 object-cover" />
                        ) : (
                          <span key={i} className="grid h-5 w-5 place-items-center rounded-full border border-panel bg-panel-2 text-3xs font-bold text-muted">
                            {(l.names[i] ?? '?').slice(0, 1).toUpperCase()}
                          </span>
                        )
                      )}
                    </span>
                    <span className="text-2xs text-muted">
                      {cap > 0 ? `${l.names.length}/${cap}${full ? ' · Full' : ''}` : `${l.names.length} in`}
                    </span>
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setTeam(nextLobbyNum)}
              className={`flex items-center gap-2 rounded-[var(--radius-control)] border border-dashed border-line px-4 py-3 text-left text-sm transition-colors hover:bg-panel-2 ${
                team === nextLobbyNum && !lobbies.some((l) => l.num === team) ? 'depth-lift bg-accent-soft' : ''
              }`}
            >
              <Plus className="h-4 w-4 text-accent" />
              <span>
                <span className="block font-medium text-ink">Start a new lobby</span>
                <span className="block text-xs text-muted">Lobby {nextLobbyNum} — teammates can join you from anywhere.</span>
              </span>
            </button>
          </div>
          {lobbies.length === 0 && (
            <p className="mt-2 text-xs text-muted">No open lobbies in this session yet — start the first one.</p>
          )}
        </div>
      )}

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

      <LocalLegalDialog
        open={showLegal}
        onClose={() => setShowLegal(false)}
        onAccepted={() => {
          setShowLegal(false);
          void submit();
        }}
      />

      <div className="flex items-center gap-3">
        <Button onClick={() => void submit()} size="lg" disabled={joining}>
          {joining ? 'Joining…' : member ? 'Save changes' : 'Join course'}
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
