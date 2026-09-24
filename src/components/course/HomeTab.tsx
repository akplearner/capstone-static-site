'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RotateCcw, Sparkles } from 'lucide-react';
import type { Course, Member, RoleDef, Task, WeekDef } from '@/lib/types';
import type { Cohort } from '@/lib/data';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { Alert } from '@/components/ui/Alert';
import { Surface } from '@/components/ui/Surface';
import { toast } from '@/components/ui/Toast';
import { MineScene } from '@/components/quarry/art/MineScene';
import { stoneStage } from '@/lib/quarry';
import { weekRarity } from '@/lib/rarity';
import { PackStrip } from '@/components/quarry/art/PackStrip';
import { pebbleStage } from '@/components/quarry/art/parts';
import { tintFor, tintVars } from '@/components/quarry/art/palette';
import { useRarity } from './useRarity';
import { EngagementStatus } from '@/components/team/EngagementStatus';
import { EngagementBanner } from '@/components/team/EngagementBanner';
import { RoleIcon } from '@/components/team/RoleIcon';
import { TeamBlock } from '@/components/team/TeamBlock';
import { ImportPrompt } from '@/components/auth/ImportPrompt';
import { JoinPanel } from './JoinPanel';
import { progressRepo, evidenceRepo, stepNotesRepo, docsRepo } from '@/lib/data';
import { notifyStore } from '@/lib/useClientStore';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getTasksByRole, getWeekTasks, isEngagement, isGradedWeek, objectivesFor, phaseTag } from '@/lib/course-helpers';
import { clearResume } from '@/lib/resume';
import { phaseForWeek } from '@/lib/quarry';
import { isDeliverableFiled } from '@/lib/deliverableChain';
import { deliverablesForCourse } from '@/lib/docs/definitions';
import { buildIcs, dueLabel, weekDue } from '@/lib/calendar';
import { downloadText } from '@/lib/download';
import type { CrewProgress } from '@/lib/game';

/**
 * The course Home: where you are, the stone, your role and your team, and what
 * the other focuses are documenting. Four surfaces. Everything that DESCRIBES
 * the course lives once, on the Guide; this is the page a student comes back to.
 *
 * R78-C1: lifted out of `page.tsx`. The page keeps the state the two tabs
 * share; this owns the reset dialog, because only Home renders it.
 */
