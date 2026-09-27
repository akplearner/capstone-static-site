'use client';

import { useMemo } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import type { DeliverableData, DeliverableDef } from '@/lib/docs/types';
import type { StepEvidence } from '@/lib/data/types';
import { RUBRIC_CATEGORIES, evaluateBundle, stepsProducing } from '@/lib/docs/deliverableRubric';
import { evidenceRepo } from '@/lib/data';
import { useClientStore, EMPTY_OBJECT } from '@/lib/useClientStore';
import { useCourse } from '@/lib/useCourse';

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
}: {
  def: DeliverableDef;
  data: DeliverableData;
  week: number;
  memberId: string;
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
      <p className="mt-2 text-3xs text-muted">
        These are the exact checks frozen into your submission and shown to your reviewers — strong
        self-verification with an audit trail, not surveillance.
      </p>
    </div>
  );
}
