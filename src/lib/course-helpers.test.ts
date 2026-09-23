import { describe, it, expect } from 'vitest';
import { SECURITY_PLUS } from './data/seed/securityPlus';
import { CYSA_PLUS } from './data/seed/cysa';
import { MSSP } from './data/seed/mssp';
import { SERVER_PLUS } from './data/seed/serverPlus';
import {
  getTasksByRole,
  getRequiredSteps,
  getRequiredStepCount,
  getProgressSteps,
  getProgressStepCount,
  getWeekNumbers,
  isSetupWeek, isAdvancedWeek, isGradedWeek,
  weekSummary,
  parseEstimatedMinutes,
  formatMinutes,
} from './course-helpers';

describe('course-helpers on the Security+ seed', () => {
  it('getTasksByRole filters by role (and optionally week)', () => {
    const redAll = getTasksByRole(SECURITY_PLUS, 'red');
    expect(redAll.length).toBeGreaterThan(0);
    expect(redAll.every((t) => t.role === 'red')).toBe(true);

    const week = redAll[0].week;
    const redWeek = getTasksByRole(SECURITY_PLUS, 'red', week);
    expect(redWeek.every((t) => t.role === 'red' && t.week === week)).toBe(true);
    expect(redWeek.length).toBeLessThanOrEqual(redAll.length);
  });

  it('getRequiredStepCount excludes optional steps and never exceeds total', () => {
    for (const t of SECURITY_PLUS.tasks) {
      const required = getRequiredStepCount(t);
      expect(required).toBe(getRequiredSteps(t).length);
      expect(required).toBeLessThanOrEqual(t.steps.length);
      expect(getRequiredSteps(t).some((s) => s.optional)).toBe(false);
    }
  });

  it('getWeekNumbers is sorted ascending and unique', () => {
    const weeks = getWeekNumbers(SECURITY_PLUS);
    expect(weeks).toEqual([...weeks].sort((a, b) => a - b));
    expect(new Set(weeks).size).toBe(weeks.length);
  });
});

describe('progress denominator never collapses to zero', () => {
  const ALL = [SECURITY_PLUS, CYSA_PLUS, MSSP, SERVER_PLUS];

  it('every task with steps has a non-zero progress denominator', () => {
    // The bug this guards: a task built entirely from optional steps had a 0/0
    // denominator, reported 0% forever, and so permanently became "the week
    // you're on" — pinning the page open on Week 0 and the Continue button on
    // the lab build.
    for (const course of ALL) {
      for (const t of course.tasks) {
        if (t.steps.length === 0) continue;
        expect(getProgressStepCount(t), `${course.id}/${t.id}`).toBeGreaterThan(0);
      }
    }
  });

  it('falls back to all steps only when every step is optional', () => {
    for (const course of ALL) {
      for (const t of course.tasks) {
        const required = getRequiredStepCount(t);
        if (required > 0) {
          expect(getProgressSteps(t)).toEqual(getRequiredSteps(t));
        } else {
          expect(getProgressSteps(t)).toEqual(t.steps);
        }
      }
    }
  });

  it('the CySA all-optional lab build is the case that regressed', () => {
    const crW0 = CYSA_PLUS.tasks.find((t) => t.id === 'cr-w0');
    expect(crW0).toBeDefined();
    expect(crW0!.steps.every((s) => s.optional)).toBe(true);
    expect(getRequiredStepCount(crW0!)).toBe(0);
    expect(getProgressStepCount(crW0!)).toBe(crW0!.steps.length);
    // ...and it must be flagged so it is never offered as "your next task".
    expect(crW0!.homeLabOnly).toBe(true);
  });
});

