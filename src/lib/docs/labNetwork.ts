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
  /** What runs on the port and why it matters, one line (R153). */
  description: string;
  /** The week it first appears (0 = from the start). */
  from: number;
  /** The last week it is present; omitted = still present. */
  to?: number;
  /** Where the port can be reached: on the lab network (default) or only inside its own host/container (R156). */
  scope?: 'lan' | 'internal';
}

export type ControlKind = 'harden' | 'detect' | 'contain' | 'recover';

export interface NetControl {
  /** Namespaced `ctl:…`, never an architecture-picture node id. */
  id: string;
  label: string;
  /** What the control does, one line (R153). */
  description: string;
  kind: ControlKind;
  arrives: number;
  builtBy?: string[];
  role?: Role;
}

/** A tool installed on a host and what the course uses it for; `usedIn` are task ids or `task::step` keys (R156). */
export interface NetTool {
  name: string;
  purpose: string;
  usedIn?: string[];
}

/** A container port published on its host: `host` is what the lab network sees, `container` what the app listens on (R156). */
export interface NetPortMap {
  host: number;
  container: number;
  proto: Proto;
}

/** A container the host runs: the image, its bridge address, its published ports and the apps inside it (R156). */
export interface NetContainer {
  id: string;
  label: string;
  image: string;
  /** Its address on the Docker bridge — a reference into a topology module, never typed. */
  addr?: string;
  ports: NetPortMap[];
  apps: string[];
  description: string;
  from: number;
}

/** The Docker engine on a host: the bridge network and the containers on it (R156). */
export interface NetDocker {
  bridge: string;
  subnet: string;
  containers: NetContainer[];
}

export interface NetHost {
  id: string;
  label: string;
  /** What the host is and its role in the lab, one line (R153). */
  description: string;
  /** Always a reference into a topology module, never typed. */
  addr?: string;
  kind: HostKind;
  role?: Role;
  x: number;
  y: number;
  optional?: boolean;
  /** The operating system the course is written for (R156). */
  os?: string;
  /** How the VM is attached — the adapter kind on the hypervisor (R156). */
  nic?: string;
  services: NetService[];
  controls: NetControl[];
  /** What is installed on the host and what the course uses it for (R156). */
  tools?: NetTool[];
  /** The Docker engine and its containers, when the host runs any (R156). */
  docker?: NetDocker;
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
  /** What the technique is and what it targets, exam terms, one line (R153). */
  description: string;
  builtBy?: string;
  response?: AttackResponse;
  /** Blue's own validation (test logons, a labelled sample): a badge on the host, never a Kali arrow. */
  selfTest?: boolean;
}

export type ActionKind = 'setup' | 'attack' | 'control' | 'evidence' | 'governance';

/**
 * What a task DOES on the network, placed on the components it touches (R156). Attacks and controls
 * already name their task through `builtBy`; `actions` carries the rest — set-up, evidence and
 * governance work — so every task of the week is placed. `at` are host or container ids.
 */
export interface NetAction {
  taskId: string;
  step?: string;
  role: Role;
  kind: ActionKind;
  at: string[];
  text: string;
}

export interface NetWeek {
  week: number;
  wire: string;
  focus: string;
  before: string;
  after: string;
  attacks: NetAttack[];
  actions?: NetAction[];
}

export interface LabNetwork {
  copy: {
    title: string;
    howToRead: string;
    footer: string;
    /** The full LAN reference page's section intros (R156); absent on a course that only draws the picture. */
    reference?: { lede: string; lan: string; ports: string; tools: string; attacks: string; actions: string };
  };
  view: { w: number; h: number };
  subnet: string;
  fabric: {
    hypervisor: NetHost;
    segment: { id: string; label: string; note: string; y: number };
    /** The hypervisor's own interface on the lab network — the gateway address the VMs see (R156). */
    adapter?: { id: string; label: string; addr: string; description: string };
  };
  hosts: NetHost[];
  weeks: NetWeek[];
  spec: { columns: string[]; rows: string[][] };
}

