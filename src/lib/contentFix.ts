// contentFix.ts — versioned content fixes (R121).
//
// WHAT THIS IS. A student reports a typo, a wrong flag, a sentence nobody can follow. The fix
// should not wait for a deploy, and it should not fork the course: an edited copy stops
// receiving the built-in course's later updates. So a fix is a small, append-only record laid
// OVER the course: "in this task, this step, this field, the text was X and is now Y". The
// effective course is the course with its live fixes applied. The code stays the source of
// truth: a live fix is folded into it by a developer (the bundle says exactly where) and then
// marked In code.
//
// THE APPLY RULE, per change, in revision order:
//   the text now is `before`  → set `after`        (applied)
//   the text now is `after`   → nothing to do      (noop: a fix already folded into the code is harmless)
//   anything else             → skip it            (stale: the text changed underneath it; code wins)
// A REVERT is a new entry carrying the inverse changes, so history is never rewritten; it is
// allowed only while each `after` is still the current text. A FOLD names the fixes now in the
// code and changes nothing.
//
// THE VERSION of a course is `{docVersion}.{revision}` (`contentVersion.ts`): the document's own
// version, and the ledger's counter, which goes up by one for every fix, revert and fold. The
// database assigns it; a report stamps the one the student saw.
//
// WHAT A FIX MAY TOUCH: the words (titles, sentences, commands, outputs, lists of actions). Adding
// or removing steps, gates, ids and forms stays a code change, by design: progress keys on the
// ids, and the structure is what the tests hold. A fix is held to the same reading budgets as the
// seeds and to the rule that every self-check token appears in the output shown, so a fix that is
// saved cannot fail the suite on the day it is folded into the code.
//
// Pure: no clock, no store, no network. The repos hand it entries; the pages hand it the time.

import type { Course, Step } from './types';
import { contentVersion } from './contentVersion';
import { READING_BUDGET, prose, words } from './readingBudget';

export const FIX_SCHEMA = 'capstone-content-fix/1';
export const FIX_BUNDLE_SCHEMA = 'capstone-content-fixes/1';
export const SUMMARY_MAX = 200;
export const MAX_CHANGES = 24;

export type FixKind = 'fix' | 'revert' | 'fold';

/** One field of one task or step: the text the author saw, and the text it becomes. Lists are one item per line. */
export interface FixChange {
  taskId: string;
  /** Absent: a field of the task itself. */
  stepId?: string;
  /** `title`, `instruction`, `commands.0.explain`, … (see `patchableFields`). */
  field: string;
  before: string;
  after: string;
}

/** One entry of a course's ledger, as stored and as published (`content/schemas/content-fix.schema.json`). */
export interface ContentFix {
  schema: typeof FIX_SCHEMA;
  id: string;
  courseId: string;
  /** 1, 2, 3 … per course; assigned by the database, never by the client. */
  revision: number;
  kind: FixKind;
  summary: string;
  /** Empty for a fold. For a revert, the inverse of the fix it undoes. */
  changes: FixChange[];
  /** The reports this entry answers. */
  issueIds: string[];
  /** A revert: the revision it undoes. */
  reverts: number | null;
  /** A fold: the revisions now in the code. */
  folds: number[];
  /** A fold: where they shipped, in the admin's words (a commit, a deploy). */
  foldedIn: string;
  /** The document version this entry was made on top of. */
  docVersion: number;
  /** Who, by name: a name, never an account. */
  by: string;
  /** ISO 8601. */
  at: string;
}

/** What a person decides; the store adds the id, the revision, the version, who and when. */
export interface FixDraft {
  kind: FixKind;
  summary: string;
  changes: FixChange[];
  issueIds: string[];
  reverts: number | null;
  folds: number[];
  foldedIn: string;
}

type Target = { taskId: string; stepId?: string };

/** A course nobody has fixed: one frozen array, so "no fixes" is the same value everywhere and a cache can compare it by identity. */
export const NO_FIXES: readonly ContentFix[] = Object.freeze([]);

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const KINDS: readonly FixKind[] = ['fix', 'revert', 'fold'];

