'use client';

// stamps.ts — the server-issued stamp and the verification receipt (R113).
//
// In cloud mode the `stamp` edge function issues the CQ- stamp a member echoes
// into pasted output: random, the member's own, for one task, live for twenty
// minutes. When output carrying it matches every expected token, the `receipt`
// function logs a receipt: the stamp, the step, the output's SHA-256 and the
// token counts. The pasted text never leaves the browser; the request body has
// no field for it, and the function refuses one.
//
// Offline, in demo mode, signed out, or before the functions are deployed,
// nothing here answers, and every caller falls back to the client stamp
// (`taskToken`), which keeps working exactly as before. A receipt records the
// stamp, not the machine; no wording built on this module may claim more.

import { useEffect, useSyncExternalStore } from 'react';
import { getBrowserClient } from './supabase/client';
import { cache, getCurrentUserId } from './data/supabaseCache';
import { notifyStore } from './useClientStore';
import { STAMP_RE, STAMP_REUSE_MINUTES } from '../../supabase/functions/_shared/stampCodec';

export interface ServerStamp {
  stamp: string;
  /** Epoch ms. */
  expiresAt: number;
  /** Set when the stamp's time ran out while it was on screen. */
  expired: boolean;
}

/** What became of a match: logged, refused because the stamp ran out or was not recognised, or no server to ask. */
export type ReceiptOutcome = 'receipted' | 'stamp-expired' | 'stamp-unknown' | 'offline';

export interface ReceiptRequest {
  userId: string;
  courseId: string;
  taskId: string;
  stepId: string;
  stamp: string;
  outputSha256: string;
  matchedTokens: number;
  totalTokens: number;
}

const REUSE_MS = STAMP_REUSE_MINUTES * 60_000;
/** After a failure that is not "not deployed", wait this long before asking again. */
const BACKOFF_MS = 60_000;

const stamps = new Map<string, ServerStamp>();
const inflight = new Map<string, Promise<ServerStamp | null>>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const listeners = new Set<() => void>();
/** False once the platform answered "no such function": fall back for the rest of the page's life. */
let deployed: boolean | null = null;
let backoffUntil = 0;

const keyOf = (userId: string, courseId: string, taskId: string) => `${userId}|${courseId}|${taskId}`;
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

function put(k: string, s: Omit<ServerStamp, 'expired'>): ServerStamp {
  clearTimeout(timers.get(k));
  const left = s.expiresAt - Date.now();
  const next: ServerStamp = { ...s, expired: left <= 0 };
  stamps.set(k, next);
  if (left > 0) {
    // Mark it expired on screen the moment its time runs out, so the chip says
    // so before a paste is refused for it.
    timers.set(k, setTimeout(() => markExpired(k, s.stamp), Math.min(left, 2 ** 31 - 1)));
  }
  emit();
  return next;
}

function markExpired(k: string, stamp: string): void {
  const cur = stamps.get(k);
  if (!cur || cur.stamp !== stamp || cur.expired) return;
  stamps.set(k, { ...cur, expired: true });
  emit();
}

/** The HTTP status and the function's own error code, from a failed invoke. */
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

/** Could a server stamp exist for this member right now? Never for anyone but the signed-in member. */
function canAsk(userId: string): boolean {
  return deployed !== false && Date.now() >= backoffUntil && !!getBrowserClient() && getCurrentUserId() === userId;
}

/**
 * Ask the platform for this member's live stamp on one task. Resolves null on
 * any failure (the caller falls back to the client stamp). Concurrent callers
 * share one request.
 */
