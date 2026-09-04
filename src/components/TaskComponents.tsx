'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
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
  BookOpen,
  FileCheck2,
  Sparkles,
  SquarePen,
} from 'lucide-react';
import { FolderNode, Step } from '@/lib/types';
import { procedureTitle } from '@/lib/docs/serverProcedures';
import { getFrameworkColor, getFrameworkLabel } from '@/lib/utils';
import { useLabAccess, fillPlaceholders, hasLabAccess, hasUnfilled, labProfile } from '@/lib/labAccess';
import { deliverableIdByTitle, deliverableIdByFile } from '@/lib/docs/definitions';
import { evidenceRepo } from '@/lib/data';
import type { StepEvidence } from '@/lib/data';
import { useClientStore } from '@/lib/useClientStore';
import { foldAttempt, scoreOutput, sha256Text } from '@/lib/evidenceLedger';
import { splitCommand } from '@/lib/commands';
import { toast } from './ui/Toast';
import { StepFlow } from './diagrams/StepFlow';
import { TreeNode } from './docs/FolderTree';
import { GlossaryText } from './GlossaryText';
import { WazuhWalkthrough } from './diagrams/WazuhWalkthrough';
import { AnnotatedTerminal, OutcomeCard, StepImages } from './StepOutcome';
import { buildTargets, looksLikeConsoleOutput } from '@/lib/stepOutcome';
import { Collapsible } from './ui/Button';

/** A file `source` that reads as a shell command (so we render a copyable line)
 *  rather than prose or a URL. Matches common lab CLI verbs at the start. */
function isCommandLike(source: string): boolean {
  return /^(git|sudo|curl|wget|apt|apt-get|dnf|yum|docker|python3?|pip3?|npm|ssh|scp|tar|unzip|chmod|mkdir|cd|cp|mv|cat|echo|bash|sh|powershell|msiexec|choco|Invoke-)\b/.test(
    source.trim()
  );
}