/** One change as stored (a jsonb column, a localStorage blob): well-formed or null. */
export function asFixChange(v: unknown): FixChange | null {
  if (!isObj(v)) return null;
  const { taskId, stepId, field, before, after } = v;
  if (typeof taskId !== 'string' || typeof field !== 'string' || typeof before !== 'string' || typeof after !== 'string') return null;
  if (stepId !== undefined && stepId !== null && typeof stepId !== 'string') return null;
  return { taskId, ...(typeof stepId === 'string' ? { stepId } : {}), field, before, after };
}

/** An entry as stored on this device: well-formed or null. A malformed one is dropped, never allowed to take the course down. */
export function asContentFix(v: unknown): ContentFix | null {
  if (!isObj(v)) return null;
  if (typeof v.id !== 'string' || typeof v.courseId !== 'string' || !Number.isInteger(v.revision) || (v.revision as number) < 1) return null;
  if (!KINDS.includes(v.kind as FixKind)) return null;
  const nums = (x: unknown) => (Array.isArray(x) ? x.filter((n): n is number => Number.isInteger(n)) : []);
  return {
    schema: FIX_SCHEMA,
    id: v.id,
    courseId: v.courseId,
    revision: v.revision as number,
    kind: v.kind as FixKind,
    summary: typeof v.summary === 'string' ? v.summary : '',
    changes: (Array.isArray(v.changes) ? v.changes : []).map(asFixChange).filter((c): c is FixChange => c !== null),
    issueIds: Array.isArray(v.issueIds) ? v.issueIds.filter((i): i is string => typeof i === 'string') : [],
    reverts: Number.isInteger(v.reverts) ? (v.reverts as number) : null,
    folds: nums(v.folds),
    foldedIn: typeof v.foldedIn === 'string' ? v.foldedIn : '',
    docVersion: Number.isInteger(v.docVersion) && (v.docVersion as number) > 0 ? (v.docVersion as number) : 1,
    by: typeof v.by === 'string' ? v.by : '',
    at: typeof v.at === 'string' ? v.at : '',
  };
}

// ── what may be changed ─────────────────────────────────────────────────────

export type FieldShape = 'line' | 'text' | 'list';

interface Budget {
  metric: 'prose' | 'words';
  /** Fewer than this many. */
  lessThan: number;
}

export interface FieldSpec {
  key: string;
  label: string;
  scope: 'task' | 'step';
  /** One line; free text; or one item per line. */
  shape: FieldShape;
  /** Characters, over the whole field. */
  max: number;
  /** A required field is replaced, never emptied. */
  required?: boolean;
  /** The reading budget of the field, as `content-integrity.test.ts` holds the seeds to it. */
  budgets?: readonly Budget[];
  /** The budget of each item of a list. */
  itemBudgets?: readonly Budget[];
  /** Lab-access placeholders are checked in this field. */
  placeholders?: boolean;
}

const atMost = (n: number): Budget['lessThan'] => n + 1;

const TASK_FIELDS: readonly FieldSpec[] = [
  { key: 'title', label: 'Task title', scope: 'task', shape: 'line', max: 120, required: true },
  { key: 'objective', label: 'Objective', scope: 'task', shape: 'text', max: 300, required: true, budgets: [{ metric: 'prose', lessThan: atMost(READING_BUDGET.taskObjectiveProse) }] },
  { key: 'definitionOfDone', label: 'Definition of done', scope: 'task', shape: 'list', max: 1500 },
  { key: 'prerequisites', label: 'What to have ready', scope: 'task', shape: 'list', max: 1000 },
];

