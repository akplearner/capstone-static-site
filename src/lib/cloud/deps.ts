import type { CloudEdge, IacResourceRange } from './model';

/**
 * The template's dependency graph, as diagram edges (R87) — derived, never
 * hand-copied, so the "dependencies" view is the template by construction.
 * Direction: `from` needs `to` (ARM dependsOn / a CloudFormation reference).
 * The parity tests re-derive the same graph with real parsers.
 */

const vars = (expr: string) => [...expr.matchAll(/variables\('([^']+)'\)/g)].map((m) => m[1]);

interface ArmResource {
  comments?: string;
  type: string;
  name: string;
  dependsOn?: string[];
}

export function armDependencies(full: string): { from: string; to: string }[] {
  const doc = JSON.parse(full) as { resources: ArmResource[] };
  const nodeOf = (r: ArmResource) => /^\[w\d+\]\s+([A-Za-z0-9-]+)/.exec(r.comments ?? '')?.[1];
  const byKey = new Map<string, string>();
  for (const r of doc.resources) {
    const id = nodeOf(r);
    if (id) byKey.set(`${r.type}|${vars(r.name).join('/')}`, id);
  }
  const out: { from: string; to: string }[] = [];
  for (const r of doc.resources) {
    const from = nodeOf(r);
    if (!from) continue;
    for (const dep of r.dependsOn ?? []) {
      const type = /resourceId\('([^']+)'/.exec(dep)?.[1];
      const to = type ? byKey.get(`${type}|${vars(dep).join('/')}`) : undefined;
      if (to && to !== from) out.push({ from, to });
    }
  }
  return out;
}

export function cfnDependencies(full: string, ranges: IacResourceRange[]): { from: string; to: string }[] {
  const lines = full.split('\n');
  const ids = new Set(ranges.map((r) => r.id));
  const out: { from: string; to: string }[] = [];
  for (const r of ranges) {
    const block = lines.slice(r.start - 1, r.end).join('\n');
    const found = new Set<string>();
    for (const m of block.matchAll(/!Ref\s+([A-Za-z0-9]+)/g)) found.add(m[1]);
    for (const m of block.matchAll(/!GetAtt\s+([A-Za-z0-9]+)\./g)) found.add(m[1]);
    for (const m of block.matchAll(/\$\{([A-Za-z0-9]+)(?:\.[A-Za-z]+)?\}/g)) found.add(m[1]);
    for (const m of block.matchAll(/DependsOn:\s*([A-Za-z0-9]+)/g)) found.add(m[1]);
    for (const to of found) if (ids.has(to) && to !== r.id) out.push({ from: r.id, to });
  }
  return out;
}

/** Dependency edges appear the week their later end does. */
export function dependencyEdges(
  deps: { from: string; to: string }[],
  weekOf: (id: string) => number
): CloudEdge[] {
  return deps.map((d) => ({ from: d.from, to: d.to, kind: 'depends' as const, week: Math.max(weekOf(d.from), weekOf(d.to)) }));
}
