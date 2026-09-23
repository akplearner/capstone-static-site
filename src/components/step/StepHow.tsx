'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, FileCheck2, SquarePen } from 'lucide-react';
import type { Step } from '@/lib/types';
import { procedureTitle } from '@/lib/docs/serverProcedures';
import { useCourseDocument } from '@/lib/useCourse';
import { proceduresOf } from '@/lib/content/read';
import { useIacTool } from '@/lib/labAccess';
import { applyIacTool } from '@/lib/iacTool';
import { deliverableIdByTitle, deliverableIdByFile } from '@/lib/docs/definitions';
import { GlossaryText } from '@/components/GlossaryText';
import { WazuhWalkthrough } from '@/components/diagrams/WazuhWalkthrough';
import { AnnotatedTerminal, OutcomeCard, StepImages } from '@/components/StepOutcome';
import { buildTargets, looksLikeConsoleOutput } from '@/lib/stepOutcome';
import { StepNotes } from '@/components/StepNotes';
import { CommandBlock, type CommandEntry } from './CommandBlock';
import { OutputVerify, type LedgerRef } from './OutputVerify';

/** Does this step have a second tier at all? A step that is one sentence has none. */
export function hasHow(step: Step): boolean {
  return !!(
    step.instructionList?.length ||
    step.paths?.length ||
    step.guideRef ||
    step.command ||
    step.commands?.length ||
    step.expectedOutput ||
    step.outputExplanation ||
    step.walkthrough ||
    step.images ||
    step.verify?.length ||
    step.usesForm ||
    step.producesDeliverable
  );
}

/** What the closed bar says the tier holds — the counts a student weighs before opening it. */
export function howHint(step: Step): string {
  const actions = (step.instructionList?.length ?? 0) + (step.paths ?? []).reduce((n, p) => n + p.steps.length, 0);
  const commands = step.commands?.length ?? (step.command ? 1 : 0);
  return [
    actions ? `${actions} action${actions === 1 ? '' : 's'}` : '',
    commands ? `${commands} command${commands === 1 ? '' : 's'}` : '',
    step.expectedOutput || step.walkthrough || step.images ? 'what you should see' : '',
    step.verify?.length ? 'verify' : '',
    step.usesForm || step.producesDeliverable ? 'where to record it' : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

/**
 * Tier 1 of a step — how to do it: the numbered actions, the commands, what
 * the screen should show, the paste-to-verify box, and where to record it.
 * One click away from the one-line instruction (R79), which is what students
 * asked for: the command hidden until they want it.
 */
export function StepHow({ step, ledger, courseId }: { step: Step; ledger?: LedgerRef; courseId: string }) {
  const { procedures } = proceduresOf(useCourseDocument());
  const {
    instructionList,
    paths,
    guideRef,
    command,
    commands,
    commandExplanation,
    commandFlags,
    expectedOutput: expectedOutputRaw,
    outputExplanation,
    producesDeliverable: deliverable,
    usesForm,
    verify: verifyRaw,
    walkthrough,
    images,
    outputHighlights: outputHighlightsRaw,
    outputKind,
  } = step;
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
  // For a legacy single-command step, fold its explanation + flags INTO the
  // command block so the help shows in one place.
  const cmdList: CommandEntry[] | undefined = usingStructured
    ? commands
    : command
      ? [{ cmd: command, explain: commandExplanation, flags: commandFlags }]
      : undefined;
  // The tokens worth pointing at inside the expected output. `verify` already
  // names the substrings that prove the step worked, so they're targets for
  // free; outputHighlights supplies the wording (and any extra tokens).
  const outputTargets = React.useMemo(() => buildTargets(verify, outputHighlights), [verify, outputHighlights]);
  const isConsole = outputKind ? outputKind === 'console' : !!expectedOutput && looksLikeConsoleOutput(expectedOutput);

  return (
    <div className="space-y-3 pr-2">
      {/* Essentials in two columns on desktop: left = do + command(s), right = see + verify. */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-3">
          {(instructionList?.length || paths?.length || guideRef) && (
            <div>
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
              {/* Steps say WHAT, the guide says HOW: the Guide opens on that
                  procedure's week with the article scrolled into view. */}
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
              <div className="text-xs font-semibold text-muted">What you should see</div>
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
                  <OutcomeCard text={expectedOutput} targets={outputTargets} explanation={outputExplanation} />
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
          as, and the evidence-chain link. */}
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
              <Link href={`/courses/${courseId}/docs?tool=evidence`} className="inline-flex items-center gap-1 font-medium text-accent hover:underline">
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
                    <Link href={`/courses/${courseId}/docs?form=${formId}`} className="inline-flex items-center gap-1 font-medium text-accent hover:underline">
                      <SquarePen className="h-3.5 w-3.5" /> Open the form →
                    </Link>
                  ) : null;
                })()}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** The numbered click-path for a step: the line above says what, this says exactly how. */
function NumberedSteps({ items }: { items: string[] }) {
  return (
    <ol className="mt-1.5 space-y-1.5 text-sm text-body">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-px shrink-0 font-mono text-xs font-semibold text-accent">{i + 1}.</span>
          <span>
            <GlossaryText text={item} keys />
          </span>
        </li>
      ))}
    </ol>
  );
}
