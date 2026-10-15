import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Member } from '@/lib/types';
import { CourseContext } from '@/lib/useCourse';
import { AZURE_FUNDAMENTALS } from '@/lib/data/seed/azureCloud';
import { CourseSubNav } from '@/components/CourseSubNav';
import { RoleStrip } from './RoleStrip';

const C = AZURE_FUNDAMENTALS;
const state = vi.hoisted(() => ({ member: null as null | Member, loading: false }));
vi.mock('@/lib/useMember', () => ({ useMember: () => ({ member: state.member, loading: state.loading, setMember: () => {} }) }));

const me: Member = { memberId: 'm1', courseId: C.id, teamId: '2026-09-t1', role: 'secops', displayName: 'Grace', cohort: '2026-09' };
const inCourse = (ui: React.ReactElement) => <CourseContext.Provider value={C}>{ui}</CourseContext.Provider>;

beforeEach(() => {
  state.member = me;
  state.loading = false;
});

/** R116 — the member's role is always on top: the first item of the sticky course bar. */
describe('RoleStrip', () => {
  it('says Your role, the role’s name and the team, and links to the team’s roles board on Home (R119)', () => {
    render(inCourse(<RoleStrip courseId={C.id} />));
    const strip = screen.getByRole('link', { name: /^Your role: .*Team 1$/ });
    expect(strip).toHaveAttribute('href', `/courses/${C.id}#roles`);
    expect(strip).toHaveAttribute('data-role-strip', 'member');
    expect(strip).toHaveTextContent('Your role');
    expect(strip).toHaveTextContent('Team 1');
    const role = C.roles.find((r) => r.id === 'secops')!;
    expect(strip.getAttribute('aria-label')).toBe(`Your role: ${role.name}, Team 1`);
  });

  it('a one-role course has no board, so the strip lands on the role section instead', () => {
    const solo = { ...C, roles: [C.roles.find((r) => r.id === 'secops')!] };
    render(<CourseContext.Provider value={solo}><RoleStrip courseId={C.id} /></CourseContext.Provider>);
    expect(screen.getByRole('link', { name: /^Your role:/ })).toHaveAttribute('href', `/courses/${C.id}#role`);
  });

  it('on the dashboard it is a button that switches to Home first', () => {
    const onSelectHome = vi.fn();
    render(inCourse(<RoleStrip courseId={C.id} onSelectHome={onSelectHome} />));
    fireEvent.click(screen.getByRole('button', { name: /^Your role:/ }));
    expect(onSelectHome).toHaveBeenCalledTimes(1);
  });

  it('a visitor with no role is offered a way in, never an empty bar', () => {
    state.member = null;
    render(inCourse(<RoleStrip courseId={C.id} />));
    const join = screen.getByRole('link', { name: /No role yet/ });
    expect(join).toHaveAttribute('href', `/courses/${C.id}#join-panel`);
    expect(join).toHaveTextContent('Join');
  });

  it('holds its place while the member loads, and renders nothing outside a course', () => {
    state.loading = true;
    const { container, unmount } = render(inCourse(<RoleStrip courseId={C.id} />));
    expect(container.querySelector('[data-role-strip="loading"]')).not.toBeNull();
    unmount();
    const outside = render(<RoleStrip courseId={C.id} />);
    expect(outside.container).toBeEmptyDOMElement();
  });

  it('is the FIRST item in the course bar, on every page that renders it', () => {
    const { container } = render(inCourse(<CourseSubNav courseId={C.id} active="guide" teamId="2026-09-t1" />));
    const nav = container.querySelector('nav[aria-label="Course sections"]')!;
    expect(nav.firstElementChild).toHaveAttribute('data-role-strip');
    expect(nav.className).toContain('sticky');
  });
});
