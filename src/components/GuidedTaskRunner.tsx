'use client';

import { type ReactNode, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ListChecks,
  Rows3,
  RotateCcw,
} from 'lucide-react';
import { Button, Collapsible } from './ui/Button';
import { ChecklistItem, StepDetail } from './TaskComponents';
import { GuidedStepper, StepperItem } from './GuidedStepper';
import { CutMark, CutBeat } from './quarry/CutBeat';
import { TerminalBasics } from './docs/CommandTroubleshooting';
import { Task } from '@/lib/types';
import { getRequiredStepCount, getRequiredSteps } from '@/lib/course-helpers';
import { recordResume } from '@/lib/resume';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { progressRepo, evidenceRepo } from '@/lib/data';
import { selfAttested } from '@/lib/evidenceLedger';

/** Clock read hoisted to module scope: the purity lint treats a `Date.now()`
 *  inside a component-body function as render work, even when it only runs from
 *  an event handler. */
function nowMs(): number {
  return Date.now();
}

interface GuidedTaskRunnerProps {
  task: Task;
  courseId: string;
  memberId: string;
  /** Called whenever completion changes so parents can refresh progress/gates. */
  onProgressChange?: () => void;
  /** Called from the prominent advance button once the task is complete. */
  onNext?: () => void;
  /** Label for the advance button, e.g. "Next task →" or "Review & finish →". */
  nextLabel?: string;
  /** The task's non-step material — done-when list, prerequisites/outputs,
   *  tools & learning — rendered inside the "About this task" disclosure. */
  about?: ReactNode;
}

