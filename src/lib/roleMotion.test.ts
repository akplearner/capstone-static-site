import { describe, it, expect } from 'vitest';
import { resolveRoleMotion } from './roleMotion';
import { DEFAULT_MOTION } from './docs/roles';
import { DUR, EASE } from './motion';

/** R105 — every transition comes from the motion scale; reduced motion makes it a no-op. */
describe('resolveRoleMotion', () => {
  const m = resolveRoleMotion(DEFAULT_MOTION, false);
  const dur = (t: { duration?: number }) => t.duration ?? -1;
  const delay = (t: { delay?: number }) => t.delay ?? -1;

  it('boxes reveal on the scale, staggered by the named token and capped', () => {
    expect(m.on).toBe(true);
    expect(dur(m.box(0))).toBe(DUR.reveal);
    expect(delay(m.box(0))).toBe(0);
    expect(delay(m.box(2))).toBeCloseTo(2 * DUR.press);
    expect(delay(m.box(40))).toBe(DUR.meter);
    expect(m.box(1).ease).toEqual(EASE.out);
    expect(m.row(3)).toEqual(m.box(3));
  });

  it('edges draw after the boxes and the whole choreography settles within about a second', () => {
    expect(dur(m.edge(0, 3))).toBe(DUR.meter);
    expect(delay(m.edge(0, 3))).toBeCloseTo(3 * DUR.press);
    const last = m.edge(11, 4);
    expect(delay(last) + dur(last)).toBeLessThanOrEqual(1.4);
    expect(m.dim).toEqual({ duration: DUR.swap, ease: EASE.out });
  });

  it('every duration is a token of the scale', () => {
    const all = [m.box(0), m.box(5), m.row(2), m.edge(0, 3), m.edge(7, 4), m.dim];
    for (const t of all) expect(Object.values(DUR) as number[]).toContain(dur(t));
  });

  it('reduced motion: off, and every duration and delay is zero', () => {
    const r = resolveRoleMotion({ stagger: 'swap', draw: 'reveal', ease: 'in' }, true);
    expect(r.on).toBe(false);
    for (const t of [r.box(3), r.row(3), r.edge(2, 4), r.dim]) {
      expect(dur(t)).toBe(0);
      expect(delay(t)).toBe(0);
    }
  });

  it('honours a different spec', () => {
    const s = resolveRoleMotion({ stagger: 'swap', draw: 'reveal', ease: 'in' }, false);
    expect(delay(s.box(1))).toBe(DUR.swap);
    expect(dur(s.edge(0, 3))).toBe(DUR.reveal);
    expect(s.box(0).ease).toEqual(EASE.in);
  });
});
