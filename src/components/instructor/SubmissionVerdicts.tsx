'use client';

import { verdictOf, type Verdict } from '@/lib/docs/deliverableRubric';
import type { CohortData } from '@/lib/data/cohortLoader';
import type { DeliverableReview, DeliverableSubmission } from '@/lib/data/types';

/**
 * The instructor's view of R84's grading machine: what each team froze, what
 * the blind reviewers said, and the derived verdict — through the SAME
 * `verdictOf` the student's banner uses, so the two screens can never
 * disagree. Reviewer identities are not in the data (the loader never asks
 * for them); the instructor sees counts and outcomes, like everyone else.
 */

/** The newest frozen version of one form for one team in one week. */
export function latestSubmission(
  data: CohortData,
  teamId: string,
  deliverableId: string,
  week: number
): DeliverableSubmission | undefined {
  return data.submissions
    .filter((s) => s.teamId === teamId && s.deliverableId === deliverableId && s.week === week)
    .sort((a, b) => a.version - b.version)
    .at(-1);
}

export function verdictFor(
  data: CohortData,
  submission: DeliverableSubmission,
  instructorStatus?: DeliverableReview['status']
): Verdict {
  const confirms = data.peerReviews.filter((r) => r.submissionId === submission.id).map((r) => r.confirm);
  return verdictOf(submission.snapshot, confirms, data.assignedCounts[submission.id] ?? 0, instructorStatus);
}

const VERDICT_LABEL: Record<Verdict, { text: string; cls: string }> = {
  pass: { text: 'Peer PASS', cls: 'bg-ok-soft text-ok' },
  fail: { text: 'Peer NEEDS WORK', cls: 'bg-warn-soft text-warn' },
  platform_pass: { text: 'Platform PASS', cls: 'bg-ok-soft text-ok' },
  platform_fail: { text: 'Platform NEEDS WORK', cls: 'bg-warn-soft text-warn' },
  pending_review: { text: 'Awaiting reviews', cls: 'bg-panel-2 text-muted' },
  overridden_pass: { text: 'Override: APPROVED', cls: 'bg-ok-soft text-ok' },
  overridden_fail: { text: 'Override: REVISE', cls: 'bg-warn-soft text-warn' },
};

export function VerdictChip({ verdict }: { verdict: Verdict }) {
  const v = VERDICT_LABEL[verdict];
  return <span className={`rounded-full px-2 py-0.5 text-2xs font-semibold ${v.cls}`}>{v.text}</span>;
}

/** One line above a review cell: version, freeze date, review counts, verdict. */
export function SubmissionVerdictLine({
  data,
  teamId,
  deliverableId,
  week,
  instructorStatus,
}: {
  data: CohortData;
  teamId: string;
  deliverableId: string;
  week: number;
  instructorStatus?: DeliverableReview['status'];
}) {
  const latest = latestSubmission(data, teamId, deliverableId, week);
  if (!latest) {
    return <p className="text-2xs text-muted">Not submitted — the team hasn’t frozen this form yet.</p>;
  }
  const reviews = data.peerReviews.filter((r) => r.submissionId === latest.id);
  const assigned = data.assignedCounts[latest.id] ?? 0;
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-2xs text-muted">
      <span className="font-semibold text-ink">v{latest.version}</span>
      <span>{new Date(latest.at).toLocaleDateString()}</span>
      <span className="font-mono">{latest.contentSha256.slice(0, 8)}…</span>
      <span>
        {reviews.length}/{assigned} review{assigned === 1 ? '' : 's'}
      </span>
      <VerdictChip verdict={verdictFor(data, latest, instructorStatus)} />
    </p>
  );
}

/** The course at a glance: every latest submission, bucketed by verdict. */
export function SubmissionSummary({ data }: { data: CohortData }) {
  const latestByKey = new Map<string, DeliverableSubmission>();
  for (const s of data.submissions) {
    const k = `${s.teamId}::${s.deliverableId}::${s.week}`;
    const prev = latestByKey.get(k);
    if (!prev || s.version > prev.version) latestByKey.set(k, s);
  }
  if (latestByKey.size === 0) return null;
  const counts = new Map<Verdict, number>();
  for (const s of latestByKey.values()) {
    const review = data.reviews
      .filter((r) => r.teamId === s.teamId && r.deliverableId === s.deliverableId && r.week === s.week)
      .sort((a, b) => b.at - a.at)[0];
    const v = verdictFor(data, s, review?.status);
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
      <span className="font-semibold text-ink">{latestByKey.size}</span> frozen submission
      {latestByKey.size === 1 ? '' : 's'} ·
      {[...counts.entries()].map(([v, n]) => (
        <span key={v} className="inline-flex items-center gap-1">
          <VerdictChip verdict={v} /> <span className="tabular-nums">{n}</span>
        </span>
      ))}
    </div>
  );
}
