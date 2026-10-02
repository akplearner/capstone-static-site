'use client';

import type { Dispatch, SetStateAction } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import type { Course, Member, RoleDef, Task, WeekDef } from '@/lib/types';
import type { Cohort } from '@/lib/data';
import { Collapsible } from '@/components/ui/Button';
import { CourseEnrolGate } from '@/components/CourseEnrolGate';
import { GuidedTaskRunner } from '@/components/task/GuidedTaskRunner';
import { FlowDiagram, type FlowNode } from '@/components/diagrams/FlowDiagram';
import { WeekRail } from '@/components/week/WeekRail';
import { WeekHeader } from '@/components/week/WeekHeader';
import { TaskRow } from './TaskRow';
import { useRarity } from './useRarity';
import { TaskStone, WeekGemTray } from '@/components/quarry/art/TaskStone';
import type { TeammateTaskProgress, TeamStepsByTask } from './useCourseProgress';
import { ReportIssueDialog } from '@/components/task/ReportIssueDialog';
import { tintFor } from '@/components/quarry/art/palette';
import { weekRarity } from '@/lib/rarity';
import { TaskAboutPanel } from './TaskAboutPanel';
import { WeekVisualPanel } from './WeekVisualPanel';
import { TasksLayout, useSplitView } from './TasksLayout';
import { TaskPane } from './TaskPane';
import { WeekLockedNotice } from './WeekLockedNotice';
import { WeekMoreBody } from './WeekMoreBody';
import { formatMinutes, getTasksByRole, isAdvancedWeek, isSetupWeek, phaseTag, weekSummary, weekTasksOrdered } from '@/lib/course-helpers';
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
 *      (`WeekDef.objectives`), each carrying its tasks, its role and its time,
 *      with the milestone as the caption under the last;
 *   4. the list — the tasks GROUPED under their objective, one line each;
 *   5. ONE disclosure, "More for this week" — setup and lab access — whose
 *      closed bar says whether anything inside needs you.
 *
 * R98: every task of the week is open to every member. The instructor's rule:
 * a role says who a task is FOR, never who may do it — if the Infrastructure
 * Admin is away, the Security Admin creates the resource group, and the week
 * is done for the team when the work is done. So every objective is clickable,
 * every task is a row with the runner, each row carries its role (or "Yours"),
 * and the percentages here are the TEAM's. The personal record — the stone's
 * rarity, the gem tray — stays the member's own.
 *
 * R100: two columns when the window is wide enough (`TasksLayout`). The list
 * — rail to disclosure — is the left column and scrolls on its own; the open
 * task is the right pane, one at a time, and a row is a selector rather than
 * an accordion. The week picture is a thumbnail in the list, and the full
 * picture is what the pane shows until a task is picked. Focus mode (the
 * sub-nav switch) hides everything but the rows and the open task.
 */
