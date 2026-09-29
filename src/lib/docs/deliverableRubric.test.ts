import { describe, expect, it } from 'vitest';
import { evaluateBundle, passesCheck, stepsProducing, verdictOf, type BundleContext } from './deliverableRubric';
import { withDerivedBundle } from './derive';
import { taskToken } from '../evidenceLedger';
import { SECURITY_PLUS } from '../data/seed/securityPlus';
import { CYSA_PLUS } from '../data/seed/cysa';
import { MSSP } from '../data/seed/mssp';
import { SERVER_PLUS } from '../data/seed/serverPlus';
import { CCNA } from '../data/seed/ccna';
import { AZURE_CLOUD } from '../data/seed/azureCloud';
import { seedDeliverablesForCourse } from './definitions';
import { emptyData } from './types';
import type { StepEvidence } from '../data/types';

const COURSES = [SECURITY_PLUS, CYSA_PLUS, MSSP, SERVER_PLUS, CCNA, AZURE_CLOUD];

const ctx = (over: Partial<BundleContext> = {}): BundleContext => ({
  evidence: {},
  steps: [],
  week: 4,
  now: 1_800_000_000_000,
  ...over,
});

describe('the derived bundle covers every deliverable in every course', () => {
  it.each(COURSES.map((c) => [c.id, c] as const))('%s: four categories, never silent', (id) => {
    for (const raw of seedDeliverablesForCourse(id)) {
      const def = withDerivedBundle(raw);
      const r = evaluateBundle(def, emptyData(), ctx());
      expect(Object.keys(r.categories).sort()).toEqual(['authenticity', 'completeness', 'consistency', 'correctness']);
      for (const cat of Object.values(r.categories)) {
        // A category with nothing to check must SAY so, not silently pass.
        expect(cat.items.length > 0 || !!cat.note).toBe(true);
      }
      expect(def.visual?.kit).toBeTruthy();
    }
  });

  it('derives the validators the field types imply', () => {
    const def = withDerivedBundle({
      id: 'x', num: 1, file: 'x.md', title: 'x', owner: 'red', folder: '', standard: '',
      weeks: [1], kind: 'form', exportFormat: 'md', purpose: '', howTo: '',
      sections: [
        { kind: 'fields', fields: [
          { field: 'ip', label: 'IP', type: 'ipv4' },
          { field: 'sev', label: 'Severity', type: 'select', options: ['low', 'high'] },
          { field: 'story', label: 'Story', type: 'area', required: true },
        ] },
      ],
    } as never);
    const rules = (def.checks ?? []).map((c) => c.rule).sort();
    expect(rules).toEqual(['minLength', 'oneOf', 'pattern']);
  });
});

describe('passesCheck', () => {
  it('judges each rule, and empty values are Completeness’s job', () => {
    expect(passesCheck({ field: 'f', rule: 'pattern', value: '^\\d+$', hint: '' }, '42')).toBe(true);
    expect(passesCheck({ field: 'f', rule: 'pattern', value: '^\\d+$', hint: '' }, '4x2')).toBe(false);
    expect(passesCheck({ field: 'f', rule: 'pattern', value: '^\\d+$', hint: '' }, '')).toBe(true);
    expect(passesCheck({ field: 'f', rule: 'keyword', value: ['deny', 'allow'], hint: '' }, 'Deny then ALLOW')).toBe(true);
    expect(passesCheck({ field: 'f', rule: 'forbidden', value: ['password123'], hint: '' }, 'uses Password123!')).toBe(false);
    expect(passesCheck({ field: 'f', rule: 'oneOf', value: ['a', 'b'], hint: '' }, 'c')).toBe(false);
    expect(passesCheck({ field: 'f', rule: 'minLength', value: 5, hint: '' }, 'abcd')).toBe(false);
  });
});

