import { Column, riskLevel } from '../grc/templates';
import { DeliverableData, DeliverableDef } from './types';

// Small helpers to keep the schema readable.
const c = (
  field: string,
  label: string,
  type: Column['type'],
  extra: Partial<Column> = {}
): Column => ({ field, label, type, ...extra });

const LMH = ['Low', 'Medium', 'High'];

/** The 8 graded deliverables (Master Package §2 & §6). */
export const DELIVERABLES: DeliverableDef[] = [
  // 1 ─────────────────────────────────────────────────────────────────────
  {
    id: 'scope_roe',
    num: 1,
    file: '01_Scope_and_RoE.md',
    title: 'Scope & Rules of Engagement',
    owner: 'grc',
    folder: '01_Case_and_Scope',
    standard: 'Rules of Engagement',
    framework: 'ISO_27001',
    weeks: [1],
    gate: 1,
    kind: 'template',
    exportFormat: 'md',
    purpose: 'Define exactly what may be tested, when, and by whom — the ethics anchor of the engagement.',
    howTo: 'Fill every field. Nothing is tested until this is signed off. List ONLY your company’s hosts.',
    sections: [
      {
        kind: 'fields',
        fields: [
          { field: 'client', label: 'Client / environment', type: 'text', required: true, placeholder: 'CyberTex training lab' },
          { field: 'start_date', label: 'Engagement start', type: 'date', required: true },
          { field: 'end_date', label: 'Engagement end', type: 'date', required: true },
          { field: 'network_scope', label: 'Network scope', type: 'text', required: true, placeholder: '10.10.10.0/24' },
          { field: 'systems', label: 'Systems in scope', type: 'area', placeholder: 'Ubuntu DVWA host, SSH, HTTP' },
          { field: 'test_type', label: 'Test type', type: 'select', options: ['Black box', 'Grey box', 'White box'] },
          { field: 'allowed', label: 'Allowed activities', type: 'area', placeholder: 'recon, scanning, ONE exploit' },
          { field: 'prohibited', label: 'Prohibited activities', type: 'area', placeholder: 'no DoS, no destructive payloads' },
          { field: 'tools', label: 'Authorized tools', type: 'area', placeholder: 'nmap, nikto, sqlmap, hydra' },
          { field: 'authorization', label: 'Authorization / sign-off', type: 'text', required: true, placeholder: 'Instructor approved — [name]' },
        ],
      },
    ],
    dod: [{ label: 'Scope, network range and authorization are filled in', test: (d) => !!(d.fields.client && d.fields.network_scope && d.fields.authorization) }],
  },

  // 2 ─────────────────────────────────────────────────────────────────────
  {
    id: 'asset_inventory',
    num: 2,
    file: '02_Asset_Inventory.csv',
    title: 'Asset Inventory',
    owner: 'grc',
    folder: '02_Assets_and_Risk',
    standard: 'Asset inventory (NIST CSF ID.AM)',
    framework: 'NIST_CSF',
    weeks: [1],
    gate: 1,
    kind: 'form',
    exportFormat: 'csv',
    purpose: 'Every host, service and owner — you can’t protect what you don’t know you have.',
    howTo: 'One row per host Red discovered. Capture IP, services, version, OS, owner and how it was found.',
    source: "From Red's Recon_Findings / Asset_List.",
    sections: [
      {
        kind: 'group',
        group: {
          group: 'assets',
          label: 'Assets',
          columns: [
            c('hostname', 'Hostname', 'text', { placeholder: 'dvwa-vm' }),
            c('ip', 'IP address', 'text', { placeholder: '10.10.10.15' }),
            c('service', 'Service / port', 'text', { placeholder: '80/tcp HTTP' }),
            c('version', 'Version', 'text', { placeholder: 'Apache 2.4.41' }),
            c('os', 'OS', 'text', { placeholder: 'Ubuntu 20.04' }),
            c('role', 'Role / purpose', 'text', { placeholder: 'DVWA web target' }),
            c('discovered_by', 'Discovered by / how', 'text', { placeholder: 'Red / nmap' }),
            c('notes', 'Notes', 'text', { placeholder: 'default install' }),
          ],
          seed: [
            { hostname: 'dvwa-vm', ip: '10.10.10.15', service: '80/tcp HTTP', version: 'Apache 2.4.41', os: 'Ubuntu 20.04', role: 'DVWA web target', discovered_by: 'Red / nmap', notes: 'default install' },
          ],
        },
      },
    ],
    dod: [{ label: 'At least one asset recorded', test: (d) => (d.groups.assets?.length ?? 0) >= 1 }],
  },

  // 3 ─────────────────────────────────────────────────────────────────────
  {
    id: 'risk_register',
    num: 3,
    file: '03_Risk_Register.csv',
    title: 'Risk Register',
    owner: 'grc',
    folder: '02_Assets_and_Risk',
    standard: 'NIST SP 800-30 / ISO 27005',
    framework: 'NIST_CSF',
    weeks: [2],
    gate: 2,
    kind: 'form',
    exportFormat: 'csv',
    purpose: 'Business risk = likelihood × impact, with a treatment decision, owner and target date (POA&M).',
    howTo: 'Turn each high vulnerability/threat into a risk. Pick Likelihood and Impact — the Rating is computed.',
    source: 'From the Asset Inventory × Red findings; Blue controls lower it.',
    sections: [
      {
        kind: 'group',
        group: {
          group: 'risks',
          label: 'Risks',
          columns: [
            c('risk_id', 'Risk ID', 'text', { placeholder: 'R-01' }),
            c('asset', 'Asset affected', 'text', { placeholder: 'DVWA web app' }),
            c('threat', 'Threat (STRIDE / actor)', 'text', { placeholder: 'Tampering / external attacker' }),
            c('vulnerability', 'Vulnerability', 'text', { placeholder: 'SQL injection in login' }),
            c('likelihood', 'Likelihood', 'select', { options: LMH }),
            c('impact', 'Impact', 'select', { options: LMH }),
            c('rating', 'Risk rating', 'text', { derived: (r) => riskLevel(r.likelihood ?? '', r.impact ?? '') }),
            c('treatment', 'Treatment', 'select', { options: ['Mitigate', 'Accept', 'Transfer', 'Avoid'] }),
            c('owner', 'Owner', 'text', { placeholder: 'Blue team' }),
            c('status', 'Status', 'select', { options: ['Open', 'In progress', 'Closed'] }),
            c('target_date', 'Target date', 'text', { placeholder: '2026-02-21' }),
          ],
          seed: [
            { risk_id: 'R-01', asset: 'DVWA web app', threat: 'Tampering / external attacker', vulnerability: 'SQL injection in login', likelihood: 'High', impact: 'High', treatment: 'Mitigate', owner: 'Blue team', status: 'Open', target_date: '2026-02-21' },
          ],
        },
      },
    ],
    dod: [{ label: 'At least one risk recorded', test: (d) => (d.groups.risks?.length ?? 0) >= 1 }],
  },

  // 4 ─────────────────────────────────────────────────────────────────────
  {
    id: 'hardening_baseline',
    num: 4,
    file: '04_Hardening_Baseline.md',
    title: 'Hardening Baseline',
    owner: 'blue',
    folder: '03_Security_Setup',
    standard: 'CIS Benchmark',
    framework: 'CIS',
    weeks: [1, 2],
    gate: 2,
    kind: 'checklist',
    exportFormat: 'md',
    purpose: 'Evidence that required controls are in place. Group items under Users/Auth · Firewall · Logging · Updates · Services.',
    howTo: 'For each control, mark Done and cite the command/screenshot evidence and CIS mapping.',
    source: 'From your hardening work (UFW, fail2ban, Lynis, Defender, …).',
    sections: [
      {
        kind: 'group',
        group: {
          group: 'controls',
          label: 'Controls',
          columns: [
            c('control', 'Control item', 'text', { placeholder: 'Non-root admin user created' }),
            c('done', 'Done?', 'select', { options: ['Yes', 'No', 'N/A'] }),
            c('evidence', 'Evidence', 'text', { placeholder: 'cat /etc/passwd screenshot' }),
            c('cis', 'CIS mapping', 'text', { placeholder: 'CIS 5.x Access Control' }),
          ],
          seed: [
            { control: 'Firewall: default-deny inbound (UFW)', done: 'Yes', evidence: 'UFW_Status.txt', cis: 'CIS 4 Secure configuration' },
            { control: 'Logging enabled & reviewed', done: 'Partial', evidence: 'Win_EventLog.txt', cis: 'CIS 8 Audit log management' },
          ],
        },
      },
    ],
    dod: [
      {
        label: 'Firewall and logging controls marked done with evidence',
        test: (d) => {
          const rows = d.groups.controls ?? [];
          const ok = (kw: string) => rows.some((r) => (r.control ?? '').toLowerCase().includes(kw) && r.done === 'Yes' && !!r.evidence);
          return ok('firewall') && ok('log');
        },
      },
    ],
  },

  // 5 ─────────────────────────────────────────────────────────────────────
  {
    id: 'change_log',
    num: 5,
    file: '05_Change_Log.md',
    title: 'Change Log',
    owner: 'blue',
    folder: '03_Security_Setup',
    standard: 'ITIL change record',
    framework: 'ISO_27001',
    weeks: [1, 2],
    kind: 'form',
    exportFormat: 'md',
    purpose: 'A dated record of every change you make to the systems — who, what, why, and the proof.',
    howTo: 'Append a row each time you change a system. Keep it factual and evidence-backed.',
    sections: [
      {
        kind: 'group',
        group: {
          group: 'changes',
          label: 'Changes',
          columns: [
            c('date', 'Date', 'text', { placeholder: '2026-02-05' }),
            c('change', 'Change made', 'text', { placeholder: 'Enabled UFW (allow 22,80)' }),
            c('who', 'Who', 'text', { placeholder: 'Blue team' }),
            c('reason', 'Reason', 'text', { placeholder: 'network protection' }),
            c('evidence', 'Evidence', 'text', { placeholder: 'ufw status output' }),
          ],
          seed: [
            { date: '2026-02-05', change: 'Enabled UFW (allow 22, 80)', who: 'Blue team', reason: 'network protection', evidence: 'ufw status output' },
          ],
        },
      },
    ],
  },

  // 6 ─────────────────────────────────────────────────────────────────────
  {
    id: 'pentest_report',
    num: 6,
    file: '06_Pentest_Report.md',
    title: 'Penetration Test Report',
    owner: 'red',
    folder: '04_Testing_and_Findings',
    standard: 'PTES / NIST SP 800-115',
    framework: 'NIST_800_115',
    weeks: [2, 3],
    gate: 3,
    kind: 'form',
    exportFormat: 'md',
    purpose: 'Document each finding with proof and a fix, wrapped in an executive summary and methodology.',
    howTo: 'Fill the wrapper once, then add one row per finding: command, evidence, screenshot name, impact and remediation.',
    source: 'From your scans and exploits (nmap, nikto, sqlmap, hydra).',
    sections: [
      {
        kind: 'fields',
        title: 'Report wrapper',
        fields: [
          { field: 'team', label: 'Team', type: 'text', placeholder: 'Team01' },
          { field: 'date', label: 'Date', type: 'date' },
          { field: 'exec_summary', label: 'Executive summary', type: 'area', placeholder: '1 critical, 2 high; auth bypass possible' },
          { field: 'scope_recap', label: 'Scope recap', type: 'text', placeholder: 'DVWA + Ubuntu, 10.10.10.0/24' },
          { field: 'methodology', label: 'Methodology', type: 'area', placeholder: 'Recon → scan → exploit (PTES)' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'findings',
          label: 'Findings',
          help: 'One row per finding. Capture the exact command and the proof.',
          columns: [
            c('title', 'Finding title', 'text', { placeholder: 'SQL injection — auth bypass' }),
            c('severity', 'Severity', 'select', { options: ['Critical', 'High', 'Medium', 'Low', 'Info'] }),
            c('target', 'Affected target', 'text', { placeholder: '10.10.10.15 / DVWA' }),
            c('tool', 'Tool used', 'text', { placeholder: 'sqlmap' }),
            c('command', 'Command run', 'text', { placeholder: 'sqlmap -u ... --dump' }),
            c('evidence', 'Evidence (output)', 'text', { placeholder: 'dumped users table' }),
            c('screenshot', 'Screenshot', 'text', { placeholder: '20260217_Team01_sqlmap_dump.png' }),
            c('impact', 'Impact', 'text', { placeholder: 'unauthorized DB access' }),
            c('remediation', 'Remediation', 'text', { placeholder: 'parameterized queries' }),
            c('reference', 'Reference', 'text', { placeholder: 'OWASP A03 Injection' }),
            c('cvss', 'CVSS', 'number', { placeholder: '9.8' }),
          ],
          seed: [
            { title: 'SQL injection — auth bypass', severity: 'Critical', target: '10.10.10.15 / DVWA', tool: 'sqlmap', command: 'sqlmap -u "http://10.10.10.15/login" --dump', evidence: 'dumped users table', screenshot: '20260217_Team01_sqlmap_dump.png', impact: 'unauthorized DB access', remediation: 'parameterized queries / WAF', reference: 'OWASP A03 Injection', cvss: '9.8' },
          ],
        },
      },
    ],
    dod: [
      {
        label: 'At least one fully documented finding (title, severity, evidence, screenshot)',
        test: (d) => (d.groups.findings ?? []).some((f) => f.title && f.severity && f.evidence && f.screenshot),
      },
    ],
  },

  // 7 ─────────────────────────────────────────────────────────────────────
  {
    id: 'incident_report',
    num: 7,
    file: '07_Incident_Report.md',
    title: 'Incident Report',
    owner: 'blue',
    folder: '04_Testing_and_Findings',
    standard: 'NIST SP 800-61',
    framework: 'NIST_800_61',
    weeks: [3],
    gate: 3,
    kind: 'form',
    exportFormat: 'md',
    purpose: 'The story of the attack with indicators of compromise and a tamper-evident evidence log.',
    howTo: 'Describe what happened, then fill the IoC table and the Evidence log (hash every artifact).',
    source: "From Blue's live detection + Red's attack.",
    sections: [
      {
        kind: 'fields',
        fields: [
          { field: 'title', label: 'Incident title', type: 'text', placeholder: 'SQLi against DVWA' },
          { field: 'detected_at', label: 'Detected (date/time)', type: 'text', placeholder: '2026-02-17 14:22' },
          { field: 'detected_by', label: 'Detected by / method', type: 'text', placeholder: 'Blue / Apache log analysis' },
          { field: 'what_happened', label: 'What happened', type: 'area', placeholder: 'attacker dumped users table' },
          { field: 'containment', label: 'Containment', type: 'area', placeholder: 'ufw deny from 10.10.10.5' },
          { field: 'recovery', label: 'Recovery', type: 'area', placeholder: 'patched query, restarted Apache' },
          { field: 'lessons', label: 'Lessons learned', type: 'area', placeholder: 'add WAF, alert on UNION' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'iocs',
          label: 'Indicators of compromise (IoC)',
          columns: [
            c('timestamp', 'Timestamp', 'text', { placeholder: '14:22' }),
            c('source_ip', 'Source IP', 'text', { placeholder: '10.10.10.5' }),
            c('attack_type', 'Attack type', 'text', { placeholder: 'SQLi' }),
            c('evidence_line', 'Evidence line', 'text', { placeholder: 'UNION SELECT ...' }),
            c('log_source', 'Log source', 'text', { placeholder: 'access.log' }),
          ],
          seed: [
            { timestamp: '14:22', source_ip: '10.10.10.5', attack_type: 'SQLi', evidence_line: 'UNION SELECT', log_source: 'access.log' },
          ],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'evidence',
          label: 'Evidence log (chain of custody)',
          help: 'Hash every artifact with sha256sum so integrity is provable.',
          columns: [
            c('evidence_id', 'Evidence ID', 'text', { placeholder: 'E-01' }),
            c('description', 'Description', 'text', { placeholder: 'attack.pcap' }),
            c('collected_by', 'Collected by', 'text', { placeholder: 'Blue' }),
            c('datetime', 'Date/time', 'text', { placeholder: '14:22' }),
            c('location', 'Location', 'text', { placeholder: '/home/team01' }),
            c('sha256', 'SHA256', 'text', { placeholder: 'c5b9…' }),
          ],
          seed: [
            { evidence_id: 'E-01', description: 'attack.pcap', collected_by: 'Blue', datetime: '14:22', location: '/home/team01', sha256: 'c5b9…' },
          ],
        },
      },
    ],
    dod: [
      {
        label: 'IoC table and evidence log each have a row with a SHA256',
        test: (d) => (d.groups.iocs?.length ?? 0) >= 1 && (d.groups.evidence ?? []).some((e) => !!e.sha256),
      },
    ],
  },

  // 8 ─────────────────────────────────────────────────────────────────────
  {
    id: 'final_report',
    num: 8,
    file: '08_Final_Report_and_Briefing.md',
    title: 'Final Report & Briefing',
    owner: 'grc',
    folder: '05_Reporting',
    standard: 'ISO 27001 reporting',
    framework: 'ISO_27001',
    weeks: [4],
    kind: 'template',
    exportFormat: 'md',
    purpose: 'The board-level wrap-up: overall risk, key findings, and a prioritized remediation roadmap.',
    howTo: 'Pull from the other deliverables. Keep the executive summary non-technical.',
    source: 'From the Pentest Report, Risk Register and Incident Report.',
    sections: [
      {
        kind: 'fields',
        fields: [
          { field: 'exec_summary', label: 'Executive summary', type: 'area', placeholder: '1 critical, 2 high; auth bypass possible' },
          { field: 'scope_recap', label: 'Scope recap', type: 'text', placeholder: 'DVWA + Ubuntu, 10.10.10.0/24' },
          { field: 'key_findings', label: 'Key findings', type: 'area', placeholder: 'SQLi, HTTP-only, open SSH' },
          { field: 'risk_overview', label: 'Risk overview', type: 'area', placeholder: '1 Critical, 2 High, 1 Medium' },
          { field: 'remediation_roadmap', label: 'Remediation roadmap', type: 'area', placeholder: 'SQLi (wk1), HTTPS (wk2), SSH (wk2)' },
          { field: 'detection_response', label: 'Detection & response', type: 'area', placeholder: 'logs + Fail2Ban; NIST 800-61' },
          { field: 'slides_outline', label: 'Slides outline', type: 'area', placeholder: 'title → exec → findings → fixes → Q&A' },
        ],
      },
    ],
  },
];

export function getDeliverable(id: string): DeliverableDef | undefined {
  return DELIVERABLES.find((d) => d.id === id);
}

export function deliverablesForRole(role: string): DeliverableDef[] {
  return DELIVERABLES.filter((d) => d.owner === role);
}

/** Build a deliverable's starting data from its seed (example) rows/fields. */
export function seedDeliverable(def: DeliverableDef): DeliverableData {
  const data: DeliverableData = { fields: {}, groups: {} };
  def.sections.forEach((s) => {
    if (s.kind === 'group') data.groups[s.group.group] = (s.group.seed ?? []).map((r) => ({ ...r }));
  });
  return data;
}
