import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CourseEnrolGate } from './CourseEnrolGate';
import { CourseContext } from '@/lib/useCourse';
import { AZURE_FUNDAMENTALS } from '@/lib/data/seed/azureCloud';
import type { Member } from '@/lib/types';

const C = AZURE_FUNDAMENTALS;
const state = vi.hoisted(() => ({ member: null as null | Member, failed: false, user: null as null | { id: string } }));
vi.mock('@/lib/useMember', () => ({ useMember: () => ({ member: state.member, failed: state.failed, loading: false, setMember: () => {} }) }));
vi.mock('@/lib/useAuth', () => ({ useAuth: () => ({ user: state.user, loading: false }) }));
vi.mock('@/lib/supabase/config', () => ({ isSupabaseConfigured: () => !!state.user }));
vi.mock('@/lib/data/supabaseCache', () => ({ hydrateCourse: vi.fn(async () => {}) }));

const me = (role: string): Member => ({ memberId: 'm1', courseId: C.id, teamId: 't1', role, displayName: 'Grace', cohort: '2026-09' });
const gate = () => render(<CourseContext.Provider value={C}><CourseEnrolGate courseId={C.id} what="the tasks" /></CourseContext.Provider>);

beforeEach(() => {
  state.member = null;
  state.failed = false;
  state.user = { id: 'u1' };
});

/** R117 — the enrol gate says the true thing: not enrolled, could not load, or enrolled with a role that is gone. */
describe('CourseEnrolGate', () => {
  it('a student who is not enrolled is told to enrol', () => {
    gate();
    expect(screen.getByRole('heading', { name: 'Enrol first' })).toBeInTheDocument();
  });

  it('a failed load is never "not enrolled": it offers a retry', () => {
    state.failed = true;
    const { container } = gate();
    expect(screen.queryByRole('heading', { name: 'Enrol first' })).toBeNull();
    expect(container.querySelector('[data-load-failed]')).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Couldn’t load your team' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('an enrolled student whose role was removed is asked for a new role, not to enrol again', () => {
    state.member = me('removed-role');
    gate();
    expect(screen.getByRole('heading', { name: 'Pick a role' })).toBeInTheDocument();
    expect(screen.getByText(/your progress stays/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Choose a role/ })).toHaveAttribute('href', `/courses/${C.id}`);
    expect(screen.queryByRole('heading', { name: 'Enrol first' })).toBeNull();
  });

  it('with accounts off (nobody signed in, nothing configured) it falls through to "Enrol first", as before', () => {
    state.user = null;
    gate();
    expect(screen.getByRole('heading', { name: 'Enrol first' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });
});