describe('evaluateBundle categories', () => {
  const def = withDerivedBundle({
    ...seedDeliverablesForCourse('security-plus')[0],
  });

  it('authenticity follows the producing steps’ ledger records', () => {
    const step = { id: 's1', title: 'Scan', verify: ['open'] } as never;
    const rec = (m: StepEvidence['method'], v: boolean): StepEvidence => ({
      courseId: 'security-plus', taskId: 't1', stepId: 's1', verified: v, method: m,
      matchedTokens: 1, totalTokens: 1, attempts: 1, firstAttemptAt: 1, verifiedAt: 2,
    });
    const steps = [{ step, taskId: 't1' }];
    expect(evaluateBundle(def, emptyData(), ctx({ steps, evidence: { 't1::s1': rec('verified-output', true) } })).categories.authenticity.ok).toBe(true);
    expect(evaluateBundle(def, emptyData(), ctx({ steps, evidence: { 't1::s1': rec('self-attested', true) } })).categories.authenticity.ok).toBe(false);
    expect(evaluateBundle(def, emptyData(), ctx({ steps })).categories.authenticity.ok).toBe(false);
  });

  it('consistency rejects impossible ledger timestamps', () => {
    const bad: StepEvidence = {
      courseId: 'security-plus', taskId: 't1', stepId: 's1', verified: true, method: 'verified-output',
      matchedTokens: 1, totalTokens: 1, attempts: 1, firstAttemptAt: 100, verifiedAt: 50,
    };
    expect(evaluateBundle(def, emptyData(), ctx({ evidence: { 't1::s1': bad } })).categories.consistency.ok).toBe(false);
  });
});

describe('stepsProducing', () => {
  it('links steps to their deliverable by file name', () => {
    for (const course of COURSES) {
      for (const def of seedDeliverablesForCourse(course.id)) {
        for (const { step } of stepsProducing(course, def)) {
          expect(step.producesDeliverable).toBe(def.file);
        }
      }
    }
  });
});

describe('verdictOf — the six branches', () => {
  const green = { categories: { completeness: true, correctness: true, authenticity: true, consistency: true } };
  const red = { categories: { completeness: false, correctness: true, authenticity: true, consistency: true } };

  it('both confirm → pass; both reject → fail', () => {
    expect(verdictOf(green, [true, true], 5)).toBe('pass');
    expect(verdictOf(green, [false, false], 5)).toBe('fail');
  });
  it('a split lets the frozen automatic checks decide, labelled platform', () => {
    expect(verdictOf(green, [true, false], 5)).toBe('platform_pass');
    expect(verdictOf(red, [true, false], 5)).toBe('platform_fail');
  });
  it('fewer than two eligible reviewers → the platform decides immediately', () => {
    expect(verdictOf(green, [], 1)).toBe('platform_pass');
    expect(verdictOf(red, [], 0)).toBe('platform_fail');
  });
  it('waiting on peers is pending', () => {
    expect(verdictOf(green, [true], 5)).toBe('pending_review');
  });
  it('the instructor’s verdict outranks everything', () => {
    expect(verdictOf(red, [false, false], 5, 'approved')).toBe('overridden_pass');
    expect(verdictOf(green, [true, true], 5, 'revise')).toBe('overridden_fail');
    expect(verdictOf(green, [true, true], 5, 'pending')).toBe('pass');
  });
});

describe('taskToken', () => {
  it('has the stamp shape and no confusable characters', () => {
    expect(taskToken('u1', 'security-plus', 't1')).toMatch(/^CQ-[A-HJ-NP-TV-Z2-9]{6}$/);
  });
  it('is stable for the same inputs and distinct across users and tasks', () => {
    const a = taskToken('u1', 'security-plus', 't1');
    expect(taskToken('u1', 'security-plus', 't1')).toBe(a);
    expect(taskToken('u2', 'security-plus', 't1')).not.toBe(a);
    expect(taskToken('u1', 'security-plus', 't2')).not.toBe(a);
  });
});
