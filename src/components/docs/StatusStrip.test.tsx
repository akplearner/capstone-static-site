import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatusStrip } from './StatusStrip';
import { WaitingOnNotice } from './WaitingOnNotice';
import { SECURITY_PLUS } from '@/lib/data/seed/securityPlus';
import { deliverablesForCourse } from '@/lib/docs/definitions';
import { statusRepo } from '@/lib/data';

/**
 * R103 — the status strip shows where a form stands and offers the viewer's
 * role exactly its own move: the drafter is pointed at the submit bar, the
 * reviewer approves or returns, the approver issues; the waiting-on notice
 * names the upstream forms still unapproved.
 */
vi.mock('next/navigation', () => ({ useParams: () => ({ courseId: 'security-plus' }), useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/lib/useCourse', async (orig) => {
  const real = await orig<typeof import('@/lib/useCourse')>();
  return { ...real, useCourse: () => SECURITY_PLUS };
});
vi.mock('@/lib/useRequireAuth', () => ({ useRequireAuth: () => ({ guard: (_what: string, write: () => void) => { write(); return true; } }) }));

const pentest = deliverablesForCourse('security-plus').find((d) => d.id === 'pentest_report')!;
const courseId = 'security-plus';
const teamId = '2026-01-T01';

describe('StatusStrip', () => {
  beforeEach(() => localStorage.clear());

  it('a draft points the drafter at the submit bar and tells the others who submits', () => {
    render(<StatusStrip def={pentest} courseId={courseId} teamId={teamId} member={{ memberId: 'm-red', role: 'red' }} dodOk />);
    expect(screen.getByText('Submit from the Expectations panel below')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toHaveAttribute('aria-current', 'step');
    expect(screen.queryByRole('button', { name: /Approve/ })).toBeNull();
  });

  it('the reviewing role approves or returns an in-review form; a return needs a reason', () => {
    statusRepo.save({ courseId, teamId, deliverableId: pentest.id, status: 'in_review', changedBy: 'm-red', role: 'red', at: 1, version: 1 });
    render(<StatusStrip def={pentest} courseId={courseId} teamId={teamId} member={{ memberId: 'm-blue', role: 'blue' }} dodOk />);
    expect(screen.getByText('In review')).toHaveAttribute('aria-current', 'step');
    fireEvent.click(screen.getByRole('button', { name: /Return for changes/ }));
    const send = screen.getByRole('button', { name: /Return to/ });
    expect(send).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText(/The scope says no RDP/), { target: { value: 'Scope forbids RDP tests.' } });
    fireEvent.click(send);
    expect(statusRepo.list(courseId, teamId).at(-1)?.status).toBe('draft');
    expect(statusRepo.list(courseId, teamId).at(-1)?.note).toBe('Scope forbids RDP tests.');
  });

  it('the approving role issues an approved form, and the drafter may reopen it', () => {
    statusRepo.save({ courseId, teamId, deliverableId: pentest.id, status: 'in_review', changedBy: 'm-red', role: 'red', at: 1, version: 1 });
    statusRepo.save({ courseId, teamId, deliverableId: pentest.id, status: 'approved', changedBy: 'm-blue', role: 'blue', at: 2, version: 1 });
    const { unmount } = render(<StatusStrip def={pentest} courseId={courseId} teamId={teamId} member={{ memberId: 'm-grc', role: 'grc' }} dodOk />);
    fireEvent.click(screen.getByRole('button', { name: /Issue/ }));
    expect(statusRepo.list(courseId, teamId).at(-1)?.status).toBe('issued');
    unmount();
    render(<StatusStrip def={pentest} courseId={courseId} teamId={teamId} member={{ memberId: 'm-red', role: 'red' }} dodOk />);
    expect(screen.getByRole('button', { name: /Reopen/ })).toBeInTheDocument();
  });

  it('the waiting-on notice names the unapproved upstream forms and clears once they are approved', () => {
    const { container, unmount } = render(<WaitingOnNotice def={pentest} courseId={courseId} teamId={teamId} />);
    expect(container.textContent).toContain('Waiting on:');
    expect(container.querySelector('[data-waiting-on="vm_sop"]')).not.toBeNull();
    unmount();
    statusRepo.save({ courseId, teamId, deliverableId: 'vm_sop', status: 'approved', changedBy: 'm-blue', role: 'blue', at: 3, version: 1 });
    const again = render(<WaitingOnNotice def={pentest} courseId={courseId} teamId={teamId} />);
    expect(again.container.querySelector('[data-waiting-on="vm_sop"]')).toBeNull();
  });
});
