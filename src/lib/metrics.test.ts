import { describe, it, expect } from 'vitest';
import { courseMetrics, portfolioSummary, evidenceQuality, type CourseMetrics } from './metrics';
import { PATHS, pathById, resolvePath, pathProgress } from './catalog/paths';
import { CATALOG } from './catalog';
import type { StepEvidence } from './data/types';
import type { Course } from './types';

// The verification rate is the number the dashboard and the portfolio lead with —
// it is what the platform asserts about someone's work to an employer. These tests
// pin the arithmetic, and especially the cases where a naive implementation would
// overstate it.

const COURSE: Course = {
  id: 'test-course',
  title: 'Test Capstone',
  slug: 'test-course',
  description: '',
  roles: [{ id: 'blue', name: 'Blue', mission: '', color: '#000', icon: 'Shield' }],
  weeks: [
    { number: 0, title: 'Setup', theme: '', objective: '', setup: true },
    { number: 1, title: 'Week 1', theme: '', objective: '' },
  ],
  gates: [],
  tasks: [
    {
      id: 't-setup',
      role: 'blue',
      week: 0,
      title: 'Setup task',
      objective: '',
      frameworks: ['CIS'],
      deliverables: [],
      steps: [{ id: 's0', title: '', description: '', whatItMeans: '', frameworks: [], verify: ['x'] }],
    },
    {
      id: 't1',
      role: 'blue',
      week: 1,
      title: 'Real task',
      objective: '',
      frameworks: ['NIST_CSF'],
      deliverables: [],
      steps: [
        { id: 's1', title: '', description: '', whatItMeans: '', frameworks: ['OWASP'], verify: ['a'] },
        { id: 's2', title: '', description: '', whatItMeans: '', frameworks: [], verify: ['b'] },
        { id: 's3', title: '', description: '', whatItMeans: '', frameworks: [] },
        { id: 's4', title: '', description: '', whatItMeans: '', frameworks: [], verify: ['c'], optional: true },
      ],
    },
  ],
};

function rec(over: Partial<StepEvidence> & { taskId: string; stepId: string }): StepEvidence {
  return {
    courseId: 'test-course',
    verified: false,
    method: 'self-attested',
    matchedTokens: 0,
    totalTokens: 1,
    attempts: 1,
    ...over,
  };
}

describe('courseMetrics', () => {
  it('counts only non-optional steps in graded weeks', () => {
    const m = courseMetrics({ course: COURSE, role: 'blue', taskPercent: {}, evidence: {}, artifacts: [] });
    // t-setup is a setup week (excluded); s4 is optional (excluded).
    expect(m.stepsTotal).toBe(3);
    expect(m.verifiable).toBe(2); // s1 and s2; s3 has no verify, s4 is optional
  });

  it('reports the verification rate over VERIFIABLE steps, not all steps', () => {
    const evidence = {
      't1::s1': rec({ taskId: 't1', stepId: 's1', verified: true, method: 'verified-output' }),
    };
    const m = courseMetrics({ course: COURSE, role: 'blue', taskPercent: {}, evidence, artifacts: [] });
    expect(m.verified).toBe(1);
    expect(m.verifiable).toBe(2);
    expect(m.verificationRate).toBe(50);
  });

  it('does not divide by zero when nothing is verifiable', () => {
    const bare: Course = {
      ...COURSE,
      tasks: [{ ...COURSE.tasks[1], steps: [{ id: 'p', title: '', description: '', whatItMeans: '', frameworks: [] }] }],
    };
    const m = courseMetrics({ course: bare, role: 'blue', taskPercent: {}, evidence: {}, artifacts: [] });
    expect(m.verifiable).toBe(0);
    expect(m.verificationRate).toBe(0);
    // And the label must not read as a failed 0% when there was nothing to check.
    expect(evidenceQuality(m).label).toBe('No verifiable steps in this course');
  });

  it('never counts a self-attested step as verified', () => {
    const evidence = {
      't1::s1': rec({ taskId: 't1', stepId: 's1' }),
      't1::s2': rec({ taskId: 't1', stepId: 's2' }),
    };
    const m = courseMetrics({ course: COURSE, role: 'blue', taskPercent: {}, evidence, artifacts: [] });
    expect(m.verified).toBe(0);
    expect(m.selfAttested).toBe(2);
    expect(m.verificationRate).toBe(0);
    expect(evidenceQuality(m).tone).toBe('none');
  });

  it('credits frameworks only when a step is actually verified', () => {
    const unverified = courseMetrics({
      course: COURSE,
      role: 'blue',
      taskPercent: {},
      evidence: { 't1::s1': rec({ taskId: 't1', stepId: 's1' }) },
      artifacts: [],
    });
    expect(unverified.frameworksVerified).toEqual([]);

    const verified = courseMetrics({
      course: COURSE,
      role: 'blue',
      taskPercent: {},
      evidence: {
        't1::s1': rec({ taskId: 't1', stepId: 's1', verified: true, method: 'verified-output' }),
      },
      artifacts: [],
    });
    // The step's own framework plus its task's.
    expect(verified.frameworksVerified).toEqual(['NIST_CSF', 'OWASP']);
  });

  it('tracks attempts and the activity span without judging them', () => {
    const evidence = {
      't1::s1': rec({
        taskId: 't1',
        stepId: 's1',
        verified: true,
        method: 'verified-output',
        attempts: 5,
        firstAttemptAt: Date.parse('2026-01-01T10:00:00Z'),
        verifiedAt: Date.parse('2026-01-03T10:00:00Z'),
      }),
    };
    const m = courseMetrics({ course: COURSE, role: 'blue', taskPercent: {}, evidence, artifacts: [] });
    expect(m.attempts).toBe(5);
    expect(m.activeDays).toBe(2);
    expect(m.firstActivity).toBe(Date.parse('2026-01-01T10:00:00Z'));
    expect(m.lastActivity).toBe(Date.parse('2026-01-03T10:00:00Z'));
    // Five attempts is troubleshooting, not a penalty — the quality label is
    // driven purely by whether it ended verified.
    expect(evidenceQuality(m).tone).toBe('partial');
  });

  it('counts only this course’s artifacts, and how many were named correctly', () => {
    const m = courseMetrics({
      course: COURSE,
      role: 'blue',
      taskPercent: {},
      evidence: {},
      artifacts: [
        { courseId: 'test-course', sha256: 'a', filename: 'good.pcap', sizeBytes: 1, nameOk: true, hashedAt: 1 },
        { courseId: 'test-course', sha256: 'b', filename: 'bad.png', sizeBytes: 1, nameOk: false, hashedAt: 1 },
        { courseId: 'other', sha256: 'c', filename: 'x', sizeBytes: 1, nameOk: true, hashedAt: 1 },
      ],
    });
    expect(m.artifacts).toBe(2);
    expect(m.artifactsNamedWell).toBe(1);
  });
});

