'use client';

import { useMemo, useState } from 'react';
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
import { Button } from './ui/Button';
import { ChecklistItem, StepDetail } from './TaskComponents';
import { GuidedStepper, StepperItem } from './GuidedStepper';
import { Task } from '@/lib/types';
import { progressRepo } from '@/lib/data';

interface GuidedTaskRunnerProps {
  task: Task;
  courseId: string;
  memberId: string;
  /** Called whenever completion changes so parents can refresh progress/gates. */
  onProgressChange?: () => void;
}

export function GuidedTaskRunner({ task, courseId, memberId, onProgressChange }: GuidedTaskRunnerProps) {
  const [completed, setCompleted] = useState<Set<string>>(
    () => new Set(progressRepo.getCompletedStepIds(courseId, memberId, task))
  );
  const [mode, setMode] = useState<'guided' | 'all'>('guided');
  const [currentIdx, setCurrentIdx] = useState(() => {
    const done = new Set(progressRepo.getCompletedStepIds(courseId, memberId, task));
    const firstIncomplete = task.steps.findIndex((s) => !done.has(s.id));
    return firstIncomplete === -1 ? 0 : firstIncomplete;
  });

  const completedCount = completed.size;
  const total = task.steps.length;
  const allDone = total > 0 && completedCount === total;

  const setStep = (stepId: string, done: boolean) => {
    if (done) {
      progressRepo.setCompletion({
        courseId,
        taskId: task.id,
        memberId,
        stepId,
        completedAt: Date.now(),
      });
    } else {
      progressRepo.removeCompletion(courseId, memberId, task.id, stepId);
    }
    setCompleted((prev) => {
      const next = new Set(prev);
      if (done) next.add(stepId);
      else next.delete(stepId);
      return next;
    });
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

  const markAll = () => {
    task.steps.forEach((s) => setStep(s.id, true));
  };

  const undoAll = () => {
    task.steps.forEach((s) => setStep(s.id, false));
    setCurrentIdx(0);
  };

  const stepperItems: StepperItem[] = useMemo(
    () =>
      task.steps.map((s, i) => ({
        label: `Step ${i + 1}`,
        status: completed.has(s.id) ? 'done' : i === currentIdx ? 'current' : 'upcoming',
      })),
    [task.steps, completed, currentIdx]
  );

  const current = task.steps[currentIdx];
  const currentDone = current ? completed.has(current.id) : false;

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
          <ListChecks className="h-4 w-4" />
          {completedCount} of {total} steps done
          {allDone && (
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/40 dark:text-green-300">
              <CheckCircle2 className="h-3 w-3" /> Task complete
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600">
            <button
              onClick={() => setMode('guided')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors ${
                mode === 'guided'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <ArrowRight className="h-3.5 w-3.5" /> Guided
            </button>
            <button
              onClick={() => setMode('all')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors ${
                mode === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <Rows3 className="h-3.5 w-3.5" /> Show all
            </button>
          </div>
          {allDone ? (
            <button
              onClick={undoAll}
              className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          ) : (
            <button
              onClick={markAll}
              className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Check className="h-3.5 w-3.5" /> Mark all
            </button>
          )}
        </div>
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
              className="rounded-lg border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-700/40"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                    Step {currentIdx + 1} of {total}
                  </div>
                  <h4 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                    {current?.title}
                  </h4>
                </div>
                {currentDone && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300">
                    <Check className="h-3 w-3" /> Done
                  </span>
                )}
              </div>

              {current && (
                <StepDetail
                  instruction={current.instruction}
                  description={current.description}
                  command={current.command}
                  commandExplanation={current.commandExplanation}
                  commandFlags={current.commandFlags}
                  expectedOutput={current.expectedOutput}
                  outputExplanation={current.outputExplanation}
                  whatItMeans={current.whatItMeans}
                  frameworks={current.frameworks}
                  deliverable={current.producesDeliverable}
                  troubleshooting={current.troubleshooting}
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
          {task.steps.map((step) => (
            <ChecklistItem
              key={step.id}
              stepId={step.id}
              title={step.title}
              instruction={step.instruction}
              description={step.description}
              command={step.command}
              commandExplanation={step.commandExplanation}
              commandFlags={step.commandFlags}
              expectedOutput={step.expectedOutput}
              outputExplanation={step.outputExplanation}
              whatItMeans={step.whatItMeans}
              isComplete={completed.has(step.id)}
              onToggle={(checked) => setStep(step.id, checked)}
              frameworks={step.frameworks}
              deliverable={step.producesDeliverable}
              troubleshooting={step.troubleshooting}
            />
          ))}
        </div>
      )}
    </div>
  );
}
