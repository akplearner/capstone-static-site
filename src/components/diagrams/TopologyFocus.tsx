'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';
import {
  MACHINES,
  ZONE_BRIDGES,
  baseVmsOn,
  type MachineId,
} from '@/lib/serverTopology';
import { ZONE_COLOR } from './topologyStyle';

/** The nodes this strip can draw, left to right in the order traffic travels. */
type NodeId = 'campus' | 'host' | string;

/**
 * The part of the topology this task or week touches — small enough to sit
 * above the work without pushing it off the screen.
 *
 * Students said the course was a lot of tasks with no thread, and that they
 * could not tell which box a step was about. The build map answers "which week
 * am I in"; this answers "which machines am I touching right now". It is drawn
 * from the same `serverTopology` model as the full diagram and uses the same
 * zone colours, so a box here is recognisably the box there.
 *
 * The focus set is DERIVED from the machines a task's commands name — nothing
 * to author, nothing to keep in sync. A task whose commands all run on winserver
 * lights winserver and dims the rest.
 */
export function TopologyFocus({
  focus,
  caption,
  className = '',
}: {
  /** Machines this task touches. Anything outside the topology (your laptop) is
   *  drawn as the "from" end of the path rather than as a zone box. */
  focus: MachineId[];
  caption?: string;
  className?: string;
}) {
  const lit = new Set<NodeId>();
  let fromOutside = false;
  for (const id of focus) {
    const node = MACHINES[id]?.node;
    if (!node) {
      fromOutside = true;
      continue;
    }
    if (node === 'campus') fromOutside = true;
    else lit.add(node);
  }
  if (lit.size === 0 && !fromOutside) return null;

  const box = (on: boolean) =>
    `rounded-md border px-1.5 py-0.5 font-mono text-3xs transition-opacity ${
      on ? 'font-bold opacity-100' : 'border-line opacity-45'
    }`;

  return (
    <div className={`flex flex-wrap items-center gap-x-1.5 gap-y-1 ${className}`}>
      {/* Where you are typing from, when it is not one of the servers. */}
      <span
        className={box(fromOutside)}
        style={fromOutside ? { borderColor: 'var(--color-muted)', color: 'var(--color-ink)' } : undefined}
      >
        you / campus
      </span>
      <ChevronRight className="h-3 w-3 shrink-0 text-muted/50" aria-hidden />
      <span
        className={box(lit.has('host'))}
        style={lit.has('host') ? { borderColor: ZONE_COLOR.vmbr0, color: ZONE_COLOR.vmbr0 } : undefined}
      >
        host
      </span>
      <ChevronRight className="h-3 w-3 shrink-0 text-muted/50" aria-hidden />
      {ZONE_BRIDGES.map((b) => {
        const vms = baseVmsOn(b.id);
        const color = ZONE_COLOR[b.id];
        const zoneLit = vms.some((v) => lit.has(v.hostname));
        return (
          <span key={b.id} className="inline-flex items-center gap-1">
            <span
              className={`font-mono text-3xs transition-opacity ${zoneLit ? 'opacity-100' : 'opacity-45'}`}
              style={{ color }}
            >
              {b.zone}
            </span>
            {vms.map((v) => {
              const on = lit.has(v.hostname);
              return (
                <span
                  key={v.hostname}
                  className={box(on)}
                  style={on ? { borderColor: color, color } : undefined}
                  title={`${v.hostname} · ${v.address} · ${v.runs}`}
                >
                  {v.hostname}
                </span>
              );
            })}
          </span>
        );
      })}
      {caption && <span className="w-full text-3xs text-muted sm:w-auto sm:pl-1">{caption}</span>}
    </div>
  );
}

/** The machines a set of steps actually type into — the focus set, derived. */
export function focusOf(steps: { commands?: { on?: string }[] }[]): MachineId[] {
  const seen = new Set<string>();
  for (const s of steps) for (const c of s.commands ?? []) if (c.on && c.on in MACHINES) seen.add(c.on);
  // Declaration order, so the strip always reads campus → host → DMZ → private.
  return (Object.keys(MACHINES) as MachineId[]).filter((m) => seen.has(m));
}
