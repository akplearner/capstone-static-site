import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * R117 — a failed first load of a course must never read as "not enrolled".
 *
 * The membership query says whether the signed-in person is on a team. When it
 * fails before the course was ever loaded (offline, an expired token), marking
 * the course loaded with nobody in it showed an enrolled student the Join panel,
 * and joining again overwrote their team and role. So the failure is recorded,
 * the course stays "not loaded", and a retry can succeed. A refresh that fails
 * after a good load keeps what the cache already holds.
 */
const state = vi.hoisted(() => ({
  memberships: { data: null as unknown, error: { message: 'network down' } as unknown },
}));

const query = (result: unknown) => {
  const q: unknown = new Proxy(
    {},
    {
      get: (_t, prop) => (prop === 'then' ? (res: (v: unknown) => unknown) => Promise.resolve(result).then(res) : () => q),
    }
  );
  return q;
};
const channel = { on: () => channel, subscribe: () => channel, unsubscribe: () => {} };
const asked: string[] = [];
const client = {
  from: (table: string) => {
    asked.push(table);
    return query(table === 'memberships' ? state.memberships : { data: [], error: null });
  },
  rpc: (fn: string) => {
    asked.push(`rpc:${fn}`);
    return query({ data: [{ assignment_id: 'a1', course_id: 'security-plus', deliverable_id: 'as-built', week: 2, assigned_at: '2026-01-02T00:00:00Z', done: true }], error: null });
  },
  channel: () => channel,
  removeChannel: () => {},
};

vi.mock('../supabase/client', () => ({ getBrowserClient: () => client }));
vi.mock('./outbox', () => ({ flushDeliverableOutbox: vi.fn() }));

const { hydrateCourse, hydrateUser, isCourseHydrated, courseHydrateFailed, setCurrentUserId, cache } = await import('./supabaseCache');

const course = 'security-plus';
const row = { user_id: 'ada', course_id: course, team_id: '2026-01-T01', role: 'red', display_name: 'Ada', cohort: '2026-01', joined_at: '2026-01-01T00:00:00Z' };

beforeEach(() => {
  setCurrentUserId(null);
  setCurrentUserId('ada');
  state.memberships = { data: null, error: { message: 'network down' } };
  asked.length = 0;
});

describe('hydrateUser — R136 every fact the profile reads arrives on the dashboard and the portfolio', () => {
  it('selects the team forms, the marks, the flag history, the flags, the calendars and the review queue', async () => {
    state.memberships = { data: [], error: null };
    await hydrateUser();
    for (const t of ['deliverables', 'deliverable_review_marks', 'step_flag_events', 'step_flags', 'cohorts']) expect(asked, t).toContain(t);
    expect(asked).toContain('rpc:get_review_queue');
    expect(asked, 'single-user course-page facts stay off the cross-course hydrate').not.toContain('lab_access');
    expect(cache.reviewQueue()).toEqual([{ assignmentId: 'a1', courseId: 'security-plus', deliverableId: 'as-built', week: 2, assignedAt: Date.parse('2026-01-02T00:00:00Z'), done: true }]);
  });

  it('the course hydrate reads the queue too, and signing out forgets it', async () => {
    state.memberships = { data: [], error: null };
    await hydrateCourse(course);
    expect(asked).toContain('rpc:get_review_queue');
    expect(cache.reviewQueue()?.length).toBe(1);
    setCurrentUserId(null);
    expect(cache.reviewQueue()).toBeNull();
  });
});

describe('hydrateCourse — R117 a failed first load is a failure, not "not enrolled"', () => {
  it('records the failure and leaves the course unloaded', async () => {
    await hydrateCourse(course);
    expect(courseHydrateFailed(course)).toBe(true);
    expect(isCourseHydrated(course)).toBe(false);
  });

  it('a retry that succeeds clears the failure and loads the course', async () => {
    await hydrateCourse(course);
    expect(courseHydrateFailed(course)).toBe(true);
    state.memberships = { data: [row], error: null };
    await hydrateCourse(course);
    expect(courseHydrateFailed(course)).toBe(false);
    expect(isCourseHydrated(course)).toBe(true);
  });

  it('a refresh that fails after a good load keeps the course loaded and raises nothing', async () => {
    state.memberships = { data: [row], error: null };
    await hydrateCourse(course);
    state.memberships = { data: null, error: { message: 'blip' } };
    await hydrateCourse(course);
    expect(isCourseHydrated(course)).toBe(true);
    expect(courseHydrateFailed(course)).toBe(false);
  });

  it('a person genuinely not on a team loads fine and is simply not enrolled', async () => {
    state.memberships = { data: [], error: null };
    await hydrateCourse(course);
    expect(isCourseHydrated(course)).toBe(true);
    expect(courseHydrateFailed(course)).toBe(false);
  });

  it('signing out forgets the failure', async () => {
    await hydrateCourse(course);
    setCurrentUserId(null);
    expect(courseHydrateFailed(course)).toBe(false);
  });
});