const STEP_FIELDS: readonly FieldSpec[] = [
  { key: 'title', label: 'Step title', scope: 'step', shape: 'line', max: 120, required: true },
  { key: 'description', label: 'Description', scope: 'step', shape: 'text', max: 600, required: true, budgets: [{ metric: 'prose', lessThan: READING_BUDGET.descriptionProse }] },
  {
    key: 'instruction',
    label: 'Instruction',
    scope: 'step',
    shape: 'text',
    max: 500,
    placeholders: true,
    budgets: [
      { metric: 'prose', lessThan: atMost(READING_BUDGET.instructionProse) },
      { metric: 'words', lessThan: READING_BUDGET.longWords },
    ],
  },
  { key: 'instructionList', label: 'Actions', scope: 'step', shape: 'list', max: 2000, placeholders: true, itemBudgets: [{ metric: 'prose', lessThan: atMost(READING_BUDGET.actionProse) }] },
  { key: 'command', label: 'Command', scope: 'step', shape: 'text', max: 1500 },
  { key: 'commandExplanation', label: 'What the command does', scope: 'step', shape: 'text', max: 800 },
  { key: 'expectedOutput', label: 'Expected output', scope: 'step', shape: 'text', max: 4000, placeholders: true },
  { key: 'outputExplanation', label: 'How to read the output', scope: 'step', shape: 'text', max: 1000 },
  { key: 'whatItMeans', label: 'What it means', scope: 'step', shape: 'text', max: 600, required: true, budgets: [{ metric: 'words', lessThan: READING_BUDGET.longWords }] },
];

/** `{n}` is the 1-based position of the command in the step. */
const COMMAND_FIELDS = {
  cmd: { label: 'Command {n}', shape: 'text', max: 4000 },
  explain: { label: 'What command {n} does', shape: 'text', max: 800, budgets: [{ metric: 'prose', lessThan: READING_BUDGET.explainProse }] },
  sample: { label: 'What command {n} prints', shape: 'text', max: 4000 },
} as const satisfies Record<string, Omit<FieldSpec, 'key' | 'scope'>>;

const COMMAND_FIELD = /^commands\.(\d+)\.(cmd|explain|sample)$/;

/** The rules of one field, or null when a fix may not touch it. */
export function fieldSpec(field: string, scope: 'task' | 'step'): FieldSpec | null {
  if (scope === 'task') return TASK_FIELDS.find((f) => f.key === field) ?? null;
  const m = COMMAND_FIELD.exec(field);
  if (m) {
    const base: Omit<FieldSpec, 'key' | 'scope'> = COMMAND_FIELDS[m[2] as keyof typeof COMMAND_FIELDS];
    return { ...base, key: field, scope: 'step', label: base.label.replace('{n}', String(Number(m[1]) + 1)) };
  }
  return STEP_FIELDS.find((f) => f.key === field) ?? null;
}

// ── reading and writing a field ─────────────────────────────────────────────

interface Holder {
  obj: object;
  key: string;
  spec: FieldSpec;
}

function holderOf(course: Course, t: Target, field: string): Holder | null {
  const task = course.tasks.find((x) => x.id === t.taskId);
  if (!task) return null;
  if (t.stepId === undefined) {
    const spec = fieldSpec(field, 'task');
    return spec ? { obj: task, key: field, spec } : null;
  }
  const step = task.steps.find((s) => s.id === t.stepId);
  if (!step) return null;
  const spec = fieldSpec(field, 'step');
  if (!spec) return null;
  const m = COMMAND_FIELD.exec(field);
  if (!m) return { obj: step, key: field, spec };
  const cmd = step.commands?.[Number(m[1])];
  return cmd ? { obj: cmd, key: m[2], spec } : null;
}

function readValue(h: Holder): string | null {
  const v = (h.obj as Record<string, unknown>)[h.key];
  if (v === undefined) return '';
  if (h.spec.shape === 'list') return Array.isArray(v) && v.every((i) => typeof i === 'string' && !i.includes('\n')) ? v.join('\n') : null;
  return typeof v === 'string' ? v : null;
}

/** The text of a field as a person edits it ("" when the field is absent), or null when the target or the field is not one a fix may touch. */
export function readField(course: Course, target: Target, field: string): string | null {
  const h = holderOf(course, target, field);
  return h ? readValue(h) : null;
}

