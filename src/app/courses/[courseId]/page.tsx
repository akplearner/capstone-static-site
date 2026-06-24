'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Compass,
  FileText,
  Lock,
  RotateCcw,
  Search,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { GateBadge, StepDetail } from '@/components/TaskComponents';
import { GuidedTaskRunner } from '@/components/GuidedTaskRunner';
import { GuidedStepper, StepperItem } from '@/components/GuidedStepper';
import { LifecycleFlow } from '@/components/diagrams/LifecycleFlow';
import { RoleWorkflow } from '@/components/diagrams/RoleWorkflow';
import { WeekGatePanel } from '@/components/WeekGatePanel';
import { InfoTip } from '@/components/InfoTip';
import { RoleIcon } from '@/components/RoleIcon';
import { EmptyState } from '@/components/EmptyState';
import { useCourse } from '@/lib/useCourse';
import { useMember } from '@/lib/useMember';
import { progressRepo } from '@/lib/data';
import { useClientStore, EMPTY_OBJECT, notifyStore } from '@/lib/useClientStore';
import { getRoleDef, getTasksByRole, getWeekTasks } from '@/lib/course-helpers';
import { getFrameworkColor, getFrameworkLabel } from '@/lib/utils';
import { Course, GateStatus, Member, RoleDef, Task } from '@/lib/types';

const COHORTS = ['2026-Spring', '2026-Fall'];

type CourseStats = {
  weekStats: Record<number, number>;
  taskStats: Record<string, number>;
  gateStats: Record<number, GateStatus>;
  activeWeek: number;
};
const EMPTY_STATS: CourseStats = { weekStats: {}, taskStats: {}, gateStats: {}, activeWeek: 1 };

// In-course sub-nav (tab) styling, shared by the tab buttons and the Team/Guide links.
const SUBTAB_BASE =
  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors';
const SUBTAB_INACTIVE =
  'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white';
const SUBTAB_LINK = `${SUBTAB_BASE} ${SUBTAB_INACTIVE}`;
function subTabClass(active: boolean): string {
  return `${SUBTAB_BASE} ${active ? 'bg-blue-600 text-white hover:bg-blue-700' : SUBTAB_INACTIVE}`;
}

