import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { SEED_COURSES, courseDto } from '../content/dto';
import { buildSheet } from './buildSheet';

/**
 * R103 — the committed build sheets are current: one per course, equal to a
 * fresh render of the course document. Fails with the same message as the
 * JSON snapshot test when a picture changed without `npm run content:export`.
 */
describe('docs/courses/build-sheets — one per course, current', () => {
  it.each(SEED_COURSES.map((c) => c.id))('%s.md is current', (id) => {
    const file = resolve(process.cwd(), 'docs', 'courses', 'build-sheets', `${id}.md`);
    expect(existsSync(file), `${id}.md exists`).toBe(true);
    expect(readFileSync(file, 'utf8'), 'picture changed: run `npm run content:export` and commit docs/courses/build-sheets/').toBe(buildSheet(courseDto(id)) + '\n');
  });

  it('a sheet lists every week with its parts, purposes and records', () => {
    const sheet = buildSheet(courseDto('security-plus'));
    expect(sheet).toContain('## Week 1');
    expect(sheet).toContain('| Hardening baseline |');
    expect(sheet).toContain('| Scope & RoE |');
    expect(sheet).toContain('**Process — Cold Recon:**');
  });
});
