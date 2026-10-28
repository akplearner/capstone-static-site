import { describe, expect, it } from 'vitest';
import { latestMarks } from './ReviewCell';
import type { DeliverableReviewMark } from '@/lib/data/types';

const mark = (category: DeliverableReviewMark['category'], ok: boolean, at: number, week = 2, deliverableId = 'as-built'): DeliverableReviewMark => ({ courseId: 'c', teamId: 't', deliverableId, week, category, ok, note: '', reviewer: 'Ivy', at });

describe('R136 — the review cell starts from the marks last saved', () => {
  it('is all true with no history', () => {
    expect(latestMarks([], 'as-built', 2)).toEqual({ completeness: true, correctness: true, authenticity: true, consistency: true });
  });

  it('takes the newest mark per category for the form and week, ignoring other forms and weeks', () => {
    const all = [mark('correctness', false, 1), mark('correctness', true, 2), mark('authenticity', false, 3), mark('authenticity', true, 1, 3), mark('consistency', false, 9, 2, 'other')];
    expect(latestMarks(all, 'as-built', 2)).toEqual({ completeness: true, correctness: true, authenticity: false, consistency: true });
  });
});
