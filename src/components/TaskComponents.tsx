'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lock,
  AlertTriangle,
  Copy,
  FileText,
} from 'lucide-react';
import { Task } from '@/lib/types';
import { getFrameworkColor, getFrameworkLabel } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  completionPercent: number;
  onClick?: () => void;
}

export function TaskCard({ task, completionPercent, onClick }: TaskCardProps) {
  return (
    <motion.div whileHover={{ y: -2 }} className="cursor-pointer" onClick={onClick}>
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">{task.title}</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{task.objective}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {task.frameworks.slice(0, 3).map((fw) => (
                <span
                  key={fw}
                  className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getFrameworkColor(fw)}`}
                >
                  {getFrameworkLabel(fw)}
                </span>
              ))}
              {task.frameworks.length > 3 && (
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  +{task.frameworks.length - 3} more
                </span>
              )}
            </div>
          </div>
          <div className="ml-4 text-right">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{completionPercent}%</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {task.steps.length} steps
            </div>
          </div>
        </div>
        <div className="mt-4 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full rounded-full bg-blue-600"
          />
        </div>
      </div>
    </motion.div>
  );
}

interface GateBadgeProps {
  gateId: number;
  status: 'locked' | 'ready' | 'passed';
  completionPercent: number;
}

export function GateBadge({ gateId, status, completionPercent }: GateBadgeProps) {
  const icons = {
    locked: <Lock className="h-7 w-7" />,
    ready: <AlertTriangle className="h-7 w-7" />,
    passed: <CheckCircle2 className="h-7 w-7" />,
  };

  const colors = {
    locked: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    ready: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    passed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`rounded-lg p-4 ${colors[status]}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Gate {gateId}</div>
          <div className="text-xs">
            {status === 'locked' && 'Complete your tasks to unlock'}
            {status === 'ready' && 'In progress — keep going'}
            {status === 'passed' && 'Passed!'}
          </div>
        </div>
        <div>{icons[status]}</div>
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-gray-300 dark:bg-gray-600">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${completionPercent}%` }}
          transition={{ duration: 0.5 }}
          className="h-full rounded-full bg-blue-600"
        />
      </div>
      <div className="mt-2 text-xs font-medium">{completionPercent}% Complete</div>
    </motion.div>
  );
}

interface FrameworkBadgeProps {
  framework: string;
}

export function FrameworkBadge({ framework }: FrameworkBadgeProps) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getFrameworkColor(framework as any)}`}>
      {getFrameworkLabel(framework as any)}
    </span>
  );
}

/**
 * Shared rendering of a step's details: instruction, command, expected output,
 * what-it-means, the deliverable it produces, and framework tags. Reused by the
 * ChecklistItem ("show all") view and the GuidedTaskRunner one-step view.
 */
export function StepDetail({
  instruction,
  description,
  command,
  expectedOutput,
  whatItMeans,
  frameworks,
  deliverable,
}: {
  instruction?: string;
  description?: string;
  command?: string;
  expectedOutput?: string;
  whatItMeans: string;
  frameworks: string[];
  deliverable?: string;
}) {
  return (
    <div className="space-y-3">
      {(instruction || description) && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            What to do
          </div>
          <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            {instruction || description}
          </div>
        </div>
      )}

      {command && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Command
          </div>
          <div className="relative mt-1 rounded bg-black p-3 pr-20 font-mono text-sm text-green-400">
            <div className="absolute right-2 top-2">
              <CopyButton text={command} />
            </div>
            <div className="whitespace-pre-wrap break-words">{command}</div>
          </div>
        </div>
      )}

      {expectedOutput && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            You should see
          </div>
          <div className="mt-1 rounded bg-gray-100 p-2 text-sm text-gray-800 dark:bg-gray-600 dark:text-gray-100">
            {expectedOutput}
          </div>
        </div>
      )}

      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          What it means
        </div>
        <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">{whatItMeans}</div>
      </div>

      {deliverable && (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-900/20">
          <FileText className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="text-sm text-amber-800 dark:text-amber-300">
            Save your evidence as <span className="font-mono font-semibold">{deliverable}</span>
          </span>
        </div>
      )}

      {frameworks.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Frameworks
          </span>
          {frameworks.map((fw) => (
            <FrameworkBadge key={fw} framework={fw} />
          ))}
        </div>
      )}
    </div>
  );
}

interface ChecklistItemProps {
  stepId: string;
  title: string;
  instruction?: string;
  description?: string;
  command?: string;
  expectedOutput?: string;
  whatItMeans: string;
  isComplete: boolean;
  onToggle: (complete: boolean) => void;
  frameworks: string[];
  deliverable?: string;
}

export function ChecklistItem({
  title,
  instruction,
  description,
  command,
  expectedOutput,
  whatItMeans,
  isComplete,
  onToggle,
  frameworks,
  deliverable,
}: ChecklistItemProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <motion.div layout className="border-l-4 border-blue-200 bg-gray-50 p-4 dark:border-blue-800 dark:bg-gray-700/50">
      <div className="flex items-start gap-4">
        <motion.input
          type="checkbox"
          checked={isComplete}
          onChange={(e) => onToggle(e.target.checked)}
          whileHover={{ scale: 1.1 }}
          className="mt-1 h-5 w-5 cursor-pointer accent-blue-600"
        />
        <div className="flex-1">
          <motion.div className="flex items-center justify-between gap-2">
            <h4 className={`font-medium ${isComplete ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
              {title}
            </h4>
            <motion.button
              onClick={() => setShowDetails(!showDetails)}
              className="flex shrink-0 items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showDetails ? 'Hide' : 'Details'}
            </motion.button>
          </motion.div>

          {isComplete && (
            <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} className="mt-1 flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
              <Check className="h-4 w-4" /> Completed
            </motion.div>
          )}

          <motion.div
            initial={false}
            animate={{ height: showDetails ? 'auto' : 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-600">
              <StepDetail
                instruction={instruction}
                description={description}
                command={command}
                expectedOutput={expectedOutput}
                whatItMeans={whatItMeans}
                frameworks={frameworks}
                deliverable={deliverable}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}
