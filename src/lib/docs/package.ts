import { DeliverableData, emptyData } from './types';
import { deliverablesForCourse } from './definitions';
import { DocMeta, toDeliverableCSV, toDeliverableMarkdown } from './report';
import { CUSTODY_RULES, CustodyRow, custodyLogCSV, custodyLogMarkdown } from './custodyTemplate';
import { makeZip, ZipEntry } from './zip';
import { RoleDef } from '../types';

/** A filesystem-safe folder name for a role (e.g. "SOC Analyst" → "SOC_Analyst"). */
function roleFolder(owner: string, roles?: RoleDef[]): string {
  const name = roles?.find((r) => r.id === owner)?.name ?? owner;
  return name.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

/** An evidence file a student attached for a week's package: raw bytes + its hash. */
export interface WeekAttachment {
  name: string;
  bytes: Uint8Array;
  sha256: string;
  size: number;
}

/** Root folder name for a team's package, e.g. "Capstone_Team01". */
export function packageRoot(meta: DocMeta): string {
  const team = (meta.team ?? 'XX').toString().replace(/[^A-Za-z0-9_-]/g, '');
  return `Capstone_Team${team}`;
}

/** Suggested download file name for the bundle. */
export function packageFileName(meta: DocMeta): string {
  return `${packageRoot(meta)}.zip`;
}

function readme(root: string, meta: DocMeta): string {
  const defs = deliverablesForCourse(meta.courseId ?? 'security-plus');
  const lines = [
    `# ${root}`,
    '',
    `The team capstone package — all ${defs.length} graded deliverables, assembled into one`,
    'submission (plus this README and Team_Roles).',
    '',
    meta.team ? `- Team: ${meta.team}` : '',
    meta.cohort ? `- Cohort: ${meta.cohort}` : '',
    meta.date ? `- Generated: ${meta.date}` : '',
    '',
    '## Contents',
    '',
  ];
  for (const def of defs) {
    lines.push(`- \`${def.folder}/${def.file}\` — ${def.title} (${def.owner.toUpperCase()}, ${def.standard})`);
  }
  lines.push(
    '',
    '## Combining the team’s work (hand-off checklist)',
    '',
    'Each role fills their own deliverables in the app, then combines them into one package:',
    '',
    '1. **Each member** finishes their forms on the Deliverables page and clicks',
    '   **Export .json** to save a snapshot of their work.',
    '2. **One owner (usually GRC)** clicks **Restore .json** for each teammate’s file to',
    '   merge everyone’s deliverables into a single set (Red → GRC, Blue → GRC).',
    '3. Red hands Blue the attack evidence so Blue can write the Incident Report; Blue and',
    '   Red hand GRC their findings for the Risk Register and Final Report.',
    '4. The owner clicks **Download team package** to produce this zip.',
    '5. Verify every folder below has its file and the Evidence log lists every artifact',
    '   with a SHA256 hash.',
    '',
    '## Evidence & chain of custody',
    '',
    'Evidence (screenshots, captures, hashes) stays on your machine in',
    '`04_Testing_and_Findings/Evidence/`, named `YYYYMMDD_TeamXX_Tool_Action.png`.',
    'Record every artifact and hand-off in `Evidence/CHAIN_OF_CUSTODY.md`. Handling rules:',
    '',
    ...CUSTODY_RULES.map((r) => `- ${r}`),
    ''
  );
  return lines.filter((l) => l !== undefined).join('\n');
}

function teamRoles(meta: DocMeta): string {
  return [
    '# Team Roles',
    '',
    meta.team ? `Team: ${meta.team}` : 'Team: __',
    '',
    '| Member | Role | Responsibilities |',
    '| --- | --- | --- |',
    '| | GRC (Fixers) | Scope & RoE, Asset Inventory, Risk Register, Final Report |',
    '| | Red | Penetration Test Report |',
    '| | Blue | Hardening Baseline, Change Log, Incident Report |',
    '',
  ].join('\n');
}

/**
 * Assemble a team's saved deliverables into the spec §3 folder tree and return
 * the bytes of a .zip. Each deliverable is written with its exact file name
 * (`NN_Name.ext`) under its folder; CSV deliverables export as CSV, the rest as
 * Markdown. Missing deliverables are still written (empty shell) so the package
 * always shows the full structure.
 */
export function buildTeamPackage(saved: Record<string, DeliverableData>, meta: DocMeta): Uint8Array {
  const enc = new TextEncoder();
  const root = packageRoot(meta);
  const entries: ZipEntry[] = [];

  for (const def of deliverablesForCourse(meta.courseId ?? 'security-plus')) {
    const data = saved[def.id] ?? emptyData();
    const content =
      def.exportFormat === 'csv'
        ? toDeliverableCSV(def, data)
        : toDeliverableMarkdown(def, data, meta);
    entries.push({ name: `${root}/${def.folder}/${def.file}`, data: enc.encode(content) });
  }

  entries.push({ name: `${root}/README.md`, data: enc.encode(readme(root, meta)) });
  entries.push({ name: `${root}/Team_Roles.md`, data: enc.encode(teamRoles(meta)) });
  // Seed the Evidence folder with a ready-to-fill chain-of-custody log (MD + CSV),
  // so the team documents artifacts like a real case instead of an empty folder.
  const evidenceDir = `${root}/04_Testing_and_Findings/Evidence`;
  entries.push({ name: `${evidenceDir}/CHAIN_OF_CUSTODY.md`, data: enc.encode(custodyLogMarkdown(meta)) });
  entries.push({ name: `${evidenceDir}/CHAIN_OF_CUSTODY.csv`, data: enc.encode(custodyLogCSV()) });

  return makeZip(entries);
}

/** Download file name for a single week's evidence package. */
export function weekPackageFileName(meta: DocMeta, week: number): string {
  return `${packageRoot(meta)}_Week${week}.zip`;
}

/** Turn attachments into populated chain-of-custody rows (one per file, hashed). */
function attachmentCustodyRows(attachments: WeekAttachment[], meta: DocMeta): CustodyRow[] {
  return attachments.map((a, i) => ({
    'Evidence ID': `E-${String(i + 1).padStart(2, '0')}`,
    Description: a.name,
    'Collected by': meta.team ? `Team ${meta.team}` : '',
    'Date/Time': meta.date ?? '',
    'Location (path)': `Evidence/${a.name}`,
    'SHA-256': a.sha256,
    Notes: `${(a.size / 1024).toFixed(1)} KB`,
  }));
}

function weekReadme(root: string, meta: DocMeta, week: number, defTitles: string[], attachments: WeekAttachment[]): string {
  return [
    `# ${root}`,
    '',
    `Week ${week} evidence package for ${meta.team ? `Team ${meta.team}` : 'your team'}.`,
    meta.date ? `Generated: ${meta.date}` : '',
    '',
    '## This week’s deliverable(s)',
    '',
    ...(defTitles.length ? defTitles.map((t) => `- ${t}`) : ['- (none graded this week)']),
    '',
    '## Evidence',
    '',
    attachments.length
      ? `${attachments.length} file(s) in \`Evidence/\`, each hashed and logged in \`Evidence/CHAIN_OF_CUSTODY.md\`.`
      : 'No files attached — add screenshots/captures before generating, and they’ll be hashed and logged here.',
    '',
    '_Chain of custody aligned with NIST SP 800-61 and ISO/IEC 27037._',
    '',
  ].filter((l) => l !== undefined).join('\n');
}

/**
 * Assemble ONE week's deliverable(s) plus the student's attached evidence into a
 * zip: each filled form under its folder, every attachment under `Evidence/`, and
 * a chain-of-custody log (MD + CSV) populated from the attachments' SHA-256 hashes.
 * Pure + client-side — attachments are passed in from in-memory React state.
 */
export function buildWeekPackage(
  saved: Record<string, DeliverableData>,
  meta: DocMeta,
  courseId: string,
  week: number,
  attachments: WeekAttachment[] = [],
  roles?: RoleDef[]
): Uint8Array {
  const enc = new TextEncoder();
  const root = `${packageRoot(meta)}_Week${week}`;
  const entries: ZipEntry[] = [];

  // Group each week's deliverable(s) under a per-role subfolder so the zip reads
  // as "Week N → the role that owns this doc → the file".
  const defs = deliverablesForCourse(courseId).filter((d) => d.weeks.includes(week));
  for (const def of defs) {
    const data = saved[def.id] ?? emptyData();
    const content =
      def.exportFormat === 'csv' ? toDeliverableCSV(def, data) : toDeliverableMarkdown(def, data, meta);
    entries.push({ name: `${root}/${roleFolder(def.owner, roles)}/${def.file}`, data: enc.encode(content) });
  }

  const evidenceDir = `${root}/Evidence`;
  for (const a of attachments) {
    entries.push({ name: `${evidenceDir}/${a.name}`, data: a.bytes });
  }
  const rows = attachmentCustodyRows(attachments, meta);
  entries.push({ name: `${evidenceDir}/CHAIN_OF_CUSTODY.md`, data: enc.encode(custodyLogMarkdown(meta, rows)) });
  entries.push({ name: `${evidenceDir}/CHAIN_OF_CUSTODY.csv`, data: enc.encode(custodyLogCSV(rows)) });

  entries.push({ name: `${root}/README.md`, data: enc.encode(weekReadme(root, meta, week, defs.map((d) => d.title), attachments)) });

  return makeZip(entries);
}
