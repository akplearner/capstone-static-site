import { Column, riskLevel } from '../grc/templates';
import { DeliverableData, DeliverableDef } from './types';
import { CUSTODY_RULES } from './custodyTemplate';
import { MSSP_DELIVERABLES } from './msspDeliverables';
import { CYSA_DELIVERABLES } from './cysaDeliverables';
import { EVIDENCE_NAMING, EVIDENCE_WORKING_DIR } from '../evidence';

// Small helpers to keep the schema readable.
const c = (
  field: string,
  label: string,
  type: Column['type'],
  extra: Partial<Column> = {}
): Column => ({ field, label, type, ...extra });

const LMH = ['Low', 'Medium', 'High'];

/** The Security+ graded deliverables (Master Package §2 & §6): the 8 core reports
 *  plus the GRC SOP/policy forms (Framework Mapping, Security Policy, Hardening
 *  Standard, VM SOP, IR Runbook) and the team Evidence Log. These carry no explicit
 *  `courseId` (defaulting to 'security-plus'); other courses tag theirs explicitly. */
const SECURITY_PLUS_DELIVERABLES: DeliverableDef[] = [
  // 1 ─────────────────────────────────────────────────────────────────────
  {
    id: 'scope_roe',
    // Authorized scope is what every later document is bounded by.
    feeds: ['framework_mapping', 'security_policy'],
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
    dod: [
      { label: 'Scope, network range and authorization are filled in', test: (d) => !!(d.fields.client && d.fields.network_scope && d.fields.authorization) },
      { label: 'Engagement start date is set', test: (d) => !!d.fields.start_date },
    ],
  },

  // 2 ─────────────────────────────────────────────────────────────────────
  {
    id: 'asset_inventory',
    // Risk is assessed per asset.
    feeds: ['risk_register'],
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
            c('ip', 'IP address', 'text', { placeholder: '10.10.10.5' }),
            c('service', 'Service / port', 'text', { placeholder: '80/tcp HTTP' }),
            c('version', 'Version', 'text', { placeholder: 'Apache 2.4.41' }),
            c('os', 'OS', 'text', { placeholder: 'Ubuntu 20.04' }),
            c('role', 'Role / purpose', 'text', { placeholder: 'DVWA web target' }),
            c('discovered_by', 'Discovered by / how', 'text', { placeholder: 'Red / nmap' }),
            c('evidence', 'Evidence (scan output)', 'text', { placeholder: 'Nmap_Scan.txt' }),
            c('notes', 'Notes', 'text', { placeholder: 'default install' }),
          ],
          seed: [
            { hostname: 'dvwa-vm', ip: '10.10.10.5', service: '80/tcp HTTP', version: 'Apache 2.4.41', os: 'Ubuntu 20.04', role: 'DVWA web target', discovered_by: 'Red / nmap', evidence: 'Nmap_Scan.txt', notes: 'default install' },
          ],
        },
      },
    ],
    dod: [
      { label: 'At least one asset recorded', test: (d) => (d.groups.assets?.length ?? 0) >= 1 },
      { label: 'Every asset has an IP and hostname', test: (d) => (d.groups.assets?.length ?? 0) >= 1 && (d.groups.assets ?? []).every((a) => !!a.ip && !!a.hostname) },
    ],
  },

  // 3 ─────────────────────────────────────────────────────────────────────
  {
    id: 'risk_register',
    // Severities drive the remediation SOP and the final report.
    feeds: ['vm_sop', 'final_report'],
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
            c('evidence', 'Evidence / proof', 'text', { placeholder: 'SQL_Injection_Proof.txt' }),
            c('likelihood', 'Likelihood', 'select', { options: LMH }),
            c('impact', 'Impact', 'select', { options: LMH }),
            c('rating', 'Risk rating', 'text', { derived: (r) => riskLevel(r.likelihood ?? '', r.impact ?? '') }),
            c('treatment', 'Treatment', 'select', { options: ['Mitigate', 'Accept', 'Transfer', 'Avoid'] }),
            c('owner', 'Owner', 'text', { placeholder: 'Blue team' }),
            c('status', 'Status', 'select', { options: ['Open', 'In progress', 'Closed'] }),
            c('target_date', 'Target date', 'date'),
          ],
          seed: [
            { risk_id: 'R-01', asset: 'DVWA web app', threat: 'Tampering / external attacker', vulnerability: 'SQL injection in login', likelihood: 'High', impact: 'High', treatment: 'Mitigate', owner: 'Blue team', status: 'Open', target_date: '2026-02-21' },
          ],
        },
      },
    ],
    dod: [
      { label: 'At least one risk recorded', test: (d) => (d.groups.risks?.length ?? 0) >= 1 },
      { label: 'Every risk has likelihood, impact and a treatment decision', test: (d) => (d.groups.risks?.length ?? 0) >= 1 && (d.groups.risks ?? []).every((r) => !!r.likelihood && !!r.impact && !!r.treatment) },
    ],
  },

  // 4 ─────────────────────────────────────────────────────────────────────
  {
    id: 'hardening_baseline',
    // Applied controls lower the residual risk.
    feeds: ['change_log', 'risk_register'],
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
            { control: 'Logging enabled & reviewed', done: 'Yes', evidence: 'Win_EventLog.txt', cis: 'CIS 8 Audit log management' },
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
      {
        label: 'At least 3 controls marked Done with evidence',
        test: (d) => (d.groups.controls ?? []).filter((r) => r.done === 'Yes' && !!r.evidence).length >= 3,
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
            c('date', 'Date', 'date'),
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
    dod: [
      { label: 'At least one change logged with date and evidence', test: (d) => (d.groups.changes ?? []).some((r) => !!r.date && !!r.change && !!r.evidence) },
    ],
  },

  // 6 ─────────────────────────────────────────────────────────────────────
  {
    id: 'pentest_report',
    // Red's findings drive the risk ratings, the incident and the write-up.
    feeds: ['risk_register', 'incident_report', 'final_report'],
    num: 6,
    file: '06_Pentest_Report.md',
    title: 'Penetration Test Report',
    owner: 'red',
    folder: '04_Testing_and_Findings',
    standard: 'PTES / NIST SP 800-115',
    framework: 'NIST_800_115',
    weeks: [2, 3],
    gate: 3,
    requiresAuth: true,
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
          { field: 'exec_summary', label: 'Executive summary', type: 'area', placeholder: '1 critical, 2 high; auth bypass possible', help: 'Non-technical, 3–4 sentences: how many findings and how serious, plus the one thing leadership should care about.' },
          { field: 'scope_recap', label: 'Scope recap', type: 'text', placeholder: 'DVWA + Ubuntu, 10.10.10.0/24' },
          { field: 'methodology', label: 'Methodology', type: 'area', placeholder: 'Recon → scan → exploit (PTES)', help: 'The approach you followed in order, e.g. "Recon → scanning → exploitation (PTES)". One or two lines.' },
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
            c('target', 'Affected target', 'text', { placeholder: '10.10.10.5 / DVWA' }),
            c('tool', 'Tool used', 'text', { placeholder: 'sqlmap' }),
            c('command', 'Command run', 'text', { placeholder: 'sqlmap -u ... --dump' }),
            c('evidence', 'Evidence (output)', 'area', { placeholder: 'dumped users table' }),
            c('screenshot', 'Screenshot', 'text', { placeholder: '20260217_Team01_sqlmap_dump.png' }),
            c('impact', 'Impact', 'area', { placeholder: 'unauthorized DB access' }),
            c('remediation', 'Remediation (how to fix)', 'area', { placeholder: 'parameterized queries' }),
            c('detection', 'What to look for (detection)', 'area', { placeholder: 'UNION/SELECT in access.log; alert on SQL keywords' }),
            c('reference', 'Reference', 'text', { placeholder: 'OWASP A03 Injection' }),
            c('cvss', 'CVSS', 'number', { placeholder: '9.8' }),
          ],
          seed: [
            { title: 'SQL injection — auth bypass', severity: 'Critical', target: '10.10.10.5 / DVWA', tool: 'sqlmap', command: 'sqlmap -u "http://10.10.10.5/login" --dump', evidence: 'dumped users table', screenshot: '20260217_Team01_sqlmap_dump.png', impact: 'unauthorized DB access', remediation: 'parameterized queries / WAF', detection: 'UNION/SELECT strings in Apache access.log; spike of 500s on /login', reference: 'OWASP A03 Injection', cvss: '9.8' },
          ],
        },
      },
    ],
    dod: [
      {
        label: 'At least one fully documented finding (title, severity, evidence, screenshot)',
        test: (d) => (d.groups.findings ?? []).some((f) => f.title && f.severity && f.evidence && f.screenshot),
      },
      {
        label: 'Executive summary written and every finding has a remediation',
        test: (d) => !!d.fields.exec_summary && (d.groups.findings ?? []).length >= 1 && (d.groups.findings ?? []).every((f) => !!f.remediation),
      },
    ],
  },

  // 7 ─────────────────────────────────────────────────────────────────────
  {
    id: 'incident_report',
    // The live incident is what the runbook is written from.
    feeds: ['final_report', 'ir_runbook'],
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
          { field: 'what_happened', label: 'What happened', type: 'area', placeholder: 'attacker dumped users table', help: 'Tell the story in plain English: what the attacker did, step by step, and what they achieved.' },
          { field: 'containment', label: 'Containment', type: 'area', placeholder: 'ufw deny from 10.10.10.5', help: 'What you did to STOP it (e.g. blocked the IP, disabled the account). Include the exact command if you have it.' },
          { field: 'recovery', label: 'Recovery', type: 'area', placeholder: 'patched query, restarted Apache', help: 'How you returned to normal — patched the bug, restarted the service, restored from backup.' },
          { field: 'lessons', label: 'Lessons learned', type: 'area', placeholder: 'add WAF, alert on UNION', help: 'What would prevent this next time (e.g. add a WAF, alert on UNION in logs, enforce account lockout).' },
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
      {
        label: 'What happened and containment are described',
        test: (d) => !!d.fields.what_happened && !!d.fields.containment,
      },
    ],
  },

  // 8 ─────────────────────────────────────────────────────────────────────
  {
    id: 'final_report',
    capstone: true,
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
          { field: 'exec_summary', label: 'Executive summary', type: 'area', placeholder: '1 critical, 2 high; auth bypass possible', help: 'Non-technical, 3–4 sentences: how many findings and how serious, plus the one thing leadership should care about.' },
          { field: 'scope_recap', label: 'Scope recap', type: 'text', placeholder: 'DVWA + Ubuntu, 10.10.10.0/24' },
          { field: 'key_findings', label: 'Key findings', type: 'area', placeholder: 'SQLi, HTTP-only, open SSH', help: 'The top issues as a short list, pulled from the Pentest Report — most serious first.' },
          { field: 'risk_overview', label: 'Risk overview', type: 'area', placeholder: '1 Critical, 2 High, 1 Medium', help: 'A count by severity from your Risk Register, e.g. "1 Critical, 2 High, 1 Medium".' },
          { field: 'remediation_roadmap', label: 'Remediation roadmap', type: 'area', placeholder: 'SQLi (wk1), HTTPS (wk2), SSH (wk2)', help: 'The fixes in priority order with rough timing, e.g. "SQLi now, HTTPS this week, SSH keys next".' },
          { field: 'detection_response', label: 'Detection & response', type: 'area', placeholder: 'logs + Fail2Ban; NIST 800-61', help: 'How the team detected and responded, and what monitoring stays in place (map to NIST 800-61).' },
          { field: 'slides_outline', label: 'Slides outline', type: 'area', placeholder: 'title → exec → findings → fixes → Q&A' },
        ],
      },
    ],
    dod: [
      { label: 'Executive summary, key findings and remediation roadmap are filled in', test: (d) => !!(d.fields.exec_summary && d.fields.key_findings && d.fields.remediation_roadmap) },
    ],
  },

  // 9 ── Framework Mapping (GRC) ───────────────────────────────────────────
  {
    id: 'framework_mapping',
    // Control coverage informs the register.
    feeds: ['risk_register'],
    num: 9,
    file: '09_Framework_Mapping.md',
    title: 'Framework Mapping',
    owner: 'grc',
    folder: '02_Assets_and_Risk',
    standard: 'NIST CSF + CIS Controls',
    framework: 'NIST_CSF',
    weeks: [1],
    kind: 'form',
    exportFormat: 'md',
    purpose: 'Map each finding/control to the published framework codes so coverage is auditable — the join key auditors reuse.',
    howTo: 'One row per finding or control. Pick the NIST CSF function and cite the specific NIST + CIS codes it satisfies.',
    source: 'From Red’s Recon/scan findings and Blue’s hardening.',
    sections: [
      {
        kind: 'group',
        group: {
          group: 'mappings',
          label: 'Framework mappings',
          help: 'NIST CSF functions: Identify (ID), Protect (PR), Detect (DE), Respond (RS), Recover (RC).',
          columns: [
            c('finding', 'Finding / control', 'text', { placeholder: 'SQL injection on /login' }),
            c('nist_function', 'NIST CSF function', 'select', { options: ['Identify', 'Protect', 'Detect', 'Respond', 'Recover'] }),
            c('nist_control', 'NIST control', 'text', { placeholder: 'PR.IP-1 / DE.CM-7' }),
            c('cis_control', 'CIS control', 'text', { placeholder: 'CIS 16 Application Software Security' }),
            c('status', 'Status', 'select', { options: ['Open', 'Mitigated', 'Accepted'] }),
          ],
          seed: [
            { finding: 'SQL injection on /login', nist_function: 'Protect', nist_control: 'PR.IP-1', cis_control: 'CIS 16 Application Software Security', status: 'Open' },
            { finding: 'No inbound firewall (pre-hardening)', nist_function: 'Protect', nist_control: 'PR.AC-5', cis_control: 'CIS 4 Secure Configuration', status: 'Mitigated' },
          ],
        },
      },
    ],
    dod: [
      { label: 'At least 2 findings mapped to NIST + CIS codes', test: (d) => (d.groups.mappings?.length ?? 0) >= 2 && (d.groups.mappings ?? []).every((r) => !!r.nist_control && !!r.cis_control) },
    ],
  },

  // 10 ── Lab Security Policy (GRC) ────────────────────────────────────────
  {
    id: 'security_policy',
    // The standard is derived from the policy.
    feeds: ['hardening_standard'],
    num: 10,
    file: '10_Lab_Security_Policy.md',
    title: 'Lab Security Policy',
    owner: 'grc',
    folder: '01_Case_and_Scope',
    standard: 'ISO 27001 policy',
    framework: 'ISO_27001',
    weeks: [1],
    kind: 'template',
    exportFormat: 'md',
    purpose: 'The baseline rules every host in the engagement must meet — the standard Blue implements and the Final Report cites.',
    howTo: 'Set the version/owner, then add one row per rule with its rationale. Keep rules testable (a control can pass/fail it).',
    sections: [
      {
        kind: 'fields',
        fields: [
          { field: 'version', label: 'Version', type: 'text', placeholder: '1.0', required: true },
          { field: 'owner', label: 'Policy owner', type: 'text', placeholder: 'GRC lead' },
          { field: 'effective_date', label: 'Effective date', type: 'date' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'policies',
          label: 'Policy statements',
          columns: [
            c('area', 'Area', 'text', { placeholder: 'Access control' }),
            c('rule', 'Rule', 'text', { placeholder: 'No direct root SSH; key-based auth only' }),
            c('rationale', 'Rationale', 'text', { placeholder: 'Limits brute-force and lateral movement' }),
          ],
          seed: [
            { area: 'Access control', rule: 'No direct root SSH; key-based auth only', rationale: 'Limits brute-force and lateral movement' },
            { area: 'Network', rule: 'Default-deny inbound firewall; only required ports open', rationale: 'Reduces attack surface' },
            { area: 'Logging', rule: 'Security/auth logging enabled and retained', rationale: 'Enables detection and forensics' },
          ],
        },
      },
    ],
    dod: [
      { label: 'Version set and at least 3 policy statements', test: (d) => !!d.fields.version && (d.groups.policies?.length ?? 0) >= 3 },
    ],
  },

  // 11 ── Hardening Standard (GRC → Blue) ──────────────────────────────────
  {
    id: 'hardening_standard',
    // The baseline implements the standard.
    feeds: ['hardening_baseline'],
    num: 11,
    file: '11_Hardening_Standard.md',
    title: 'Hardening Standard',
    owner: 'grc',
    folder: '03_Security_Setup',
    standard: 'CIS Benchmark',
    framework: 'CIS',
    weeks: [1],
    gate: 2,
    kind: 'checklist',
    exportFormat: 'md',
    purpose: 'The specific controls GRC ISSUES to Blue to implement (distinct from Blue’s Hardening Baseline, which records what was done).',
    howTo: 'List each required control, which OS it applies to, the exact setting, and the CIS reference. Blue implements these and reports back in the Hardening Baseline.',
    source: 'Derived from the Lab Security Policy + CIS Benchmarks.',
    sections: [
      {
        kind: 'fields',
        fields: [
          { field: 'purpose', label: 'Purpose', type: 'area', placeholder: 'Minimum controls both company hosts must meet before testing.', help: 'One or two lines on what this standard enforces and who must follow it.' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'controls',
          label: 'Required controls',
          columns: [
            c('control', 'Control', 'text', { placeholder: 'Enable host firewall (default deny)' }),
            c('os', 'Applies to', 'select', { options: ['Ubuntu', 'Windows', 'Both'] }),
            c('setting', 'Required setting', 'text', { placeholder: 'UFW default deny incoming; allow 22,80' }),
            c('cis_ref', 'CIS reference', 'text', { placeholder: 'CIS 4 Secure Configuration' }),
          ],
          seed: [
            { control: 'Host firewall enabled (default deny)', os: 'Both', setting: 'UFW default deny incoming; allow 22,80 / Windows Firewall on', cis_ref: 'CIS 4' },
            { control: 'Disable legacy SMBv1', os: 'Windows', setting: 'Remove SMB1Protocol feature', cis_ref: 'CIS 4' },
            { control: 'Brute-force protection', os: 'Ubuntu', setting: 'fail2ban running & enabled', cis_ref: 'CIS 5' },
          ],
        },
      },
    ],
    dod: [
      { label: 'Purpose set and at least 3 required controls with CIS refs', test: (d) => !!d.fields.purpose && (d.groups.controls?.length ?? 0) >= 3 && (d.groups.controls ?? []).every((r) => !!r.setting) },
    ],
  },

  // 12 ── Vulnerability-Management SOP (GRC → Blue) ─────────────────────────
  {
    id: 'vm_sop',
    num: 12,
    file: '12_VM_SOP.md',
    title: 'Vulnerability-Management SOP',
    owner: 'grc',
    folder: '03_Security_Setup',
    standard: 'NIST SP 800-40',
    framework: 'NIST_CSF',
    weeks: [2],
    kind: 'template',
    exportFormat: 'md',
    purpose: 'The repeatable process Blue follows to triage and remediate vulnerabilities, with a priority rule tied to severity.',
    howTo: 'State purpose/scope and the priority rule, then list the ordered process steps with an owner and target time (SLA).',
    source: 'From the Risk Register severities + Red’s findings.',
    sections: [
      {
        kind: 'fields',
        fields: [
          { field: 'purpose', label: 'Purpose', type: 'area', placeholder: 'How vulnerabilities are found, ranked, fixed and verified.', help: 'One or two lines: what this SOP governs.' },
          { field: 'scope', label: 'Scope', type: 'text', placeholder: 'Both company hosts (Ubuntu + Windows)' },
          { field: 'priority_rule', label: 'Priority rule', type: 'area', placeholder: 'Critical: fix in 24h · High: 3 days · Medium: 1 week', help: 'How severity maps to a fix deadline.' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'steps',
          label: 'Process steps',
          columns: [
            c('step_no', 'Step', 'text', { placeholder: '1' }),
            c('action', 'Action', 'text', { placeholder: 'Confirm the finding and assign a severity' }),
            c('owner', 'Owner', 'text', { placeholder: 'Blue' }),
            c('sla', 'Target time', 'text', { placeholder: '24h for Critical' }),
          ],
          seed: [
            { step_no: '1', action: 'Confirm the finding from Red’s report and assign a severity', owner: 'Blue', sla: 'same day' },
            { step_no: '2', action: 'Apply the fix (patch/config) and record it in the Change Log', owner: 'Blue', sla: 'per priority rule' },
            { step_no: '3', action: 'Re-test to verify the vulnerability is closed', owner: 'Blue', sla: 'after fix' },
            { step_no: '4', action: 'Update the Risk Register status to Mitigated', owner: 'GRC', sla: 'weekly' },
          ],
        },
      },
    ],
    dod: [
      { label: 'Purpose + priority rule set and at least 3 process steps', test: (d) => !!d.fields.purpose && !!d.fields.priority_rule && (d.groups.steps?.length ?? 0) >= 3 },
    ],
  },

  // 13 ── Incident-Response Runbook (GRC → Blue) ───────────────────────────
  {
    id: 'ir_runbook',
    num: 13,
    file: '13_IR_Runbook.md',
    title: 'Incident-Response Runbook',
    owner: 'grc',
    folder: '04_Testing_and_Findings',
    standard: 'NIST SP 800-61',
    framework: 'NIST_800_61',
    weeks: [3],
    kind: 'template',
    exportFormat: 'md',
    purpose: 'The step-by-step actions Blue follows the moment an attack is detected — issued before the breach, not after.',
    howTo: 'Add one row per action, tagged to a NIST 800-61 phase (Detect → Contain → Eradicate → Recover → Report), with an owner.',
    source: 'From NIST 800-61 + your detections and containment plan.',
    sections: [
      {
        kind: 'fields',
        fields: [
          { field: 'purpose', label: 'Purpose', type: 'area', placeholder: 'The playbook Blue runs during an incident.', help: 'One line on when this runbook is triggered.' },
          { field: 'roles', label: 'Who does what', type: 'area', placeholder: 'Blue = detect/contain; GRC = evidence/custody; Red = stand down', help: 'The responder roles during an incident.' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'steps',
          label: 'Runbook steps',
          columns: [
            c('phase', 'Phase', 'select', { options: ['Detect', 'Contain', 'Eradicate', 'Recover', 'Report'] }),
            c('action', 'Action', 'text', { placeholder: 'Grep logs for UNION/SELECT; confirm attacker IP' }),
            c('owner', 'Owner', 'text', { placeholder: 'Blue' }),
          ],
          seed: [
            { phase: 'Detect', action: 'Spot the attack in logs/pcap (e.g. UNION/SELECT, 4625 spike); note attacker IP + time', owner: 'Blue' },
            { phase: 'Contain', action: 'Block the attacker IP (ufw deny / Windows firewall rule); preserve the capture', owner: 'Blue' },
            { phase: 'Eradicate', action: 'Fix the exploited weakness (patch/config); remove any dropped files', owner: 'Blue' },
            { phase: 'Recover', action: 'Restore normal service and confirm monitoring is back on', owner: 'Blue' },
            { phase: 'Report', action: 'Hash + log all evidence; write the Incident Report', owner: 'GRC' },
          ],
        },
      },
    ],
    dod: [
      { label: 'Purpose set and steps cover Detect, Contain and Report', test: (d) => !!d.fields.purpose && ['Detect', 'Contain', 'Report'].every((p) => (d.groups.steps ?? []).some((r) => r.phase === p)) },
    ],
  },

  // 14 ── Evidence Log / Chain of Custody (team) ───────────────────────────
  {
    id: 'evidence_log',
    // Custody-tracked artefacts back the report's claims.
    feeds: ['final_report'],
    num: 14,
    file: '14_Evidence_Log.csv',
    title: 'Evidence Log',
    owner: 'grc',
    folder: '04_Testing_and_Findings',
    standard: 'NIST SP 800-61 / ISO 27037',
    framework: 'NIST_800_61',
    weeks: [3, 4],
    gate: 3,
    kind: 'form',
    exportFormat: 'csv',
    purpose: 'The team’s chain of custody — every artifact hashed, logged, and its hand-offs recorded so the evidence holds up.',
    howTo: CUSTODY_RULES.join(' '),
    source: 'From Red’s and Blue’s captured artifacts (screenshots, pcaps, proofs).',
    sections: [
      {
        kind: 'group',
        group: {
          group: 'evidence',
          label: 'Evidence log (chain of custody)',
          help: `Keep artifacts in ${EVIDENCE_WORKING_DIR}. Name them ${EVIDENCE_NAMING} and hash with sha256sum. Log every hand-off.`,
          columns: [
            c('evidence_id', 'Evidence ID', 'text', { placeholder: 'E-01' }),
            c('filename', 'Filename', 'text', { placeholder: '20260627_Team01_sqlmap_dbdump.png' }),
            c('description', 'What it proves', 'text', { placeholder: 'SQLi dumped users table' }),
            c('collected_by', 'Collected by', 'text', { placeholder: 'Red' }),
            c('datetime', 'Date/time', 'text', { placeholder: '2026-06-27 14:22' }),
            c('location', 'Location (path)', 'text', { placeholder: '~/team-artifacts/week-3/' }),
            c('sha256', 'SHA-256', 'text', { placeholder: 'c5b9… (from sha256sum)' }),
            c('transferred_to', 'Transferred to', 'text', { placeholder: 'GRC' }),
            c('transferred_at', 'Transferred (date/time)', 'text', { placeholder: '2026-06-27 15:05' }),
            c('notes', 'Notes', 'text', { placeholder: 'handed to GRC for the report' }),
          ],
          seed: [
            { evidence_id: 'E-01', filename: '20260627_Team01_sqlmap_dbdump.png', description: 'SQLi dumped users table', collected_by: 'Red', datetime: '2026-06-27 14:22', location: '~/team-artifacts/week-3/', sha256: 'c5b9…', transferred_to: 'GRC', transferred_at: '2026-06-27 15:05', notes: 'handed to GRC for the report' },
          ],
        },
      },
    ],
    dod: [
      { label: 'At least one artifact logged with a filename and SHA-256', test: (d) => (d.groups.evidence ?? []).some((e) => !!e.filename && !!e.sha256) },
    ],
  },
];

/** All deliverables across every course. Security+ first, then any additional
 *  courses (e.g. the MSSP / SOC 2 + ISO 27001 track). Consumers that render a
 *  single course MUST scope with `deliverablesForCourse` / `deliverablesForRole`
 *  so one course's forms never surface on another course's pages or ZIP. */
export const DELIVERABLES: DeliverableDef[] = [
  ...SECURITY_PLUS_DELIVERABLES,
  ...MSSP_DELIVERABLES,
  ...CYSA_DELIVERABLES,
];

/** The course a deliverable belongs to (defaults to 'security-plus'). */
export function courseIdOf(d: DeliverableDef): string {
  return d.courseId ?? 'security-plus';
}

/** Every deliverable for one course. */
export function deliverablesForCourse(courseId: string): DeliverableDef[] {
  return DELIVERABLES.filter((d) => courseIdOf(d) === courseId);
}

export function getDeliverable(id: string): DeliverableDef | undefined {
  return DELIVERABLES.find((d) => d.id === id);
}

/**
 * Whether the team's Scope & Rules of Engagement is signed off — the ethics
 * anchor that unlocks any scanning/testing deliverable. Reads the *saved*
 * authorization; the seeded example does NOT count as a real sign-off.
 */
export function isTeamAuthorized(saved: Record<string, DeliverableData>): boolean {
  return !!saved['scope_roe']?.fields.authorization?.trim();
}

export function deliverablesForRole(role: string, courseId: string): DeliverableDef[] {
  return DELIVERABLES.filter((d) => d.owner === role && courseIdOf(d) === courseId);
}

/** Resolve a deliverable by its title (used to turn a step's `usesForm` title
 *  into the deliverable `id` for a deep-link to the form on the Deliverables page).
 *  Scope to a course when known so identically-titled forms don't cross courses. */
export function deliverableIdByTitle(title: string, courseId?: string): string | undefined {
  const t = title.trim().toLowerCase();
  return DELIVERABLES.find(
    (d) => d.title.toLowerCase() === t && (!courseId || courseIdOf(d) === courseId)
  )?.id;
}

/** Resolve a deliverable by its output filename (used to turn a step's
 *  `producesDeliverable` filename into the deliverable `id` for a deep-link from
 *  an evidence step to the form it feeds). Scope to a course when known. */
export function deliverableIdByFile(file: string, courseId?: string): string | undefined {
  const f = file.trim().toLowerCase();
  return DELIVERABLES.find(
    (d) => d.file.toLowerCase() === f && (!courseId || courseIdOf(d) === courseId)
  )?.id;
}

/** Human label for how a deliverable is built (spec §2 "How it's built"). */
export function buildLabel(def: DeliverableDef): string {
  const hasGroup = def.sections.some((s) => s.kind === 'group');
  const hasFields = def.sections.some((s) => s.kind === 'fields');
  if (def.kind === 'checklist') return 'Checklist (multi-row)';
  if (def.kind === 'template') return 'Type-in template';
  if (hasGroup && hasFields) return 'Form + wrapper';
  if (hasGroup) return 'Form (multi-row)';
  return 'Form';
}

/** Build a deliverable's starting data from its seed (example) rows/fields. */
export function seedDeliverable(def: DeliverableDef): DeliverableData {
  const data: DeliverableData = { fields: {}, groups: {} };
  def.sections.forEach((s) => {
    if (s.kind === 'group') data.groups[s.group.group] = (s.group.seed ?? []).map((r) => ({ ...r }));
  });
  return data;
}