function withValue<T extends object>(obj: T, key: string, spec: FieldSpec, value: string): T {
  const next = { ...obj } as Record<string, unknown>;
  if (value === '' && !spec.required) delete next[key];
  else next[key] = spec.shape === 'list' ? value.split('\n') : value;
  return next as T;
}

/** The course with one field set, sharing every object it did not touch. The caller has read the field first. */
function writeField(course: Course, target: Target, field: string, value: string): Course {
  const spec = fieldSpec(field, target.stepId === undefined ? 'task' : 'step');
  if (!spec) return course;
  const m = COMMAND_FIELD.exec(field);
  const tasks = course.tasks.map((t) => {
    if (t.id !== target.taskId) return t;
    if (target.stepId === undefined) return withValue(t, field, spec, value);
    return {
      ...t,
      steps: t.steps.map((s) => {
        if (s.id !== target.stepId) return s;
        if (!m) return withValue(s, field, spec, value);
        const at = Number(m[1]);
        return { ...s, commands: s.commands?.map((c, i) => (i === at ? withValue(c, m[2], spec, value) : c)) };
      }),
    };
  });
  return { ...course, tasks };
}

// ── applying a ledger ───────────────────────────────────────────────────────

export type ChangeOutcome = 'applied' | 'noop' | 'stale' | 'missing';

/** One change against the course as it stands: the apply rule. */
export function applyChange(course: Course, c: FixChange): { course: Course; outcome: ChangeOutcome } {
  const current = readField(course, c, c.field);
  if (current === null) return { course, outcome: 'missing' };
  if (current === c.before && c.before !== c.after) return { course: writeField(course, c, c.field, c.after), outcome: 'applied' };
  if (current === c.after) return { course, outcome: 'noop' };
  return { course, outcome: 'stale' };
}

export const sortedFixes = (fixes: readonly ContentFix[]): ContentFix[] => [...fixes].sort((a, b) => a.revision - b.revision);

/** The newest revision, 0 for a course nobody has fixed. */
export const effectiveRevision = (fixes: readonly ContentFix[]): number => fixes.reduce((n, f) => Math.max(n, f.revision), 0);

export interface Applied {
  /** The course with the live fixes applied and `revision` set; the same object when there are no entries. */
  course: Course;
  revision: number;
  /** What happened to each change of each entry, by revision. */
  outcomes: Map<number, ChangeOutcome[]>;
}

export function applyFixes(course: Course, fixes: readonly ContentFix[]): Applied {
  const outcomes = new Map<number, ChangeOutcome[]>();
  if (fixes.length === 0) return { course, revision: 0, outcomes };
  let current = course;
  for (const fix of sortedFixes(fixes)) {
    const out: ChangeOutcome[] = [];
    for (const c of fix.changes) {
      const r = applyChange(current, c);
      current = r.course;
      out.push(r.outcome);
    }
    outcomes.set(fix.revision, out);
  }
  const revision = effectiveRevision(fixes);
  return { course: { ...current, revision }, revision, outcomes };
}

/** "1.7": what a report stamps and what the ledger prints. */
export const currentVersion = (course: Pick<Course, 'version' | 'revision'>): string => contentVersion(course.version, course.revision);
export const fixVersion = (fix: Pick<ContentFix, 'docVersion' | 'revision'>): string => contentVersion(fix.docVersion, fix.revision);

// ── the ledger: where each fix stands ───────────────────────────────────────

/** Live: in force. Reverted: undone by a later entry. In code: folded into the seed. Stale: the text changed underneath it, so nothing of it applies. */
export type FixState = 'live' | 'reverted' | 'in_code' | 'stale';

export const FIX_STATE_LABEL: Record<FixState, string> = { live: 'Live', reverted: 'Reverted', in_code: 'In code', stale: 'Stale' };
export const FIX_KIND_LABEL: Record<FixKind, string> = { fix: 'Fix', revert: 'Revert', fold: 'Marked in code' };

