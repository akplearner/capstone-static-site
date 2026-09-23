'use client';

import type { Dispatch, SetStateAction } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown, ChevronRight, Lock, Users, Wrench } from 'lucide-react';
import type { Course, GateStatus, Member, RoleDef, Task, WeekDef } from '@/lib/types';
import type { Cohort } from '@/lib/data';
import { Collapsible } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Alert } from '@/components/ui/Alert';
import { CourseEnrolGate } from '@/components/CourseEnrolGate';
import { GuidedTaskRunner } from '@/components/task/GuidedTaskRunner';
import { WeekRail } from '@/components/week/WeekRail';
import { BuildMap } from '@/components/week/BuildMap';
import { LabAccessPanel } from '@/components/week/LabAccessPanel';
import { WeekMilestoneHeader } from '@/components/week/WeekMilestoneHeader';
import { WeekGatePanel } from '@/components/week/WeekGatePanel';
import { RoleIcon } from '@/components/team/RoleIcon';
import { TaskRow } from './TaskRow';
import { TaskReference } from './TaskReference';
import { TaskAboutPanel } from './TaskAboutPanel';
import { getTasksByRole, getWeekTasks, isAdvancedWeek, isSetupWeek, phaseTag } from '@/lib/course-helpers';
import { socTopology, SOC_LOGIN_LABEL, SOC_URL } from '@/lib/labTopology';
import { dueLabel, weekDue } from '@/lib/calendar';
import { saveStepDensity, type StepDensity } from '@/lib/stepDensity';
import { DUR, EASE, meter } from '@/lib/motion';

/**
 * The Tasks tab: one week at a time, one flat list.
 *
 * A header naming the week you are on, the "do once" setup strip, a rail to
 * switch weeks, and the week's tasks in the order you do them. R78-C1: lifted
 * out of `page.tsx` unchanged; the funnel that reshapes it is R78-B.
 */