describe('portfolioSummary', () => {
  const a: CourseMetrics = {
    courseId: 'a', courseTitle: 'A', stepsDone: 10, stepsTotal: 20, verifiable: 10, verified: 9,
    selfAttested: 1, verificationRate: 90, artifacts: 3, artifactsNamedWell: 3, attempts: 12,
    firstActivity: 100, lastActivity: 500, activeDays: 3,
    frameworksVerified: ['CIS'], frameworksTotal: ['CIS'],
  };
  const b: CourseMetrics = {
    ...a, courseId: 'b', courseTitle: 'B', verifiable: 90, verified: 9, verificationRate: 10,
    firstActivity: 50, lastActivity: 900, frameworksVerified: ['OWASP'],
  };

  it('rolls up on totals, not on an average of percentages', () => {
    const s = portfolioSummary([a, b]);
    // Averaging the two rates would give 50%; the truth is 18/100.
    expect(s.verified).toBe(18);
    expect(s.verifiable).toBe(100);
    expect(s.verificationRate).toBe(18);
  });

  it('spans the earliest and latest activity and merges frameworks', () => {
    const s = portfolioSummary([a, b]);
    expect(s.firstActivity).toBe(50);
    expect(s.lastActivity).toBe(900);
    expect(s.frameworksVerified).toEqual(['CIS', 'OWASP']);
  });

  it('handles an empty portfolio', () => {
    const s = portfolioSummary([]);
    expect(s).toMatchObject({ courses: 0, verificationRate: 0, firstActivity: 0, lastActivity: 0 });
  });
});

describe('career paths', () => {
  it('every rung resolves to a real catalog entry', () => {
    const ids = new Set(CATALOG.map((e) => e.id));
    for (const p of PATHS) {
      for (const id of p.entryIds) {
        expect(ids.has(id), `${p.id} → "${id}"`).toBe(true);
      }
    }
  });

  it('path ids are unique and lookup works', () => {
    const ids = PATHS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(pathById('blue-team')?.name).toBe('Blue Team');
    expect(pathById('nope')).toBeUndefined();
  });

  it('marks completed rungs and picks the next AVAILABLE one as current', () => {
    const blue = pathById('blue-team')!;
    // network+ is coming-soon; security+ is the first available rung.
    const rungs = resolvePath(blue, new Set());
    expect(rungs.find((r) => r.current)?.entry.courseId).toBe('security-plus');

    const after = resolvePath(blue, new Set(['security-plus']));
    expect(after.find((r) => r.entry.courseId === 'security-plus')?.complete).toBe(true);
    expect(after.find((r) => r.current)?.entry.courseId).toBe('cysa-plus');
  });

  it('reports progress as done/total rungs', () => {
    const blue = pathById('blue-team')!;
    expect(pathProgress(blue, new Set())).toEqual({ done: 0, total: 4 });
    expect(pathProgress(blue, new Set(['security-plus', 'cysa-plus']))).toEqual({ done: 2, total: 4 });
  });

  it('leaves no rung current once every available capstone is done', () => {
    const grc = pathById('grc')!;
    const rungs = resolvePath(grc, new Set(['security-plus', 'mssp']));
    expect(rungs.some((r) => r.current)).toBe(false);
  });
});