export interface LedgerRow {
  fix: ContentFix;
  /** Fixes only; a revert or a fold is a record, not a state. */
  state: FixState | null;
  /** Changes that did not apply because the text no longer matches. */
  skipped: number;
  canRevert: boolean;
  /** The later entry that changed the same text again, so a revert must wait for it. */
  blockedBy: number | null;
}

const touchKey = (c: Target & { field: string }) => `${c.taskId}\u0000${c.stepId ?? ''}\u0000${c.field}`;

/**
 * Every entry of a course's ledger with its state, oldest first. `base` is the course WITHOUT its
 * fixes (the built-in course, or the edited copy), because the ledger is replayed over it.
 */
export function ledger(base: Course, fixes: readonly ContentFix[]): LedgerRow[] {
  const ordered = sortedFixes(fixes);
  const { course: final, outcomes } = applyFixes(base, ordered);
  const reverted = new Set(ordered.filter((f) => f.kind === 'revert' && f.reverts !== null).map((f) => f.reverts as number));
  const folded = new Set(ordered.filter((f) => f.kind === 'fold').flatMap((f) => f.folds));
  return ordered.map((fix): LedgerRow => {
    if (fix.kind !== 'fix') return { fix, state: null, skipped: 0, canRevert: false, blockedBy: null };
    const out = outcomes.get(fix.revision) ?? [];
    const skipped = out.filter((o) => o === 'stale' || o === 'missing').length;
    const state: FixState = reverted.has(fix.revision) ? 'reverted' : folded.has(fix.revision) ? 'in_code' : fix.changes.length > 0 && skipped === fix.changes.length ? 'stale' : 'live';
    let canRevert = false;
    let blockedBy: number | null = null;
    if (state === 'live' && skipped === 0) {
      const unmet = fix.changes.filter((c) => readField(final, c, c.field) !== c.after);
      canRevert = unmet.length === 0;
      if (!canRevert) {
        const keys = new Set(unmet.map(touchKey));
        blockedBy = ordered.find((o) => o.revision > fix.revision && o.kind !== 'fold' && o.changes.some((c) => keys.has(touchKey(c))))?.revision ?? null;
      }
    }
    return { fix, state, skipped, canRevert, blockedBy };
  });
}

export interface LedgerSummary {
  live: number;
  reverted: number;
  inCode: number;
  stale: number;
}

export function ledgerSummary(rows: readonly LedgerRow[]): LedgerSummary {
  const s: LedgerSummary = { live: 0, reverted: 0, inCode: 0, stale: 0 };
  for (const r of rows) {
    if (r.state === 'live') s.live++;
    else if (r.state === 'reverted') s.reverted++;
    else if (r.state === 'in_code') s.inCode++;
    else if (r.state === 'stale') s.stale++;
  }
  return s;
}

// ── making entries ──────────────────────────────────────────────────────────

/** The inverse of a fix, as a new entry: history is never rewritten. */
export function revertDraft(fix: ContentFix): FixDraft {
  return {
    kind: 'revert',
    summary: `Revert revision ${fix.revision}: ${fix.summary}`.slice(0, SUMMARY_MAX),
    changes: [...fix.changes].reverse().map((c) => ({ ...c, before: c.after, after: c.before })),
    issueIds: [],
    reverts: fix.revision,
    folds: [],
    foldedIn: '',
  };
}

/** Bookkeeping: these revisions are now in the code. Changes no text. */
export function foldDraft(revisions: readonly number[], foldedIn: string): FixDraft {
  return {
    kind: 'fold',
    summary: `In code: revision${revisions.length === 1 ? '' : 's'} ${[...revisions].sort((a, b) => a - b).join(', ')}`.slice(0, SUMMARY_MAX),
    changes: [],
    issueIds: [],
    reverts: null,
    folds: [...revisions].sort((a, b) => a - b),
    foldedIn: foldedIn.trim().slice(0, 200),
  };
}

export function fixDraft(summary: string, changes: readonly FixChange[], issueIds: readonly string[]): FixDraft {
  return { kind: 'fix', summary: summary.trim(), changes: [...changes], issueIds: [...issueIds], reverts: null, folds: [], foldedIn: '' };
}

