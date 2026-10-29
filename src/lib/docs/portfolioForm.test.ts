import { describe, expect, it } from 'vitest';
import { SEED_COURSES } from '../content/dto';
import { isGradedWeek } from '../course-helpers';
import { seedDeliverablesForCourse } from './definitions';
import { evaluate } from './predicate';
import { CASE_STUDY_WORDS, PORTFOLIO_FORMS, portfolioForm, portfolioOf, wordCount } from './portfolioForm';
import { PORTFOLIO_PLAN, PORTFOLIO_STEP_ID, PORTFOLIO_TITLE, portfolioId, portfolioPlanOf, withPortfolioStep } from './portfolioPlan';
import { DELIVERABLE_SOPS, sopOf } from './sops';
import { recordFieldsOf } from './projectRecord';
import { formCategories } from './recordCategories';
import type { DeliverableData } from './types';

/**
 * R142 — every course closes on one Portfolio: shared, in the last graded
 * week, feeding the capstone, written by the last step of the task that writes
 * the capstone, with a case study of two hundred words or more.
 */
const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(' ');
const filled = (caseStudy: string): DeliverableData => ({
  fields: { doc_id: 'CAP-PF-001', version: '1.0', doc_owner: 'GRC', doc_date: '2026-10-30', doc_status: 'Draft', repo_url: 'https://github.com/org/capstone-team01', case_study: caseStudy, diagram_ref: 'the course picture', resume_1: 'one', resume_2: 'two', resume_3: 'three' },
  groups: { skills_demonstrated: [{ skill: 'a', evidence: 'x', where: 'w1' }, { skill: 'b', evidence: 'y', where: 'w2' }, { skill: 'c', evidence: 'z', where: 'w3' }] },
});

describe('R142 — the Portfolio', () => {
  it('is placed once in every course: shared, in the last graded week, feeding the capstone, in the register', () => {
    for (const c of SEED_COURSES) {
      const defs = seedDeliverablesForCourse(c.id);
      const mine = defs.filter((d) => d.portfolio);
      expect(mine, `${c.id} has one Portfolio`).toHaveLength(1);
      const [d] = mine;
      const last = Math.max(...c.weeks.filter((w) => isGradedWeek(c, w.number)).map((w) => w.number));
      expect(d.weeks, `${c.id} Portfolio sits in the last graded week`).toEqual([last]);
      expect(d.shared, `${c.id} Portfolio is shared`).toBe(true);
      expect(d.title).toBe(PORTFOLIO_TITLE);
      expect(d.capstone).toBeFalsy();
      const capstone = defs.find((x) => x.capstone)!;
      expect(d.feeds, `${c.id} Portfolio feeds the capstone`).toEqual([capstone.id]);
      expect(d.num, `${c.id} Portfolio is numbered last`).toBe(Math.max(...defs.map((x) => x.num)));
      expect(new Set(defs.map((x) => x.num)).size, `${c.id} form numbers are unique`).toBe(defs.length);
      expect(c.roles.map((r) => r.id)).toContain(d.owner);
      expect(d.raci?.drafts).toBe(d.owner);
      // The SOP map, the record and the categories know it.
      expect(DELIVERABLE_SOPS[c.id][d.id]).toEqual(['sop.portfolio']);
      expect(sopOf('sop.portfolio')).toBeTruthy();
      expect(recordFieldsOf(d).map((f) => f.field)).toEqual(['repo_url']);
      expect(formCategories(d)).toEqual(expect.arrayContaining(['documentation', 'communication', 'projects']));
      const text = JSON.stringify(d);
      expect(text, `${c.id} Portfolio: second person`).not.toMatch(/\b(you|your)\b/i);
    }
    expect(PORTFOLIO_FORMS).toHaveLength(SEED_COURSES.length);
  });

  it('is written by the last step of the task that writes the capstone, in every course', () => {
    for (const c of SEED_COURSES) {
      const plan = portfolioPlanOf(c.id)!;
      expect(plan, `${c.id} has a plan`).toBeTruthy();
      const task = c.tasks.find((t) => t.id === plan.writtenBy)!;
      expect(task, `${c.id}: ${plan.writtenBy} exists`).toBeTruthy();
      expect(isGradedWeek(c, task.week), `${c.id}: the Portfolio is written in a graded week`).toBe(true);
      expect(task.week).toBe(plan.week);
      const last = task.steps[task.steps.length - 1];
      expect(last.id).toBe(PORTFOLIO_STEP_ID);
      expect(last.usesForm).toBe(PORTFOLIO_TITLE);
      expect(last.frameworks).toEqual(task.frameworks);
      // Applying it again changes nothing.
      expect(withPortfolioStep(c)).toBe(c);
    }
    expect(() => withPortfolioStep({ id: 'security-plus', tasks: [] })).toThrow(/grc-w4-report/);
    expect(withPortfolioStep({ id: 'no-such-course', tasks: [] })).toEqual({ id: 'no-such-course', tasks: [] });
  });

  it('holds the case study to two hundred words and the repository to a link', () => {
    const def = portfolioForm(PORTFOLIO_PLAN[0]);
    const check = (label: RegExp, data: DeliverableData) => evaluate(def.dod!.find((d) => label.test(d.label))!.when, data);
    expect(check(/two hundred/, filled(words(199)))).toBe(false);
    expect(check(/two hundred/, filled(words(200)))).toBe(true);
    expect(check(/two hundred/, filled(`  ${words(200)}\n`))).toBe(true);
    expect(check(/two hundred/, filled(words(100) + '\n\n' + words(100)))).toBe(true);
    expect(check(/link/, filled('x'))).toBe(true);
    expect(check(/link/, { ...filled('x'), fields: { ...filled('x').fields, repo_url: 'github.com/org/repo' } })).toBe(false);
    expect(check(/three skills/, filled('x'))).toBe(true);
    expect(check(/three skills/, { ...filled('x'), groups: { skills_demonstrated: [{ skill: 'a', evidence: '', where: '' }] } })).toBe(false);
    expect(def.dod!.every((d) => evaluate(d.when, filled(words(CASE_STUDY_WORDS))))).toBe(true);
    expect(wordCount(words(200))).toBe(200);
    expect(wordCount('  ')).toBe(0);
  });

  it('reads a team’s Portfolio back as one record, and null where nothing was written', () => {
    const defs = seedDeliverablesForCourse('security-plus');
    const id = portfolioId(PORTFOLIO_PLAN[0]);
    expect(portfolioOf({}, defs)).toBeNull();
    expect(portfolioOf({ [id]: { fields: {}, groups: {} } }, defs)).toBeNull();
    expect(portfolioOf({ [id]: filled(words(50)) }, defs)).toMatchObject({ formId: id, repoUrl: 'https://github.com/org/capstone-team01', caseStudyWords: 50, complete: false, bullets: ['one', 'two', 'three'], diagramRef: 'the course picture' });
    expect(portfolioOf({ [id]: filled(words(200)) }, defs)!.complete).toBe(true);
    expect(portfolioOf({ [id]: filled(words(200)) }, defs)!.skills).toHaveLength(3);
    expect(portfolioOf({ [id]: filled('x') }, defs.filter((d) => !d.portfolio))).toBeNull();
  });
});
