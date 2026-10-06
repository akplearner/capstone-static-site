import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { DEFAULT_MOTION, FLOW_HOW_TO_READ, FLOW_KIND_LABEL, ROLE_CONTENT, WORKS_LABEL, WORKS_SHORT, profileOf, roleContentFor, splitRoleName } from './roles';
import { SEED_COURSES } from '../content/dto';
import { DUR, EASE } from '../motion';

/**
 * R105 — the role content is one section per course: a profile for every
 * seed role in the seed's order, a motion spec that names only tokens of
 * the motion scale, and the labels the role pictures print.
 */
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

describe('roles content', () => {
  it('has an entry for every course, with a profile per role in the seed order', () => {
    for (const c of SEED_COURSES) {
      expect(ROLE_CONTENT[c.id], c.id).toBeTruthy();
      expect(roleContentFor(c.id).PROFILES.map((x) => x.id), c.id).toEqual(c.roles.map((r) => r.id));
    }
    expect(roleContentFor('nope')).toEqual({ PROFILES: [], MOTION: DEFAULT_MOTION });
  });

  it('every motion spec names tokens of the motion scale', () => {
    for (const [id, c] of Object.entries(ROLE_CONTENT)) {
      expect(Object.keys(DUR), `${id} stagger`).toContain(c.MOTION.stagger);
      expect(Object.keys(EASE), `${id} ease`).toContain(c.MOTION.ease);
      expect(['reveal', 'meter'], `${id} draw`).toContain(c.MOTION.draw);
    }
  });

  it('the labels cover the three ways of working and the three edge kinds', () => {
    expect(Object.keys(WORKS_LABEL)).toEqual(['commands', 'documents', 'both']);
    expect(Object.keys(WORKS_SHORT)).toEqual(['commands', 'documents', 'both']);
    expect(Object.keys(FLOW_KIND_LABEL)).toEqual(['review', 'approve', 'feeds']);
    expect(words(FLOW_HOW_TO_READ)).toBeLessThanOrEqual(30);
  });

  it('splits a Function (Role) name and leaves a bare name whole', () => {
    expect(splitRoleName('Offensive Security (Red Team)')).toEqual({ fn: 'Offensive Security', tag: 'Red Team' });
    expect(splitRoleName('Student')).toEqual({ fn: 'Student' });
    expect(profileOf(roleContentFor('cissp').PROFILES, 'idops')?.works).toBe('both');
    expect(profileOf([], 'x')).toBeUndefined();
  });

  it('the register: third person, no contractions, no em dash, no emoji, no nicknames', () => {
    const src = readFileSync('src/lib/docs/roles.ts', 'utf8');
    expect(src).not.toMatch(/Runners|Wardens|Fixers/);
    for (const [id, c] of Object.entries(ROLE_CONTENT)) {
      for (const x of c.PROFILES) {
        for (const s of [x.summary, x.arc, ...x.responsibilities]) {
          expect(s, `${id}/${x.id}: second person`).not.toMatch(/\b(you|your|yours|we|our)\b/i);
          expect(s, `${id}/${x.id}: contraction`).not.toMatch(/\b\w+n[’']t\b|\b\w+[’'](re|ll|ve|m)\b|\b(it|that|what|there|here)[’']s\b/i);
          expect(s, `${id}/${x.id}: em dash`).not.toMatch(/—/);
          expect(s, `${id}/${x.id}: emoji`).not.toMatch(/\p{Extended_Pictographic}/u);
        }
      }
    }
  });
});