export function TasksTab({
  course,
  member,
  ownRole,
  unit,
  weekStats,
  taskStats,
  gateStats,
  activeWeek,
  effectiveWeek,
  sortedWeeks,
  nextTask,
  nextIncompleteAfter,
  stuckByTask,
  cohortCal,
  expanded,
  setExpanded,
  toggleTask,
  setupOpen,
  setSetupOpen,
  othersOpen,
  setOthersOpen,
  deepStep,
  density,
  weekLocked,
  priorGateForWeek,
  pickWeek,
  openAndScrollWeek,
  goToTask,
  selectTab,
  onProgressChange,
}: {
  course: Course;
  member: Member | null;
  ownRole: RoleDef | undefined;
  unit: string;
  weekStats: Record<number, number>;
  taskStats: Record<string, number>;
  gateStats: Record<number, GateStatus>;
  activeWeek: number;
  /** The student's pick (or a `?week=` deep link), else the resume pointer. */
  effectiveWeek: number;
  sortedWeeks: WeekDef[];
  nextTask: Task | undefined;
  nextIncompleteAfter: (taskId: string) => Task | undefined;
  stuckByTask: Record<string, number>;
  cohortCal: Cohort | null;
  expanded: Set<string>;
  setExpanded: Dispatch<SetStateAction<Set<string>>>;
  toggleTask: (task: Task) => void;
  setupOpen: boolean | null;
  setSetupOpen: Dispatch<SetStateAction<boolean | null>>;
  othersOpen: boolean;
  setOthersOpen: Dispatch<SetStateAction<boolean>>;
  deepStep: { taskId: string; stepId?: string } | null;
  density: StepDensity;
  weekLocked: (weekNum: number) => boolean;
  priorGateForWeek: (weekNum: number) => Course['gates'][number] | undefined;
  pickWeek: (n: number) => void;
  openAndScrollWeek: (n: number) => void;
  goToTask: (task: Task) => void;
  selectTab: (t: 'home' | 'tasks') => void;
  onProgressChange: () => void;
}) {
  const joined = !!member;
  if (!joined || !member || !ownRole) {
    // Not enrolled: the tasks ARE the course material, so this is where the
    // page stops. The dashboard still sells the course; this is the line.
    return <CourseEnrolGate courseId={course.id} what="the tasks" />;
  }

  const otherRoles = course.roles.filter((r) => r.id !== member.role);
  // Setup weeks are the "do once" strip; the rail holds only graded weeks.
  const gradedWeeks = sortedWeeks.filter((w) => !isSetupWeek(course, w.number));
  const setupWeeks = sortedWeeks.filter((w) => isSetupWeek(course, w.number));
  const setupTasks = setupWeeks.flatMap((w) => getTasksByRole(course, member.role, w.number));
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
  const weekTasks = getWeekTasks(course, viewWeek);
  // One flat list: the shared build first, then the task that is yours alone.
  const sharedWeekTasks = weekTasks.filter((t) => t.shared);
  const ownWeekTasks = weekTasks.filter((t) => !t.shared && t.role === member.role);
  const ordered = [...sharedWeekTasks, ...ownWeekTasks];
  const otherWeekTasks = weekTasks.filter((t) => !t.shared && t.role !== member.role);
  const viewPct = weekStats[viewWeek] ?? 0;
  const gateForWeek = course.gates.find((g) => g.week === viewWeek);
  const viewLocked = weekLocked(viewWeek);
  const lockGate = priorGateForWeek(viewWeek);

  // Expanded content for a task row: the runner for your own tasks, the
  // read-only reference (with the same About panel) for a teammate's.
  const renderTaskBody = (task: Task, isOwn: boolean) => {
    if (isOwn) {
      const following = nextIncompleteAfter(task.id);
      return (
        <GuidedTaskRunner
          task={task}
          courseId={course.id}
          memberId={member.memberId}
          initialStepId={deepStep?.taskId === task.id ? deepStep.stepId : undefined}
          guidedDefault={course.guidedDefault}
          density={density}
          onDensityChange={(d) => saveStepDensity(course.id, member.memberId, d)}
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
    }
    return (
      <>
        <div className="mb-3 rounded-lg depth-edge px-4">
          <Collapsible title="About this task" defaultOpen={false}>
            <div className="py-1 pr-2">
              <TaskAboutPanel course={course} task={task} />
            </div>
          </Collapsible>
        </div>
        <TaskReference task={task} />
      </>
    );
  };

  return (
    <>
      <PageHeader
        id="tasks-head"
        tabIndex={-1}
        className="outline-none"
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

      {/* The thread through the weeks: what you are building, one chip per
          week, and how you will know this week's piece is built. */}
      <BuildMap
        course={course}
        weeks={gradedWeeks.map((w) => w.number)}
        current={viewWeek}
        percentOf={(w) => weekStats[w] ?? 0}
        onPick={pickWeek}
      />

      {/* Setup is "do once", not a week. In class the lab already exists. */}
      {setupWeeks.length > 0 && setupTasks.length > 0 && (
        <section id="setup-strip" className="scroll-under-chrome rounded-lg depth-edge bg-panel">
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
          {/* Mounted while collapsed so the `aria-controls` above resolves. */}
          <div
            id="setup-tasks"
            className={setupIsOpen ? 'space-y-3 border-t border-line p-4' : 'hidden'}
          >
            {setupIsOpen && (
              <>
                {/* SOC-course banner only: it names the shared Wazuh SOC and
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
              </>
            )}
          </div>
        </section>
      )}

      {/* The week rail — the same component the Deliverables page uses. A tick
          when the week is done, a lock while its gate is shut, and a slow pulse
          on the week you are actually on. */}
      <WeekRail
        id="week-rail"
        dots
        selected={viewWeek}
        onSelect={pickWeek}
        items={gradedWeeks.map((w) => ({
          week: w.number,
          label: phaseTag(course, w.number),
          done: (weekStats[w.number] ?? 0) >= 100,
          locked: weekLocked(w.number),
          pulse: w.number === activeWeek && (weekStats[w.number] ?? 0) < 100,
          advanced: isAdvancedWeek(course, w.number),
          hint: cohortCal ? dueLabel(weekDue(cohortCal.startsOn, w.number), undefined, (weekStats[w.number] ?? 0) >= 100).text : undefined,
        }))}
      />

      <LabAccessPanel courseId={course.id} />

      {/* `data-week` is one attribute, and every stratum edge inside takes this
          phase's colour from it. See the "Phase colour" block in globals.css. */}
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
            <div className="flex items-start gap-3 rounded-lg depth-edge bg-panel-2 p-4">
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
                <div className="rounded-lg depth-edge bg-panel px-3">
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

              {/* The list. Shared build first, your focus last with its chip. */}
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
                    stuckCount={stuckByTask[task.id]}
                    focus={!!course.sharedTrack && !task.shared}
                    percent={taskStats[task.id] ?? 0}
                    onToggle={() => toggleTask(task)}
                    renderBody={() => renderTaskBody(task, true)}
                  />
                ))}
              </div>

              {/* The rest of the team's work this week, read-only, one press
                  away. A hand-off cannot be checked against a title, so this
                  is for every course that has other roles — never gated on
                  sharedTrack. */}
              {otherWeekTasks.length > 0 && (
                <div id="other-focuses" className="scroll-under-chrome rounded-lg border border-dashed border-line p-3">
                  <button
                    type="button"
                    onClick={() => setOthersOpen((v) => !v)}
                    aria-expanded={othersOpen}
                    aria-controls="other-focus-tasks"
                    className="flex w-full items-center gap-2 text-sm font-medium text-muted"
                  >
                    <Users className="h-4 w-4" />
                    {course.sharedTrack
                      ? `What the other focuses document this ${unit}`
                      : `Other roles this ${unit}`}{' '}
                    · {otherWeekTasks.length}
                    {othersOpen ? (
                      <ChevronDown className="ml-auto h-4 w-4 text-muted" />
                    ) : (
                      <ChevronRight className="ml-auto h-4 w-4 text-muted" />
                    )}
                  </button>
                  {/* Wrapper stays mounted so `aria-controls` above always resolves. */}
                  <div id="other-focus-tasks" className={othersOpen ? 'mt-3 space-y-4' : 'hidden'}>
                    {othersOpen &&
                      otherRoles.map((r) => {
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
                </div>
              )}
            </>
          )}
        </div>
      </motion.section>
    </>
  );
}
