import { DocMeta } from './report';

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

/** Markdown chain-of-custody log: rules header + a worked example + blank rows. */
export function custodyLogMarkdown(meta?: DocMeta, blankRows = 12): string {
  const cols = [...CUSTODY_COLUMNS];
  const header = `| ${cols.join(' | ')} |`;
  const sep = `| ${cols.map(() => '---').join(' | ')} |`;
  const example = `| ${cols.map((c) => EXAMPLE_ROW[c]).join(' | ')} |`;
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
    example,
    ...blanks,
    '',
    '_Aligned with NIST SP 800-61 (incident handling) and ISO/IEC 27037 (digital evidence)._',
    '',
  ].join('\n');
}

/** CSV chain-of-custody log: header + a worked example + blank rows. */
export function custodyLogCSV(blankRows = 12): string {
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const cols = [...CUSTODY_COLUMNS];
  const rows = [
    cols.join(','),
    cols.map((c) => esc(EXAMPLE_ROW[c])).join(','),
    ...Array.from({ length: blankRows }, () => cols.map(() => '').join(',')),
  ];
  return rows.join('\n') + '\n';
}
