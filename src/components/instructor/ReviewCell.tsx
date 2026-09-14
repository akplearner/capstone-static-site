'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { reviewRepo } from '@/lib/data';
import type { DeliverableReview, ReviewStatus } from '@/lib/data/types';

/** The instructor's side of the review loop: one verdict per form per week. */
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
  const dirty = status !== (current?.status ?? 'pending') || comment !== (current?.comment ?? '');

  const save = () => {
    reviewRepo.save({ courseId, teamId, deliverableId, week, status, comment, reviewer, at: Date.now() });
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
      <Button size="sm" variant={dirty ? 'default' : 'secondary'} disabled={!dirty} onClick={save}>
        {current ? 'Update review' : 'Save review'}
      </Button>
    </div>
  );
}
