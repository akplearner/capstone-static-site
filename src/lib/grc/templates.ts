import { Framework } from '../types';
import type { RegisterRow, GrcData } from '../types';

// Column schema for the generic RegisterTable. `derived` columns are computed
// (read-only) from the other fields, so students don't hand-calculate severity
// or risk level.
export type ColumnType = 'text' | 'number' | 'select' | 'area' | 'date';
export interface Column {
  field: string;
  label: string;
  type: ColumnType;
  options?: string[];
  derived?: (row: RegisterRow) => string;
  placeholder?: string;
}

export interface RegisterDef {
  id: string;
  title: string;
  /** One-line purpose shown under the title. */
  purpose: string;
  /** Framework tag (uses the shared framework helpers/colors). */
  framework: Framework;
  /** "How to fill this" tooltip text. */
  howToFill: string;
  /** Which Red/Blue report this register is built from. */
  source: string;
  columns: Column[];
  /** Worked example rows from the Security+ scenario. */
  seed: RegisterRow[];
}

const CRITICALITY = ['Low', 'Medium', 'High', 'Critical'];
const LMH = ['Low', 'Medium', 'High'];

/** CVSS base score (0–10) → severity band (FIRST/NVD qualitative ratings). */
export function severityFromCvss(cvss: string): string {
  const n = parseFloat(cvss);
  if (isNaN(n)) return '';
  if (n === 0) return 'None';
  if (n < 4) return 'Low';
  if (n < 7) return 'Medium';
  if (n < 9) return 'High';
  return 'Critical';
}

/** Likelihood × Impact → risk level (NIST SP 800-30 style 3×3 matrix). */
export function riskLevel(likelihood: string, impact: string): string {
  const v = (x: string) => (x === 'High' ? 3 : x === 'Medium' ? 2 : x === 'Low' ? 1 : 0);
  const score = v(likelihood) * v(impact);
  if (score === 0) return '';
  if (score >= 6) return 'Critical';
  if (score >= 4) return 'High';
  if (score >= 2) return 'Medium';
  return 'Low';
}

