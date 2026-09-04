'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  GraduationCap,
  Inbox,
  Lock,
  RotateCcw,
  Sparkles,
  Tag,
  Users,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button, Collapsible } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { toast } from '@/components/ui/Toast';
import { StepDetail } from '@/components/TaskComponents';
import { GuidedTaskRunner } from '@/components/GuidedTaskRunner';
import { CourseSubNav } from '@/components/CourseSubNav';
import { socTopology } from '@/lib/labTopology';
import { WeekGatePanel } from '@/components/WeekGatePanel';
import { WeekMilestoneHeader } from '@/components/WeekMilestoneHeader';
import { RoleIcon } from '@/components/RoleIcon';
import { EmptyState } from '@/components/EmptyState';
import { TeamBlock } from '@/components/TeamBlock';
import { CourseEnrolGate } from '@/components/CourseEnrolGate';
import { SignInPanel } from '@/components/auth/SignInPanel';
import { ImportPrompt } from '@/components/auth/ImportPrompt';
import { LabAccessPanel } from '@/components/LabAccessPanel';
import { useCourse } from '@/lib/useCourse';
import { useMember } from '@/lib/useMember';
import { useAuth } from '@/lib/useAuth';
import { useInstructorAuth } from '@/lib/useInstructorAuth';
import { useSupabaseSync } from '@/lib/useSupabaseSync';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { progressRepo, userStateRepo, docsRepo } from '@/lib/data';
import { useClientStore, EMPTY_OBJECT, notifyStore } from '@/lib/useClientStore';
import { getRoleDef, getTasksByRole, getWeekTasks, isEngagement, isSetupWeek, phaseTag, taskCard, unitWord } from '@/lib/course-helpers';
import { readResume, resolveActiveWeek, type ResumePoint } from '@/lib/resume';
import { deriveCrewProgress } from '@/lib/game';
import { StepTally, PixelBadge } from '@/components/ui/Pixel';
import { CapstoneStonePanel } from '@/components/quarry/CapstoneStone';
import { phaseForWeek } from '@/lib/quarry';
import { isCapstoneFiled, isDeliverableFiled } from '@/lib/deliverableChain';
import { courseIdentityLabel } from '@/lib/courseTheme';
import { EngagementBanner } from '@/components/EngagementBanner';
import { EngagementStatus } from '@/components/EngagementStatus';
import { deliverablesForCourse } from '@/lib/docs/definitions';
import { hasSpecificGuide, roleGuide, worksLabel } from '@/lib/roleGuide';
import { getFrameworkColor, getFrameworkLabel, getMonthlyCohorts } from '@/lib/utils';
import { composeTeamId, parseTeamId, teamLabel } from '@/lib/team';
import { Course, GateStatus, Member, Task } from '@/lib/types';
import { SOC_LOGIN_LABEL, SOC_URL } from '@/lib/labTopology';
import { Alert } from '@/components/ui/Alert';
import { DUR, EASE, SPRING, meter, swap } from '@/lib/motion';
import { CoursePageSkeleton } from '@/components/ui/Skeletons';

// Monthly cohorts (YYYY-MM), generated for the next 12 months.
const COHORTS = getMonthlyCohorts(12);

type CourseStats = {
  weekStats: Record<number, number>;
  taskStats: Record<string, number>;
  gateStats: Record<number, GateStatus>;
  /** The week to open on load — where the student stopped, else the first
   *  incomplete non-setup week. See src/lib/resume.ts. */
  activeWeek: number;
  /** The exact checkbox the student last ticked, if we still have it. */
  resume: ResumePoint | null;
};
const EMPTY_STATS: CourseStats = {
  weekStats: {},
  taskStats: {},
  gateStats: {},
  activeWeek: 1,
  resume: null,
};

