'use client';

import { Alert } from '@/components/ui/Alert';
import type { DeliverableReview } from '@/lib/data/types';
import { localStamp } from '@/lib/localDate';

const VARIANT = { approved: 'success', revise: 'warning', pending: 'info' } as const;
const HEAD = { approved: 'Approved', revise: 'Revise and resubmit', pending: 'Under review' } as const;

/**
 * An instructor's verdict on this form for this week, where the student
 * fills it in. Approve / revise / pending, with the comment, who and when.
 * There was no feedback loop anywhere in the product before R68.
 */
export function ReviewBanner({ review }: { review: DeliverableReview }) {
  return (
    <Alert variant={VARIANT[review.status]}>
      <div className="space-y-1">
        <div className="font-semibold">
          {HEAD[review.status]} · Week {review.week}
        </div>
        {review.comment && <p className="whitespace-pre-wrap text-sm text-body">{review.comment}</p>}
        <p className="text-xs text-muted">
          Reviewed by {review.reviewer || 'your instructor'} · {localStamp(review.at)}
        </p>
      </div>
    </Alert>
  );
}
