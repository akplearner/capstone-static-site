'use client';

import { getBrowserClient } from '../supabase/client';
import { isSupabaseConfigured } from '../supabase/config';
import { KEYS } from '../data/keys';
import { safeSetItem } from '../data/safeStorage';
import { notifyStore } from '../useClientStore';
import { AGREEMENTS, type Agreement } from './agreements';
import { sha256Text } from '../evidenceLedger';
import { reportError, type SupportRef } from '../reportError';

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
    void reportError({ area: 'agreements-read', reason: classifyAcceptError(error), dbCode: error.code, message: error.message });
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
    void reportError({ area: 'agreements-read', reason: classifyAcceptError(error), dbCode: error.code, message: error.message });
    return null;
  }
  return ((data ?? []) as unknown as Record<string, unknown>[]).map((r) => ({ agreementId: String(r.agreement_id), version: Number(r.version ?? 0), acceptedAt: String(r.accepted_at ?? ''), textSha256: r.text_sha256 ? String(r.text_sha256) : null }));
}

/** Why a write to the acknowledgement log failed, in the terms a student can act on (R128). */
export type AcceptFailure = 'session' | 'permission' | 'network' | 'unknown';
export type AcceptResult = { ok: true } | { ok: false; reason: AcceptFailure; support: SupportRef };

type DbError = { code?: string; message?: string; details?: string; hint?: string; status?: number };

/** Sort a database error into the four things a person can do something about. */
export function classifyAcceptError(error: DbError): AcceptFailure {
  const code = String(error.code ?? '');
  const message = (error.message ?? '').toLowerCase();
  if (code === 'PGRST301' || code === 'PGRST303' || error.status === 401 || /jwt|token is expired|not authenticated|invalid claim/.test(message)) return 'session';
  if (code === '42501' || error.status === 403 || /row-level security|permission denied/.test(message)) return 'permission';
  if (/failed to fetch|networkerror|load failed|network request failed|timeout/.test(message)) return 'network';
  return 'unknown';
}

const isDuplicate = (error: DbError | null) => error?.code === '23505';

/**
 * Record the acceptances for the signed-in user. A plain insert (a duplicate means it was already
 * recorded, which is success); the hash is optional, because it needs `crypto.subtle` (absent in some
 * in-app browsers) and migration 0013; an expired session is refreshed once and the write retried.
 * The failure carries the code and message so the console says what actually happened.
 */
export async function acceptInCloudDetailed(userId: string, agreements: Agreement[]): Promise<AcceptResult> {
  const supabase = getBrowserClient();
  if (!supabase) return { ok: false, reason: 'unknown', support: await reportError({ area: 'agreements', reason: 'unknown', message: 'no client' }) };
  const hashes = await Promise.all(
    agreements.map((a) =>
      // crypto.subtle may be absent: the acceptance is logged without the hash rather than not at all.
      agreementTextHash(a).catch(() => null)
    )
  );
  const rowsFor = (withHash: boolean) => agreements.map((a, i) => ({ user_id: userId, agreement_id: a.id, version: a.version, ...(withHash && hashes[i] ? { text_sha256: hashes[i] } : {}) }));
  const write = async (withHash: boolean): Promise<DbError | null> => {
    const rows = rowsFor(withHash);
    const { error } = await supabase.from('agreement_acceptances').insert(rows);
    if (!isDuplicate(error)) return error;
    // One of the rows is already in the log: add the others one at a time, and count a duplicate as done.
    for (const row of rows) {
      const one = await supabase.from('agreement_acceptances').insert(row);
      if (one.error && !isDuplicate(one.error)) return one.error;
    }
    return null;
  };
  const attempt = async (): Promise<DbError | null> => {
    let error = await write(hashColumn !== false);
    if (error && hashColumn !== false && missingHashColumn(error)) {
      // The version and the time are what the gate needs; the hash waits for 0013.
      // (The project predates 0013: log without the hash; re-running supabase/setup.sql adds the column.)
      hashColumn = false;
      error = await write(false);
    }
    return error;
  };
  let error = await attempt();
  if (error && classifyAcceptError(error) === 'session') {
    await supabase.auth.refreshSession().catch(() => undefined);
    error = await attempt();
  }
  if (error) {
    // The detail goes to our log, not to the student or the console (R129).
    const reason = classifyAcceptError(error);
    const support = await reportError({ area: 'agreements', reason, dbCode: error.code, status: error.status, message: error.message, details: [error.details, error.hint].filter(Boolean).join(' | ') });
    return { ok: false, reason, support };
  }
  if (hashColumn === null) hashColumn = true;
  return { ok: true };
}

export async function acceptInCloud(userId: string, agreements: Agreement[]): Promise<boolean> {
  return (await acceptInCloudDetailed(userId, agreements)).ok;
}

export function isCloudMode(): boolean {
  return isSupabaseConfigured();
}

/** Sanity used by tests and the gate: every id in a stored map is known. */
export function knownAgreementIds(): Set<string> {
  return new Set(AGREEMENTS.map((a) => a.id));
}
