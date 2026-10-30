import { describe, it, expect } from 'vitest';
import { archBuiltMap, stepKey } from './archBuilt';
import type { ArchNode } from './docs/archPicture';

const node = (id: string, over: Partial<ArchNode> = {}): ArchNode => ({
  id, label: id, sub: '', kind: 'control', zone: 'z', x: 0, y: 0, arrives: 0, purpose: id, ...over,
});

describe('archBuiltMap — R151', () => {
  const nodes: ArchNode[] = [
    node('byTask', { builtBy: ['t-a'] }),
    node('byStep', { builtBy: [stepKey('t-b', 's1'), stepKey('t-b', 's2')] }),
    node('pill', { kind: 'record', records: 'form-x' }),
    node('platform'), // no builtBy, not a record — left out of the map
  ];

  it('a task entry is built at 100%, partial below', () => {
    expect(archBuiltMap(nodes, new Set(), { 't-a': 100 }, new Set()).byTask).toBe(1);
    expect(archBuiltMap(nodes, new Set(), { 't-a': 60 }, new Set()).byTask).toBe(0);
  });

  it('a step entry needs every step; one of two is partial', () => {
    const one = new Set([stepKey('t-b', 's1')]);
    expect(archBuiltMap(nodes, one, {}, new Set()).byStep).toBe(0.5);
    const both = new Set([stepKey('t-b', 's1'), stepKey('t-b', 's2')]);
    expect(archBuiltMap(nodes, both, {}, new Set()).byStep).toBe(1);
  });

  it('a record pill lights only when its form is filed', () => {
    expect(archBuiltMap(nodes, new Set(), {}, new Set()).pill).toBe(0);
    expect(archBuiltMap(nodes, new Set(), {}, new Set(['form-x'])).pill).toBe(1);
  });

  it('a part with neither builtBy nor a form is absent from the map, so the picture draws it as before', () => {
    expect('platform' in archBuiltMap(nodes, new Set(), {}, new Set())).toBe(false);
  });
});
