'use client';

import { useClientStore, notifyStore } from './useClientStore';
import { labAccessRepo, progressRepo } from './data';

// Personal lab access: the target IPs/credentials each student gets from their
// instructor, plus a quick reachability checklist. Values are substituted into
// command placeholders so copy-paste "just works".
//
// This is saved to the student's ACCOUNT when signed in, so their lab details
// follow them between devices, and to localStorage otherwise. It is the only
// student data that is owner-only in the database — not teammates, not
// instructors — because the notes field is where lab passwords end up. See
// supabase/migrations/0002_student_state.sql.

export interface LabAccess {
  values: Record<string, string>;
  checks: Record<string, boolean>;
  notes: string;
}

const EMPTY: LabAccess = { values: {}, checks: {}, notes: '' };

// Fields the student fills; `tokens` are the placeholders replaced in commands.
export const LAB_FIELDS: { key: string; label: string; placeholder: string; tokens: string[] }[] = [
  { key: 'YOUR_TARGET_IP', label: 'Your target IP', placeholder: 'e.g. 10.10.100.7', tokens: ['<YOUR_TARGET_IP>', '10.10.100.X', '10.10.100.x'] },
  { key: 'UBUNTU_IP', label: 'Ubuntu host IP', placeholder: 'e.g. 10.10.100.7', tokens: ['<UBUNTU_IP>'] },
  { key: 'WINDOWS_IP', label: 'Windows host IP', placeholder: 'e.g. 10.10.20.7', tokens: ['<WINDOWS_IP>'] },
  // The attacker is always Kali. The lowercase spellings are the ones the course
  // prose actually uses, and they were silently never substituted before.
  { key: 'ATTACKER_IP', label: 'Your Kali (attacker) IP', placeholder: 'e.g. 10.10.30.7', tokens: ['<ATTACKER_IP>', '<kali-ip>', '<attacker-ip>'] },
  { key: 'TEAM_NUM', label: 'Your team number', placeholder: 'e.g. 7', tokens: ['<#>', '<team>'] },
];

export const LAB_CHECKS: { key: string; label: string }[] = [
  { key: 'kali', label: 'Kali boots and is fully updated' },
  { key: 'target', label: 'Target answers a ping' },
  { key: 'dvwa', label: 'DVWA loads in a browser' },
  { key: 'scope', label: 'Read the Rules of Engagement (authorized scope)' },
];

/** The member this data belongs to. Derived here rather than threaded through
 *  every caller, so the public API stays `getLabAccess(courseId)` and no call
 *  site changed when this moved off localStorage. Both repo implementations
 *  expose the same context, and the Supabase one ignores the id in favour of the
 *  authenticated session. */
function memberIdFor(courseId: string): string {
  return progressRepo.getContext(courseId)?.memberId ?? 'guest';
}

export function getLabAccess(courseId: string): LabAccess {
  if (typeof window === 'undefined') return EMPTY;
  const stored = labAccessRepo.get(courseId, memberIdFor(courseId));
  // Spread over EMPTY so a row written before a field existed still parses.
  return stored ? { ...EMPTY, ...stored } : EMPTY;
}

export function saveLabAccess(courseId: string, data: LabAccess): void {
  if (typeof window === 'undefined') return;
  labAccessRepo.save(courseId, memberIdFor(courseId), data);
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
  // Case-insensitive, and allows the hyphenated lowercase spellings (<kali-ip>)
  // the content uses — the old /<[A-Z_]+>/ silently ignored every one of them.
  if (/<[A-Za-z_#][A-Za-z0-9_-]*>/.test(text)) return true;
  return LAB_FIELDS.some((f) =>
    f.tokens.some((tok) => !tok.startsWith('<') && text.includes(tok))
  );
}
