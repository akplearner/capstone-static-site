import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MyWaitingCard } from './MyWaitingCard';
import { SECURITY_PLUS } from '@/lib/data/seed/securityPlus';
import { statusRepo } from '@/lib/data';
import { KEYS } from '@/lib/data/keys';
import { getRoleDef } from '@/lib/course-helpers';

/**
 * R118 — what THIS member is waiting on: a document they sent for review that
 * is still in review, and one they drafted that is approved and waits to be
 * issued. Each says which role it waits on, and when nobody holds that role.
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
const row = (status: 'in_review' | 'approved', by: string, role: string, at: number) => statusRepo.save({ courseId, teamId, deliverableId: 'pentest_report', status, changedBy: by, role, at, version: 1 });
const card = (memberId: string, role: string) => render(<MyWaitingCard courseId={courseId} teamId={teamId} role={role} memberId={memberId} />);

describe('MyWaitingCard', () => {
  beforeEach(() => localStorage.clear());

  it('says nothing when nothing is waiting', () => {
    seat(['m-red', 'red'], ['m-blue', 'blue'], ['m-grc', 'grc']);
    expect(card('m-red', 'red').container.querySelector('[data-my-waiting]')).toBeNull();
  });

  it('a document the member sent for review names the role it waits on', () => {
    seat(['m-red', 'red'], ['m-blue', 'blue'], ['m-grc', 'grc']);
    row('in_review', 'm-red', 'red', 1);
    const { container } = card('m-red', 'red');
    const text = container.querySelector('[data-my-waiting]')!.textContent!;
    expect(text).toContain('1 document waiting on your teammates');
    expect(text).toContain('waiting on Defensive Operations (Blue Team) to review');
    expect(container.querySelector('[data-covering]')).toBeNull();
    // The reviewer is not told they are waiting: it is waiting on them (the queue card has it).
    expect(card('m-blue', 'blue').container.querySelector('[data-my-waiting]')).toBeNull();
  });

  it('says so when nobody holds that role, because any member may cover it', () => {
    seat(['m-red', 'red'], ['m-grc', 'grc']);
    row('in_review', 'm-red', 'red', 1);
    const { container } = card('m-red', 'red');
    expect(container.querySelector('[data-covering]')?.textContent).toContain('nobody on the team holds it, so any member may cover');
  });

  it('a document the member drafted that is approved waits on the issuing role', () => {
    seat(['m-red', 'red'], ['m-blue', 'blue'], ['m-grc', 'grc']);
    row('in_review', 'm-red', 'red', 1);
    row('approved', 'm-blue', 'blue', 2);
    const { container } = card('m-red', 'red');
    expect(container.querySelector('[data-my-waiting]')?.textContent).toContain(`waiting on ${getRoleDef(SECURITY_PLUS, 'grc')!.name} to issue`);
    expect(card('m-grc', 'grc').container.querySelector('[data-my-waiting]')).toBeNull();
  });
});
