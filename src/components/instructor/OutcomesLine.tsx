import { OUTCOME_K, OUTCOME_STATUS, type OutcomeCount } from '@/lib/legal/outcomes';

/**
 * R110 — the course's outcome counts for an instructor: per status, nobody
 * named, and nothing at all below the floor (the SQL function returns no
 * rows then, and says so here). Props only.
 */
export function OutcomesLine({ counts }: { counts: OutcomeCount[] | null }) {
  if (counts === null) return null;
  return (
    <p className="text-sm text-muted" data-outcome-counts={counts.length}>
      <span className="font-medium text-ink">Outcomes:</span>{' '}
      {counts.length === 0
        ? `fewer than ${OUTCOME_K} members have reported an outcome with the grant on; nothing is counted.`
        : counts.map((c) => `${OUTCOME_STATUS[c.status].toLowerCase()} ${c.members}`).join(' · ')}
    </p>
  );
}