export function HomeTab({
  course,
  member,
  userId,
  requireAuth,
  onJoined,
  ownRole,
  activeWeek,
  sortedWeeks,
  weekStats,
  taskStats,
  gateStats,
  crew,
  nextTask,
  cohortKey,
  cohortCal,
  unit,
  onContinue,
  onReadOtherSteps,
  onReset,
}: {
  course: Course;
  member: Member | null;
  userId: string | null;
  requireAuth: boolean;
  onJoined: (m: Member) => void;
  ownRole: RoleDef | undefined;
  activeWeek: number;
  sortedWeeks: WeekDef[];
  weekStats: Record<number, number>;
  taskStats: Record<string, number>;
  gateStats: Record<number, string>;
  crew: CrewProgress;
  nextTask: Task | undefined;
  cohortKey: string | null;
  cohortCal: Cohort | null;
  unit: string;
  onContinue: () => void;
  /** Home's "Read their steps in Tasks →": opens the week and the panel. */
  onReadOtherSteps: () => void;
  /** After a reset the page forgets which tasks were open. */
  onReset: () => void;
}) {
  const joined = !!member;
  const [confirmingReset, setConfirmingReset] = useState(false);
  const rarityOf = useRarity(course, member, taskStats, cohortCal);

  // Whole-course completion. With gatekeeping, every gate must be passed. With
  // no gatekeeping, it's simply every week at 100% for your role — graded
  // weeks only, so a student who skipped preparation still sees the banner.
  const gradedForCompletion = course.weeks.filter((w) => isGradedWeek(course, w.number));
  const allWeeksComplete =
    joined && gradedForCompletion.length > 0 && gradedForCompletion.every((w) => (weekStats[w.number] ?? 0) >= 100);
  const allGatesPassed = course.noGatekeeping
    ? allWeeksComplete
    : joined && course.gates.length > 0 && course.gates.every((g) => (gateStats[g.id] || 'locked') === 'passed');
  const dueLine = cohortCal
    ? dueLabel(weekDue(cohortCal.startsOn, activeWeek), undefined, (weekStats[activeWeek] ?? 0) >= 100)
    : undefined;
  const ownTasksAll = member ? getTasksByRole(course, member.role) : [];
  const tasksComplete = ownTasksAll.filter((t) => (taskStats[t.id] ?? 0) === 100).length;
  // The pack (R80): gems by the rarity each finished task earned, and the five
  // slots of the course, each lit when it is earned.
  const gems: [number, number, number, number] = [0, 0, 0, 0];
  ownTasksAll.forEach((t) => {
    const r = rarityOf(t);
    if (r !== null) gems[r] += 1;
  });
  // The mine (R80): one stone per graded week with work for this role, in
  // order. A week finished since the last visit is played once — the pointer
  // lives on this device, like the resume pointer.
  const mineWeeks = member
    ? sortedWeeks.filter((w) => isGradedWeek(course, w.number) && getTasksByRole(course, member.role, w.number).length > 0)
    : [];
  const mineRarities = member ? mineWeeks.map((w) => weekRarity(getTasksByRole(course, member.role, w.number).map(rarityOf))) : [];
  const seenKey = member ? `cq_mine_seen_${course.id}_${member.memberId}` : '';
  const [seenWeeks] = useState(() => {
    try {
      const v = seenKey ? localStorage.getItem(seenKey) : null;
      return v === null ? crew.weeksCleared : Number(v);
    } catch {
      return crew.weeksCleared;
    }
  });
  const markPlayed = (i: number) => {
    try {
      if (seenKey) localStorage.setItem(seenKey, String(i + 1));
    } catch {
      /* private window: the next visit replays it, which is harmless */
    }
  };
  const stoneDef = stoneStage(crew.stage);
  const packSlots = [
    { kind: 'hand' as const, name: 'Pick', earn: 'join a team', earned: joined },
    { kind: 'ore' as const, name: 'Ore', earn: 'tick your first step', earned: crew.stepsDone > 0 },
    { kind: 'facet' as const, name: 'Facet', earn: 'finish a task', earned: tasksComplete > 0 },
    { kind: 'seal' as const, name: 'Seal', earn: 'finish a week', earned: crew.weeksCleared > 0 },
    { kind: 'relic' as const, name: 'Relic', earn: 'hand over the capstone', earned: crew.stage >= 5 },
  ];
  const contentWeeks = sortedWeeks.filter((w) => w.number >= 1);
  // Which objective the next task belongs to — Continue names it (R79).
  const objectiveOfNext = (() => {
    if (!member || !nextTask) return undefined;
    const objectives = objectivesFor(course, member.role, nextTask.week);
    const i = objectives.findIndex((o) => o.tasks.some((t) => t.id === nextTask.id));
    return i >= 0 ? { index: i + 1, count: objectives.length, label: objectives[i].label } : undefined;
  })();
  const otherRoles = member ? course.roles.filter((r) => r.id !== member.role) : course.roles;
  const savedDocs = member ? docsRepo.get(course.id, member.teamId) : null;
  // Shared track: what the other focuses document this week. Titles only — the
  // glance. The full deep-dives are the reference panel on Tasks.
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

  /**
   * Reset means reset: completion keys, the evidence ledger, the notes and the
   * resume pointer all go. Gate status needs no clearing — it is derived from
   * completions on every render, never stored.
   */
  const confirmReset = () => {
    if (!member) return;
    progressRepo.resetCourse(course.id, member.memberId);
    evidenceRepo.resetCourse(course.id, member.memberId);
    stepNotesRepo.resetCourse(course.id, member.memberId);
    clearResume(course.id, member.memberId);
    onReset();
    setConfirmingReset(false);
    notifyStore();
    toast({ message: 'Your progress was reset.', variant: 'success' });
  };

  return (
    <>
      {joined && member && (
        <EngagementStatus
          course={course}
          weekNumber={activeWeek}
          phase={phaseForWeek(course, activeWeek) ?? undefined}
          percent={crew.stepsTotal > 0 ? Math.round((crew.stepsDone / crew.stepsTotal) * 100) : 0}
          docsFiled={
            deliverablesForCourse(course.id).filter((d) => isDeliverableFiled(savedDocs?.[d.id])).length
          }
          docsTotal={deliverablesForCourse(course.id).length}
          nextTask={nextTask}
          objective={objectiveOfNext}
          onContinue={onContinue}
          due={dueLine}
          onCalendar={
            cohortCal && cohortKey
              ? () => downloadText(`${course.id}_${cohortKey}.ics`, buildIcs({ course, cohort: cohortKey, startsOn: cohortCal.startsOn }), 'text/calendar;charset=utf-8')
              : undefined
          }
          subtitle={isEngagement(course) ? <EngagementBanner courseId={course.id} teamId={member.teamId} phase={phaseTag(course, activeWeek)} /> : undefined}
          complete={
            allGatesPassed ? (
              <Alert variant="success">
                <div className="space-y-2">
                  <div className="font-semibold">
                    {course.noGatekeeping
                      ? 'Course complete — every week finished.'
                      : `Engagement complete — all ${course.gates.length} gates passed.`}
                  </div>
                  <p className="text-sm text-body">
                    You&apos;ve finished {tasksComplete} of {ownTasksAll.length} tasks across every week as{' '}
                    {ownRole?.name ?? member?.role}. Compile your deliverables into the final package and hand it in.
                  </p>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <Link href={`/courses/${course.id}/docs`} className="font-medium text-accent hover:underline">
                      Open Deliverables →
                    </Link>
                    <a href="#team" className="font-medium text-accent hover:underline">
                      Review team progress →
                    </a>
                  </div>
                </div>
              </Alert>
            ) : undefined
          }
        />
      )}

      {/* The stone — the one glow on the page: the artefact being cut is the
          point of the whole thing. */}
      {joined && member && (
        <Surface glow="accent" padding="lg">
          <div style={tintVars(course.id)}>
            <MineScene
              mode="progress"
              weeks={mineWeeks.length}
              done={crew.weeksCleared}
              currentPercent={weekStats[activeWeek] ?? 0}
              rarities={mineRarities}
              cut={tintFor(course.id).cut}
              label={course.title}
              playFrom={Math.min(seenWeeks, crew.weeksCleared)}
              onWeekPlayed={markPlayed}
            />
          </div>
          <p className="mt-3 text-sm text-muted">
            <span className="eyebrow mr-2">Capstone progress</span>
            <span className="font-semibold text-ink">{stoneDef.name}</span>
            {crew.stage < 5 && phaseForWeek(course, activeWeek) ? ` · next: ${phaseForWeek(course, activeWeek)}` : ''}
          </p>
          <PackStrip
            className="mt-6 border-t border-line pt-5"
            slots={packSlots}
            gems={gems}
            pebble={pebbleStage(crew.weeksCleared, crew.weeksTotal)}
            cut={tintFor(course.id).cut}
          />
        </Surface>
      )}

      {/* Your role and your team, on one surface with the role's seam. */}
      {joined && member && ownRole && (
        <Surface accent="role" seamColor={ownRole.color} className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <RoleIcon iconName={ownRole.icon} className="h-9 w-9 shrink-0" color={ownRole.color} />
              <div>
                <div className="text-lg font-semibold text-ink">You&apos;re {ownRole.name}</div>
                <div className="text-sm text-muted">
                  {phaseTag(course, activeWeek)} of {contentWeeks.length}
                </div>
              </div>
            </div>
            {!nextTask && (
              <span className="inline-flex items-center gap-2 rounded-lg bg-ok-soft px-4 py-2 text-sm font-medium text-ok">
                <Sparkles className="h-4 w-4" /> All your tasks complete!
              </span>
            )}
          </div>
          <TeamBlock course={course} member={member} />
        </Surface>
      )}


      {/* Shared track: the deep-dives the other focuses add this week. Titles
          only — a title tells you the slot is covered, but a hand-off can only
          be checked against the steps, which live on Tasks. */}
      {otherFocuses.length > 0 && (
        <Surface as="section" variant="inset" className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="text-lg font-semibold text-ink">What the other focuses document this {unit}</h2>
            <button
              type="button"
              onClick={onReadOtherSteps}
              className="text-sm font-medium text-accent hover:text-accent-strong"
            >
              Read their steps in Tasks →
            </button>
          </div>
          <ul className="grid gap-2 sm:grid-cols-3">
            {otherFocuses.map(({ role, titles }) => (
              <li key={role.id} className="rounded-lg bg-panel px-3 py-2 text-sm">
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
        </Surface>
      )}

      {/* One-time migration of this device's local progress into the account */}
      <ImportPrompt course={course} />

      {/* The join panel, mounted once: front and centre for a newcomer (the
          `join-panel` anchor the enrol gate links to), the compact "change
          team or role" summary once joined. It used to be mounted twice, in
          two mutually exclusive branches. */}
      <div id={joined ? undefined : 'join-panel'}>
        <JoinPanel course={course} member={member} userId={userId} requireAuth={requireAuth} onJoined={onJoined} />
      </div>

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
            message={
              // On the cloud backend that delete is server-side and takes the
              // record away everywhere the student signs in; say so.
              `This clears your completed steps, your evidence ledger and your hashed artifacts for this course${
                isSupabaseConfigured() ? ' from your account, on every device' : ' on this device'
              }. This cannot be undone.`
            }
            confirmLabel="Reset progress"
          />
        </div>
      )}
    </>
  );
}