/** Inline enrollment: pick a team (capacity-aware) and role without leaving the page. */
function JoinPanel({
  course,
  member,
  onJoined,
}: {
  course: Course;
  member: Member | null;
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
    const newMember: Member = {
      memberId: member?.memberId ?? `${course.id}-${cohort}-${team}-${role}-${Date.now()}`,
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
                <RoleIcon iconName={r.icon} className="h-5 w-5 shrink-0" color={r.color} />
                <span>
                  <span className="block font-medium text-gray-900 dark:text-white">{r.name}</span>
                  <span className="block text-xs text-gray-600 dark:text-gray-400">{r.mission}</span>
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
              commandExplanation={s.commandExplanation}
              commandFlags={s.commandFlags}
              expectedOutput={s.expectedOutput}
              outputExplanation={s.outputExplanation}
              whatItMeans={s.whatItMeans}
              frameworks={s.frameworks}
              deliverable={s.producesDeliverable}
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
  children,
}: {
  task: Task;
  isOwn: boolean;
  joined: boolean;
  open: boolean;
  percent: number;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const canOpen = joined;
  const steps = task.steps.length;
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
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  // null = the student hasn't toggled weeks yet, so the active week shows open by
  // default; once they interact we track their explicit set.
  const [openWeeks, setOpenWeeks] = useState<Set<number> | null>(null);
  const [openRefs, setOpenRefs] = useState<Set<number>>(new Set());
  const [tab, setTab] = useState<'overview' | 'weeks'>('overview');
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

  if (loading) return <div className="py-12 text-center text-gray-500">Loading…</div>;

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

  const stepperItems: StepperItem[] = sortedWeeks.map((w) => ({
    label: `Week ${w.number}`,
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
  };

  const ownRole = member ? getRoleDef(course, member.role) : undefined;
  const otherRoles = member ? course.roles.filter((r) => r.id !== member.role) : course.roles;

  // Overall progress + "your next step" across the student's own tasks.
  const ownTasksAll = member ? getTasksByRole(course, member.role) : [];
  const totalSteps = ownTasksAll.reduce((s, t) => s + t.steps.length, 0);
  const doneSteps = ownTasksAll.reduce(
    (s, t) => s + Math.round(((taskStats[t.id] ?? 0) / 100) * t.steps.length),
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
  const renderTaskBody = (task: Task, isOwn: boolean) => (
    <>
      {task.deliverables.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
            <FileText className="h-4 w-4" /> Deliverables to produce
          </div>
          <ul className="mt-2 flex flex-wrap gap-2">
            {task.deliverables.map((d) => (
              <li
                key={d}
                className="rounded bg-white px-2 py-1 font-mono text-xs text-amber-800 dark:bg-gray-800 dark:text-amber-300"
              >
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}
      {isOwn && member ? (
        <GuidedTaskRunner
          task={task}
          courseId={course.id}
          memberId={member.memberId}
          onProgressChange={onProgressChange}
        />
      ) : (
        <TaskReference task={task} />
      )}
    </>
  );

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{course.title}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">{course.description}</p>
      </div>

      {/* Sticky course sub-nav: tabs + at-a-glance progress / Continue */}
      <div className="sticky top-0 z-30 -mx-4 flex flex-wrap items-center gap-x-1 gap-y-2 border-b border-gray-200 bg-white/95 px-4 py-2 backdrop-blur dark:border-gray-700 dark:bg-gray-900/95">
        <button type="button" onClick={() => setTab('overview')} className={subTabClass(tab === 'overview')}>
          Overview
        </button>
        <button type="button" onClick={() => setTab('weeks')} className={subTabClass(tab === 'weeks')}>
          Weekly Tasks
        </button>
        {joined && member && (
          <Link href={`/courses/${course.id}/team/${member.teamId}`} className={SUBTAB_LINK}>
            <Users className="h-4 w-4" /> Team
          </Link>
        )}
        <Link href={`/courses/${course.id}/guide`} className={SUBTAB_LINK}>
          <BookOpen className="h-4 w-4" /> Guide
        </Link>
        {joined && member && (
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm text-gray-500 dark:text-gray-400 sm:inline">
              {overallPercent}% complete
            </span>
            {nextTask ? (
              <Button
                onClick={() => nextTask && goToTask(nextTask)}
                size="sm"
                className="flex items-center gap-1.5"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-300">
                <Sparkles className="h-4 w-4" /> All done
              </span>
            )}
          </div>
        )}
      </div>

      {/* ───────── Overview tab ───────── */}
      {tab === 'overview' && (
      <div className="space-y-8">
      {/* Pipeline + gates */}
      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-lg font-bold text-gray-900 dark:text-white">
            Course pipeline
            <InfoTip label="Your week-by-week path. Finish a week's required tasks to clear its gate, then move on to the next week." />
          </h2>
          <Link
            href={`/courses/${course.id}/guide`}
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            <Compass className="h-4 w-4" /> How it works
          </Link>
        </div>
        <LifecycleFlow
          weeks={course.weeks}
          gates={course.gates}
          weekProgress={weekStats}
          gateStatus={gateStats}
          currentWeek={activeWeek}
        />
        <div className="border-t border-gray-100 pt-4 dark:border-gray-700">
          <GuidedStepper items={stepperItems} onSelect={(i) => openAndScrollWeek(sortedWeeks[i]?.number ?? 1)} />
        </div>
        {joined && course.gates.length > 0 && (
          <div className="border-t border-gray-100 pt-4 dark:border-gray-700">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Gates
              <InfoTip label="A gate marks the end of a week. Complete the week's required tasks to move it from Locked → In progress → Passed." />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {course.gates.map((gate) => (
                <GateBadge
                  key={gate.id}
                  gateId={gate.id}
                  status={gateStats[gate.id] || 'locked'}
                  completionPercent={weekStats[gate.week] || 0}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Inline enrollment */}
      <JoinPanel course={course} member={member} onJoined={(m) => setMember(m)} />

      {/* Reset (once joined) */}
      {joined && member && (
        <div className="flex flex-wrap items-center gap-3">
          {confirmingReset ? (
            <span className="ml-auto inline-flex items-center gap-2 text-sm">
              <span className="text-gray-600 dark:text-gray-300">Reset all progress?</span>
              <button
                onClick={confirmReset}
                className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
              <button
                onClick={() => setConfirmingReset(false)}
                className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              onClick={() => setConfirmingReset(true)}
              className="ml-auto inline-flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
            >
              <RotateCcw className="h-4 w-4" /> Reset my progress
            </button>
          )}
        </div>
      )}

      {/* Progress + your next step (joined) */}
      {joined && member && (
        <div className="grid gap-4 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Your progress</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {tasksComplete} of {ownTasksAll.length} tasks · {overallPercent}%
              </span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <motion.div
                className="h-full rounded-full bg-blue-600"
                initial={{ width: 0 }}
                animate={{ width: `${overallPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
          {nextTask ? (
            <Button
              onClick={() => nextTask && goToTask(nextTask)}
              className="flex items-center gap-2 md:ml-4"
            >
              Continue: {nextTask.title} <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-300 md:ml-4">
              <Sparkles className="h-4 w-4" /> All your tasks are complete!
            </div>
          )}
        </div>
      )}

      {/* Your path — one focused diagram; the conceptual diagrams live on the Guide. */}
      {joined && member && (
        <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Your path{ownRole ? ` — ${ownRole.name}` : ''}
          </h2>
          <RoleWorkflow
            course={course}
            role={member.role}
            weekProgress={weekStats}
            currentWeek={activeWeek}
          />
        </section>
      )}
      </div>
      )}

      {/* ───────── Weekly Tasks tab ───────── */}
      {tab === 'weeks' && (
      <div className="space-y-4">
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
                      Week {w.number}: {w.title}
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

              {isWeekOpen && (
                <div className="space-y-4 border-t border-gray-200 p-5 dark:border-gray-700">
                  {weekTasks.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No tasks for this week yet.
                    </p>
                  )}

                  {joined && gateForWeek && (
                    <WeekGatePanel
                      course={course}
                      week={w.number}
                      status={gateStats[gateForWeek.id] || 'locked'}
                      ownRole={member?.role}
                      taskStats={taskStats}
                    />
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
                          percent={taskStats[task.id] ?? 0}
                          onToggle={() => toggle(task.id)}
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
                                    onToggle={() => toggle(task.id)}
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
      </div>
      )}
    </motion.div>
  );
}
