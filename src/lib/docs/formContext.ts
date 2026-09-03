import type { DeliverableData, DeliverableDef, FormContext } from './types';

/**
 * Building the context a form needs to see beyond itself.
 *
 * Kept out of the components so it is testable without a DOM, and out of
 * `definitions.ts` so the repo imports stay one-way (a component builds the
 * context from repo data and hands it down; nothing here touches a repo).
 */

/** Column/field names that hold a machine name, wherever they appear. */
const HOST_FIELDS = ['hostname', 'host', 'device', 'machine'];

/**
 * Every hostname this team has written down, plus the ones the course's own
 * worked examples name.
 *
 * The examples matter: a team fills the IP Plan in Week 3, and if the only
 * source were their own typing, the dropdown would be empty until they had
 * already filled the Architecture Brief's table by hand — which is the very
 * retyping this exists to remove. Seeded rows give it sensible options on day
 * one, and the student's own values win by being listed first.
 */
export function teamHostnames(docs: Record<string, DeliverableData>, defs: DeliverableDef[]): string[] {
  const own: string[] = [];
  const examples: string[] = [];

  for (const def of defs) {
    for (const section of def.sections) {
      if (section.kind !== 'group') continue;
      const cols = section.group.columns.filter(
        (c) => HOST_FIELDS.includes(c.field) || c.type === 'hostref'
      );
      if (cols.length === 0) continue;

      for (const row of docs[def.id]?.groups?.[section.group.group] ?? []) {
        for (const c of cols) if (row[c.field]?.trim()) own.push(row[c.field].trim());
      }
      for (const row of section.group.seed ?? []) {
        for (const c of cols) if (row[c.field]?.trim()) examples.push(row[c.field].trim());
      }
    }
  }

  // The team's own names first, then any example they have not used yet.
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of [...own, ...examples]) {
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

export function buildFormContext(
  docs: Record<string, DeliverableData>,
  defs: DeliverableDef[],
  evidence: { filename: string; sha256: string }[]
): FormContext {
  return { docs, hostnames: teamHostnames(docs, defs), evidence };
}

/** True when a string is a syntactically valid dotted-quad IPv4 address. */
export function isIpv4(value: string): boolean {
  const parts = value.trim().split('.');
  if (parts.length !== 4) return false;
  return parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) >= 0 && Number(p) <= 255);
}

/**
 * True when `address` sits inside `cidr`. Used to tell a student their address
 * is well-formed but in the wrong zone — the mistake that costs an afternoon,
 * because everything looks right until nothing routes.
 *
 * Returns true when the CIDR cannot be parsed: this is a hint, and a hint that
 * fires on a value it does not understand is worse than no hint.
 */
export function inSubnet(address: string, cidr: string): boolean {
  const [net, bitsRaw] = cidr.trim().split('/');
  const bits = Number(bitsRaw);
  if (!isIpv4(address) || !isIpv4(net) || !Number.isInteger(bits) || bits < 0 || bits > 32) return true;
  const toInt = (ip: string) => ip.split('.').reduce((n, o) => (n << 8) + Number(o), 0) >>> 0;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (toInt(address) & mask) === (toInt(net) & mask);
}

/** The units a `duration` offers, coarsest last. */
export const DURATION_UNITS = ['minutes', 'hours', 'days'] as const;

/** Split a stored duration ("4 hours") into its parts for editing. */
export function parseDuration(value: string): { amount: string; unit: string } {
  const m = /^\s*(\d+(?:\.\d+)?)\s*([A-Za-z]+)?\s*$/.exec(value ?? '');
  if (!m) return { amount: '', unit: DURATION_UNITS[1] };
  const unit = (m[2] ?? '').toLowerCase();
  return {
    amount: m[1],
    unit: DURATION_UNITS.find((u) => u.startsWith(unit.replace(/s$/, ''))) ?? DURATION_UNITS[1],
  };
}

export function formatDuration(amount: string, unit: string): string {
  return amount.trim() ? `${amount.trim()} ${unit}` : '';
}

/** A row counts as filled once any cell in it has a value. */
function rowHasContent(row: Record<string, string>): boolean {
  return Object.values(row).some((v) => (v ?? '').trim());
}

/**
 * Start a form's tables from the upstream form the team already filled.
 *
 * The rules, in the order that matters:
 *
 *  1. **Never overwrite what the student typed.** A group is only ever carried
 *     into when every one of its current rows is empty. One character anywhere
 *     in the table and this does nothing.
 *  2. Only the columns the group names are copied. The IP Plan takes hostname
 *     and zone from the Architecture Brief; it does not take the addresses,
 *     because its own instruction is to read those off the running machine.
 *  3. The student's own upstream data beats the generic worked example. When a
 *     form is still showing its example (`replaceSeed`), real rows from their
 *     own earlier form replace it.
 *
 * Returns the data to render plus, per group, how many rows came from where —
 * so the form can say so rather than silently appearing to know things.
 */
export function applyCarryForward(
  def: DeliverableDef,
  data: DeliverableData,
  ctx: FormContext,
  opts: { replaceSeed?: boolean } = {}
): { data: DeliverableData; carried: Record<string, { from: string; rows: number }> } {
  const carried: Record<string, { from: string; rows: number }> = {};
  let groups = data.groups;

  for (const section of def.sections) {
    if (section.kind !== 'group' || !section.group.carryFrom) continue;
    const { deliverableId, group: sourceGroup, columns } = section.group.carryFrom;

    const current = groups[section.group.group] ?? [];
    const studentHasTyped = current.some(rowHasContent);
    // Rule 1, and rule 3: a filled table is left alone; an example is only
    // displaced by the student's own real data.
    if (studentHasTyped && !opts.replaceSeed) continue;

    const upstream = (ctx.docs[deliverableId]?.groups?.[sourceGroup] ?? [])
      .map((row) => Object.fromEntries(columns.map((c) => [c, row[c] ?? ''])))
      .filter(rowHasContent);
    if (upstream.length === 0) continue;

    groups = { ...groups, [section.group.group]: upstream };
    carried[section.group.group] = { from: deliverableId, rows: upstream.length };
  }

  return { data: groups === data.groups ? data : { ...data, groups }, carried };
}

/** The address half of "172.16.0.10/24" — the plan tables record a mask. */
export function addressPart(value: string): string {
  return (value ?? '').trim().split('/')[0];
}

/** A dotted quad, optionally with a /0–32 mask. */
export function isIpv4OrCidr(value: string): boolean {
  const [addr, bits] = (value ?? '').trim().split('/');
  if (!isIpv4(addr)) return false;
  if (bits === undefined) return true;
  return /^\d{1,2}$/.test(bits) && Number(bits) <= 32;
}

/**
 * Can a stricter input hold what is already stored?
 *
 * A `<input type="number">` given "~350 W typical" renders **empty** — the
 * browser refuses the value and the student's answer vanishes from the screen
 * while remaining in their document. Same for a `date` holding "Wed 18:00".
 * Giving a column a real type must never do that to something already typed,
 * so the renderers fall back to a text box for a value the strict control
 * cannot represent. New entries still get the number pad and the date picker.
 */
export function fitsInput(type: string, value: string): boolean {
  const v = (value ?? '').trim();
  if (!v) return true;
  if (type === 'number') return /^-?\d+(\.\d+)?$/.test(v);
  if (type === 'date') return /^\d{4}-\d{2}-\d{2}$/.test(v);
  return true;
}
