import { DocMeta } from './report';
import type { Section } from './types';
import type { Column } from '../grc/templates';

// A ready-to-fill Chain-of-Custody log, generated locally. Students keep evidence
// on their own machine (no upload) and document it like a real case: every artifact
// hashed, logged, and every hand-off recorded. Columns mirror the Incident Report's
// evidence-log group so the website form and this offline log stay consistent.

export const CUSTODY_COLUMNS = [
  'Evidence ID',
  'Description',
  'Collected by',
  'Date/Time',
  'Location (path)',
  'SHA-256',
  'Transferred to',
  'Transferred (date/time)',
  'Notes',
] as const;

// The handling rules shown at the top of the log and in the team-package README.
export const CUSTODY_RULES: string[] = [
  'Preserve the original — work on copies; never edit or rename the original artifact after collection.',
  'Name every artifact `YYYYMMDD_TeamXX_Tool_Action.ext` so it is dated, attributed and self-describing.',
  'Hash on collection: `sha256sum <file> >> Evidence_Hashes.txt`. Verify on receipt/before reporting: `sha256sum -c Evidence_Hashes.txt`.',
  'Log every artifact in this file the moment it is collected — and log every hand-off (who → who, when).',
  'Keep every artifact for a week in `~/team-artifacts/week-N/`; the team package gathers them into `04_Testing_and_Findings/Evidence/`. Keep originals read-only and backed up.',
  'One custodian holds the evidence at a time; record each transfer so the chain is unbroken.',
];

const EXAMPLE_ROW: Record<(typeof CUSTODY_COLUMNS)[number], string> = {
  'Evidence ID': 'E-01',
  Description: '20260627_Team01_sqlmap_dbdump.png',
  'Collected by': 'Red',
  'Date/Time': '2026-06-27 14:22',
  'Location (path)': '~/team-artifacts/week-3/',
  'SHA-256': 'c5b9… (from sha256sum)',
  'Transferred to': 'GRC',
  'Transferred (date/time)': '2026-06-27 15:05',
  Notes: 'SQLi proof — handed to GRC for the report',
};

function stamp(meta?: DocMeta): string[] {
  const out: string[] = [];
  if (meta?.team) out.push(`- Team: ${meta.team}`);
  if (meta?.cohort) out.push(`- Cohort: ${meta.cohort}`);
  if (meta?.date) out.push(`- Started: ${meta.date}`);
  return out;
}

/** A single custody-log row, keyed by CUSTODY_COLUMNS names (any subset). */
export type CustodyRow = Partial<Record<(typeof CUSTODY_COLUMNS)[number], string>>;

const mdCell = (v: string) => (v ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ').trim() || ' ';

/** Markdown chain-of-custody log. With `rows`, emits those real entries; otherwise
 *  falls back to a worked example. Always appends a few blank rows to fill by hand. */
export function custodyLogMarkdown(meta?: DocMeta, rows?: CustodyRow[], blankRows = 12): string {
  const cols = [...CUSTODY_COLUMNS];
  const header = `| ${cols.join(' | ')} |`;
  const sep = `| ${cols.map(() => '---').join(' | ')} |`;
  const dataRows =
    rows && rows.length > 0
      ? rows.map((r) => `| ${cols.map((c) => mdCell(r[c] ?? '')).join(' | ')} |`)
      : [`| ${cols.map((c) => EXAMPLE_ROW[c]).join(' | ')} |`];
  const blanks = Array.from({ length: blankRows }, () => `| ${cols.map(() => ' ').join(' | ')} |`);
  return [
    '# Chain of Custody Log',
    '',
    'Evidence stays on your machine and is handled like a real case. Fill one row per',
    'artifact, hash it, and record every hand-off.',
    ...stamp(meta),
    '',
    '## Handling rules',
    '',
    ...CUSTODY_RULES.map((r) => `- ${r}`),
    '',
    '## Log',
    '',
    header,
    sep,
    ...dataRows,
    ...blanks,
    '',
    '_Aligned with NIST SP 800-61 (incident handling) and ISO/IEC 27037 (digital evidence)._',
    '',
  ].join('\n');
}

/** The in-form chain-of-custody columns — the same nine facts as CUSTODY_COLUMNS
 *  and the offline `custodyLog*` exporters, so the website form, the ZIP log and
 *  a printed report all carry an identical, unbroken chain. The `sha256` field is
 *  what the Evidence & chain-of-custody hasher fills. */
export function custodyColumns(): Column[] {
  return [
    { field: 'evidence_id', label: 'Evidence ID', type: 'text', placeholder: 'E-01' },
    { field: 'description', label: 'Description / artifact', type: 'text', placeholder: '20260731_Team07_first_alert.png' },
    { field: 'collected_by', label: 'Collected by', type: 'text', placeholder: 'Blue' },
    { field: 'collected_at', label: 'Collected (date/time)', type: 'text', placeholder: '2026-07-31 14:45' },
    { field: 'location', label: 'Location (path)', type: 'text', placeholder: '~/team-artifacts/week-4/' },
    { field: 'sha256', label: 'SHA-256', type: 'text', placeholder: 'from sha256sum <file>' },
    { field: 'transferred_to', label: 'Transferred to', type: 'text', placeholder: 'GRC' },
    { field: 'transferred_at', label: 'Transferred (date/time)', type: 'text', placeholder: '2026-07-31 15:05' },
    { field: 'notes', label: 'Notes', type: 'text', placeholder: 'handed to GRC for the report' },
  ];
}

/** A ready-to-use chain-of-custody `Section` for a deliverable form. Reuses the
 *  custody columns above and cites the hash step, so evidence forms carry a full,
 *  compliant custody log instead of an ad-hoc evidence table. */
export function custodySection(opts?: { group?: string; label?: string; seed?: Record<string, string>[] }): Section {
  return {
    kind: 'group',
    group: {
      group: opts?.group ?? 'evidence',
      label: opts?.label ?? 'Chain of custody — hash & log every artifact',
      help: 'Hash every artifact with `sha256sum` the moment you collect it, then log it here and record each hand-off. Use the "Evidence & chain of custody" tool at the top of this page to compute the SHA-256.',
      columns: custodyColumns(),
      seed: opts?.seed,
    },
  };
}

/** A DoD check: the custody log has at least one row and every row is hashed. */
export function everyEvidenceHashed(group = 'evidence') {
  return (d: { groups: Record<string, Record<string, string>[]> }) => {
    const rows = d.groups[group] ?? [];
    return rows.length >= 1 && rows.every((e) => !!e.sha256);
  };
}

/** CSV chain-of-custody log. With `rows`, emits those real entries; otherwise a
 *  worked example. Always appends blank rows to fill by hand. */
export function custodyLogCSV(rows?: CustodyRow[], blankRows = 12): string {
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const cols = [...CUSTODY_COLUMNS];
  const dataRows =
    rows && rows.length > 0
      ? rows.map((r) => cols.map((c) => esc(r[c] ?? '')).join(','))
      : [cols.map((c) => esc(EXAMPLE_ROW[c])).join(',')];
  const out = [
    cols.join(','),
    ...dataRows,
    ...Array.from({ length: blankRows }, () => cols.map(() => '').join(',')),
  ];
  return out.join('\n') + '\n';
}