export function fetchStamp(userId: string, courseId: string, taskId: string): Promise<ServerStamp | null> {
  const k = keyOf(userId, courseId, taskId);
  const pending = inflight.get(k);
  if (pending) return pending;
  const supabase = getBrowserClient();
  if (!supabase || !canAsk(userId)) return Promise.resolve(null);
  const request = supabase.functions
    .invoke('stamp', { body: { courseId, taskId } })
    .then(async ({ data, error }) => {
      if (error) {
        const { status } = await failure(error);
        if (status === 404) deployed = false;
        else backoffUntil = Date.now() + BACKOFF_MS;
        return null;
      }
      const stamp = String((data as { stamp?: unknown } | null)?.stamp ?? '');
      const expiresAt = Date.parse(String((data as { expiresAt?: unknown } | null)?.expiresAt ?? ''));
      if (!STAMP_RE.test(stamp) || !Number.isFinite(expiresAt)) return null;
      deployed = true;
      return put(k, { stamp, expiresAt });
    })
    .catch(() => {
      backoffUntil = Date.now() + BACKOFF_MS;
      return null;
    })
    .finally(() => {
      inflight.delete(k);
    });
  inflight.set(k, request);
  return request;
}

/** A fresh stamp after the old one ran out: what the chip and the "Get a fresh stamp" button call. */
export function refreshStamp(userId: string, courseId: string, taskId: string): Promise<ServerStamp | null> {
  return fetchStamp(userId, courseId, taskId);
}

/**
 * This member's server stamp for a task, or null (offline, not deployed, not
 * signed in, still on the wire). On mount it asks for one when none is held
 * or the one held has five minutes or less to live (the server's own reuse
 * margin), so a step starts with time on its stamp; it never swaps a stamp
 * that still has time while a step is open.
 */
export function useServerStamp(userId: string | undefined, courseId: string, taskId: string | undefined): ServerStamp | null {
  const k = userId && taskId ? keyOf(userId, courseId, taskId) : '';
  const held = useSyncExternalStore(
    subscribe,
    () => (k ? stamps.get(k) ?? null : null),
    () => null
  );
  useEffect(() => {
    if (!userId || !taskId) return;
    const cur = stamps.get(keyOf(userId, courseId, taskId));
    if (cur && cur.expiresAt - Date.now() > REUSE_MS) return;
    void fetchStamp(userId, courseId, taskId);
  }, [userId, courseId, taskId]);
  return held;
}

/**
 * Ask the platform to receipt a match. Only a stamp this module holds for the
 * member's task is ever sent; the body is exactly the seven fields the
 * function accepts, and none of them is the paste.
 */
export async function requestReceipt(r: ReceiptRequest): Promise<ReceiptOutcome> {
  const supabase = getBrowserClient();
  const k = keyOf(r.userId, r.courseId, r.taskId);
  const held = stamps.get(k);
  if (!supabase || deployed === false || getCurrentUserId() !== r.userId) return 'offline';
  if (!held || held.stamp !== r.stamp) return 'offline';
  if (held.expired || held.expiresAt <= Date.now()) {
    markExpired(k, held.stamp);
    return 'stamp-expired';
  }
  const { data, error } = await supabase.functions.invoke('receipt', {
    body: {
      courseId: r.courseId,
      taskId: r.taskId,
      stepId: r.stepId,
      stamp: r.stamp,
      outputSha256: r.outputSha256,
      matchedTokens: r.matchedTokens,
      totalTokens: r.totalTokens,
    },
  });
  if (error) {
    const { status, code } = await failure(error);
    if (code === 'stamp-expired') {
      markExpired(k, held.stamp);
      return 'stamp-expired';
    }
    // This stamp already receipted this step: the receipt exists.
    if (code === 'stamp-used') return 'receipted';
    if (code === 'stamp-unknown' || code === 'stamp-mismatch') return 'stamp-unknown';
    if (status === 404) deployed = false;
    return 'offline';
  }
  const at = Date.parse(String((data as { receiptedAt?: unknown } | null)?.receiptedAt ?? ''));
  cache.setReceipt(
    { courseId: r.courseId, taskId: r.taskId, stepId: r.stepId, outputSha256: r.outputSha256, receiptedAt: Number.isFinite(at) ? at : Date.now() },
    r.userId
  );
  notifyStore();
  return 'receipted';
}