function isUrl(source: string): boolean {
  // Root-relative paths count too: course downloads (starter packs, guide
  // PDFs) are served from /downloads/ on this same host, and rendering them
  // as plain text instead of a link made the file unreachable from the step.
  const s = source.trim();
  return /^https?:\/\//i.test(s) || s.startsWith('/');
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
    locked: 'bg-panel-2 text-muted',
    ready: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    passed: 'bg-ok-soft text-ok',
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
      <div className="mt-3 h-2 w-full rounded-full bg-line">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${completionPercent}%` }}
          transition={{ duration: 0.5 }}
          className="h-full rounded-full bg-accent"
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
/** Identifies the step whose verification record should be written. Omitted in
 *  read-only views (another role's task), where pasting must not record anything. */
export interface LedgerRef {
  courseId: string;
  taskId: string;
  stepId: string;
  memberId: string;
}

/**
 * Real-tool self-verification: the student pastes their ACTUAL command output and
 * the step turns green only when every expected token is present.
 *
 * The verdict is now RECORDED, not just rendered. Until this was wired up the
 * check was a dead end — the pasted text, the pass/fail and the whole reason to
 * bother all lived in local state and vanished on unmount, so a finished capstone
 * was indistinguishable from a column of ticked boxes.
 *
 * What gets stored is the SHA-256 of the pasted text plus the match counts —
 * never the text itself, which routinely carries internal IPs and credentials.
 * That keeps the record tamper-evident (re-produce the output and it must hash
 * identically) without the platform holding anything sensitive.
 *
 * The claim this supports is exactly "output matching the expected tokens was
 * pasted, hashed and timestamped" — not that the command truly ran. The wording
 * below says that and no more.
 */
function OutputVerify({ verify, ledger }: { verify: string[]; ledger?: LedgerRef }) {
  const [text, setText] = React.useState('');
  const touched = text.trim().length > 0;
  const score = scoreOutput(text, verify);
  const missing = new Set(score.missing.map((m) => m.toLowerCase()));

  // The stored record, so a verified step still reads as verified after a reload
  // or after the guided view unmounts and remounts this step.
  const prior = useClientStore<StepEvidence | null>(
    () =>
      ledger
        ? evidenceRepo.getSteps(ledger.courseId, ledger.memberId)[
            `${ledger.taskId}::${ledger.stepId}`
          ] ?? null
        : null,
    null
  );

  const allOk = touched && score.allMatched;
  const previouslyVerified = !!prior?.verified;

  // Record on a debounce rather than per keystroke: hashing is async and a paste
  // arrives as one change, so this writes one attempt per real attempt instead of
  // one per character. `lastRecorded` stops an identical re-record inflating the
  // attempt count.
  const lastRecorded = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!ledger || !touched) return;
    if (lastRecorded.current === text) return;
    const timer = setTimeout(() => {
      const snapshot = text;
      void sha256Text(snapshot).then((outputSha256) => {
        lastRecorded.current = snapshot;
        evidenceRepo.saveStep(
          ledger.memberId,
          foldAttempt(prior ?? undefined, {
            courseId: ledger.courseId,
            taskId: ledger.taskId,
            stepId: ledger.stepId,
            score: scoreOutput(snapshot, verify),
            outputSha256,
            at: Date.now(),
          })
        );
      });
    }, 800);
    return () => clearTimeout(timer);
    // `prior` is intentionally read fresh inside the timer via closure; including
    // it here would restart the debounce on our own write.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, touched, ledger?.courseId, ledger?.taskId, ledger?.stepId, ledger?.memberId]);

  return (
    <div className="rounded-md border border-line bg-panel p-2">
      <label className="eyebrow-muted">
        Verify — paste your actual output
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        spellCheck={false}
        placeholder="Paste what your terminal printed…"
        className="mt-1 w-full rounded border border-line bg-panel-2 p-2 font-mono text-xs text-ink"
      />
      {touched && (
        <div className={`mt-1.5 flex items-center gap-1.5 text-sm font-medium ${allOk ? 'text-ok' : 'text-warn'}`}>
          {allOk ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {allOk
            ? 'Verified — your output matches. Recorded and hashed.'
            : `Not matching yet (${score.matched}/${score.total}) — check the command ran on the right target.`}
        </div>
      )}
      {/* Already proved it earlier: say so rather than showing an empty box that
          implies the work was never done. */}
      {!touched && previouslyVerified && (
        <div className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-ok">
          <Check className="h-4 w-4" />
          Verified earlier{prior?.verifiedAt ? ` on ${new Date(prior.verifiedAt).toLocaleDateString()}` : ''} — recorded.
        </div>
      )}
      {/* The tokens are shown up front, not only after a failed paste: they are
          what the student is looking for, so hiding them until they get it wrong
          withheld exactly the information that makes the check doable. */}
      <div className="mt-1.5">
        <div className="mb-1 text-[11px] font-medium text-muted">
          {touched ? 'Looking for:' : 'Your output must contain:'}
        </div>
        <div className="flex flex-wrap gap-1">
          {verify.map((tok) => {
            const ok = touched && !missing.has(tok.toLowerCase());
            return (
              <span
                key={tok}
                className={`rounded px-1.5 py-0.5 font-mono text-[11px] ${
                  ok
                    ? 'bg-ok-soft text-ok'
                    : 'bg-panel-2 text-muted'
                }`}
              >
                {touched ? (ok ? '✓' : '○') : '•'} {tok}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function StepDetail({
  instruction,
  instructionList,
  paths,
  guideRef,
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
  danger,
  troubleshooting,
  fixes,
  verify,
  ledger,
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
  paths?: { label: string; when: string; steps: string[] }[];
  guideRef?: Step['guideRef'];
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
  danger?: string;
  troubleshooting?: string;
  fixes?: { symptom: string; fix: string }[];
  verify?: string[];
  /** Set to record the verification result. Omitted in read-only views. */
  ledger?: LedgerRef;
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

      {/* Pre-setup the step silently depends on: the files/downloads/configs that
          have to exist first, so a missing one is a visible prerequisite, not a
          confusing failure. A `source` that looks like a shell command is copyable. */}
      {files && files.length > 0 && (
        <div className="rounded-md border border-accent/30 bg-accent-soft px-3 py-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Download className="h-4 w-4 shrink-0 text-accent" />
            Files you&apos;ll need first
          </div>
          <ul className="mt-1.5 space-y-1.5">
            {files.map((f) => (
              <li key={f.name} className="text-sm text-ink">
                <span className="font-semibold">{f.name}</span>
                <span className="text-body"> — {f.purpose}</span>
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
                      className="mt-0.5 block break-all text-xs font-medium text-accent underline"
                    >
                      {f.source}
                    </a>
                  ) : (
                    <div className="mt-0.5 text-xs text-accent">{f.source}</div>
                  ))}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Read before anything else in the step: this one is destructive. It sits
          above the instructions rather than beside them because a warning a
          student meets after the keystrokes has already failed. */}
      {danger && (
        <div className="flex items-start gap-2 rounded-lg border-2 border-warn-line bg-warn-soft px-3 py-2.5">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warn" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-warn">
              Stop and read this first
            </p>
            <p className="mt-0.5 text-sm font-medium text-ink">
              <GlossaryText text={danger} keys />
            </p>
          </div>
        </div>
      )}

      {/* A tiny node→arrow→node "follow the path" for this step, when authored. */}
      {path && path.length > 0 && <StepFlow path={path} />}

      {/* What the step should leave on disk — a small example directory tree. */}
      {tree && (
        <div>
          <div className="eyebrow-muted">
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
              <div className="eyebrow-muted">
                What to do
              </div>
              {where && (
                <div className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-line bg-panel-2 px-2 py-1 font-mono text-[10px] text-muted">
                  <span className="font-semibold text-accent">WHERE</span> {where}
                </div>
              )}
              {(instruction || description) && (
                <div className="mt-1 text-sm text-body">
                  <GlossaryText text={instruction || description || ''} keys />
                </div>
              )}
              {/* The discrete actions, one press away.
                  These lists are the single biggest block of text in the course
                  — 5,157 words across the four seeds, 57% of everything visible
                  in Server+ Week 1 — and every one of them was rendered open, so
                  a student read every click of every step before doing anything.
                  The instruction above says what to do; this says exactly how,
                  for whoever needs it. Nothing is removed. */}
              {((instructionList && instructionList.length > 0) || (paths && paths.length > 0)) && (
                <StepSteps items={instructionList} paths={paths} />
              )}
              {/* Steps say WHAT, the guide says HOW. Where the click-list used
                  to be a copy of a procedure in the configuration guide, this
                  one row replaces it: the Guide opens on that procedure's week
                  with the article scrolled into view (ServerConfigGuide reads
                  the hash). One home for configuration detail, not two. */}
              {guideRef && (
                <Link
                  href={`/courses/${courseId}/guide#${guideRef.procedureId}`}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent-soft px-2.5 py-1.5 text-sm font-medium text-accent-ink hover:border-accent"
                >
                  <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
                  <span>
                    <span className="text-muted">Exact clicks: </span>
                    {guideRef.label ?? procedureTitle(guideRef.procedureId)} →
                  </span>
                </Link>
              )}
            </div>
          )}
          {hasCommand && <CommandBlock commands={cmdList} />}
        </div>

        <div className="space-y-2">
          {(expectedOutput || outputExplanation || walkthrough || images) && (
            <div>
              <div className="eyebrow-muted">
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
                      <p className="mt-1 text-sm text-muted">
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
                <p className="mt-1 text-sm text-muted">
                  <GlossaryText text={outputExplanation} />
                </p>
              )}
            </div>
          )}
          {/* No `hasCommand` guard: a dashboard step has verify tokens too, and
              gating on a command silently hid the check on every GUI step. */}
          {verify && verify.length > 0 && <OutputVerify verify={verify} ledger={ledger} />}
        </div>
      </div>

      {/* The step's exit action, one line: where to record it, what it saves
          as, and the evidence-chain link. This replaced two stacked callout
          cards — a ~33-word "fill this in the website form" card and a ~27-word
          "save your evidence" card — that repeated identical wording on 12 of
          Server+ Week 1's 13 steps: 720 words of the same two sentences, 39% of
          everything on the tab that wasn't a step. The three deep links they
          carried all survive (`?form=`, `?tool=evidence` are guard-asserted
          targets); only the boilerplate went. Sitting after the do/see grid
          also puts `danger` genuinely first on the destructive steps — the old
          form card rendered above the warning. */}
      {(usesForm || deliverable) && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-line bg-panel-2 px-3 py-1.5 text-xs text-muted">
          {usesForm && (
            <Link
              href={`/courses/${courseId}/docs${(() => {
                const id = deliverableIdByTitle(usesForm, courseId);
                return id ? `?form=${id}` : '';
              })()}`}
              className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
            >
              <SquarePen className="h-3.5 w-3.5" /> Record in: {usesForm} →
            </Link>
          )}
          {usesForm && deliverable && <span aria-hidden>·</span>}
          {deliverable && (
            <>
              <span>
                saves as <span className="font-mono text-ink">{deliverable}</span>
              </span>
              <span aria-hidden>·</span>
              <Link
                href={`/courses/${courseId}/docs?tool=evidence`}
                className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
              >
                <FileCheck2 className="h-3.5 w-3.5" /> Hash &amp; log →
              </Link>
              {!usesForm &&
                (() => {
                  // On a form-backed deliverable-only step this is the only
                  // route from the step to its form — Security+ has 20 such
                  // steps. With `usesForm` set, the Record-in link above is
                  // the same destination, so this would be a duplicate.
                  const formId = deliverableIdByFile(deliverable, courseId);
                  return formId ? (
                    <Link
                      href={`/courses/${courseId}/docs?form=${formId}`}
                      className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
                    >
                      <SquarePen className="h-3.5 w-3.5" /> Open the form →
                    </Link>
                  ) : null;
                })()}
            </>
          )}
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
                  <p className="text-sm text-muted">
                    <span className="font-semibold text-body">Why: </span>
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

    </div>
  );
}

