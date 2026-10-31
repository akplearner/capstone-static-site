'use client';

import { useState } from 'react';
import { Laptop, Plus, School } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { RoleIcon } from '@/components/team/RoleIcon';
import { SignInPanel } from '@/components/auth/SignInPanel';
import { progressRepo } from '@/lib/data';
import type { JoinResult } from '@/lib/data/types';
import { useClientStore, EMPTY_ARRAY, EMPTY_OBJECT, notifyStore } from '@/lib/useClientStore';
import { getRoleDef } from '@/lib/course-helpers';
import { profileOf, splitRoleName } from '@/lib/docs/roles';
import { resolveRoleMotion } from '@/lib/roleMotion';
import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';
import { motion } from 'framer-motion';
import { useCourseDocument } from '@/lib/useCourse';
import { rolesOf } from '@/lib/content/read';
import { getMonthlyCohorts } from '@/lib/utils';
import { joinableCohorts } from '@/lib/cohortWindow';
import { leaveCourseTeam, switchCohortTeam } from '@/lib/leaveTeam';
import { KEYS } from '@/lib/data/keys';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { composeTeamId, parseTeamId, teamLabel, type TeamMode } from '@/lib/team';
import { LocalLegalDialog } from '@/components/legal/AgreementGate';
import { localAcceptances } from '@/lib/legal/acceptances';
import { missingAcceptances } from '@/lib/legal/agreements';
import type { Course, Member } from '@/lib/types';

// Cohort join window (R83, widened R150): THIS month's session or NEXT month's is joinable — a
// student who joins on the 30th can sit with the newcomers of the 1st — never an earlier one, and a
// student who has been in a session can only ever move forward (the database holds the same rule).
function daysUntil(cohort: string): number {
  const opens = new Date(`${cohort}-01T00:00:00`);
  return Math.max(1, Math.ceil((opens.getTime() - Date.now()) / 86_400_000));
}

/** R150: the sentences every leave or switch is confirmed with — what stays, what goes, what cannot be undone. */
export const LEAVE_COPY = {
  keeps: 'Your earned skills and metrics stay on your account — nothing you have earned is lost.',
  team: 'Your team’s capstone documents and progress stay with your old team.',
  fresh: 'Your own ticks, evidence and notes for this course are cleared: with your new team you build the system again from Week 0.',
  rule: 'You can only join this month’s or next month’s class session, never an earlier one. This cannot be undone.',
} as const;