export function GuidedTaskRunner({ task, courseId, memberId, onProgressChange, onNext, nextLabel, about }: GuidedTaskRunnerProps) {
  const [completed, setCompleted] = useState<Set<string>>(
    () => new Set(progressRepo.getCompletedStepIds(courseId, memberId, task))
  );
  // Bumped each time a step is newly ticked, to fire the one-shot cut beat.
  const [beat, setBeat] = useState(0);
  const { guard } = useRequireAuth();
  // The two no-gatekeeping courses default to Guided: one step at a time is
  // the smallest possible reading surface, which is what their students asked
  // for. The "Show all" toggle sits right on the count row for anyone who
  // prefers the full checklist. Gated courses keep the show-all default.
  const [mode, setMode] = useState<'guided' | 'all'>(
    courseId === 'cysa-plus' || courseId === 'server-plus' ? 'guided' : 'all'
  );
  const [currentIdx, setCurrentIdx] = useState(() => {
    const done = new Set(progressRepo.getCompletedStepIds(courseId, memberId, task));
    const firstIncomplete = task.steps.findIndex((s) => !done.has(s.id));
    return firstIncomplete === -1 ? 0 : firstIncomplete;
  });

  const total = task.steps.length;
  const completedCount = completed.size;
  const allDone = total > 0 && completedCount === total;
  // Required-only progress drives the "task complete" state so it matches the
  // dashboard %/gates (optional steps are tracked but never block completion).
  const requiredTotal = getRequiredStepCount(task);
  const optionalTotal = total - requiredTotal;
  const requiredIds = useMemo(() => new Set(getRequiredSteps(task).map((s) => s.id)), [task]);
  const requiredDone = useMemo(
    () => [...completed].filter((id) => requiredIds.has(id)).length,
    [completed, requiredIds]
  );
  const allRequiredDone = requiredTotal > 0 && requiredDone === requiredTotal;

  const setStep = (stepId: string, done: boolean) => {
    // Ticking a step is a write. In cloud mode it must belong to an account, or
    // it is lost on the next device and never reaches the team page.
    if (!guard('save your progress', () => applyStep(stepId, done))) return;
  };

  const applyStep = (stepId: string, done: boolean) => {
    if (done) {
      progressRepo.setCompletion({
        courseId,
        taskId: task.id,
        memberId,
        stepId,
        completedAt: nowMs(),
      });
      // Remember this as the place to reopen on the next visit. Only ticking
      // moves the pointer — un-ticking an old step shouldn't drag the student
      // backwards through the course.
      recordResume(courseId, memberId, { week: task.week, taskId: task.id, stepId });
      // Record HOW this step was finished. A verify-gated step ticked without
      // matching output is self-attested, and the dashboard says so — that
      // distinction is the whole point of the ledger. `selfAttested` never
      // downgrades an existing verified record, so proving it and then re-ticking
      // the box keeps the proof.
      const step = task.steps.find((s) => s.id === stepId);
      const prior = evidenceRepo.getSteps(courseId, memberId)[`${task.id}::${stepId}`];
      evidenceRepo.saveStep(
        memberId,
        selfAttested(prior, {
          courseId,
          taskId: task.id,
          stepId,
          totalTokens: step?.verify?.length ?? 0,
          at: nowMs(),
        })
      );
    } else {
      progressRepo.removeCompletion(courseId, memberId, task.id, stepId);
    }
    setCompleted((prev) => {
      const next = new Set(prev);
      if (done) next.add(stepId);
      else next.delete(stepId);
      return next;
    });
    // Only a fresh tick earns a strike — re-confirming an already-done step, or
    // un-ticking one, shouldn't fire the beat.
    if (done && !completed.has(stepId)) setBeat((b) => b + 1);
    onProgressChange?.();
  };

  const completeAndNext = () => {
    const step = task.steps[currentIdx];
    if (step) setStep(step.id, true);
    const nextIncomplete = task.steps.findIndex(
      (s, i) => i > currentIdx && !completed.has(s.id) && s.id !== step?.id
    );
    if (nextIncomplete !== -1) setCurrentIdx(nextIncomplete);
    else if (currentIdx < total - 1) setCurrentIdx(currentIdx + 1);
  };

  // Guarded once for the whole batch: routing each step through setStep would
  // raise one toast per step, which is a wall of identical warnings.
  const markAll = () => {
    guard('save your progress', () => task.steps.forEach((s) => applyStep(s.id, true)));
  };

  const undoAll = () => {
    guard('change your progress', () => {
      task.steps.forEach((s) => applyStep(s.id, false));
      setCurrentIdx(0);
    });
  };

  const stepperItems: StepperItem[] = useMemo(
    () =>
      task.steps.map((s, i) => ({
        label: `Step ${i + 1}`,
        // The dots used to be thirteen unlabeled "Step N"s — a rail you could
        // count but not read. The title is what makes it a map.
        sublabel: s.title,
        status: completed.has(s.id) ? 'done' : i === currentIdx ? 'current' : 'upcoming',
      })),
    [task.steps, completed, currentIdx]
  );

  const current = task.steps[currentIdx];
  const currentDone = current ? completed.has(current.id) : false;

  return (
    <div className="space-y-4">
      {/* One row above the steps: the count on the left, the view toggle on
          the right. The toggle spent one round buried inside "About this task"
          and came straight back out — with Guided now the default, the switch
          between "one step at a time" and "the whole checklist" is the primary
          view control, not a setting. Mark all stays in About. */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-muted">
        <ListChecks className="h-4 w-4" />
        {requiredDone} of {requiredTotal} required done
        {optionalTotal > 0 && (
          <span className="text-xs text-muted">· {optionalTotal} optional</span>
        )}
        {allRequiredDone && (
          <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-ok-soft px-2 py-0.5 text-xs text-ok">
            <CheckCircle2 className="h-3 w-3" /> Task complete
          </span>
        )}
        {/* The reward beat — a cut lands on the stone each time a step does. */}
        <CutBeat trigger={beat} />
        </div>
        <div className="flex overflow-hidden rounded-lg border border-line">
          <button
            onClick={() => setMode('guided')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === 'guided'
                ? 'bg-accent text-accent-contrast'
                : 'bg-panel text-muted hover:bg-panel-2'
            }`}
          >
            <ArrowRight className="h-3.5 w-3.5" /> Guided
          </button>
          <button
            onClick={() => setMode('all')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === 'all'
                ? 'bg-accent text-accent-contrast'
                : 'bg-panel text-muted hover:bg-panel-2'
            }`}
          >
            <Rows3 className="h-3.5 w-3.5" /> Show all
          </button>
        </div>
      </div>

      {/* Everything about the task that is not a step: the done-when list, the
          prerequisites/outputs, the tools-and-learning brief (all supplied by
          the caller via `about`), plus Mark all. */}
      <div className="rounded-lg border border-line bg-panel px-3">
        <Collapsible title="About this task — done-when, tools & extras">
          <div className="space-y-3 py-1 pr-2">
            {about}
            <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
              {allDone ? (
                <button
                  onClick={undoAll}
                  className="flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-muted hover:bg-panel-2"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset
                </button>
              ) : (
                <button
                  onClick={markAll}
                  className="flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-muted hover:bg-panel-2"
                >
                  <Check className="h-3.5 w-3.5" /> Mark all
                </button>
              )}
            </div>
          </div>
        </Collapsible>
      </div>

      {mode === 'guided' ? (
        <div className="space-y-5">
          <GuidedStepper
            items={stepperItems}
            onSelect={(i) => setCurrentIdx(i)}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={current?.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="rounded-lg border border-line bg-panel-2 p-5"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-accent">
                      Step {currentIdx + 1} of {total}
                    </span>
                    {current?.optional && (
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                        Optional
                      </span>
                    )}
                  </div>
                  <h4 className="mt-1 text-lg font-semibold text-ink">
                    {current?.title}
                  </h4>
                  {/* The step's authored one-liner — unreachable for two rounds
                      (the body renders `instruction || description`, and every
                      step has both), now doing its job as the card's subtitle. */}
                  {current?.description && (
                    <p className="mt-0.5 text-sm text-muted">{current.description}</p>
                  )}
                </div>
                {currentDone && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ok-soft px-2 py-1 text-xs font-medium text-ok">
                    <Check className="h-3 w-3" /> Done
                  </span>
                )}
              </div>

              {/* `danger` was missing from this list. Guided mode passed every
                  other field and silently dropped the one that says "this erases
                  every drive and there is no undo" — the field a student most
                  needs before touching anything. Server+ defaults to 'all' mode,
                  so it showed there; only guided mode lost it. */}
              {current && (
                <StepDetail
                  instruction={current.instruction}
                  instructionList={current.instructionList}
                  paths={current.paths}
                  description={current.description}
                  danger={current.danger}
                  command={current.command}
                  commands={current.commands}
                  commandExplanation={current.commandExplanation}
                  commandFlags={current.commandFlags}
                  expectedOutput={current.expectedOutput}
                  outputExplanation={current.outputExplanation}
                  whatItMeans={current.whatItMeans}
                  frameworks={current.frameworks}
                  deliverable={current.producesDeliverable}
                  usesForm={current.usesForm}
                  troubleshooting={current.troubleshooting}
                  fixes={current.fixes}
                  verify={current.verify}
                  ledger={{ courseId, taskId: task.id, stepId: current.id, memberId }}
                  optional={current.optional}
                  where={current.where}
                  path={current.path}
                  files={current.files}
                  tree={current.tree}
                  walkthrough={current.walkthrough}
                  images={current.images}
                  outputHighlights={current.outputHighlights}
                  outputKind={current.outputKind}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="secondary"
              size="sm"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" /> Previous
            </Button>

            {currentDone ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setStep(current!.id, false)}
                className="flex items-center gap-1"
              >
                <RotateCcw className="h-4 w-4" /> Mark not done
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={completeAndNext}
                className="flex items-center gap-1"
              >
                <Check className="h-4 w-4" />
                {currentIdx === total - 1 ? 'Mark complete' : 'Mark complete & next'}
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              disabled={currentIdx === total - 1}
              onClick={() => setCurrentIdx(Math.min(total - 1, currentIdx + 1))}
              className="flex items-center gap-1"
            >
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {task.steps.map((step, i) => (
            <ChecklistItem
              key={step.id}
              stepId={step.id}
              number={i + 1}
              /* Exactly one row opens: the first incomplete step at the moment
                 this list mounted (`currentIdx` is initialized to it). Read
                 once — no re-open/re-close choreography as steps are ticked. */
              defaultOpen={i === currentIdx}
              title={step.title}
              instruction={step.instruction}
              instructionList={step.instructionList}
              paths={step.paths}
              description={step.description}
              command={step.command}
              commands={step.commands}
              commandExplanation={step.commandExplanation}
              commandFlags={step.commandFlags}
              expectedOutput={step.expectedOutput}
              outputExplanation={step.outputExplanation}
              whatItMeans={step.whatItMeans}
              isComplete={completed.has(step.id)}
              onToggle={(checked) => setStep(step.id, checked)}
              frameworks={step.frameworks}
              deliverable={step.producesDeliverable}
              usesForm={step.usesForm}
              danger={step.danger}
              troubleshooting={step.troubleshooting}
              fixes={step.fixes}
              verify={step.verify}
              ledger={{ courseId, taskId: task.id, stepId: step.id, memberId }}
              optional={step.optional}
              where={step.where}
              path={step.path}
              files={step.files}
              tree={step.tree}
              walkthrough={step.walkthrough}
              images={step.images}
              outputHighlights={step.outputHighlights}
              outputKind={step.outputKind}
            />
          ))}
        </div>
      )}

      {/* One obvious next action once the task is done — no dead-end. */}
      {/* Absolute-beginner terminal help, ONCE per task. It used to render
          inside every command-bearing step's footer — 29 steps × 176 words of
          the identical six cards, ~5,100 duplicated words across the course.
          Same help, one home, below the steps it serves. */}
      {task.steps.some((s) => s.command || s.commands?.length) && (
        <div className="rounded-lg border border-line bg-panel-2/50 px-3">
          <Collapsible title="New to the terminal?">
            <div className="pb-2 pr-2">
              <TerminalBasics />
            </div>
          </Collapsible>
        </div>
      )}

      {allRequiredDone && onNext && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ok-line bg-ok-soft px-4 py-3"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-ok">
            <CutMark size={30} className="shrink-0" /> Task complete — nice work.
          </span>
          <Button size="sm" onClick={onNext} className="flex items-center gap-1">
            {nextLabel ?? 'Next'} <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}
