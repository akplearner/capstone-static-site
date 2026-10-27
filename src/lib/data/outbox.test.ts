// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { clearDeliverableOutbox, queueDeliverable } from './outbox';

const KEY = 'capstone_outbox_deliverables';

describe('R135 — the deliverables outbox is cleared on sign-out', () => {
  beforeEach(() => localStorage.clear());

  it('forgets every queued row', () => {
    queueDeliverable({ course_id: 'security-plus', team_id: 't1', deliverable_id: 'as-built', data: { fields: { x: '1' } }, updated_by: 'u', updated_at: '2026-01-01T00:00:00Z' });
    expect(localStorage.getItem(KEY)).not.toBeNull();
    clearDeliverableOutbox();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('is safe when nothing is queued', () => {
    clearDeliverableOutbox();
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});
