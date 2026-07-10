import { describe, it, expect } from 'vitest';
import { exportTeamData, parseTeamData, mergeTeamData } from './handoff';
import { DeliverableData } from './types';

const sample = (v: string): DeliverableData => ({ fields: { note: v }, groups: {} });

describe('handoff round-trip', () => {
  it('export → parse recovers known deliverables', () => {
    const saved = { scope_roe: sample('a'), asset_inventory: sample('b') };
    const json = exportTeamData(saved, { team: 'Team01', cohort: '2026-02', date: '2026-02-01', course: 'security-plus' }, 'grc');
    const parsed = parseTeamData(json);
    expect(parsed).toEqual(saved);
  });

  it('drops unknown deliverable ids', () => {
    const json = JSON.stringify({ kind: 'capstone-docs', v: 1, data: { scope_roe: sample('a'), not_a_real_id: sample('x') } });
    const parsed = parseTeamData(json);
    expect(Object.keys(parsed)).toEqual(['scope_roe']);
  });

  it('drops malformed deliverable values', () => {
    const json = JSON.stringify({ kind: 'capstone-docs', v: 1, data: { scope_roe: { nope: true } } });
    expect(() => parseTeamData(json)).toThrow(/No recognizable deliverables/);
  });
});

describe('parseTeamData errors', () => {
  it('rejects non-JSON', () => {
    expect(() => parseTeamData('not json')).toThrow(/valid JSON/);
  });
  it('rejects the wrong envelope kind', () => {
    expect(() => parseTeamData(JSON.stringify({ kind: 'something-else', data: {} }))).toThrow(/capstone handoff/);
  });
  it('rejects a missing data map', () => {
    expect(() => parseTeamData(JSON.stringify({ kind: 'capstone-docs', v: 1 }))).toThrow(/no deliverable data/i);
  });
});

describe('mergeTeamData', () => {
  it('incoming wins for overlapping ids, keeps disjoint ones', () => {
    const current = { scope_roe: sample('old'), risk_register: sample('keep') };
    const incoming = { scope_roe: sample('new'), asset_inventory: sample('add') };
    const merged = mergeTeamData(current, incoming);
    expect(merged.scope_roe).toEqual(sample('new'));
    expect(merged.risk_register).toEqual(sample('keep'));
    expect(merged.asset_inventory).toEqual(sample('add'));
  });
});