/** The entry as stored: a draft plus what only the store knows. */
export function newFix(courseId: string, draft: FixDraft, stamp: { id: string; revision: number; docVersion: number; by: string; at: string }): ContentFix {
  return { schema: FIX_SCHEMA, id: stamp.id, courseId, revision: stamp.revision, docVersion: stamp.docVersion, by: stamp.by, at: stamp.at, ...draft };
}

// ── what a panel offers ─────────────────────────────────────────────────────

export interface FieldView {
  field: string;
  label: string;
  shape: FieldShape;
  value: string;
  max: number;
}

/** The fields of a task or a step that hold text now, with that text: what a panel prefills. */
export function patchableFields(course: Course, target: Target): FieldView[] {
  const task = course.tasks.find((t) => t.id === target.taskId);
  if (!task) return [];
  const names: string[] = [];
  if (target.stepId === undefined) names.push(...TASK_FIELDS.map((f) => f.key));
  else {
    const step = task.steps.find((s) => s.id === target.stepId);
    if (!step) return [];
    // A step shows its `commands` list, or else its single `command` and that command's explanation, never both
    // (`StepHow.tsx`): the panel offers the text a student can see, not text nobody reads.
    const listed = (step.commands?.length ?? 0) > 0;
    for (const f of STEP_FIELDS) {
      if (f.key === 'command' && listed) step.commands!.forEach((_, i) => names.push(`commands.${i}.cmd`, `commands.${i}.explain`, `commands.${i}.sample`));
      else if (f.key !== 'command' && f.key !== 'commandExplanation') names.push(f.key);
      else if (!listed) names.push(f.key);
    }
  }
  const scope = target.stepId === undefined ? 'task' : 'step';
  const out: FieldView[] = [];
  for (const field of names) {
    const value = readField(course, target, field);
    const spec = fieldSpec(field, scope);
    if (value === null || value === '' || !spec) continue;
    out.push({ field, label: spec.label, shape: spec.shape, value, max: spec.max });
  }
  return out;
}

/** The changes a person's edits make: one per field whose text differs from what it was. Unchanged fields make none. */
export function changesFrom(course: Course, target: Target, edited: Readonly<Record<string, string>>): FixChange[] {
  const out: FixChange[] = [];
  for (const [field, after] of Object.entries(edited)) {
    const before = readField(course, target, field);
    if (before === null || before === after) continue;
    out.push({ taskId: target.taskId, ...(target.stepId !== undefined ? { stepId: target.stepId } : {}), field, before, after });
  }
  return out;
}

/** The first line of a fix, by what the reporter said was wrong: the admin edits it before saving. */
export const FIX_SUMMARY: Record<string, string> = {
  unclear: 'Clarify the wording',
  broken: 'Correct a mistake',
  outdated: 'Update outdated text',
  environment: 'Correct the text',
  question: 'Clarify the wording',
};

/** The label of a field for a ledger row, where the course may no longer hold the field. */
export function fieldLabel(field: string, scope: 'task' | 'step'): string {
  return fieldSpec(field, scope)?.label ?? field;
}

// ── saving: what a fix may not do ───────────────────────────────────────────

/** The words the checks say. Plain and impersonal; the panel puts the field's name in front. */
export const FIX_COPY = {
  nothing: 'Nothing has changed.',
  many: 'Too many changes in one fix: {max} at most. Save in parts.',
  field: 'This field cannot be changed here.',
  missing: 'The task or the step is no longer in the course.',
  stale: 'This text changed after the panel opened. Close the panel and open it again.',
  same: 'The text is the same as before.',
  twice: 'The same field appears twice.',
  empty: 'A field cannot be emptied here. Text is replaced, not removed.',
  chars: 'Plain text only: no control characters.',
  long: 'Too long: {max} characters at most.',
  line: 'One line only.',
  blank: 'One item per line: no blank lines.',
  budget: 'Longer than the course allows: {max} words at most.',
  verify: 'The self-check looks for “{token}” in the output shown. Keep it in the expected output or in a sample.',
  placeholder: '“{token}” is not a lab-access token.',
  summary: 'Say what changed and why, in {max} characters at most.',
} as const;

