import { describe, it, expect } from 'vitest';
import {
  evaluate,
  evaluateRow,
  derive,
  predicateErrors,
  rowPredicateErrors,
  derivedErrors,
  LOOKUPS,
  type Predicate,
} from './predicate';
import { DELIVERABLES } from './definitions';
import { emptyData, type DeliverableData } from './types';

const data = (
  fields: Record<string, string> = {},
  groups: Record<string, Record<string, string>[]> = {}
): DeliverableData => ({ fields, groups });

describe('field predicates', () => {
  it('`fields` wants every named field non-empty, and whitespace is empty', () => {
    expect(evaluate({ fields: ['a'] }, data({ a: 'x' }))).toBe(true);
    expect(evaluate({ fields: ['a'] }, data({ a: '   ' }))).toBe(false);
    expect(evaluate({ fields: ['a'] }, emptyData())).toBe(false);
    expect(evaluate({ fields: ['a', 'b'] }, data({ a: 'x' }))).toBe(false);
    expect(evaluate({ fields: ['a', 'b'] }, data({ a: 'x', b: 'y' }))).toBe(true);
  });

  it('`equals` is exact and `matches` is a regex source with optional flags', () => {
    expect(evaluate({ field: 'a', equals: 'Yes' }, data({ a: 'Yes' }))).toBe(true);
    expect(evaluate({ field: 'a', equals: 'Yes' }, data({ a: 'yes' }))).toBe(false);
    expect(evaluate({ field: 'a', matches: '^\\d+$' }, data({ a: '42' }))).toBe(true);
    expect(evaluate({ field: 'a', matches: 'yes' }, data({ a: 'YES' }))).toBe(false);
    expect(evaluate({ field: 'a', matches: 'yes', flags: 'i' }, data({ a: 'YES' }))).toBe(true);
    // A missing field is the empty string, never a crash.
    expect(evaluate({ field: 'nope', matches: '.' }, emptyData())).toBe(false);
  });

  it('`atLeast` on a field compares the number it holds', () => {
    expect(evaluate({ field: 'n', atLeast: 3 }, data({ n: '3' }))).toBe(true);
    expect(evaluate({ field: 'n', atLeast: 3 }, data({ n: '2' }))).toBe(false);
    // Not a number at all is not "at least" anything.
    expect(evaluate({ field: 'n', atLeast: 3 }, data({ n: 'lots' }))).toBe(false);
  });
});

describe('group predicates', () => {
  const rows = [
    { host: 'websrv', zone: 'dmz', sev: 'High' },
    { host: 'winserver', zone: 'lan', sev: 'Low' },
    { host: '', zone: '', sev: '' },
  ];
  const d = data({}, { m: rows });

  it('counts rows, and `atLeast` defaults to one', () => {
    expect(evaluate({ group: 'm' }, d)).toBe(true);
    expect(evaluate({ group: 'm', atLeast: 3 }, d)).toBe(true);
    expect(evaluate({ group: 'm', atLeast: 4 }, d)).toBe(false);
    expect(evaluate({ group: 'absent' }, d)).toBe(false);
  });

  it('`where` narrows what is counted', () => {
    expect(evaluate({ group: 'm', where: { filled: ['host', 'zone'] }, atLeast: 2 }, d)).toBe(true);
    expect(evaluate({ group: 'm', where: { filled: ['host', 'zone'] }, atLeast: 3 }, d)).toBe(false);
  });

  it('`some` asks for one row, `every` for all of them', () => {
    expect(evaluate({ group: 'm', some: { column: 'sev', equals: 'High' } }, d)).toBe(true);
    expect(evaluate({ group: 'm', some: { column: 'sev', equals: 'Critical' } }, d)).toBe(false);
    expect(evaluate({ group: 'm', every: { filled: ['host'] } }, d)).toBe(false);
    expect(evaluate({ group: 'm', where: { filled: ['host'] }, every: { filled: ['zone'] } }, d)).toBe(true);
  });

  /**
   * The subtlety that cost four checks during the conversion.
   *
   * `every` over nothing is true — that is what `Array.every` does and what the
   * functions being replaced did. A check that also needs rows to exist says so
   * with `atLeast` beside it, and these two assertions are the difference.
   */
  it('`every` is vacuously true on an empty table unless `atLeast` says otherwise', () => {
    const none = data({}, { m: [] });
    expect(evaluate({ group: 'm', every: { filled: ['host'] } }, none)).toBe(true);
    expect(evaluate({ group: 'm', atLeast: 1, every: { filled: ['host'] } }, none)).toBe(false);
  });

  it('`distinct` counts values, not rows', () => {
    const dupes = data({}, { m: [{ zone: 'dmz' }, { zone: 'dmz' }, { zone: 'lan' }, { zone: '' }] });
    expect(evaluate({ group: 'm', distinct: 'zone', atLeast: 2 }, dupes)).toBe(true);
    expect(evaluate({ group: 'm', distinct: 'zone', atLeast: 3 }, dupes)).toBe(false);
  });
});

