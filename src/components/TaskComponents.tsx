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
  Download,
  FileCheck2,
  FileText,
  Sparkles,
  SquarePen,
} from 'lucide-react';
import { Task, FolderNode } from '@/lib/types';
import { getFrameworkColor, getFrameworkLabel } from '@/lib/utils';
import { useLabAccess, fillPlaceholders, hasUnfilled } from '@/lib/labAccess';
import { deliverableIdByTitle, deliverableIdByFile } from '@/lib/docs/definitions';
import { splitCommand } from '@/lib/commands';
import { toast } from './ui/Toast';
import { StepFlow } from './diagrams/StepFlow';
import { TreeNode } from './docs/FolderTree';
import { GlossaryText } from './GlossaryText';

/** A file `source` that reads as a shell command (so we render a copyable line)
 *  rather than prose or a URL. Matches common lab CLI verbs at the start. */
function isCommandLike(source: string): boolean {
  return /^(git|sudo|curl|wget|apt|apt-get|dnf|yum|docker|python3?|pip3?|npm|ssh|scp|tar|unzip|chmod|mkdir|cd|cp|mv|cat|echo|bash|sh|powershell|msiexec|choco|Invoke-)\b/.test(
    source.trim()
  );
}

function isUrl(source: string): boolean {
  return /^https?:\/\//i.test(source.trim());
}

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
/**
 * Real-tool self-verification: the student pastes their ACTUAL command output and
 * the step turns green only when every expected token is present. Turns a static
 * "what you should see" block into a check you actually run against real output.
 */
