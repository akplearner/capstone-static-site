'use client';

import type { Dispatch, SetStateAction } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Lock } from 'lucide-react';
import type { Course, Member, RoleDef, Task, WeekDef } from '@/lib/types';
import type { Cohort } from '@/lib/data';
import { Collapsible } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { CourseEnrolGate } from '@/components/CourseEnrolGate';
import { GuidedTaskRunner } from '@/components/task/GuidedTaskRunner';
import { FlowDiagram, type FlowNode } from '@/components/diagrams/FlowDiagram';
import { WeekRail } from '@/components/week/WeekRail';
import { WeekHeader } from '@/components/week/WeekHeader';
import { LabAccessPanel } from '@/components/week/LabAccessPanel';
import { RoleIcon } from '@/components/team/RoleIcon';
import { TaskRow } from './TaskRow';
import { useRarity } from './useRarity';
import { TaskStone, WeekGemTray } from '@/components/quarry/art/TaskStone';
import { tintFor } from '@/components/quarry/art/palette';
import { weekRarity } from '@/lib/rarity';
import { TaskReference } from './TaskReference';
import { TaskAboutPanel } from './TaskAboutPanel';
import { formatMinutes, getTasksByRole, getWeekTasks, isAdvancedWeek, isSetupWeek, phaseTag, weekSummary } from '@/lib/course-helpers';
import { socTopology, SOC_LOGIN_LABEL, SOC_URL } from '@/lib/labTopology';
import { hasLabAccess, labProfile, useLabAccess } from '@/lib/labAccess';
import { dueLabel, weekDue } from '@/lib/calendar';
import { DUR, EASE } from '@/lib/motion';

/**
 * The Tasks tab: one week, in focus.
 *
 * R78-B made this the funnel: five things, in the order a student needs them.
 * R79 makes the OBJECTIVE the unit of every one of them. Students said the
 * platform showed too much at once — Server+ put ten tasks in front of them —
 * and asked for three or four things a week. So:
 *
 *   1. the rail — which week, and how long it is;
 *   2. the header — one sentence: what this week is FOR (`WeekDef.objective`);
 *   3. the workflow — the week's two to four OBJECTIVES as clickable nodes
 *      (`WeekDef.objectives`), each carrying its tasks and time, with the
 *      milestone as the caption under the last; on a role-split course a
 *      teammate's objective is drawn too, so the week reads as one story;
 *   4. the list — the tasks GROUPED under their objective, one line each;
 *   5. ONE disclosure, "More for this week" — setup, lab access, the other
 *      roles' reference tasks — whose closed bar says whether anything inside
 *      needs you. The gate checklist is gone from here: the gate is "every
 *      objective done", which the nodes already show, and the rail locks.
 */
