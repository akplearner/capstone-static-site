'use client';

import React from 'react';
import { Monitor, MousePointerClick, Terminal } from 'lucide-react';
import { MACHINES, type MachineId } from '@/lib/serverTopology';
import { machineChipLabel, machineColor } from './diagrams/topologyStyle';

/**
 * Which machine this command is typed into.
 *
 * Students kept pasting a line into the wrong box. A step carried one `where`
 * for the whole step, but a step routinely spans two machines, and 46 of the
 * base build's lines are PowerShell rendered in the same terminal-green block
 * as bash — nothing on the line itself said "this one is Windows".
 *
 * So the chip sits directly on top of the command, coloured by the zone the
 * machine is in, and carries how you get there in its title. It is the same
 * model the topology diagrams highlight from, so the colour a student learns
 * here is the colour of that box in the picture.
 */
export function MachineChip({ on, className = '' }: { on: MachineId; className?: string }) {
  const m = MACHINES[on];
  const color = machineColor(on);
  const Icon = m.shell === 'gui' ? MousePointerClick : m.shell === 'powershell' ? Monitor : Terminal;
  return (
    <span
      title={m.how}
      className={`inline-flex max-w-full items-center gap-1 rounded-t-md border border-b-0 px-2 py-0.5 text-3xs font-semibold ${className}`}
      style={{ borderColor: color, color }}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      <span className="truncate">{machineChipLabel(on)}</span>
    </span>
  );
}
