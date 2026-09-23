'use client';

import React from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import { evidenceRepo } from '@/lib/data';
import type { StepEvidence } from '@/lib/data';
import { useClientStore } from '@/lib/useClientStore';
import { foldAttempt, scoreOutput, sha256Text } from '@/lib/evidenceLedger';

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
export function OutputVerify({ verify, ledger }: { verify: string[]; ledger?: LedgerRef }) {
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
