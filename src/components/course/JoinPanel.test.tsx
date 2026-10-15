import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JoinPanel } from './JoinPanel';
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
const [COHORT] = getMonthlyCohorts(2);
const C = AZURE_FUNDAMENTALS;
const member = (role: string): Member => ({ memberId: 'm1', courseId: C.id, teamId: composeTeamId(COHORT, '1', 'local'), role, displayName: 'Grace', cohort: COHORT });
const mount = (course: Course, m: Member | null) => render(<JoinPanel course={course} member={m} userId={null} requireAuth={false} onJoined={() => {}} />);

beforeEach(() => localStorage.clear());

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
