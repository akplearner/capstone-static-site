import { Column, riskLevel } from '../grc/templates';
import { DeliverableDef } from './types';
import { custodySection, everyEvidenceHashed } from './custodyTemplate';

// Deliverable forms for the CySA+ SOC Capstone (CS0-003). Course-scoped
// (`courseId: 'cysa-plus'`) so they never surface on the Security+ or MSSP
// pages, ZIP, or gate panels. Each form's `title` matches a step's `usesForm`
// and its `file` matches that step's `producesDeliverable` in the course seed
// (src/lib/data/seed/cysa.ts), so the "fill the form" callouts deep-link here.

// Local column helper (mirrors definitions.ts; kept local to avoid a circular
// import, since definitions.ts imports this file).
const c = (
  field: string,
  label: string,
  type: Column['type'],
  extra: Partial<Column> = {}
): Column => ({ field, label, type, ...extra });

const LMH = ['Low', 'Medium', 'High'];

export const CYSA_DELIVERABLES: DeliverableDef[] = [
  // 1 — SOC Monitoring Report (W1, Tier 1 SOC Analyst) ──────────────────────
  {
    id: 'cysa_soc_monitoring',
    courseId: 'cysa-plus',
    num: 1,
    file: '01_SOC_Monitoring_Report.md',
    title: 'SOC Monitoring Report',
    owner: 'blue',
    folder: '01_Monitoring',
    standard: 'NIST CSF (DE.CM)',
    framework: 'NIST_CSF',
    weeks: [1],
    gate: 1,
    kind: 'form',
    exportFormat: 'md',
    purpose:
      'Prove monitoring is live and record what "normal" looks like. Next week you can only spot "weird" if you wrote down "normal" this week.',
    howTo:
      'Attach the screenshot showing both agents Active, fill in the baseline fields, then list at least three alert types that fire routinely with a rough count.',
    source: "The Responder's agent deployment + your own dashboard review.",
    sections: [
      {
        kind: 'fields',
        title: 'Baseline',
        fields: [
          { field: 'agents_active', label: 'Both agents Active (screenshot)', type: 'fileref', required: true, placeholder: '20260724_Team07_agents_active.png', help: 'Agents view showing Team<#>-ubuntu and Team<#>-win both Active with a recent check-in.' },
          { field: 'events_per_hour', label: 'Rough events per hour', type: 'text', placeholder: '~400/hr on Ubuntu, ~120/hr on Windows' },
          { field: 'services', label: 'Services running / data sources', type: 'area', placeholder: 'Apache, MariaDB, SSH on Ubuntu; Sysmon on Windows; Suricata alerts arriving.' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'baseline',
          label: 'Routine alert types (what normal looks like)',
          help: 'Name the alert types that fire when nothing is wrong, so an anomaly stands out next week.',
          columns: [
            c('alert_type', 'Alert type / rule', 'text', { placeholder: 'sshd authentication success' }),
            c('level', 'Rule level', 'text', { placeholder: '3' }),
            c('per_hour', 'Roughly how often', 'text', { placeholder: '~20/hr' }),
            c('screenshot', 'Screenshot', 'text', { placeholder: '20260724_Team07_ssh_auth.png' }),
            c('notes', 'Notes', 'text', { placeholder: 'expected — the student login' }),
          ],
          seed: [
            { alert_type: 'sshd authentication success', level: '3', per_hour: '~20/hr', screenshot: '20260724_Team07_ssh_auth.png', notes: 'expected — the student login' },
            { alert_type: 'Apache 200/304 web access', level: '3', per_hour: '~150/hr', screenshot: '20260724_Team07_apache.png', notes: 'normal DVWA browsing' },
            { alert_type: 'Sysmon process create', level: '3', per_hour: '~60/hr', screenshot: '20260724_Team07_sysmon.png', notes: 'routine Windows processes' },
          ],
        },
      },
    ],
    dod: [
      { label: 'Both-agents-Active screenshot attached', test: (d) => !!d.fields.agents_active },
      { label: 'At least three routine alert types, each with a screenshot', test: (d) => (d.groups.baseline ?? []).filter((r) => !!r.alert_type && !!r.screenshot).length >= 3 },
    ],
  },

  // 2 — Threat Investigation Report (W2, Tier 2 Threat Hunter) ──────────────
  {
    id: 'cysa_threat_investigation',
    courseId: 'cysa-plus',
    num: 2,
    file: '02_Threat_Investigation_Report.md',
    title: 'Threat Investigation Report',
    owner: 'grc',
    folder: '02_Investigation',
    standard: 'NIST SP 800-61 (Detection & Analysis)',
    framework: 'NIST_CSF',
    weeks: [2],
    gate: 2,
    kind: 'form',
    exportFormat: 'md',
    purpose:
      'Turn a suspicious alert into proof: pivot on the source in the logs, capture the traffic, and quote the exact request the attacker sent.',
    howTo:
      'Record the suspicious source and the search you ran, attach the grouped-alerts and Wireshark screenshots, log the pcap + its SHA-256, then paste the attacker request you followed in the HTTP stream.',
    source: "The SOC Analyst's escalated alerts.",
    sections: [
      {
        kind: 'fields',
        title: 'Investigation',
        fields: [
          { field: 'suspicious_ip', label: 'Suspicious source IP', type: 'text', required: true, placeholder: '10.10.100.66' },
          { field: 'search_query', label: 'Dashboard search you ran', type: 'text', placeholder: 'data.srcip:10.10.100.66' },
          { field: 'grouped_alerts', label: 'Grouped alerts (screenshot)', type: 'fileref', placeholder: '20260725_Team07_grouped_alerts.png' },
          { field: 'ports_or_urls', label: 'How many ports / URLs the source hit', type: 'text', placeholder: '900 ports in 40s (port scan)' },
          { field: 'pcap_file', label: 'Capture filename', type: 'text', placeholder: 'week2.pcap' },
          { field: 'pcap_sha256', label: 'Capture SHA-256', type: 'text', required: true, placeholder: 'from sha256sum week2.pcap' },
          { field: 'wireshark_shot', label: 'Wireshark HTTP stream (screenshot)', type: 'fileref', placeholder: '20260725_Team07_http_stream.png' },
          { field: 'request_quote', label: 'The exact request the attacker sent', type: 'area', required: true, placeholder: "GET /vulnerabilities/sqli/?id=1' UNION SELECT user,password-- ...", help: 'Quote it verbatim from Follow → HTTP Stream, and say what it tried to do.' },
        ],
      },
      custodySection({
        seed: [
          { evidence_id: 'E-01', description: 'week2.pcap', collected_by: 'Threat Hunter', collected_at: '2026-07-25 11:10', location: '~/team-artifacts/week-2/', sha256: 'from sha256sum week2.pcap', transferred_to: 'GRC', transferred_at: '2026-07-25 11:30', notes: 'port-scan + SQLi capture' },
        ],
      }),
    ],
    dod: [
      { label: 'A pcap and its SHA-256 are recorded', test: (d) => !!(d.fields.pcap_file && d.fields.pcap_sha256) },
      { label: 'The attacker request is quoted with a Wireshark screenshot', test: (d) => !!(d.fields.request_quote && d.fields.wireshark_shot) },
      { label: 'Every logged artifact has a SHA-256 (chain of custody)', test: (d) => everyEvidenceHashed()(d) },
    ],
  },

  // 3 — Vulnerability Assessment (W3, Tier 3 Incident Responder) ────────────
  {
    id: 'cysa_vulnerability_assessment',
    courseId: 'cysa-plus',
    num: 3,
    file: '03_Vulnerability_Assessment.md',
    title: 'Vulnerability Assessment',
    owner: 'red',
    folder: '03_Assessment',
    standard: 'CVSS · NIST SP 800-115',
    framework: 'CVSS',
    weeks: [3],
    gate: 3,
    kind: 'form',
    exportFormat: 'md',
    purpose:
      'Confirm the weaknesses two ways — what the SOC already knows and what a scan proves — then rank them by real risk and write a fix plan someone could follow.',
    howTo:
      'Attach the Wazuh Vulnerabilities + SCA screenshots and paste your nmap/nikto output, then add one row per finding with a CVE + score (or a written reason), its likelihood × impact risk, and a fix with an owner and date.',
    source: "The Threat Hunter's Kali scan + the SOC's built-in vulnerability list.",
    sections: [
      {
        kind: 'fields',
        title: 'Evidence',
        fields: [
          { field: 'wazuh_vuln_shot', label: 'Wazuh Vulnerabilities + SCA (screenshot)', type: 'fileref', placeholder: '20260726_Team07_wazuh_vulns.png' },
          { field: 'sca_score', label: 'SCA score', type: 'text', placeholder: '61% pass — 3 failed checks named' },
          { field: 'scan_output', label: 'Nmap / Nikto output', type: 'paste', placeholder: 'PORT   STATE SERVICE VERSION\n22/tcp open  ssh     OpenSSH 8.2p1 ...' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'findings',
          label: 'Findings, ranked by risk',
          help: 'Severity is the flaw; risk is your setup. An open, unauthenticated web flaw beats a local flaw behind a login — so your top risk is not just your top CVSS number.',
          columns: [
            c('finding', 'Finding', 'text', { placeholder: 'DVWA SQL injection (unauthenticated)' }),
            c('cve', 'CVE / reference', 'text', { placeholder: 'CVE-2021-41773 or "config — no CVE"' }),
            c('cvss', 'CVSS', 'number', { placeholder: '9.8' }),
            c('likelihood', 'Likelihood', 'select', { options: LMH }),
            c('impact', 'Impact', 'select', { options: LMH }),
            c('risk', 'Risk rating', 'text', { derived: (r) => riskLevel(r.likelihood ?? '', r.impact ?? '') }),
            c('fix', 'Fix', 'text', { placeholder: 'Parameterised queries / raise DVWA security' }),
            c('owner', 'Owner', 'text', { placeholder: 'Blue' }),
            c('target_date', 'Target date', 'date'),
          ],
          seed: [
            { finding: 'DVWA SQL injection (unauthenticated)', cve: 'OWASP A03 — config, no CVE', cvss: '9.8', likelihood: 'High', impact: 'High', fix: 'Parameterised queries; raise DVWA security level', owner: 'Blue', target_date: '2026-07-31' },
            { finding: 'OpenSSH outdated banner', cve: 'CVE-2020-15778', cvss: '7.8', likelihood: 'Low', impact: 'High', fix: 'apt upgrade openssh-server', owner: 'Blue', target_date: '2026-08-07' },
          ],
        },
      },
      custodySection({
        label: 'Chain of custody — scan output & screenshots',
        seed: [
          { evidence_id: 'E-01', description: '20260726_Team07_wazuh_vulns.png', collected_by: 'Red', collected_at: '2026-07-26 10:15', location: '~/team-artifacts/week-3/', sha256: 'from sha256sum <file>', transferred_to: 'GRC', transferred_at: '2026-07-26 10:40', notes: 'Wazuh vulnerabilities screenshot' },
        ],
      }),
    ],
    dod: [
      { label: 'Every finding has a CVE with a score or a written reason', test: (d) => (d.groups.findings ?? []).length > 0 && (d.groups.findings ?? []).every((r) => !!r.cve || !!r.cvss) },
      { label: 'Every finding has a likelihood, impact, fix and owner', test: (d) => (d.groups.findings ?? []).length > 0 && (d.groups.findings ?? []).every((r) => !!r.likelihood && !!r.impact && !!r.fix && !!r.owner) },
      { label: 'Every logged artifact has a SHA-256 (chain of custody)', test: (d) => everyEvidenceHashed()(d) },
    ],
  },

  // 4 — Incident Response Report (W4, Tier 3 Incident Responder) ────────────
  {
    id: 'cysa_incident_response',
    courseId: 'cysa-plus',
    num: 4,
    file: '04_Incident_Response_Report.md',
    title: 'Incident Response Report',
    owner: 'red',
    folder: '04_Response',
    standard: 'NIST SP 800-61',
    framework: 'NIST_800_61',
    weeks: [4],
    gate: 4,
    kind: 'form',
    exportFormat: 'md',
    purpose:
      'Close the incident: rebuild the timeline, contain the attack, hash the evidence, and write the five-sentence summary leadership reads.',
    howTo:
      'Fill the wrapper (first alert, attacker IP, containment, root cause, exec summary), then build the timeline one row per step and log every artifact with its SHA-256.',
    source: "The SOC Analyst's detection record + the Threat Hunter's timeline.",
    sections: [
      {
        kind: 'fields',
        title: 'Incident wrapper',
        fields: [
          { field: 'first_alert', label: 'First alert (screenshot)', type: 'fileref', placeholder: '20260731_Team07_first_alert.png', help: 'The earliest related alert — this timestamp is your incident start.' },
          { field: 'attacker_ip', label: 'Attacker IP', type: 'text', required: true, placeholder: '10.10.100.66' },
          { field: 'access_log_line', label: 'Malicious request (from access.log)', type: 'area', placeholder: "10.10.100.66 - - [31/Jul/2026:14:22:07] \"GET /vulnerabilities/sqli/?id=1' UNION SELECT ...\"" },
          { field: 'containment', label: 'Containment (what you did)', type: 'area', placeholder: 'ufw deny from 10.10.100.66; stopped apache2.' },
          { field: 'containment_time', label: 'Containment time', type: 'text', placeholder: '2026-07-31 14:41' },
          { field: 'root_cause', label: 'Root cause', type: 'area', placeholder: 'DVWA security set to Low allowed unsanitised input on the sqli page.' },
          { field: 'exec_summary', label: 'Executive summary (5 sentences)', type: 'area', required: true, placeholder: 'What happened, what was hit, what you did, the impact, what you need.', help: 'Five sentences a manager can act on. Someone outside your team should be able to read it and explain the incident back to you.' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'timeline',
          label: 'Incident timeline',
          help: 'One row per step. Every row should point to the search or log line it came from.',
          columns: [
            c('time', 'Time', 'text', { placeholder: '14:22' }),
            c('event', 'Event', 'text', { placeholder: 'SQLi UNION SELECT against /vulnerabilities/sqli/' }),
            c('source', 'Source', 'text', { placeholder: 'Apache access.log' }),
            c('tool', 'Tool', 'text', { placeholder: 'Wazuh search' }),
            c('note', 'Note', 'text', { placeholder: 'first contact' }),
          ],
          seed: [
            { time: '14:22', event: 'SQLi UNION SELECT against /vulnerabilities/sqli/', source: 'Apache access.log', tool: 'Wazuh search', note: 'first contact — incident start' },
            { time: '14:31', event: 'File upload of shell.php', source: 'FIM / Integrity monitoring', tool: 'Wazuh', note: 'attack succeeded' },
            { time: '14:41', event: 'Attacker IP blocked at firewall', source: 'ufw', tool: 'ufw deny', note: 'containment' },
          ],
        },
      },
      custodySection({
        seed: [
          { evidence_id: 'E-01', description: 'access.log', collected_by: 'Red', collected_at: '2026-07-31 14:45', location: '~/team-artifacts/week-4/', sha256: 'c5b9…', transferred_to: 'GRC', transferred_at: '2026-07-31 15:05', notes: 'malicious request source' },
          { evidence_id: 'E-02', description: 'week4.pcap', collected_by: 'Red', collected_at: '2026-07-31 14:47', location: '~/team-artifacts/week-4/', sha256: 'a1f0…', transferred_to: 'GRC', transferred_at: '2026-07-31 15:05', notes: 'exploit traffic capture' },
        ],
      }),
    ],
    dod: [
      { label: 'Executive summary and attacker IP are filled in', test: (d) => !!(d.fields.exec_summary && d.fields.attacker_ip) },
      { label: 'Timeline has rows and every evidence item is hashed with a full custody entry', test: (d) => (d.groups.timeline ?? []).length >= 1 && everyEvidenceHashed()(d) },
    ],
  },

  // 5 — IOC Database (all weeks, Tier 3 Incident Responder) ─────────────────
  {
    id: 'cysa_ioc_database',
    courseId: 'cysa-plus',
    num: 5,
    file: '05_IOC_Database.csv',
    title: 'IOC Database',
    owner: 'red',
    folder: '05_Intel',
    standard: 'MITRE ATT&CK · threat intel',
    framework: 'NIST_CSF',
    weeks: [2, 3, 4],
    gate: 2,
    kind: 'form',
    exportFormat: 'csv',
    purpose:
      'The running record of indicators — one row per IOC, each traceable to a specific alert or packet and looked up against public threat intel.',
    howTo:
      'Add a row per indicator: its type and value, where you first saw it and when, the source you checked, and a verdict. Nothing found is still a result — mark it Unknown.',
    source: "The Threat Hunter's investigation + threat-intel lookups.",
    sections: [
      {
        kind: 'group',
        group: {
          group: 'iocs',
          label: 'Indicators of compromise',
          help: 'At least five rows, each traceable to a specific alert or packet.',
          columns: [
            c('type', 'Type', 'select', { options: ['IP', 'Domain', 'URL', 'Hash', 'User-Agent', 'Other'] }),
            c('value', 'Value', 'text', { placeholder: '10.10.100.66' }),
            c('first_seen', 'Where first seen', 'text', { placeholder: 'Suricata alert / week2.pcap' }),
            c('timestamp', 'Timestamp', 'text', { placeholder: '2026-07-25 14:22' }),
            c('source', 'Intel source', 'text', { placeholder: 'AbuseIPDB / VirusTotal' }),
            c('verdict', 'Verdict', 'select', { options: ['Malicious', 'Suspicious', 'Benign', 'Unknown'] }),
            c('attack', 'ATT&CK technique', 'text', { placeholder: 'T1190 Exploit Public-Facing App' }),
          ],
          seed: [
            { type: 'IP', value: '10.10.100.66', first_seen: 'Suricata port-scan alert', timestamp: '2026-07-25 14:20', source: 'lab attacker', verdict: 'Malicious', attack: 'T1046 Network Service Discovery' },
            { type: 'URL', value: "/vulnerabilities/sqli/?id=1' UNION SELECT", first_seen: 'Apache access.log', timestamp: '2026-07-25 14:22', source: 'OWASP A03', verdict: 'Malicious', attack: 'T1190 Exploit Public-Facing App' },
            { type: 'Hash', value: 'sha256 of shell.php', first_seen: 'FIM / Integrity monitoring', timestamp: '2026-07-25 14:31', source: 'VirusTotal', verdict: 'Suspicious', attack: 'T1505.003 Web Shell' },
          ],
        },
      },
    ],
    dod: [
      { label: 'At least five IOC rows, each with a type and value', test: (d) => (d.groups.iocs ?? []).filter((r) => !!r.type && !!r.value).length >= 5 },
      { label: 'Every IOC has a verdict', test: (d) => (d.groups.iocs ?? []).length > 0 && (d.groups.iocs ?? []).every((r) => !!r.verdict) },
    ],
  },
];