export function TasksTab({
  course,
  member,
  ownRole,
  unit,
  weekStats,
  taskStats,
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
  moreOpen,
  setMoreOpen,
  deepStep,
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
  /** The week's one disclosure. null = decide from where the student is. */
  moreOpen: boolean | null;
  setMoreOpen: Dispatch<SetStateAction<boolean | null>>;
  deepStep: { taskId: string; stepId?: string } | null;
  weekLocked: (weekNum: number) => boolean;
  priorGateForWeek: (weekNum: number) => Course['gates'][number] | undefined;
  pickWeek: (n: number) => void;
  openAndScrollWeek: (n: number) => void;
  goToTask: (task: Task) => void;
  selectTab: (t: 'home' | 'tasks') => void;
  onProgressChange: () => void;
}) {
  // Hooks above the early return: the lab-access hint on the disclosure bar.
  const lab = useLabAccess(course.id);
  const rarityOf = useRarity(course, member, taskStats, cohortCal);
  const cut = tintFor(course.id).cut;
  const joined = !!member;
  if (!joined || !member || !ownRole) {
    // Not enrolled: the tasks ARE the course material, so this is where the
    // page stops. The dashboard still sells the course; this is the line.
    return <CourseEnrolGate courseId={course.id} what="the tasks" />;
  }

  const otherRoles = course.roles.filter((r) => r.id !== member.role);
  // Setup weeks are the "do once" strip inside the disclosure; the rail holds
  // only graded weeks.
  const gradedWeeks = sortedWeeks.filter((w) => !isSetupWeek(course, w.number));
  const setupWeeks = sortedWeeks.filter((w) => isSetupWeek(course, w.number));
  const setupTasks = setupWeeks.flatMap((w) => getTasksByRole(course, member.role, w.number));
  const setupPct = setupWeeks.length
    ? Math.round(setupWeeks.reduce((sum, w) => sum + (weekStats[w.number] ?? 0), 0) / setupWeeks.length)
    : 0;
  // A pointer (or deep link) into Setup shows a graded week on the rail and
  // opens the disclosure that holds Setup.
  const viewWeek = gradedWeeks.some((w) => w.number === effectiveWeek)
    ? effectiveWeek
    : (gradedWeeks[0]?.number ?? 1);
  const weekTasks = getWeekTasks(course, viewWeek);
  // One flat list: the shared build first, then the task that is yours alone.
  const sharedWeekTasks = weekTasks.filter((t) => t.shared);
  const ownWeekTasks = weekTasks.filter((t) => !t.shared && t.role === member.role);
  const ordered = [...sharedWeekTasks, ...ownWeekTasks];
  const otherWeekTasks = weekTasks.filter((t) => !t.shared && t.role !== member.role);
  const viewPct = weekStats[viewWeek] ?? 0;
  const viewLocked = weekLocked(viewWeek);
  const lockGate = priorGateForWeek(viewWeek);
  const summary = weekSummary(course, member.role, viewWeek);

  // The disclosure opens itself when the student's place is inside it: a
  // resume pointer or deep link into a setup task, or a pointer into Setup.
  const moreIsOpen =
    moreOpen ??
    (setupTasks.some((t) => expanded.has(t.id)) || (setupWeeks.length > 0 && isSetupWeek(course, effectiveWeek)));

  // What the closed bar says. "Not set" is the one thing in here a new student
  // must do, so it is the one thing said in the warn tone.
  const labFields = hasLabAccess(course.id) ? labProfile(course.id).fields : [];
  const labUnset = labFields.length > 0 && labFields.every((f) => !lab.values[f.key]?.trim());
  const hintParts = [
    setupTasks.length > 0 ? `${setupTasks.length} setup task${setupTasks.length === 1 ? '' : 's'} · ${setupPct}%` : '',
    labFields.length > 0 ? (labUnset ? 'lab access not set' : 'lab access set') : '',
    otherWeekTasks.length > 0 ? `${otherWeekTasks.length} from other roles` : '',
  ].filter(Boolean);
  const hasMore = hintParts.length > 0;

  // The week as objectives: one node each, in the order they are done. An
  // objective that holds none of this student's tasks is a teammate's part of
  // the week — drawn, named for its role, not clickable. A course that authors
  // none (an instructor's own) falls back to one group of every task.
  const roleName = (id: string) => course.roles.find((r) => r.id === id)?.name ?? id;
  const groups = summary.objectives.length
    ? summary.objectives
    : [{ id: 'all', label: '', tasks: ordered, own: ordered, roles: [], minutes: summary.minutes }];
  const objectiveStatus = (own: Task[]): FlowNode['status'] => {
    if (own.length === 0) return 'other';
    if (own.every((t) => (taskStats[t.id] ?? 0) >= 100)) return 'done';
    if (own.some((t) => t.id === nextTask?.id || expanded.has(t.id))) return 'current';
    return 'upcoming';
  };
  const weekNodes: FlowNode[] = groups.map((o, i) => {
    const status = objectiveStatus(o.own);
    const count = `${o.own.length} task${o.own.length === 1 ? '' : 's'}`;
    return {
      id: o.id,
      label: `${i + 1}`,
      sublabel: o.label || `This ${unit}`,
      meta: status === 'other' ? o.roles.map(roleName).join(' · ') : o.minutes != null ? `${count} · ~${formatMinutes(o.minutes)}` : count,
      status,
    };
  });
  // Continuous numbering across the groups: a deep link or a teammate's "task
  // 3" means the same row whichever objective it sits under.
  const numberOf = new Map(ordered.map((t, i) => [t.id, i + 1]));

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

  const row = (task: Task, i?: number) => (
    <TaskRow
      key={task.id}
      number={i}
      course={course}
      task={task}
      isOwn
      joined={joined}
      open={expanded.has(task.id)}
      isNext={task.id === nextTask?.id}
      stuckCount={stuckByTask[task.id]}
      focus={i != null && !!course.sharedTrack && !task.shared}
      percent={taskStats[task.id] ?? 0}
      onToggle={() => toggleTask(task)}
      lead={<TaskStone percent={taskStats[task.id] ?? 0} rarity={rarityOf(task)} cut={cut} />}
      renderBody={() => renderTaskBody(task, true)}
    />
  );

  return (
    <>
      {/* 1. Which week. The same component the Deliverables page uses: a tick
            when the week is done, a lock while its gate is shut, a slow pulse
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
          minutes: weekSummary(course, member.role, w.number).minutes,
        }))}
      />

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
        <div className="space-y-5 p-5">
          {/* 2. What this week is for. */}
          <WeekHeader id="tasks-head" course={course} role={member.role} week={viewWeek} percent={viewPct} unit={unit} />

          {/* The gems earned so far: one slot per week, filled in the rarity of
              its weakest task (R80). The same weeks as the rail, as trophies. */}
          <WeekGemTray
            cut={cut}
            selected={viewWeek}
            onSelect={pickWeek}
            weeks={gradedWeeks.map((w) => ({
              week: w.number,
              label: `W${w.number}`,
              rarity: weekRarity(getTasksByRole(course, member.role, w.number).map(rarityOf)),
            }))}
          />

          {viewLocked ? (
            <div className="flex items-start gap-3 rounded-lg depth-edge bg-panel-2 p-4">
              <Lock className="mt-0.5 h-5 w-5 shrink-0 text-muted" />
              <div>
                <p className="text-sm font-medium text-ink">Locked until you clear Gate {lockGate?.id}.</p>
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
              {/* 3. The workflow: the objectives, left to right, with the
                    milestone under them. A click opens the objective's first
                    task that is not done. */}
              {ordered.length > 0 && (
                <FlowDiagram
                  title={`This ${unit}'s objectives`}
                  nodes={weekNodes}
                  onSelect={(id) => {
                    const o = groups.find((g) => g.id === id);
                    const t = o?.own.find((x) => (taskStats[x.id] ?? 0) < 100) ?? o?.own[0];
                    if (t) goToTask(t);
                  }}
                  caption={summary.milestone ? `Done when: ${summary.milestone}` : undefined}
                  ariaLabel={`Objectives this ${unit}`}
                  howToRead="Left to right is the order to do them. Click an objective to open its next task; a tick means every task in it is done."
                />
              )}

              {ordered.length === 0 && <p className="text-sm text-muted">No tasks for this {unit} yet.</p>}

              {/* 4. The list, grouped under the objectives. A teammate's
                    objective has no rows here — their tasks are the reference
                    inside the disclosure. */}
              <div className="space-y-5">
                {groups
                  .map((o, i) => ({ o, n: i + 1 }))
                  .filter(({ o }) => o.own.length > 0)
                  .map(({ o, n }) => {
                    const done = o.own.every((t) => (taskStats[t.id] ?? 0) >= 100);
                    return (
                      <section key={o.id} id={`objective-${o.id}`} className="space-y-2">
                        {o.label && (
                          <h3 className="flex items-baseline gap-2 text-sm font-semibold text-ink">
                            <span className="font-mono text-2xs uppercase tracking-wider text-muted">{n}</span>
                            <span className={done ? 'text-muted line-through' : ''}>{o.label}</span>
                          </h3>
                        )}
                        <div className="space-y-3">{o.own.map((task) => row(task, numberOf.get(task.id)))}</div>
                      </section>
                    );
                  })}
              </div>

              {/* 5. Everything else this week, behind one bar that says what it holds. */}
              {hasMore && (
                <div className="rounded-lg depth-edge bg-panel px-3">
                  <Collapsible
                    title={`More for this ${unit}`}
                    hint={hintParts.join(' · ')}
                    tone={labUnset ? 'warn' : 'neutral'}
                    open={moreIsOpen}
                    onToggle={(o) => setMoreOpen(o)}
                  >
                    <div className="space-y-5 py-1 pr-2">
                      {/* Setup is "do once", not a week. In class the lab already exists. */}
                      {setupTasks.length > 0 && (
                        <section id="setup-strip" className="scroll-under-chrome space-y-3">
                          <h3 className="text-sm font-semibold text-ink">
                            Do once — {setupWeeks.map((w) => w.title).join(' · ')}
                            <span className="ml-2 font-normal text-muted">{setupPct}%</span>
                          </h3>
                          {/* SOC-course banner only: it names the shared Wazuh SOC
                              and its login, which is meaningless on a course whose
                              setup is required prep rather than a home-lab build. */}
                          {!!socTopology(course.id) && (
                            <Alert variant="info" title="The classroom SOC is already set up.">
                              Sign in at <span className="font-mono text-xs">{SOC_URL}</span> ({SOC_LOGIN_LABEL}) and start
                              at <span className="font-semibold">Week 1</span>. The build steps here are only for students
                              setting up their own lab at home — opening them asks you to confirm first.
                            </Alert>
                          )}
                          {setupTasks.map((task) => row(task))}
                        </section>
                      )}

                      {labFields.length > 0 && <LabAccessPanel courseId={course.id} bare />}

                      {/* The rest of the team's work this week, read-only. A hand-off
                          cannot be checked against a title, so this is for every
                          course that has other roles — never gated on sharedTrack. */}
                      {otherWeekTasks.length > 0 && (
                        <section id="other-focuses" className="scroll-under-chrome space-y-4">
                          <h3 className="text-sm font-semibold text-ink">
                            {course.sharedTrack ? `What the other focuses document this ${unit}` : `Other roles this ${unit}`}
                          </h3>
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
                        </section>
                      )}
                    </div>
                  </Collapsible>
                </div>
              )}
            </>
          )}
        </div>
      </motion.section>
    </>
  );
}
