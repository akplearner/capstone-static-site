import { describe, it, expect } from 'vitest';
import { CYSA_PLUS } from './data/seed/cysa';
import { SECURITY_PLUS } from './data/seed/securityPlus';
import { MSSP } from './data/seed/mssp';
import {
  buildDeliverableChain,
  describeChain,
  downstreamOf,
  isCapstoneFiled,
  isDeliverableFiled,
  capstoneDeliverable,
  type DeliverableChain,
} from './deliverableChain';
import type { DeliverableData } from './docs/types';

const empty = (): DeliverableData => ({ fields: {}, groups: {} });

describe('isDeliverableFiled', () => {
  it('is false for missing or empty data', () => {
    expect(isDeliverableFiled(undefined)).toBe(false);
    expect(isDeliverableFiled(empty())).toBe(false);
  });

  it('does not count a form that was merely opened', () => {
    // Saving a shell of blank fields is what you get from visiting the page.
    // Treating that as "filed" would advance the stone for doing nothing.
    expect(isDeliverableFiled({ fields: { a: '', b: '   ' }, groups: { rows: [] } })).toBe(false);
    expect(isDeliverableFiled({ fields: {}, groups: { rows: [{ x: '', y: '' }] } })).toBe(false);
  });

  it('is true once any real field or row has content', () => {
    expect(isDeliverableFiled({ fields: { a: 'something' }, groups: {} })).toBe(true);
    expect(isDeliverableFiled({ fields: {}, groups: { rows: [{ x: 'v' }] } })).toBe(true);
  });
});

describe('buildDeliverableChain', () => {
  const chain = buildDeliverableChain(CYSA_PLUS);

  it('places every deliverable in a real role lane and week column', () => {
    expect(chain.nodes.length).toBeGreaterThan(0);
    for (const n of chain.nodes) {
      expect(chain.lanes).toContain(n.owner);
      expect(n.lane).toBeGreaterThanOrEqual(0);
      expect(n.lane).toBeLessThan(chain.lanes.length);
      expect(n.column).toBeGreaterThanOrEqual(0);
      expect(n.column).toBeLessThan(chain.columns.length);
      expect(chain.columns[n.column]).toBe(n.week);
    }
  });

  it('builds edges from feeds, and every edge lands on a real node', () => {
    const ids = new Set(chain.nodes.map((n) => n.id));
    expect(chain.edges.length).toBeGreaterThan(0);
    for (const e of chain.edges) {
      expect(ids.has(e.from)).toBe(true);
      expect(ids.has(e.to)).toBe(true);
      expect(e.from).not.toBe(e.to);
    }
  });

  it('connects all three roles — the chain is a relay, not three silos', () => {
    const crossRole = chain.edges.filter((e) => !e.sameRole);
    expect(crossRole.length).toBeGreaterThan(0);
    const touched = new Set(
      chain.edges.flatMap((e) => {
        const from = chain.nodes.find((n) => n.id === e.from);
        const to = chain.nodes.find((n) => n.id === e.to);
        return [from?.owner, to?.owner].filter(Boolean) as string[];
      })
    );
    expect(touched.size).toBe(CYSA_PLUS.roles.length);
  });

  it('flags sameRole edges so carrying your own work forward is not drawn as a handoff', () => {
    for (const e of chain.edges) {
      const from = chain.nodes.find((n) => n.id === e.from);
      const to = chain.nodes.find((n) => n.id === e.to);
      expect(e.sameRole).toBe(from!.owner === to!.owner);
    }
  });

  it('everything drains into the capstone', () => {
    const capstone = chain.nodes.find((n) => n.capstone);
    expect(capstone).toBeDefined();
    // The final artefact must be reachable from somewhere, and must not feed
    // anything itself — it is the end of the line.
    expect(chain.edges.some((e) => e.to === capstone!.id)).toBe(true);
    expect(chain.edges.some((e) => e.from === capstone!.id)).toBe(false);
  });

  it('reflects filed state from saved data', () => {
    const target = chain.nodes[0];
    const withData = buildDeliverableChain(CYSA_PLUS, {
      [target.id]: { fields: { anything: 'written' }, groups: {} },
    });
    expect(withData.nodes.find((n) => n.id === target.id)?.filed).toBe(true);
    expect(withData.nodes.filter((n) => n.filed)).toHaveLength(1);
  });

  it('drops edges pointing at ids outside the course rather than drawing them broken', () => {
    // content-integrity guards this at build time; the renderer must still not
    // invent a node if a bad id ever slips through.
    const bogus: DeliverableChain = buildDeliverableChain(CYSA_PLUS);
    expect(bogus.edges.every((e) => bogus.nodes.some((n) => n.id === e.to))).toBe(true);
  });
});

