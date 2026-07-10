'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lock,
  AlertTriangle,
  Copy,
  CornerDownRight,
  FileText,
  Sparkles,
  SquarePen,
  Terminal,
  Eye,
} from 'lucide-react';
import { Task } from '@/lib/types';
import { getFrameworkColor, getFrameworkLabel, getFrameworkWhy } from '@/lib/utils';
import { useLabAccess, fillPlaceholders } from '@/lib/labAccess';
import { Collapsible } from './ui/Button';

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
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getFrameworkColor(framework)}`}>
      {getFrameworkLabel(framework)}
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
  commands,
  commandExplanation,
  commandFlags,
  expectedOutput,
  outputExplanation,
  whatItMeans,
  frameworks,
  deliverable,
  usesForm,
  troubleshooting,
  optional,
}: {
  instruction?: string;
  description?: string;
  command?: string;
  commands?: { cmd: string; explain?: string; flags?: { flag: string; meaning: string }[] }[];
  commandExplanation?: string;
  commandFlags?: { flag: string; meaning: string }[];
  expectedOutput?: string;
  outputExplanation?: string;
  whatItMeans: string;
  frameworks: string[];
  deliverable?: string;
  usesForm?: string;
  troubleshooting?: string;
  optional?: boolean;
}) {
  const params = useParams();
  const courseId = typeof params?.courseId === 'string' ? params.courseId : Array.isArray(params?.courseId) ? params.courseId[0] : '';
  // When per-statement commands are supplied, their inline explanations replace the
  // combined commandExplanation. Step-level flags are only suppressed when the
  // structured commands carry their OWN per-command flags — otherwise we still show
  // the step-level flag table so no flag help is ever lost.
  const usingStructured = !!(commands && commands.length > 0);
  const structuredHasFlags = usingStructured && commands!.some((c) => c.flags && c.flags.length > 0);
  const showCmdExplain = !usingStructured && !!commandExplanation;
  const showCmdFlags = !structuredHasFlags && !!commandFlags && commandFlags.length > 0;
  const hasCommand = usingStructured || !!command;
  const hasExplain =
    showCmdExplain || showCmdFlags || !!outputExplanation || !!troubleshooting || frameworks.length > 0;
  return (
    <div className="space-y-3">
      {optional && (
        <div className="flex items-start gap-2 rounded-md border border-violet-200 bg-violet-50 px-3 py-2 dark:border-violet-800 dark:bg-violet-900/20">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />
          <p className="text-sm text-violet-900 dark:text-violet-200">
            <span className="font-semibold">Optional step.</span> Great practice, but it doesn&apos;t
            count toward your progress or gates — do it to go deeper.
          </p>
        </div>
      )}

      {usesForm && (
        <Link
          href={`/courses/${courseId}/docs`}
          className="flex items-start gap-2 rounded-md border border-violet-200 bg-violet-50 px-3 py-2 transition-colors hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-900/20 dark:hover:bg-violet-900/40"
        >
          <SquarePen className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />
          <p className="text-sm text-violet-900 dark:text-violet-200">
            <span className="font-semibold">No terminal needed — fill this in the website form.</span>{' '}
            Open the <span className="font-semibold">{usesForm}</span> form on the Deliverables page and
            enter your data; it generates the formatted document for you.{' '}
            <span className="underline">Go to Deliverables →</span>
          </p>
        </Link>
      )}

      {/* Essentials in two columns on desktop: left = do + command(s), right = see + meaning. */}
      <div className="grid gap-3 md:grid-cols-2">
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
          {hasCommand && <CommandBlock command={command} commands={commands} />}
        </div>

        <div className="space-y-3">
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
        </div>
      </div>

      {deliverable && (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-900/20">
          <FileText className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="text-sm text-amber-800 dark:text-amber-300">
            Save your evidence as <span className="font-mono font-semibold">{deliverable}</span>
          </span>
        </div>
      )}

      {/* Everything secondary — the "why" — lives behind one toggle to keep steps compact. */}
      {hasExplain && (
        <div className="rounded-md border border-gray-200 px-4 dark:border-gray-700">
          <Collapsible title="Explain — command, output & why" defaultOpen={false}>
            <div className="space-y-3 pb-1">
              {showCmdExplain && (
                <div className="flex gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-800 dark:bg-emerald-900/20">
                  <Terminal className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-sm text-emerald-900 dark:text-emerald-200">
                    <span className="font-semibold">What the command does: </span>
                    {commandExplanation}
                  </p>
                </div>
              )}
              {showCmdFlags && commandFlags && (
                <div className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
                  <table className="w-full text-sm">
                    <tbody>
                      {commandFlags.map((f, i) => (
                        <tr key={f.flag} className={i % 2 ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-800'}>
                          <td className="whitespace-nowrap border-r border-gray-200 px-2.5 py-1.5 align-top font-mono text-xs font-semibold text-emerald-700 dark:border-gray-700 dark:text-emerald-300">
                            {f.flag}
                          </td>
                          <td className="px-2.5 py-1.5 text-gray-700 dark:text-gray-300">{f.meaning}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {outputExplanation && (
                <div className="flex gap-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 dark:border-sky-800 dark:bg-sky-900/20">
                  <Eye className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
                  <p className="text-sm text-sky-900 dark:text-sky-200">
                    <span className="font-semibold">Reading the output: </span>
                    {outputExplanation}
                  </p>
                </div>
              )}
              {troubleshooting && (
                <div className="flex gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 dark:border-rose-800 dark:bg-rose-900/20">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <p className="text-sm text-rose-900 dark:text-rose-200">
                    <span className="font-semibold">If it doesn&apos;t work: </span>
                    {troubleshooting}
                  </p>
                </div>
              )}
              {frameworks.length > 0 && (
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Frameworks
                    </span>
                    {frameworks.map((fw) => (
                      <FrameworkBadge key={fw} framework={fw} />
                    ))}
                  </div>
                  <ul className="mt-2 space-y-2">
                    {frameworks.map((fw) => (
                      <li key={fw} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className="shrink-0">
                          <FrameworkBadge framework={fw} />
                        </span>
                        <span>{getFrameworkWhy(fw) || 'A standard this step helps satisfy.'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Collapsible>
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
  commands?: { cmd: string; explain?: string }[];
  commandExplanation?: string;
  commandFlags?: { flag: string; meaning: string }[];
  expectedOutput?: string;
  outputExplanation?: string;
  whatItMeans: string;
  isComplete: boolean;
  onToggle: (complete: boolean) => void;
  frameworks: string[];
  deliverable?: string;
  usesForm?: string;
  troubleshooting?: string;
  optional?: boolean;
}

export function ChecklistItem({
  title,
  instruction,
  description,
  command,
  commands,
  commandExplanation,
  commandFlags,
  expectedOutput,
  outputExplanation,
  whatItMeans,
  isComplete,
  onToggle,
  frameworks,
  deliverable,
  usesForm,
  troubleshooting,
  optional,
}: ChecklistItemProps) {
  const [showDetails, setShowDetails] = React.useState(true);

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
            <h4 className={`flex items-center gap-2 font-medium ${isComplete ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
              {title}
              {optional && (
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-700 no-underline dark:bg-violet-900/40 dark:text-violet-300">
                  Optional
                </span>
              )}
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
                commands={commands}
                commandExplanation={commandExplanation}
                commandFlags={commandFlags}
                expectedOutput={expectedOutput}
                outputExplanation={outputExplanation}
                whatItMeans={whatItMeans}
                frameworks={frameworks}
                deliverable={deliverable}
                usesForm={usesForm}
                troubleshooting={troubleshooting}
                optional={optional}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Split a single command string into its top-level statements, breaking on `&&`,
 * `;`, and newlines but NOT on pipes (`|` is one pipeline), never inside quotes,
 * and never inside braces (`;` inside a PowerShell `@{...}` hashtable is not a
 * statement separator). Used as a visual fallback for un-migrated multi-statement
 * `command` strings.
 */
function splitCommand(cmd: string): string[] {
  const parts: string[] = [];
  let buf = '';
  let quote: string | null = null;
  let depth = 0;
  for (let i = 0; i < cmd.length; i++) {
    const ch = cmd[i];
    if (quote) {
      buf += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      buf += ch;
      continue;
    }
    if (ch === '{' || ch === '(') depth++;
    if (ch === '}' || ch === ')') depth = Math.max(0, depth - 1);
    if (ch === '\n') {
      if (buf.trim()) parts.push(buf.trim());
      buf = '';
      continue;
    }
    if (depth === 0 && ch === '&' && cmd[i + 1] === '&') {
      if (buf.trim()) parts.push(buf.trim());
      buf = '';
      i++;
      continue;
    }
    if (depth === 0 && ch === ';') {
      if (buf.trim()) parts.push(buf.trim());
      buf = '';
      continue;
    }
    buf += ch;
  }
  if (buf.trim()) parts.push(buf.trim());
  return parts.length ? parts : [cmd];
}

/**
 * Renders a step's command(s). With structured `commands` (preferred), each shell
 * statement gets its own copyable line + a one-line explanation; a single `command`
 * string is auto-split for visual clarity. A "Copy all" appears for multi-statement
 * commands so students can still paste the whole sequence at once.
 */
type CommandEntry = { cmd: string; explain?: string; flags?: { flag: string; meaning: string }[] };

export function CommandBlock({
  command,
  commands,
}: {
  command?: string;
  commands?: CommandEntry[];
}) {
  const params = useParams();
  const courseId = typeof params?.courseId === 'string' ? params.courseId : Array.isArray(params?.courseId) ? params.courseId[0] : '';
  const lab = useLabAccess(courseId);

  const raw: CommandEntry[] =
    commands && commands.length > 0
      ? commands
      : command
        ? splitCommand(command).map((c) => ({ cmd: c }))
        : [];
  if (raw.length === 0) return null;
  // Substitute the student's lab values (target IPs, etc.) into the commands.
  const list = raw.map((c) => ({ ...c, cmd: fillPlaceholders(c.cmd, lab.values) }));
  const multi = list.length > 1;
  const allText = list.map((c) => c.cmd).join('\n');

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {multi ? `Commands · run one at a time` : 'Command'}
        </div>
        {multi && <CopyButton text={allText} label="Copy all" />}
      </div>
      <div className="mt-1 space-y-2">
        {list.map((c, i) => (
          <div key={i}>
            <div className="relative rounded bg-black p-3 pr-20 font-mono text-sm text-green-400">
              <div className="absolute right-2 top-2">
                <CopyButton text={c.cmd} />
              </div>
              {multi && (
                <span className="mr-2 select-none text-gray-500">{i + 1}</span>
              )}
              <span className="whitespace-pre-wrap break-words">{c.cmd}</span>
            </div>
            {c.explain && (
              <p className="mt-1 flex gap-1.5 pl-1 text-xs text-gray-600 dark:text-gray-400">
                <CornerDownRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{c.explain}</span>
              </p>
            )}
            {c.flags && c.flags.length > 0 && (
              <ul className="mt-1 space-y-0.5 pl-6">
                {c.flags.map((f) => (
                  <li key={f.flag} className="flex gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <code className="shrink-0 font-mono font-semibold text-emerald-700 dark:text-emerald-300">
                      {f.flag}
                    </code>
                    <span>{f.meaning}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
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
      {copied ? 'Copied' : label}
    </button>
  );
}
