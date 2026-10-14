'use client';

import { getBrowserClient } from '../supabase/client';
import { isSupabaseConfigured } from '../supabase/config';
import { KEYS } from '../data/keys';
import { safeSetItem } from '../data/safeStorage';
import { notifyStore } from '../useClientStore';
import { AGREEMENTS, type Agreement } from './agreements';
import { sha256Text } from '../evidenceLedger';

/**
 * The acknowledgement log's client half (R86). Cloud: one append-only row per
 * (user, agreement, version) — signing again after a version bump adds a row,
 * so the log shows WHICH text a person agreed to and when. Offline: one blob
 * per device, because with no accounts the device is the identity.
 */

export type AcceptedVersions = Record<string, number>;

/** One row of the log, as the account export and the gate read it back. */
export interface AcceptanceRow {
  agreementId: string;
  version: number;
  acceptedAt: string;
  textSha256: string | null;
}

/**
 * R110: the SHA-256 of the agreement's sections, written beside the version
 * so the log says exactly which words were accepted. Stable for the same
 * text; changes when any heading or body changes.
 */
export function agreementTextHash(a: Agreement): Promise<string> {
  return sha256Text(JSON.stringify(a.sections));
}

/** The device's log as rows (offline mode). */
export function localAcceptanceLog(): AcceptanceRow[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEYS.legalAcceptances);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, { version: number; at: number; textSha256?: string }>;
    return Object.entries(parsed).map(([agreementId, v]) => ({ agreementId, version: v.version, acceptedAt: new Date(v.at).toISOString(), textSha256: v.textSha256 ?? null }));
  } catch {
    return [];
  }
}

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

/**
 * Does the project's `agreement_acceptances` table have the R110 hash column?
 * Unknown until a request says otherwise. A project that has not run
 * migration 0013 answers PostgREST's "column not found" (PGRST204) for any
 * request naming `text_sha256`; acceptance must never be blocked by that lag,
 * so the log is written without the hash and the column is not asked for
 * again in this page's life. Re-running supabase/setup.sql adds it.
 */
let hashColumn: boolean | null = null;

/** PostgREST could not find the hash column: the project predates 0013. */
function missingHashColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === 'PGRST204' || error.code === '42703' || /text_sha256/.test(error.message ?? '');
}

/** The signed-in user's whole log, one row per (agreement, version), for the account export. */
export async function fetchCloudAcceptanceLog(): Promise<AcceptanceRow[] | null> {
  const supabase = getBrowserClient();
  if (!supabase) return null;
  const read = (withHash: boolean) =>
    supabase
      .from('agreement_acceptances')
      .select(withHash ? 'agreement_id, version, accepted_at, text_sha256' : 'agreement_id, version, accepted_at')
      .order('accepted_at');
  let { data, error } = await read(hashColumn !== false);
  if (error && hashColumn !== false && missingHashColumn(error)) {
    hashColumn = false;
    ({ data, error } = await read(false));
  }
  if (error) {
    console.error('acceptance log read failed', error.message);
    return null;
  }
  return ((data ?? []) as unknown as Record<string, unknown>[]).map((r) => ({ agreementId: String(r.agreement_id), version: Number(r.version ?? 0), acceptedAt: String(r.accepted_at ?? ''), textSha256: r.text_sha256 ? String(r.text_sha256) : null }));
}

export async function acceptInCloud(userId: string, agreements: Agreement[]): Promise<boolean> {
  const supabase = getBrowserClient();
  if (!supabase) return false;
  const hashes = await Promise.all(agreements.map(agreementTextHash));
  const write = (withHash: boolean) =>
    supabase.from('agreement_acceptances').upsert(
      agreements.map((a, i) => ({ user_id: userId, agreement_id: a.id, version: a.version, ...(withHash ? { text_sha256: hashes[i] } : {}) })),
      { onConflict: 'user_id,agreement_id,version', ignoreDuplicates: true }
    );
  let { error } = await write(hashColumn !== false);
  if (error && hashColumn !== false && missingHashColumn(error)) {
    // The version and the time are what the gate needs; the hash waits for 0013.
    console.warn('agreement_acceptances has no text_sha256 column yet (run supabase/setup.sql); logging the acceptance without the text hash');
    hashColumn = false;
    ({ error } = await write(false));
  }
  if (error) {
    console.error('acceptance log write failed', error.message);
    return false;
  }
  if (hashColumn === null) hashColumn = true;
  return true;
}

export function isCloudMode(): boolean {
  return isSupabaseConfigured();
}

/** Sanity used by tests and the gate: every id in a stored map is known. */
export function knownAgreementIds(): Set<string> {
  return new Set(AGREEMENTS.map((a) => a.id));
}
