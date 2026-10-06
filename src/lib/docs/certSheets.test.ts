import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { SEED_COURSES, courseDto } from '../content/dto';
import { certSheet } from './certSheet';

/**
 * R106 — the committed certification and cost sheets are current: one per
 * course, equal to a fresh render of the course document.
 */
describe('docs/courses/cert-coverage — one per course, current', () => {
  it.each(SEED_COURSES.map((c) => c.id))('%s.md is current', (id) => {
    const file = resolve(process.cwd(), 'docs', 'courses', 'cert-coverage', `${id}.md`);
    expect(existsSync(file), `${id}.md exists`).toBe(true);
    expect(readFileSync(file, 'utf8'), 'registry or tasks changed: run `npm run content:export` and commit docs/courses/cert-coverage/').toBe(certSheet(courseDto(id)) + '\n');
  });

  it('a sheet names the exam, the ladder, every domain with its weight and what practises it, and the cost', () => {
    const sheet = certSheet(courseDto('aws-cloud-practitioner'));
    expect(sheet).toContain('**AWS Cloud Practitioner (CLF-C02)**');
    expect(sheet).toContain('**Cloud Practitioner (CLF-C02)** → Solutions Architect');
    expect(sheet).toContain('| Cloud Concepts | 24% |');
    expect(sheet).toContain('## Cost');
    expect(sheet).toContain('Exam $100');
    const sec = certSheet(courseDto('security-plus'));
    expect(sec).toContain('| General Security Concepts | 12% | — Read with the exam guide');
  });
});
