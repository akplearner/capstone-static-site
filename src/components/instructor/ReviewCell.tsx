'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { reviewRepo } from '@/lib/data';
import type { DeliverableReview, DeliverableReviewMark, ReviewStatus } from '@/lib/data/types';
import { RUBRIC_CATEGORIES } from '@/lib/docs/deliverableRubric';

/** Clock read hoisted to module scope: the purity lint treats a `Date.now()` inside a component-body function as render work, even when it only runs from a click. */
function nowMs(): number {
  return Date.now();
}

/**
 * The instructor's side of the review loop: one verdict per form per week.
 * R134: beside the verdict, one mark per rubric category (completeness,
 * correctness, authenticity, consistency), appended as history with every
 * save (0021), so the record can read documentation quality per category.
 */
export function ReviewCell({
  courseId,
  teamId,
  deliverableId,
  week,
  current,
  reviewer,
}: {
  courseId: string;
  teamId: string;
  deliverableId: string;
  week: number;
  current?: DeliverableReview;
  reviewer: string;
}) {
  const [status, setStatus] = useState<ReviewStatus>(current?.status ?? 'pending');
  const [comment, setComment] = useState(current?.comment ?? '');
  const [marks, setMarks] = useState<Record<DeliverableReviewMark['category'], boolean>>({ completeness: true, correctness: true, authenticity: true, consistency: true });
  const dirty = status !== (current?.status ?? 'pending') || comment !== (current?.comment ?? '');

  const save = () => {
    const at = nowMs();
    reviewRepo.save({ courseId, teamId, deliverableId, week, status, comment, reviewer, at });
    reviewRepo.saveMarks(RUBRIC_CATEGORIES.map((c) => ({ courseId, teamId, deliverableId, week, category: c.id, ok: marks[c.id], note: '', reviewer, at })));
  };

  return (
    <div className="flex flex-col gap-2">
      <select value={status} onChange={(e) => setStatus(e.target.value as ReviewStatus)} className="text-sm" aria-label="Review status">
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="revise">Revise</option>
      </select>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder="What to fix, or what was good"
        aria-label="Review comment"
        className="text-sm"
      />
      <fieldset className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-body" data-review-marks>
        <legend className="sr-only">Marks per rubric category</legend>
        {RUBRIC_CATEGORIES.map((c) => (
          <label key={c.id} className="inline-flex items-center gap-1">
            <input type="checkbox" checked={marks[c.id]} onChange={(e) => setMarks((m) => ({ ...m, [c.id]: e.target.checked }))} aria-label={`${c.label} met`} />
            {c.label}
          </label>
        ))}
      </fieldset>
      <Button size="sm" variant={dirty ? 'default' : 'secondary'} disabled={!dirty} onClick={save}>
        {current ? 'Update review' : 'Save review'}
      </Button>
    </div>
  );
}
