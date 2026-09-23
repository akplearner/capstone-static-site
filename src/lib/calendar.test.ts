import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { addDays, buildIcs, daysBetween, dueLabel, shortDate, weekDue, weekDueDates } from './calendar';
import { SERVER_PLUS } from './data/seed/serverPlus';

describe('calendar arithmetic', () => {
  it('adds days across month ends and DST changes', () => {
    expect(addDays('2026-09-28', 7)).toBe('2026-10-05');
    expect(addDays('2026-02-26', 3)).toBe('2026-03-01');
    // The US spring-forward weekend: still exactly one calendar day.
    expect(addDays('2026-03-07', 1)).toBe('2026-03-08');
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09');
  });

  it('week N is due 7N days after the start; week 0 on the start', () => {
    expect(weekDue('2026-09-07', 0)).toBe('2026-09-07');
    expect(weekDue('2026-09-07', 3)).toBe('2026-09-28');
    expect(daysBetween('2026-09-07', '2026-09-28')).toBe(21);
    expect(daysBetween('2026-09-28', '2026-09-07')).toBe(-21);
  });

  it('labels the distance with the right tone', () => {
    expect(dueLabel('2026-09-20', '2026-09-17')).toEqual({ text: 'due Sun 20 Sep · in 3 days', tone: 'warn' });
    expect(dueLabel('2026-09-20', '2026-09-10')).toEqual({ text: 'due Sun 20 Sep · in 10 days', tone: 'muted' });
    expect(dueLabel('2026-09-20', '2026-09-20')).toEqual({ text: 'due Sun 20 Sep · today', tone: 'warn' });
    expect(dueLabel('2026-09-20', '2026-09-22')).toEqual({ text: 'due Sun 20 Sep · overdue by 2 days', tone: 'danger' });
    expect(dueLabel('2026-09-20', '2026-09-22', true).tone).toBe('ok');
    expect(shortDate('2026-01-02')).toBe('Fri 2 Jan');
  });

  it('dates every week of the course, advanced ones marked', () => {
    const rows = weekDueDates(SERVER_PLUS, '2026-09-07');
    expect(rows.map((r) => r.week)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(rows[8]).toEqual({ week: 8, title: 'Run It as a Fleet', due: '2026-11-02', advanced: true });
  });
});

describe('buildIcs', () => {
  const ics = buildIcs({ course: SERVER_PLUS, cohort: '2026-09', startsOn: '2026-09-07', now: new Date(Date.UTC(2026, 8, 1, 12, 0, 0)) });

  it('is a well-formed calendar with one all-day event per week', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(9);
    expect(ics).toContain('DTSTART;VALUE=DATE:20260928');
    expect(ics).toContain('DTEND;VALUE=DATE:20260929');
    expect(ics).toContain('DTSTAMP:20260901T120000Z');
    expect(ics).toContain('UID:server-plus-2026-09-w3@capstone-quarry');
    expect(ics).toContain('SUMMARY:Server+ Build & Handover — Week 8 due: Run It as a Fleet (advanced\\, optional)');
    // Every line CRLF-terminated, none folded because none is long.
    expect(ics.split('\r\n').every((l) => l.length < 75 || l.startsWith('DESCRIPTION') || l.startsWith('SUMMARY'))).toBe(true);
  });

  it('never reaches for toISOString — the guard rule, restated here', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/lib/calendar.ts'), 'utf8');
    expect(src).not.toContain('toISOString');
  });
});
