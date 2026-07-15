'use client';

import { useClientStore, notifyStore } from './useClientStore';
import { KEYS } from './data/keys';

// Personal lab access: the target IPs/credentials each student gets from their
// instructor, plus a quick reachability checklist. Stored per-device (localStorage);
// values are substituted into command placeholders so copy-paste "just works".
//
// Kept deliberately outside the repo interfaces — it's personal scratch data, not
// graded progress — so it needs no Supabase backend to be useful offline.

export interface LabAccess {
  values: Record<string, string>;
  checks: Record<string, boolean>;
  notes: string;
}

const EMPTY: LabAccess = { values: {}, checks: {}, notes: '' };

// Fields the student fills; `tokens` are the placeholders replaced in commands.
export const LAB_FIELDS: { key: string; label: string; placeholder: string; tokens: string[] }[] = [
  { key: 'YOUR_TARGET_IP', label: 'Your target IP', placeholder: 'e.g. 10.10.100.5', tokens: ['<YOUR_TARGET_IP>', '10.10.100.X', '10.10.100.x'] },
  { key: 'UBUNTU_IP', label: 'Ubuntu host IP', placeholder: 'e.g. 10.10.10.5', tokens: ['<UBUNTU_IP>'] },
  { key: 'WINDOWS_IP', label: 'Windows host IP', placeholder: 'e.g. 10.10.10.6', tokens: ['<WINDOWS_IP>'] },
  { key: 'ATTACKER_IP', label: 'Your Kali (attacker) IP', placeholder: 'e.g. 10.10.10.10', tokens: ['<ATTACKER_IP>'] },
];

export const LAB_CHECKS: { key: string; label: string }[] = [
  { key: 'kali', label: 'Kali boots and is fully updated' },
  { key: 'target', label: 'Target answers a ping' },
  { key: 'dvwa', label: 'DVWA loads in a browser' },
  { key: 'scope', label: 'Read the Rules of Engagement (authorized scope)' },
];

export function getLabAccess(courseId: string): LabAccess {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = localStorage.getItem(KEYS.labAccess(courseId));
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<LabAccess>) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

export function saveLabAccess(courseId: string, data: LabAccess): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.labAccess(courseId), JSON.stringify(data));
  notifyStore();
}

export function useLabAccess(courseId: string): LabAccess {
  return useClientStore<LabAccess>(() => getLabAccess(courseId), EMPTY);
}

/** Replace lab placeholders (e.g. <YOUR_TARGET_IP>, 10.10.100.X) with the student's
 *  values. Only known tokens are touched; literal example IPs are left alone. */
export function fillPlaceholders(text: string, values: Record<string, string>): string {
  let out = text;
  for (const f of LAB_FIELDS) {
    const val = values[f.key]?.trim();
    if (!val) continue;
    for (const tok of f.tokens) out = out.split(tok).join(val);
  }
  return out;
}

/** True if the text still carries any known lab placeholder. Derived from
 *  LAB_FIELDS so it can never drift from the actual tokens (e.g. a subnet rename
 *  like 10.10.10.X → 10.10.100.X): any <UPPER_TOKEN> angle-token, or any literal
 *  sample token declared on a field. */
export function hasUnfilled(text: string): boolean {
  if (/<[A-Z_]+>/.test(text)) return true;
  return LAB_FIELDS.some((f) =>
    f.tokens.some((tok) => !tok.startsWith('<') && text.includes(tok))
  );
}