/** What a course without a network reads: nothing to draw, so the switch never shows. */
export const NO_NETWORK: LabNetwork = {
  copy: { title: '', howToRead: '', footer: '' },
  view: { w: 0, h: 0 },
  subnet: '',
  fabric: { hypervisor: { id: 'hypervisor', label: '', description: '', kind: 'hypervisor', x: 0, y: 0, services: [], controls: [] }, segment: { id: 'segment', label: '', note: '', y: 0 } },
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

/** What the click-to-reveal details panel shows for a selected host, port or control (R153). */
export type ComponentKind = 'host' | 'service' | 'control';
export interface ComponentDetail { kind: ComponentKind; label: string; sub?: string; description: string; }

/** A service's selection id packs its host, since a port alone is not unique across hosts. */
export const serviceId = (hostId: string, port: number) => `${hostId}:${port}`;

/** Resolve a clicked component to its label and description; null when the id does not resolve. */
export function findComponent(net: LabNetwork, kind: ComponentKind, id: string): ComponentDetail | null {
  const allHosts = [...net.hosts, net.fabric.hypervisor];
  if (kind === 'host') {
    const h = allHosts.find((x) => x.id === id);
    return h ? { kind, label: h.label, sub: h.addr, description: h.description } : null;
  }
  if (kind === 'control') {
    for (const h of allHosts) {
      const c = h.controls.find((x) => x.id === id);
      if (c) return { kind, label: c.label, sub: `${CONTROL_KIND_LABEL[c.kind]} · ${h.label}`, description: c.description };
    }
    return null;
  }
  // service: id is `${hostId}:${port}`
  const [hostId, portStr] = id.split(':');
  const h = allHosts.find((x) => x.id === hostId);
  const svc = h?.services.find((x) => x.port === Number(portStr));
  return h && svc ? { kind, label: `${svc.port}/${svc.proto} ${svc.name}`, sub: h.label, description: svc.description } : null;
}

export const words = (s: string) => s.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;

/* ── R156: the full LAN reference — components, ports, tools, the attack catalogue, actions per task ── */

/** One line per thing on the network: the hypervisor's adapter, every host, every container (R156). */
export interface LanComponent {
  id: string;
  kind: 'adapter' | HostKind | 'container';
  label: string;
  addr?: string;
  os?: string;
  role?: Role;
  optional?: boolean;
  /** For a container: the host it runs on. */
  on?: string;
  description: string;
}

export function lanComponents(net: LabNetwork): LanComponent[] {
  const out: LanComponent[] = [];
  const hv = net.fabric.hypervisor;
  out.push({ id: hv.id, kind: 'hypervisor', label: hv.label, os: hv.os, description: hv.description });
  if (net.fabric.adapter) out.push({ id: net.fabric.adapter.id, kind: 'adapter', label: net.fabric.adapter.label, addr: net.fabric.adapter.addr, description: net.fabric.adapter.description });
  for (const h of net.hosts) {
    out.push({ id: h.id, kind: h.kind, label: h.label, addr: h.addr, os: h.os, role: h.role, optional: h.optional, description: h.description });
    for (const c of h.docker?.containers ?? []) out.push({ id: c.id, kind: 'container', label: c.label, addr: c.addr, os: c.image, role: h.role, on: h.id, description: c.description });
  }
  return out;
}

/** Every port the lab exposes, host by host, with the container behind it when there is one (R156). */
export interface PortRow {
  hostId: string;
  host: string;
  port: number;
  proto: Proto;
  name: string;
  scope: 'lan' | 'internal';
  from: number;
  /** `container:port` when the host port is a Docker publish. */
  behind?: string;
  description: string;
}

export function portRows(net: LabNetwork): PortRow[] {
  const rows: PortRow[] = [];
  for (const h of net.hosts) {
    for (const s of h.services) {
      const c = h.docker?.containers.find((x) => x.ports.some((p) => p.host === s.port && p.proto === s.proto));
      const map = c?.ports.find((p) => p.host === s.port && p.proto === s.proto);
      rows.push({ hostId: h.id, host: h.label, port: s.port, proto: s.proto, name: s.name, scope: s.scope ?? 'lan', from: s.from, behind: c && map ? `${c.label}:${map.container}` : undefined, description: s.description });
    }
  }
  return rows.sort((a, b) => a.host.localeCompare(b.host) || a.port - b.port);
}

/** The attack catalogue: each exam term, what it is, the domain it sits in and what answers it (R156). */
export interface AttackEntry {
  kind: AttackKind;
  label: string;
  definition: string;
  domain: string;
  answer: string;
}

export const ATTACK_CATALOGUE: AttackEntry[] = [
  { kind: 'reconnaissance', label: 'Reconnaissance', definition: 'Learning about the target without touching it: public records, DNS, banners the site offers freely.', domain: 'Security Operations · vulnerability management', answer: 'Little to detect; reduce what is published and know your footprint.' },
  { kind: 'scanning', label: 'Scanning', definition: 'Actively probing hosts and ports to map what is reachable and what runs there.', domain: 'Security Operations · vulnerability management', answer: 'Packet capture and detection filters make a scan visible; the firewall limits what answers.' },
  { kind: 'enumeration', label: 'Enumeration', definition: 'Questioning a found service for versions, users, paths and weaknesses worth following up.', domain: 'Threats, Vulnerabilities and Mitigations · indicators', answer: 'Web and service logs record the questions; hardening removes the easy answers.' },
  { kind: 'injection', label: 'Injection', definition: 'Crafted input the application passes on unchecked, here to the database behind a web form.', domain: 'Threats, Vulnerabilities and Mitigations · application attacks', answer: 'Input validation and parameterised queries; the web-log watch catches the attempt.' },
  { kind: 'brute-force', label: 'Brute force', definition: 'Trying many passwords against a login until one works.', domain: 'Threats, Vulnerabilities and Mitigations · password attacks', answer: 'Lockout and rate limits (fail2ban), logon auditing, and a block on the source.' },
  { kind: 'remote-code-execution', label: 'Remote code execution', definition: 'Running commands or uploaded code on the target from across the network.', domain: 'Threats, Vulnerabilities and Mitigations · application attacks', answer: 'Least privilege, patched software, upload restrictions; containment cuts the attacker off.' },
];

/** Where a kind is used in this lab: `(week, n)` pairs. */
export function catalogueUses(net: LabNetwork, kind: AttackKind): { week: number; n: number; port?: number; to: string }[] {
  const out: { week: number; n: number; port?: number; to: string }[] = [];
  for (const w of net.weeks) for (const a of w.attacks) if (a.kind === kind) out.push({ week: w.week, n: a.n, port: a.port, to: a.to });
  return out;
}

/** The task id a `builtBy` key names (`task` or `task::step`). */
export const taskOf = (key: string) => key.split('::')[0];

export interface TaskActionLine {
  kind: ActionKind;
  text: string;
  /** Host or container ids the line is placed on. */
  at: string[];
  /** The step within the task, when known. */
  step?: string;
}

export interface TaskActions {
  taskId: string;
  role?: Role;
  lines: TaskActionLine[];
}

/**
 * Every task's actions on the network for a week: attacks (through `builtBy`), controls that arrive
 * that week (through `builtBy`), and the week's explicit `actions`. Grouped by task in the order the
 * course lists its tasks; a task with nothing placed is still returned, with no lines (R156).
 */
export function weekTaskActions(net: LabNetwork, week: number, tasks: { id: string; role?: Role }[]): TaskActions[] {
  const by = new Map<string, TaskActions>();
  const get = (id: string, role?: Role) => {
    let t = by.get(id);
    if (!t) {
      t = { taskId: id, role, lines: [] };
      by.set(id, t);
    }
    return t;
  };
  for (const t of tasks) get(t.id, t.role);
  const w = net.weeks.find((x) => x.week === week);
  if (!w) return [...by.values()];
  const name = (id: string) => [...net.hosts, net.fabric.hypervisor].find((h) => h.id === id)?.label ?? id;
  // A control that answers an attack is placed once, as that answer — not again as "arrives this week".
  const answered = new Set<string>();
  for (const a of [...w.attacks].sort((x, y) => x.n - y.n)) {
    if (a.builtBy) {
      const [tid, step] = a.builtBy.split('::');
      const where = a.selfTest ? `on ${name(a.to)}` : `${name(a.from)} → ${name(a.to)}${a.port ? `:${a.port}` : ''}`;
      get(tid).lines.push({ kind: 'attack', step, at: a.selfTest ? [a.to] : [a.from, a.to], text: `${a.n}. ${ATTACK_KIND_LABEL[a.kind]} — ${where} · ${a.tool}` });
    }
    if (a.response?.builtBy) {
      const [tid, step] = a.response.builtBy.split('::');
      get(tid).lines.push({ kind: 'control', step, at: [a.to], text: `${a.response.kind === 'detect' ? 'Detect' : 'Contain'} ${a.n}: ${a.response.label} — on ${name(a.to)}` });
      answered.add(`${tid}:${a.response.controlId}`);
    }
  }
  for (const h of [...net.hosts, net.fabric.hypervisor]) {
    for (const c of h.controls) {
      if (c.arrives !== week) continue;
      for (const key of c.builtBy ?? []) {
        const [tid, step] = key.split('::');
        if (answered.has(`${tid}:${c.id}`)) continue;
        get(tid, c.role).lines.push({ kind: 'control', step, at: [h.id], text: `${c.label} (${CONTROL_KIND_LABEL[c.kind]}) — on ${h.label}` });
      }
    }
  }
  for (const act of w.actions ?? []) get(act.taskId, act.role).lines.push({ kind: act.kind, step: act.step, at: act.at, text: act.text });
  return [...by.values()];
}

/** Every tool across the lab with the host it lives on (R156). */
export function toolRows(net: LabNetwork): { hostId: string; host: string; tool: NetTool }[] {
  const out: { hostId: string; host: string; tool: NetTool }[] = [];
  for (const h of [...net.hosts, net.fabric.hypervisor]) for (const t of h.tools ?? []) out.push({ hostId: h.id, host: h.label, tool: t });
  return out;
}