function LeaveMessage() {
  return (
    <ul className="list-disc space-y-1 pl-5">
      <li>{LEAVE_COPY.keeps}</li>
      <li>{LEAVE_COPY.team}</li>
      <li>{LEAVE_COPY.fresh}</li>
      <li>{LEAVE_COPY.rule}</li>
    </ul>
  );
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

  const roles = rolesOf(useCourseDocument());
  const roleMotion = resolveRoleMotion(roles.MOTION, useReducedMotionSafe());
  // R117: a member whose role was removed from the course is asked for a new one, with the picker open.
  const roleGone = !!member && !getRoleDef(course, member.role);
  const [editing, setEditing] = useState(!member || roleGone);
  const counts = useClientStore<Record<string, number>>(
    () => progressRepo.getTeamCounts(course.id),
    EMPTY_OBJECT
  );
  const roster = useClientStore(() => progressRepo.getRoster(course.id), EMPTY_ARRAY);
  const [name, setName] = useState(member?.displayName ?? '');
  // R150: the sessions this student may join — this month and next, never below the floor the
  // database remembers for them. An enrolled member may also STAY where they are.
  const floor = useClientStore<string | null>(() => progressRepo.getCohortFloor(course.id), null);
  const [CURRENT_COHORT] = getMonthlyCohorts(2);
  const openCohorts = joinableCohorts(new Date(), floor);
  const cohortChoices = member ? [member.cohort, ...openCohorts.filter((c) => c !== member.cohort)] : openCohorts;
  const [cohort, setCohort] = useState(member?.cohort ?? openCohorts[0] ?? CURRENT_COHORT);
  const switching = !!member && cohort !== member.cohort;
  // How they attend (R83): a Local classroom team or an Online lobby. Two
  // separate worlds — each mode's picker lists only its own kind of team.
  const [mode, setMode] = useState<TeamMode>(member ? parseTeamId(member.teamId).mode : 'local');
  // The picker holds the bare team NUMBER; the cohort-scoped id is composed on
  // submit (see src/lib/team.ts — Team 1 of one class session must never share
  // stores with Team 1 of another, and lobbies never mix with local teams).
  const [team, setTeam] = useState(member ? parseTeamId(member.teamId).num : teamIds[0]);
  const [role, setRole] = useState(member && !roleGone ? member.role : (course.roles[0]?.id ?? ''));
  const [error, setError] = useState<string | null>(null);

  // Counts are keyed by the scoped id, so capacity fills per class session and per mode.
  const usedOf = (t: string, m: TeamMode = mode) => counts[composeTeamId(cohort, t, m)] ?? 0;
  // A team is full only for students not already on it.
  const isFull = (t: string, m: TeamMode = mode) =>
    cap > 0 && usedOf(t, m) >= cap && !(member && member.teamId === composeTeamId(cohort, t, m));

  // R154: within a team each role is led by one member; a second joins only as a co-work peer, and only
  // if the role's holder has allowed it. The chosen team is the scoped id; holders come from the roster.
  const rolePeering = useClientStore<Record<string, boolean>>(() => progressRepo.getRolePeering(course.id), EMPTY_OBJECT);
  const scopedTeam = composeTeamId(cohort, team, mode);
  const roleHolders = (roleId: string) => roster.filter((e) => e.teamId === scopedTeam && e.role === roleId && !(member && e.memberId === member.memberId));
  const peerAllowed = (teamId: string, roleId: string) => !!rolePeering[`${teamId}::${roleId}`];
  type RoleState = 'mine' | 'open' | 'peer' | 'taken' | 'full';
  const roleState = (roleId: string): RoleState => {
    if (member && member.role === roleId && member.teamId === scopedTeam) return 'mine';
    const n = roleHolders(roleId).length;
    if (n === 0) return 'open';
    if (n === 1) return peerAllowed(scopedTeam, roleId) ? 'peer' : 'taken';
    return 'full';
  };

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
  const [confirming, setConfirming] = useState<'leave' | 'switch' | null>(null);
  const finish = (res: JoinResult, joined: Member) => {
    setJoining(false);
    if (!res.ok) {
      setError(
        res.reason === 'team-full'
          ? 'That team is full — pick another team.'
          : res.reason === 'role-full'
            ? 'That role already has two members — pick another role.'
            : res.reason === 'role-taken'
              ? 'That role is taken — ask its member to allow a co-work peer, or pick another role.'
              : 'Couldn’t reach the server to join — check your connection and try again.'
      );
      notifyStore();
      return;
    }
    setError(null);
    setEditing(false);
    onJoined(joined);
  };
  // R150: leaving banks what was earned, clears this course's own work and frees the seat; the
  // member context goes with it, so the page falls back to the join form on its own.
  const leave = async () => {
    if (!member) return;
    setJoining(true);
    const left = await leaveCourseTeam(course, member);
    setJoining(false);
    if (!left) setError('Couldn’t reach the server to leave — check your connection and try again.');
  };
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
    // R150, offline: a student who left keeps the id they left under, so a rejoin is theirs.
    const leftId = typeof window === 'undefined' ? null : localStorage.getItem(KEYS.leftMemberId(course.id));
    const newMember: Member = {
      memberId:
        userId ?? member?.memberId ?? leftId ?? `${course.id}-${cohort}-${team}-${role}-${Date.now()}`,
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
    // R150: a later session is a leave followed by a join (the work starts over, the account keeps
    // what it earned); a team or role change inside the same session is the in-place save it was.
    if (member && switching) {
      finish(await switchCohortTeam(course, member, newMember), newMember);
      return;
    }
    const res = await Promise.resolve(progressRepo.joinTeam(course, newMember));
    finish(res, newMember);
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
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => setEditing(true)}>
            Change team or role
          </Button>
          <Button variant="ghost" onClick={() => setConfirming('leave')} disabled={joining} data-leave-team>
            {joining ? 'Leaving…' : 'Leave team'}
          </Button>
        </div>
        {/* R154: the role's leader decides whether a co-work peer may join their role. */}
        <label className="flex w-full items-center gap-2 text-sm text-body" data-allow-peer>
          <input
            type="checkbox"
            checked={peerAllowed(member.teamId, member.role)}
            onChange={(e) => void Promise.resolve(progressRepo.setRolePeering(course.id, member.teamId, member.role, e.target.checked))}
          />
          Allow a co-work peer to join my role ({rd?.name ?? member.role})
        </label>
        {error && <p className="w-full text-sm text-danger">{error}</p>}
        <ConfirmDialog
          open={confirming === 'leave'}
          onClose={() => setConfirming(null)}
          onConfirm={() => void leave()}
          title={`Leave ${teamLabel(member.teamId)} (${member.cohort}) and start fresh?`}
          message={<LeaveMessage />}
          confirmLabel="Leave team"
        />
      </div>
    );
  }

  return (
    <div className="depth-lift space-y-5 rounded-[var(--radius-card)] bg-accent-soft/50 p-6">
      <div>
        <h2 className="text-xl font-bold text-ink">{roleGone ? 'Pick a role' : 'Join this course'}</h2>
        <p className="mt-1 text-sm text-muted">
          {roleGone
            ? 'Your role is not part of this course any more. Pick one to carry on; your progress stays.'
            : 'Pick a team and a role to unlock the weekly tasks below.'}
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
          {/* This month's session or next month's (R150): everyone in a session moves through the
              weeks together, and a late joiner may sit with the month about to start. Sessions the
              student has already been in sit behind them — only their own current one is offered. */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {cohortChoices.map((c) => {
              const selected = cohort === c;
              const tag = member?.cohort === c ? 'your session' : c === CURRENT_COHORT ? 'open now' : `next · starts in ${daysUntil(c)}d`;
              return (
                <button
                  key={c}
                  type="button"
                  data-cohort-pick={c}
                  aria-pressed={selected}
                  onClick={() => setCohort(c)}
                  title={c === CURRENT_COHORT || member?.cohort === c ? undefined : 'Starts on the 1st — join now to be on that team from day one'}
                  className={`rounded-[var(--radius-control)] px-3 py-2 text-sm font-medium transition-colors ${
                    selected ? 'depth-lift bg-accent-soft text-accent-ink' : 'depth-edge depth-hover bg-panel text-body'
                  }`}
                >
                  {c} · {tag}
                </button>
              );
            })}
            {cohortChoices.length === 0 && (
              <span className="text-sm text-muted" data-no-cohort>No session is open to join right now.</span>
            )}
          </div>
          {switching && (
            <p className="mt-2 text-xs text-muted" data-switch-note>
              Moving to {cohort} leaves your {member!.cohort} team: your earned skills stay, your course work starts over.
            </p>
          )}
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
          {cap > 0 && teamIds.length > 0 && teamIds.every((t) => isFull(t)) && (
            <p className="mt-2 text-sm text-warn" role="status" data-all-full>
              Every team is full.{' '}
              <button type="button" onClick={() => setMode('online')} className="font-medium text-accent underline-offset-2 hover:underline">
                Start or join an online lobby
              </button>
              , or ask your instructor to open another team.
            </p>
          )}
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
          {/* R154: a fixed set of roles; each is led by one, a second joins as a permitted co-work peer. */}
          <p className="mt-1 text-xs text-muted" data-role-note>
            This team has {course.roles.length} roles. Each is led by one member; a second may join a role as a co-work peer only if its first member allows it.
          </p>
          <div className="mt-2 space-y-2">
            {course.roles.map((r, i) => {
              const profile = profileOf(roles.PROFILES, r.id);
              const { fn, tag } = splitRoleName(r.name);
              const st = roleState(r.id);
              const blocked = st === 'taken' || st === 'full';
              const holder = roleHolders(r.id)[0]?.displayName;
              const status =
                st === 'mine' ? 'your role'
                : st === 'peer' ? `${holder ?? 'A member'} leads this — you’d join as a co-work peer`
                : st === 'taken' ? `${holder ?? 'A member'} leads this — ask them to allow a peer`
                : st === 'full' ? 'two members — full'
                : null;
              return (
                <motion.button
                  key={r.id}
                  type="button"
                  data-role-pick={r.id}
                  data-role-state={st}
                  disabled={blocked}
                  onClick={() => { if (!blocked) setRole(r.id); }}
                  aria-pressed={role === r.id}
                  className={`flex w-full items-start gap-3 rounded-[var(--radius-control)] px-4 py-3 text-left transition-colors ${
                    blocked ? 'depth-sunk cursor-not-allowed bg-panel-2 opacity-60' : role === r.id ? 'depth-lift bg-accent-soft' : 'depth-edge depth-hover bg-panel'
                  }`}
                  initial={roleMotion.on ? { opacity: 0, y: 4 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={roleMotion.row(i)}
                >
                  <RoleIcon iconName={r.icon} className="mt-0.5 h-5 w-5 shrink-0" color={r.color} />
                  <span className="min-w-0">
                    <span className="block font-medium text-ink">
                      {fn}
                      {tag && <span className="ml-1.5 text-xs font-normal text-muted">{tag}</span>}
                      {status && <span className="ml-1.5 text-2xs font-normal text-muted" data-role-status>· {status}</span>}
                    </span>
                    {/* The lines that tell the roles APART: the profile where the
                        document carries one, else the role's mission. */}
                    {profile ? (
                      <>
                        <span className="mt-0.5 block text-xs text-body">{profile.summary}</span>
                        <span className="mt-1 block text-2xs text-muted">
                          {roles.WORKS_LABEL[profile.works]} {profile.responsibilities.join(' · ')}
                        </span>
                      </>
                    ) : (
                      <span className="block text-xs text-muted">{r.mission}</span>
                    )}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {roleState(role) === 'peer' && (
        <p className="text-sm text-accent-ink" data-peer-notice>
          You’ll join {roleHolders(role)[0]?.displayName ?? 'the current member'}’s role as a co-work peer.
        </p>
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

      {member && (
        <ConfirmDialog
          open={confirming === 'switch'}
          onClose={() => setConfirming(null)}
          onConfirm={() => void submit()}
          title={`Move to the ${cohort} session?`}
          message={<LeaveMessage />}
          confirmLabel="Leave and switch"
        />
      )}

      <div className="flex items-center gap-3">
        <Button onClick={() => (switching ? setConfirming('switch') : void submit())} size="lg" disabled={joining || cohortChoices.length === 0}>
          {joining ? 'Joining…' : switching ? 'Leave and switch' : member ? 'Save changes' : 'Join course'}
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
