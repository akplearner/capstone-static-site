import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ENVIRONMENT_PROFILE_SCHEMA, SAMPLE_PROFILE_COURSE, SAMPLE_PROFILE_ID, profileJson, sampleProfile } from './environmentProfile';
import { SEED_COURSES } from '../content/dto';
import { seedDeliverablesForCourse } from './definitions';
import { skillOf } from './skills';
import { toolOf } from './tools';
import { sopOf, SOPS } from './sops';
import { controlOf, standardOf } from './standards';
import { workRoleOf } from './workRoles';

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/**
 * R108 — the sample environment profile: every id resolves in the
 * registries, the committed file equals a fresh build, and the words keep
 * the register. The service levels are declared, never measured.
 */
describe('R108 — the sample environment profile', () => {
  const course = SEED_COURSES.find((c) => c.id === SAMPLE_PROFILE_COURSE)!;
  const profile = sampleProfile(course, seedDeliverablesForCourse(course.id));

  it('names the schema, resolves every id, and is non-trivial', () => {
    expect(profile.schema).toBe(ENVIRONMENT_PROFILE_SCHEMA);
    expect(profile.id).toBe(SAMPLE_PROFILE_ID);
    expect(profile.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(profile.infrastructure.length).toBeGreaterThanOrEqual(8);
    expect(profile.tools.length).toBeGreaterThanOrEqual(5);
    expect(profile.methodology.length).toBeGreaterThanOrEqual(5);
    expect(profile.policies.length).toBeGreaterThanOrEqual(5);
    expect(profile.ticketTaxonomy.length).toBeGreaterThanOrEqual(3);
    expect(profile.workRoles.length).toBe(course.roles.length);
    for (const id of profile.tools) expect(toolOf(id), id).toBeDefined();
    for (const id of profile.methodology) expect(sopOf(id), id).toBeDefined();
    for (const code of profile.policies) expect(controlOf(code) ?? standardOf(code), code).toBeDefined();
    for (const w of profile.workRoles) {
      expect(workRoleOf(w.workRole), w.workRole).toBeDefined();
      expect(w.requiredCompetencies.length, `${w.workRole} requires competencies`).toBeGreaterThan(0);
      for (const id of w.requiredCompetencies) expect(skillOf(id), id).toBeDefined();
    }
    const kinds = new Set(SOPS.map((s) => s.kind));
    for (const k of profile.requiredSops) expect(kinds.has(k), k).toBe(true);
    expect(profile.requiredSops).toEqual([...new Set(profile.methodology.map((id) => sopOf(id)!.kind))].sort());
    expect(new Set(profile.infrastructure.map((n) => n.id)).size).toBe(profile.infrastructure.length);
  });

  it('keeps the register and the budgets', () => {
    expect(words(profile.architecture)).toBeLessThanOrEqual(25);
    for (const text of [profile.name, profile.publisher, profile.architecture, ...profile.infrastructure.map((n) => n.purpose), ...profile.ticketTaxonomy.flatMap((t) => [t.kind, t.priority, t.sla.acknowledge, t.sla.resolve])]) {
      expect(text, `${text}: second person`).not.toMatch(/\b(you|your|yours|we|our)\b/i);
      expect(text, `${text}: em dash or emoji`).not.toMatch(/—|\p{Extended_Pictographic}/u);
      expect(text, `${text}: contraction`).not.toMatch(/\b\w+n[’']t\b|\b\w+[’'](re|ll|ve|m)\b|\b(it|that|what|there|here)[’']s\b/i);
    }
    for (const n of profile.infrastructure) expect(words(n.purpose), `${n.id} purpose ≤ 12 words`).toBeLessThanOrEqual(12);
  });

  it('the committed file is current', () => {
    const file = resolve(process.cwd(), 'content', 'profiles', 'sample-mssp.json');
    expect(existsSync(file), 'content/profiles/sample-mssp.json exists').toBe(true);
    expect(readFileSync(file, 'utf8'), 'the sample changed: run `npm run content:export` and commit content/profiles/').toBe(profileJson(profile));
  });
});
