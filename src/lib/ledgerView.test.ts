import { describe, it, expect } from 'vitest';
import { artifactRows, filterWeek, ledgerCsv, ledgerRows } from './ledgerView';
import { SERVER_PLUS } from './data/seed/serverPlus';
import type { StepEvidence } from './data/types';

const ev: Record<string, StepEvidence> = {
  'sp-w6-spine::sp-w6-spine-s1': { courseId: 'server-plus', taskId: 'sp-w6-spine', stepId: 'sp-w6-spine-s1', verified: true, method: 'verified-output', matchedTokens: 1, totalTokens: 1, attempts: 2, verifiedAt: 1_700_000_000_000 },
  'sp-w1-bringup::sp-w1-bringup-s1': { courseId: 'server-plus', taskId: 'sp-w1-bringup', stepId: 'sp-w1-bringup-s1', verified: false, method: 'self-attested', matchedTokens: 0, totalTokens: 0, attempts: 0 },
  'gone::gone-s0': { courseId: 'server-plus', taskId: 'gone', stepId: 'gone-s0', verified: false, method: 'self-attested', matchedTokens: 0, totalTokens: 0, attempts: 0 },
};

describe('ledgerRows', () => {
  const rows = ledgerRows(SERVER_PLUS, ev);

  it('resolves titles and weeks, sorted by week, and survives a step that no longer exists', () => {
    // `sp-w6-spine` kept its id when R79 moved it to Week 7: ids are the keys of
    // stored evidence, so a record written before the split still resolves.
    expect(rows.map((r) => r.week)).toEqual([0, 1, 7]);
    const w6 = rows[2];
    expect(w6.taskTitle).toBe('Wire the ops network');
    expect(w6.stepTitle).toBe('The bridge on the host, and the ping');
    expect(w6.method).toBeTruthy();
    expect(rows[0].taskTitle).toBe('gone');
  });

  it('links each row to its step deep link', () => {
    expect(rows[2].href).toBe('/courses/server-plus?tab=tasks&week=7&task=sp-w6-spine&step=sp-w6-spine-s1');
  });

  it('filters by week', () => {
    expect(filterWeek(rows, 7)).toHaveLength(1);
    expect(filterWeek(rows, 6)).toHaveLength(0);
    expect(filterWeek(rows, 'all')).toHaveLength(3);
  });

  it('exports both kinds in one CSV', () => {
    const arts = artifactRows([
      { courseId: 'server-plus', sha256: 'abc', filename: '20260915_Team03_netbox_ipam.png', sizeBytes: 10, week: 5, nameOk: true, hashedAt: 1_700_000_000_000 },
    ]);
    const csv = ledgerCsv(SERVER_PLUS, rows, arts);
    const lines = csv.trim().split('\r\n');
    expect(lines).toHaveLength(1 + 3 + 1);
    expect(lines[0]).toContain('kind,week,task,step,method,verified');
    expect(lines[4]).toContain('artifact,5');
    expect(lines[4]).toContain('20260915_Team03_netbox_ipam.png,abc,10,true');
  });
});
