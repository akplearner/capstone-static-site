/**
 * R107 — a JSON Schema validator for the subset `content/schemas/` is written
 * in. The project carries no schema library (no ajv, no zod), and the shapes
 * it publishes need only this much: type, required, properties,
 * additionalProperties, items, enum, const, pattern, minimum, maximum,
 * minLength, minItems, maxItems, anyOf, and local `$ref` to `#/$defs/<name>`.
 * A schema that uses anything else is refused by `schemaErrors`, so the
 * published files stay inside what every consumer can validate.
 */

export type JsonSchema = {
  $schema?: string;
  $id?: string;
  title?: string;
  description?: string;
  $defs?: Record<string, JsonSchema>;
  $ref?: string;
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean | JsonSchema;
  items?: JsonSchema;
  enum?: unknown[];
  const?: unknown;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  minItems?: number;
  maxItems?: number;
  anyOf?: JsonSchema[];
};

const KNOWN = new Set(['$schema', '$id', 'title', 'description', '$defs', '$ref', 'type', 'properties', 'required', 'additionalProperties', 'items', 'enum', 'const', 'pattern', 'minimum', 'maximum', 'minLength', 'minItems', 'maxItems', 'anyOf']);
const TYPES = new Set(['string', 'number', 'integer', 'boolean', 'object', 'array', 'null']);

/** Keywords outside the subset, so a schema never promises what the validator cannot check. */
export function schemaErrors(schema: unknown, at = '#'): string[] {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return [`${at}: a schema is an object`];
  const out: string[] = [];
  const s = schema as Record<string, unknown>;
  for (const k of Object.keys(s)) if (!KNOWN.has(k)) out.push(`${at}: unsupported keyword "${k}"`);
  const types = Array.isArray(s.type) ? s.type : s.type ? [s.type] : [];
  for (const t of types) if (!TYPES.has(String(t))) out.push(`${at}: unknown type "${t}"`);
  if (s.$ref && !/^#\/\$defs\/[A-Za-z0-9_-]+$/.test(String(s.$ref))) out.push(`${at}: $ref must be local (#/$defs/<name>)`);
  for (const [k, v] of Object.entries((s.$defs as Record<string, unknown>) ?? {})) out.push(...schemaErrors(v, `${at}/$defs/${k}`));
  for (const [k, v] of Object.entries((s.properties as Record<string, unknown>) ?? {})) out.push(...schemaErrors(v, `${at}/properties/${k}`));
  if (s.items) out.push(...schemaErrors(s.items, `${at}/items`));
  if (s.additionalProperties && typeof s.additionalProperties === 'object') out.push(...schemaErrors(s.additionalProperties, `${at}/additionalProperties`));
  for (const [i, v] of ((s.anyOf as unknown[]) ?? []).entries()) out.push(...schemaErrors(v, `${at}/anyOf/${i}`));
  if (s.pattern !== undefined) {
    try {
      new RegExp(String(s.pattern));
    } catch {
      out.push(`${at}: bad pattern`);
    }
  }
  return out;
}

const typeOf = (v: unknown): string => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v === 'number' && Number.isInteger(v) ? 'integer' : typeof v);
const isType = (v: unknown, t: string): boolean => (t === 'number' ? typeof v === 'number' : t === 'integer' ? typeOf(v) === 'integer' : typeOf(v) === t);
const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

/** Every way `value` fails `schema`, as "<json pointer>: <reason>" lines; empty means valid. */
export function validate(value: unknown, schema: JsonSchema, root: JsonSchema = schema, at = ''): string[] {
  const out: string[] = [];
  const path = at || '/';
  if (schema.$ref) {
    const name = schema.$ref.replace('#/$defs/', '');
    const def = root.$defs?.[name];
    if (!def) return [`${path}: unknown $ref ${schema.$ref}`];
    return validate(value, def, root, at);
  }
  if (schema.anyOf) {
    const fails = schema.anyOf.map((s) => validate(value, s, root, at));
    if (!fails.some((f) => f.length === 0)) out.push(`${path}: matches none of anyOf (${fails.map((f) => f[0]).join(' | ')})`);
    return out;
  }
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t) => isType(value, t))) return [`${path}: expected ${types.join('|')}, got ${typeOf(value)}`];
  }
  if (schema.const !== undefined && !same(value, schema.const)) out.push(`${path}: expected const ${JSON.stringify(schema.const)}`);
  if (schema.enum && !schema.enum.some((e) => same(e, value))) out.push(`${path}: not one of ${JSON.stringify(schema.enum)}`);
  if (typeof value === 'string') {
    if (schema.pattern !== undefined && !new RegExp(schema.pattern).test(value)) out.push(`${path}: does not match /${schema.pattern}/`);
    if (schema.minLength !== undefined && value.length < schema.minLength) out.push(`${path}: shorter than ${schema.minLength}`);
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) out.push(`${path}: below ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum) out.push(`${path}: above ${schema.maximum}`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) out.push(`${path}: fewer than ${schema.minItems} items`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) out.push(`${path}: more than ${schema.maxItems} items`);
    if (schema.items) value.forEach((v, i) => out.push(...validate(v, schema.items!, root, `${at}/${i}`)));
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    for (const k of schema.required ?? []) if (!(k in obj)) out.push(`${path}: missing "${k}"`);
    for (const [k, v] of Object.entries(obj)) {
      const prop = schema.properties?.[k];
      if (prop) out.push(...validate(v, prop, root, `${at}/${k}`));
      else if (schema.additionalProperties === false) out.push(`${path}: unexpected "${k}"`);
      else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') out.push(...validate(v, schema.additionalProperties, root, `${at}/${k}`));
    }
  }
  return out;
}
