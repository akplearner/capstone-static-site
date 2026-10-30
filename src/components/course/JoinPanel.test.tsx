import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JoinPanel, LEAVE_COPY } from './JoinPanel';
import { progressRepo } from '@/lib/data';
import { acceptLocally } from '@/lib/legal/acceptances';
import { AGREEMENTS } from '@/lib/legal/agreements';
import { AZURE_FUNDAMENTALS } from '@/lib/data/seed/azureCloud';
import { KEYS } from '@/lib/data/keys';
import { composeTeamId } from '@/lib/team';
import { getMonthlyCohorts } from '@/lib/utils';
import type { Course, Member } from '@/lib/types';

vi.mock('next/navigation', () => ({ useParams: () => ({ courseId: 'azure-fundamentals' }), useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/lib/useCourse', async (orig) => {
  const real = await orig<typeof import('@/lib/useCourse')>();
  const { courseDocument } = await import('@/lib/content/docs');
  return { ...real, useCourseDocument: () => courseDocument('azure-fundamentals')! };
});

/**
 * R117 — joining never strands anyone: a member whose role was removed from
 * the course is asked for a new one (with the picker already open and their
 * progress kept), and a full house says so and says where to go.
 */
const [COHORT, NEXT] = getMonthlyCohorts(2);
const C = AZURE_FUNDAMENTALS;
const member = (role: string): Member => ({ memberId: 'm1', courseId: C.id, teamId: composeTeamId(COHORT, '1', 'local'), role, displayName: 'Grace', cohort: COHORT });
const mount = (course: Course, m: Member | null) => render(<JoinPanel course={course} member={m} userId={null} requireAuth={false} onJoined={() => {}} />);

beforeEach(() => {
  localStorage.clear();
  // Offline, the agreements front the first join; accept them so the tests reach the roster.
  acceptLocally(AGREEMENTS);
});

describe('JoinPanel — R117', () => {
  it('an enrolled member with a valid role sees the compact summary, as before', () => {
    mount(C, member(C.roles[0].id));
    expect(screen.getByRole('button', { name: 'Change team or role' })).toBeInTheDocument();
    expect(screen.queryByText('Pick a role')).toBeNull();
  });

  it('a member whose role no longer exists is asked for a new one, with the picker open and the first role preselected', () => {
    const { container } = mount(C, member('removed-role'));
    expect(screen.getByRole('heading', { name: 'Pick a role' })).toBeInTheDocument();
    expect(screen.getByText(/Your role is not part of this course any more\. Pick one to carry on; your progress stays\./)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Change team or role' })).toBeNull();
    const picked = container.querySelector('[data-role-pick][aria-pressed="true"]');
    expect(picked?.getAttribute('data-role-pick')).toBe(C.roles[0].id);
    expect(container.querySelectorAll('[data-role-pick]')).toHaveLength(C.roles.length);
  });

  it('with every local team full it says so and offers the online lobby, which a student can start', () => {
    const course: Course = { ...C, teamCount: 1, teamCapacity: 1 };
    localStorage.setItem(KEYS.roster(course.id), JSON.stringify([{ ...member(C.roles[0].id), memberId: 'other', teamId: composeTeamId(COHORT, '1', 'local'), joinedAt: 1 }]));
    const { container } = mount(course, null);
    const note = container.querySelector('[data-all-full]')!;
    expect(note.textContent).toContain('Every team is full.');
    expect(note.textContent).toContain('ask your instructor to open another team');
    fireEvent.click(screen.getByRole('button', { name: 'Start or join an online lobby' }));
    expect(screen.getByText('Lobby')).toBeInTheDocument();
    expect(container.querySelector('[data-all-full]')).toBeNull();
  });

  it('with room left there is no full-house note', () => {
    const course: Course = { ...C, teamCount: 2, teamCapacity: 1 };
    localStorage.setItem(KEYS.roster(course.id), JSON.stringify([{ ...member(C.roles[0].id), memberId: 'other', joinedAt: 1 }]));
    const { container } = mount(course, null);
    expect(container.querySelector('[data-all-full]')).toBeNull();
  });
});

/**
 * R150 — a student joins this month's or next month's session, never an earlier one; a student who has
 * been in a session may leave it (what they earned stays, the course work starts over) and may only
 * move forward.
 */
describe('JoinPanel — R150 class sessions', () => {
  const picks = (c: HTMLElement) => [...c.querySelectorAll('[data-cohort-pick]')].map((b) => b.getAttribute('data-cohort-pick'));

  it('a new joiner may pick this month (open now) or next month (starts in N days), this month preselected', () => {
    const { container } = mount(C, null);
    expect(picks(container)).toEqual([COHORT, NEXT]);
    expect(container.querySelector(`[data-cohort-pick="${COHORT}"]`)?.getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelector(`[data-cohort-pick="${COHORT}"]`)?.textContent).toContain('open now');
    expect(container.querySelector(`[data-cohort-pick="${NEXT}"]`)?.textContent).toMatch(/starts in \d+d/);
  });

  it('the floor hides the sessions behind it', () => {
    localStorage.setItem(KEYS.cohortFloor(C.id), NEXT);
    const { container } = mount(C, null);
    expect(picks(container)).toEqual([NEXT]);
    expect(container.querySelector(`[data-cohort-pick="${NEXT}"]`)?.getAttribute('aria-pressed')).toBe('true');
  });

  it('picking next month joins that session’s team', async () => {
    const onJoined = vi.fn();
    const { container } = render(<JoinPanel course={C} member={null} userId={null} requireAuth={false} onJoined={onJoined} />);
    fireEvent.change(container.querySelector('input[type="text"]')!, { target: { value: 'Grace' } });
    fireEvent.click(container.querySelector(`[data-cohort-pick="${NEXT}"]`)!);
    fireEvent.click(screen.getByRole('button', { name: 'Join course' }));
    await vi.waitFor(() => expect(onJoined).toHaveBeenCalled());
    const joined: Member = onJoined.mock.calls[0][0];
    expect(joined.cohort).toBe(NEXT);
    expect(joined.teamId).toBe(composeTeamId(NEXT, '1', 'local'));
  });

  it('an enrolled member sees their own session first, then the open ones, and a move is a confirmed leave-and-switch', async () => {
    const m = member(C.roles[0].id);
    progressRepo.joinTeam(C, m);
    const onJoined = vi.fn();
    const { container } = render(<JoinPanel course={C} member={m} userId={null} requireAuth={false} onJoined={onJoined} />);
    fireEvent.click(screen.getByRole('button', { name: 'Change team or role' }));
    expect(picks(container)).toEqual([COHORT, NEXT]);
    expect(container.querySelector(`[data-cohort-pick="${COHORT}"]`)?.textContent).toContain('your session');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
    fireEvent.click(container.querySelector(`[data-cohort-pick="${NEXT}"]`)!);
    expect(container.querySelector('[data-switch-note]')?.textContent).toContain('your earned skills stay, your course work starts over');
    fireEvent.click(screen.getByRole('button', { name: 'Leave and switch' }));
    // The dialog says what stays and what goes.
    expect(screen.getByText(`Move to the ${NEXT} session?`)).toBeInTheDocument();
    for (const line of Object.values(LEAVE_COPY)) expect(screen.getByText(line)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Leave and switch' }).at(-1)!);
    await vi.waitFor(() => expect(onJoined).toHaveBeenCalled());
    const joined: Member = onJoined.mock.calls[0][0];
    expect(joined.memberId).toBe('m1');
    expect(joined.teamId).toBe(composeTeamId(NEXT, '1', 'local'));
    expect(progressRepo.getRoster(C.id).map((e) => e.teamId)).toEqual([composeTeamId(NEXT, '1', 'local')]);
    expect(progressRepo.getCohortFloor(C.id)).toBe(NEXT);
  });

  it('Leave team asks first, with the four sentences, then frees the seat and remembers the floor', async () => {
    const m = member(C.roles[0].id);
    progressRepo.joinTeam(C, m);
    const { container } = mount(C, m);
    fireEvent.click(container.querySelector('[data-leave-team]')!);
    expect(screen.getByText(`Leave Team 1 (${COHORT}) and start fresh?`)).toBeInTheDocument();
    for (const line of Object.values(LEAVE_COPY)) expect(screen.getByText(line)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Leave team' }).at(-1)!);
    await vi.waitFor(() => expect(progressRepo.getRoster(C.id)).toEqual([]));
    expect(progressRepo.getContext(C.id)).toBeNull();
    expect(progressRepo.getCohortFloor(C.id)).toBe(COHORT);
  });
});