function OutputVerify({ verify }: { verify: string[] }) {
  const [text, setText] = React.useState('');
  const touched = text.trim().length > 0;
  const norm = text.toLowerCase();
  const results = verify.map((tok) => ({ tok, ok: norm.includes(tok.toLowerCase()) }));
  const allOk = touched && results.every((r) => r.ok);
  return (
    <div className="rounded-md border border-gray-200 bg-white p-2 dark:border-gray-600 dark:bg-gray-800">
      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Verify — paste your actual output
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        spellCheck={false}
        placeholder="Paste what your terminal printed…"
        className="mt-1 w-full rounded border border-gray-300 bg-gray-50 p-2 font-mono text-xs text-gray-800 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
      />
      {touched && (
        <div className={`mt-1.5 flex items-center gap-1.5 text-sm font-medium ${allOk ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
          {allOk ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {allOk ? 'Verified — your output matches.' : 'Not matching yet — check the command ran on the right target.'}
        </div>
      )}
      {touched && !allOk && (
        <div className="mt-1 flex flex-wrap gap-1">
          {results.map((r) => (
            <span
              key={r.tok}
              className={`rounded px-1.5 py-0.5 font-mono text-[11px] ${r.ok ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}
            >
              {r.ok ? '✓' : '○'} {r.tok}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

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
  deliverable,
  usesForm,
  troubleshooting,
  verify,
  optional,
  where,
  path,
  files,
  tree,
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
  verify?: string[];
  optional?: boolean;
  where?: string;
  path?: string[];
  files?: { name: string; purpose: string; source?: string }[];
  tree?: FolderNode;
}) {
  const params = useParams();
  const courseId = typeof params?.courseId === 'string' ? params.courseId : Array.isArray(params?.courseId) ? params.courseId[0] : '';
  const usingStructured = !!(commands && commands.length > 0);
  const hasCommand = usingStructured || !!command;
  // For a legacy single-command step, fold its explanation + flags INTO the command
  // block so the help shows inline — no separate "Explain" panel to open.
  const cmdList: CommandEntry[] | undefined = usingStructured
    ? commands
    : command
      ? [{ cmd: command, explain: commandExplanation, flags: commandFlags }]
      : undefined;
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
          href={`/courses/${courseId}/docs${(() => {
            const id = deliverableIdByTitle(usesForm, courseId);
            return id ? `?form=${id}` : '';
          })()}`}
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

      {/* Pre-setup the step silently depends on: the files/downloads/configs that
          have to exist first, so a missing one is a visible prerequisite, not a
          confusing failure. A `source` that looks like a shell command is copyable. */}
      {files && files.length > 0 && (
        <div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 dark:border-sky-800 dark:bg-sky-900/20">
          <div className="flex items-center gap-2 text-sm font-semibold text-sky-900 dark:text-sky-200">
            <Download className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
            Files you&apos;ll need first
          </div>
          <ul className="mt-1.5 space-y-1.5">
            {files.map((f) => (
              <li key={f.name} className="text-sm text-sky-900 dark:text-sky-200">
                <span className="font-semibold">{f.name}</span>
                <span className="text-sky-800 dark:text-sky-300"> — {f.purpose}</span>
                {f.source &&
                  (isCommandLike(f.source) ? (
                    <div className="mt-1">
                      <CopyButton text={f.source} label={f.source} />
                    </div>
                  ) : isUrl(f.source) ? (
                    <a
                      href={f.source}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 block break-all text-xs font-medium text-sky-700 underline dark:text-sky-400"
                    >
                      {f.source}
                    </a>
                  ) : (
                    <div className="mt-0.5 text-xs text-sky-700 dark:text-sky-400">{f.source}</div>
                  ))}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* A tiny node→arrow→node "follow the path" for this step, when authored. */}
      {path && path.length > 0 && <StepFlow path={path} />}

      {/* What the step should leave on disk — a small example directory tree. */}
      {tree && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            What your files should look like
          </div>
          <ul className="mt-1.5 space-y-1 rounded-md border border-line bg-panel-2 p-3">
            <TreeNode node={tree} />
          </ul>
        </div>
      )}

      {/* Essentials in two columns on desktop: left = do + command(s), right = see + meaning. */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-3">
          {(instruction || description || where) && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                What to do
              </div>
              {where && (
                <div className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-line bg-panel-2 px-2 py-1 font-mono text-[10.5px] text-muted">
                  <span className="font-semibold text-accent">WHERE</span> {where}
                </div>
              )}
              {(instruction || description) && (
                <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                  {instruction || description}
                </div>
              )}
            </div>
          )}
          {hasCommand && <CommandBlock commands={cmdList} />}
        </div>

        <div className="space-y-2">
          {(expectedOutput || outputExplanation) && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                What you should see
              </div>
              {expectedOutput && <TerminalOutput text={expectedOutput} />}
              {outputExplanation && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{outputExplanation}</p>
              )}
            </div>
          )}
          {whatItMeans && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Why: </span>
              <GlossaryText text={whatItMeans} />
            </p>
          )}
          {hasCommand && verify && verify.length > 0 && <OutputVerify verify={verify} />}
        </div>
      </div>

      {deliverable && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex items-start gap-2">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span className="text-sm text-amber-800 dark:text-amber-300">
              Save your evidence as <span className="font-mono font-semibold">{deliverable}</span>,
              then hash it for chain of custody and log it in your report.
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 pl-6">
            <Link
              href={`/courses/${courseId}/docs?tool=evidence`}
              className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200 dark:hover:bg-amber-900/50"
            >
              <FileCheck2 className="h-3.5 w-3.5" /> Hash &amp; log this evidence →
            </Link>
            {(() => {
              const formId = deliverableIdByFile(deliverable, courseId);
              return formId ? (
                <Link
                  href={`/courses/${courseId}/docs?form=${formId}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200 dark:hover:bg-amber-900/50"
                >
                  <SquarePen className="h-3.5 w-3.5" /> Open the form →
                </Link>
              ) : null;
            })()}
          </div>
        </div>
      )}

      {/* The step's own authored "if it doesn't work" note, shown as a plain,
          always-visible fix — no generic terminal scaffolding. */}
      {troubleshooting && (
        <div className="rounded-md border border-rose-200 bg-rose-50/60 px-4 py-3 dark:border-rose-900 dark:bg-rose-900/10">
          <p className="flex gap-2 text-sm text-rose-900 dark:text-rose-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span><span className="font-medium">If it doesn&apos;t work:</span> {troubleshooting}</span>
          </p>
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
  verify?: string[];
  optional?: boolean;
  where?: string;
  path?: string[];
  files?: { name: string; purpose: string; source?: string }[];
  tree?: FolderNode;
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
  verify,
  optional,
  where,
  path,
  files,
  tree,
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
                verify={verify}
                optional={optional}
                where={where}
                path={path}
                files={files}
                tree={tree}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Renders a step's command(s). With structured `commands` (preferred), each shell
 * statement gets its own copyable line + a one-line explanation; a single `command`
 * string is auto-split for visual clarity. A "Copy all" appears for multi-statement
 * commands so students can still paste the whole sequence at once.
 */
type CommandEntry = { cmd: string; explain?: string; flags?: { flag: string; meaning: string }[] };

// IP-like tokens (incl. lab placeholders such as 10.10.100.N / .X / .<#>).
const IP_TOKEN = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.[0-9A-Za-z<>#/.N-]*)/g;
const IP_ONE = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.[0-9A-Za-z<>#/.N-]*$/;

/** Terminal syntax highlight matching the course-overview look: comment lines
 *  (starting with #) are dimmed, IP addresses are tinted. Everything else is the
 *  base terminal green. Purely visual; the copied text is always the raw command. */
function HighlightedCommand({ cmd }: { cmd: string }) {
  const lines = cmd.split('\n');
  return (
    <span className="whitespace-pre-wrap break-words">
      {lines.map((line, li) => {
        const prefix = li > 0 ? '\n' : '';
        if (line.trimStart().startsWith('#')) {
          return (
            <span key={li} style={{ color: 'var(--color-term-dim)' }}>
              {prefix}
              {line}
            </span>
          );
        }
        const parts = line.split(IP_TOKEN);
        return (
          <span key={li}>
            {prefix}
            {parts.map((part, pi) =>
              IP_ONE.test(part) ? (
                <span key={pi} style={{ color: 'var(--color-term-ip)' }}>
                  {part}
                </span>
              ) : (
                <span key={pi}>{part}</span>
              )
            )}
          </span>
        );
      })}
    </span>
  );
}

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
  // Warn when a command still carries an unfilled placeholder (e.g. <YOUR_TARGET_IP>,
  // 10.10.100.X) — a beginner would otherwise copy the literal token and hit a
  // confusing failure. Points them at the Lab access panel that fills it in.
  const stillUnfilled = list.some((c) => hasUnfilled(c.cmd));

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {multi ? `Commands · run one at a time` : 'Command'}
        </div>
        {multi && <CopyButton text={allText} label="Copy all" />}
      </div>
      {stillUnfilled && (
        <Link
          href={`/courses/${courseId}#lab-access`}
          className="mt-1 flex items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/40"
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            This still shows a placeholder like <span className="font-mono">10.10.100.X</span>. Set your target IP
            in <span className="font-semibold underline">Lab access</span> and it fills in automatically.
          </span>
        </Link>
      )}
      <div className="mt-1 space-y-2">
        {list.map((c, i) => (
          <div key={i}>
            <div
              className="relative rounded-lg p-3 pr-20 font-mono text-sm"
              style={{ background: 'var(--color-term-bg)', color: 'var(--color-term-tx)' }}
            >
              <div className="absolute right-2 top-2">
                <CopyButton text={c.cmd} />
              </div>
              {multi && (
                <span className="mr-2 select-none" style={{ color: 'var(--color-term-dim)' }}>{i + 1}</span>
              )}
              <HighlightedCommand cmd={c.cmd} />
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

/**
 * Renders a step's expected output in terminal chrome (matching CommandBlock),
 * so "what you should see" reads like a real console instead of a plain grey box.
 * Reuses the terminal palette tokens and the IP/comment highlighter. Purely
 * visual — the copied text is the raw output.
 */
export function TerminalOutput({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div
      className="relative mt-1 overflow-x-auto rounded-lg p-3 pr-16 font-mono text-sm"
      style={{ background: 'var(--color-term-bg)', color: 'var(--color-term-tx)' }}
    >
      <div className="absolute right-2 top-2">
        <CopyButton text={text} />
      </div>
      <div className="mb-1 select-none text-[10px] uppercase tracking-wide" style={{ color: 'var(--color-term-dim)' }}>
        expected output
      </div>
      {lines.map((ln, i) => (
        <div key={i} className="whitespace-pre-wrap break-words leading-relaxed">
          <HighlightedCommand cmd={ln} />
          {i === lines.length - 1 && <span className="term-caret" aria-hidden="true" />}
        </div>
      ))}
    </div>
  );
}

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ message: 'Could not copy — select the text and copy manually.', variant: 'error' });
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Copied to clipboard' : label}
      className="inline-flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
    >
      {copied ? <Check className="h-3 w-3" aria-hidden /> : <Copy className="h-3 w-3" aria-hidden />}
      <span aria-hidden>{copied ? 'Copied' : label}</span>
      <span role="status" className="sr-only">
        {copied ? 'Copied to clipboard' : ''}
      </span>
    </button>
  );
}
