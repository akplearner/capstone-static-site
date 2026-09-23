'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { CourseSubNav } from '@/components/CourseSubNav';
import { Crumbs } from '@/components/SiteNav';
import { StepTally, PixelBadge } from '@/components/ui/Pixel';
import { CoursePageSkeleton } from '@/components/ui/Skeletons';
import { HomeTab } from '@/components/course/HomeTab';
import { TasksTab } from '@/components/course/TasksTab';
import { useCourseProgress } from '@/components/course/useCourseProgress';
import { focusById } from '@/lib/focus';
import { useCourse } from '@/lib/useCourse';
import { useMember } from '@/lib/useMember';
import { useAuth } from '@/lib/useAuth';
import { useInstructorAuth } from '@/lib/useInstructorAuth';
import { useSupabaseSync } from '@/lib/useSupabaseSync';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { userStateRepo, docsRepo } from '@/lib/data';
import { useClientStore, notifyStore } from '@/lib/useClientStore';
import { getRoleDef, isSetupWeek, phaseTag, unitWord } from '@/lib/course-helpers';
import { deriveCrewProgress } from '@/lib/game';
import { isCapstoneFiled } from '@/lib/deliverableChain';
import { courseIdentityLabel } from '@/lib/courseTheme';
import { SOC_LOGIN_LABEL, SOC_URL } from '@/lib/labTopology';
import { swap } from '@/lib/motion';
import { useStepDensity } from '@/lib/stepDensity';
import type { Task } from '@/lib/types';

/**
 * The course page: identity, the sub-nav, and two tabs.
 *
 * R78-C1: this was 1,822 lines with four components defined inside it. It is
 * the orchestration now — the state the two tabs share (which week, which
 * tasks are open, the deep link, the setup strip) and the handlers that move
 * it — and `HomeTab` / `TasksTab` render. `useCourseProgress` owns everything
 * derived from the progress store.
 */
