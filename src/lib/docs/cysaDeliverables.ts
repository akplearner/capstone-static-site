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
    // The baseline is what makes a Week-2 alert readable as normal or not.
    feeds: ['cysa_alert_triage'],
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
    buildSteps: [
      'Agents view → screenshot both Team<#>-ubuntu and Team<#>-win showing Active → attach as the baseline evidence.',
      'Security events › Dashboard sub-tab → read "Top 5 rule groups" for the routine alert types.',
      'Alerts evolution graph → hover a bar, or take the 24-hour total ÷ 24, for a rough events/hour.',
      'Add at least three routine alert types with their level and rough rate (copy the example rows and edit).',
    ],
    meaning:
      'This is your definition of "normal". A good baseline names the handful of alert types that fire constantly and roughly how often — so next week a burst, a new source, or a type you never listed jumps out immediately.',
    useIt: 'The SOC Analyst compares every Week-2 alert against this baseline to decide true vs false positive.',
    pitfalls: [
      'Screenshotting an empty events table — widen the time picker to Last 24 hours first.',
      'Listing a one-off alert as "routine" — routine means it fires all the time when nothing is wrong.',
    ],
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
    // The Responder indexes the findings as IOC rows.
    feeds: ['cysa_ioc_database'],
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
    buildSteps: [
      'Pivot on the escalated source: data.srcip:<ip> or data.src_ip:<ip> in Security events.',
      'Read data.dest_port / data.alert.signature to size up what it did; screenshot the grouped alerts.',
      'Capture the traffic with tcpdump, hash it (sha256sum) at capture time, and log the pcap + hash.',
      'Open the pcap in Wireshark → Follow → HTTP Stream → copy the exact request verbatim.',
    ],
    meaning:
      'Proof, not suspicion: the quoted request plus the hashed capture show exactly what the attacker sent, so no one has to take your word for it.',
    useIt: 'The Incident Responder turns these findings into IOC rows; the capture + hash become chain-of-custody evidence.',
    pitfalls: [
      'Quoting the request from memory instead of the packet.',
      'Forgetting to chown the pcap — scp then fails with Permission denied.',
      'Hashing after opening/editing the file — hash it the moment you capture it.',
    ],
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
    // The fixes feed the report; the open High/Critical count feeds the debrief.
    feeds: ['cysa_incident_response', 'cysa_exec_debrief'],
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
    buildSteps: [
      'Attach the Wazuh Vulnerabilities (Critical/High) and SCA screenshots; paste your nmap -sV and nikto output.',
      'For each finding, look the package+version or nmap banner up on NVD and copy its CVSS score (or write a reason if there is no CVE).',
      'Rate Likelihood (High = network-reachable, no login · Medium = needs an account · Low = physical/root) and Impact (High = full control/data · Medium = limited · Low = info only).',
      'Give every finding a fix, an owner and a target date — SCA supplies fix text for config findings.',
    ],
    meaning:
      'A risk-ranked, actionable list. A good one puts the network-reachable, unauthenticated flaws on top even when a local flaw has a higher raw CVSS — because risk is severity × your exposure.',
    useIt: 'The fixes feed the Incident Response Report; the open High/Critical count feeds the Executive Debrief.',
    pitfalls: [
      'Ranking purely by CVSS and ignoring exposure.',
      'A fix with no owner or date — it never gets done.',
    ],
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
    // The debrief pulls detection and containment times for MTTD/MTTR.
    feeds: ['cysa_exec_debrief'],
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
    buildSteps: [
      'Fill the wrapper: first-alert screenshot + time (the incident start), attacker IP, the malicious access.log line, containment action + time.',
      'The Threat Hunter builds the timeline table — one row per step, each citing the search or log line it came from.',
      'Trace the timeline back to the first successful step to state the root cause; list the fixes (from the Vulnerability Assessment) that address it.',
      'Write the 5-sentence executive summary; log every artifact (access.log, screenshots) with its SHA-256.',
    ],
    meaning:
      'The single document that closes the incident. A good one lets someone outside the team read the summary and explain the incident back to you correctly.',
    useIt: 'Leadership reads the summary; the Executive Debrief pulls its detection/containment times for MTTD/MTTR.',
    pitfalls: [
      'Calling the last alert the root cause instead of the first weakness that let the attacker in.',
      'A timeline row with no source citation — every row must point to a search or log line.',
    ],
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
          { evidence_id: 'E-02', description: 'week4_attacker_events.png', collected_by: 'Red', collected_at: '2026-07-31 14:47', location: '~/team-artifacts/week-4/', sha256: 'a1f0…', transferred_to: 'GRC', transferred_at: '2026-07-31 15:05', notes: 'Wazuh export of the attacker’s events' },
        ],
      }),
    ],
    dod: [
      { label: 'Executive summary and attacker IP are filled in', test: (d) => !!(d.fields.exec_summary && d.fields.attacker_ip) },
      { label: 'Timeline has rows and every evidence item is hashed with a full custody entry', test: (d) => (d.groups.timeline ?? []).length >= 1 && everyEvidenceHashed()(d) },
    ],
  },

  // 5 — IOC Database (Week 2, Incident Responder) ───────────────────────────
  {
    id: 'cysa_ioc_database',
    // The techniques become the ATT&CK mapping in the incident report.
    feeds: ['cysa_incident_response'],
    courseId: 'cysa-plus',
    num: 5,
    file: '05_IOC_Database.csv',
    title: 'IOC Database',
    owner: 'red',
    folder: '05_Intel',
    standard: 'MITRE ATT&CK · threat intel',
    framework: 'NIST_CSF',
    weeks: [2],
    gate: 2,
    kind: 'form',
    exportFormat: 'csv',
    purpose:
      'The running record of indicators — one row per IOC, each traceable to a specific alert or packet and looked up against public threat intel.',
    howTo:
      'Add a row per indicator: its type and value, where you first saw it and when, the source you checked, and a verdict. Nothing found is still a result — mark it Unknown.',
    source: "The Threat Hunter's investigation + threat-intel lookups.",
    buildSteps: [
      'Re-run data.src_ip:<kali-ip> or data.srcip:<kali-ip> for the attacker IP.',
      'Open week2.pcap in Wireshark for the malicious URL/URI and the attacker User-Agent; use the pcap SHA-256 for the Hash row.',
      'Add a row per indicator: type, value, where first seen, timestamp.',
      'Look each up (VirusTotal / AbuseIPDB), record a verdict, and add the ATT&CK technique Wazuh tagged (e.g. T1110, T1190).',
    ],
    meaning:
      'The team’s running list of "things to watch for". Every row must trace back to something you actually saw. Private lab IPs come back Unknown — that is the correct answer here, not benign.',
    useIt: 'Later weeks add to it; the techniques feed the ATT&CK mapping in the reports.',
    pitfalls: [
      'Inventing indicators with no alert or packet behind them.',
      'Marking a private 10.x IP "benign" when the site simply has no data — it is Unknown.',
    ],
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

  // 6 — Coverage Validation Report (W1, Tier 2 Threat Hunter) ────────────────
  {
    id: 'cysa_coverage_validation',
    // Coverage decides what Week-2 triage can even see. Inferred: the prose sends the gaps to a person, not a named document.
    feeds: ['cysa_alert_triage'],
    courseId: 'cysa-plus',
    num: 6,
    file: '06_Coverage_Validation.md',
    title: 'Coverage Validation Report',
    owner: 'grc',
    folder: '01_Monitoring',
    standard: 'NIST CSF (Detect)',
    framework: 'NIST_CSF',
    weeks: [1],
    gate: 1,
    kind: 'form',
    exportFormat: 'md',
    purpose:
      'Prove the SOC can actually see what it should. Every expected data source is checked for real data — a source you expect but cannot find is a blind spot, and a blind spot is a finding.',
    howTo:
      'List each data source you expect (agent, Suricata, FIM, SCA, Windows/Sysmon), mark whether real data is arriving, attach a screenshot, and note any gap. Finish with a one-line summary of your coverage.',
    source: "The SOC Analyst's deployed agents + the dashboard modules.",
    buildSteps: [
      'Check each expected source for real recent data: host agent, Suricata (rule.groups:ids), FIM, SCA, and Windows/Sysmon.',
      'Mark each Yes / Partial / No, attach a screenshot, and note any gap.',
      'Write the one-line coverage summary (e.g. "4 of 5 sources reporting; Sysmon is the gap").',
    ],
    meaning:
      'Proof the SOC can see what it should. A source you expect but cannot find is a blind spot — and a blind spot is a finding worth marks, not something to hide.',
    useIt: 'Gaps go to the builder/Incident Responder to fix before Week 2’s detection work.',
    pitfalls: [
      'Marking a source "Yes" because the module exists — "Yes" means you actually saw recent data.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'sources',
          label: 'Data sources checked',
          help: 'One row per source. “Present” means you actually saw recent data, not just that the module exists.',
          columns: [
            c('source', 'Data source', 'text', { placeholder: 'Suricata (network IDS)' }),
            c('host', 'On which host', 'text', { placeholder: 'Ubuntu pod 10.10.100.7' }),
            c('present', 'Data arriving?', 'select', { options: ['Yes', 'Partial', 'No'] }),
            c('evidence', 'Evidence (screenshot)', 'text', { placeholder: '20260718_Team07_suricata_data.png' }),
            c('note', 'Gap / note', 'text', { placeholder: 'FIM empty — not enabled on Windows yet' }),
          ],
          seed: [
            { source: 'Wazuh agent (Ubuntu)', host: '10.10.100.7', present: 'Yes', evidence: '20260718_Team07_agent_active.png', note: '' },
            { source: 'Suricata (network IDS)', host: '10.10.100.7', present: 'Yes', evidence: '', note: '' },
            { source: 'Sysmon (Windows)', host: '10.10.20.7', present: 'No', evidence: '', note: 'Agent active but no Sysmon events — config missing' },
          ],
        },
      },
      {
        kind: 'fields',
        title: 'Summary',
        fields: [
          { field: 'summary', label: 'Coverage summary (1–2 sentences)', type: 'area', required: true, placeholder: '4 of 5 expected sources reporting; Windows Sysmon is the one gap, raised to the builder.' },
        ],
      },
    ],
    dod: [
      { label: 'At least three sources checked, each with a Yes/Partial/No verdict', test: (d) => (d.groups.sources ?? []).filter((r) => !!r.source && !!r.present).length >= 3 },
      { label: 'A coverage summary is written', test: (d) => !!d.fields.summary },
    ],
  },

  // 7 — Alert Triage Report (W2, Tier 1 SOC Analyst) ────────────────────────
  {
    id: 'cysa_alert_triage',
    // The escalated rows are the Threat Hunter's starting point.
    feeds: ['cysa_threat_investigation'],
    courseId: 'cysa-plus',
    num: 7,
    file: '07_Alert_Triage_Report.md',
    title: 'Alert Triage Report',
    owner: 'blue',
    folder: '01_Monitoring',
    standard: 'NIST SP 800-61 (Detection & Analysis)',
    framework: 'NIST_800_61',
    weeks: [2],
    gate: 2,
    kind: 'form',
    exportFormat: 'md',
    purpose:
      'Sort the week’s alerts into real vs noise and say why. Triage is the core SOC-analyst skill: decide what is a true positive, what is noise, and what to escalate to the Threat Hunter.',
    howTo:
      'Add one row per alert you reviewed: what fired, how often, your verdict (true/false positive or needs review), the reason in plain words, and whether you escalated it. Escalate the ones worth chasing.',
    source: 'The Wazuh dashboard alerts for your pod.',
    buildSteps: [
      'List each alert type you reviewed with its count/severity.',
      'Compare each to the Week-1 baseline: matches normal = false positive; a burst, new IP, or un-baselined type = true positive.',
      'Give each a verdict and a one-line reason, and mark whether you escalated it.',
    ],
    meaning:
      'Real vs noise, with a reason. A good report escalates the handful worth chasing and says in one line why each is real — "one IP hit 900 ports in 40s", not "looks bad".',
    useIt: 'The escalated rows are the Threat Hunter’s Week-2 starting point.',
    pitfalls: [
      'A verdict with no reason.',
      'Escalating everything (or nothing) — triage is about the cut.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'alerts',
          label: 'Alerts triaged',
          help: 'A verdict with a one-line reason beats a long list with none. Escalate what the Hunter should investigate.',
          columns: [
            c('alert', 'Alert', 'text', { placeholder: 'Multiple failed logins from 10.10.100.66' }),
            c('count', 'Count / severity', 'text', { placeholder: '48 in 2 min · high' }),
            c('verdict', 'Verdict', 'select', { options: ['True positive', 'False positive', 'Needs review'] }),
            c('reason', 'Reason', 'text', { placeholder: 'Brute force — far above the baseline of ~2/hour' }),
            c('escalated', 'Escalated?', 'select', { options: ['Yes', 'No'] }),
            c('evidence', 'Evidence (screenshot)', 'text', { placeholder: '20260725_Team07_bruteforce.png' }),
          ],
          seed: [
            { alert: 'Multiple failed logins from 10.10.100.66', count: '48 in 2 min · high', verdict: 'True positive', reason: 'Brute force — well above baseline', escalated: 'Yes', evidence: '20260725_Team07_bruteforce.png' },
            { alert: 'Package manager ran overnight', count: '1 · low', verdict: 'False positive', reason: 'Scheduled apt update — expected', escalated: 'No', evidence: '' },
          ],
        },
      },
    ],
    dod: [
      { label: 'At least three alerts triaged', test: (d) => (d.groups.alerts ?? []).filter((r) => !!r.alert).length >= 3 },
      { label: 'Every alert has a verdict and a reason', test: (d) => (d.groups.alerts ?? []).length > 0 && (d.groups.alerts ?? []).every((r) => !!r.verdict && !!r.reason) },
      { label: 'At least one alert is escalated to the Hunter', test: (d) => (d.groups.alerts ?? []).some((r) => r.escalated === 'Yes') },
    ],
  },

  // 8 — Detection Record (W4, Tier 1 SOC Analyst) ───────────────────────────
  {
    id: 'cysa_detection_record',
    // Feeds the report's wrapper and the MTTD figure in the debrief.
    feeds: ['cysa_incident_response', 'cysa_exec_debrief'],
    courseId: 'cysa-plus',
    num: 8,
    file: '08_Detection_Record.md',
    title: 'Detection Record',
    owner: 'blue',
    folder: '04_Response',
    standard: 'NIST SP 800-61 (Detection & Analysis)',
    framework: 'NIST_800_61',
    weeks: [4],
    gate: 4,
    kind: 'form',
    exportFormat: 'md',
    purpose:
      'The first page of the incident: what tipped you off, the earliest related alert, the attacker’s IP, and how far it spread. This is the hand-off that starts the Incident Response Report.',
    howTo:
      'Capture the first alert and its exact time (this becomes the incident start), the attacker IP, what made you sure it was real, which hosts were touched, and who you handed it to.',
    source: 'Your Week-4 dashboard search around the attack window.',
    buildSteps: [
      'Sort Security events oldest-first in the incident window → the earliest attacker event is your incident start.',
      'Record its exact time (YYYY-MM-DD HH:MM) and the attacker IP.',
      'Note what tipped you off (the rule that fired), the affected hosts, and who you escalated to.',
    ],
    meaning:
      'The clean hand-off that starts the incident. A good one lets the Threat Hunter begin without a single follow-up question.',
    useIt: 'Feeds the Incident Response Report’s wrapper and the MTTD figure in the Executive Debrief.',
    pitfalls: [
      'Recording the alert you noticed first instead of the earliest one — sort by time.',
      'A fuzzy timestamp — the whole timeline hangs off this one time.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'Detection',
        fields: [
          { field: 'first_alert', label: 'First related alert (screenshot)', type: 'fileref', placeholder: '20260731_Team07_first_alert.png' },
          { field: 'first_alert_time', label: 'First alert time (incident start)', type: 'text', required: true, placeholder: '2026-07-31 14:22' },
          { field: 'attacker_ip', label: 'Attacker IP', type: 'text', required: true, placeholder: '10.10.100.66' },
          { field: 'what_tipped', label: 'What tipped you off', type: 'area', placeholder: 'A spike of SQLi alerts on the web pod, far above baseline.' },
          { field: 'affected_hosts', label: 'Hosts affected (initial scope)', type: 'text', placeholder: 'Ubuntu pod 10.10.100.7 (web + DB)' },
          { field: 'escalated_to', label: 'Escalated to', type: 'text', placeholder: 'Threat Hunter (Tier 2) at 14:30' },
        ],
      },
    ],
    dod: [
      { label: 'First-alert time and attacker IP are recorded', test: (d) => !!(d.fields.first_alert_time && d.fields.attacker_ip) },
      { label: 'What tipped you off and the initial scope are described', test: (d) => !!(d.fields.what_tipped && d.fields.affected_hosts) },
    ],
  },

  // 9 — Executive Debrief & Lessons Learned (W4 capstone, Tier 2) ────────────
  {
    id: 'cysa_exec_debrief',
    courseId: 'cysa-plus',
    // The course's final artefact — filing it is what completes the stone.
    capstone: true,
    num: 9,
    file: '09_Executive_Debrief.md',
    title: 'Executive Debrief & Lessons Learned',
    owner: 'grc',
    folder: '06_Debrief',
    standard: 'NIST CSF (Recover) · NIST SP 800-61 (Post-Incident)',
    framework: 'NIST_CSF',
    weeks: [4],
    gate: 4,
    kind: 'form',
    exportFormat: 'md',
    purpose:
      'The wrap-up leadership actually reads: across the four weeks, what happened, how fast the team detected and responded, what was fixed, and what to improve next time. Built from every role’s work.',
    howTo:
      'Write a short executive summary a non-technical manager can act on, fill the headline metrics, then list the concrete lessons learned and recommendations. Pull the numbers from your weekly reports.',
    source: 'All four weekly reports + the Incident Response Report.',
    buildSteps: [
      'Pull the numbers from your reports: detection time (Detection Record 08), containment time (Incident Response Report 04), open High/Critical risks (Vulnerability Assessment 03).',
      'Compute MTTD = first-alert − attack-start and MTTR = containment − first-alert; write each as a duration.',
      'Write a 5–7 sentence plain-English summary a manager can act on.',
      'List concrete lessons learned and recommendations, each with an owner.',
    ],
    meaning:
      'The one page leadership reads instead of the four reports. A good debrief is short, honest about what to improve, and free of jargon.',
    useIt: 'It closes the engagement — the recommendations become next quarter’s work.',
    pitfalls: [
      'Re-doing analysis — this is a summary of work already done.',
      'Metrics out of order giving a negative MTTD/MTTR — check the timezone and the sequence.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'Executive summary',
        fields: [
          { field: 'exec_summary', label: 'Executive summary (5–7 sentences)', type: 'area', required: true, placeholder: 'Over four weeks the team stood up monitoring, detected and investigated a live attack, ranked the risks, and ran the incident to closure. The key incident was a SQL injection that led to a web shell; it was detected in ~9 minutes and contained in ~19. Three high risks remain open with owners and dates.', help: 'Plain words a manager can act on: what happened, how bad, what you did, what’s left.' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'metrics',
          label: 'Headline metrics',
          help: 'The few numbers leadership samples. Estimate from your reports if exact figures aren’t available.',
          columns: [
            c('metric', 'Metric', 'text', { placeholder: 'MTTD (detect)' }),
            c('value', 'Value', 'text', { placeholder: '~9 min' }),
            c('note', 'How measured', 'text', { placeholder: 'First alert 14:22 → escalation 14:31' }),
          ],
          seed: [
            { metric: 'MTTD (time to detect)', value: '~9 min', note: 'First alert → escalation' },
            { metric: 'MTTR (time to contain)', value: '~19 min', note: 'First alert → firewall block' },
            { metric: 'High risks remaining', value: '3', note: 'From the Vulnerability Assessment' },
          ],
        },
      },
      {
        kind: 'fields',
        title: 'Lessons & recommendations',
        fields: [
          { field: 'lessons', label: 'Lessons learned (what to keep / change)', type: 'area', required: true, placeholder: 'Baseline made triage fast. Windows Sysmon coverage was late — enable it in the build next time.' },
          { field: 'recommendations', label: 'Recommendations (next steps, with owners)', type: 'area', placeholder: 'Parameterise DVWA queries (Blue, 2 wks); add a WAF (Blue); tune the SQLi rule to cut noise (Analyst).' },
        ],
      },
    ],
    dod: [
      { label: 'An executive summary is written', test: (d) => !!d.fields.exec_summary },
      { label: 'Lessons learned are captured', test: (d) => !!d.fields.lessons },
      { label: 'At least two headline metrics are filled', test: (d) => (d.groups.metrics ?? []).filter((r) => !!r.metric && !!r.value).length >= 2 },
    ],
  },
];
