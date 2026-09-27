import { buildTargets, locateTargets } from './stepOutcome';
import type { EvidenceMethod, StepEvidence } from './data/types';
import type { Step } from './types';

/**
 * The evidence ledger's pure logic: scoring a pasted output against a step's
 * `verify` tokens, and folding that into the durable record.
 *
 * Kept in a plain .ts module (no 'use client', no repo import) so it is
 * unit-testable and so the scoring rule has exactly one definition — the UI, the
 * metrics projections and the tests all agree by construction.
 *
 * WHAT THIS PROVES, PRECISELY: that text containing every expected token was
 * pasted by this account at this time, and the hash of that text. It does NOT
 * prove a command ran on real hardware — the check is client-side. Wording in
 * the UI must not exceed that claim; state-reading validators are what would
 * make it proof.
 */

/** Hex SHA-256 of a string, via WebCrypto. */
export async function sha256Text(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * The student's per-task stamp: `CQ-XXXXXX`, derived from (user, course, task).
 *
 * It is appended to a step's verify tokens, so pasted output only reads
 * `verified-output` when the student's own stamp appears in it — echo it, put
 * it in the prompt, anything. That binds a paste to THIS student on THIS task:
 * output copied from a classmate carries the wrong stamp.
 *
 * Same honesty rule as the header of this file: the stamp is derived
 * client-side (deliberately — it must work offline and render synchronously),
 * so a determined student can compute a classmate's. It raises the effort of
 * casual copying; it is not a cryptographic proof, and no UI wording may claim
 * more. FNV-1a, not SHA: synchronous, and secrecy was never the point.
 */
export function taskToken(userId: string, courseId: string, taskId: string): string {
  const s = `${userId}|${courseId}|${taskId}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  // Second pass over the reversed string widens 32 bits to the 6 characters.
  let h2 = 0x811c9dc5;
  for (let i = s.length - 1; i >= 0; i--) {
    h2 ^= s.charCodeAt(i);
    h2 = Math.imul(h2, 0x01000193) >>> 0;
  }
  const ALPHA = 'ABCDEFGHJKMNPQRSTVWXYZ23456789'; // no 0/O/1/I/L confusables
  let out = '';
  // Three characters from each 32-bit half (30^3 < 2^32, no BigInt needed).
  for (const half of [h, h2]) {
    let n = half;
    for (let i = 0; i < 3; i++) {
      out += ALPHA[n % ALPHA.length];
      n = Math.floor(n / ALPHA.length);
    }
  }
  return `CQ-${out}`;
}

export interface VerifyScore {
  matched: number;
  total: number;
  /** Every expected token was present. */
  allMatched: boolean;
  /** The tokens still missing, for the "looking for" chips. */
  missing: string[];
}

/**
 * Score pasted output against a step's expected tokens.
 *
 * Reuses `locateTargets` rather than a bare `includes()` loop so the scoring here
 * is the same non-overlapping, case-insensitive match the annotated-output
 * renderer already uses — two different answers to "did this token appear" would
 * be a bug waiting to happen.
 */
export function scoreOutput(output: string, verify: string[]): VerifyScore {
  const targets = buildTargets(verify);
  const total = targets.length;
  if (!output.trim() || total === 0) {
    return { matched: 0, total, allMatched: false, missing: targets.map((t) => t.text) };
  }
  const { hits, missing } = locateTargets(output, targets);
  return {
    matched: hits.length,
    total,
    allMatched: missing.length === 0,
    missing: missing.map((t) => t.text),
  };
}

/**
 * Fold a new paste into the existing record.
 *
 * `attempts` counts *distinct* pastes: re-recording the identical text (a
 * re-render, a reload, a stray keystroke that lands back on the same string)
 * must not inflate it, or the number stops meaning "times they tried". Effort is
 * measured and never rewarded — a step solved on the fifth attempt shows real
 * troubleshooting, and nothing in the UI may score it lower for that.
 *
 * `verified` is sticky: once a student has produced matching output, a later
 * empty or partial paste does not un-verify the step. The verified moment
 * happened, and its hash records what proved it.
 */
export function foldAttempt(
  prev: StepEvidence | undefined,
  next: {
    courseId: string;
    taskId: string;
    stepId: string;
    score: VerifyScore;
    outputSha256: string;
    at: number;
  }
): StepEvidence {
  const isNewAttempt = prev?.outputSha256 !== next.outputSha256;
  const nowVerified = next.score.allMatched;
  const wasVerified = prev?.verified ?? false;

  return {
    courseId: next.courseId,
    taskId: next.taskId,
    stepId: next.stepId,
    verified: wasVerified || nowVerified,
    method: wasVerified || nowVerified ? 'verified-output' : prev?.method ?? 'self-attested',
    // Keep the best score seen, so a partial re-paste doesn't shrink the record.
    matchedTokens: Math.max(prev?.matchedTokens ?? 0, next.score.matched),
    totalTokens: next.score.total,
    // The hash of the output that *verified* the step is the one worth keeping.
    outputSha256: nowVerified || !wasVerified ? next.outputSha256 : prev?.outputSha256,
    attempts: (prev?.attempts ?? 0) + (isNewAttempt ? 1 : 0),
    firstAttemptAt: prev?.firstAttemptAt ?? next.at,
    verifiedAt: wasVerified ? prev?.verifiedAt : nowVerified ? next.at : undefined,
  };
}

/**
 * The record written when a step is marked complete without matching output —
 * the honest default. Never downgrades an existing verified record: a student
 * who verified and then re-ticked the box has still verified it.
 */
export function selfAttested(
  prev: StepEvidence | undefined,
  next: { courseId: string; taskId: string; stepId: string; totalTokens: number; at: number }
): StepEvidence {
  if (prev?.verified) return prev;
  return {
    courseId: next.courseId,
    taskId: next.taskId,
    stepId: next.stepId,
    verified: false,
    method: 'self-attested',
    matchedTokens: prev?.matchedTokens ?? 0,
    totalTokens: next.totalTokens,
    outputSha256: prev?.outputSha256,
    attempts: prev?.attempts ?? 0,
    firstAttemptAt: prev?.firstAttemptAt ?? next.at,
    verifiedAt: undefined,
  };
}

/** How many of a task's steps can be verified at all (i.e. carry `verify`). */
export function verifiableSteps(steps: Step[]): Step[] {
  return steps.filter((s) => (s.verify?.length ?? 0) > 0);
}

/** Human label for a method, used in the UI and the portfolio. */
export function methodLabel(method: EvidenceMethod): string {
  switch (method) {
    case 'verified-output':
      return 'Verified from output';
    default:
      return 'Self-attested';
  }
}
