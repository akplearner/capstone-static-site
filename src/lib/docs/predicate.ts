/**
 * Definition-of-Done checks, and computed form columns, as DATA.
 *
 * Both used to be TypeScript functions living inside the deliverable modules.
 * That reads well and is completely unexportable: `content/courses/*.json` held
 * a `{"$fn": …}` marker wherever one stood — 128 of them — so a course document
 * did not contain everything the app renders. An instructor could not edit a
 * check, a business instance could not change one, and the JSON could not be
 * the source the app loads from.
 *
 * So they are a small vocabulary instead. It is deliberately not a general
 * expression language: it is exactly the shapes the 125 real checks use, which
 * turned out to be far more regular than their count suggested — a field is
 * filled, several fields are all filled, a table has at least N rows, at least N
 * of its rows have these columns filled, every row satisfies something, some row
 * does. Anything a future check needs that this cannot say is a signal to add
 * one named case here, not to reach for `eval`.
 *
 * The runtime interface is unchanged: `dod.ts` used to call `check.test(data)`
 * and now calls `evaluate(check.when, data)`, so the gate maths, the cohort
 * dashboard and the rubric did not move.
 */
import { riskLevel } from '../grc/templates';
import type { DeliverableData } from './types';

/** A row of a repeating form group: column key to typed value. */
export type FormRow = Record<string, string>;

/** A test applied to one row of a table. */
export type RowPredicate =
  | { filled: string[] }
  | { column: string; equals: string }
  | { column: string; matches: string }
  | { all: RowPredicate[] }
  | { any: RowPredicate[] };

/** A test applied to a whole deliverable's data. */
export type Predicate =
  | { all: Predicate[] }
  | { any: Predicate[] }
  | { not: Predicate }
  /** The named fields are all non-empty. One field is the common case. */
  | { fields: string[] }
  | { field: string; equals: string }
  /** `matches` is a regex SOURCE, with optional flags — a RegExp is not JSON. */
  | { field: string; matches: string; flags?: string }
  | { field: string; atLeast: number }
  | {
      group: string;
      /** How many rows must qualify. Defaults to 1 when a row test is given. */
      atLeast?: number;
      /** Only rows satisfying this are counted. */
      where?: RowPredicate;
      /** Every row must satisfy this (and the group must be non-empty). */
      every?: RowPredicate;
      /** At least one row must satisfy this. */
      some?: RowPredicate;
      /** Count DISTINCT values of this column among the qualifying rows. */
      distinct?: string;
    };

const nonEmpty = (v: string | undefined): boolean => !!v && v.trim() !== '';

export function evaluateRow(p: RowPredicate, row: FormRow): boolean {
  if ('filled' in p) return p.filled.every((c) => nonEmpty(row[c]));
  if ('all' in p) return p.all.every((x) => evaluateRow(x, row));
  if ('any' in p) return p.any.some((x) => evaluateRow(x, row));
  if ('equals' in p) return (row[p.column] ?? '') === p.equals;
  return new RegExp(p.matches, 'i').test(row[p.column] ?? '');
}

export function evaluate(p: Predicate, d: DeliverableData): boolean {
  if ('all' in p) return p.all.every((x) => evaluate(x, d));
  if ('any' in p) return p.any.some((x) => evaluate(x, d));
  if ('not' in p) return !evaluate(p.not, d);
  if ('fields' in p) return p.fields.every((f) => nonEmpty(d.fields[f]));
  if ('field' in p) {
    const v = d.fields[p.field] ?? '';
    if ('equals' in p) return v === p.equals;
    if ('matches' in p) return new RegExp(p.matches, p.flags ?? '').test(v);
    return Number(v) >= p.atLeast;
  }

  const rows = d.groups[p.group] ?? [];
  if (p.some) return rows.some((r) => evaluateRow(p.some!, r));

  // `where` narrows first, so "of the rows that are X, every one is also Y" is
  // one predicate rather than two. This is the shape three MSSP checks use:
  // every APPLICABLE control is justified, every HIGH finding has a remedy.
  const qualifying = p.where ? rows.filter((r) => evaluateRow(p.where!, r)) : rows;

  if (p.every) {
    // Vacuously true on an empty set, exactly as `Array.every` is — the checks
    // this replaces were written that way, and a check that also requires rows
    // says so with `atLeast` beside it.
    if (p.atLeast !== undefined && qualifying.length < p.atLeast) return false;
    return qualifying.every((r) => evaluateRow(p.every!, r));
  }

  const count = p.distinct
    ? new Set(qualifying.map((r) => r[p.distinct!] ?? '').filter(nonEmpty)).size
    : qualifying.length;
  return count >= (p.atLeast ?? 1);
}

