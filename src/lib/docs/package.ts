import { DeliverableData, emptyData } from './types';
import { DELIVERABLES } from './definitions';
import { DocMeta, toDeliverableCSV, toDeliverableMarkdown } from './report';
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
    'Evidence (screenshots, captures, hashes) belongs in',
    '`04_Testing_and_Findings/Evidence/`, named `YYYYMMDD_TeamXX_Tool_Action.png`.',
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
  // Keep the Evidence folder in the tree even when empty.
  entries.push({
    name: `${root}/04_Testing_and_Findings/Evidence/.gitkeep`,
    data: enc.encode(''),
  });

  return makeZip(entries);
}
