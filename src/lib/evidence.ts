/**
 * Single source of truth for how evidence is handled, so the guide, the lab-setup
 * page, the folder tree, the custody log, and the task content all agree.
 *
 * ONE canonical location: while you work, every artifact for a week lives in
 *   ~/team-artifacts/week-N/
 * and the team package gathers them all into
 *   04_Testing_and_Findings/Evidence/
 */

export const EVIDENCE_WORKING_DIR = '~/team-artifacts/week-N/';
export const EVIDENCE_PACKAGE_DIR = '04_Testing_and_Findings/Evidence/';

/** The one-line canonical rule quoted everywhere. */
export const EVIDENCE_LOCATION_RULE =
  'Save every artifact for a week in ~/team-artifacts/week-N/ while you work; the team package gathers them into 04_Testing_and_Findings/Evidence/.';

/** Filename convention. */
export const EVIDENCE_NAMING = 'YYYYMMDD_TeamXX_Tool_Action.ext';

/** Accepted evidence file types (kept in sync with validateEvidenceFileName). */
export const EVIDENCE_FILE_TYPES: { ext: string; use: string }[] = [
  { ext: 'png / jpg', use: 'screenshots' },
  { ext: 'pcap', use: 'packet captures' },
  { ext: 'txt / log', use: 'command output & logs' },
  { ext: 'pdf', use: 'reports' },
  { ext: 'mp4', use: 'short screen recordings' },
];

/** Handling guidance beyond the custody rules (redaction, big files, recordings). */
export const EVIDENCE_HANDLING: string[] = [
  'Redact secrets: blur or crop passwords, tokens, API keys and personal data before saving a screenshot.',
  'Large captures stay local: keep multi-GB pcaps on your machine and, if needed, trim to the relevant window (editcap/Wireshark export) — the package carries the log and SHA-256 hashes, not necessarily every raw file.',
  'Screen recordings: keep them short and named the same way (…_action.mp4); prefer a still screenshot when it proves the point.',
  'Never rename or edit an original after collection — work on a copy so its hash stays valid.',
];
