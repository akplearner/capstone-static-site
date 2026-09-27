'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, Lock, Send } from 'lucide-react';
import type { DeliverableData, DeliverableDef } from '@/lib/docs/types';
import type { StepEvidence, SubmissionProgress, SubmissionSnapshot } from '@/lib/data/types';
import { RUBRIC_CATEGORIES, evaluateBundle, stepsProducing, verdictOf, type BundleResult } from '@/lib/docs/deliverableRubric';
import { evidenceRepo, submissionsRepo } from '@/lib/data';
import { withoutSeedRows } from '@/lib/docs/definitions';
import { sha256Text } from '@/lib/evidenceLedger';
import { useClientStore, notifyStore, EMPTY_OBJECT, EMPTY_ARRAY } from '@/lib/useClientStore';
import { useCourse } from '@/lib/useCourse';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { toast } from '@/components/ui/Toast';

/**
 * The Expectations panel (R84): the four rubric words every course grades by,
 * live against what is typed. It calls the SAME `evaluateBundle` that freezes
 * the submission snapshot and that the cohort page reads, so what looks green
 * here is green everywhere — the panel is a preview of the grading, not a
 * second opinion.
 *
 * Failing checks are listed as hints; a category with nothing to check says
 * so out loud (rendering the note) rather than passing silently.
 */
