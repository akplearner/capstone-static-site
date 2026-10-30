import { describe, expect, it } from 'vitest';
import { evaluateBundle, passesCheck, stepsProducing, verdictOf, type BundleContext } from './deliverableRubric';
import { withDerivedBundle } from './derive';
import { taskToken } from '../evidenceLedger';
import { SECURITY_PLUS } from '../data/seed/securityPlus';
import { CYSA_PLUS } from '../data/seed/cysa';
import { MSSP } from '../data/seed/mssp';
import { SERVER_PLUS } from '../data/seed/serverPlus';
import { CCNA } from '../data/seed/ccna';
import { A_PLUS } from '../data/seed/aPlus';
import { AI_FOUNDATIONS } from '../data/seed/aiFoundations';
import { AWS_AI_PRACTITIONER } from '../data/seed/awsAiPractitioner';
import { AWS_SECURITY_SPECIALTY } from '../data/seed/awsSecuritySpecialty';
import { DOCKER_DCA } from '../data/seed/dockerDca';
import { KUBERNETES_CKA } from '../data/seed/kubernetesCka';
import { NVIDIA_AI_INFRASTRUCTURE } from '../data/seed/nvidiaAiInfrastructure';
import { NETWORK_PLUS } from '../data/seed/networkPlus';
import { SECAI_PLUS } from '../data/seed/secaiPlus';
import { CISSP } from '../data/seed/cissp';
import { AZURE_COURSES } from '../data/seed/azureCloud';
import { AWS_COURSES } from '../data/seed/awsCloud';
import { seedDeliverablesForCourse } from './definitions';
import { emptyData } from './types';
import type { StepEvidence } from '../data/types';

const COURSES = [SECURITY_PLUS, CYSA_PLUS, MSSP, SERVER_PLUS, CCNA, A_PLUS, NETWORK_PLUS, SECAI_PLUS, CISSP, ...AZURE_COURSES, ...AWS_COURSES, AI_FOUNDATIONS, AWS_AI_PRACTITIONER, DOCKER_DCA, KUBERNETES_CKA, NVIDIA_AI_INFRASTRUCTURE, AWS_SECURITY_SPECIALTY];

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
          // R139: a prefix and a port each imply a pattern.
          { field: 'net', label: 'Prefix', type: 'cidr' },
          { field: 'svc', label: 'Port', type: 'port' },
        ] },
      ],
    } as never);
    const rules = (def.checks ?? []).map((c) => c.rule).sort();
    // R138: the derived document-control block adds a status select, and so one more oneOf.
    expect(rules).toEqual(['minLength', 'oneOf', 'oneOf', 'pattern', 'pattern', 'pattern']);
    const cidr = def.checks!.find((c) => c.field === 'net')!;
    const port = def.checks!.find((c) => c.field === 'svc')!;
    for (const [v, ok] of [['10.10.1.0/24', true], ['10.10.1.0', false], ['10.10.1.0/33', false]] as const) expect(passesCheck(cidr, v), v).toBe(ok);
    for (const [v, ok] of [['443', true], ['443/tcp', true], ['8000-8080/UDP', true], ['any', true], ['https', false], ['443/tcp HTTPS', false]] as const) expect(passesCheck(port, v), v).toBe(ok);
    const last = def.sections[def.sections.length - 1];
    expect(last.kind === 'fields' && last.title).toBe('Document control');
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

  it('consistency lists what the form contradicts in the team’s record, a warning listed but not failing (R139)', () => {
    const defs = seedDeliverablesForCourse('server-plus');
    const plan = defs.find((d) => d.id === 'srv_ip_plan')!;
    const docs = {
      srv_business_reqs: { fields: {}, groups: { machines: [{ hostname: 'websrv', zone: 'vmbr1 — DMZ' }, { hostname: 'linuxsrv', zone: 'vmbr2 — private' }] } },
    };
    const data = { fields: {}, groups: { addresses: [{ hostname: 'websrv', address: '192.168.0.3/24', gateway: '1.1.1.1', dns: '1.1.1.1' }, { hostname: 'linuxsrv', address: '192.168.0.3/24', gateway: '1.1.1.1', dns: '1.1.1.1' }] } };
    const withRecord = evaluateBundle(plan, data, ctx({ docs, defs }));
    expect(withRecord.categories.consistency.ok).toBe(false);
    expect(withRecord.categories.consistency.items.some((i) => i.id.startsWith('conflict:duplicate-address') && i.severity === 'error')).toBe(true);
    // The same form judged alone (a frozen snapshot) reads nothing of the record.
    expect(evaluateBundle(plan, data, ctx({})).categories.consistency.items.some((i) => i.id.startsWith('conflict:'))).toBe(false);
    // A warning only: the item is listed, the category stays green.
    const baseline = defs.find((d) => d.id === 'srv_standards')!;
    const warn = evaluateBundle(baseline, { fields: {}, groups: { baseline: [{ host: 'dbsrv', what: 'x', command: 'x', file: 'x', hash: 'x' }] } }, ctx({ docs, defs }));
    expect(warn.categories.consistency.items.some((i) => i.severity === 'warn' && !i.ok)).toBe(true);
    expect(warn.categories.consistency.ok).toBe(true);
    // Nothing to contradict: one green item says so.
    const quiet = evaluateBundle(plan, { fields: {}, groups: { addresses: [{ hostname: 'websrv', address: '172.16.0.10/24', gateway: '1.1.1.1', dns: '1.1.1.1' }] } }, ctx({ docs, defs }));
    expect(quiet.categories.consistency.items.find((i) => i.id === 'record')?.ok).toBe(true);
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
