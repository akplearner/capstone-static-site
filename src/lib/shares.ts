'use client';

// shares.ts — candidate links, the member's half and the reader's (R114).
//
// A link is created by the `share` edge function (cloud mode, with the
// share-employer consent held), listed, revoked and deleted here through the
// member's own rows (never the copy or the token hash: the table's column
// grants refuse both), and read by whoever holds it through `shared-profile`.
// The token travels in the URL's fragment (`/share#<token>`), which a browser
// never sends to a server, so it stays out of the host's logs and out of
// every Referer header.
//
// Everything degrades to "not available" on a project that has not run
// migration 0015 or deployed the functions: a request naming a missing table
// or function must never break the page around it.

import { getBrowserClient } from './supabase/client';
import { SHARE_DAYS, TOKEN_RE, shareProblem, type ShareKind, type ShareRequest } from '../../supabase/functions/_shared/shareGuard';

export { SHARE_DAYS };
export type { ShareKind, ShareRequest };

export interface ShareRow {
  id: string;
  kind: ShareKind;
  label: string;
  measuredAgainst: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
}

export interface SharedCopy {
  kind: ShareKind;
  snapshot: Record<string, unknown>;
  measuredAgainst: string;
  createdAt: string;
  expiresAt: string;
}

export type ShareError = 'offline' | 'consent-required' | 'identity-in-snapshot' | 'too-large' | 'unavailable' | 'failed';

export function shareUrl(origin: string, token: string): string {
  return `${origin}/share#${token}`;
}

/** The token in a share page's fragment, or null when there is none worth asking about. */
export function tokenFromHash(hash: string): string | null {
  const t = hash.replace(/^#/, '');
  return TOKEN_RE.test(t) ? t : null;
}

export function shareStatus(row: Pick<ShareRow, 'expiresAt' | 'revokedAt'>, now: number): 'live' | 'expired' | 'revoked' {
  if (row.revokedAt) return 'revoked';
  return Date.parse(row.expiresAt) <= now ? 'expired' : 'live';
}

async function failure(error: unknown): Promise<{ status: number; code: string }> {
  const ctx = (error as { context?: unknown } | null)?.context;
  if (typeof Response !== 'undefined' && ctx instanceof Response) {
    let code = '';
    try {
      code = String(((await ctx.clone().json()) as { error?: unknown })?.error ?? '');
    } catch {
      // Not JSON: the gateway's own page.
    }
    return { status: ctx.status, code };
  }
  return { status: 0, code: '' };
}

/** Ask the platform for a link. The same checks run here first, so a refusal needs no round trip. */
export async function createShare(req: ShareRequest): Promise<{ ok: true; id: string; token: string; expiresAt: string } | { ok: false; error: ShareError }> {
  const supabase = getBrowserClient();
  if (!supabase) return { ok: false, error: 'offline' };
  const problem = shareProblem(req);
  if (problem) return { ok: false, error: problem === 'identity-in-snapshot' || problem === 'too-large' ? problem : 'failed' };
  const { data, error } = await supabase.functions.invoke('share', { body: req });
  if (error) {
    const { status, code } = await failure(error);
    if (code === 'consent-required' || code === 'identity-in-snapshot' || code === 'too-large') return { ok: false, error: code };
    if (status === 0 || status === 404 || code === 'share-unavailable') return { ok: false, error: 'unavailable' };
    return { ok: false, error: 'failed' };
  }
  const d = (data ?? {}) as { id?: unknown; token?: unknown; expiresAt?: unknown };
  if (typeof d.id !== 'string' || typeof d.token !== 'string' || !TOKEN_RE.test(d.token) || typeof d.expiresAt !== 'string') return { ok: false, error: 'failed' };
  return { ok: true, id: d.id, token: d.token, expiresAt: d.expiresAt };
}

/** The member's links, newest first; null where links cannot exist (offline, or no 0015 yet). */
export async function listShares(): Promise<ShareRow[] | null> {
  const supabase = getBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profile_shares')
    .select('id, kind, label, measured_against, created_at, expires_at, revoked_at')
    .order('created_at', { ascending: false });
  if (error) return null;
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    kind: r.kind === 'credential' ? 'credential' : 'profile',
    label: String(r.label ?? ''),
    measuredAgainst: String(r.measured_against ?? ''),
    createdAt: String(r.created_at ?? ''),
    expiresAt: String(r.expires_at ?? ''),
    revokedAt: r.revoked_at ? String(r.revoked_at) : null,
  }));
}

/**
 * Revoke a live link. The client sends no time of its own: `'now'` is
 * Postgres's word for the current instant, and the table's trigger stamps
 * the database clock in any case. A revoked link stays revoked.
 */
export async function revokeShare(id: string): Promise<boolean> {
  const supabase = getBrowserClient();
  if (!supabase) return false;
  const { error } = await supabase.from('profile_shares').update({ revoked_at: 'now' }).eq('id', id);
  return !error;
}

/** Delete a link outright: the frozen copy goes with it. */
export async function deleteShare(id: string): Promise<boolean> {
  const supabase = getBrowserClient();
  if (!supabase) return false;
  const { error } = await supabase.from('profile_shares').delete().eq('id', id);
  return !error;
}

/** Read a link by its token. Null for unknown, revoked and expired alike (the function says no more), or when nothing answers. */
export async function fetchShared(token: string): Promise<SharedCopy | null> {
  const supabase = getBrowserClient();
  if (!supabase || !TOKEN_RE.test(token)) return null;
  const { data, error } = await supabase.functions.invoke('shared-profile', { body: { token } });
  if (error || !data) return null;
  const d = data as Record<string, unknown>;
  if ((d.kind !== 'profile' && d.kind !== 'credential') || !d.snapshot || typeof d.snapshot !== 'object') return null;
  return {
    kind: d.kind,
    snapshot: d.snapshot as Record<string, unknown>,
    measuredAgainst: String(d.measuredAgainst ?? ''),
    createdAt: String(d.createdAt ?? ''),
    expiresAt: String(d.expiresAt ?? ''),
  };
}
