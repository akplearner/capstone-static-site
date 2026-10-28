import type { Course } from '../types';
import type { DeliverableDef } from '../docs/types';
import { decisionBlocksOf } from '../docs/types';
import { addressPart, cidrRange, inSubnet, isCidr, isIpv4, parsePort } from '../docs/formContext';
import type { ProjectRecord, RecordArea, RecordConflict, RecordEntry } from '../docs/projectRecord';
import type { Checkpoint } from './plan';

/**
 * R140 — the validation activities, generated from the team's own record.
 *
 * Did the learner retain what the team recorded, understand the decisions, and
 * can they apply the values later? The activities ask exactly that, and only
 * about values the record holds: a recall (the recorded value among three
 * distractors drawn from the record's other values, the column's options or a
 * perturbation of the value), an explanation (why this decision, forty words
 * or more, marked by the instructor), an applied scenario (which address is
 * inside this prefix, which port is still free on this host, what the committed
 * RAM becomes), and a consistency task (resolve a conflict the record found).
 *
 * Pure and deterministic: the same record gives the same activities with the
 * same ids (`val:<week>:<kind>:<recordKey>`), the same options in the same
 * order (shuffled by a hash of the id, never by chance), so an answer recorded
 * yesterday still names today's activity. The recorded value is carried as
 * `answer` for the panel to judge a choice; the panel never prints it, and
 * only its hash is stored.
 */
export type ActivityKind = 'recall' | 'apply' | 'explain' | 'consistency';

export interface ValidationActivity {
  id: string;
  kind: ActivityKind;
  checkpoint: number;
  recordKey: string;
  area: RecordArea;
  form: string;
  /** The question; never contains the answer. */
  prompt: string;
  /** Multiple choice: the options, in a stable order. Absent for a value entry, an explanation or a consistency task. */
  options?: string[];
  /** The value a correct answer equals (an option, a typed value, or `resolved`). */
  answer: string;
  /** For an explanation: the minimum words. */
  minWords?: number;
  /** For a consistency task: the conflict to resolve. */
  conflictId?: string;
}

export interface ActivityInput {
  course: Pick<Course, 'id'>;
  defs: DeliverableDef[];
  record: ProjectRecord;
  conflicts: RecordConflict[];
  checkpoint: Checkpoint;
}

export const LIMITS = { recall: 10, apply: 6, explain: 3 } as const;

/* ── deterministic helpers ──────────────────────────────────────────────── */

/** FNV-1a, 32 bits: a stable number from a string, for ordering and picking. */
export function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** A stable shuffle: the order depends on the seed and the items, never on the clock. */
export function stableShuffle<T>(items: T[], seed: string): T[] {
  return items
    .map((item, i) => ({ item, key: hash32(`${seed}:${i}:${String(item)}`) }))
    .sort((a, b) => a.key - b.key || String(a.item).localeCompare(String(b.item)))
    .map((x) => x.item);
}

const uniq = (xs: string[]) => [...new Set(xs.map((x) => x.trim()).filter(Boolean))];

function octets(ip: string): number[] | null {
  if (!isIpv4(ip)) return null;
  return ip.split('.').map(Number);
}
const joinIp = (o: number[]) => o.join('.');

/** Three addresses that are not this one: the last octet moved, then the third. Keeps the mask. */
function perturbIpv4(value: string): string[] {
  const [addr, mask] = value.trim().split('/');
  const o = octets(addr);
  if (!o) return [];
  const withMask = (ip: string) => (mask !== undefined ? `${ip}/${mask}` : ip);
  const last = (d: number) => joinIp([o[0], o[1], o[2], ((o[3] + d) % 254) + 1]);
  const third = (d: number) => joinIp([o[0], o[1], (o[2] + d) % 256, o[3]]);
  return uniq([withMask(last(1)), withMask(last(10)), withMask(third(1)), withMask(last(100))]).filter((x) => x !== value.trim());
}

function perturbCidr(value: string): string[] {
  if (!isCidr(value)) return [];
  const [net, bits] = value.trim().split('/');
  const o = octets(net)!;
  const b = Number(bits);
  return uniq([
    `${joinIp([o[0], o[1], (o[2] + 1) % 256, o[3]])}/${b}`,
    `${joinIp([o[0], o[1], (o[2] + 10) % 256, o[3]])}/${b}`,
    `${net}/${b >= 24 ? b - 8 : b + 8}`,
    `${joinIp([o[0], (o[1] + 1) % 256, o[2], o[3]])}/${b}`,
  ]).filter((x) => x !== value.trim());
}