/** Inline enrollment: pick a team (capacity-aware) and role without leaving the page. */
function JoinPanel({
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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-panel p-5">
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
    <div className="space-y-5 rounded-lg border-2 border-accent/30 bg-accent-soft/50 p-6">
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
            className="mt-2 w-full rounded-lg border border-line bg-panel px-4 py-2 text-ink"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-body">Cohort</span>
          <select
            value={cohort}
            onChange={(e) => setCohort(e.target.value)}
            className="mt-2 w-full rounded-lg border border-line bg-panel px-4 py-2 text-ink"
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
                className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors ${
                  selected
                    ? 'border-accent bg-accent-soft text-accent-ink'
                    : full
                      ? 'cursor-not-allowed border-line bg-panel-2 text-muted opacity-60'
                      : 'border-line bg-panel text-body hover:border-accent'
                }`}
              >
                <span>Team {t}</span>
                <span className="mt-0.5 block text-[11px] font-normal">
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
                className={`flex w-full items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-colors ${
                  role === r.id
                    ? 'border-accent bg-accent-soft'
                    : 'border-line bg-panel hover:border-accent'
                }`}
              >
                <RoleIcon iconName={r.icon} className="mt-0.5 h-5 w-5 shrink-0" color={r.color} />
                <span>
                  <span className="block font-medium text-ink">{r.name}</span>
                  {/* The line that tells the roles APART. Without a written
                      guide for this course's role ids, the old code showed the
                      generic fallback — four identical blurbs on four buttons —
                      while each role's authored mission went unrendered. */}
                  {hasSpecificGuide(r.id, course.id) ? (
                    <>
                      <span className="block text-xs text-muted">{roleGuide(r.id, course.id).blurb}</span>
                      <span className="mt-0.5 block text-[11px] text-muted">
                        {worksLabel(roleGuide(r.id, course.id).works)}
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

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

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

/** Read-only view of a task's steps (used for other roles' reference content). */
function TaskReference({ task }: { task: Task }) {
  return (
    <div className="space-y-3">
      {task.steps.map((s, i) => (
        <div key={s.id} className="rounded-lg border border-line bg-panel-2 p-4">
          <div className="eyebrow-muted">
            Step {i + 1}
          </div>
          <h4 className="mt-0.5 font-semibold text-ink">{s.title}</h4>
          <div className="mt-3">
            <StepDetail
              instruction={s.instruction}
              /* instructionList and fixes were both missing here, so the
                 read-only view of another role's task showed the summary line
                 and dropped the actual procedure under it. */
              instructionList={s.instructionList}
              paths={s.paths}
              guideRef={s.guideRef}
              description={s.description}
              command={s.command}
              commands={s.commands}
              commandExplanation={s.commandExplanation}
              commandFlags={s.commandFlags}
              expectedOutput={s.expectedOutput}
              outputExplanation={s.outputExplanation}
              whatItMeans={s.whatItMeans}
              frameworks={s.frameworks}
              deliverable={s.producesDeliverable}
              usesForm={s.usesForm}
              danger={s.danger}
              troubleshooting={s.troubleshooting}
              fixes={s.fixes}
              verify={s.verify}
              optional={s.optional}
              where={s.where}
              path={s.path}
              files={s.files}
              tree={s.tree}
              walkthrough={s.walkthrough}
              images={s.images}
              outputHighlights={s.outputHighlights}
              outputKind={s.outputKind}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** One row of the card: a label and its content, omitted entirely when there is
 *  nothing to show. Keeping the omission here is what lets a course that never
 *  authored `learn` or `consumes` render a shorter card rather than a card full
 *  of empty headings. */
function CardRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
      <div className="min-w-0 flex-1">
        <span className="font-mono text-[10px] uppercase tracking-wide text-muted">{label}</span>
        <div className="mt-0.5 text-sm text-ink">{children}</div>
      </div>
    </div>
  );
}

/**
 * Everything about a task that is not a step, gathered for the "About this
 * task" disclosure: the done-criteria, the identity strip (needs / produces /
 * hand-offs), and the tools-and-learning brief. These used to render as three
 * separate always-open blocks stacked between the task title and its first
 * checkbox — ~129 words of framing per task before a single instruction. The
 * instructor's instruction was "checklist only", so the checklist now comes
 * first and this panel holds the rest, one press away. Nothing was deleted:
 * Security+ authors hand-offs on 15/15 tasks and MSSP on 9/14, and the DoD is
 * the task-level finish line — they must stay reachable, just not in the way.
 */
function TaskAboutPanel({ course, task }: { course: Course; task: Task }) {
  const card = taskCard(course, task);
  const roleName = (id: string) => getRoleDef(course, id)?.name ?? id;
  const done = task.definitionOfDone ?? [];
  const hasBrief = !!(task.learn?.length || task.frameworks?.length || task.tools?.length);

  return (
    <div className="space-y-3">
      {done.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 eyebrow-muted">
            <CheckCircle2 className="h-3.5 w-3.5" /> Done when
          </div>
          <ul className="mt-1.5 space-y-1 text-sm text-ink">
            {done.map((d) => (
              <li key={d} className="flex gap-1.5">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {(card.inputs.length > 0 || card.produces.length > 0 || card.handoff.length > 0) && (
        <div className="grid gap-3 border-t border-line pt-3 sm:grid-cols-3">
          {card.inputs.length > 0 && (
            <CardRow icon={Inbox} label="You need first">
              <ul className="space-y-0.5">
                {card.inputs.map((i, n) => (
                  <li key={`${i.label}-${n}`}>
                    {i.from && (
                      <span
                        className="font-semibold"
                        style={{ color: getRoleDef(course, i.from)?.color }}
                      >
                        {roleName(i.from)}:{' '}
                      </span>
                    )}
                    {i.label}
                  </li>
                ))}
              </ul>
            </CardRow>
          )}
          {card.produces.length > 0 && (
            <CardRow icon={FileText} label="You produce">
              <ul className="space-y-0.5">
                {card.produces.map((d) => (
                  <li key={d} className="break-all font-mono text-[11px]">
                    {d}
                  </li>
                ))}
              </ul>
            </CardRow>
          )}
          {card.handoff.length > 0 && (
            <CardRow icon={ArrowRight} label="Hand off to">
              <ul className="space-y-0.5">
                {card.handoff.map((h, n) => (
                  <li key={`${h.to}-${n}`}>
                    <span
                      className="font-semibold"
                      style={{ color: getRoleDef(course, h.to)?.color }}
                    >
                      {roleName(h.to)}
                    </span>
                    {h.artifact ? ` — ${h.artifact}` : ''}
                    <span className="text-muted"> · {h.note}</span>
                  </li>
                ))}
              </ul>
            </CardRow>
          )}
        </div>
      )}
      {hasBrief && (
        <div className="space-y-3 border-t border-line pt-3">
          {task.tools && task.tools.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="flex items-center gap-1 eyebrow-muted">
                <Wrench className="h-3.5 w-3.5" /> Tools
              </span>
              {task.tools.map((tool) => (
                <span
                  key={tool}
                  className="rounded border border-line bg-panel-2 px-1.5 py-0.5 font-mono text-[11px] text-ink"
                >
                  {tool}
                </span>
              ))}
            </div>
          )}
          {task.learn && task.learn.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 eyebrow-muted">
                <GraduationCap className="h-3.5 w-3.5" /> What you&apos;ll learn
              </div>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-body">
                {task.learn.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          )}
          {task.frameworks.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="flex items-center gap-1 eyebrow-muted">
                <Tag className="h-3.5 w-3.5" /> Frameworks
              </span>
              {task.frameworks.map((fw) => (
                <span
                  key={fw}
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getFrameworkColor(fw)}`}
                >
                  {getFrameworkLabel(fw)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * A single collapsible task, stating everything it is.
 *
 * The header stays scannable — title, status, size, time — and the detail rows
 * underneath answer the questions a student actually has before starting: what
 * do I need first and from whom, what will I produce, and who is waiting on it.
 * Those three were all authored in the seed data and none of them were rendered:
 * deliverables appeared only as a count, `handoff[].note` was dropped, and
 * nothing showed inputs at all.
 */
function TaskRow({
  course,
  task,
  isOwn,
  joined,
  open,
  percent,
  onToggle,
  isNext,
  number,
  focus,
  renderBody,
}: {
  course: Course;
  task: Task;
  isOwn: boolean;
  joined: boolean;
  open: boolean;
  percent: number;
  onToggle: () => void;
  isNext?: boolean;
  /** Shared-track courses: this is the one task of the week that is yours
   *  alone — the deep-dive your documentation focus adds to the shared build.
   *  It sits last in the week's one list, so the chip is what marks it. */
  focus?: boolean;
  /** 1-based position in the week's checklist, mono "1." before the title.
   *  Continuous across the shared lane then the focus lane — the same order
   *  the removed WeekTaskFlow cards displayed. Reference tasks: unnumbered. */
  number?: number;
  /**
   * The body, as a thunk rather than an element.
   *
   * This was `children`, which meant every call site evaluated
   * `renderTaskBody(task, …)` for EVERY row — including the collapsed ones,
   * whose body is then thrown away by the `open &&` below. That is a whole
   * `GuidedTaskRunner` element tree per row, and worse, `renderTaskBody` ran a
   * loop over `sortedWeeks × getTasksByRole` to find the next incomplete task,
   * so a week of 5 collapsed tasks did that search 5 times for nothing.
   *
   * A function is called only where the result is used. It also removes the one
   * thing that made `React.memo` on this component impossible — `children` was
   * a fresh element tree on every render, so a memo could never have hit.
   */
  renderBody: () => React.ReactNode;
}) {
  const canOpen = joined;
  const card = taskCard(course, task, percent);
  const steps = card.steps.total;
  const doneSteps = card.steps.done;
  const showProgress = isOwn && joined;

  return (
    <div
      id={`task-${task.id}`}
      // Stratum 2: a task is cut *into* the week, so it sits inset and a shade
      // darker rather than repeating the week's card treatment.
      className="stratum-task scroll-under-chrome overflow-hidden"
    >
      <button
        type="button"
        disabled={!canOpen}
        onClick={() => canOpen && onToggle()}
        className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors ${
          canOpen ? 'hover:bg-panel-2' : 'cursor-not-allowed opacity-70'
        }`}
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            {number != null && (
              <span className="font-mono text-sm font-semibold text-muted">{number}.</span>
            )}
            <span className="font-medium text-ink">{task.title}</span>
            {focus && (
              <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-ink">
                Your focus
              </span>
            )}
            {showProgress && percent === 100 && (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-ok" />
            )}
            {isNext && percent < 100 && (
              <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-ink">
                Next
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate text-sm text-muted">
            {task.objective}
          </span>

          {/* Scannable meta row — only what's specific to this closed task:
              progress and time. Difficulty lives on the week glance card (a
              task's difficulty is the week's); the optional-step count is on
              the runner toolbar once open ("N of M · x optional"); hand-offs
              render in full on the open task's identity strip. The collapsed
              row restating those was 11 elements before a student had read a
              single instruction. */}
          <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
            {showProgress ? (
              <span className="flex items-center gap-1.5" title={`${percent}% done`}>
                <span className="relative block h-1.5 w-20 overflow-hidden rounded-full bg-line">
                  {/* scaleX, not width. Two reasons, and both matter here:
                      a width transition re-lays-out its row on every frame (24
                      task rows on a week), and `MotionConfig reducedMotion` stills
                      transforms for free — a width animation would keep running
                      for a student who asked for none. */}
                  <motion.span
                    className="absolute inset-0 origin-left rounded-full bg-accent"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: percent / 100 }}
                    transition={meter}
                  />
                </span>
                <span className="text-muted">
                  {doneSteps}/{steps} steps
                </span>
              </span>
            ) : (
              <span className="text-muted">{steps} steps</span>
            )}
            {task.estimatedTime && (
              <span className="flex items-center gap-1 text-muted">
                <Clock className="h-3.5 w-3.5" /> {task.estimatedTime}
              </span>
            )}
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-3 pt-0.5">
          {!canOpen ? (
            <Lock className="h-4 w-4 text-muted" />
          ) : open ? (
            <ChevronDown className="h-5 w-5 text-muted" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted" />
          )}
        </span>
      </button>

      {open && canOpen && (
        <div className="border-t border-line p-4">
          {/* The identity strip (needs / produces / hand-offs) used to render
              here, above the steps, on every open task. It moved into the
              "About this task" disclosure (TaskAboutPanel) — the checklist
              comes first now. */}
          {renderBody()}
        </div>
      )}
    </div>
  );
}

export default function CoursePage() {
  const course = useCourse();
  const { member, loading, setMember } = useMember(course.id);
  const { user } = useAuth();
  const { unlocked: instructorOverride } = useInstructorAuth();
  useSupabaseSync(course.id);
  const requireAuth = isSupabaseConfigured();
  const unit = unitWord(course).toLowerCase();
  const [confirmingReset, setConfirmingReset] = useState(false);
  // The Week-0 build task is only for students setting up their own lab from home;
  // the classroom SOC is already built. Gate its expansion behind a confirmation
  // (persisted per device) so students don't do the build work they don't need.
  const [homeBuildDialog, setHomeBuildDialog] = useState(false);
  const [pendingHomeBuild, setPendingHomeBuild] = useState<Task | null>(null);
  const homeBuildAck = useClientStore<boolean>(
    () => (member ? userStateRepo.get(course.id, member.memberId)?.homeBuildAck === true : false),
    false
  );
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  // One week at a time. null = the student hasn't picked, so the week the
  // resume pointer resolves to shows; a pick is written to `?week=` the way the
  // Deliverables page does it, so it is bookmarkable and survives Back.
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  // Role-split courses keep teammates' tasks as a read-only footer under the
  // list — they carry real hand-offs a student has to be able to open.
  const [othersOpen, setOthersOpen] = useState(false);
  // The "do once" setup strip. null = follow the resume pointer: open only when
  // the student actually stopped inside Setup. In class the lab already exists.
  const [setupOpen, setSetupOpen] = useState<boolean | null>(null);
  const [tab, setTabState] = useState<'home' | 'tasks'>('home');
  // Honor `?tab=tasks` (and the older `?tab=weeks`, which bookmarks still
  // carry) plus `?week=N`. In an effect, not a lazy initializer, so server and
  // client first render match; the one-shot sync on mount is intentional.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('tab');
    const w = params.get('week');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (t === 'tasks' || t === 'weeks') setTabState('tasks');
    if (w !== null && Number.isFinite(Number(w))) setSelectedWeek(Number(w));
    // Write the current spelling back, so a copied URL carries `tasks`.
    if (t === 'weeks') {
      params.set('tab', 'tasks');
      window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}${window.location.hash}`);
    }
  }, []);

  // Progress writes broadcast through the store; useClientStore re-reads below.
  const onProgressChange = useCallback(() => notifyStore(), []);

  // Derived from one batched localStorage scan (week %, task %, gate status, and
  // the first-incomplete "active" week), kept live via the store subscription.
  const { weekStats, taskStats, gateStats, activeWeek, resume } = useClientStore<CourseStats>(() => {
    const weeks: Record<number, number> = {};
    const tasks: Record<string, number> = {};
    const gates: Record<number, GateStatus> = {};
    let resumePoint: ResumePoint | null = null;
    if (member) {
      const keySet = progressRepo.getCompletionKeySet(course.id, member.memberId);
      [...course.weeks]
        .sort((a, b) => a.number - b.number)
        .forEach((w) => {
          weeks[w.number] = progressRepo.getWeekCompletion(
            course, member.memberId, member.role, w.number, keySet
          );
          getTasksByRole(course, member.role, w.number).forEach((t) => {
            tasks[t.id] = progressRepo.getTaskPercent(course.id, member.memberId, t, keySet);
          });
        });
      course.gates.forEach((g) => {
        gates[g.id] = progressRepo.deriveGateStatus(course, member.memberId, member.role, g, keySet);
      });
      resumePoint = readResume(course, member.memberId);
    }
    return {
      weekStats: weeks,
      taskStats: tasks,
      gateStats: gates,
      activeWeek: resolveActiveWeek(course, member?.role ?? '', weeks, resumePoint),
      resume: resumePoint,
    };
  }, EMPTY_STATS);

  // Weeks in order. Memoised because `incompleteTasks` below depends on it, and
  // a fresh array every render would make that memo miss every time — which is
  // the same as not having it. Hooks live above the early returns.
  const sortedWeeks = useMemo(
    () => [...course.weeks].sort((a, b) => a.number - b.number),
    [course.weeks]
  );

  /**
   * Every incomplete task for this role, in week order.
   *
   * This search used to live inside `renderTaskBody`, which ran it once per task
   * row — a full `sortedWeeks × getTasksByRole` walk, repeated for every task on
   * the week, to answer "what comes after me?" for a runner that only the one
   * open row ever shows. One ordered list answers it for all of them, and "the
   * next one that is not me" is then a scan of an array we already have.
   */
  const incompleteTasks = useMemo(() => {
    if (!member) return [] as Task[];
    return sortedWeeks.flatMap((w) =>
      getTasksByRole(course, member.role, w.number).filter((t) => (taskStats[t.id] ?? 0) < 100)
    );
  }, [course, member, sortedWeeks, taskStats]);

  const nextIncompleteAfter = (taskId: string): Task | undefined =>
    incompleteTasks.find((t: Task) => t.id !== taskId);

  // The week on screen: the student's pick (or a `?week=` deep link), else
  // where the resume pointer says they stopped.
  const effectiveWeek = selectedWeek ?? activeWeek;

  // Open the task the student stopped in, exactly once, after progress has been
  // read on the client. Progress is client-only, so this can't be a lazy state
  // initializer without a hydration mismatch — the server would render a
  // different set of open panels than the client. The ref makes it one-shot so
  // it never fights a manual collapse later in the session. Must sit above the
  // early returns below to keep hook order stable.
  const resumeApplied = useRef(false);
  useEffect(() => {
    if (resumeApplied.current || !resume) return;
    resumeApplied.current = true;
    const taskId = resume.taskId;
    setExpanded((prev) => new Set(prev).add(taskId));
    // Scroll to it only when the week on screen is the pointer's week — a
    // `?week=` deep link deliberately wins over the pointer.
    const params = new URLSearchParams(window.location.search);
    const onTasks = params.get('tab') === 'tasks' || params.get('tab') === 'weeks';
    const weekParam = params.get('week');
    if (onTasks && (weekParam === null || Number(weekParam) === resume.week)) {
      setTimeout(
        () =>
          document
            .getElementById(`task-${taskId}`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
        60
      );
    }
  }, [resume]);

  // `/team/<id>` forwards to `#team` here. The block renders only once the
  // member has loaded, so the browser's own hash jump has nothing to land on.
  useEffect(() => {
    if (!member || window.location.hash !== '#team') return;
    setTimeout(() => document.getElementById('team')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }, [member]);

  if (loading) return <CoursePageSkeleton />;

  if (course.locked) {
    return (
      <EmptyState
        title="Course locked"
        message="This course is locked by the instructor and isn’t open yet. Check back later."
        href="/"
        cta="Browse courses"
      />
    );
  }

  const joined = !!member;


  // Gate sequencing: a week stays locked until the previous week's gate is passed,
  // so students work in order. Instructors (or local dev passcode) bypass it.
  const priorGateForWeek = (weekNum: number) => course.gates.find((g) => g.week === weekNum - 1);
  const weekLocked = (weekNum: number): boolean => {
    if (!joined || instructorOverride || course.noGatekeeping) return false;
    const pg = priorGateForWeek(weekNum);
    return !!pg && (gateStats[pg.id] || 'locked') !== 'passed';
  };
  // Whole-course completion. With gatekeeping, every gate must be passed. With
  // no gatekeeping (CySA), it's simply every week at 100% for your role.
  const allWeeksComplete =
    joined && course.weeks.length > 0 && course.weeks.every((w) => (weekStats[w.number] ?? 0) >= 100);
  const allGatesPassed = course.noGatekeeping
    ? allWeeksComplete
    : joined && course.gates.length > 0 && course.gates.every((g) => (gateStats[g.id] || 'locked') === 'passed');

  const scrollTo = (elementId: string, block: ScrollLogicalPosition = 'start') => {
    if (typeof document !== 'undefined') {
      setTimeout(
        () => document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth', block }),
        60
      );
    }
  };

  /** Switch tab without an RSC round-trip, keeping the URL honest: `?tab=tasks`
   *  (and `?week=`) are written with replaceState so Tasks is bookmarkable and
   *  Back restores it; Home clears both. The hash is preserved. */
  const selectTab = (t: 'home' | 'tasks') => {
    setTabState(t);
    const params = new URLSearchParams(window.location.search);
    if (t === 'tasks') params.set('tab', 'tasks');
    else {
      params.delete('tab');
      params.delete('week');
    }
    const qs = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`);
  };

  /** Show one week on the Tasks tab. Setup is not a week on the rail — it is the
   *  "do once" strip above it, so picking it opens the strip instead. */
  const pickWeek = (n: number) => {
    setTabState('tasks');
    if (isSetupWeek(course, n)) {
      setSetupOpen(true);
    } else {
      setSelectedWeek(n);
      setSetupOpen((v) => v ?? false);
    }
    const params = new URLSearchParams(window.location.search);
    params.set('tab', 'tasks');
    params.set('week', String(n));
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  };

  const openAndScrollWeek = (n: number) => {
    pickWeek(n);
    scrollTo(isSetupWeek(course, n) ? 'setup-strip' : 'week-rail');
  };

  const goToTask = (task: Task) => {
    pickWeek(task.week);
    setExpanded((prev) => new Set(prev).add(task.id));
    scrollTo(`task-${task.id}`, 'center');
  };

  const toggleSet =
    <T,>(setter: React.Dispatch<React.SetStateAction<Set<T>>>) =>
    (value: T) =>
      setter((prev) => {
        const next = new Set(prev);
        if (next.has(value)) next.delete(value);
        else next.add(value);
        return next;
      });

  const toggle = toggleSet(setExpanded);

  const toggleTask = (task: Task) => {
    // Home-lab-only build tasks confirm before revealing (once per device).
    if (task.homeLabOnly && !homeBuildAck && !expanded.has(task.id)) {
      setPendingHomeBuild(task);
      setHomeBuildDialog(true);
      return;
    }
    toggle(task.id);
  };

  const confirmHomeBuild = () => {
    if (member) {
      const existing = userStateRepo.get(course.id, member.memberId) ?? {};
      userStateRepo.save(course.id, member.memberId, { ...existing, homeBuildAck: true });
    }
    notifyStore();
    setHomeBuildDialog(false);
    if (pendingHomeBuild) {
      toggle(pendingHomeBuild.id);
      setPendingHomeBuild(null);
    }
  };

  const confirmReset = () => {
    if (!member) return;
    progressRepo.resetCourse(course.id, member.memberId);
    setExpanded(new Set());
    setConfirmingReset(false);
    notifyStore();
    toast({ message: 'Your progress was reset.', variant: 'success' });
  };

  const ownRole = member ? getRoleDef(course, member.role) : undefined;
  const otherRoles = member ? course.roles.filter((r) => r.id !== member.role) : course.roles;

  // "Your next step" across the student's own tasks. The course-level step
  // total that used to live here is gone with the duplicate percentage it fed —
  // `crew.stepsDone / stepsTotal` is the single source for that now.
  const ownTasksAll = member ? getTasksByRole(course, member.role) : [];
  const tasksComplete = ownTasksAll.filter((t) => (taskStats[t.id] ?? 0) === 100).length;
  // Crew progress: the Capstone Stone's stage plus professional milestones, all
  // derived from the percentages computed above — no points, no stored score.
  // The final stage additionally needs the capstone document filed, because
  // "defended" has to mean handed over rather than merely finished.
  const savedDocs = member ? docsRepo.get(course.id, member.teamId) : null;
  const crew = deriveCrewProgress(
    course,
    member?.role ?? '',
    weekStats,
    taskStats,
    isCapstoneFiled(course.id, savedDocs)
  );

  // "Continue" points at real coursework. Setup weeks and home-lab-only build
  // tasks are opt-in, so an untouched Week 0 must not hold the CTA hostage —
  // that was the old behaviour and it never advanced.
  let nextTask: Task | undefined;
  if (member) {
    for (const w of sortedWeeks) {
      if (isSetupWeek(course, w.number)) continue;
      const t = getTasksByRole(course, member.role, w.number).find(
        (tk) => !tk.homeLabOnly && (taskStats[tk.id] ?? 0) < 100
      );
      if (t) {
        nextTask = t;
        break;
      }
    }
  }

  // "This week" context for the role hero.
  const contentWeeks = sortedWeeks.filter((w) => w.number >= 1);
  // ── The Tasks tab, one week at a time ──
  // Setup weeks are the "do once" strip; the rail holds only graded weeks.
  const gradedWeeks = sortedWeeks.filter((w) => !isSetupWeek(course, w.number));
  const setupWeeks = sortedWeeks.filter((w) => isSetupWeek(course, w.number));
  const setupTasks = member ? setupWeeks.flatMap((w) => getTasksByRole(course, member.role, w.number)) : [];
  const setupPct = setupWeeks.length
    ? Math.round(setupWeeks.reduce((sum, w) => sum + (weekStats[w.number] ?? 0), 0) / setupWeeks.length)
    : 0;
  const setupIsOpen = setupOpen ?? (setupWeeks.length > 0 && isSetupWeek(course, effectiveWeek));
  // A pointer (or deep link) into Setup opens the strip; the rail still shows a
  // graded week underneath it.
  const viewWeek = gradedWeeks.some((w) => w.number === effectiveWeek)
    ? effectiveWeek
    : (gradedWeeks[0]?.number ?? 1);
  const viewWeekDef = sortedWeeks.find((w) => w.number === viewWeek);
  const weekTasks = member ? getWeekTasks(course, viewWeek) : [];
  // One flat list: the shared build first, then the task that is yours alone.
  // On a shared-track course (Server+) the build belongs to everyone and only
  // the small deep-dive differs by focus; on a role-split course "shared" is
  // empty and the list is simply your role's work.
  const sharedWeekTasks = weekTasks.filter((t) => t.shared);
  const ownWeekTasks = member ? weekTasks.filter((t) => !t.shared && t.role === member.role) : [];
  const ordered = [...sharedWeekTasks, ...ownWeekTasks];
  const otherWeekTasks = member ? weekTasks.filter((t) => !t.shared && t.role !== member.role) : [];
  const viewPct = weekStats[viewWeek] ?? 0;
  const gateForWeek = course.gates.find((g) => g.week === viewWeek);
  const viewLocked = weekLocked(viewWeek);
  const lockGate = priorGateForWeek(viewWeek);
  // Home, shared track: what the other focuses document this week — the titles
  // are all a student needs, since each is a copy of the same slot.
  const otherFocuses = course.sharedTrack && member
    ? otherRoles
        .map((r) => ({
          role: r,
          titles: getWeekTasks(course, activeWeek)
            .filter((t) => !t.shared && t.role === r.id)
            .map((t) => t.title),
        }))
        .filter((o) => o.titles.length > 0)
    : [];

  // Expanded content for a task row (deliverables + the runner or read-only steps).
  const renderTaskBody = (task: Task, isOwn: boolean) => {
    // A task body is the checklist, full stop. Everything that used to stack
    // above it — the TaskThisWeek step-title list (a duplicate of the rows
    // themselves), the done-when bullets, and the "Task brief" collapsible —
    // now lives in the runner's single "About this task" disclosure, fed via
    // the `about` prop. The step-title list is simply gone: the numbers moved
    // onto the rows they belonged to.
    return (
    <>
      {isOwn && member ? (
        (() => {
          // Which task follows this one, from the order computed once above.
          const following = nextIncompleteAfter(task.id);
          return (
            <GuidedTaskRunner
              task={task}
              courseId={course.id}
              memberId={member.memberId}
              about={<TaskAboutPanel course={course} task={task} />}
              onProgressChange={onProgressChange}
              nextLabel={following ? 'Next task →' : 'Review & finish →'}
              onNext={() => {
                setExpanded((prev) => {
                  const n = new Set(prev);
                  n.delete(task.id);
                  return n;
                });
                if (following) {
                  goToTask(following);
                } else {
                  selectTab('home');
                  if (typeof window !== 'undefined') {
                    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 60);
                  }
                }
              }}
            />
          );
        })()
      ) : (
        <>
          {/* Read-only view of another role's task keeps the same About panel —
              hand-offs and prerequisites are real data on Security+ and MSSP,
              and this is the only surface that shows them for reference tasks. */}
          <div className="mb-3 rounded-lg border border-line px-4">
            <Collapsible title="About this task" defaultOpen={false}>
              <div className="py-1 pr-2">
                <TaskAboutPanel course={course} task={task} />
              </div>
            </Collapsible>
          </div>
          <TaskReference task={task} />
        </>
      )}
    </>
    );
  };

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header — title, credential, one sentence.
          This block sits above the sub-nav, so whatever is here renders on
          every tab. It used to carry the audience line, the description, the
          region's terrain paragraph, the Capstone Stone and the milestone rail:
          114 words of identity repeated above Weekly Tasks, Team, Deliverables
          and the Guide, where none of it is what the student came for. The
          identity now lives once, on Overview. */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          {/* 4xl only once there is room for it. At 390px the title plus the
              description below ran to roughly 400px — more than half the first
              screen — before the sub-nav, on the page a student opens to do
              this week's work. */}
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-4xl">{course.title}</h1>
          {/* Vendor + credential, in the course's own accent — the fastest way
              to tell which product you're looking at. Also the only place the
              certification code belongs; it used to appear three times. */}
          {courseIdentityLabel(course) && (
            <PixelBadge tone="accent">{courseIdentityLabel(course)}</PixelBadge>
          )}
        </div>
        {/* Clamped on a phone, in full from `sm` up. This is the course's
            identity, not its instructions — it is worth two lines above the
            work, and the Guide carries it in full. */}
        <p className="line-clamp-2 text-base text-muted sm:line-clamp-none sm:text-lg">
          {course.description}
        </p>
      </div>

      {/* Sticky course sub-nav — shared component, persists on every in-course page */}
      <CourseSubNav
        courseId={course.id}
        active={tab}
        teamId={joined && member ? member.teamId : null}
        onSelectTab={selectTab}
        trailing={
          joined && member ? (
            <>
              {/* The game layer, derived from the same progress scan as the
                  percentages beside it — no separate source of truth. */}
              {/* One course-level readout, not two. `StepTally` already shows a
                  filled bar plus the real count, so the percentage beside it was
                  the same fact rounded differently. */}
              <StepTally done={crew.stepsDone} total={crew.stepsTotal} className="hidden md:flex" />
              <span className="hidden text-sm text-muted sm:inline">
                {phaseTag(course, activeWeek)}
              </span>
              {nextTask ? (
                <Button
                  onClick={() => nextTask && goToTask(nextTask)}
                  size="sm"
                  data-tour="continue-btn"
                  className="flex items-center gap-1.5"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    selectTab('home');
                    if (typeof window !== 'undefined') {
                      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 60);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-ok-soft px-3 py-1.5 text-sm font-medium text-ok hover:opacity-80"
                >
                  <Sparkles className="h-4 w-4" /> All done — review
                </button>
              )}
            </>
          ) : undefined
        }
      />

      {/* ───────── The tabs ─────────
          `mode="wait"` is the whole point. Without an AnimatePresence the
          outgoing panel unmounted on the SAME frame the incoming one mounted,
          so switching Home↔Tasks showed a blank page for one frame and then
          faded a new one in — the fade read as slowness because there was
          nothing to fade FROM. Now the old panel is given 120ms to leave
          before the new one arrives, and the switch reads as one movement.
          Both panels are keyed on `tab`, which is what tells AnimatePresence
          they are alternatives rather than siblings. */}
      <AnimatePresence mode="wait" initial={false}>
      {tab === 'home' && (
      <motion.div
        key="tab-home"
        className="space-y-6"
        variants={swap}
        initial="enter"
        animate="center"
        exit="exit"
      >
      {/* Where you are, before anything else. Home is the dashboard: status,
          the stone, your role, your team. Everything that DESCRIBED the course —
          the role cards, the lab and build pictures, the arc — lives once now,
          on the Guide, which is the page a student visits to be oriented. This
          is the page they come back to. */}
      {joined && member && (
        <EngagementStatus
          course={course}
          weekNumber={activeWeek}
          phase={phaseForWeek(course, activeWeek) ?? undefined}
          percent={crew.stepsTotal > 0 ? Math.round((crew.stepsDone / crew.stepsTotal) * 100) : 0}
          weeks={sortedWeeks.map((w) => w.number)}
          weekPercent={(w) => weekStats[w] ?? 0}
          docsFiled={
            deliverablesForCourse(course.id).filter((d) => isDeliverableFiled(savedDocs?.[d.id])).length
          }
          docsTotal={deliverablesForCourse(course.id).length}
          nextTask={nextTask}
          onGoToWeek={openAndScrollWeek}
          onContinue={() => nextTask && goToTask(nextTask)}
        />
      )}

      {/* The capstone's overall progress — where the whole project stands. */}
      {joined && member && (
        <div className="rounded-[var(--radius-card)] border border-line bg-panel p-4">
          <CapstoneStonePanel stage={crew.stage} nextPhase={phaseForWeek(course, activeWeek)} />
        </div>
      )}
      {allGatesPassed && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-ok-line bg-ok-soft p-6"
        >
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-ok-soft p-2 text-ok">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-ink">
                {course.noGatekeeping
                  ? 'Course complete — every week finished 🎉'
                  : `Engagement complete — all ${course.gates.length} gates passed 🎉`}
              </h2>
              <p className="mt-1 text-sm text-muted">
                You&apos;ve finished {tasksComplete} of {ownTasksAll.length} tasks across every week as{' '}
                {ownRole?.name ?? member?.role}. Compile your deliverables into the final package and
                hand it in.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {member && (
                  <Link
                    href={`/courses/${course.id}/docs`}
                    className="inline-flex items-center gap-1.5 rounded-md bg-ok px-3 py-2 text-sm font-medium text-white hover:opacity-90"
                  >
                    <FileText className="h-4 w-4" /> Open Deliverables
                  </Link>
                )}
                {member && (
                  <a
                    href="#team"
                    className="inline-flex items-center gap-1.5 rounded-md border border-ok-line px-3 py-2 text-sm font-medium text-ok hover:bg-ok-soft"
                  >
                    <Users className="h-4 w-4" /> Review team progress
                  </a>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Engagement banner — client + scope + phase for engagement-framed courses */}
      {joined && member && isEngagement(course) && (
        <EngagementBanner courseId={course.id} teamId={member.teamId} phase={phaseTag(course, activeWeek)} />
      )}

      {/* Role "this week" hero — connects your role to what's left right now */}
      {joined && member && ownRole && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          whileHover={{ y: -2 }}
          className="rounded-[var(--radius-card)] border border-l-4 border-line bg-panel p-5 shadow-[var(--shadow-1)] transition-shadow hover:shadow-[var(--shadow-2)]"
          style={{ borderLeftColor: ownRole.color }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <RoleIcon iconName={ownRole.icon} className="h-9 w-9 shrink-0" color={ownRole.color} />
              <div>
                <div className="text-lg font-bold text-ink">
                  You&apos;re {ownRole.name}
                </div>
                <div className="text-sm text-muted">
                  {phaseTag(course, activeWeek)} of {contentWeeks.length}
                </div>
              </div>
            </div>
            {/* Next-action lives in the always-visible sticky bar; the hero only
                confirms the done state to avoid a second competing Continue. */}
            {!nextTask && (
              <span className="inline-flex items-center gap-2 rounded-lg bg-ok-soft px-4 py-2 text-sm font-medium text-ok">
                <Sparkles className="h-4 w-4" /> All your tasks complete!
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* Join front-and-center for newcomers — the first action, above everything else. */}
      {!joined && (
        <div id="join-panel">
          <JoinPanel
            course={course}
            member={member}
            userId={user?.id ?? null}
            requireAuth={requireAuth}
            onJoined={(m) => setMember(m)}
          />
        </div>
      )}

      {/* Your team — the roster and each member's progress. This was its own
          tab; a student only ever views their own team, so it keys on the
          member's team and renders here, behind the join. `/team/<id>`
          redirects to `#team`. Private route material stays behind `joined`:
          the bare dashboard is public. */}
      {joined && member && <TeamBlock course={course} member={member} />}

      {/* Shared track: the deep-dives the other focuses add this week. Titles
          only — each is a copy of the same slot, so the title is the fact. The
          Tasks tab used to fold these into every week as a reference panel. */}
      {otherFocuses.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-ink">What the other focuses document this {unit}</h2>
          <ul className="grid gap-2 sm:grid-cols-3">
            {otherFocuses.map(({ role, titles }) => (
              <li key={role.id} className="rounded-lg border border-line bg-panel px-3 py-2 text-sm">
                <div className="flex items-center gap-2 font-semibold text-ink">
                  <RoleIcon iconName={role.icon} className="h-4 w-4" color={role.color} />
                  {role.name}
                </div>
                <ul className="mt-1 space-y-0.5 text-muted">
                  {titles.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* One-time migration of this device's local progress into the account */}
      <ImportPrompt course={course} />

      {/* Enrollment summary once joined (edit team/role here). No id: the
          newcomer render above owns `join-panel`. */}
      {joined && (
        <div>
          <JoinPanel
            course={course}
            member={member}
            userId={user?.id ?? null}
            requireAuth={requireAuth}
            onJoined={(m) => setMember(m)}
          />
        </div>
      )}

      {/* Reset (once joined) */}
      {joined && member && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setConfirmingReset(true)}
            className="ml-auto inline-flex items-center gap-1 text-sm text-muted hover:text-danger"
          >
            <RotateCcw className="h-4 w-4" /> Reset my progress
          </button>
          <ConfirmDialog
            open={confirmingReset}
            onClose={() => setConfirmingReset(false)}
            onConfirm={confirmReset}
            title="Reset your progress?"
            message="This clears all your completed steps for this course on this device. This cannot be undone."
            confirmLabel="Reset progress"
          />
        </div>
      )}

      </motion.div>
      )}

      {/* ───────── Tasks ───────── */}
      {tab === 'tasks' && (
      <motion.div
        key="tab-tasks"
        className="space-y-4"
        variants={swap}
        initial="enter"
        animate="center"
        exit="exit"
      >
      {/* Not enrolled: the tasks ARE the course material, so this is where the
          page stops. The dashboard above still sells the course; this is the line. */}
      {!joined && <CourseEnrolGate courseId={course.id} what="the tasks" />}

      {joined && member && ownRole && (
        <>
          {/* One week at a time, one flat list.
              Five stacked week panels, each split into three lanes with their
              own headers, plus a search box that force-opened all of it, put 45
              rows and 43 controls in front of a Week-1 student. Now: a header
              naming the week you are on, the "do once" setup strip, a rail to
              switch weeks, and the week's tasks in the order you do them. */}
          <PageHeader
            level={2}
            eyebrow="Tasks"
            title={`${phaseTag(course, viewWeek)} · ${viewWeekDef?.title ?? ''}`}
            lede={`${ownRole.name} · ${ordered.length} task${ordered.length === 1 ? '' : 's'} this ${unit}`}
            trailing={
              <span className="flex items-center gap-1.5" title={`${viewPct}% of this ${unit}'s steps done`}>
                <span className="relative block h-2 w-20 overflow-hidden rounded-full bg-panel-2">
                  <motion.span
                    className="absolute inset-0 origin-left rounded-full bg-accent"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: viewPct / 100 }}
                    transition={meter}
                  />
                </span>
                <span className="text-xs font-medium text-muted">{viewPct}%</span>
              </span>
            }
          />

          {/* Setup is "do once", not a week. It used to be Week 0 on the rail,
              opening ahead of the real work; in class the lab already exists. */}
          {setupWeeks.length > 0 && setupTasks.length > 0 && (
            <section id="setup-strip" className="scroll-under-chrome rounded-lg border border-line bg-panel">
              <button
                type="button"
                onClick={() => setSetupOpen(!setupIsOpen)}
                aria-expanded={setupIsOpen}
                aria-controls="setup-tasks"
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-panel-2"
              >
                <Wrench className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                <span className="min-w-0 flex-1 text-sm">
                  <span className="font-semibold text-ink">
                    Do once — {setupWeeks.map((w) => w.title).join(' · ')}
                  </span>
                  <span className="text-muted">
                    {' '}· {setupTasks.length} task{setupTasks.length === 1 ? '' : 's'} · {setupPct}%
                  </span>
                </span>
                {setupIsOpen ? (
                  <ChevronDown className="h-5 w-5 shrink-0 text-muted" />
                ) : (
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
                )}
              </button>
              {setupIsOpen && (
                <div id="setup-tasks" className="space-y-3 border-t border-line p-4">
                  {/* SOC-course banner only: this names the shared Wazuh SOC and
                      its login, which is meaningless on a course whose setup is
                      required prep rather than an optional home-lab build. */}
                  {!!socTopology(course.id) && (
                    <Alert variant="info" title="The classroom SOC is already set up.">
                      Sign in at <span className="font-mono text-xs">{SOC_URL}</span> ({SOC_LOGIN_LABEL}) and start
                      at <span className="font-semibold">Week 1</span>. The build steps here are only for students
                      setting up their own lab at home — opening them asks you to confirm first.
                    </Alert>
                  )}
                  {setupTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      course={course}
                      task={task}
                      isOwn
                      joined={joined}
                      open={expanded.has(task.id)}
                      percent={taskStats[task.id] ?? 0}
                      onToggle={() => toggleTask(task)}
                      renderBody={() => renderTaskBody(task, true)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* The week rail — the same selector the Deliverables page uses. A
              tick when the week is done, a lock while its gate is shut, and a
              slow pulse on the week you are on. */}
          <nav id="week-rail" aria-label={`${unitWord(course)}s`} className="flex flex-wrap items-center gap-1.5 scroll-under-chrome">
            {gradedWeeks.map((w) => {
              const pct = weekStats[w.number] ?? 0;
              const on = w.number === viewWeek;
              const isLocked = weekLocked(w.number);
              return (
                <button
                  key={w.number}
                  type="button"
                  onClick={() => pickWeek(w.number)}
                  aria-current={on ? 'true' : undefined}
                  className={`relative inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    on ? 'text-accent-contrast' : 'text-muted hover:bg-panel-2 hover:text-ink'
                  }`}
                >
                  {/* The selected fill is one shared element, so changing week
                      slides it across the rail instead of repainting one button
                      and un-painting another. This is the control students touch
                      more than any other on the page and until now it did
                      nothing at all when they used it. It sits BEHIND the label
                      (-z-10) rather than wrapping it, so the text does not
                      re-animate with the pill. */}
                  {on && (
                    <motion.span
                      layoutId="week-rail-pill"
                      transition={SPRING.slide}
                      className="absolute inset-0 -z-10 rounded-md bg-accent"
                      aria-hidden
                    />
                  )}
                  {/* The phase dot. Every week wears its own colour, always,
                      so the rail reads as a coloured sequence you are moving
                      along — the one thing a student most wants to know at a
                      glance, and until R63 the interface only ever said it in
                      words. On the selected week the pill behind it is already
                      the accent, so the dot switches to `bg-current` there
                      rather than putting a second hue on a filled chip. Week 0
                      (Setup) has no phase colour and falls back to the accent,
                      which is deliberate: it is preparation, not a phase. */}
                  <span
                    data-week={w.number}
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      w.number === activeWeek && pct < 100 ? 'qi-pulse' : ''
                    } ${on ? 'bg-current' : ''}`}
                    style={on ? undefined : { background: 'var(--week, var(--color-accent))' }}
                    aria-hidden
                  />
                  {phaseTag(course, w.number)}
                  {pct >= 100 && <CheckCircle2 className="h-3.5 w-3.5" aria-label="done" />}
                  {isLocked && <Lock className="h-3.5 w-3.5" aria-label="locked" />}
                </button>
              );
            })}
          </nav>

          <LabAccessPanel courseId={course.id} />

          {/* `data-week` is one attribute, and every stratum edge inside —
              the week band, the task rows, the step seams — takes this phase's
              colour from it. See the "Phase colour" block in globals.css. */}
          <motion.section
            key={`week-${viewWeek}`}
            id={`week-${viewWeek}`}
            className="stratum-week scroll-under-chrome overflow-hidden"
            data-week={viewWeek}
            data-open="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: DUR.swap, ease: EASE.out }}
          >
            <div className="space-y-4 p-5">
              {viewLocked ? (
                <div className="flex items-start gap-3 rounded-lg border border-line bg-panel-2 p-4">
                  <Lock className="mt-0.5 h-5 w-5 shrink-0 text-muted" />
                  <div>
                    <p className="text-sm font-medium text-ink">
                      Locked until you clear Gate {lockGate?.id}.
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Finish {phaseTag(course, lockGate?.week ?? viewWeek - 1)} required tasks to pass Gate{' '}
                      {lockGate?.id} and unlock this {unit} — the engagement runs in order.
                    </p>
                    {lockGate && (
                      <button
                        type="button"
                        onClick={() => openAndScrollWeek(lockGate.week)}
                        className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
                      >
                        Go to {phaseTag(course, lockGate.week)} <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* The finish line, one row: "Done when: …" + time. */}
                  <WeekMilestoneHeader course={course} role={member.role} week={viewWeek} percent={viewPct} />

                  {gateForWeek && !course.noGatekeeping && (
                    <div className="rounded-lg border border-line bg-panel px-3">
                      <Collapsible
                        title={(() => {
                          const st = gateStats[gateForWeek.id] || 'locked';
                          const label = st === 'passed' ? 'passed' : st === 'ready' ? 'ready' : 'in progress';
                          return `Gate ${gateForWeek.id} checklist · ${label}`;
                        })()}
                        defaultOpen={false}
                      >
                        <div className="pb-1">
                          <WeekGatePanel
                            course={course}
                            week={viewWeek}
                            status={gateStats[gateForWeek.id] || 'locked'}
                            ownRole={member.role}
                            taskStats={taskStats}
                          />
                        </div>
                      </Collapsible>
                    </div>
                  )}

                  {ordered.length === 0 && (
                    <p className="text-sm text-muted">No tasks for this {unit} yet.</p>
                  )}

                  {/* The list. Shared build first, your focus last with its chip;
                      no lanes, no lane headers. */}
                  <div className="space-y-3">
                    {ordered.map((task, i) => (
                      <TaskRow
                        key={task.id}
                        number={i + 1}
                        course={course}
                        task={task}
                        isOwn
                        joined={joined}
                        open={expanded.has(task.id)}
                        isNext={task.id === nextTask?.id}
                        focus={!!course.sharedTrack && !task.shared}
                        percent={taskStats[task.id] ?? 0}
                        onToggle={() => toggleTask(task)}
                        renderBody={() => renderTaskBody(task, true)}
                      />
                    ))}
                  </div>

                  {/* Role-split courses: teammates' tasks, read-only, one press
                      away. They carry the hand-offs a student has to be able to
                      open. On a shared track the other focuses' deep-dives are
                      copies of the same slot — their titles are on Home. */}
                  {!course.sharedTrack && otherWeekTasks.length > 0 && (
                    <div className="rounded-lg border border-dashed border-line p-3">
                      <button
                        type="button"
                        onClick={() => setOthersOpen((v) => !v)}
                        aria-expanded={othersOpen}
                        className="flex w-full items-center gap-2 text-sm font-medium text-muted"
                      >
                        <Users className="h-4 w-4" />
                        Other roles this {unit} · {otherWeekTasks.length}
                        {othersOpen ? (
                          <ChevronDown className="ml-auto h-4 w-4 text-muted" />
                        ) : (
                          <ChevronRight className="ml-auto h-4 w-4 text-muted" />
                        )}
                      </button>
                      {othersOpen && (
                        <div className="mt-3 space-y-4">
                          {otherRoles.map((r) => {
                            const roleTasks = otherWeekTasks.filter((t) => t.role === r.id);
                            if (roleTasks.length === 0) return null;
                            return (
                              <div key={r.id} className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <RoleIcon iconName={r.icon} className="h-5 w-5" color={r.color} />
                                  <span className="font-semibold text-ink">{r.name}</span>
                                  <span className="text-xs text-muted">reference</span>
                                </div>
                                {roleTasks.map((task) => (
                                  <TaskRow
                                    key={task.id}
                                    course={course}
                                    task={task}
                                    isOwn={false}
                                    joined={joined}
                                    open={expanded.has(task.id)}
                                    percent={taskStats[task.id] ?? 0}
                                    onToggle={() => toggleTask(task)}
                                    renderBody={() => renderTaskBody(task, false)}
                                  />
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.section>
        </>
      )}
      </motion.div>
      )}
      </AnimatePresence>

      {/* Home-build gate for the Week-0 build task — mounted regardless of tab so it
          opens when a student tries to expand the build steps on the Weekly tab. */}
      <ConfirmDialog
        open={homeBuildDialog}
        onClose={() => setHomeBuildDialog(false)}
        onConfirm={confirmHomeBuild}
        destructive={false}
        title="Only if you're building your own lab at home"
        message={`The classroom SOC is already built and running at ${SOC_URL} (sign in: ${SOC_LOGIN_LABEL}). You don't need these build steps — start at Week 1. Open them only if you're setting up your own lab at home.`}
        confirmLabel="Yes, I'm building from home"
        cancelLabel="Back"
      />
    </motion.div>
  );
}
