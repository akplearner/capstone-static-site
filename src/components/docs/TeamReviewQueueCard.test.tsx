import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { TeamReviewQueueCard } from './TeamReviewQueueCard';
import { SECURITY_PLUS } from '@/lib/data/seed/securityPlus';
import { statusRepo } from '@/lib/data';
import { KEYS } from '@/lib/data/keys';

/**
 * R103 / R117 — the team's documents waiting on THIS member, including a step
 * whose role nobody on the team holds (any member may cover it).
 */
vi.mock('next/navigation', () => ({ useParams: () => ({ courseId: 'security-plus' }), useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/lib/useCourse', async (orig) => {
  const real = await orig<typeof import('@/lib/useCourse')>();
  return { ...real, useCourse: () => SECURITY_PLUS };
});

const courseId = 'security-plus';
const teamId = '2026-01-T01';
const seat = (...members: [string, string][]) =>
  localStorage.setItem(KEYS.roster(courseId), JSON.stringify(members.map(([memberId, role]) => ({ memberId, teamId, role, displayName: memberId.replace('m-', ''), cohort: '2026-01', joinedAt: 1 }))));
const submit = () => statusRepo.save({ courseId, teamId, deliverableId: 'pentest_report', status: 'in_review', changedBy: 'm-red', role: 'red', at: 1, version: 1 });
const card = (memberId: string, role: string) => render(<TeamReviewQueueCard courseId={courseId} teamId={teamId} role={role} memberId={memberId} />);

describe('TeamReviewQueueCard', () => {
  beforeEach(() => localStorage.clear());

  it('shows the reviewer a form in review that is theirs to review, and nothing to anyone else', () => {
    seat(['m-red', 'red'], ['m-blue', 'blue'], ['m-grc', 'grc']);
    submit();
    const { container, unmount } = card('m-blue', 'blue');
    expect(container.querySelector('[data-team-queue]')?.textContent).toContain('1 document waiting for you');
    expect(container.querySelector('[data-covering]')).toBeNull();
    unmount();
    expect(card('m-grc', 'grc').container.querySelector('[data-team-queue]')).toBeNull();
  });

  it('R117: with no reviewing role on the team it waits on any member who is not the submitter, and says it is cover', () => {
    seat(['m-red', 'red'], ['m-grc', 'grc']);
    submit();
    const { container, unmount } = card('m-grc', 'grc');
    expect(container.querySelector('[data-team-queue]')).not.toBeNull();
    expect(container.querySelector('[data-covering]')?.textContent).toContain('covering for Defensive Operations (Blue Team)');
    unmount();
    // The submitter may not review their own work while someone else could.
    expect(card('m-red', 'red').container.querySelector('[data-team-queue]')).toBeNull();
  });

  it('an approved form waits on the approving role, or on cover when nobody holds it', () => {
    seat(['m-red', 'red'], ['m-blue', 'blue']);
    submit();
    statusRepo.save({ courseId, teamId, deliverableId: 'pentest_report', status: 'approved', changedBy: 'm-blue', role: 'blue', at: 2, version: 1 });
    const { container } = card('m-blue', 'blue');
    expect(container.querySelector('[data-team-queue]')?.textContent).toContain('yours to issue');
    expect(container.querySelector('[data-covering]')?.textContent).toContain('Governance');
  });
});
