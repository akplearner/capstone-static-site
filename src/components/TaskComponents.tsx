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
import { FolderNode, Step } from '@/lib/types';
import { getFrameworkColor, getFrameworkLabel } from '@/lib/utils';
import { useLabAccess, fillPlaceholders, hasUnfilled } from '@/lib/labAccess';
import { deliverableIdByTitle, deliverableIdByFile } from '@/lib/docs/definitions';
import { splitCommand } from '@/lib/commands';
import { toast } from './ui/Toast';
import { StepFlow } from './diagrams/StepFlow';
import { TreeNode } from './docs/FolderTree';
import { GlossaryText } from './GlossaryText';
import { WazuhWalkthrough } from './diagrams/WazuhWalkthrough';
import { AnnotatedTerminal, OutcomeCard, StepImages } from './StepOutcome';
import { buildTargets, looksLikeConsoleOutput } from '@/lib/stepOutcome';
import { Collapsible } from './ui/Button';
import { TerminalBasics } from './docs/CommandTroubleshooting';

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
      {/* The tokens are shown up front, not only after a failed paste: they are
          what the student is looking for, so hiding them until they get it wrong
          withheld exactly the information that makes the check doable. */}
      <div className="mt-1.5">
        <div className="mb-1 text-[11px] font-medium text-gray-500 dark:text-gray-400">
          {touched ? 'Looking for:' : 'Your output must contain:'}
        </div>
        <div className="flex flex-wrap gap-1">
          {results.map((r) => (
            <span
              key={r.tok}
              className={`rounded px-1.5 py-0.5 font-mono text-[11px] ${
                touched && r.ok
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {touched ? (r.ok ? '✓' : '○') : '•'} {r.tok}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StepDetail({
  instruction,
  instructionList,
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
  fixes,
  verify,
  optional,
  where,
  path,
  files,
  tree,
  walkthrough,
  images,
  outputHighlights,
  outputKind,
}: {
  instruction?: string;
  instructionList?: string[];
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
  fixes?: { symptom: string; fix: string }[];
  verify?: string[];
  optional?: boolean;
  where?: string;
  path?: string[];
  files?: { name: string; purpose: string; source?: string }[];
  tree?: FolderNode;
  walkthrough?: Step['walkthrough'];
  images?: Step['images'];
  outputHighlights?: Step['outputHighlights'];
  outputKind?: Step['outputKind'];
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
  // The tokens worth pointing at inside the expected output. `verify` already
  // names the substrings that prove the step worked, so they're targets for
  // free; outputHighlights supplies the wording (and any extra tokens).
  const outputTargets = React.useMemo(
    () => buildTargets(verify, outputHighlights),
    [verify, outputHighlights]
  );
  const isConsole = outputKind
    ? outputKind === 'console'
    : !!expectedOutput && looksLikeConsoleOutput(expectedOutput);
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
              {/* The discrete actions. A step whose instruction is really a
                  sequence reads as a list, not a paragraph in a half-width column. */}
              {instructionList && instructionList.length > 0 && (
                <ol className="mt-2 space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
                  {instructionList.map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-px shrink-0 font-mono text-xs font-semibold text-accent">
                        {i + 1}.
                      </span>
                      <span><GlossaryText text={item} /></span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
          {hasCommand && <CommandBlock commands={cmdList} />}
        </div>

        <div className="space-y-2">
          {(expectedOutput || outputExplanation || walkthrough || images) && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                What you should see
              </div>
              {/* A GUI step shows the screen itself, with the thing to click or
                  read called out by number — that beats describing it in words. */}
              {walkthrough && <WazuhWalkthrough data={walkthrough} />}
              {images && <StepImages images={images} />}
              {expectedOutput &&
                (isConsole ? (
                  <>
                    <AnnotatedTerminal text={expectedOutput} targets={outputTargets} />
                    {outputExplanation && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        <GlossaryText text={outputExplanation} />
                      </p>
                    )}
                  </>
                ) : (
                  <OutcomeCard
                    text={expectedOutput}
                    targets={outputTargets}
                    explanation={outputExplanation}
                  />
                ))}
              {!expectedOutput && outputExplanation && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  <GlossaryText text={outputExplanation} />
                </p>
              )}
            </div>
          )}
          {/* No `hasCommand` guard: a dashboard step has verify tokens too, and
              gating on a command silently hid the check on every GUI step. */}
          {verify && verify.length > 0 && <OutputVerify verify={verify} />}
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

      {/* Go deeper — the reasoning and the "if it doesn't work" fix, one tap away.
          Core above is the do → see → verify loop a beginner needs to finish the
          step; a student who wants to understand *why*, or who is stuck, opens
          this. Nothing is removed — it's the same content, just not in the way of
          getting the step done. */}
      {(whatItMeans || troubleshooting || (fixes && fixes.length > 0)) && (
        <div className="rounded-md border border-line bg-panel-2/50">
          <div className="px-3">
            <Collapsible title="Why this works & if you get stuck">
              <div className="space-y-2 pr-2">
                {whatItMeans && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Why: </span>
                    <GlossaryText text={whatItMeans} />
                  </p>
                )}
                {troubleshooting && (
                  <p className="flex gap-2 text-sm text-rose-900 dark:text-rose-200">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    <span><span className="font-medium">If it doesn&apos;t work:</span> {troubleshooting}</span>
                  </p>
                )}
                {/* Independent failure modes, one row each — a student scanning
                    for their symptom has to be able to find it. */}
                {fixes && fixes.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm font-medium text-rose-900 dark:text-rose-200">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                      If it doesn&apos;t work
                    </div>
                    <ul className="space-y-1.5">
                      {fixes.map((f, i) => (
                        <li key={i} className="text-sm text-rose-900 dark:text-rose-200">
                          <span className="font-medium">{f.symptom}</span>{' '}
                          <span className="text-rose-800/90 dark:text-rose-200/80">
                            <GlossaryText text={f.fix} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Collapsible>
          </div>
        </div>
      )}

      {/* Absolute-beginner help at point of need: the terminal basics reference
          (open a terminal, paste, run, sudo) collapsed right on the step, instead
          of only on the Guide tab. Only on steps that actually have a command. */}
      {hasCommand && (
        <div className="rounded-md border border-line bg-panel-2/50">
          <div className="px-3">
            <Collapsible title="New to the terminal?">
              <div className="pr-2">
                <TerminalBasics />
              </div>
            </Collapsible>
          </div>
        </div>
      )}

    </div>
  );
}

interface ChecklistItemProps {
  stepId: string;
  title: string;
  instruction?: string;
  instructionList?: string[];
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
  fixes?: { symptom: string; fix: string }[];
  verify?: string[];
  optional?: boolean;
  where?: string;
  path?: string[];
  files?: { name: string; purpose: string; source?: string }[];
  tree?: FolderNode;
  walkthrough?: Step['walkthrough'];
  images?: Step['images'];
  outputHighlights?: Step['outputHighlights'];
  outputKind?: Step['outputKind'];
  /** Force the detail panel open/closed. Defaults to open only while the step is
   *  still incomplete, so a finished week reads as a short list of ticks. */
  defaultOpen?: boolean;
}

export function ChecklistItem({
  title,
  instruction,
  instructionList,
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
  fixes,
  verify,
  optional,
  where,
  path,
  files,
  tree,
  walkthrough,
  images,
  outputHighlights,
  outputKind,
  defaultOpen,
}: ChecklistItemProps) {
  // Steps you've already finished collapse; the one you're on stays open. Opening
  // every step at once was what made a week look like an undifferentiated wall.
  const [showDetails, setShowDetails] = React.useState(defaultOpen ?? !isComplete);

  return (
    // Stratum 3: a step gets a seam line, not a third nested box. Stacking a
    // third border inside week -> task -> step is what made a week read as an
    // undifferentiated wall.
    <motion.div
      layout
      data-done={isComplete ? 'true' : 'false'}
      className="stratum-step py-3"
    >
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
                instructionList={instructionList}
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
                fixes={fixes}
                verify={verify}
                optional={optional}
                where={where}
                path={path}
                files={files}
                tree={tree}
                walkthrough={walkthrough}
                images={images}
                outputHighlights={outputHighlights}
                outputKind={outputKind}
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
          <CommandRow key={i} c={c} index={i} multi={multi} />
        ))}
      </div>
    </div>
  );
}

/** One command: the copyable line + its one-line `explain` (both Core), with the
 *  flag-by-flag breakdown tucked behind a "what each part means" toggle so a
 *  command-heavy step stays short by default but every flag is one tap away. */
function CommandRow({ c, index, multi }: { c: CommandEntry; index: number; multi: boolean }) {
  const [showFlags, setShowFlags] = React.useState(false);
  const hasFlags = !!(c.flags && c.flags.length > 0);
  return (
    <div>
      <div
        className="relative rounded-lg p-3 pr-20 font-mono text-sm"
        style={{ background: 'var(--color-term-bg)', color: 'var(--color-term-tx)' }}
      >
        <div className="absolute right-2 top-2">
          <CopyButton text={c.cmd} />
        </div>
        {multi && (
          <span className="mr-2 select-none" style={{ color: 'var(--color-term-dim)' }}>{index + 1}</span>
        )}
        <HighlightedCommand cmd={c.cmd} />
      </div>
      {c.explain && (
        <p className="mt-1 flex gap-1.5 pl-1 text-xs text-gray-600 dark:text-gray-400">
          <CornerDownRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{c.explain}</span>
        </p>
      )}
      {hasFlags && (
        <div className="mt-1 pl-6">
          <button
            type="button"
            onClick={() => setShowFlags((v) => !v)}
            aria-expanded={showFlags}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            {showFlags ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showFlags ? 'Hide the parts' : 'What each part means'}
          </button>
          {showFlags && (
            <ul className="mt-1 space-y-0.5">
              {c.flags!.map((f) => (
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
      )}
    </div>
  );
}

// `TerminalOutput` used to live here, rendering expectedOutput in the exact same
// chrome as CommandBlock — same palette, same highlighter, same Copy button — so
// a described result read as one more thing to paste. Expected output is now
// rendered by kind in StepOutcome.tsx (AnnotatedTerminal / OutcomeCard).

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