const COMMON_PORTS = ['22/tcp', '25/tcp', '53/udp', '80/tcp', '443/tcp', '2200/tcp', '3306/tcp', '3389/tcp', '8080/tcp'];

function perturbPort(value: string): string[] {
  const p = parsePort(value.trim().split(/\s+/)[0] ?? '');
  const proto = p?.proto ?? 'tcp';
  const mine = p ? `${p.port}/${proto}` : value.trim();
  return COMMON_PORTS.filter((x) => x !== mine && (!p || parsePort(x)!.port !== p.port));
}

function perturbNumber(value: string): string[] {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return [];
  return uniq([String(n * 2), String(Math.max(1, Math.round(n / 2))), String(n + Math.max(1, Math.round(n / 2))), String(n * 4)]).filter((x) => x !== value.trim());
}

/** The leading number of a VLAN-style value ("10 — Staff" → 10), moved, keeping the rest. */
function perturbVlan(value: string): string[] {
  const m = /^(\d+)(.*)$/.exec(value.trim());
  if (!m) return [];
  const n = Number(m[1]);
  return uniq([`${n + 10}${m[2]}`, `${Math.max(1, n - 10)}${m[2]}`, `${n + 1}${m[2]}`, `${n * 10}${m[2]}`]).filter((x) => x !== value.trim());
}

/** The column's own options, when the registry column is a select. */
function columnOptions(defs: DeliverableDef[], e: RecordEntry): string[] {
  const def = defs.find((d) => d.id === e.form);
  if (!def) return [];
  for (const s of def.sections) {
    if (s.kind === 'group' && s.group.group === e.group) {
      const col = s.group.columns.find((c) => c.field === e.column);
      return col?.options ?? [];
    }
    if (s.kind === 'fields' && e.field) {
      const f = s.fields.find((x) => x.field === e.field);
      if (f) return f.options ?? [];
    }
  }
  return [];
}

function formTitle(defs: DeliverableDef[], id: string): string {
  return defs.find((d) => d.id === id)?.title ?? id;
}

/** Three distractors for a recorded value, or fewer when the record offers nothing to confuse it with. */
export function distractorsFor(e: RecordEntry, record: ProjectRecord, defs: DeliverableDef[]): string[] {
  const value = e.value.trim();
  const others = uniq(record.entries.filter((x) => x.kind === e.kind && x.key !== e.key).map((x) => x.value)).filter((x) => x !== value);
  const options = columnOptions(defs, e).filter((x) => x !== value);
  let made: string[] = [];
  switch (e.kind) {
    case 'ipv4':
    case 'dns': made = perturbIpv4(value); break;
    case 'cidr': made = perturbCidr(value); break;
    case 'port': made = perturbPort(value); break;
    case 'size': made = perturbNumber(value); break;
    case 'vlan': made = perturbVlan(value); break;
    default: made = [];
  }
  const pool = uniq([...stableShuffle(others, e.key), ...stableShuffle(options, e.key), ...made]).filter((x) => x !== value);
  return pool.slice(0, 3);
}

function where(e: RecordEntry, defs: DeliverableDef[]): string {
  return e.host && e.kind !== 'host' ? `for ${e.host}` : `in ${formTitle(defs, e.form)}`;
}

/* ── the activities ─────────────────────────────────────────────────────── */

function recallOf(e: RecordEntry, input: ActivityInput): ValidationActivity | null {
  const distractors = distractorsFor(e, input.record, input.defs);
  if (distractors.length < 3) return null;
  const id = `val:${input.checkpoint.week}:recall:${e.key}`;
  return {
    id, kind: 'recall', checkpoint: input.checkpoint.week, recordKey: e.key, area: e.area, form: e.form,
    prompt: `What did the team record as the ${e.label.toLowerCase()} ${where(e, input.defs)}?`,
    options: stableShuffle([e.value.trim(), ...distractors], id),
    answer: e.value.trim(),
  };
}

