import type { ArchNode } from './docs/archPicture';
import { stepKey } from './teamProgress';

/**
 * R151 — how much of each part of the architecture picture the team has built.
 *
 * A part names the task(s) or step(s) that build it (`ArchNode.builtBy`), or a record pill names the
 * form that records it (`ArchNode.records`). This turns the team's live completion into one number per
 * node, 0..1:
 *
 *   - a `builtBy` entry that is a task id (`red-w3-attacks`) is met by that task's team percent being 100;
 *     an entry that is a step key (`task::step`) is met when any teammate has ticked that step.
 *   - a node is fully built (1) when EVERY entry is met, partial (fraction) while some are, 0 with none.
 *   - a record pill with no `builtBy` lights (1) when its form is filed, else 0.
 *   - a part with neither (the lab platform) is left out of the map — the picture draws it as it always did.
 *
 * Pure: no repositories, no React. The hook feeds it the team's step set, the per-task percent and the
 * set of filed form ids; the renderer reads the numbers.
 */
/**
 * R152 — the one rule, over any list of parts that name the work building them (the architecture
 * picture's nodes, the lab network's controls and attack steps): a `task::step` entry is met when any
 * teammate ticked it, a task id when the team's percent is 100; the value is the met fraction.
 */
export function builtMapFrom(
  entries: readonly { id: string; builtBy: readonly string[] }[],
  teamDone: ReadonlySet<string>,
  taskPercent: Readonly<Record<string, number>>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of entries) {
    if (!e.builtBy.length) continue;
    const met = e.builtBy.filter((entry) => (entry.includes('::') ? teamDone.has(entry) : (taskPercent[entry] ?? 0) >= 100)).length;
    out[e.id] = met / e.builtBy.length;
  }
  return out;
}

export function archBuiltMap(
  nodes: readonly ArchNode[],
  teamDone: ReadonlySet<string>,
  taskPercent: Readonly<Record<string, number>>,
  filedForms: ReadonlySet<string>,
): Record<string, number> {
  const out = builtMapFrom(nodes.filter((n): n is ArchNode & { builtBy: string[] } => !!n.builtBy?.length), teamDone, taskPercent);
  for (const n of nodes) {
    if (!(n.builtBy && n.builtBy.length > 0) && n.kind === 'record' && n.records) out[n.id] = filedForms.has(n.records) ? 1 : 0;
  }
  return out;
}

/** A step key in the `teamProgress` shape, re-exported so callers build entries the one way. */
export { stepKey };
