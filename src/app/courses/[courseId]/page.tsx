'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Compass,
  FileText,
  Lock,
  RotateCcw,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { GateBadge, StepDetail } from '@/components/TaskComponents';
import { GuidedTaskRunner } from '@/components/GuidedTaskRunner';
import { GuidedStepper, StepperItem } from '@/components/GuidedStepper';
import { LifecycleFlow } from '@/components/diagrams/LifecycleFlow';
import { RoleIcon } from '@/components/RoleIcon';
import { EmptyState } from '@/components/EmptyState';
import { useCourse } from '@/lib/useCourse';
import { useMember } from '@/lib/useMember';
import { progressRepo } from '@/lib/data';
import { getRoleDef, getTasksByRole, getWeekTasks } from '@/lib/course-helpers';
import { Course, GateStatus, Member, Task } from '@/lib/types';

const COHORTS = ['2026-Spring', '2026-Fall'];

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
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [name, setName] = useState(member?.displayName ?? '');
  const [cohort, setCohort] = useState(member?.cohort ?? COHORTS[0]);
  const [team, setTeam] = useState(member?.teamId ?? teamIds[0]);
  const [role, setRole] = useState(member?.role ?? course.roles[0]?.id ?? '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCounts(progressRepo.getTeamCounts(course.id));
  }, [course.id, member, editing]);

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
      setCounts(progressRepo.getTeamCounts(course.id));
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
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
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
              expectedOutput={s.expectedOutput}
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

export default function CoursePage() {
  const course = useCourse();
  const { member, loading, setMember } = useMember(course.id);
  const [refresh, setRefresh] = useState(0);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [activeWeek, setActiveWeek] = useState(course.weeks[0]?.number ?? 1);
  const [weekStats, setWeekStats] = useState<Record<number, number>>({});
  const [taskStats, setTaskStats] = useState<Record<string, number>>({});
  const [gateStats, setGateStats] = useState<Record<number, GateStatus>>({});

  const onProgressChange = useCallback(() => setRefresh((r) => r + 1), []);

  useEffect(() => {
    if (!member) return;
    // One batched localStorage scan for all derivations below.
    const keySet = progressRepo.getCompletionKeySet(course.id, member.memberId);
    const weeks: Record<number, number> = {};
    const tasks: Record<string, number> = {};
    let firstIncomplete = course.weeks[0]?.number ?? 1;
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
    const gates: Record<number, GateStatus> = {};
    course.gates.forEach((g) => {
      gates[g.id] = progressRepo.deriveGateStatus(course, member.memberId, member.role, g, keySet);
    });
    setWeekStats(weeks);
    setTaskStats(tasks);
    setGateStats(gates);
    setActiveWeek(firstIncomplete);
  }, [member, course, refresh]);

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

  const scrollToWeek = (n: number) => {
    setActiveWeek(n);
    if (typeof document !== 'undefined') {
      document.getElementById(`week-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleReset = () => {
    if (!member) return;
    if (confirm('Reset all your progress for this course? This cannot be undone.')) {
      progressRepo.resetCourse(course.id, member.memberId);
      setExpanded(new Set());
      setRefresh((r) => r + 1);
    }
  };

  // Own role first, then the rest (read-only reference).
  const own = member ? course.roles.filter((r) => r.id === member.role) : [];
  const others = member ? course.roles.filter((r) => r.id !== member.role) : course.roles;
  const orderedRoles = [...own, ...others];

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{course.title}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">{course.description}</p>
      </div>

      {/* Pipeline + gates */}
      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Course pipeline</h2>
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
          <GuidedStepper items={stepperItems} onSelect={(i) => scrollToWeek(sortedWeeks[i]?.number ?? 1)} />
        </div>
        {joined && course.gates.length > 0 && (
          <div className="grid gap-3 border-t border-gray-100 pt-4 dark:border-gray-700 sm:grid-cols-2 lg:grid-cols-3">
            {course.gates.map((gate) => (
              <GateBadge
                key={gate.id}
                gateId={gate.id}
                status={gateStats[gate.id] || 'locked'}
                completionPercent={weekStats[gate.week] || 0}
              />
            ))}
          </div>
        )}
      </div>

      {/* Inline enrollment */}
      <JoinPanel course={course} member={member} onJoined={(m) => setMember(m)} />

      {/* Quick links + reset (once joined) */}
      {joined && member && (
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/courses/${course.id}/team/${member.teamId}`}>
            <Button variant="secondary" className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Team Space
            </Button>
          </Link>
          <Link href={`/courses/${course.id}/guide`}>
            <Button variant="secondary" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Guide
            </Button>
          </Link>
          <button
            onClick={handleReset}
            className="ml-auto inline-flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
          >
            <RotateCcw className="h-4 w-4" /> Reset my progress
          </button>
        </div>
      )}

      {/* Weekly breakdown */}
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Weekly tasks</h2>
        {!joined && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
            <Lock className="h-4 w-4 shrink-0" /> Join a team & role above to unlock and track these tasks.
          </div>
        )}
      </div>

      <div className="space-y-10">
        {sortedWeeks.map((w) => {
          const weekTasks = getWeekTasks(course, w.number);
          return (
            <section key={w.number} id={`week-${w.number}`} className="scroll-mt-24 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Week {w.number}: {w.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{w.theme}</p>
              </div>

              {weekTasks.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">No tasks for this week yet.</p>
              )}

              {orderedRoles.map((r) => {
                const roleTasks = weekTasks.filter((t) => t.role === r.id);
                if (roleTasks.length === 0) return null;
                const isOwn = member?.role === r.id;
                return (
                  <div
                    key={r.id}
                    className="space-y-3 rounded-lg border-l-4 bg-white p-4 shadow-sm dark:bg-gray-800"
                    style={{ borderLeftColor: r.color }}
                  >
                    <div className="flex items-center gap-2">
                      <RoleIcon iconName={r.icon} className="h-5 w-5" color={r.color} />
                      <span className="font-semibold text-gray-900 dark:text-white">{r.name}</span>
                      {isOwn && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                          Your role
                        </span>
                      )}
                      {!isOwn && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">reference</span>
                      )}
                    </div>

                    {roleTasks.map((task) => {
                      const open = expanded.has(task.id);
                      const canOpen = joined;
                      return (
                        <div
                          key={task.id}
                          id={`task-${task.id}`}
                          className="scroll-mt-24 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <button
                            type="button"
                            disabled={!canOpen}
                            onClick={() => canOpen && toggle(task.id)}
                            className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                              canOpen
                                ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                : 'cursor-not-allowed opacity-70'
                            }`}
                          >
                            <span className="min-w-0">
                              <span className="block font-medium text-gray-900 dark:text-white">{task.title}</span>
                              <span className="block truncate text-sm text-gray-600 dark:text-gray-400">
                                {task.objective}
                              </span>
                            </span>
                            <span className="flex shrink-0 items-center gap-3">
                              {isOwn && joined && (
                                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                  {taskStats[task.id] ?? 0}%
                                </span>
                              )}
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {task.steps.length} steps
                              </span>
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
                            <div className="border-t border-gray-200 p-4 dark:border-gray-700">
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
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </section>
          );
        })}
      </div>
    </motion.div>
  );
}
