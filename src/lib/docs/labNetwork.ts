import type { Role } from '../types';

/**
 * R152 — the lab network, as a shape any course can fill.
 *
 * The architecture picture draws the PARTS a course builds. This is the NETWORK: hosts on a segment,
 * what each exposes (ports), the controls Blue has placed on it, and the week's numbered attack steps with
 * the Blue response that answers each one. Every week is seen going IN and coming OUT; both are
 * projections of one data set (`servicesAt`, `controlsAt`). Attack `kind` is exam vocabulary; `tool` is a
 * category, never a command. Every `builtBy` is a task id or `task::step` key, lit through the same
 * `builtMapFrom` the architecture picture uses; ids are namespaced (`ctl:`, `atk:`) so one map serves both.
 */
export type HostKind = 'attacker' | 'server' | 'endpoint' | 'hypervisor';
export type Proto = 'tcp' | 'udp';
export type Phase = 'before' | 'after';

export interface NetService {
  port: number;
  proto: Proto;
  name: string;
  /** The week it first appears (0 = from the start). */
  from: number;
  /** The last week it is present; omitted = still present. */
  to?: number;
}

export type ControlKind = 'harden' | 'detect' | 'contain' | 'recover';

export interface NetControl {
  /** Namespaced `ctl:…`, never an architecture-picture node id. */
  id: string;
  label: string;
  kind: ControlKind;
  arrives: number;
  builtBy?: string[];
  role?: Role;
}

export interface NetHost {
  id: string;
  label: string;
  /** Always a reference into a topology module, never typed. */
  addr?: string;
  kind: HostKind;
  role?: Role;
  x: number;
  y: number;
  optional?: boolean;
  services: NetService[];
  controls: NetControl[];
}

export type AttackKind = 'reconnaissance' | 'scanning' | 'enumeration' | 'injection' | 'brute-force' | 'remote-code-execution';

export interface AttackResponse {
  kind: 'detect' | 'contain';
  controlId: string;
  builtBy?: string;
  label: string;
}

export interface NetAttack {
  /** 1-based order within the week. */
  n: number;
  kind: AttackKind;
  from: string;
  to: string;
  port?: number;
  /** A category, never a command. */
  tool: string;
  builtBy?: string;
  response?: AttackResponse;
  /** Blue's own validation (test logons, a labelled sample): a badge on the host, never a Kali arrow. */
  selfTest?: boolean;
}

export interface NetWeek {
  week: number;
  wire: string;
  focus: string;
  before: string;
  after: string;
  attacks: NetAttack[];
}

export interface LabNetwork {
  copy: { title: string; howToRead: string; footer: string };
  view: { w: number; h: number };
  subnet: string;
  fabric: { hypervisor: NetHost; segment: { id: string; label: string; note: string; y: number } };
  hosts: NetHost[];
  weeks: NetWeek[];
  spec: { columns: string[]; rows: string[][] };
}

/** What a course without a network reads: nothing to draw, so the switch never shows. */
export const NO_NETWORK: LabNetwork = {
  copy: { title: '', howToRead: '', footer: '' },
  view: { w: 0, h: 0 },
  subnet: '',
  fabric: { hypervisor: { id: 'hypervisor', label: '', kind: 'hypervisor', x: 0, y: 0, services: [], controls: [] }, segment: { id: 'segment', label: '', note: '', y: 0 } },
  hosts: [],
  weeks: [],
  spec: { columns: [], rows: [] },
};

/** Services on a host at (week, phase): before = arrived earlier; after = this week too. `to` ends one. */
export function servicesAt(host: NetHost, week: number, phase: Phase): NetService[] {
  const limit = phase === 'before' ? week - 1 : week;
  return host.services.filter((s) => s.from <= limit && (s.to === undefined || s.to >= week));
}

/** Controls on a host at (week, phase), by the same rule. */
export function controlsAt(host: NetHost, week: number, phase: Phase): NetControl[] {
  const limit = phase === 'before' ? week - 1 : week;
  return host.controls.filter((c) => c.arrives <= limit);
}

/** The week's steps in order; `onlyAttacks` drops Blue's self-tests. */
export function attackSteps(net: LabNetwork, week: number, onlyAttacks = false): NetAttack[] {
  const w = net.weeks.find((x) => x.week === week);
  if (!w) return [];
  return [...w.attacks].filter((a) => !onlyAttacks || !a.selfTest).sort((a, b) => a.n - b.n);
}

export function phaseLine(net: LabNetwork, week: number, phase: Phase): string {
  const w = net.weeks.find((x) => x.week === week);
  return w ? (phase === 'before' ? w.before : w.after) : '';
}

/** The attack's id in the built map. */
export const attackId = (week: number, n: number) => `atk:w${week}:${n}`;

/** Every id the network wants lit, with the work that lights it. */
export function netBuiltEntries(net: LabNetwork): { id: string; builtBy: string[] }[] {
  const out: { id: string; builtBy: string[] }[] = [];
  for (const h of [...net.hosts, net.fabric.hypervisor]) for (const c of h.controls) if (c.builtBy?.length) out.push({ id: c.id, builtBy: c.builtBy });
  for (const w of net.weeks) {
    for (const a of w.attacks) {
      const own = a.builtBy ? [a.builtBy] : a.response?.builtBy ? [a.response.builtBy] : [];
      if (own.length) out.push({ id: attackId(w.week, a.n), builtBy: own });
    }
  }
  return out;
}

export const ATTACK_KIND_LABEL: Record<AttackKind, string> = {
  reconnaissance: 'Reconnaissance',
  scanning: 'Scanning',
  enumeration: 'Enumeration',
  injection: 'Injection',
  'brute-force': 'Brute force',
  'remote-code-execution': 'Remote code execution',
};

export const CONTROL_KIND_LABEL: Record<ControlKind, string> = { harden: 'hardening', detect: 'detection', contain: 'containment', recover: 'recovery' };

/** The step-through line: number, exam term, path, tool category, Blue's answer. */
export function attackSentence(a: NetAttack, hosts: readonly NetHost[]): string {
  const name = (id: string) => hosts.find((h) => h.id === id)?.label ?? id;
  const where = a.selfTest ? `on ${name(a.to)}` : `${name(a.from)} → ${name(a.to)}`;
  const port = a.port ? `:${a.port}` : '';
  const blue = a.response ? ` · Blue: ${a.response.label}` : ' · Blue: nothing yet, this is passive';
  return `${a.n}. ${ATTACK_KIND_LABEL[a.kind]} — ${where}${port} · ${a.tool}${blue}`;
}

export const words = (s: string) => s.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
