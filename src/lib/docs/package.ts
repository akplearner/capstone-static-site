import { DeliverableData, emptyData } from './types';
import { DELIVERABLES } from './definitions';
import { DocMeta, toDeliverableCSV, toDeliverableMarkdown } from './report';
import { CUSTODY_RULES, custodyLogCSV, custodyLogMarkdown } from './custodyTemplate';
import { makeZip, ZipEntry } from './zip';

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
  const lines = [
    `# ${root}`,
    '',
    'The team capstone package — all 8 graded deliverables, assembled into one',
    'submission. The 17 working files from the old course consolidate into these',
    '8 deliverables (plus this README and Team_Roles).',
    '',
    meta.team ? `- Team: ${meta.team}` : '',
    meta.cohort ? `- Cohort: ${meta.cohort}` : '',
    meta.date ? `- Generated: ${meta.date}` : '',
    '',
    '## Contents',
    '',
  ];
  for (const def of DELIVERABLES) {
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

  for (const def of DELIVERABLES) {
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