describe('combinators', () => {
  const d = data({ a: 'x' });
  it('all, any and not compose', () => {
    expect(evaluate({ all: [{ fields: ['a'] }, { not: { fields: ['b'] } }] }, d)).toBe(true);
    expect(evaluate({ any: [{ fields: ['b'] }, { fields: ['a'] }] }, d)).toBe(true);
    expect(evaluate({ any: [{ fields: ['b'] }, { fields: ['c'] }] }, d)).toBe(false);
    // Empty lists behave as the array methods do, which is why the validator
    // does not accept one from a document.
    expect(evaluate({ all: [] }, d)).toBe(true);
    expect(evaluate({ any: [] }, d)).toBe(false);
  });

  it('row predicates compose the same way', () => {
    const row = { a: 'x', sev: 'High' };
    expect(evaluateRow({ all: [{ filled: ['a'] }, { column: 'sev', equals: 'High' }] }, row)).toBe(true);
    expect(evaluateRow({ any: [{ filled: ['zz'] }, { column: 'sev', matches: 'hi' }] }, row)).toBe(true);
  });

  it('a row `matches` is case-insensitive, because the students type freely', () => {
    expect(evaluateRow({ column: 'sev', matches: 'high' }, { sev: 'HIGH' })).toBe(true);
  });
});

describe('derived columns', () => {
  it('a lookup is called with the named columns, in order', () => {
    const row = { likelihood: 'High', impact: 'High' };
    expect(derive({ lookup: 'riskLevel', from: ['likelihood', 'impact'] }, row)).toBe(
      LOOKUPS.riskLevel('High', 'High')
    );
    // A blank row derives something rather than throwing.
    expect(typeof derive({ lookup: 'riskLevel', from: ['likelihood', 'impact'] }, {})).toBe('string');
  });

  it('a case map falls back to `else`, then to empty', () => {
    const d = { column: 'ok', cases: { Yes: 'Proven', No: 'Finding' }, else: 'Unverified' };
    expect(derive(d, { ok: 'Yes' })).toBe('Proven');
    expect(derive(d, { ok: 'No' })).toBe('Finding');
    expect(derive(d, { ok: '' })).toBe('Unverified');
    expect(derive({ column: 'ok', cases: { Yes: 'Proven' } }, {})).toBe('');
  });
});

/**
 * The vocabulary is CLOSED.
 *
 * These are data now, so a check can arrive from a hand-edited document. The
 * evaluator reads by key, so `atleast` for `atLeast` would not fail — it would
 * quietly become "at least one row" and mark a gate passed. Every rejection below
 * is a mistake that used to be impossible and now is not.
 */
