'use client';

import { useEffect, useState } from 'react';
import { getBrowserClient } from '../supabase/client';
import { isSupabaseConfigured } from '../supabase/config';
import { KEYS } from '../data/keys';
import { safeSetItem } from '../data/safeStorage';
import { notifyStore, useClientStore } from '../useClientStore';
import { useAuth } from '../useAuth';

/**
 * R110 — consent grants. Nothing about a member reaches a third party unless
 * a grant allows it; every grant is off until the member turns it on, and
 * revoking is a new row, never an edit (the append-only `consent_grants`
 * table of migration 0013; one blob per device offline). There is no
 * `train` grant: the Terms say content is never used to train models.
 *
 * The registry is pure data; the fold is pure; the rest is the client half.
 */
export type ConsentId = 'share-employer' | 'benchmark' | 'outcome';

export interface ConsentDef {
  id: ConsentId;
  title: string;
  /** What turning it on allows. */
  allows: string;
  /** What it never allows, even when on. */
  neverAllows: string;
}

export const CONSENTS: ConsentDef[] = [
  {
    id: 'share-employer',
    title: 'Share with an employer',
    allows: 'Lets you create expiring links to a frozen copy of your own export. Nothing is shared until you create one.',
    neverAllows: 'Never lets anyone pull your record; every link is yours to create and to revoke.',
  },
  {
    id: 'benchmark',
    title: 'Benchmark',
    allows: 'Lets your numbers be counted, without your name, in cohort bands shown as counts.',
    neverAllows: 'Never a rank, never a per-person number, never below five members.',
  },
  {
    id: 'outcome',
    title: 'Outcomes',
    allows: 'Lets you answer the outcome questions below, and lets instructors see counts per status for a course.',
    neverAllows: 'Never the employer name or your answers themselves; counts appear only from five members.',
  },
];

export const NO_TRAINING = 'Nothing is used to train models.';

export type ConsentState = Record<ConsentId, boolean>;
export const NO_CONSENT: ConsentState = { 'share-employer': false, benchmark: false, outcome: false };

export interface ConsentRow {
  grantId: string;
  granted: boolean;
  recordedAt: number;
}

export function isConsentId(id: string): id is ConsentId {
  return CONSENTS.some((c) => c.id === id);
}

/** The latest row per grant wins; unknown grants are ignored. */
export function foldConsentRows(rows: ConsentRow[]): ConsentState {
  const state: ConsentState = { ...NO_CONSENT };
  const latest = new Map<ConsentId, number>();
  for (const r of rows) {
    if (!isConsentId(r.grantId)) continue;
    const seen = latest.get(r.grantId);
    if (seen !== undefined && seen > r.recordedAt) continue;
    latest.set(r.grantId, r.recordedAt);
    state[r.grantId] = r.granted;
  }
  return state;
}

type LocalBlob = Partial<Record<ConsentId, { granted: boolean; at: number }>>;

function readLocal(): LocalBlob {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(KEYS.consents) ?? '{}') as LocalBlob;
  } catch {
    return {};
  }
}

export function localConsents(): ConsentState {
  const blob = readLocal();
  return foldConsentRows(Object.entries(blob).map(([grantId, v]) => ({ grantId, granted: !!v?.granted, recordedAt: v?.at ?? 0 })));
}

export function setLocalConsent(id: ConsentId, granted: boolean): void {
  if (typeof window === 'undefined') return;
  const blob = readLocal();
  blob[id] = { granted, at: Date.now() };
  safeSetItem(KEYS.consents, JSON.stringify(blob));
  notifyStore();
}

export async function fetchCloudConsents(): Promise<ConsentState | null> {
  const supabase = getBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from('consent_grants').select('grant_id, granted, recorded_at');
  if (error) {
    console.error('consent read failed', error.message);
    return null;
  }
  return foldConsentRows((data ?? []).map((r) => ({ grantId: String(r.grant_id), granted: !!r.granted, recordedAt: Date.parse(String(r.recorded_at ?? '')) || 0 })));
}

/** One append-only row per change. */
export async function recordConsentInCloud(userId: string, id: ConsentId, granted: boolean): Promise<boolean> {
  const supabase = getBrowserClient();
  if (!supabase) return false;
  const { error } = await supabase.from('consent_grants').insert({ user_id: userId, grant_id: id, granted });
  if (error) {
    console.error('consent write failed', error.message);
    return false;
  }
  return true;
}

/**
 * The current grants for whoever is using the app: the device's blob offline,
 * the account's log in cloud mode (read once per account). `set` records a
 * change and reports whether it landed.
 */
export function useConsents(): { consents: ConsentState; loaded: boolean; set: (id: ConsentId, granted: boolean) => Promise<boolean> } {
  const cloud = isSupabaseConfigured();
  const { user } = useAuth();
  const local = useClientStore(localConsents, NO_CONSENT);
  const [cloudState, setCloudState] = useState<ConsentState | null>(null);
  useEffect(() => {
    if (!cloud || !user) return;
    let on = true;
    void fetchCloudConsents().then((c) => {
      if (on) setCloudState(c ?? { ...NO_CONSENT });
    });
    return () => {
      on = false;
    };
  }, [cloud, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps -- the account id is the dependency
  const set = async (id: ConsentId, granted: boolean) => {
    if (!cloud) {
      setLocalConsent(id, granted);
      return true;
    }
    if (!user) return false;
    const ok = await recordConsentInCloud(user.id, id, granted);
    if (ok) setCloudState((s) => ({ ...(s ?? NO_CONSENT), [id]: granted }));
    return ok;
  };
  if (!cloud) return { consents: local, loaded: true, set };
  return { consents: cloudState ?? NO_CONSENT, loaded: cloudState !== null, set };
}