export function TasksTab({
  course,
  member,
  ownRole,
  unit,
  taskStats,
  teamWeekStats,
  teamTaskStats,
  teamSteps,
  activeWeek,
  effectiveWeek,
  sortedWeeks,
  nextTask,
  nextIncompleteAfter,
  stuckByTask,
  teamTaskProgress,
  openReportsByTask,
  cohortCal,
  expanded,
  setExpanded,
  toggleTask,
  selectTask,
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
  focusMode = false,
}: {
  course: Course;
  member: Member | null;
  ownRole: RoleDef | undefined;
  unit: string;
  /** The member's own record — the stone and the gem tray read these. The
   *  week figure is accepted for the page's sake; nothing on this tab is personal at week level any more. */
  weekStats?: Record<number, number>;
  taskStats: Record<string, number>;
  /** The team's progress (R98) — the rail, the header, the cards and the rows read these. */
  teamWeekStats: Record<number, number>;
  teamTaskStats: Record<string, number>;
  teamSteps: TeamStepsByTask;
  activeWeek: number;
  /** The student's pick (or a `?week=` deep link), else the resume pointer. */
  effectiveWeek: number;
  sortedWeeks: WeekDef[];
  nextTask: Task | undefined;
  nextIncompleteAfter: (taskId: string) => Task | undefined;
  stuckByTask: Record<string, number>;
  teamTaskProgress: Record<string, TeammateTaskProgress[]>;
  openReportsByTask: Record<string, number>;
  cohortCal: Cohort | null;
  expanded: Set<string>;
  setExpanded: Dispatch<SetStateAction<Set<string>>>;
  /** Stacked: open or close a row under itself. */
  toggleTask: (task: Task) => void;
  /** Split (R100): make this the one open task, in the pane. */
  selectTask: (task: Task) => void;
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
  /** R100: just the rows and the open task. */
  focusMode?: boolean;
}) {
  // Hooks above the early return: the lab-access hint on the disclosure bar.
  const lab = useLabAccess(course.id);
  const rarityOf = useRarity(course, member, taskStats, cohortCal);
  const split = useSplitView();
  const cut = tintFor(course.id).cut;
  const joined = !!member;
  if (!joined || !member || !ownRole) {
    // Not enrolled: the tasks ARE the course material, so this is where the
    // page stops. The dashboard still sells the course; this is the line.
    return <CourseEnrolGate courseId={course.id} what="the tasks" />;
  }

  // Setup weeks are the "do once" strip inside the disclosure; the rail holds
  // only graded weeks.
  const gradedWeeks = sortedWeeks.filter((w) => !isSetupWeek(course, w.number));
  const setupWeeks = sortedWeeks.filter((w) => isSetupWeek(course, w.number));
  const setupTasks = setupWeeks.flatMap((w) => weekTasksOrdered(course, member.role, w.number));
  const setupPct = setupWeeks.length
    ? Math.round(setupWeeks.reduce((sum, w) => sum + (teamWeekStats[w.number] ?? 0), 0) / setupWeeks.length)
    : 0;
  // A pointer (or deep link) into Setup shows a graded week on the rail and
  // opens the disclosure that holds Setup.
  const viewWeek = gradedWeeks.some((w) => w.number === effectiveWeek)
    ? effectiveWeek
    : (gradedWeeks[0]?.number ?? 1);
  // One flat list, every task of the week: the shared build first, then the
  // task that is yours, then your teammates' — open to you too.
  const ordered = weekTasksOrdered(course, member.role, viewWeek);
  const viewPct = teamWeekStats[viewWeek] ?? 0;
  const viewLocked = weekLocked(viewWeek);
  const lockGate = priorGateForWeek(viewWeek);
  const summary = weekSummary(course, member.role, viewWeek);
  const roleOf = (id: string) => course.roles.find((r) => r.id === id);
  const roleName = (id: string) => roleOf(id)?.name ?? id;

  // R100: in the split view ONE task is open, in the pane — the one the
  // student opened last, as long as it belongs to the week on screen.
  const weekTasks = [...ordered, ...setupTasks];
  const paneTask = split ? [...expanded].reverse().map((id) => weekTasks.find((t) => t.id === id)).find(Boolean) : undefined;

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
  ].filter(Boolean);
  const hasMore = hintParts.length > 0;

  // The week as objectives: one node each, in the order they are done, every
  // one of them open — the card names whose part of the week it is. A course
  // that authors none (an instructor's own) falls back to one group of every task.
  const groups = summary.objectives.length
    ? summary.objectives
    : [{ id: 'all', label: '', tasks: ordered, own: ordered, roles: [], minutes: summary.minutes }];
  const objectiveStatus = (tasks: Task[]): FlowNode['status'] => {
    if (tasks.length > 0 && tasks.every((t) => (teamTaskStats[t.id] ?? 0) >= 100)) return 'done';
    if (tasks.some((t) => t.id === nextTask?.id || expanded.has(t.id))) return 'current';
    return 'upcoming';
  };
  const weekNodes: FlowNode[] = groups.map((o, i) => {
    const count = `${o.tasks.length} task${o.tasks.length === 1 ? '' : 's'}`;
    const time = o.minutes != null ? `${count} · ~${formatMinutes(o.minutes)}` : count;
    // Whose objective: one role's, yours, or the whole team's.
    const whose = o.roles.length === 1 ? (o.roles[0] === member.role ? `Yours · ${roleName(o.roles[0])}` : roleName(o.roles[0])) : o.roles.length > 1 ? o.roles.map(roleName).join(' · ') : '';
    return {
      id: o.id,
      label: `${i + 1}`,
      sublabel: o.label || `This ${unit}`,
      meta: whose ? `${whose} · ${time}` : time,
      status: objectiveStatus(o.tasks),
    };
  });
  // Continuous numbering across the groups, in the order the list shows them:
  // a deep link or a teammate's "task 3" means the same row for everyone,
  // whichever role is looking.
  const numberOf = new Map(groups.flatMap((o) => o.tasks).map((t, i) => [t.id, i + 1]));
  // R98: the rule, said once — in the objectives' "how to read" (R100).
  const roleRule =
    course.roles.length > 1 && ordered.some((t) => !t.shared)
      ? ' One task per role. Everyone can open and do any of them — if a teammate is away, take theirs and say so in the document. Yours is marked "Yours".'
      : '';

  // Whose task a row is, and who finished it when that was not the viewer.
  const ownerOf = (task: Task) => {
    if (task.shared) return undefined;
    const r = roleOf(task.role);
    return r ? { name: r.name, icon: r.icon, color: r.color, isYou: task.role === member.role } : undefined;
  };
  const doneByOf = (task: Task) =>
    (taskStats[task.id] ?? 0) >= 100
      ? []
      : (teamTaskProgress[task.id] ?? []).filter((p) => p.pct >= 100 && p.memberId !== member.memberId).map((p) => p.displayName || 'a teammate');

  // Expanded content for a task row: the runner, for every task — the line
  // above it says whose the task is, so a teammate's is taken knowingly.
  const renderTaskBody = (task: Task) => {
    const following = nextIncompleteAfter(task.id);
    const owner = ownerOf(task);
    const holder = owner && !owner.isYou ? (teamTaskProgress[task.id] ?? []).find((p) => p.role === task.role)?.displayName : undefined;
    return (
      <>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          {owner ? (
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>
                This task is for: <span className="font-semibold text-ink">{owner.name}</span>
                {owner.isYou ? ' (that’s you).' : `${holder ? ` (${holder})` : ''} — anyone on the team can do it; say who did in the document.`}
              </span>
            </p>
          ) : (
            <span />
          )}
          <ReportIssueDialog courseId={course.id} task={task} member={member} />
        </div>
        <GuidedTaskRunner
          task={task}
          courseId={course.id}
          memberId={member.memberId}
          teamSteps={teamSteps[task.id]}
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
      </>
    );
  };

  const row = (task: Task, i?: number) => (
    <TaskRow
      key={task.id}
      number={i}
      course={course}
      task={task}
      joined={joined}
      mode={split ? 'select' : 'accordion'}
      open={split ? paneTask?.id === task.id : expanded.has(task.id)}
      isNext={task.id === nextTask?.id}
      stuckCount={stuckByTask[task.id]}
      teammates={teamTaskProgress[task.id]}
      reportCount={openReportsByTask[task.id]}
      owner={ownerOf(task)}
      doneBy={doneByOf(task)}
      percent={teamTaskStats[task.id] ?? 0}
      onToggle={() => (split ? selectTask(task) : toggleTask(task))}
      lead={<TaskStone percent={taskStats[task.id] ?? 0} rarity={rarityOf(task)} cut={cut} size={36} />}
      renderBody={() => renderTaskBody(task)}
    />
  );

  // 4. The list, grouped under the objectives — every task of the week. An
  //    objective that IS its one task is named once, on the row (R100).
  const list = (
    <div className="space-y-3">
      {groups
        .map((o, i) => ({ o, n: i + 1 }))
        .filter(({ o }) => o.tasks.length > 0)
        .map(({ o, n }) => {
          const done = o.tasks.every((t) => (teamTaskStats[t.id] ?? 0) >= 100);
          const heading = !!o.label && !(o.tasks.length === 1 && o.tasks[0].title === o.label);
          return (
            <section key={o.id} id={`objective-${o.id}`} className="space-y-1.5">
              {heading && (
                <h3 className="flex items-baseline gap-2 text-xs font-semibold text-ink">
                  <span className="font-mono text-2xs uppercase tracking-wider text-muted">{n}</span>
                  <span className={done ? 'text-muted line-through' : ''}>{o.label}</span>
                </h3>
              )}
              <div className="space-y-1.5">{o.tasks.map((task) => row(task, numberOf.get(task.id)))}</div>
            </section>
          );
        })}
    </div>
  );

  const tray = (
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
  );

  // The left column (or the whole tab, stacked): rail to disclosure.
  const column = (
    <div className="space-y-4">
      {/* 2. What this week is for. In focus mode the heading stays for the
            keyboard and the screen reader, invisibly. */}
      {focusMode ? (
        <h2 id="tasks-head" tabIndex={-1} className="sr-only">
          {phaseTag(course, viewWeek)}
        </h2>
      ) : (
        <WeekHeader id="tasks-head" course={course} role={member.role} week={viewWeek} percent={viewPct} unit={unit} />
      )}

      {/* The gems earned so far: one slot per week, filled in the rarity of
          its weakest task (R80). The same weeks as the rail, as trophies —
          the member's own record, from their own ticks. In the split column
          (R100) they sit under the list, so the first row is nearer the top. */}
      {!focusMode && !split && tray}

      {/* R99: the build as it stands at the end of this week, this week's
          additions glowing, the week's process drawn over it — shown even
          behind a gate, because it is what the locked week is about. In the
          split view it is a thumbnail here only while the pane holds a task;
          otherwise the pane draws it at full size. */}
      {!focusMode && (!split || paneTask) && <WeekVisualPanel course={course} week={viewWeek} />}

      {viewLocked ? (
        <WeekLockedNotice course={course} unit={unit} week={viewWeek} gate={lockGate} onGo={openAndScrollWeek} />
      ) : (
        <>
          {/* 3. The workflow: the objectives, left to right, with the
                milestone under them. A click opens the objective's first
                task that is not done. */}
          {!focusMode && ordered.length > 0 && (
            <FlowDiagram
              title={`This ${unit}'s objectives`}
              nodes={weekNodes}
              onSelect={(id) => {
                const o = groups.find((g) => g.id === id);
                const t = o?.tasks.find((x) => (teamTaskStats[x.id] ?? 0) < 100) ?? o?.tasks[0];
                if (t) goToTask(t);
              }}
              caption={summary.milestone ? `Done when: ${summary.milestone}` : undefined}
              layout={split ? 'grid' : 'row'}
              ariaLabel={`Objectives this ${unit}`}
              howToRead={`Left to right is the order to do them. Click an objective to open its next task; a tick means every task in it is done — by anyone on the team.${roleRule}`}
            />
          )}

          {ordered.length === 0 && <p className="text-sm text-muted">No tasks for this {unit} yet.</p>}

          {focusMode && expanded.size === 0 && (
            <p className="text-xs text-muted" data-focus-hint>
              Focus mode — pick a task. The week’s picture and objectives are hidden; switch Focus off in the bar to see them.
            </p>
          )}

          {list}

          {!focusMode && split && tray}

          {/* 5. Everything else this week, behind one bar that says what it holds. */}
          {!focusMode && hasMore && (
            <div className="rounded-lg depth-edge bg-panel px-3">
              <Collapsible
                title={`More for this ${unit}`}
                hint={hintParts.join(' · ')}
                tone={labUnset ? 'warn' : 'neutral'}
                open={moreIsOpen}
                onToggle={(o) => setMoreOpen(o)}
              >
                <WeekMoreBody course={course} setupWeeks={setupWeeks} setupTasks={setupTasks} setupPct={setupPct} labAccess={labFields.length > 0} row={row} />
              </Collapsible>
            </div>
          )}
        </>
      )}
    </div>
  );

  // The right pane (split only): the open task, else the week at full size.
  const pane = !split ? undefined : paneTask ? (
    <TaskPane key={paneTask.id} task={paneTask} number={numberOf.get(paneTask.id)} onClose={() => setExpanded(new Set())}>
      {renderTaskBody(paneTask)}
    </TaskPane>
  ) : focusMode ? (
    <div className="rounded-lg depth-edge bg-panel-2 p-6 text-sm text-muted" data-focus-hint>
      Focus mode — pick a task from the list.
    </div>
  ) : (
    <WeekVisualPanel course={course} week={viewWeek} fill />
  );

  return (
    <>
      {/* 1. Which week. The same component the Deliverables page uses: a tick
            when the week is done (for the team), a lock while its gate is shut,
            a slow pulse on the week you are actually on. */}
      {!focusMode && (
        <WeekRail
          id="week-rail"
          dots
          selected={viewWeek}
          onSelect={pickWeek}
          items={gradedWeeks.map((w) => ({
            week: w.number,
            label: phaseTag(course, w.number),
            done: (teamWeekStats[w.number] ?? 0) >= 100,
            locked: weekLocked(w.number),
            pulse: w.number === activeWeek && (teamWeekStats[w.number] ?? 0) < 100,
            advanced: isAdvancedWeek(course, w.number),
            hint: cohortCal ? dueLabel(weekDue(cohortCal.startsOn, w.number), undefined, (teamWeekStats[w.number] ?? 0) >= 100).text : undefined,
            minutes: weekSummary(course, member.role, w.number).minutes,
          }))}
        />
      )}

      {/* `data-week` is one attribute, and every stratum edge inside takes this
          phase's colour from it. See the "Phase colour" block in globals.css.
          No `overflow-hidden` here (R100): the split view's sticky list column
          needs a scrolling ancestor that is the window. */}
      <motion.section
        key={`week-${viewWeek}`}
        id={`week-${viewWeek}`}
        className="stratum-week scroll-under-chrome"
        data-week={viewWeek}
        data-open="true"
        data-focus={focusMode ? 'true' : undefined}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: DUR.swap, ease: EASE.out }}
      >
        <div className="p-4 sm:p-5">
          <TasksLayout split={split} list={column} pane={pane} />
        </div>
      </motion.section>
    </>
  );
}
