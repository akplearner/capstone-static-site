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
// R139: a prefix is an address with its mask; a port is a number or a range, with or without its protocol (formContext.isPort agrees).
const CIDR = String.raw`^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}/(3[0-2]|[12]?\d)$`;
const PORT = String.raw`^([Aa][Nn][Yy]|[Aa][Ll][Ll]|\*|\d{1,5}(-\d{1,5})?(/([Tt][Cc][Pp]|[Uu][Dd][Pp]|[Ii][Cc][Mm][Pp]|[Ss][Cc][Tt][Pp]|[Aa][Nn][Yy]))?)$`;

export const COURSE_DEFAULT_VISUAL: Record<string, DeliverableVisual> = {
  // R99: a form draws its course's picture as it stands in the form's week.
  'server-plus': { kit: 'week' },
  ccna: { kit: 'week' },
  'a-plus': { kit: 'week' },
  'ai-foundations': { kit: 'week' },
  'docker-dca': { kit: 'week' },
  'kubernetes-cka': { kit: 'week' },
  'aws-ai-practitioner': { kit: 'week' },
  'network-plus': { kit: 'week' },
  'cysa-plus': { kit: 'week' },
  'security-plus': { kit: 'week' },
  mssp: { kit: 'week' },
  'azure-fundamentals': { kit: 'cloud' },
  'azure-administrator': { kit: 'cloud' },
  'azure-devops': { kit: 'cloud' },
  'aws-cloud-practitioner': { kit: 'cloud' },
  'aws-solutions-architect': { kit: 'cloud' },
  'aws-devops': { kit: 'cloud' },
};

export function deriveChecks(def: DeliverableDef): FieldCheck[] {
  const out: FieldCheck[] = [];
  const add = (c: FieldCheck) => out.push(c);
  for (const s of def.sections) {
    if (s.kind === 'fields') {
      for (const f of s.fields) {
        if (f.type === 'ipv4') add({ field: f.field, rule: 'pattern', value: IPV4, hint: `${f.label}: a valid IPv4 address (four numbers 0-255)` });
        if (f.type === 'cidr') add({ field: f.field, rule: 'pattern', value: CIDR, hint: `${f.label}: a prefix with its mask, like 10.10.1.0/24` });
        if (f.type === 'port') add({ field: f.field, rule: 'pattern', value: PORT, hint: `${f.label}: a port, with or without its protocol, like 443/tcp` });
        if (f.type === 'fileref') add({ field: f.field, rule: 'pattern', value: FILEREF, hint: `${f.label}: named ${EVIDENCE_NAMING}` });
        if (f.type === 'select' && f.options?.length) add({ field: f.field, rule: 'oneOf', value: f.options, hint: `${f.label}: one of the listed options` });
        if (f.type === 'area' && f.required) add({ field: f.field, rule: 'minLength', value: 40, hint: `${f.label}: a real answer, not a placeholder (40+ characters)` });
      }
    } else if (s.kind === 'decision') {
      // R132: the chosen option must be one of the block's; a required area question is a real answer.
      add({ field: `decision:${s.block.id}`, rule: 'oneOf', value: s.block.options.map((o) => o.id), hint: `${s.block.title}: one of the options offered` });
      for (const q of s.block.questions) if (q.type === 'area' && q.required) add({ field: q.field, rule: 'minLength', value: 40, hint: `${q.label}: a real answer, not a placeholder (40+ characters)` });
    } else {
      for (const col of s.group.columns) {
        if (col.type === 'ipv4') add({ group: s.group.group, column: col.field, rule: 'pattern', value: IPV4, hint: `${col.label}: a valid IPv4 address in every row` });
        if (col.type === 'cidr') add({ group: s.group.group, column: col.field, rule: 'pattern', value: CIDR, hint: `${col.label}: a prefix with its mask in every row, like 10.10.1.0/24` });
        if (col.type === 'port') add({ group: s.group.group, column: col.field, rule: 'pattern', value: PORT, hint: `${col.label}: a port in every row, with or without its protocol, like 443/tcp` });
        if (col.type === 'select' && col.options?.length) add({ group: s.group.group, column: col.field, rule: 'oneOf', value: col.options, hint: `${col.label}: one of the listed options in every row` });
      }
    }
  }
  return out;
}

/** R138: the document-control fields every form carries (`skillProfile.ts` reads the same five). */
export const DOC_CONTROL_FIELDS = ['doc_id', 'version', 'doc_owner', 'doc_date', 'doc_status'] as const;

/**
 * R138 — every form closes with a document-control block. The cloud documents declared one; the others
 * did not, and a form that declares no control fields counted as controlled, so the Document control
 * KPI passed by default in nine courses. The block is derived here, once, so no seed restates it.
 */
export function withDocumentControl(def: DeliverableDef): DeliverableDef {
  const declared = new Set(def.sections.flatMap((s) => (s.kind === 'fields' ? s.fields.map((f) => f.field) : [])));
  if (DOC_CONTROL_FIELDS.some((f) => declared.has(f))) return def;
  return {
    ...def,
    sections: [
      ...def.sections,
      {
        kind: 'fields',
        title: 'Document control',
        fields: [
          { field: 'doc_id', label: 'Document ID', type: 'text', required: true, placeholder: def.file.replace(/\.[a-z]+$/i, '') },
          { field: 'version', label: 'Version', type: 'text', required: true, placeholder: '1.0' },
          { field: 'doc_owner', label: 'Owner', type: 'text', required: true, placeholder: 'Your name and role' },
          { field: 'doc_date', label: 'Date', type: 'date', required: true },
          { field: 'doc_status', label: 'Status', type: 'select', required: true, options: ['Draft', 'In review', 'Approved'] },
        ],
      },
    ],
  };
}

/** The definition with its R84 bundle filled in. Explicit values win. */
export function withDerivedBundle(raw: DeliverableDef): DeliverableDef {
  const def = withDocumentControl(raw);
  const courseId = def.courseId ?? 'security-plus';
  return {
    ...def,
    checks: def.checks ?? deriveChecks(def),
    visual: def.visual ?? COURSE_DEFAULT_VISUAL[courseId] ?? { kit: 'topology' },
    rubric: def.rubric ?? {},
  };
}
