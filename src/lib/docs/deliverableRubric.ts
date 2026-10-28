import { decisionFields } from './types';
import type { DeliverableData, DeliverableDef, FieldCheck, RubricCategory } from './types';
import type { Course, Step } from '../types';
import type { DeliverableReview, StepEvidence } from '../data/types';
import { emptyData } from './types';
import { withoutSeedRows } from './definitions';
import { dodProgress } from './dod';
import { conflictsOnForm, projectRecord, recordConflicts } from './projectRecord';

/**
 * The four-category rubric (R84): every deliverable in every course is judged
 * on the same four binary words. One pure module — the Expectations panel, the
 * submit gate, the frozen submission snapshot and the cohort page all call the
 * same functions, so a form can never look green in one place and red in
 * another.
 *
 *   Completeness — everything required is filled, and the definition-of-done
 *                  checks (judged on the student's OWN rows) pass.
 *   Correctness  — the automatic validators pass: patterns, allowed values,
 *                  keywords, minimum substance.
 *   Authenticity — the terminal work that produces this document is in the
 *                  evidence ledger as verified output (which, since R84,
 *                  implies the student's own stamp was in the paste).
 *   Consistency  — nothing forbidden appears, and the ledger's timestamps
 *                  tell a possible story.
 *
 * Same honesty rule as evidenceLedger.ts: these are strong self-verification
 * signals with an audit trail, not cryptographic proof.
 */

export const RUBRIC_CATEGORIES: { id: RubricCategory; label: string; generic: string }[] = [
  { id: 'completeness', label: 'Completeness', generic: 'Every required field is filled and every definition-of-done check passes.' },
  { id: 'correctness', label: 'Correctness', generic: 'Values have the right shape: addresses parse, names follow the convention, entries carry substance.' },
  { id: 'authenticity', label: 'Authenticity', generic: 'The terminal work behind this document is verified in your evidence ledger, stamped with your own mark.' },
  { id: 'consistency', label: 'Consistency', generic: 'Nothing contradicts: no forbidden values, no impossible timestamps, no value at odds with the team’s other documents.' },
];

export interface BundleItem {
  id: string;
  label: string;
  ok: boolean;
  /** What a passing value looks like — shown while failing. */
  hint?: string;
  /** R139: a record conflict's weight. `warn` is listed but does not fail its category. */
  severity?: 'error' | 'warn';
}

export interface CategoryResult {
  ok: boolean;
  items: BundleItem[];
  /** Rendered when the category has nothing to check — visible, never silent. */
  note?: string;
}

export interface BundleResult {
  categories: Record<RubricCategory, CategoryResult>;
  allGreen: boolean;
}

export interface BundleContext {
  /** The owner's step-evidence records, keyed `${taskId}::${stepId}`. */
  evidence: Record<string, StepEvidence>;
  /** Steps of this course that produce this deliverable (producesDeliverable). */
  steps: { step: Step; taskId: string }[];
  /** The week being judged (dod checks are due BY this week). */
  week: number;
  now?: number;
  /** R139: the team's other documents and the course's definitions, so Consistency
   *  can read the project record and list what this form contradicts. Optional:
   *  a frozen snapshot judges the form alone. */
  docs?: Record<string, DeliverableData>;
  defs?: DeliverableDef[];
}

/** The course's steps that feed one deliverable, by its file name. */
export function stepsProducing(course: Course, def: DeliverableDef): { step: Step; taskId: string }[] {
  const out: { step: Step; taskId: string }[] = [];
  for (const t of course.tasks) {
    for (const s of t.steps) {
      if (s.producesDeliverable === def.file) out.push({ step: s, taskId: t.id });
    }
  }
  return out;
}

const val = (data: DeliverableData, field: string) => (data.fields?.[field] ?? '').trim();

function checkValues(check: FieldCheck, data: DeliverableData): string[] {
  if (check.field !== undefined) return [val(data, check.field)];
  if (check.group && check.column) {
    return (data.groups?.[check.group] ?? []).map((r) => (r[check.column!] ?? '').trim());
  }
  return [];
}

/** One validator over one value. Empty values pass — presence is Completeness's job. */
export function passesCheck(check: FieldCheck, value: string): boolean {
  if (value === '') return true;
  const low = value.toLowerCase();
  switch (check.rule) {
    case 'pattern':
      try {
        return new RegExp(String(check.value)).test(value);
      } catch {
        return true; // a broken pattern must never lock a student out
      }
    case 'keyword':
      return (check.value as string[]).every((k) => low.includes(k.toLowerCase()));
    case 'forbidden':
      return !(check.value as string[]).some((k) => low.includes(k.toLowerCase()));
    case 'oneOf':
      return (check.value as string[]).includes(value);
    case 'minLength':
      return value.length >= Number(check.value);
  }
}

function runChecks(checks: FieldCheck[], data: DeliverableData): BundleItem[] {
  return checks.map((c, i) => ({
    id: `${c.field ?? `${c.group}.${c.column}`}:${c.rule}:${i}`,
    label: c.hint,
    hint: c.hint,
    ok: checkValues(c, data).every((v) => passesCheck(c, v)),
  }));
}

function requiredFields(def: DeliverableDef): { field: string; label: string }[] {
  const out: { field: string; label: string }[] = [];
  for (const s of def.sections) {
    if (s.kind === 'fields') for (const f of s.fields) if (f.required) out.push({ field: f.field, label: f.label });
    // R132: a decision block's choice is required; its questions are required as marked.
    if (s.kind === 'decision') for (const f of decisionFields(s.block)) if (f.required) out.push({ field: f.field, label: f.label });
  }
  return out;
}

