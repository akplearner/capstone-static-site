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
