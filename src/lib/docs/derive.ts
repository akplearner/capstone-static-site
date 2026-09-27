import type { DeliverableDef, DeliverableVisual, FieldCheck } from './types';
import { EVIDENCE_NAMING } from '../evidence';

/**
 * The derived bundle (R84): every deliverable in every course carries
 * validators, rubric prose and a visual — WITHOUT hand-editing 52 seed blocks.
 * Where a definition doesn't set them, they are derived from what the
 * definition already says: an ipv4 field implies an address validator, a
 * select implies its options, a required textarea implies substance, the
 * course implies its diagram. Explicit seed values always win.
 *
 * Applied at the ONE place definitions are read (`deliverablesOf`), so the
 * exported JSON stays byte-identical to the seeds and the derivation is a
 * pure, tested function rather than 52 copies of the same defaults.
 */

const IPV4 = String.raw`^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$`;
// The evidence-file convention (src/lib/evidence.ts / utils.validateEvidenceFileName).
const FILEREF = String.raw`^\d{8}_Team\d{2}_[A-Za-z0-9]+_[A-Za-z0-9-]+\.[A-Za-z0-9]+$`;

export const COURSE_DEFAULT_VISUAL: Record<string, DeliverableVisual> = {
  'server-plus': { kit: 'rack' },
  ccna: { kit: 'topology' },
  'cysa-plus': { kit: 'flow' },
  'security-plus': { kit: 'topology' },
  mssp: { kit: 'topology' },
};

export function deriveChecks(def: DeliverableDef): FieldCheck[] {
  const out: FieldCheck[] = [];
  const add = (c: FieldCheck) => out.push(c);
  for (const s of def.sections) {
    if (s.kind === 'fields') {
      for (const f of s.fields) {
        if (f.type === 'ipv4') add({ field: f.field, rule: 'pattern', value: IPV4, hint: `${f.label}: a valid IPv4 address (four numbers 0-255)` });
        if (f.type === 'fileref') add({ field: f.field, rule: 'pattern', value: FILEREF, hint: `${f.label}: named ${EVIDENCE_NAMING}` });
        if (f.type === 'select' && f.options?.length) add({ field: f.field, rule: 'oneOf', value: f.options, hint: `${f.label}: one of the listed options` });
        if (f.type === 'area' && f.required) add({ field: f.field, rule: 'minLength', value: 40, hint: `${f.label}: a real answer, not a placeholder (40+ characters)` });
      }
    } else {
      for (const col of s.group.columns) {
        if (col.type === 'ipv4') add({ group: s.group.group, column: col.field, rule: 'pattern', value: IPV4, hint: `${col.label}: a valid IPv4 address in every row` });
        if (col.type === 'select' && col.options?.length) add({ group: s.group.group, column: col.field, rule: 'oneOf', value: col.options, hint: `${col.label}: one of the listed options in every row` });
      }
    }
  }
  return out;
}

/** The definition with its R84 bundle filled in. Explicit values win. */
export function withDerivedBundle(def: DeliverableDef): DeliverableDef {
  const courseId = def.courseId ?? 'security-plus';
  return {
    ...def,
    checks: def.checks ?? deriveChecks(def),
    visual: def.visual ?? COURSE_DEFAULT_VISUAL[courseId] ?? { kit: 'topology' },
    rubric: def.rubric ?? {},
  };
}