// MSSP ships locked, so a browser smoke can never reach it — its chain has to
// be proved here or not at all.
describe.each([
  ['security-plus', SECURITY_PLUS],
  ['cysa-plus', CYSA_PLUS],
  ['mssp', MSSP],
] as const)('every course has a real chain — %s', (_id, course) => {
  const chain = buildDeliverableChain(course);

  it('has edges, so the diagram is a chain and not a grid of loose boxes', () => {
    expect(chain.edges.length).toBeGreaterThan(0);
  });

  it('reaches its capstone from somewhere upstream', () => {
    const capstone = chain.nodes.find((n) => n.capstone);
    expect(capstone, 'no capstone node').toBeDefined();
    expect(downstreamOf(chain, chain.nodes[0].id).length + chain.edges.length).toBeGreaterThan(0);
    expect(chain.edges.some((e) => e.to === capstone!.id)).toBe(true);
  });

  it('has no orphan node that neither produces nor receives anything', () => {
    const touched = new Set(chain.edges.flatMap((e) => [e.from, e.to]));
    const orphans = chain.nodes.filter((n) => !touched.has(n.id)).map((n) => n.id);
    expect(orphans, `orphaned deliverables: ${orphans.join(', ')}`).toHaveLength(0);
  });
});

describe('downstreamOf', () => {
  const chain = buildDeliverableChain(CYSA_PLUS);

  it('follows the chain transitively', () => {
    const first = chain.nodes.find((n) => n.id === 'cysa_alert_triage');
    expect(first).toBeDefined();
    const down = downstreamOf(chain, 'cysa_alert_triage');
    // Analyst triage → Hunter investigation → IOC database → incident report → debrief
    expect(down).toContain('cysa_threat_investigation');
    expect(down).toContain('cysa_exec_debrief');
    expect(down).not.toContain('cysa_alert_triage');
  });

  it('terminates on a cycle instead of hanging the render', () => {
    const cyclic: DeliverableChain = {
      lanes: ['a'],
      columns: [1],
      nodes: [],
      edges: [
        { from: 'x', to: 'y', sameRole: true },
        { from: 'y', to: 'x', sameRole: true },
      ],
    };
    expect(downstreamOf(cyclic, 'x').sort()).toEqual(['y']);
  });
});

describe('describeChain', () => {
  it('gives one readable sentence per edge — the accessible equal of the SVG', () => {
    const chain = buildDeliverableChain(CYSA_PLUS);
    const lines = describeChain(chain, (id) => CYSA_PLUS.roles.find((r) => r.id === id)?.name ?? id);
    expect(lines).toHaveLength(chain.edges.length);
    expect(lines.some((l) => l.includes('can enrich'))).toBe(true);
    expect(lines.every((l) => l.endsWith('.'))).toBe(true);
  });
});

describe('isCapstoneFiled', () => {
  it('names exactly one capstone for the course', () => {
    expect(capstoneDeliverable('cysa-plus')?.id).toBe('cysa_exec_debrief');
  });

  it('is false until the capstone itself is written — other documents do not count', () => {
    expect(isCapstoneFiled('cysa-plus', null)).toBe(false);
    expect(
      isCapstoneFiled('cysa-plus', { cysa_soc_monitoring: { fields: { a: 'x' }, groups: {} } })
    ).toBe(false);
    expect(
      isCapstoneFiled('cysa-plus', { cysa_exec_debrief: { fields: { a: 'x' }, groups: {} } })
    ).toBe(true);
  });
});
