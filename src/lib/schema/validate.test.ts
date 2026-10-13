import { describe, it, expect } from 'vitest';
import { schemaErrors, validate, type JsonSchema } from './validate';

describe('R107 — the schema validator subset', () => {
  const schema: JsonSchema = {
    $defs: { id: { type: 'string', pattern: '^comp\\.' } },
    type: 'object',
    required: ['id', 'n'],
    additionalProperties: false,
    properties: {
      id: { $ref: '#/$defs/id' },
      n: { type: 'integer', minimum: 0, maximum: 10 },
      tags: { type: 'array', items: { type: 'string', minLength: 1 }, minItems: 1, maxItems: 3 },
      kind: { enum: ['a', 'b'] },
      fixed: { const: false },
      maybe: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      nested: { type: 'object', additionalProperties: { type: 'number' } },
    },
  };

  it('accepts a valid value and names every failure with its pointer', () => {
    expect(validate({ id: 'comp.a.b', n: 3, tags: ['x'], kind: 'a', fixed: false, maybe: null, nested: { k: 1 } }, schema)).toEqual([]);
    const errors = validate({ id: 'tool.x', n: 11.5, tags: [], kind: 'c', fixed: true, maybe: 1, nested: { k: 'no' }, extra: 1 }, schema);
    expect(errors).toContain('/id: does not match /^comp\\./');
    expect(errors).toContain('/n: expected integer, got number');
    expect(errors).toContain('/tags: fewer than 1 items');
    expect(errors).toContain('/kind: not one of ["a","b"]');
    expect(errors).toContain('/fixed: expected const false');
    expect(errors.some((e) => e.startsWith('/maybe: matches none of anyOf'))).toBe(true);
    expect(errors).toContain('/nested/k: expected number, got string');
    expect(errors).toContain('/: unexpected "extra"');
    expect(validate({ id: 'comp.a' }, schema)).toContain('/: missing "n"');
  });

  it('refuses a schema outside the subset, so nothing is promised that cannot be checked', () => {
    expect(schemaErrors(schema)).toEqual([]);
    expect(schemaErrors({ type: 'object', patternProperties: {} })).toContain('#: unsupported keyword "patternProperties"');
    expect(schemaErrors({ $ref: 'https://example.com/x.json' })).toContain('#: $ref must be local (#/$defs/<name>)');
    expect(schemaErrors({ type: 'date' })).toContain('#: unknown type "date"');
    expect(schemaErrors({ properties: { a: { type: 'object', properties: { b: { oneOf: [] } } } } })).toContain('#/properties/a/properties/b: unsupported keyword "oneOf"');
  });
});
