import { MACHINES, vm, type Bridge, type MachineId } from '@/lib/serverTopology';

/**
 * One colour per zone, shared by everything that draws the topology: the full
 * reference diagram, the per-task focus strip, and the machine chip that sits
 * above a command line.
 *
 * It lives here rather than in `serverTopology.ts` because a colour is not
 * topology — the model stays presentation-free — and it lives in ONE file
 * rather than three because a DMZ that is amber in the diagram and blue on the
 * chip teaches a student nothing.
 */
export const ZONE_COLOR: Record<Bridge['id'], string> = {
  vmbr0: 'var(--color-accent)',
  vmbr1: 'var(--color-w3)',
  vmbr2: 'var(--color-w1)',
};

/** Machines that are not a box in the topology — your own desk, a campus PC. */
const OUTSIDE = 'var(--color-muted)';

/** The colour that says which zone you are typing into. */
export function machineColor(id: MachineId): string {
  const m = MACHINES[id];
  if (!m.node) return OUTSIDE;
  if (m.node === 'campus') return OUTSIDE;
  if (m.node === 'host') return ZONE_COLOR.vmbr0;
  return ZONE_COLOR[vm(m.node).bridge];
}

/** "websrv · bash" — what the chip above a command reads. */
export function machineChipLabel(id: MachineId): string {
  const m = MACHINES[id];
  const shell = m.shell === 'powershell' ? 'PowerShell' : m.shell === 'gui' ? 'point and click' : 'bash';
  return `${m.label} · ${shell}`;
}
