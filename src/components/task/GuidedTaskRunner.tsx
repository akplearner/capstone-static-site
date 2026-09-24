'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Clock, Rows3, RotateCcw } from 'lucide-react';
import { Button, Collapsible } from '@/components/ui/Button';
import { ChecklistItem } from './ChecklistItem';
import { CutMark, CutBeat } from '@/components/quarry/CutBeat';
import { TerminalBasics } from '@/components/docs/CommandTroubleshooting';
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
  /** A deep link (`?step=`) or the palette named this step: open on it rather
   *  than on the first incomplete one. */
  initialStepId?: string;
}

/**
 * An open task, on one screen (R79): its objective, the step LADDER, and one
 * button. One disclosure holds everything else.
 *
 * The ladder is the workflow and the checklist in one: every step is a rung —
 * number, title, tick — read top to bottom. "Show all" is the default for
 * every course (R80) and every rung starts closed: a plain list of steps, and
 * a click opens the one a student wants. Guided mode, one toggle away, opens
 * the rung you are on with the Previous / Mark complete / Next row. The last rung is
 * "Done when": the task's definition of done, ticked when every required
 * step is. What the header lost — the machines strip, the counts line — the
 * ladder says better.
 */
export function GuidedTaskRunner({ task, courseId, memberId, onProgressChange, onNext, nextLabel, about, initialStepId }: GuidedTaskRunnerProps) {
  const [completed, setCompleted] = useState<Set<string>>(
    () => new Set(progressRepo.getCompletedStepIds(courseId, memberId, task))
  );
  // Bumped each time a step is newly ticked, to fire the one-shot cut beat.
  const [beat, setBeat] = useState(0);
  const { guard } = useRequireAuth();
  // R80: "Show all" is the default for every course, and every rung starts
  // closed — the task opens as a plain list of step titles, and a student
  // clicks the step they want. A deep link (`?step=`) opens exactly that one.
  const [mode, setMode] = useState<'guided' | 'all'>('all');
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(initialStepId ? [initialStepId] : []));
  const toggleOpen = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const [currentIdx, setCurrentIdx] = useState(() => {
    const asked = initialStepId ? task.steps.findIndex((s) => s.id === initialStepId) : -1;
    if (asked >= 0) return asked;
    const done = new Set(progressRepo.getCompletedStepIds(courseId, memberId, task));
    const firstIncomplete = task.steps.findIndex((s) => !done.has(s.id));
    return firstIncomplete === -1 ? 0 : firstIncomplete;
  });
  // A later deep link to another step of the same open task.
  useEffect(() => {
    if (!initialStepId) return;
    const idx = task.steps.findIndex((s) => s.id === initialStepId);
    if (idx < 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentIdx(idx);
    setOpenIds((prev) => (prev.has(initialStepId) ? prev : new Set(prev).add(initialStepId)));
  }, [initialStepId, task.steps]);

  const total = task.steps.length;
  const allDone = total > 0 && completed.size === total;
  // Required-only progress drives the "task complete" state so it matches the
  // dashboard %/gates (optional steps are tracked but never block completion).
  const requiredTotal = getRequiredStepCount(task);
  const requiredIds = useMemo(() => new Set(getRequiredSteps(task).map((s) => s.id)), [task]);
  const requiredDone = useMemo(
    () => [...completed].filter((id) => requiredIds.has(id)).length,
    [completed, requiredIds]
  );
  const allRequiredDone = requiredTotal > 0 && requiredDone === requiredTotal;
  const hasCommands = task.steps.some((s) => s.command || s.commands?.length);

  const setStep = (stepId: string, done: boolean) => {
    // Ticking a step is a write. In cloud mode it must belong to an account, or
    // it is lost on the next device and never reaches the team page.
    if (!guard('save your progress', () => applyStep(stepId, done))) return;
  };

  const applyStep = (stepId: string, done: boolean) => {
    if (done) {
      progressRepo.setCompletion({ courseId, taskId: task.id, memberId, stepId, completedAt: nowMs() });
      // Remember this as the place to reopen on the next visit. Only ticking
      // moves the pointer — un-ticking an old step shouldn't drag the student
      // backwards through the course.
      recordResume(courseId, memberId, { week: task.week, taskId: task.id, stepId });
      // Record HOW this step was finished. A verify-gated step ticked without
      // matching output is self-attested, and the dashboard says so.
      // `selfAttested` never downgrades an existing verified record.
      const step = task.steps.find((s) => s.id === stepId);
      const prior = evidenceRepo.getSteps(courseId, memberId)[`${task.id}::${stepId}`];
      evidenceRepo.saveStep(
        memberId,
        selfAttested(prior, { courseId, taskId: task.id, stepId, totalTokens: step?.verify?.length ?? 0, at: nowMs() })
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
    // Only a fresh tick earns a strike.
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

  const current = task.steps[currentIdx];
  const currentDone = current ? completed.has(current.id) : false;
  const doneWhen = task.definitionOfDone ?? [];

  // Under the open rung in guided mode: where to go from here.
  const guidedNav = (
    <div className="flex items-center justify-between gap-3">
      <Button variant="secondary" size="sm" disabled={currentIdx === 0} onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} className="flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" /> Previous
      </Button>
      {currentDone ? (
        <Button variant="secondary" size="sm" onClick={() => setStep(current!.id, false)} className="flex items-center gap-1">
          <RotateCcw className="h-4 w-4" /> Mark not done
        </Button>
      ) : (
        <Button size="sm" onClick={completeAndNext} className="flex items-center gap-1">
          <Check className="h-4 w-4" />
          {currentIdx === total - 1 ? 'Mark complete' : 'Mark complete & next'}
        </Button>
      )}
      <Button variant="secondary" size="sm" disabled={currentIdx === total - 1} onClick={() => setCurrentIdx(Math.min(total - 1, currentIdx + 1))} className="flex items-center gap-1">
        Next <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* The task, stated once: why, and how long. */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm text-body">{task.objective}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            {task.estimatedTime && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden /> {task.estimatedTime}
              </span>
            )}
            {/* The reward beat — a cut lands on the stone each time a step does. */}
            <CutBeat trigger={beat} />
          </div>
        </div>
        <div className="flex overflow-hidden rounded-[var(--radius-control)] depth-edge" role="group" aria-label="How to work the steps">
          {(['guided', 'all'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium transition-colors ${
                mode === m ? 'bg-accent text-accent-contrast' : 'bg-panel text-muted hover:bg-panel-2'
              }`}
            >
              {m === 'guided' ? <ArrowRight className="h-3.5 w-3.5" /> : <Rows3 className="h-3.5 w-3.5" />}
              {m === 'guided' ? 'Guided' : 'Show all'}
            </button>
          ))}
        </div>
      </div>

      {/* The ladder: every step a rung, the one you are on open. */}
      <ol aria-label="Steps of this task" className="space-y-1">
        {task.steps.map((step, i) => (
          <ChecklistItem
            key={step.id}
            step={step}
            number={i + 1}
            isComplete={completed.has(step.id)}
            onToggle={(checked) => setStep(step.id, checked)}
            ledger={{ courseId, taskId: task.id, stepId: step.id, memberId }}
            open={mode === 'all' ? openIds.has(step.id) : i === currentIdx}
            onOpen={() => {
              setCurrentIdx(i);
              if (mode === 'all') toggleOpen(step.id);
            }}
            current={mode === 'guided' && i === currentIdx}
            footer={mode === 'guided' ? guidedNav : undefined}
          />
        ))}
        {/* The last rung: what "done" means for the whole task. It ticks when
            every required step is done — the same test the week uses. */}
        {doneWhen.length > 0 && (
          <li className={`rounded-[var(--radius-control)] px-3 py-2 ${allRequiredDone ? 'bg-ok-soft' : ''}`}>
            <div className="flex items-start gap-3">
              <CheckCircle2 className={`mt-0.5 h-5 w-5 shrink-0 ${allRequiredDone ? 'text-ok' : 'text-muted'}`} aria-hidden />
              <div className="min-w-0 flex-1">
                <div className={`font-medium ${allRequiredDone ? 'text-ok' : 'text-ink'}`}>Done when</div>
                <ul className="mt-1 space-y-0.5 text-sm text-body">
                  {doneWhen.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </div>
            </div>
          </li>
        )}
      </ol>

      {/* The one disclosure at task level: everything about the task that is
          not a step — needs/produces/hand-offs, tools, Mark all — and the
          beginner terminal help, once per task rather than once per command. */}
      <div className="rounded-lg depth-edge bg-panel px-3">
        <Collapsible title="About this task" hint={`needs · produces · hand-offs · tools${hasCommands ? ' · terminal help' : ''}`}>
          <div className="space-y-3 py-1 pr-2">
            {about}
            <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
              {allDone ? (
                <button onClick={undoAll} className="flex items-center gap-1 rounded-lg depth-edge px-3 py-1.5 text-xs font-medium text-muted hover:bg-panel-2">
                  <RotateCcw className="h-3.5 w-3.5" /> Reset
                </button>
              ) : (
                <button onClick={markAll} className="flex items-center gap-1 rounded-lg depth-edge px-3 py-1.5 text-xs font-medium text-muted hover:bg-panel-2">
                  <Check className="h-3.5 w-3.5" /> Mark all
                </button>
              )}
            </div>
            {hasCommands && (
              <div className="border-t border-line pt-3">
                <div className="mb-2 text-xs font-semibold text-muted">New to the terminal?</div>
                <TerminalBasics />
              </div>
            )}
          </div>
        </Collapsible>
      </div>

      {/* One obvious next action once the task is done — no dead-end. */}
      {allRequiredDone && onNext && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-ok-soft px-4 py-3"
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
