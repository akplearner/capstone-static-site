'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertTriangle,
  Check,
  Download,
  BookOpen,
  FileCheck2,
  Sparkles,
  SquarePen,
} from 'lucide-react';
import type { Step } from '@/lib/types';
import { procedureTitle } from '@/lib/docs/serverProcedures';
import { useCourseDocument } from '@/lib/useCourse';
import { proceduresOf } from '@/lib/content/read';
import { useIacTool } from '@/lib/labAccess';
import { applyIacTool } from '@/lib/iacTool';
import { deliverableIdByTitle, deliverableIdByFile } from '@/lib/docs/definitions';
import { evidenceRepo } from '@/lib/data';
import type { StepEvidence } from '@/lib/data';
import { useClientStore } from '@/lib/useClientStore';
import { foldAttempt, scoreOutput, sha256Text } from '@/lib/evidenceLedger';
import { StepFlow } from '@/components/diagrams/StepFlow';
import { TreeNode } from '@/components/docs/FolderTree';
import { GlossaryText } from '@/components/GlossaryText';
import { WazuhWalkthrough } from '@/components/diagrams/WazuhWalkthrough';
import { AnnotatedTerminal, OutcomeCard, StepImages } from '@/components/StepOutcome';
import { buildTargets, looksLikeConsoleOutput } from '@/lib/stepOutcome';
import { Collapsible } from '@/components/ui/Button';
import { StepNotes } from '@/components/StepNotes';
import { CommandBlock, CopyButton, type CommandEntry } from './CommandBlock';

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
 * The verdict is RECORDED, not just rendered. What gets stored is the SHA-256 of
 * the pasted text plus the match counts — never the text itself, which routinely
 * carries internal IPs and credentials. That keeps the record tamper-evident
 * without the platform holding anything sensitive. The claim this supports is
 * exactly "output matching the expected tokens was pasted, hashed and
 * timestamped" — not that the command truly ran. The wording says that and no more.
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
    <div className="rounded-md depth-edge bg-panel p-2">
      <label className="text-xs font-semibold text-muted">
        Verify — paste your actual output
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        spellCheck={false}
        placeholder="Paste what your terminal printed…"
        className="mt-1 w-full rounded bg-panel-2 p-2 font-mono text-xs text-ink"
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
        <div className="mb-1 text-2xs font-medium text-muted">
          {touched ? 'Looking for:' : 'Your output must contain:'}
        </div>
        <div className="flex flex-wrap gap-1">
          {verify.map((tok) => {
            const ok = touched && !missing.has(tok.toLowerCase());
            return (
              <span
                key={tok}
                className={`rounded px-1.5 py-0.5 font-mono text-2xs ${
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

/**
 * The body of one step: instruction, command, expected output, the deliverable
 * it produces, and — one press away — why it works and what to do when it does
 * not. Rendered by the guided step card, the show-all checklist row and the
 * read-only reference view of another role's task.
 *
 * R78-B: the visible set is the do → see → verify loop and nothing else — the
 * warning, what to do (with the click-list OPEN: for a GUI step the list IS the
 * instruction, and in guided mode it is one step's list, not a week's), the
 * command, what you should see, the paste-to-verify box, and where to record
 * it. ONE disclosure, "Details", holds the reasoning, the step-flow chain, the
 * file tree and the fixes. The density switch that used to make this two ways
 * to read a step is gone.
 *
 * R78-C1: it takes the `Step` itself. The 28-field prop list was hand-copied at
 * all three call sites, and the copies had drifted — `danger` was missing from
 * one of them for a round, which is the field that says "this erases every
 * drive". A step is one object; passing it as one object is how that class of
 * bug stops existing.
 */
export function StepDetail({
  step,
  ledger,
}: {
  step: Step;
  /** Set to record the verification result. Omitted in read-only views. */
  ledger?: LedgerRef;
}) {
  const { procedures } = proceduresOf(useCourseDocument());
  const {
    instruction,
    instructionList,
    paths,
    guideRef,
    description,
    command,
    commands,
    commandExplanation,
    commandFlags,
    expectedOutput: expectedOutputRaw,
    outputExplanation,
    whatItMeans,
    producesDeliverable: deliverable,
    usesForm,
    danger,
    troubleshooting,
    fixes,
    verify: verifyRaw,
    optional,
    where,
    path,
    files,
    tree,
    walkthrough,
    images,
    outputHighlights: outputHighlightsRaw,
    outputKind,
  } = step;
  const params = useParams();
  const courseId = typeof params?.courseId === 'string' ? params.courseId : Array.isArray(params?.courseId) ? params.courseId[0] : '';
  // Under OpenTofu the expected output and the verify tokens read `tofu plan`
  // and `OpenTofu v`, so what the student pastes is what the step expects.
  const tool = useIacTool(courseId);
  const expectedOutput = expectedOutputRaw && applyIacTool(expectedOutputRaw, tool);
  const verify = React.useMemo(() => verifyRaw?.map((v) => applyIacTool(v, tool)), [verifyRaw, tool]);
  const outputHighlights = React.useMemo(
    () => outputHighlightsRaw?.map((h) => ({ ...h, text: applyIacTool(h.text, tool) })),
    [outputHighlightsRaw, tool]
  );
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
        <div className="flex items-start gap-2 rounded-md border border-info-line bg-info-soft px-3 py-2">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-info" />
          <p className="text-sm text-ink">
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
            <p className="text-2xs font-semibold uppercase tracking-wide text-warn">
              Stop and read this first
            </p>
            <p className="mt-0.5 text-sm font-medium text-ink">
              <GlossaryText text={danger} keys />
            </p>
          </div>
        </div>
      )}

      {/* Essentials in two columns on desktop: left = do + command(s), right = see + meaning. */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-3">
          {(instruction || description || where) && (
            <div>
              <div className="text-xs font-semibold text-muted">
                What to do
              </div>
              {where && (
                <div className="mt-1 inline-flex items-center gap-1.5 rounded-md depth-edge bg-panel-2 px-2 py-1 font-mono text-3xs text-muted">
                  <span className="font-semibold text-accent">WHERE</span> {where}
                </div>
              )}
              {(instruction || description) && (
                <div className="mt-1 text-sm text-body">
                  <GlossaryText text={instruction || description || ''} keys />
                </div>
              )}
              {/* The discrete actions, open. The instruction above says what
                  to do; this says exactly how. It sat behind a "Show the N
                  steps" press for two rounds, which made the one line above
                  carry a whole GUI procedure on its own. */}
              {instructionList && instructionList.length > 0 && <NumberedSteps items={instructionList} />}
              {/* Side by side on a wide screen, stacked on a phone — neither
                  path is the default, because which one applies is decided by
                  the card in the server, not by us. */}
              {paths && paths.length > 0 && (
                <div className="mt-2 grid gap-2 lg:grid-cols-2">
                  {paths.map((p) => (
                    <div key={p.label} className="rounded-md depth-edge bg-panel-2 p-2.5">
                      <div className="font-mono text-2xs font-semibold text-ink">
                        <GlossaryText text={p.label} keys />
                      </div>
                      <div className="mt-0.5 text-2xs text-muted">{p.when}</div>
                      <NumberedSteps items={p.steps} />
                    </div>
                  ))}
                </div>
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
                    {guideRef.label ?? procedureTitle(guideRef.procedureId, procedures)} →
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
              <div className="text-xs font-semibold text-muted">
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
          {/* R68: the student's private note and the team-visible stuck flag.
              Only on a step that records — a read-only view of another role's
              task has nowhere to write. */}
          {ledger && <StepNotes ledger={ledger} />}
        </div>
      </div>

      {/* The step's exit action, one line: where to record it, what it saves
          as, and the evidence-chain link. Sitting after the do/see grid puts
          `danger` genuinely first on the destructive steps. */}
      {(usesForm || deliverable) && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md depth-edge bg-panel-2 px-3 py-1.5 text-xs text-muted">
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

      {/* The one disclosure at step level. The loop above is what a beginner
          needs to finish the step; this is for the student who wants to know
          why, who wants to see the path or the files it leaves, or who is
          stuck. Nothing is removed — it is not in the way. */}
      {(whatItMeans || troubleshooting || (fixes && fixes.length > 0) || (path && path.length > 0) || tree) && (
        <div className="rounded-md depth-edge bg-panel-2/50">
          <div className="px-3">
            <Collapsible
              title="Details"
              hint={[
                whatItMeans ? 'why this works' : '',
                path && path.length > 0 ? 'the path' : '',
                tree ? 'your files' : '',
                troubleshooting || (fixes && fixes.length > 0) ? 'if you get stuck' : '',
              ]
                .filter(Boolean)
                .join(' · ')}
            >
              <div className="space-y-3 pr-2">
                {/* A tiny node→arrow→node "follow the path" for this step. */}
                {path && path.length > 0 && <StepFlow path={path} />}
                {/* What the step should leave on disk — a small example tree. */}
                {tree && (
                  <div>
                    <div className="text-xs font-semibold text-muted">What your files should look like</div>
                    <ul className="mt-1.5 space-y-1 rounded-md depth-edge bg-panel-2 p-3">
                      <TreeNode node={tree} />
                    </ul>
                  </div>
                )}
                {whatItMeans && (
                  <p className="text-sm text-muted">
                    <span className="font-semibold text-body">Why: </span>
                    <GlossaryText text={whatItMeans} />
                  </p>
                )}
                {troubleshooting && (
                  <p className="flex gap-2 text-sm text-ink">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                    <span><span className="font-medium">If it doesn&apos;t work:</span> {troubleshooting}</span>
                  </p>
                )}
                {/* Independent failure modes, one row each — a student scanning
                    for their symptom has to be able to find it. */}
                {fixes && fixes.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm font-medium text-danger">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-danger" />
                      If it doesn&apos;t work
                    </div>
                    <ul className="space-y-1.5">
                      {fixes.map((f, i) => (
                        <li key={i} className="text-sm text-ink">
                          <span className="font-medium">{f.symptom}</span>{' '}
                          <span className="text-body">
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

/**
 * The numbered click-path for a step.
 *
 * Rendered open under the one-line instruction (R78-B): the line says what,
 * the list says exactly how, and a student who has opened a step is doing it.
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
