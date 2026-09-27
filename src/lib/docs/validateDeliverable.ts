import type { DeliverableDef } from './types';
import { seedDeliverable } from './definitions';
import { withDerivedBundle } from './derive';
import { evaluateBundle } from './deliverableRubric';

/**
 * The admin editor's gate (R85): a deliverable definition is applied only if
 * it (a) has the shape every renderer assumes and (b) SURVIVES the renderers'
 * own pure pipeline — seed, derive, evaluate — so a bad edit is caught in the
 * editor, never by a student opening the form. Prose fields are the author's
 * business; structure is what this checks.
 */
export type DefCheck = { ok: true; def: DeliverableDef } | { ok: false; error: string };

const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0;

export function validateDeliverableDef(raw: unknown): DefCheck {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, error: 'A deliverable is an object.' };
  }
  const d = raw as Record<string, unknown>;
  for (const field of ['id', 'title', 'file', 'folder', 'owner'] as const) {
    if (!isStr(d[field])) return { ok: false, error: `“${field}” must be a non-empty string.` };
  }
  if (!Array.isArray(d.weeks) || d.weeks.length === 0 || d.weeks.some((w) => typeof w !== 'number')) {
    return { ok: false, error: '“weeks” must be a non-empty array of numbers.' };
  }
  if (!Array.isArray(d.sections) || d.sections.length === 0) {
    return { ok: false, error: '“sections” must be a non-empty array.' };
  }
  for (const [i, s] of (d.sections as unknown[]).entries()) {
    const sec = s as Record<string, unknown>;
    if (sec?.kind === 'fields') {
      if (!Array.isArray(sec.fields) || (sec.fields as unknown[]).some((f) => !isStr((f as Record<string, unknown>)?.field) || !isStr((f as Record<string, unknown>)?.label))) {
        return { ok: false, error: `sections[${i}]: every field needs a “field” key and a “label”.` };
      }
    } else if (sec?.kind === 'group') {
      const g = sec.group as Record<string, unknown> | undefined;
      if (!g || !isStr(g.group) || !Array.isArray(g.columns) || (g.columns as unknown[]).length === 0) {
        return { ok: false, error: `sections[${i}]: a group section needs group.group and group.columns.` };
      }
    } else {
      return { ok: false, error: `sections[${i}]: kind must be “fields” or “group”.` };
    }
  }
  if (d.dod !== undefined) {
    if (!Array.isArray(d.dod) || (d.dod as unknown[]).some((c) => !isStr((c as Record<string, unknown>)?.label) || typeof (c as Record<string, unknown>)?.when !== 'object')) {
      return { ok: false, error: 'Every “dod” check needs a label and a when-predicate object.' };
    }
  }

  // The smoke test: the exact pipeline every page runs. If any of it throws,
  // the definition would break a student's screen — refuse it here instead.
  const def = raw as DeliverableDef;
  try {
    const derived = withDerivedBundle(def);
    const data = seedDeliverable(derived);
    evaluateBundle(derived, data, { evidence: {}, steps: [], week: def.weeks[0] });
  } catch (e) {
    return { ok: false, error: `The definition breaks the form pipeline: ${e instanceof Error ? e.message : String(e)}` };
  }
  return { ok: true, def };
}

/** A whole course's list: ids unique, every entry valid. */
export function validateDeliverableList(raw: unknown): { ok: true; defs: DeliverableDef[] } | { ok: false; error: string } {
  if (!Array.isArray(raw)) return { ok: false, error: 'Deliverables are an array.' };
  const seen = new Set<string>();
  const defs: DeliverableDef[] = [];
  for (const [i, entry] of raw.entries()) {
    const v = validateDeliverableDef(entry);
    if (!v.ok) return { ok: false, error: `deliverables[${i}]: ${v.error}` };
    if (seen.has(v.def.id)) return { ok: false, error: `deliverables[${i}]: duplicate id “${v.def.id}”.` };
    seen.add(v.def.id);
    defs.push(v.def);
  }
  return { ok: true, defs };
}