export function ExpectationsPanel({
  def,
  data,
  week,
  memberId,
  teamId,
  instructorReview,
}: {
  def: DeliverableDef;
  data: DeliverableData;
  week: number;
  memberId: string;
  /** With a team, the panel also carries the Submit bar (R84 phase 3). */
  teamId?: string;
  /** The instructor's verdict on this form, if any — it outranks everything
   *  (`verdictOf` holds the precedence; this only feeds it). */
  instructorReview?: 'approved' | 'revise' | 'pending';
}) {
  const course = useCourse();
  // Live: a Verify box turning green upstairs flips Authenticity down here.
  const evidence = useClientStore<Record<string, StepEvidence>>(
    () => evidenceRepo.getSteps(course.id, memberId),
    EMPTY_OBJECT as Record<string, StepEvidence>
  );
  const steps = useMemo(() => stepsProducing(course, def), [course, def]);
  const result = evaluateBundle(def, data, { evidence, steps, week });

  return (
    <div className="rounded-lg depth-edge bg-panel-2 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink">What a passing document looks like</h3>
        {result.allGreen ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-ok-soft px-2 py-0.5 text-2xs font-semibold text-ok">
            <CheckCircle2 className="h-3 w-3" /> All four green
          </span>
        ) : (
          <span className="text-2xs text-muted">
            {Object.values(result.categories).filter((c) => c.ok).length}/4 green
          </span>
        )}
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {RUBRIC_CATEGORIES.map((cat) => {
          const c = result.categories[cat.id];
          const failing = c.items.filter((i) => !i.ok);
          return (
            <div key={cat.id} className="rounded-md depth-edge bg-panel px-2.5 py-2">
              <div className="flex items-center gap-1.5">
                {c.ok ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-ok" aria-hidden />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                )}
                <span className={`text-xs font-semibold ${c.ok ? 'text-ok' : 'text-ink'}`}>{cat.label}</span>
                {c.items.length > 0 && (
                  <span className="ml-auto font-mono text-3xs text-muted">
                    {c.items.filter((i) => i.ok).length}/{c.items.length}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-3xs text-muted">{def.rubric?.[cat.id] ?? cat.generic}</p>
              {c.note && <p className="mt-1 text-3xs italic text-muted">{c.note}</p>}
              {failing.length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {failing.slice(0, 4).map((i) => (
                    <li key={i.id} className="flex items-start gap-1 text-3xs text-body">
                      <span aria-hidden className="mt-px text-muted">
                        ○
                      </span>
                      {i.hint ?? i.label ?? i.id}
                    </li>
                  ))}
                  {failing.length > 4 && (
                    <li className="text-3xs text-muted">…and {failing.length - 4} more</li>
                  )}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      {teamId && (
        <SubmitBar def={def} data={data} week={week} memberId={memberId} teamId={teamId} result={result} instructorReview={instructorReview} />
      )}
      <p className="mt-2 text-3xs text-muted">
        These are the exact checks frozen into your submission and shown to your reviewers — strong
        self-verification with an audit trail, not surveillance.
      </p>
    </div>
  );
}

/**
 * Freeze and hand over (R84): enabled only when all four categories are green.
 * Submitting writes an APPEND-ONLY row — form data, check results, category
 * booleans, a sha256 — then asks the platform to assign two blind reviewers
 * from other teams. Fewer than two eligible (and always offline, where one
 * device has no peers) means the frozen checks themselves decide, labelled as
 * the platform's verdict. Resubmitting after edits is a new version; history
 * stays.
 */
function SubmitBar({
  def,
  data,
  week,
  memberId,
  teamId,
  result,
  instructorReview,
}: {
  def: DeliverableDef;
  data: DeliverableData;
  week: number;
  memberId: string;
  teamId: string;
  result: BundleResult;
  instructorReview?: 'approved' | 'revise' | 'pending';
}) {
  const course = useCourse();
  const { guard } = useRequireAuth();
  const [busy, setBusy] = useState(false);
  const cloud = isSupabaseConfigured();

  const submissions = useClientStore(
    () => submissionsRepo.list(course.id, teamId),
    EMPTY_ARRAY
  );
  const mine = submissions
    .filter((s) => s.deliverableId === def.id && s.week === week)
    .sort((a, b) => a.version - b.version);
  const latest = mine[mine.length - 1];
  const confirms = useClientStore(
    () => (latest ? submissionsRepo.reviewsFor(course.id, latest.id).map((r) => r.confirm) : EMPTY_ARRAY),
    EMPTY_ARRAY
  );

  // The anonymous counts, fetched per submission (cloud) — offline stays null
  // and the platform verdict speaks.
  const [progress, setProgress] = useState<SubmissionProgress | null>(null);
  useEffect(() => {
    if (!latest || !cloud) return;
    let on = true;
    void submissionsRepo.progress(latest.id).then((p) => on && setProgress(p));
    return () => {
      on = false;
    };
    // confirms.length: a review arriving over realtime refreshes the counts.
  }, [latest?.id, cloud, confirms.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = () => {
    if (!result.allGreen || busy) return;
    guard('submit this deliverable', () => {
      setBusy(true);
      void (async () => {
        const snapshot: SubmissionSnapshot = {
          deliverableId: def.id,
          week,
          data: withoutSeedRows(def, data),
          categories: {
            completeness: result.categories.completeness.ok,
            correctness: result.categories.correctness.ok,
            authenticity: result.categories.authenticity.ok,
            consistency: result.categories.consistency.ok,
          },
          checks: Object.values(result.categories).flatMap((c) => c.items.map((i) => ({ id: i.id, label: i.label, ok: i.ok }))),
        };
        const contentSha256 = await sha256Text(JSON.stringify(snapshot));
        const eligible = await submissionsRepo.submit({
          id: crypto.randomUUID(),
          courseId: course.id,
          teamId,
          deliverableId: def.id,
          week,
          version: (latest?.version ?? 0) + 1,
          submittedBy: memberId,
          contentSha256,
          snapshot,
          at: Date.now(),
        });
        setBusy(false);
        notifyStore();
        if (eligible === null && cloud) return; // the repo already toasted
        toast({
          message:
            eligible != null && eligible >= 2
              ? 'Frozen and sent to two blind reviewers from other teams.'
              : 'Frozen. Not enough eligible reviewers yet — the platform verdict stands until peers exist.',
          variant: 'success',
          duration: 6000,
        });
      })();
    });
  };

  // Verdict wording, phase-3 scope: the platform path (offline, or <2 peers)
  // and live counts. The instructor's override outranks this in the review
  // banner above the form; full verdict rendering is the review page's job.
  const assigned = progress?.assigned ?? 0;
  const verdict = latest
    ? verdictOf(latest.snapshot, confirms, cloud ? assigned : 0, instructorReview)
    : null;

  return (
    <div className="mt-2 border-t border-line pt-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 text-2xs text-muted">
          {latest ? (
            <>
              <span className="font-semibold text-ink">Submitted v{latest.version}</span>{' '}
              on {new Date(latest.at).toLocaleDateString()} · frozen{' '}
              <span className="font-mono">{latest.contentSha256.slice(0, 10)}…</span>
              {cloud && progress && (
                <span>
                  {' '}· {progress.reviewed}/{progress.assigned} reviews in · {progress.confirms} confirmed
                </span>
              )}
              {verdict?.startsWith('platform') && (
                <span className={verdict === 'platform_pass' ? 'font-semibold text-ok' : 'font-semibold text-warn'}>
                  {' '}· platform verdict: {verdict === 'platform_pass' ? 'PASS' : 'NEEDS WORK'}
                </span>
              )}
              {verdict === 'pass' && <span className="font-semibold text-ok"> · peer verdict: PASS</span>}
              {verdict === 'fail' && <span className="font-semibold text-warn"> · peer verdict: NEEDS WORK</span>}
              {verdict === 'pending_review' && <span> · awaiting peer review</span>}
              {verdict === 'overridden_pass' && <span className="font-semibold text-ok"> · instructor override: APPROVED</span>}
              {verdict === 'overridden_fail' && <span className="font-semibold text-warn"> · instructor override: REVISE</span>}
            </>
          ) : (
            <>Nothing submitted yet — green all four categories, then freeze it for review.</>
          )}
        </div>
        <button
          type="button"
          disabled={!result.allGreen || busy}
          onClick={submit}
          title={result.allGreen ? 'Freeze this document and send it for blind review' : 'Enabled when all four categories are green'}
          className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium ${
            result.allGreen && !busy
              ? 'bg-accent text-accent-contrast hover:bg-accent-strong'
              : 'cursor-not-allowed bg-panel text-muted'
          }`}
        >
          {result.allGreen ? <Send className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
          {busy ? 'Freezing…' : latest ? `Submit v${latest.version + 1}` : 'Submit for review'}
        </button>
      </div>
    </div>
  );
}