interface ChecklistItemProps {
  stepId: string;
  title: string;
  instruction?: string;
  instructionList?: string[];
  paths?: { label: string; when: string; steps: string[] }[];
  guideRef?: Step['guideRef'];
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
  danger?: string;
  troubleshooting?: string;
  fixes?: { symptom: string; fix: string }[];
  verify?: string[];
  /** Set to record the verification result. Omitted in read-only views. */
  ledger?: LedgerRef;
  optional?: boolean;
  where?: string;
  path?: string[];
  files?: { name: string; purpose: string; source?: string }[];
  tree?: FolderNode;
  walkthrough?: Step['walkthrough'];
  images?: Step['images'];
  outputHighlights?: Step['outputHighlights'];
  outputKind?: Step['outputKind'];
  /** Force the detail panel open/closed. Defaults to closed — a checklist is
   *  rows, not bodies; the caller opens the first incomplete step. */
  defaultOpen?: boolean;
  /** 1-based position rendered as a mono "1." before the title. */
  number?: number;
}

export function ChecklistItem({
  title,
  instruction,
  instructionList,
  paths,
  guideRef,
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
  danger,
  troubleshooting,
  fixes,
  verify,
  ledger,
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
  number,
}: ChecklistItemProps) {
  // Closed is the default: a checklist is rows you can scan and tick, and the
  // old default (every incomplete step open) meant opening a task dumped every
  // step body at once — the opposite. The caller opens exactly one row, the
  // first incomplete step at mount, so "resume where you were" still works.
  const [showDetails, setShowDetails] = React.useState(defaultOpen ?? false);
  const panelId = React.useId();

  return (
    // Stratum 3: a step gets a seam line, not a third nested box. Stacking a
    // third border inside week -> task -> step is what made a week read as an
    // undifferentiated wall.
    <div
      // `layout` used to sit here. Without a LayoutGroup coordinating them it
      // animated nothing, and it made every one of a task's steps re-measure on
      // every global store event — which fires on each keystroke and each tick.
      data-done={isComplete ? 'true' : 'false'}
      className="stratum-step py-3"
    >
      <div className="flex items-start gap-4">
        <motion.input
          type="checkbox"
          checked={isComplete}
          onChange={(e) => onToggle(e.target.checked)}
          whileHover={{ scale: 1.1 }}
          className="mt-1 h-6 w-6 cursor-pointer accent-[var(--color-accent)]"
        />
        <div className="flex-1">
          <motion.div className="flex items-center justify-between gap-2">
            <h4 className={`flex items-center gap-2 font-medium ${isComplete ? 'line-through text-muted' : 'text-ink'}`}>
              {number != null && (
                <span className="font-mono text-xs font-semibold text-muted no-underline">{number}.</span>
              )}
              {title}
              {optional && (
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-700 no-underline dark:bg-violet-900/40 dark:text-violet-300">
                  Optional
                </span>
              )}
            </h4>
            <motion.button
              onClick={() => setShowDetails(!showDetails)}
              aria-expanded={showDetails}
              aria-controls={panelId}
              className="-my-1 flex shrink-0 items-center gap-1 px-1 py-2 text-sm text-accent hover:text-accent-strong"
            >
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showDetails ? 'Hide' : 'Details'}
            </motion.button>
          </motion.div>

          {/* The step's authored one-liner. It was dead weight for two rounds —
              `instruction || description` in the body means a step with both
              never showed it (743 words across the four seeds, unreachable).
              As the collapsed row's subtitle it does exactly what it was
              written for: says what the step is without opening it. */}
          {description && !showDetails && (
            <p className="mt-0.5 line-clamp-1 text-xs text-muted">{description}</p>
          )}

          {isComplete && (
            <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} className="mt-1 flex items-center gap-1 text-sm text-ok">
              <Check className="h-4 w-4" /> Completed
            </motion.div>
          )}

          {/* The same bug the Collapsible primitive had: this animated
              `height: auto → 0` while setting `hidden` (display: none) on the
              SAME render, so the closing animation played against an element
              already removed from layout — nobody has ever seen this panel
              close. `hidden` was correct in intent (a collapsed step must not
              be tabbable, and must not be found by Ctrl-F), so AnimatePresence
              takes over the lifetime instead: it really unmounts, once it has
              finished closing. The id stays on the wrapper so `aria-controls`
              always resolves. */}
          <div id={panelId}>
            <AnimatePresence initial={false}>
              {showDetails && (
                <motion.div
                  key="detail"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 border-t border-line pt-3">
                    <StepDetail
                      instruction={instruction}
                      instructionList={instructionList}
                      paths={paths}
                      guideRef={guideRef}
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
                      danger={danger}
                      troubleshooting={troubleshooting}
                      fixes={fixes}
                      verify={verify}
                      ledger={ledger}
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
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
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
  // confusing failure. Points them at the Lab access panel that fills it in, so
  // it is gated on the course HAVING one: a course with an empty lab profile
  // renders no panel (LabAccessPanel returns null), and the #lab-access anchor
  // it links to does not exist there. Same rule CommandTroubleshooting applies
  // to its "still shows 10.10.100.X" row.
  const stillUnfilled = hasLabAccess(courseId) && list.some((c) => hasUnfilled(c.cmd));
  // Name the placeholder THIS course uses. Hardcoding the attack lab's
  // 10.10.100.X told a Server+ student to go and set a "target IP" that their
  // course does not have and their panel never offered.
  const exampleToken = labProfile(courseId).fields[0]?.tokens[0] ?? '<YOUR_TARGET_IP>';
  // Lower-case only the first letter: the labels start with "Your …", and
  // lower-casing the lot turned "Your Proxmox host address" into "proxmox".
  const rawLabel = labProfile(courseId).fields[0]?.label ?? 'Your target IP';
  const exampleLabel = rawLabel.charAt(0).toLowerCase() + rawLabel.slice(1);

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className="eyebrow-muted">
          {multi ? `Commands · run one at a time` : 'Command'}
        </div>
        {multi && <CopyButton text={allText} label="Copy all" />}
      </div>
      {stillUnfilled && (
        <Link
          href={`/courses/${courseId}#lab-access`}
          className="mt-1 flex items-start gap-1.5 rounded-md border border-warn-line bg-warn-soft px-2.5 py-1.5 text-xs text-ink transition-colors hover:opacity-80"
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            This still shows a placeholder like <span className="font-mono">{exampleToken}</span>. Set{' '}
            {exampleLabel} in <span className="font-semibold underline">Lab access</span> and it fills in
            automatically.
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
        <p className="mt-1 flex gap-1.5 pl-1 text-xs text-muted">
          <CornerDownRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" />
          <span>{c.explain}</span>
        </p>
      )}
      {hasFlags && (
        <div className="mt-1 pl-6">
          <button
            type="button"
            onClick={() => setShowFlags((v) => !v)}
            aria-expanded={showFlags}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-ok hover:opacity-80"
          >
            {showFlags ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showFlags ? 'Hide the parts' : 'What each part means'}
          </button>
          {showFlags && (
            <ul className="mt-1 space-y-0.5">
              {c.flags!.map((f) => (
                <li key={f.flag} className="flex gap-2 text-xs text-muted">
                  <code className="shrink-0 font-mono font-semibold text-ok">
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

/**
 * The numbered click-path for a step, behind one press.
 *
 * The count is in the label on purpose: "Show the 7 steps" tells a student how
 * much is behind the toggle before they commit to opening it, which a bare
 * "More info" does not. It matches the flag toggle in `CommandRow` rather than
 * `Collapsible`, whose full-width rule and indent read as a page section — wrong
 * weight for something sitting inside a half-width column.
 *
 * It opens closed every time, including for the step a student is currently on.
 * The instruction above it is the whole action for most steps; the list is for
 * the first time through, or when the short form was not enough.
 */
function NumberedSteps({ items }: { items: string[] }) {
  return (
    <ol className="mt-1.5 space-y-1.5 text-sm text-body">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-px shrink-0 font-mono text-xs font-semibold text-accent">
            {i + 1}.
          </span>
          <span>
            <GlossaryText text={item} keys />
          </span>
        </li>
      ))}
    </ol>
  );
}

function StepSteps({
  items,
  paths,
}: {
  items?: string[];
  paths?: { label: string; when: string; steps: string[] }[];
}) {
  const [open, setOpen] = React.useState(false);
  const count = paths?.length
    ? Math.max(...paths.map((p) => p.steps.length))
    : (items?.length ?? 0);
  const label = paths?.length
    ? `Show both ways — ${paths.length} paths, about ${count} steps each`
    : `Show the ${count} steps`;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="-my-1 inline-flex items-center gap-1 py-1.5 text-left text-[11px] font-medium text-accent hover:opacity-80"
      >
        {open ? <ChevronUp className="h-3 w-3 shrink-0" /> : <ChevronDown className="h-3 w-3 shrink-0" />}
        {open ? 'Hide the steps' : label}
      </button>
      {open && items && items.length > 0 && <NumberedSteps items={items} />}
      {/* Side by side on a wide screen, stacked on a phone — neither path is
          the default, because which one applies is decided by the card in the
          server, not by us. */}
      {open && paths && paths.length > 0 && (
        <div className="mt-2 grid gap-2 lg:grid-cols-2">
          {paths.map((p) => (
            <div key={p.label} className="rounded-md border border-line bg-panel-2 p-2.5">
              <div className="font-mono text-[11px] font-semibold text-ink">
                <GlossaryText text={p.label} keys />
              </div>
              <div className="mt-0.5 text-[11px] text-muted">{p.when}</div>
              <NumberedSteps items={p.steps} />
            </div>
          ))}
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
      className="inline-flex items-center gap-1 rounded bg-accent px-2 py-1 text-xs text-accent-contrast hover:bg-accent-strong"
    >
      {copied ? <Check className="h-3 w-3" aria-hidden /> : <Copy className="h-3 w-3" aria-hidden />}
      <span aria-hidden>{copied ? 'Copied' : label}</span>
      <span role="status" className="sr-only">
        {copied ? 'Copied to clipboard' : ''}
      </span>
    </button>
  );
}
