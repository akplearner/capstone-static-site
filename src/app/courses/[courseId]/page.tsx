'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Compass,
  FileText,
  GraduationCap,
  Lock,
  RotateCcw,
  Search,
  Sparkles,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { Button, Collapsible } from '@/components/ui/Button';
import { LoadingBlock } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { toast } from '@/components/ui/Toast';
import { StepDetail } from '@/components/TaskComponents';
import { GuidedTaskRunner } from '@/components/GuidedTaskRunner';
import { CourseSubNav } from '@/components/CourseSubNav';
import { GuidedStepper, StepperItem } from '@/components/GuidedStepper';
import { LifecycleFlow } from '@/components/diagrams/LifecycleFlow';
import { WeekTaskFlow } from '@/components/diagrams/WeekTaskFlow';
import { WeekGatePanel } from '@/components/WeekGatePanel';
import { RoleIcon } from '@/components/RoleIcon';
import { EmptyState } from '@/components/EmptyState';
import { QuickstartChecklist, QuickstartStep } from '@/components/QuickstartChecklist';
import { TourGuide, TOUR_EVENT, TourStep } from '@/components/TourGuide';
import { SignInPanel } from '@/components/auth/SignInPanel';
import { ImportPrompt } from '@/components/auth/ImportPrompt';
import { LabAccessPanel } from '@/components/LabAccessPanel';
import { useCourse } from '@/lib/useCourse';
import { useMember } from '@/lib/useMember';
import { useAuth } from '@/lib/useAuth';
import { useInstructorAuth } from '@/lib/useInstructorAuth';
import { useSupabaseSync } from '@/lib/useSupabaseSync';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { progressRepo, docsRepo } from '@/lib/data';
import { useClientStore, EMPTY_OBJECT, notifyStore } from '@/lib/useClientStore';
import { getRoleDef, getRequiredStepCount, getTaskById, getTasksByRole, getWeekTasks, isEngagement, phaseTag, phaseTitle, unitWord } from '@/lib/course-helpers';
import { EngagementBanner } from '@/components/EngagementBanner';
import { roleGuide, worksLabel } from '@/lib/roleGuide';
import { getFrameworkColor, getFrameworkLabel, getMonthlyCohorts } from '@/lib/utils';
import { Course, GateStatus, Member, RoleDef, Task } from '@/lib/types';

// Monthly cohorts (YYYY-MM), generated for the next 12 months.
const COHORTS = getMonthlyCohorts(12);

