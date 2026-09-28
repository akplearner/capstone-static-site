'use client';

import { getBrowserClient } from '../supabase/client';
import { isSupabaseConfigured } from '../supabase/config';
import { KEYS } from '../data/keys';
import { safeSetItem } from '../data/safeStorage';
import { notifyStore } from '../useClientStore';
import { AGREEMENTS, type Agreement } from './agreements';

/**
 * The acknowledgement log's client half (R86). Cloud: one append-only row per
 * (user, agreement, version) — signing again after a version bump adds a row,
 * so the log shows WHICH text a person agreed to and when. Offline: one blob
 * per device, because with no accounts the device is the identity.
 */

export type AcceptedVersions = Record<string, number>;

export function localAcceptances(): AcceptedVersions {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(KEYS.legalAcceptances);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, { version: number; at: number }>;
    return Object.fromEntries(Object.entries(parsed).map(([id, v]) => [id, v.version]));
  } catch {
    return {};
  }
}

export function acceptLocally(agreements: Agreement[]): void {
  if (typeof window === 'undefined') return;
  let existing: Record<string, { version: number; at: number }> = {};
  try {
    existing = JSON.parse(localStorage.getItem(KEYS.legalAcceptances) ?? '{}');
  } catch {
    /* start fresh over a malformed blob */
  }
  const at = Date.now();
  for (const a of agreements) existing[a.id] = { version: a.version, at };
  safeSetItem(KEYS.legalAcceptances, JSON.stringify(existing));
  notifyStore();
}

/** The signed-in user's own log, folded to the highest version per agreement. */
export async function fetchCloudAcceptances(): Promise<AcceptedVersions | null> {
  const supabase = getBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from('agreement_acceptances').select('agreement_id, version');
  if (error) {
    console.error('acceptance log read failed', error.message);
    return null;
  }
  const out: AcceptedVersions = {};
  for (const r of data ?? []) {
    const id = String(r.agreement_id);
    out[id] = Math.max(out[id] ?? 0, Number(r.version ?? 0));
  }
  return out;
}

export async function acceptInCloud(userId: string, agreements: Agreement[]): Promise<boolean> {
  const supabase = getBrowserClient();
  if (!supabase) return false;
  const { error } = await supabase.from('agreement_acceptances').upsert(
    agreements.map((a) => ({ user_id: userId, agreement_id: a.id, version: a.version })),
    { onConflict: 'user_id,agreement_id,version', ignoreDuplicates: true }
  );
  if (error) {
    console.error('acceptance log write failed', error.message);
    return false;
  }
  return true;
}

export function isCloudMode(): boolean {
  return isSupabaseConfigured();
}

/** Sanity used by tests and the gate: every id in a stored map is known. */
export function knownAgreementIds(): Set<string> {
  return new Set(AGREEMENTS.map((a) => a.id));
}
