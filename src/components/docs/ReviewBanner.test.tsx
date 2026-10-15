import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReviewBanner } from './ReviewBanner';
import { REVIEW_VERDICT_LABEL, STATUS_LABEL } from '@/lib/docs/lifecycle';
import type { DeliverableReview } from '@/lib/data/types';

const review = (status: DeliverableReview['status']): DeliverableReview => ({ courseId: 'c', teamId: 't', deliverableId: 'd', week: 2, status, comment: 'Good scope.', reviewer: 'Ms Rao', at: 1 });

/** R118 — the instructor's verdict never reads as the team's own lifecycle: the instructor is named every time. */
describe('ReviewBanner', () => {
  it('names the instructor in each verdict, with the week', () => {
    const { rerender } = render(<ReviewBanner review={review('approved')} />);
    expect(screen.getByText('Instructor approved this · Week 2')).toBeInTheDocument();
    rerender(<ReviewBanner review={review('revise')} />);
    expect(screen.getByText('Instructor asks for changes · Week 2')).toBeInTheDocument();
    rerender(<ReviewBanner review={review('pending')} />);
    expect(screen.getByText('Instructor is reviewing · Week 2')).toBeInTheDocument();
    expect(screen.getByText('Good scope.')).toBeInTheDocument();
  });

  it('no verdict word collides with a lifecycle state word (Draft, In review, Approved, Issued)', () => {
    const lifecycle = new Set(Object.values(STATUS_LABEL));
    for (const v of Object.values(REVIEW_VERDICT_LABEL)) {
      expect(lifecycle.has(v.head), v.head).toBe(false);
      expect(lifecycle.has(v.short), v.short).toBe(false);
      expect(v.short.startsWith('Instructor')).toBe(true);
    }
  });
});