type CourseStats = {
  weekStats: Record<number, number>;
  taskStats: Record<string, number>;
  gateStats: Record<number, GateStatus>;
  activeWeek: number;
};
const EMPTY_STATS: CourseStats = { weekStats: {}, taskStats: {}, gateStats: {}, activeWeek: 1 };

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
  const [team, setTeam] = useState(member?.teamId ?? teamIds[0]);
  const [role, setRole] = useState(member?.role ?? course.roles[0]?.id ?? '');
  const [error, setError] = useState<string | null>(null);

  const usedOf = (t: string) => counts[t] ?? 0;
  // A team is full only for students not already on it.
  const isFull = (t: string) => cap > 0 && usedOf(t) >= cap && !(member && member.teamId === t);

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
      teamId: team,
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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <RoleIcon iconName={rd?.icon} className="h-7 w-7" color={rd?.color} />
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">{member.displayName}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Team {member.teamId} · {rd?.name ?? member.role} · {member.cohort}
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
    <div className="space-y-5 rounded-lg border-2 border-blue-200 bg-blue-50/50 p-6 dark:border-blue-800 dark:bg-blue-900/10">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Join this course</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Pick a team and a role to unlock the weekly tasks below.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Your name"
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cohort</span>
          <select
            value={cohort}
            onChange={(e) => setCohort(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            {COHORTS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Team</span>
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
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-300'
                    : full
                      ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-600'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300'
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
          <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</span>
          <div className="mt-2 space-y-2">
            {course.roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={`flex w-full items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-colors ${
                  role === r.id
                    ? 'border-blue-600 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                    : 'border-gray-300 bg-white hover:border-gray-400 dark:border-gray-600 dark:bg-gray-700'
                }`}
              >
                <RoleIcon iconName={r.icon} className="mt-0.5 h-5 w-5 shrink-0" color={r.color} />
                <span>
                  <span className="block font-medium text-gray-900 dark:text-white">{r.name}</span>
                  <span className="block text-xs text-gray-600 dark:text-gray-400">{roleGuide(r.id, course.id).blurb}</span>
                  <span className="mt-0.5 block text-[11px] text-gray-500 dark:text-gray-500">
                    {worksLabel(roleGuide(r.id, course.id).works)}
                  </span>
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
        <div key={s.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/40">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Step {i + 1}
          </div>
          <h4 className="mt-0.5 font-semibold text-gray-900 dark:text-white">{s.title}</h4>
          <div className="mt-3">
            <StepDetail
              instruction={s.instruction}
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
              troubleshooting={s.troubleshooting}
              verify={s.verify}
              optional={s.optional}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** A single collapsible task with a rich, scannable header (step progress,
 *  deliverables, frameworks, estimated time). Expanded content is passed in. */
function TaskRow({
  task,
  isOwn,
  joined,
  open,
  percent,
  onToggle,
  isNext,
  children,
}: {
  task: Task;
  isOwn: boolean;
  joined: boolean;
  open: boolean;
  percent: number;
  onToggle: () => void;
  isNext?: boolean;
  children: React.ReactNode;
}) {
  const canOpen = joined;
  const steps = getRequiredStepCount(task);
  const optionalCount = task.steps.length - steps;
  const doneSteps = Math.round((percent / 100) * steps);
  const showProgress = isOwn && joined;

  return (
    <div
      id={`task-${task.id}`}
      className="scroll-mt-24 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
    >
      <button
        type="button"
        disabled={!canOpen}
        onClick={() => canOpen && onToggle()}
        className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors ${
          canOpen ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50' : 'cursor-not-allowed opacity-70'
        }`}
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-white">{task.title}</span>
            {showProgress && percent === 100 && (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
            )}
            {isNext && percent < 100 && (
              <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                Next
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate text-sm text-gray-600 dark:text-gray-400">
            {task.objective}
          </span>

          {/* Scannable meta row */}
          <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
            {showProgress ? (
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <span
                    className="block h-full rounded-full bg-blue-600"
                    style={{ width: `${percent}%` }}
                  />
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {doneSteps}/{steps} steps
                </span>
              </span>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">{steps} steps</span>
            )}
            {optionalCount > 0 && (
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                +{optionalCount} optional
              </span>
            )}
            {task.estimatedTime && (
              <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <Clock className="h-3.5 w-3.5" /> {task.estimatedTime}
              </span>
            )}
            {task.deliverables.length > 0 && (
              <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <FileText className="h-3.5 w-3.5" /> {task.deliverables.length} deliverable
                {task.deliverables.length > 1 ? 's' : ''}
              </span>
            )}
            {task.frameworks.slice(0, 3).map((fw) => (
              <span
                key={fw}
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getFrameworkColor(fw)}`}
              >
                {getFrameworkLabel(fw)}
              </span>
            ))}
            {task.frameworks.length > 3 && (
              <span className="text-gray-400">+{task.frameworks.length - 3}</span>
            )}
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-3 pt-0.5">
          {showProgress && (
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{percent}%</span>
          )}
          {!canOpen ? (
            <Lock className="h-4 w-4 text-gray-400" />
          ) : open ? (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-400" />
          )}
        </span>
      </button>

      {open && canOpen && (
        <div className="border-t border-gray-200 p-4 dark:border-gray-700">{children}</div>
      )}
    </div>
  );
}

/** Header strip for a role group within a week. */
function RoleGroupHeader({ role, tag }: { role: RoleDef; tag?: string }) {
  return (
    <div className="flex items-center gap-2">
      <RoleIcon iconName={role.icon} className="h-5 w-5" color={role.color} />
      <span className="font-semibold text-gray-900 dark:text-white">{role.name}</span>
      {tag === 'own' && (
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
          Your role
        </span>
      )}
      {tag === 'reference' && (
        <span className="text-xs text-gray-400 dark:text-gray-500">reference</span>
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
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  // null = the student hasn't toggled weeks yet, so the active week shows open by
  // default; once they interact we track their explicit set.
  const [openWeeks, setOpenWeeks] = useState<Set<number> | null>(null);
  const [openRefs, setOpenRefs] = useState<Set<number>>(new Set());
  const [tab, setTab] = useState<'overview' | 'weeks'>('overview');
  // Honor a ?tab=weeks deep-link (used by the shared nav on sub-pages). Done in an
  // effect (not a lazy initializer) so server and client first render match — avoids
  // a hydration mismatch; the one-shot sync on mount is intentional.
  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab') === 'weeks') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTab('weeks');
    }
  }, []);
  const [query, setQuery] = useState('');

  // Progress writes broadcast through the store; useClientStore re-reads below.
  const onProgressChange = useCallback(() => notifyStore(), []);

  // Derived from one batched localStorage scan (week %, task %, gate status, and
  // the first-incomplete "active" week), kept live via the store subscription.
  const { weekStats, taskStats, gateStats, activeWeek } = useClientStore<CourseStats>(() => {
    const weeks: Record<number, number> = {};
    const tasks: Record<string, number> = {};
    const gates: Record<number, GateStatus> = {};
    let firstIncomplete = course.weeks[0]?.number ?? 1;
    if (member) {
      const keySet = progressRepo.getCompletionKeySet(course.id, member.memberId);
      let found = false;
      [...course.weeks]
        .sort((a, b) => a.number - b.number)
        .forEach((w) => {
          const pct = progressRepo.getWeekCompletion(course, member.memberId, member.role, w.number, keySet);
          weeks[w.number] = pct;
          getTasksByRole(course, member.role, w.number).forEach((t) => {
            tasks[t.id] = progressRepo.getTaskPercent(course.id, member.memberId, t, keySet);
          });
          if (!found && pct < 100) {
            firstIncomplete = w.number;
            found = true;
          }
        });
      course.gates.forEach((g) => {
        gates[g.id] = progressRepo.deriveGateStatus(course, member.memberId, member.role, g, keySet);
      });
    }
    return { weekStats: weeks, taskStats: tasks, gateStats: gates, activeWeek: firstIncomplete };
  }, EMPTY_STATS);

  // Active week is open by default until the student toggles weeks themselves.
  const effectiveOpenWeeks = openWeeks ?? new Set<number>([activeWeek]);

  // Has the team saved any deliverable yet? (drives the Start-here checklist).
  const hasDeliverable = useClientStore<boolean>(
    () => (member ? Object.keys(docsRepo.get(course.id, member.teamId) ?? {}).length > 0 : false),
    false
  );

  if (loading) return <LoadingBlock />;

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
  const sortedWeeks = [...course.weeks].sort((a, b) => a.number - b.number);

  // Gate sequencing: a week stays locked until the previous week's gate is passed,
  // so students work in order. Instructors (or local dev passcode) bypass it.
  const priorGateForWeek = (weekNum: number) => course.gates.find((g) => g.week === weekNum - 1);
  const weekLocked = (weekNum: number): boolean => {
    if (!joined || instructorOverride) return false;
    const pg = priorGateForWeek(weekNum);
    return !!pg && (gateStats[pg.id] || 'locked') !== 'passed';
  };
  // Whole-course completion: joined, every gate passed, and all own tasks done.
  const allGatesPassed =
    joined && course.gates.length > 0 && course.gates.every((g) => (gateStats[g.id] || 'locked') === 'passed');

  const stepperItems: StepperItem[] = sortedWeeks.map((w) => ({
    label: phaseTag(course, w.number),
    sublabel: joined ? `${weekStats[w.number] ?? 0}%` : undefined,
    status:
      joined && (weekStats[w.number] ?? 0) === 100
        ? 'done'
        : w.number === activeWeek
          ? 'current'
          : 'upcoming',
  }));

  const scrollTo = (elementId: string, block: ScrollLogicalPosition = 'start') => {
    if (typeof document !== 'undefined') {
      setTimeout(
        () => document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth', block }),
        60
      );
    }
  };

  const openWeek = (n: number) =>
    setOpenWeeks((prev) => new Set(prev ?? [activeWeek]).add(n));

  const openAndScrollWeek = (n: number) => {
    setTab('weeks');
    openWeek(n);
    scrollTo(`week-${n}`);
  };

  const goToTask = (task: Task) => {
    setTab('weeks');
    openWeek(task.week);
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
  const toggleRef = toggleSet(setOpenRefs);

  // Expanding a task pins its week open, so finishing the task (which advances
  // activeWeek) doesn't auto-collapse the week and hide the "Next task →" CTA.
  const toggleTask = (task: Task) => {
    openWeek(task.week);
    toggle(task.id);
  };

  const toggleWeek = (n: number) =>
    setOpenWeeks((prev) => {
      const next = new Set(prev ?? [activeWeek]);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });

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

  // Overall progress + "your next step" across the student's own tasks.
  const ownTasksAll = member ? getTasksByRole(course, member.role) : [];
  const totalSteps = ownTasksAll.reduce((s, t) => s + getRequiredStepCount(t), 0);
  const doneSteps = ownTasksAll.reduce(
    (s, t) => s + Math.round(((taskStats[t.id] ?? 0) / 100) * getRequiredStepCount(t)),
    0
  );
  const overallPercent = totalSteps ? Math.round((doneSteps / totalSteps) * 100) : 0;
  const tasksComplete = ownTasksAll.filter((t) => (taskStats[t.id] ?? 0) === 100).length;
  let nextTask: Task | undefined;
  if (member) {
    for (const w of sortedWeeks) {
      const t = getTasksByRole(course, member.role, w.number).find(
        (tk) => (taskStats[tk.id] ?? 0) < 100
      );
      if (t) {
        nextTask = t;
        break;
      }
    }
  }

  // "This week" context for the role hero.
  const contentWeeks = sortedWeeks.filter((w) => w.number >= 1);
  const tasksLeftThisWeek = member
    ? getTasksByRole(course, member.role, activeWeek).filter((t) => (taskStats[t.id] ?? 0) < 100).length
    : 0;
  // ── Guided onboarding: the core loop as a live "Start here" checklist + tour ──
  const thisWeekDone = !!member && (weekStats[activeWeek] ?? 0) >= 100;
  // The gate that governs the CURRENT week (latest gate at or before activeWeek),
  // so "Clear the week's gate" reflects where the student actually is — not any gate.
  const currentGate = [...course.gates]
    .filter((g) => g.week <= activeWeek)
    .sort((a, b) => b.week - a.week)[0];
  const gatePassed = !currentGate || (gateStats[currentGate.id] || 'locked') === 'passed';
  const quickstartSteps: QuickstartStep[] = [
    { label: 'Join a team & role', how: 'Pick your team and role below to unlock the work.', done: joined, onAction: () => scrollTo('join-panel', 'center'), cta: 'Join' },
    { label: 'Do this week’s tasks', how: 'Open Weekly Tasks and work the guided steps.', done: thisWeekDone, onAction: () => (nextTask ? goToTask(nextTask) : setTab('weeks')), cta: 'Tasks' },
    { label: 'Fill your deliverable & save the PDF', how: 'Open Deliverables, fill the form, then Generate PDF.', done: hasDeliverable, href: `/courses/${course.id}/docs`, cta: 'Open' },
    { label: 'Clear the week’s gate', how: 'Finish the week’s required tasks to pass the gate.', done: gatePassed, onAction: () => (nextTask ? goToTask(nextTask) : setTab('weeks')), cta: 'Tasks' },
  ];
  const roleArc = member ? roleGuide(member.role, course.id) : null;
  const tourSteps: TourStep[] = [
    ...(roleArc
      ? [{ title: `Your role: ${ownRole?.name ?? member!.role.toUpperCase()}`, body: `${roleArc.blurb} ${worksLabel(roleArc.works)} Your arc: ${roleArc.arc}` }]
      : []),
    { target: 'quickstart', title: 'Start here', body: 'This checklist is your path through the whole course: join, do the week’s tasks, fill the deliverable, clear the gate.' },
    { target: 'tab-weeks', title: 'Weekly Tasks', body: 'Your actual work — guided, step-by-step tasks for each week: run the tool, capture the evidence.' },
    { target: 'tab-deliverables', title: 'Deliverables', body: 'Fill the report forms here; they auto-format your document and export a PDF.' },
    { target: 'continue-btn', title: 'Continue', body: 'This always jumps you to your next unfinished task.' },
    { title: 'That’s the loop', body: 'Tasks → deliverable → PDF → gate, one week at a time. Replay this tour anytime from “Start here”.' },
  ];
  const startTour = () => window.dispatchEvent(new Event(TOUR_EVENT));

  // Task search (Weekly Tasks tab). Matches title, objective, or framework; an
  // active query force-opens every week so matches are visible without clicking.
  const q = query.trim().toLowerCase();
  const matchesQuery = (task: Task) =>
    !q ||
    task.title.toLowerCase().includes(q) ||
    task.objective.toLowerCase().includes(q) ||
    task.frameworks.some(
      (fw) => fw.toLowerCase().includes(q) || getFrameworkLabel(fw).toLowerCase().includes(q)
    );
  const anyMatches = sortedWeeks.some((w) => getWeekTasks(course, w.number).some(matchesQuery));

  // Expanded content for a task row (deliverables + the runner or read-only steps).
  const renderTaskBody = (task: Task, isOwn: boolean) => {
    // The brief now holds only orientation (learn / tools / done-when). Hand-offs,
    // prerequisites and deliverables are shown once elsewhere (the always-visible
    // strip below + the per-step "save evidence as" callout), not repeated here.
    const hasBrief = !!(task.learn?.length || task.tools?.length || task.definitionOfDone?.length);
    const hasHandoffStrip = !!(task.handoff?.length || task.prerequisites?.length);
    return (
    <>
      {/* Always-visible hand-off strip: what you're waiting on, and what you owe a
          teammate — lifted out of the collapsed brief so dependencies are obvious. */}
      {hasHandoffStrip && (
        <div className="mb-3 flex flex-col gap-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-800">
          {task.prerequisites && task.prerequisites.length > 0 && (
            <p className="flex items-start gap-1.5 text-amber-800 dark:text-amber-300">
              <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 rotate-180 text-amber-500" />
              <span>
                <span className="font-semibold">You need first: </span>
                {task.prerequisites.join(' · ')}
              </span>
            </p>
          )}
          {(task.handoff ?? []).map((h, i) => {
            const toRole = getRoleDef(course, h.to);
            return (
              <p key={`hs-${h.to}-${i}`} className="flex items-start gap-1.5 text-indigo-800 dark:text-indigo-300">
                <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" />
                <span>
                  <span className="font-semibold">Hand off when done: </span>
                  {h.artifact && <span className="font-mono">{h.artifact} </span>}→{' '}
                  <span className="font-semibold" style={{ color: toRole?.color }}>
                    {toRole?.name ?? h.to}
                  </span>
                </span>
              </p>
            );
          })}
        </div>
      )}
      {hasBrief && (
        <div className="mb-4 rounded-lg border border-gray-200 px-4 dark:border-gray-700">
          <Collapsible title="Task brief — learn, tools & done criteria" defaultOpen={false}>
            <div className="space-y-3 py-2">
        <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/30">
          {task.learn && task.learn.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <GraduationCap className="h-3.5 w-3.5" /> What you&apos;ll learn
              </div>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-gray-700 dark:text-gray-300">
                {task.learn.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          )}
          {task.tools && task.tools.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <Wrench className="h-3.5 w-3.5" /> Tools
              </span>
              {task.tools.map((t) => (
                <span
                  key={t}
                  className="rounded bg-white px-2 py-0.5 font-mono text-[11px] text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
          {task.definitionOfDone && task.definitionOfDone.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> You&apos;re done when
              </div>
              <ul className="mt-1 space-y-0.5 text-sm text-gray-700 dark:text-gray-300">
                {task.definitionOfDone.map((d) => (
                  <li key={d} className="flex gap-1.5">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" /> {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
            </div>
          </Collapsible>
        </div>
      )}
      {isOwn && member ? (
        (() => {
          // The next incomplete task for this role, ordered by week, excluding this one.
          let following: Task | undefined;
          for (const w of sortedWeeks) {
            const t = getTasksByRole(course, member.role, w.number).find(
              (tk) => tk.id !== task.id && (taskStats[tk.id] ?? 0) < 100
            );
            if (t) { following = t; break; }
          }
          return (
            <GuidedTaskRunner
              task={task}
              courseId={course.id}
              memberId={member.memberId}
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
                  setTab('overview');
                  if (typeof window !== 'undefined') {
                    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 60);
                  }
                }
              }}
            />
          );
        })()
      ) : (
        <TaskReference task={task} />
      )}
    </>
    );
  };

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <TourGuide steps={tourSteps} storageKey="capstone_tour_v1_seen" autoStart={joined} />
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{course.title}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">{course.description}</p>
      </div>

      {/* Sticky course sub-nav — shared component, persists on every in-course page */}
      <CourseSubNav
        courseId={course.id}
        active={tab === 'weeks' ? 'weeks' : 'overview'}
        teamId={joined && member ? member.teamId : null}
        onSelectTab={setTab}
        trailing={
          joined && member ? (
            <>
              <span className="hidden text-sm text-gray-500 dark:text-gray-400 sm:inline">
                {phaseTag(course, activeWeek)} · {overallPercent}%
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
                    setTab('overview');
                    if (typeof window !== 'undefined') {
                      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 60);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/40"
                >
                  <Sparkles className="h-4 w-4" /> All done — review
                </button>
              )}
            </>
          ) : undefined
        }
      />

      {/* ───────── Overview tab ───────── */}
      {tab === 'overview' && (
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
      {allGatesPassed && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 dark:border-green-800 dark:from-green-900/20 dark:to-emerald-900/10"
        >
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-green-100 p-2 text-green-700 dark:bg-green-900/40 dark:text-green-300">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Engagement complete — all {course.gates.length} gates passed 🎉
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                You&apos;ve finished {tasksComplete} of {ownTasksAll.length} tasks across every week as{' '}
                {ownRole?.name ?? member?.role}. Compile your deliverables into the final package and
                hand it in.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {member && (
                  <Link
                    href={`/courses/${course.id}/docs`}
                    className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                  >
                    <FileText className="h-4 w-4" /> Build your final package
                  </Link>
                )}
                {member && (
                  <Link
                    href={`/courses/${course.id}/team/${member.teamId}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-green-300 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/30"
                  >
                    <Users className="h-4 w-4" /> Review team progress
                  </Link>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <QuickstartChecklist steps={quickstartSteps} onTakeTour={startTour} />

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
          className="rounded-lg border border-l-4 border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
          style={{ borderLeftColor: ownRole.color }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <RoleIcon iconName={ownRole.icon} className="h-9 w-9 shrink-0" color={ownRole.color} />
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  You&apos;re {ownRole.name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {phaseTag(course, activeWeek)} of {contentWeeks.length} ·{' '}
                  {tasksLeftThisWeek} task{tasksLeftThisWeek === 1 ? '' : 's'} left this {unitWord(course).toLowerCase()}
                </div>
              </div>
            </div>
            {/* Next-action lives in the always-visible sticky bar; the hero only
                confirms the done state to avoid a second competing Continue. */}
            {!nextTask && (
              <span className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-300">
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

      {/* Pipeline — collapsed by default (calm dashboard); the Guide explains it in depth. */}
      <div className="rounded-lg border border-gray-200 bg-white px-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <Collapsible title="Course pipeline & gates" defaultOpen={false}>
          <div className="space-y-4 pb-2">
            <Link
              href={`/courses/${course.id}/guide`}
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              <Compass className="h-4 w-4" /> How it works
            </Link>
            <LifecycleFlow
              weeks={course.weeks}
              gates={course.gates}
              weekProgress={weekStats}
              gateStatus={gateStats}
              currentWeek={activeWeek}
              engagement={isEngagement(course)}
            />
            <div className="border-t border-gray-100 pt-4 dark:border-gray-700">
              <GuidedStepper items={stepperItems} onSelect={(i) => openAndScrollWeek(sortedWeeks[i]?.number ?? 1)} />
            </div>
          </div>
        </Collapsible>
      </div>

      {/* One-time migration of this device's local progress into the account */}
      <ImportPrompt course={course} />

      {/* Enrollment summary once joined (edit team/role here) */}
      {joined && (
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

      {/* Reset (once joined) */}
      {joined && member && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setConfirmingReset(true)}
            className="ml-auto inline-flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
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

      {/* ───────── Weekly Tasks tab ───────── */}
      {tab === 'weeks' && (
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
      {/* Weekly breakdown */}
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Weekly tasks</h2>
        {!joined && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
            <Lock className="h-4 w-4 shrink-0" /> Join a team &amp; role on the <strong>Overview</strong> tab to unlock and track these tasks.
          </div>
        )}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks by name, objective, or framework…"
            aria-label="Search tasks"
            className="w-full pl-9 pr-9"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {q && !anyMatches && (
          <p className="text-sm text-gray-500 dark:text-gray-400">No tasks match “{query}”.</p>
        )}
      </div>

      {joined && <LabAccessPanel courseId={course.id} />}

      <div className="space-y-4">
        {sortedWeeks.map((w) => {
          const weekTasks = getWeekTasks(course, w.number);
          const shownTasks = q ? weekTasks.filter(matchesQuery) : weekTasks;
          if (q && shownTasks.length === 0) return null;
          const isWeekOpen = q ? true : effectiveOpenWeeks.has(w.number);
          const weekPct = weekStats[w.number] ?? 0;
          const gateForWeek = course.gates.find((g) => g.week === w.number);
          const ownTasks = member ? shownTasks.filter((t) => t.role === member.role) : [];
          const otherTasks = member ? shownTasks.filter((t) => t.role !== member.role) : shownTasks;
          const refOpen = q ? true : openRefs.has(w.number);
          const displayCount = q ? shownTasks.length : weekTasks.length;
          const locked = weekLocked(w.number);
          const lockGate = priorGateForWeek(w.number);
          return (
            <section
              key={w.number}
              id={`week-${w.number}`}
              className="scroll-mt-24 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
            >
              <button
                type="button"
                onClick={() => toggleWeek(w.number)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {phaseTitle(course, w.number)}
                    </h3>
                    {w.number === activeWeek && joined && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="truncate text-sm text-gray-600 dark:text-gray-400">{w.theme}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {joined && (
                    <span className="hidden items-center gap-1.5 sm:flex">
                      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <span
                          className="block h-full rounded-full bg-blue-600"
                          style={{ width: `${weekPct}%` }}
                        />
                      </span>
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                        {weekPct}%
                      </span>
                    </span>
                  )}
                  {gateForWeek && joined && (
                    <span className="hidden text-xs text-gray-500 dark:text-gray-400 md:inline">
                      Gate {gateForWeek.id}
                    </span>
                  )}
                  {locked && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                      <Lock className="h-3 w-3" /> Locked
                    </span>
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {displayCount} task{displayCount === 1 ? '' : 's'}
                  </span>
                  {isWeekOpen ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </button>

              {isWeekOpen && locked && (
                <div className="border-t border-gray-200 p-5 dark:border-gray-700">
                  <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/30">
                    <Lock className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Locked until you clear Gate {lockGate?.id}.
                      </p>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Finish Week {(lockGate?.week ?? w.number - 1)} required tasks to pass Gate{' '}
                        {lockGate?.id} and unlock this week — the engagement runs in order.
                      </p>
                      {lockGate && (
                        <button
                          type="button"
                          onClick={() => openAndScrollWeek(lockGate.week)}
                          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                        >
                          Go to Week {lockGate.week} <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {isWeekOpen && !locked && (
                <div className="space-y-4 border-t border-gray-200 p-5 dark:border-gray-700">
                  {weekTasks.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No tasks for this week yet.
                    </p>
                  )}

                  {/* One compact "Week at a glance" card: objective + status chips +
                      what-done-looks-like, with the flow diagram and gate checklist
                      tucked behind a toggle. */}
                  {joined && member && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/40">
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Week at a glance
                      </div>
                      {w.objective && (
                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{w.objective}</p>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-medium text-gray-700 ring-1 ring-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:ring-gray-700">
                          {weekPct}% complete
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-medium text-gray-700 ring-1 ring-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:ring-gray-700">
                          {ownTasks.length} task{ownTasks.length === 1 ? '' : 's'}
                        </span>
                        {gateForWeek &&
                          (() => {
                            const s = gateStats[gateForWeek.id] || 'locked';
                            const meta =
                              s === 'passed'
                                ? { label: 'Gate passed', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800' }
                                : s === 'ready'
                                  ? { label: 'Gate ready', cls: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800' }
                                  : { label: 'Gate in progress', cls: 'bg-gray-100 text-gray-600 ring-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:ring-gray-600' };
                            return (
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium ring-1 ${meta.cls}`}>
                                {gateForWeek.id} · {meta.label}
                              </span>
                            );
                          })()}
                      </div>

                      <div className="mt-3 rounded-lg border border-gray-200 bg-white px-3 dark:border-gray-700 dark:bg-gray-800">
                        <Collapsible title="Week flow & gate checklist" defaultOpen={false}>
                          <div className="space-y-3 pb-1">
                            {ownTasks.length > 0 && (
                              <WeekTaskFlow
                                course={course}
                                role={member.role}
                                week={w.number}
                                taskStats={taskStats}
                                onTaskClick={(id) => {
                                  const t = getTaskById(course, id);
                                  if (t) goToTask(t);
                                }}
                              />
                            )}
                            {gateForWeek && (
                              <WeekGatePanel
                                course={course}
                                week={w.number}
                                status={gateStats[gateForWeek.id] || 'locked'}
                                ownRole={member?.role}
                                taskStats={taskStats}
                              />
                            )}
                          </div>
                        </Collapsible>
                      </div>
                    </div>
                  )}

                  {/* Your role's tasks (interactive) */}
                  {joined && ownRole && ownTasks.length > 0 && (
                    <div
                      className="space-y-3 rounded-lg border-l-4 bg-gray-50 p-4 dark:bg-gray-700/30"
                      style={{ borderLeftColor: ownRole.color }}
                    >
                      <RoleGroupHeader role={ownRole} tag="own" />
                      {ownTasks.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          isOwn
                          joined={joined}
                          open={expanded.has(task.id)}
                          isNext={task.id === nextTask?.id}
                          percent={taskStats[task.id] ?? 0}
                          onToggle={() => toggleTask(task)}
                        >
                          {renderTaskBody(task, true)}
                        </TaskRow>
                      ))}
                    </div>
                  )}

                  {/* Other roles — tucked into a reference panel */}
                  {joined && otherTasks.length > 0 && (
                    <div className="rounded-lg border border-dashed border-gray-300 p-3 dark:border-gray-600">
                      <button
                        type="button"
                        onClick={() => toggleRef(w.number)}
                        className="flex w-full items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300"
                      >
                        <Users className="h-4 w-4" />
                        Other roles this week (reference) · {otherTasks.length}
                        {refOpen ? (
                          <ChevronDown className="ml-auto h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="ml-auto h-4 w-4 text-gray-400" />
                        )}
                      </button>
                      {refOpen && (
                        <div className="mt-3 space-y-4">
                          {otherRoles.map((r) => {
                            const roleTasks = otherTasks.filter((t) => t.role === r.id);
                            if (roleTasks.length === 0) return null;
                            return (
                              <div key={r.id} className="space-y-3">
                                <RoleGroupHeader role={r} tag="reference" />
                                {roleTasks.map((task) => (
                                  <TaskRow
                                    key={task.id}
                                    task={task}
                                    isOwn={false}
                                    joined={joined}
                                    open={expanded.has(task.id)}
                                    percent={taskStats[task.id] ?? 0}
                                    onToggle={() => toggleTask(task)}
                                  >
                                    {renderTaskBody(task, false)}
                                  </TaskRow>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Not joined — all roles, locked */}
                  {!joined &&
                    course.roles.map((r) => {
                      const roleTasks = shownTasks.filter((t) => t.role === r.id);
                      if (roleTasks.length === 0) return null;
                      return (
                        <div
                          key={r.id}
                          className="space-y-3 rounded-lg border-l-4 bg-gray-50 p-4 dark:bg-gray-700/30"
                          style={{ borderLeftColor: r.color }}
                        >
                          <RoleGroupHeader role={r} />
                          {roleTasks.map((task) => (
                            <TaskRow
                              key={task.id}
                              task={task}
                              isOwn={false}
                              joined={false}
                              open={false}
                              percent={0}
                              onToggle={() => undefined}
                            >
                              {null}
                            </TaskRow>
                          ))}
                        </div>
                      );
                    })}
                </div>
              )}
            </section>
          );
        })}
      </div>
      </motion.div>
      )}
    </motion.div>
  );
}
