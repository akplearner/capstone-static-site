'use client';

import React from 'react';
import { AlertTriangle, Check, RefreshCw } from 'lucide-react';
import { evidenceRepo } from '@/lib/data';
import type { StepEvidence, VerificationReceipt } from '@/lib/data';
import { useClientStore } from '@/lib/useClientStore';
import { foldAttempt, scoreOutput, sha256Text } from '@/lib/evidenceLedger';
import { refreshStamp, requestReceipt, useServerStamp, type ReceiptOutcome } from '@/lib/stamps';

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
 *
 * R113: when the stamp was issued by the server (cloud mode), a full match
 * also asks for a receipt: the request carries the stamp, the step, the hash
 * and the counts — never the paste. "Receipted" means the server issued the
 * stamp and logged the match; it still says nothing about the machine.
 */
export function OutputVerify({
  verify,
  ledger,
  stamp,
}: {
  verify: string[];
  ledger?: LedgerRef;
  /** The member's task stamp (R84), when it is one of the expected tokens. It
   *  gets its own chip styling and a hint, because unlike the other tokens it
   *  is not something the tool prints — the student adds it. */
  stamp?: string;
}) {
  const [text, setText] = React.useState('');
  const touched = text.trim().length > 0;
  const score = scoreOutput(text, verify);
  const missing = new Set(score.missing.map((m) => m.toLowerCase()));

  // R113: only a stamp the server issued for this member's task is receipted.
  const server = useServerStamp(ledger?.memberId, ledger?.courseId ?? '', ledger?.taskId);
  const serverStamp = server && stamp === server.stamp ? server : null;
  // Read inside the debounce timer, which must not restart when the stamp changes.
  const serverRef = React.useRef(serverStamp);
  React.useEffect(() => {
    serverRef.current = serverStamp;
  });
  // The receipt's outcome, tied to the paste it was asked for.
  const [receipt, setReceipt] = React.useState<{ text: string; outcome: ReceiptOutcome | 'pending' } | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

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

  // R113: the platform's receipt for this step, if it logged one (none offline).
  const priorReceipt = useClientStore<VerificationReceipt | null>(
    () =>
      ledger
        ? evidenceRepo.getReceipts(ledger.courseId, ledger.memberId)?.[`${ledger.taskId}::${ledger.stepId}`] ?? null
        : null,
    null
  );

  const allOk = touched && score.allMatched;
  const previouslyVerified = !!prior?.verified;
  const outcome = touched && receipt?.text === text ? receipt.outcome : null;
  const notReceipted = allOk && (outcome === 'stamp-expired' || outcome === 'stamp-unknown');
  // The stamp is the token people forget: say so plainly when it is the only one missing.
  const onlyStampMissing = touched && !allOk && !!stamp && score.missing.length === 1 && score.missing[0].toLowerCase() === stamp.toLowerCase();
  const getFreshStamp = async () => {
    if (!ledger) return;
    setRefreshing(true);
    await refreshStamp(ledger.memberId, ledger.courseId, ledger.taskId);
    setRefreshing(false);
  };

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
        const scored = scoreOutput(snapshot, verify);
        evidenceRepo.saveStep(
          ledger.memberId,
          foldAttempt(prior ?? undefined, {
            courseId: ledger.courseId,
            taskId: ledger.taskId,
            stepId: ledger.stepId,
            score: scored,
            outputSha256,
            at: Date.now(),
          })
        );
        // R113: a full match under a server stamp asks for a receipt. The
        // request names the stamp, the step, the hash and the counts; the
        // paste itself stays here.
        const held = serverRef.current;
        if (!held || !scored.allMatched) return;
        setReceipt({ text: snapshot, outcome: 'pending' });
        void requestReceipt({
          userId: ledger.memberId,
          courseId: ledger.courseId,
          taskId: ledger.taskId,
          stepId: ledger.stepId,
          stamp: held.stamp,
          outputSha256,
          matchedTokens: scored.matched,
          totalTokens: scored.total,
        }).then((result) => setReceipt({ text: snapshot, outcome: result }));
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
            ? outcome === 'receipted'
              ? 'Verified — recorded, hashed and receipted (the server issued this stamp and logged the match).'
              : notReceipted
                ? 'Verified — recorded and hashed.'
                : 'Verified — your output matches. Recorded and hashed.'
            : onlyStampMissing
              ? `Only your stamp is missing (${score.matched}/${score.total}) — echo it after your command and paste again.`
              : `Not matching yet (${score.matched}/${score.total}) — check the command ran on the right target.`}
        </div>
      )}
      {/* R113: a match the server did not receipt still counts as verified;
          the line says why, and the button gets a stamp it will accept. */}
      {notReceipted && (
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-warn" data-receipt="not-receipted">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>Not receipted: the stamp had expired or was not recognised. Get a fresh stamp and paste again.</span>
          {ledger && (
            <button
              type="button"
              onClick={getFreshStamp}
              disabled={refreshing}
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-semibold text-accent-ink hover:bg-accent-soft disabled:opacity-60"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Get a fresh stamp
            </button>
          )}
        </div>
      )}
      {/* Already proved it earlier: say so rather than showing an empty box that
          implies the work was never done. */}
      {!touched && previouslyVerified && (
        <div className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-ok">
          <Check className="h-4 w-4" />
          Verified earlier{prior?.verifiedAt ? ` on ${new Date(prior.verifiedAt).toLocaleDateString()}` : ''} — {priorReceipt ? 'recorded and receipted.' : 'recorded.'}
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
            const isStamp = tok === stamp;
            return (
              <span
                key={tok}
                title={
                  isStamp
                    ? serverStamp
                      ? 'Your stamp, issued by the server for this task: a match is receipted (the stamp, the step and the hash, never the output).'
                      : 'Your stamp — it ties this paste to you and this task.'
                    : undefined
                }
                className={`rounded px-1.5 py-0.5 font-mono text-2xs ${
                  ok
                    ? 'bg-ok-soft text-ok'
                    : isStamp
                      ? 'bg-accent-soft text-accent-ink'
                      : 'bg-panel-2 text-muted'
                }`}
              >
                {touched ? (ok ? '✓' : '○') : '•'} {isStamp ? `${tok} (your stamp)` : tok}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
