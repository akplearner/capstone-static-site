import { describe, it, expect } from 'vitest';
import { isProtected } from './routeGate';

// The proxy redirects every protected path to /login. Getting this wrong fails in
// one of two silent ways: too broad and a prospective student can't see the course
// they're being asked to pay attention to; too narrow and a course's material is
// readable by anyone. Both directions are asserted.

describe('isProtected', () => {
  it('protects the personal surfaces', () => {
    expect(isProtected('/dashboard')).toBe(true);
    expect(isProtected('/dashboard/anything')).toBe(true);
    expect(isProtected('/portfolio')).toBe(true);
    expect(isProtected('/account')).toBe(true);
    expect(isProtected('/instructor')).toBe(true);
    expect(isProtected('/instructor/cysa-plus')).toBe(true);
  });

  it('leaves the marketing and auth surfaces public', () => {
    expect(isProtected('/')).toBe(false);
    expect(isProtected('/explore')).toBe(false);
    expect(isProtected('/login')).toBe(false);
    expect(isProtected('/register')).toBe(false);
    expect(isProtected('/legal/terms')).toBe(false);
    expect(isProtected('/legal/privacy')).toBe(false);
  });

  it('leaves the course DASHBOARD public — it is how someone decides to enrol', () => {
    expect(isProtected('/courses/cysa-plus')).toBe(false);
    expect(isProtected('/courses/security-plus')).toBe(false);
    expect(isProtected('/courses/mssp')).toBe(false);
  });

  it('protects the course MATERIAL below the dashboard', () => {
    expect(isProtected('/courses/cysa-plus/docs')).toBe(true);
    expect(isProtected('/courses/cysa-plus/guide')).toBe(true);
    expect(isProtected('/courses/cysa-plus/guide/reference')).toBe(true);
    expect(isProtected('/courses/cysa-plus/team/alpha')).toBe(true);
  });

  it('protects a course sub-route that does not exist yet', () => {
    // Private by default: a new tab added under a course is gated without anyone
    // having to remember to come back here and add it.
    expect(isProtected('/courses/cysa-plus/some-future-tab')).toBe(true);
  });

  it('does not treat a longer name as a protected prefix', () => {
    // The bug a bare `startsWith` would introduce.
    expect(isProtected('/dashboardxyz')).toBe(false);
    expect(isProtected('/accounts-payable')).toBe(false);
    expect(isProtected('/coursesomething')).toBe(false);
  });

  it('does not protect a trailing slash on the course dashboard', () => {
    // `/courses/cysa-plus/` is the dashboard, not material — the regex needs at
    // least one character after the slash.
    expect(isProtected('/courses/cysa-plus/')).toBe(false);
  });
});