export default function CoursePage() {
  const course = useCourse();
  const { member, loading, setMember } = useMember(course.id);
  const { user } = useAuth();
  const { unlocked: instructorOverride } = useInstructorAuth();
  useSupabaseSync(course.id);
  const requireAuth = isSupabaseConfigured();
  const unit = unitWord(course).toLowerCase();
  // The Week-0 build task is only for students setting up their own lab from
  // home; the classroom SOC is already built. Gate its expansion behind a
  // confirmation (persisted per device).
  const [homeBuildDialog, setHomeBuildDialog] = useState(false);
  const [pendingHomeBuild, setPendingHomeBuild] = useState<Task | null>(null);
  const homeBuildAck = useClientStore<boolean>(
    () => (member ? userStateRepo.get(course.id, member.memberId)?.homeBuildAck === true : false),
    false
  );
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  // One week at a time. null = the student hasn't picked, so the week the
  // resume pointer resolves to shows; a pick is written to `?week=` so it is
  // bookmarkable and survives Back.
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [othersOpen, setOthersOpen] = useState(false);
  // The "do once" setup strip. null = follow the resume pointer.
  const [setupOpen, setSetupOpen] = useState<boolean | null>(null);
  const [tab, setTabState] = useState<'home' | 'tasks'>('home');
  // The step a deep link named (`?step=`), handed to the runner.
  const [deepStep, setDeepStep] = useState<{ taskId: string; stepId?: string } | null>(null);
  // Something to scroll to once the week and the task have rendered.
  const pendingScroll = useRef<string | null>(null);

  // Honor `?tab=tasks` (and the older `?tab=weeks`), `?week=N`, `?task=<id>`
  // and `?step=<id>` — the palette's and the ledger's deep links. Read on
  // mount and on every popstate. In an effect, not a lazy initializer, so
  // server and client first render match.
  useEffect(() => {
    const readDeepLink = () => {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('tab');
      const w = params.get('week');
      const taskId = params.get('task');
      const stepId = params.get('step');
      if (t === 'tasks' || t === 'weeks') setTabState('tasks');
      if (w !== null && Number.isFinite(Number(w))) setSelectedWeek(Number(w));
      if (taskId) {
        setTabState('tasks');
        setExpanded((prev) => new Set(prev).add(taskId));
        setDeepStep({ taskId, stepId: stepId ?? undefined });
        pendingScroll.current = stepId ? `step-${stepId}` : `task-${taskId}`;
      }
      // Write the current spelling back, so a copied URL carries `tasks`.
      if (t === 'weeks') {
        params.set('tab', 'tasks');
        window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}${window.location.hash}`);
      }
    };
    readDeepLink();
    window.addEventListener('popstate', readDeepLink);
    return () => window.removeEventListener('popstate', readDeepLink);
  }, []);
  // Scroll to a deep-linked task or step only once it exists in the DOM. The
  // Tasks panel arrives behind an AnimatePresence exit, so retry briefly.
  useEffect(() => {
    if (!pendingScroll.current) return;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const attempt = () => {
      const id = pendingScroll.current;
      if (!id) return;
      const el = document.getElementById(id);
      if (el) {
        pendingScroll.current = null;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        focusById(id);
        return;
      }
      if (tries++ < 16) timer = setTimeout(attempt, 120);
    };
    attempt();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [expanded, selectedWeek, tab, deepStep]);

  // Progress writes broadcast through the store; the hook re-reads.
  const onProgressChange = useCallback(() => notifyStore(), []);
  const progress = useCourseProgress(course, member);
  const { weekStats, taskStats, gateStats, activeWeek, resume, sortedWeeks, nextTask } = progress;

  // Open the task the student stopped in, exactly once, after progress has
  // been read on the client. The ref makes it one-shot so it never fights a
  // manual collapse later in the session. Above the early return: hook order.
  const resumeApplied = useRef(false);
  useEffect(() => {
    if (resumeApplied.current || !resume) return;
    resumeApplied.current = true;
    const taskId = resume.taskId;
    setExpanded((prev) => new Set(prev).add(taskId));
    // Scroll only when the week on screen is the pointer's week — a `?week=`
    // deep link deliberately wins over the pointer.
    const params = new URLSearchParams(window.location.search);
    const onTasks = params.get('tab') === 'tasks' || params.get('tab') === 'weeks';
    const weekParam = params.get('week');
    if (onTasks && (weekParam === null || Number(weekParam) === resume.week)) {
      setTimeout(() => document.getElementById(`task-${taskId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
    }
  }, [resume]);

  // `/team/<id>` forwards to `#team` here; the block renders only once the
  // member has loaded, so the browser's own hash jump has nothing to land on.
  useEffect(() => {
    if (!member || window.location.hash !== '#team') return;
    setTimeout(() => document.getElementById('team')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }, [member]);

  // How much of a step this student reads (Server+ starts on key points).
  const density = useStepDensity(course, member?.memberId);
  if (loading) return <CoursePageSkeleton />;

  const joined = !!member;
  const ownRole = member ? getRoleDef(course, member.role) : undefined;
  const effectiveWeek = selectedWeek ?? activeWeek;

  // Gate sequencing: a week stays locked until the previous week's gate is
  // passed. Instructors (or the local dev passcode) bypass it.
  const priorGateForWeek = (weekNum: number) => course.gates.find((g) => g.week === weekNum - 1);
  const weekLocked = (weekNum: number): boolean => {
    if (!joined || instructorOverride || course.noGatekeeping) return false;
    const pg = priorGateForWeek(weekNum);
    return !!pg && (gateStats[pg.id] || 'locked') !== 'passed';
  };

  // Crew progress: the Capstone Stone's stage plus professional milestones,
  // derived from the percentages above — no points, no stored score.
  const savedDocs = member ? docsRepo.get(course.id, member.teamId) : null;
  const crew = deriveCrewProgress(course, member?.role ?? '', weekStats, taskStats, isCapstoneFiled(course.id, savedDocs));

  const scrollTo = (elementId: string, block: ScrollLogicalPosition = 'start') => {
    setTimeout(() => document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth', block }), 60);
  };

  /** Switch tab without an RSC round-trip, keeping the URL honest. */
  const selectTab = (t: 'home' | 'tasks') => {
    setTabState(t);
    const params = new URLSearchParams(window.location.search);
    if (t === 'tasks') params.set('tab', 'tasks');
    else {
      params.delete('tab');
      params.delete('week');
    }
    params.delete('task');
    params.delete('step');
    const qs = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`);
    // Tell the keyboard and the screen reader where the new content starts.
    setTimeout(() => focusById(t === 'tasks' ? 'tasks-head' : 'home-head'), 0);
  };

  /** Show one week on the Tasks tab. Setup is not a week on the rail — it is
   *  the "do once" strip above it, so picking it opens the strip instead. */
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
    params.delete('task');
    params.delete('step');
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
    setTimeout(() => focusById('tasks-head'), 0);
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

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

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

  const goHomeTop = () => {
    selectTab('home');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 60);
  };

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Identity — title, credential, one sentence. Renders on every tab, so
          it is deliberately short: the Guide carries the description in full. */}
      <div className="space-y-2">
        <Crumbs items={[{ label: 'Home', href: '/' }, { label: course.title }]} />
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">{course.title}</h1>
          {courseIdentityLabel(course) && (
            <PixelBadge tone="accent">{courseIdentityLabel(course)}</PixelBadge>
          )}
        </div>
        <p className="line-clamp-2 text-base text-muted sm:line-clamp-none sm:text-lg">
          {course.description}
        </p>
      </div>

      <CourseSubNav
        courseId={course.id}
        active={tab}
        teamId={joined && member ? member.teamId : null}
        onSelectTab={selectTab}
        trailing={
          joined && member ? (
            <>
              <StepTally done={crew.stepsDone} total={crew.stepsTotal} className="hidden md:flex" />
              <span className="hidden text-sm text-muted sm:inline">{phaseTag(course, activeWeek)}</span>
              {nextTask ? (
                <Button onClick={() => nextTask && goToTask(nextTask)} size="sm" className="flex items-center gap-1.5">
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <button
                  type="button"
                  onClick={goHomeTop}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-ok-soft px-3 py-1.5 text-sm font-medium text-ok hover:opacity-80"
                >
                  <Sparkles className="h-4 w-4" /> All done — review
                </button>
              )}
            </>
          ) : undefined
        }
      />

      {/* `mode="wait"`: the outgoing panel is given 120ms to leave before the
          new one arrives, so the switch reads as one movement. */}
      <AnimatePresence mode="wait" initial={false}>
        {tab === 'home' && (
          <motion.div key="tab-home" className="space-y-6" variants={swap} initial="enter" animate="center" exit="exit">
            <HomeTab
              course={course}
              member={member}
              userId={user?.id ?? null}
              requireAuth={requireAuth}
              onJoined={(m) => setMember(m)}
              ownRole={ownRole}
              activeWeek={activeWeek}
              sortedWeeks={sortedWeeks}
              weekStats={weekStats}
              taskStats={taskStats}
              gateStats={gateStats}
              crew={crew}
              nextTask={nextTask}
              cohortKey={progress.cohortKey}
              cohortCal={progress.cohortCal}
              unit={unit}
              onContinue={() => nextTask && goToTask(nextTask)}
              onReadOtherSteps={() => {
                pickWeek(activeWeek);
                setOthersOpen(true);
                scrollTo('other-focuses');
              }}
              onReset={() => setExpanded(new Set())}
            />
          </motion.div>
        )}

        {tab === 'tasks' && (
          <motion.div key="tab-tasks" className="space-y-4" variants={swap} initial="enter" animate="center" exit="exit">
            <TasksTab
              course={course}
              member={member}
              ownRole={ownRole}
              unit={unit}
              weekStats={weekStats}
              taskStats={taskStats}
              gateStats={gateStats}
              activeWeek={activeWeek}
              effectiveWeek={effectiveWeek}
              sortedWeeks={sortedWeeks}
              nextTask={nextTask}
              nextIncompleteAfter={progress.nextIncompleteAfter}
              stuckByTask={progress.stuckByTask}
              cohortCal={progress.cohortCal}
              expanded={expanded}
              setExpanded={setExpanded}
              toggleTask={toggleTask}
              setupOpen={setupOpen}
              setSetupOpen={setSetupOpen}
              othersOpen={othersOpen}
              setOthersOpen={setOthersOpen}
              deepStep={deepStep}
              density={density}
              weekLocked={weekLocked}
              priorGateForWeek={priorGateForWeek}
              pickWeek={pickWeek}
              openAndScrollWeek={openAndScrollWeek}
              goToTask={goToTask}
              selectTab={selectTab}
              onProgressChange={onProgressChange}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Home-build gate for the Week-0 build task — mounted regardless of tab. */}
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