function explainOf(e: RecordEntry, input: ActivityInput): ValidationActivity {
  const id = `val:${input.checkpoint.week}:explain:${e.key}`;
  const subject = e.kind === 'decision' ? `choose "${e.value.trim()}" for ${e.label.toLowerCase()}` : `record ${e.label.toLowerCase()} "${e.value.trim()}"`;
  return {
    id, kind: 'explain', checkpoint: input.checkpoint.week, recordKey: e.key, area: e.area, form: e.form,
    prompt: `Why did the team ${subject} ${where(e, input.defs)}? Name what was weighed and what would change the choice.`,
    answer: '', minWords: 40,
  };
}

/** An address inside the prefix that the record does not already hold. */
function freeAddressIn(cidr: string, used: Set<string>, seed: string): string | null {
  const range = cidrRange(cidr);
  if (!range || range.hi - range.lo < 4) return null;
  const toIp = (n: number) => joinIp([(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]);
  for (let i = 0; i < 64; i++) {
    const n = range.lo + 1 + ((hash32(`${seed}:${i}`) % (range.hi - range.lo - 1)) || 0);
    const ip = toIp(n);
    if (!used.has(ip)) return ip;
  }
  return null;
}

function applyOf(input: ActivityInput): ValidationActivity[] {
  const { record, checkpoint } = input;
  const out: ValidationActivity[] = [];
  const used = new Set(record.entries.filter((e) => e.kind === 'ipv4' || e.kind === 'dns').map((e) => addressPart(e.value)));

  // 1. Which address sits inside this prefix?
  for (const e of record.entries.filter((x) => x.kind === 'cidr' && isCidr(x.value))) {
    const id = `val:${checkpoint.week}:apply:${e.key}`;
    const inside = freeAddressIn(e.value.trim(), used, id);
    if (!inside) continue;
    const outside = perturbCidr(e.value).map((c) => freeAddressIn(c, used, `${id}:out`)).filter((x): x is string => !!x && !inSubnet(x, e.value)).slice(0, 3);
    if (outside.length < 3) continue;
    out.push({
      id, kind: 'apply', checkpoint: checkpoint.week, recordKey: e.key, area: e.area, form: e.form,
      prompt: `A new machine joins ${e.label.toLowerCase()} ${e.value.trim()}. Which of these addresses is inside it?`,
      options: stableShuffle([inside, ...outside], id), answer: inside,
    });
  }

  // 2. Which port is still free on this host?
  const byHost = new Map<string, RecordEntry[]>();
  for (const e of record.entries) if (e.kind === 'port' && e.host && parsePort(e.value.split(/\s+/)[0] ?? '')) byHost.set(e.host, [...(byHost.get(e.host) ?? []), e]);
  for (const [host, ports] of byHost) {
    const usedPorts = new Set(ports.map((p) => parsePort(p.value.split(/\s+/)[0]!)!.port));
    const free = COMMON_PORTS.find((c) => !usedPorts.has(parsePort(c)!.port));
    if (!free || ports.length < 1) continue;
    const first = ports[0];
    const id = `val:${checkpoint.week}:apply:${first.key}`;
    const taken = uniq(ports.map((p) => `${parsePort(p.value.split(/\s+/)[0]!)!.port}/${parsePort(p.value.split(/\s+/)[0]!)!.proto ?? 'tcp'}`)).slice(0, 3);
    if (taken.length < 1) continue;
    const options = stableShuffle(uniq([free, ...taken, ...COMMON_PORTS.filter((c) => usedPorts.has(parsePort(c)!.port))]).slice(0, 4), id);
    if (!options.includes(free)) options[0] = free;
    out.push({
      id, kind: 'apply', checkpoint: checkpoint.week, recordKey: first.key, area: first.area, form: first.form,
      prompt: `A new service must listen on ${host}. Which of these ports does the record show as still free there?`,
      options, answer: free,
    });
  }

  // 3. What the committed RAM becomes if every machine is doubled.
  const ram = record.entries.filter((e) => e.kind === 'size' && e.spec?.of === 'ram' && /^\d+(\.\d+)?$/.test(e.value));
  if (ram.length >= 2) {
    const sum = ram.reduce((n, e) => n + Number(e.value), 0);
    const id = `val:${checkpoint.week}:apply:${ram[0].key}`;
    out.push({
      id, kind: 'apply', checkpoint: checkpoint.week, recordKey: ram[0].key, area: ram[0].area, form: ram[0].form,
      prompt: `The team doubles the RAM of every machine it sized. How many GB would then be committed on the host, from the record?`,
      answer: String(sum * 2),
    });
  }

  return out;
}

function consistencyOf(input: ActivityInput): ValidationActivity[] {
  return input.conflicts.map((c) => ({
    id: `val:${input.checkpoint.week}:consistency:${c.id}`,
    kind: 'consistency' as const,
    checkpoint: input.checkpoint.week,
    recordKey: c.keys[0] ?? c.id,
    area: input.record.entries.find((e) => e.key === c.keys[0])?.area ?? 'infrastructure',
    form: c.forms[0] ?? '',
    prompt: `Resolve: ${c.message}`,
    answer: 'resolved',
    conflictId: c.id,
  }));
}

/** The decision blocks' option labels, so a recall of a decision offers the block's own alternatives. */
function decisionEntries(input: ActivityInput): RecordEntry[] {
  return input.record.byArea.decisions.map((e) => {
    const def = input.defs.find((d) => d.id === e.form);
    const block = def ? decisionBlocksOf(def).find((b) => `decision:${b.id}` === e.field) : undefined;
    const chosen = block?.options.find((o) => o.id === e.value);
    return chosen ? { ...e, value: chosen.label } : e;
  });
}

/**
 * The activities of one checkpoint. `recall` asks the values and the reasons;
 * `apply` and `extend` ask the scenarios and the conflicts, with the decisions
 * recalled again. Nothing is generated for a value the record does not hold.
 */
export function validationActivities(input: ActivityInput): ValidationActivity[] {
  const { record, checkpoint } = input;
  const ordered = [...record.entries].sort((a, b) => a.key.localeCompare(b.key));
  const out: ValidationActivity[] = [];
  const decisions = decisionEntries(input);

  if (checkpoint.kind === 'recall') {
    const facts = ordered.filter((e) => ['ipv4', 'cidr', 'vlan', 'port', 'size', 'dns'].includes(e.kind));
    for (const e of stableShuffle(facts, `recall:${checkpoint.week}`)) {
      const a = recallOf(e, input);
      if (a) out.push(a);
      if (out.length >= LIMITS.recall) break;
    }
    for (const e of decisions) {
      const block = input.defs.find((d) => d.id === e.form) && decisionBlocksOf(input.defs.find((d) => d.id === e.form)!).find((b) => `decision:${b.id}` === e.field);
      const alternatives = (block?.options ?? []).map((o) => o.label).filter((l) => l !== e.value);
      if (alternatives.length >= 2) {
        const id = `val:${checkpoint.week}:recall:${e.key}`;
        out.push({ id, kind: 'recall', checkpoint: checkpoint.week, recordKey: e.key, area: e.area, form: e.form, prompt: `Which option did the team choose for ${e.label.toLowerCase()} in ${formTitle(input.defs, e.form)}?`, options: stableShuffle([e.value, ...alternatives.slice(0, 3)], id), answer: e.value });
      }
    }
    const explainable = [...decisions, ...ordered.filter((e) => e.kind === 'risk' || e.kind === 'rule')];
    for (const e of explainable.slice(0, LIMITS.explain)) out.push(explainOf(e, input));
    return out;
  }

  // apply and extend
  out.push(...applyOf(input).slice(0, LIMITS.apply));
  out.push(...consistencyOf(input));
  for (const e of decisions.slice(0, 2)) {
    const block = decisionBlocksOf(input.defs.find((d) => d.id === e.form)!).find((b) => `decision:${b.id}` === e.field);
    const alternatives = (block?.options ?? []).map((o) => o.label).filter((l) => l !== e.value);
    if (alternatives.length >= 2) {
      const id = `val:${checkpoint.week}:recall:${e.key}`;
      out.push({ id, kind: 'recall', checkpoint: checkpoint.week, recordKey: e.key, area: e.area, form: e.form, prompt: `A teammate asks which option was chosen for ${e.label.toLowerCase()}. Which was it?`, options: stableShuffle([e.value, ...alternatives.slice(0, 3)], id), answer: e.value });
    }
  }
  return out;
}

/** Judge a choice or a typed value against the activity; an explanation is judged by the instructor, a consistency task by the record. */
export function judgeAnswer(activity: ValidationActivity, given: string, conflictsNow?: RecordConflict[]): boolean | null {
  if (activity.kind === 'explain') return null;
  if (activity.kind === 'consistency') return !!conflictsNow && !conflictsNow.some((c) => c.id === activity.conflictId);
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
  return norm(given) === norm(activity.answer);
}
