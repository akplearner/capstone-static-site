import type { DeliverableVersion } from './data/types';
import { gbOf, threadsOf, type ProjectRecord, type RecordEntry } from './docs/projectRecord';

/**
 * R141 — `capstone-project-infrastructure/1`: the team's infrastructure as the
 * record reads it: every host with its addresses and ports, what each was given
 * (vCPU, RAM, disk) against what the hardware reported, who last touched each
 * form and how often it changed (0025), and the dependencies and flows. Pure
 * and team-level; the instructor console builds and downloads it.
 */
export const PROJECT_INFRASTRUCTURE_SCHEMA = 'capstone-project-infrastructure/1';

export interface HostResources {
  host: string;
  declared: boolean;
  addresses: string[];
  ports: string[];
  vcpu: number | null;
  ramGb: number | null;
  diskGb: number | null;
}

export interface Capacity {
  /** As the discovery row reads. */
  found: string;
  ramGb: number | null;
  threads: number | null;
}

export interface FormOwnership {
  deliverableId: string;
  /** Who last replaced a version (null when the history is empty or the author unknown). */
  lastChangedBy: string | null;
  lastChangedAt: number | null;
  /** Versions the history holds for the form. */
  versions: number;
}

export interface ProjectInfrastructureDto {
  schema: typeof PROJECT_INFRASTRUCTURE_SCHEMA;
  courseId: string;
  teamId: string;
  hosts: HostResources[];
  resourcesAllocated: { vcpu: number; ramGb: number; diskGb: number };
  capacity: Capacity | null;
  ownership: FormOwnership[];
  dependencies: { key: string; label: string; value: string; form: string; host?: string }[];
  flows: { key: string; label: string; value: string; form: string; host?: string }[];
  resources: { key: string; label: string; value: string; form: string }[];
}

const num = (v: string) => (/^\d+(\.\d+)?$/.test(v.trim()) ? Number(v) : null);
const line = (e: RecordEntry) => ({ key: e.key, label: e.label, value: e.value, form: e.form, ...(e.host ? { host: e.host } : {}) });

export function projectInfrastructureOf(input: { courseId: string; teamId: string; record: ProjectRecord; history: DeliverableVersion[] }): ProjectInfrastructureDto {
  const { record } = input;
  const declared = new Set(record.hosts.map((h) => h.toLowerCase()));
  const hosts = new Map<string, HostResources>();
  const hostOf = (name: string) => {
    const k = name.toLowerCase();
    if (!hosts.has(k)) hosts.set(k, { host: name, declared: declared.has(k), addresses: [], ports: [], vcpu: null, ramGb: null, diskGb: null });
    return hosts.get(k)!;
  };
  for (const h of record.hosts) hostOf(h);
  for (const e of record.entries) {
    if (!e.host) continue;
    const h = hostOf(e.host);
    if (e.kind === 'ipv4' && !h.addresses.includes(e.value)) h.addresses.push(e.value);
    if (e.kind === 'port' && !h.ports.includes(e.value)) h.ports.push(e.value);
    if (e.kind === 'size' && e.spec?.of === 'cpu') h.vcpu = num(e.value);
    if (e.kind === 'size' && e.spec?.of === 'ram') h.ramGb = num(e.value);
    if (e.kind === 'size' && e.spec?.of === 'disk') h.diskGb = num(e.value);
  }
  const list = [...hosts.values()];
  const sum = (k: 'vcpu' | 'ramGb' | 'diskGb') => list.reduce((n, h) => n + (h[k] ?? 0), 0);
  const ramRow = record.entries.find((e) => e.kind === 'resource' && /memory|ram/i.test(e.label));
  const cpuRow = record.entries.find((e) => e.kind === 'resource' && /cpu|processor/i.test(e.label));
  const capacity: Capacity | null = ramRow || cpuRow ? { found: [ramRow?.value, cpuRow?.value].filter(Boolean).join(' · '), ramGb: ramRow ? gbOf(ramRow.value) : null, threads: cpuRow ? threadsOf(cpuRow.value) : null } : null;
  const byForm = new Map<string, DeliverableVersion[]>();
  for (const v of input.history) byForm.set(v.deliverableId, [...(byForm.get(v.deliverableId) ?? []), v]);
  const ownership: FormOwnership[] = [...byForm.entries()]
    .map(([deliverableId, versions]) => {
      const last = [...versions].sort((a, b) => b.replacedAt - a.replacedAt)[0];
      return { deliverableId, lastChangedBy: last?.replacedBy ?? null, lastChangedAt: last?.replacedAt ?? null, versions: versions.length };
    })
    .sort((a, b) => a.deliverableId.localeCompare(b.deliverableId));
  return {
    schema: PROJECT_INFRASTRUCTURE_SCHEMA,
    courseId: input.courseId,
    teamId: input.teamId,
    hosts: list,
    resourcesAllocated: { vcpu: sum('vcpu'), ramGb: sum('ramGb'), diskGb: sum('diskGb') },
    capacity,
    ownership,
    dependencies: record.entries.filter((e) => e.kind === 'dependency').map(line),
    flows: record.entries.filter((e) => e.kind === 'flow').map(line),
    resources: record.entries.filter((e) => e.kind === 'resource').map((e) => ({ key: e.key, label: e.label, value: e.value, form: e.form })),
  };
}