describe('predicateErrors', () => {
  it('accepts every shape the evaluator implements', () => {
    const good: Predicate[] = [
      { fields: ['a'] },
      { field: 'a', equals: 'Yes' },
      { field: 'a', matches: '^x', flags: 'i' },
      { field: 'n', atLeast: 2 },
      { group: 'g' },
      { group: 'g', atLeast: 2, where: { filled: ['a'] } },
      { group: 'g', atLeast: 1, every: { any: [{ column: 'a', equals: 'Yes' }, { filled: ['b'] }] } },
      { group: 'g', some: { column: 'a', matches: 'x' } },
      { group: 'g', distinct: 'zone', atLeast: 3 },
      { all: [{ fields: ['a'] }, { not: { group: 'g' } }] },
      { any: [{ fields: ['a'] }] },
    ];
    for (const p of good) expect(predicateErrors(p), JSON.stringify(p)).toEqual([]);
  });

  it('names the path of a misspelled or unknown key', () => {
    expect(predicateErrors({ group: 'g', atleast: 4 })).toEqual([
      'when.atleast: not part of the vocabulary',
    ]);
    // Nested, so the path says which branch — with no recognised key at all,
    // the one message that matters is that the branch says nothing.
    expect(predicateErrors({ all: [{ fields: ['a'] }, { grp: 'g' }] })).toEqual([
      'when.all[1]: none of all, any, not, fields, field or group',
    ]);
    expect(rowPredicateErrors({ colum: 'a', equals: 'x' }, 'where')).toEqual([
      'where: none of filled, all, any or column',
    ]);
    expect(rowPredicateErrors({ column: 'a', equals: 'x', fillled: ['b'] }, 'every')).toEqual([
      'every.fillled: not part of the vocabulary',
    ]);
  });

  it('rejects a field with no test, and a group whose `some` is drowned out', () => {
    expect(predicateErrors({ field: 'a' })[0]).toMatch(/needs equals, matches or atLeast/);
    expect(predicateErrors({ group: 'g', some: { filled: ['a'] }, every: { filled: ['b'] } })[0]).toMatch(
      /some is evaluated alone/
    );
  });

  it('rejects a regex that does not compile, rather than throwing mid-gate', () => {
    expect(predicateErrors({ field: 'a', matches: '([' })).toHaveLength(1);
    expect(() => evaluate({ field: 'a', matches: '^ok$' }, emptyData())).not.toThrow();
  });

  it('rejects the wrong types and the wrong shapes', () => {
    expect(predicateErrors(null)).toEqual(['when: expected an object']);
    expect(predicateErrors([{ fields: ['a'] }])).toEqual(['when: expected an object']);
    expect(predicateErrors({ fields: 'a' })).toEqual(['when.fields: expected a non-empty array of field names']);
    expect(predicateErrors({ field: 'a', atLeast: '2' })).toEqual(['when.atLeast: expected a number']);
    expect(predicateErrors({ not: 'x' })).toEqual(['when.not: expected an object']);
  });

  it('derivedErrors refuses a lookup that does not exist', () => {
    expect(derivedErrors({ lookup: 'riskLevel', from: ['a', 'b'] })).toEqual([]);
    expect(derivedErrors({ column: 'a', cases: { Yes: 'Proven' }, else: '—' })).toEqual([]);
    expect(derivedErrors({ lookup: 'severity', from: ['a'] })).toEqual(['derived.lookup: no such lookup']);
    expect(derivedErrors({ column: 'a', cases: { Yes: 1 } })).toEqual([
      'derived.cases: expected a map of value to value',
    ]);
    expect(derivedErrors({})).toEqual(['derived: neither lookup nor column']);
  });
});

/**
 * And the real ones. 125 checks and 3 computed columns across four courses came
 * out of TypeScript functions in one pass; this is what says they are all still
 * things this evaluator can read.
 */
describe('every check and computed column in the course content is well-formed', () => {
  it('holds for all Definition-of-Done checks', () => {
    const bad: string[] = [];
    for (const d of DELIVERABLES)
      for (const c of d.dod ?? [])
        bad.push(...predicateErrors(c.when, `${d.id} "${c.label}"`));
    expect(bad).toEqual([]);
  });

  it('holds for all derived form columns', () => {
    const bad: string[] = [];
    let seen = 0;
    for (const d of DELIVERABLES)
      for (const s of d.sections) {
        const cols =
          s.kind === 'group' ? s.group.columns : s.fields;
        for (const c of cols) {
          if (!c.derived) continue;
          seen++;
          bad.push(...derivedErrors(c.derived, `${d.id}.${c.field}.derived`));
        }
      }
    expect(bad).toEqual([]);
    expect(seen).toBeGreaterThan(0);
  });

  it('every check names a field or group its own form actually has', () => {
    // The other half of "declarative": a predicate can now name a key that does
    // not exist, where a function could not. That check silently never passes.
    const names = (p: unknown, out: { fields: string[]; groups: string[] }) => {
      if (!p || typeof p !== 'object') return out;
      const o = p as Record<string, unknown>;
      if (Array.isArray(o.all)) o.all.forEach((x) => names(x, out));
      if (Array.isArray(o.any)) o.any.forEach((x) => names(x, out));
      if (o.not) names(o.not, out);
      if (Array.isArray(o.fields)) out.fields.push(...(o.fields as string[]));
      if (typeof o.field === 'string') out.fields.push(o.field);
      if (typeof o.group === 'string') out.groups.push(o.group);
      return out;
    };
    const bad: string[] = [];
    for (const d of DELIVERABLES) {
      const fields = new Set<string>();
      const groups = new Set<string>();
      for (const s of d.sections) {
        if (s.kind === 'group') groups.add(s.group.group);
        else s.fields.forEach((f) => fields.add(f.field));
      }
      for (const c of d.dod ?? []) {
        const used = names(c.when, { fields: [], groups: [] });
        for (const f of used.fields) if (!fields.has(f)) bad.push(`${d.id} "${c.label}": no field ${f}`);
        for (const g of used.groups) if (!groups.has(g)) bad.push(`${d.id} "${c.label}": no group ${g}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