/**
 * A column whose value is computed from the rest of its row.
 *
 * Two shapes cover every real one: a named lookup over several columns (the risk
 * rating, from likelihood and impact) and a map from one column's value to a
 * word (a Yes/No answer becoming Proven/Finding).
 */
export type Derived =
  | { lookup: keyof typeof LOOKUPS; from: string[] }
  | { column: string; cases: Record<string, string>; else?: string };

/**
 * The named computations a `Derived` may call.
 *
 * A registry rather than a free function so a document can only name one that
 * exists — `riskLevel` is the standard likelihood-by-impact matrix the GRC
 * templates already own, and it stays there.
 */
export const LOOKUPS = {
  riskLevel: (...args: string[]) => riskLevel(args[0] ?? '', args[1] ?? ''),
} as const;

export function derive(d: Derived, row: FormRow): string {
  if ('lookup' in d) return LOOKUPS[d.lookup](...d.from.map((c) => row[c] ?? ''));
  const v = row[d.column] ?? '';
  return d.cases[v] ?? d.else ?? '';
}

/**
 * Is this well-formed, and if not, where?
 *
 * A predicate is now DATA, which means it can arrive from a document an
 * instructor edited by hand. The evaluator reads by key, so a typo degrades
 * silently in the worst possible way: `{ group: 'machines', atleast: 4 }` is a
 * valid-looking object that evaluates as "at least ONE row" and quietly marks a
 * check done. So the vocabulary is closed — an unknown key is an error, not an
 * ignored extra — and both the guard over the compiled courses and the document
 * loader run the same check.
 *
 * Returns the problems, each with the JSON path it is at; empty means valid.
 */
export function predicateErrors(p: unknown, at = 'when'): string[] {
  if (typeof p !== 'object' || p === null || Array.isArray(p)) return [`${at}: expected an object`];
  const o = p as Record<string, unknown>;
  const keys = Object.keys(o);
  const has = (k: string) => Object.prototype.hasOwnProperty.call(o, k);
  const extra = (allowed: string[]) =>
    keys.filter((k) => !allowed.includes(k)).map((k) => `${at}.${k}: not part of the vocabulary`);
  const listOf = (k: 'all' | 'any') =>
    Array.isArray(o[k])
      ? (o[k] as unknown[]).flatMap((x, i) => predicateErrors(x, `${at}.${k}[${i}]`))
      : [`${at}.${k}: expected an array`];
  const strings = (k: string) =>
    Array.isArray(o[k]) && (o[k] as unknown[]).every((s) => typeof s === 'string' && s !== '')
      ? []
      : [`${at}.${k}: expected a non-empty array of field names`];

  if (has('all')) return [...extra(['all']), ...listOf('all')];
  if (has('any')) return [...extra(['any']), ...listOf('any')];
  if (has('not')) return [...extra(['not']), ...predicateErrors(o.not, `${at}.not`)];
  if (has('fields')) return [...extra(['fields']), ...strings('fields')];
  if (has('field')) {
    const out = extra(['field', 'equals', 'matches', 'flags', 'atLeast']);
    if (typeof o.field !== 'string' || !o.field) out.push(`${at}.field: expected a field name`);
    if (has('equals')) {
      if (typeof o.equals !== 'string') out.push(`${at}.equals: expected a string`);
    } else if (has('matches')) {
      out.push(...regexErrors(o.matches, o.flags, at));
    } else if (has('atLeast')) {
      if (typeof o.atLeast !== 'number') out.push(`${at}.atLeast: expected a number`);
    } else {
      out.push(`${at}: a single field needs equals, matches or atLeast — several filled fields is { fields: [...] }`);
    }
    return out;
  }
  if (has('group')) {
    const out = extra(['group', 'atLeast', 'where', 'every', 'some', 'distinct']);
    if (typeof o.group !== 'string' || !o.group) out.push(`${at}.group: expected a group name`);
    if (has('atLeast') && typeof o.atLeast !== 'number') out.push(`${at}.atLeast: expected a number`);
    if (has('distinct') && (typeof o.distinct !== 'string' || !o.distinct))
      out.push(`${at}.distinct: expected a column name`);
    for (const k of ['where', 'every', 'some'] as const)
      if (has(k)) out.push(...rowPredicateErrors(o[k], `${at}.${k}`));
    if (has('some') && (has('every') || has('where')))
      out.push(`${at}: some is evaluated alone — where/every beside it would be ignored`);
    return out;
  }
  return [`${at}: none of all, any, not, fields, field or group`];
}