export type FixProblemCode = keyof typeof FIX_COPY;

export interface FixProblem {
  code: FixProblemCode;
  /** Which change, or null for the fix as a whole. */
  index: number | null;
  field: string | null;
  message: string;
}

const fill = (template: string, vars: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (whole, k: string) => vars[k] ?? whole);

// Tab and newline are text; every other control character is not.
const CONTROL = /[\u0000-\u0008\u000B-\u001F\u007F]/;
const PLACEHOLDER = /<[a-z][a-z0-9_-]*>/g;
const placeholdersOf = (text: string): string[] => (text.match(PLACEHOLDER) ?? []).filter((m) => m.includes('-'));

const measure = (b: Budget, s: string): number => (b.metric === 'prose' ? prose(s) : words(s));

/** The first budget a text breaks AND makes worse: a typo fixed in a sentence that is already long is not held to the limit it already broke. */
function brokenBudget(budgets: readonly Budget[] | undefined, before: string, after: string): Budget | null {
  for (const b of budgets ?? []) if (measure(b, after) >= b.lessThan && measure(b, after) > measure(b, before)) return b;
  return null;
}

function brokenItemBudget(budgets: readonly Budget[] | undefined, before: string, after: string): Budget | null {
  const was = before.split('\n').filter(Boolean);
  for (const b of budgets ?? []) {
    const worst = was.reduce((n, item) => Math.max(n, measure(b, item)), 0);
    if (after.split('\n').some((item) => measure(b, item) >= b.lessThan && measure(b, item) > worst)) return b;
  }
  return null;
}

const shownOutput = (step: Step): string =>
  [step.expectedOutput ?? '', ...(step.commands ?? []).map((c) => c.sample ?? '')]
    .join('\n')
    .toLowerCase();

/**
 * The self-check tokens of a step that appear nowhere in the output it shows (`content-integrity.test.ts`):
 * the student would be asked to match something nobody showed them.
 */
export function missingVerifyTokens(step: Step): string[] {
  if (!step.verify?.length) return [];
  const shown = shownOutput(step);
  if (!shown.trim()) return [];
  return step.verify.filter((t) => !shown.includes(t.toLowerCase()));
}