export function evaluateBundle(def: DeliverableDef, data: DeliverableData | undefined, ctx: BundleContext): BundleResult {
  const d = data ?? emptyData();
  const own = withoutSeedRows(def, d);
  const checks = def.checks ?? [];
  const now = ctx.now ?? Date.now();

  // Completeness: required fields + dod, both on the student's own rows.
  const req = requiredFields(def).map((f) => ({
    id: `required:${f.field}`,
    label: `${f.label} is filled`,
    ok: val(d, f.field) !== '',
  }));
  const dod = dodProgress(def, d, ctx.week);
  const completeness: CategoryResult = {
    items: [
      ...req,
      ...(dod.total > 0 ? [{ id: 'dod', label: `Definition of done (${dod.met}/${dod.total})`, ok: dod.met === dod.total }] : []),
    ],
    ok: req.every((r) => r.ok) && dod.met === dod.total,
    ...(req.length === 0 && dod.total === 0 ? { note: 'No required fields or checks are defined for this form.' } : {}),
  };

  // Correctness: the positive validators.
  const positive = runChecks(checks.filter((c) => c.rule !== 'forbidden'), own);
  const correctness: CategoryResult = {
    items: positive,
    ok: positive.every((i) => i.ok),
    ...(positive.length === 0 ? { note: 'No automatic validators for this form — completeness and the ledger carry it.' } : {}),
  };

  // Authenticity: the producing steps' verifiable work is verified output.
  const verifiable = ctx.steps.filter(({ step }) => (step.verify?.length ?? 0) > 0);
  const authItems: BundleItem[] = verifiable.map(({ step, taskId }) => {
    const rec = ctx.evidence[`${taskId}::${step.id}`];
    return {
      id: `evidence:${step.id}`,
      label: `“${step.title}” verified against real output`,
      ok: !!rec && rec.verified && rec.method === 'verified-output',
    };
  });
  const authenticity: CategoryResult = {
    items: authItems,
    ok: authItems.every((i) => i.ok),
    ...(verifiable.length === 0
      ? { note: 'No terminal checks feed this form — its truth rests on the definition-of-done and peer review.' }
      : {}),
  };

  // Consistency: forbidden values + timestamp sanity across the ledger records.
  const forbidden = runChecks(checks.filter((c) => c.rule === 'forbidden'), own);
  const timeSane = Object.values(ctx.evidence).every((r) => {
    const first = r.firstAttemptAt ?? 0;
    const done = r.verifiedAt ?? first;
    return first <= done + 1 && done <= now + 60_000;
  });
  // R139: what this form contradicts in the team's record — one address on two
  // machines, a port assigned twice, a prefix overlapping another. Read only when
  // the caller hands the other documents in; a snapshot judges the form alone.
  const conflicts: BundleItem[] = [];
  if (ctx.docs && ctx.defs) {
    const own = conflictsOnForm(recordConflicts(projectRecord({ ...ctx.docs, [def.id]: d }, ctx.defs)), def.id);
    for (const c of own) conflicts.push({ id: c.id, label: c.message, hint: c.message, ok: false, severity: c.severity });
    if (own.length === 0) conflicts.push({ id: 'record', label: 'Nothing here contradicts the team’s other documents', ok: true });
  }
  const consistency: CategoryResult = {
    items: [
      ...forbidden,
      { id: 'timestamps', label: 'Ledger timestamps tell a possible story', ok: timeSane },
      ...conflicts,
    ],
    // A warning is listed, never a block: only a contradiction (an error) fails the category.
    ok: forbidden.every((i) => i.ok) && timeSane && conflicts.every((i) => i.ok || i.severity === 'warn'),
  };

  const categories = { completeness, correctness, authenticity, consistency };
  return { categories, allGreen: Object.values(categories).every((c) => c.ok) };
}

// ── Verdicts ─────────────────────────────────────────────────────────────────

export type Verdict = 'pending_review' | 'pass' | 'fail' | 'platform_pass' | 'platform_fail' | 'overridden_pass' | 'overridden_fail';

export interface SubmissionLike {
  /** The four category booleans FROZEN at submission time. */
  categories: Record<RubricCategory, boolean>;
}

/**
 * The grading model (spec §11), derived — never stored, so it cannot desync:
 * both peers confirm → pass; both reject → fail; a split or fewer than two
 * eligible reviewers → the frozen automatic checks decide, labelled platform;
 * the instructor's review verdict (their override) outranks everything.
 */
export function verdictOf(
  submission: SubmissionLike,
  peerConfirms: boolean[],
  eligibleReviewers: number,
  instructorReview?: DeliverableReview['status']
): Verdict {
  if (instructorReview === 'approved') return 'overridden_pass';
  if (instructorReview === 'revise') return 'overridden_fail';
  const auto = Object.values(submission.categories).every(Boolean);
  if (eligibleReviewers < 2) return auto ? 'platform_pass' : 'platform_fail';
  if (peerConfirms.length < 2) return 'pending_review';
  const yes = peerConfirms.filter(Boolean).length;
  if (yes === 2) return 'pass';
  if (yes === 0) return 'fail';
  return auto ? 'platform_pass' : 'platform_fail';
}