describe('week summary aggregation', () => {
  it('parses the free-text estimatedTime formats actually used', () => {
    expect(parseEstimatedMinutes('90 min')).toBe(90);
    expect(parseEstimatedMinutes('60 min')).toBe(60);
    expect(parseEstimatedMinutes('2 h')).toBe(120);
    expect(parseEstimatedMinutes('1.5 hours')).toBe(90);
    // Prose with no duration must not be guessed at.
    expect(parseEstimatedMinutes('One-time setup (instructor / builder)')).toBeNull();
    expect(parseEstimatedMinutes(undefined)).toBeNull();
    expect(parseEstimatedMinutes('')).toBeNull();
  });

  it('formats a duration the way a student reads it', () => {
    expect(formatMinutes(45)).toBe('45 min');
    expect(formatMinutes(120)).toBe('2 h');
    expect(formatMinutes(90)).toBe('1 h 30 min');
  });

  it('aggregates tools and step counts from the week`s tasks', () => {
    const s = weekSummary(CYSA_PLUS, 'blue', 1);
    expect(s.taskCount).toBeGreaterThan(0);
    expect(s.stepCount).toBeGreaterThan(0);
    expect(new Set(s.tools).size).toBe(s.tools.length); // de-duplicated
    expect(s.minutes).toBeGreaterThan(0);
    expect(s.milestone).toBeTruthy();
    expect(s.difficulty).toBe(2);
  });

  it('the flow is the objectives, and falls back to task titles when a week authors none', () => {
    const s = weekSummary(CYSA_PLUS, 'blue', 1);
    expect(s.flow).toEqual(s.objectives.map((o) => o.label));
    // Blue's own objective is one of three; the other two are Red's and GRC's
    // parts of the week's story, and say so.
    expect(s.objectives).toHaveLength(3);
    expect(s.objectives.filter((o) => o.own.length > 0)).toHaveLength(1);
    expect(s.objectives.find((o) => o.own.length === 0)?.roles.length).toBeGreaterThan(0);
    const noObjectives = { ...CYSA_PLUS, weeks: CYSA_PLUS.weeks.map((w) => ({ ...w, objectives: undefined })) };
    const t = weekSummary(noObjectives, 'blue', 1);
    expect(t.flow).toEqual(t.tasks.map((x) => x.title));
    expect(t.objectives).toEqual([]);
  });

  it('on a shared-track course every objective has own tasks, and a deep-dive joins one', () => {
    const s = weekSummary(SERVER_PLUS, 'net', 1);
    expect(s.objectives).toHaveLength(4);
    for (const o of s.objectives) expect(o.own.length, o.label).toBeGreaterThan(0);
    // The net deep-dive is under "Bring the server up", and only for net.
    expect(s.objectives[0].own.map((t) => t.id)).toContain('sp-w1-net');
    expect(weekSummary(SERVER_PLUS, 'win', 1).objectives[0].own.map((t) => t.id)).not.toContain('sp-w1-net');
    expect(s.objectives[0].minutes).toBeGreaterThan(0);
  });

  it('returns an empty summary for a week the role has no tasks in', () => {
    const s = weekSummary(CYSA_PLUS, 'blue', 99);
    expect(s.taskCount).toBe(0);
    expect(s.tools).toEqual([]);
    expect(s.minutes).toBeNull();
  });

  it('every non-setup week in every course states a milestone', () => {
    for (const course of [SECURITY_PLUS, CYSA_PLUS, MSSP, SERVER_PLUS]) {
      for (const w of course.weeks) {
        expect(w.milestone, `${course.id} week ${w.number}`).toBeTruthy();
        expect(w.difficulty, `${course.id} week ${w.number}`).toBeDefined();
      }
    }
  });
});

describe('setup weeks', () => {
  it('week 0 is setup in every course, later weeks are not', () => {
    for (const course of [SECURITY_PLUS, CYSA_PLUS, MSSP, SERVER_PLUS]) {
      expect(isSetupWeek(course, 0), course.id).toBe(true);
      for (const w of course.weeks.filter((x) => x.number > 0)) {
        expect(isSetupWeek(course, w.number), `${course.id}/w${w.number}`).toBe(false);
      }
    }
  });
});

describe('advanced weeks', () => {
  const withAdvanced = {
    ...SERVER_PLUS,
    weeks: [...SERVER_PLUS.weeks, { number: 9, title: 'Extra', theme: 'x', objective: 'x', advanced: true }],
  };

  it('are neither setup nor graded', () => {
    expect(isAdvancedWeek(withAdvanced, 9)).toBe(true);
    expect(isSetupWeek(withAdvanced, 9)).toBe(false);
    expect(isGradedWeek(withAdvanced, 9)).toBe(false);
  });

  it('Server+ ships four of them, and exactly four', () => {
    // Weeks 5–6 (the team's own tools) and Weeks 7–8 (the fleet) — R79 split
    // two ten-task weeks into four. All are extra work; none counts toward
    // finishing. A fifth would need a colour (`--color-w9`), a rail chip and a
    // rubric page before it could be added here.
    const advanced = SERVER_PLUS.weeks.filter((w) => isAdvancedWeek(SERVER_PLUS, w.number)).map((w) => w.number);
    expect(advanced).toEqual([5, 6, 7, 8]);
    for (const n of advanced) expect(isGradedWeek(SERVER_PLUS, n)).toBe(false);
  });

  it('every other week is exactly one of setup or graded', () => {
    for (const course of [SECURITY_PLUS, CYSA_PLUS, MSSP, SERVER_PLUS]) {
      for (const w of course.weeks) {
        const setup = isSetupWeek(course, w.number);
        const graded = isGradedWeek(course, w.number);
        expect(setup !== graded || isAdvancedWeek(course, w.number), `${course.id}/w${w.number}`).toBe(true);
      }
    }
  });
});
