import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { SEED_COURSES, courseDto } from '../content/dto';
import { skillSheet } from './skillSheet';
import { SKILLS_COPY } from './skillsCopy';

/**
 * R107 — the committed skills sheets are current: one per course, equal to a
 * fresh render of the course document.
 */
describe('docs/courses/skills — one per course, current', () => {
  it.each(SEED_COURSES.map((c) => c.id))('%s.md is current', (id) => {
    const file = resolve(process.cwd(), 'docs', 'courses', 'skills', `${id}.md`);
    expect(existsSync(file), `${id}.md exists`).toBe(true);
    expect(readFileSync(file, 'utf8'), 'a registry or a mapping changed: run `npm run content:export` and commit docs/courses/skills/').toBe(skillSheet(courseDto(id)) + '\n');
  });

  it('a sheet names the skills with their anchors, the tools, the procedures with their standards, the controls cited, and the tactics or their absence', () => {
    const sec = skillSheet(courseDto('security-plus'));
    expect(sec).toContain('## Skills');
    expect(sec).toContain('`comp.recon.port-scan`');
    expect(sec).toContain('SY0-701.d2');
    expect(sec).toContain('| nmap |');
    expect(sec).toContain('## Procedures');
    expect(sec).toContain('| Incident response plan | incident | NIST.800-61');
    expect(sec).toContain('| Reconnaissance (TA0043) |');
    const ccna = skillSheet(courseDto('ccna'));
    expect(ccna).toContain(SKILLS_COPY.noTactics);
    const mssp = skillSheet(courseDto('mssp'));
    expect(mssp).toContain('ISO27001.9.2');
    // R108: the KPI board section names the sixteen and their denominators per role.
    expect(sec).toContain('## KPI board');
    expect(sec).toContain('`kpi.ability.skills-verified`');
    expect(sec).toContain('metric.domain-weight-verified (own)');
    expect(sec).toMatch(/Exploitation Analyst: \d+ required, \d+ not taught here/);
    expect(ccna).toContain('## KPI board');
  });
});