export const REGISTERS: RegisterDef[] = [
  {
    id: 'assets',
    title: 'Asset Inventory',
    purpose: 'Every host, service, and owner in your company — you can’t protect what you don’t know you have.',
    framework: 'NIST_CSF',
    howToFill: 'List each host Red discovered: its IP, the services it exposes, who owns it, and how critical it is to the business. One row per host.',
    source: "From Red's Recon_Findings.md / Asset_List.md (hosts & services).",
    columns: [
      { field: 'host', label: 'Host', type: 'text', placeholder: 'web-01' },
      { field: 'ip', label: 'IP', type: 'text', placeholder: '10.10.10.5' },
      { field: 'services', label: 'Services', type: 'text', placeholder: 'SSH, HTTP, DNS' },
      { field: 'owner', label: 'Owner', type: 'text', placeholder: 'Blue team' },
      { field: 'criticality', label: 'Criticality', type: 'select', options: CRITICALITY },
    ],
    seed: [
      { host: 'web-01 (DVWA)', ip: '10.10.10.5', services: 'SSH(22), HTTP(80), DNS(53)', owner: 'Blue team', criticality: 'High' },
    ],
  },
  {
    id: 'vulns',
    title: 'Vulnerability Register',
    purpose: 'Each weakness found, scored by CVSS, and tracked to closure.',
    framework: 'CVSS',
    howToFill: 'Enter each finding, the asset it affects, and its CVSS base score (0–10). Severity is filled in for you. Update Status as Blue remediates.',
    source: "From Red's Nmap_Scan / Nikto_Report / Vulnerability_Summary.md.",
    columns: [
      { field: 'finding', label: 'Finding', type: 'text', placeholder: 'SSH password authentication enabled' },
      { field: 'asset', label: 'Asset', type: 'text', placeholder: 'web-01' },
      { field: 'cvss', label: 'CVSS', type: 'number', placeholder: '7.5' },
      { field: 'severity', label: 'Severity', type: 'text', derived: (r) => severityFromCvss(r.cvss ?? '') },
      { field: 'status', label: 'Status', type: 'select', options: ['Open', 'In progress', 'Remediated', 'Accepted'] },
    ],
    seed: [
      { finding: 'SSH password authentication enabled', asset: 'web-01', cvss: '7.5', status: 'Open' },
      { finding: 'SQL injection in login form', asset: 'web-01', cvss: '9.8', status: 'Open' },
    ],
  },
  {
    id: 'threats',
    title: 'Threat Model / CTI',
    purpose: 'How an attacker would act — mapped to MITRE ATT&CK and STRIDE so detection and mitigation are concrete.',
    framework: 'STRIDE',
    howToFill: 'For each plausible attack, note the MITRE ATT&CK technique ID, the asset at risk, and the mitigation. Use Red’s actual techniques as your threat intel.',
    source: "From Red's attack techniques (→ ATT&CK) + Blue's detections.",
    columns: [
      { field: 'threat', label: 'Threat', type: 'text', placeholder: 'Credential brute force over SSH' },
      { field: 'technique', label: 'ATT&CK', type: 'text', placeholder: 'T1110 Brute Force' },
      { field: 'asset', label: 'Asset', type: 'text', placeholder: 'web-01' },
      { field: 'mitigation', label: 'Mitigation', type: 'text', placeholder: 'Key-only SSH; fail2ban; alert on 4625' },
    ],
    seed: [
      { threat: 'Credential brute force over SSH', technique: 'T1110 Brute Force', asset: 'web-01', mitigation: 'Disable password auth; fail2ban; alert on repeated failures' },
      { threat: 'SQL injection to read the database', technique: 'T1190 Exploit Public-Facing App', asset: 'web-01', mitigation: 'Parameterized queries / WAF; log & alert on UNION/SELECT' },
    ],
  },
  {
    id: 'risks',
    title: 'Risk Register',
    purpose: 'Business risk = likelihood × impact, with a treatment decision and owner (NIST SP 800-30).',
    framework: 'NIST_CSF',
    howToFill: 'Turn each high vulnerability/threat into a risk. Pick Likelihood and Impact — the Level is computed. Choose a treatment (Mitigate/Accept/Transfer/Avoid) and an owner.',
    source: 'From the Vulnerability Register (CVSS) × asset criticality; Blue controls lower it.',
    columns: [
      { field: 'risk', label: 'Risk', type: 'text', placeholder: 'Unauthorized access via SSH brute force' },
      { field: 'likelihood', label: 'Likelihood', type: 'select', options: LMH },
      { field: 'impact', label: 'Impact', type: 'select', options: LMH },
      { field: 'level', label: 'Level', type: 'text', derived: (r) => riskLevel(r.likelihood ?? '', r.impact ?? '') },
      { field: 'treatment', label: 'Treatment', type: 'select', options: ['Mitigate', 'Accept', 'Transfer', 'Avoid'] },
      { field: 'owner', label: 'Owner', type: 'text', placeholder: 'Blue team' },
    ],
    seed: [
      { risk: 'Account compromise via SSH brute force', likelihood: 'High', impact: 'High', treatment: 'Mitigate', owner: 'Blue team' },
      { risk: 'Data breach via SQL injection', likelihood: 'High', impact: 'High', treatment: 'Mitigate', owner: 'Blue team' },
    ],
  },
  {
    id: 'audit',
    title: 'Audit Checklist',
    purpose: 'Evidence that required controls are actually in place (CIS Controls).',
    framework: 'CIS',
    howToFill: 'For each control, mark whether it’s implemented and cite the evidence (file or screenshot) Blue produced. This is your audit trail.',
    source: "From Blue's Hardening_Checklist.txt + Lynis/CIS results.",
    columns: [
      { field: 'control', label: 'CIS Control', type: 'text', placeholder: 'CIS 4: Secure configuration' },
      { field: 'implemented', label: 'Implemented', type: 'select', options: ['Yes', 'No', 'Partial'] },
      { field: 'evidence', label: 'Evidence', type: 'text', placeholder: 'UFW_Status.txt; Lynis_Report.html' },
    ],
    seed: [
      { control: 'CIS 4: Secure configuration (firewall)', implemented: 'Yes', evidence: 'UFW_Status.txt' },
      { control: 'CIS 8: Audit log management', implemented: 'Partial', evidence: 'Win_EventLog.txt' },
    ],
  },
];

export function getRegister(id: string): RegisterDef | undefined {
  return REGISTERS.find((r) => r.id === id);
}

/** Fresh workspace seeded with the worked-example rows. */
export function seedGrcData(): GrcData {
  const data: GrcData = {};
  REGISTERS.forEach((r) => {
    data[r.id] = r.seed.map((row) => ({ ...row }));
  });
  return data;
}

/** Value for a cell, computing derived columns. */
export function cellValue(col: Column, row: RegisterRow): string {
  return col.derived ? col.derived(row) : row[col.field] ?? '';
}

function escapeCsv(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** Export a register (with its current rows) as CSV. */
export function toCSV(reg: RegisterDef, rows: RegisterRow[]): string {
  const header = reg.columns.map((c) => c.label).join(',');
  const body = rows
    .map((row) => reg.columns.map((c) => escapeCsv(cellValue(c, row))).join(','))
    .join('\n');
  return `${header}\n${body}\n`;
}

/** Export a register as a Markdown table (template + current rows). */
export function toMarkdown(reg: RegisterDef, rows: RegisterRow[]): string {
  const header = `| ${reg.columns.map((c) => c.label).join(' | ')} |`;
  const divider = `| ${reg.columns.map(() => '---').join(' | ')} |`;
  const body = rows
    .map((row) => `| ${reg.columns.map((c) => cellValue(c, row) || ' ').join(' | ')} |`)
    .join('\n');
  return `# ${reg.title}\n\n> ${reg.purpose}\n>\n> ${reg.source}\n\n${header}\n${divider}\n${body}\n`;
}