/** The same, for a test applied to one row of a table. */
export function rowPredicateErrors(p: unknown, at: string): string[] {
  if (typeof p !== 'object' || p === null || Array.isArray(p)) return [`${at}: expected an object`];
  const o = p as Record<string, unknown>;
  const has = (k: string) => Object.prototype.hasOwnProperty.call(o, k);
  const extra = (allowed: string[]) =>
    Object.keys(o).filter((k) => !allowed.includes(k)).map((k) => `${at}.${k}: not part of the vocabulary`);

  if (has('filled')) {
    const ok = Array.isArray(o.filled) && o.filled.every((s) => typeof s === 'string' && s !== '');
    return [...extra(['filled']), ...(ok ? [] : [`${at}.filled: expected a non-empty array of column names`])];
  }
  for (const k of ['all', 'any'] as const)
    if (has(k))
      return [
        ...extra([k]),
        ...(Array.isArray(o[k])
          ? (o[k] as unknown[]).flatMap((x, i) => rowPredicateErrors(x, `${at}.${k}[${i}]`))
          : [`${at}.${k}: expected an array`]),
      ];
  if (has('column')) {
    const out = extra(['column', 'equals', 'matches']);
    if (typeof o.column !== 'string' || !o.column) out.push(`${at}.column: expected a column name`);
    if (has('equals')) {
      if (typeof o.equals !== 'string') out.push(`${at}.equals: expected a string`);
    } else if (has('matches')) {
      out.push(...regexErrors(o.matches, undefined, at));
    } else {
      out.push(`${at}: a column needs equals or matches — a column being filled is { filled: [...] }`);
    }
    return out;
  }
  return [`${at}: none of filled, all, any or column`];
}

/** A regex source has to compile, and a bad one must fail here rather than
 *  throwing out of the middle of a gate calculation. */
function regexErrors(source: unknown, flags: unknown, at: string): string[] {
  if (typeof source !== 'string') return [`${at}.matches: expected a regex source string`];
  if (flags !== undefined && typeof flags !== 'string') return [`${at}.flags: expected a string`];
  try {
    new RegExp(source, (flags as string) ?? '');
    return [];
  } catch (e) {
    return [`${at}.matches: ${(e as Error).message}`];
  }
}

/** The same for a computed column, so a document cannot name a lookup that does
 *  not exist — the one way `derive` could throw at render time. */
export function derivedErrors(d: unknown, at = 'derived'): string[] {
  if (typeof d !== 'object' || d === null || Array.isArray(d)) return [`${at}: expected an object`];
  const o = d as Record<string, unknown>;
  if ('lookup' in o) {
    const out = Object.keys(o).filter((k) => k !== 'lookup' && k !== 'from').map((k) => `${at}.${k}: not part of the vocabulary`);
    if (typeof o.lookup !== 'string' || !(o.lookup in LOOKUPS)) out.push(`${at}.lookup: no such lookup`);
    if (!Array.isArray(o.from) || !o.from.every((c) => typeof c === 'string' && c))
      out.push(`${at}.from: expected an array of column names`);
    return out;
  }
  if ('column' in o) {
    const out = Object.keys(o).filter((k) => !['column', 'cases', 'else'].includes(k)).map((k) => `${at}.${k}: not part of the vocabulary`);
    if (typeof o.column !== 'string' || !o.column) out.push(`${at}.column: expected a column name`);
    const cases = o.cases;
    if (typeof cases !== 'object' || cases === null || Array.isArray(cases) || Object.values(cases).some((v) => typeof v !== 'string'))
      out.push(`${at}.cases: expected a map of value to value`);
    if ('else' in o && typeof o.else !== 'string') out.push(`${at}.else: expected a string`);
    return out;
  }
  return [`${at}: neither lookup nor column`];
}