/** Every reason these changes may not be saved on this course, empty when they may. `labTokens` are the lab-access placeholders the course fills in. */
export function validateChanges(course: Course, changes: readonly FixChange[], opts: { labTokens?: ReadonlySet<string> } = {}): FixProblem[] {
  const problems: FixProblem[] = [];
  const add = (code: FixProblemCode, index: number | null, field: string | null, vars: Record<string, string> = {}) =>
    problems.push({ code, index, field, message: fill(FIX_COPY[code], vars) });

  if (changes.length === 0) {
    add('nothing', null, null);
    return problems;
  }
  if (changes.length > MAX_CHANGES) add('many', null, null, { max: String(MAX_CHANGES) });

  const seen = new Set<string>();
  changes.forEach((c, i) => {
    if (seen.has(touchKey(c))) return add('twice', i, c.field);
    seen.add(touchKey(c));
    const task = course.tasks.find((t) => t.id === c.taskId);
    if (!task || (c.stepId !== undefined && !task.steps.some((s) => s.id === c.stepId))) return add('missing', i, c.field);
    const h = holderOf(course, c, c.field);
    if (!h) return add('field', i, c.field);
    const current = readValue(h);
    if (current === null) return add('field', i, c.field);
    if (current !== c.before) return add('stale', i, c.field);
    if (c.after === c.before) return add('same', i, c.field);
    if (c.after.trim() === '') return add('empty', i, c.field);
    if (CONTROL.test(c.after)) return add('chars', i, c.field);
    // Like the budgets below: text already past the cap may be corrected, not lengthened.
    if (c.after.length > h.spec.max && c.after.length > c.before.length) return add('long', i, c.field, { max: String(h.spec.max) });
    if (h.spec.shape === 'line' && c.after.includes('\n')) return add('line', i, c.field);
    if (h.spec.shape === 'list' && c.after.split('\n').some((l) => l.trim() === '')) return add('blank', i, c.field);
    const over = h.spec.shape === 'list' ? brokenItemBudget(h.spec.itemBudgets, c.before, c.after) : brokenBudget(h.spec.budgets, c.before, c.after);
    if (over) return add('budget', i, c.field, { max: String(over.lessThan - 1) });
    if (h.spec.placeholders && opts.labTokens) {
      const had = new Set(placeholdersOf(c.before));
      const fresh = placeholdersOf(c.after).find((p) => !had.has(p) && !opts.labTokens!.has(p));
      if (fresh) return add('placeholder', i, c.field, { token: fresh });
    }
  });
  if (problems.length > 0) return problems;

  // The self-check, on the steps these changes touch: a token that was shown must still be shown.
  let next = course;
  for (const c of changes) next = applyChange(next, c).course;
  const steps = new Set(changes.filter((c) => c.stepId !== undefined).map((c) => `${c.taskId}\u0000${c.stepId}`));
  for (const key of steps) {
    const [taskId, stepId] = key.split('\u0000');
    const find = (cr: Course) => cr.tasks.find((t) => t.id === taskId)?.steps.find((s) => s.id === stepId);
    const was = new Set(missingVerifyTokens(find(course)!));
    const token = missingVerifyTokens(find(next)!).find((t) => !was.has(t));
    if (token) {
      const index = changes.findIndex((c) => c.taskId === taskId && c.stepId === stepId && (c.field === 'expectedOutput' || c.field.endsWith('.sample')));
      add('verify', index < 0 ? null : index, index < 0 ? null : changes[index].field, { token });
    }
  }
  return problems;
}

/** A fix as a whole: its changes, and the one line that says what changed and why. */
export function validateFix(course: Course, draft: FixDraft, opts: { labTokens?: ReadonlySet<string> } = {}): FixProblem[] {
  const problems = validateChanges(course, draft.changes, opts);
  const summary = draft.summary.trim();
  if (!summary || summary.length > SUMMARY_MAX) problems.push({ code: 'summary', index: null, field: null, message: fill(FIX_COPY.summary, { max: String(SUMMARY_MAX) }) });
  return problems;
}

// ── the bundle: what a developer needs to fold a fix into the code ──────────

export interface FixBundle {
  schema: typeof FIX_BUNDLE_SCHEMA;
  courseId: string;
  courseTitle: string;
  /** The file the course is written in, where a live fix is folded; null for an edited copy. */
  seedFile: string | null;
  version: string;
  live: {
    revision: number;
    version: string;
    summary: string;
    changes: (FixChange & { taskTitle: string; stepTitle: string | null })[];
  }[];
  fixes: ContentFix[];
}

/** The ledger of one course, and the live fixes spelled out with the titles to search for. */
export function fixBundle(base: Course, fixes: readonly ContentFix[], opts: { seedFile?: string | null } = {}): FixBundle {
  const rows = ledger(base, fixes);
  const last = effectiveRevision(fixes);
  return {
    schema: FIX_BUNDLE_SCHEMA,
    courseId: base.id,
    courseTitle: base.title,
    seedFile: opts.seedFile ?? null,
    version: contentVersion(base.version, last),
    live: rows
      .filter((r) => r.state === 'live')
      .map((r) => ({
        revision: r.fix.revision,
        version: fixVersion(r.fix),
        summary: r.fix.summary,
        changes: r.fix.changes.map((c) => {
          const task = base.tasks.find((t) => t.id === c.taskId);
          return { ...c, taskTitle: task?.title ?? c.taskId, stepTitle: c.stepId !== undefined ? (task?.steps.find((s) => s.id === c.stepId)?.title ?? c.stepId) : null };
        }),
      })),
    fixes: sortedFixes(fixes),
  };
}
