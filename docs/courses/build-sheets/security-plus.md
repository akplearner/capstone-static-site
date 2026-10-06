# Security+ Capstone Lab — build sheet

What the architecture gains each week, what each part is for, which form records it, and the process the week walks through. Generated from the course document by `npm run content:export`; edit the picture module, not this file.

## Week 0 — Lab Setup & Rules of Engagement

> The lab: a Kali attacker outside, the edge firewall, the Ubuntu web server and the optional Windows host. Nothing is hardened yet.

You start with:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Internet | Where passive recon starts and the scope is checked first | Scope & Rules of Engagement |
| Kali attacker | The attacker’s box: recon, scanning and exploitation inside scope | Scope & Rules of Engagement |
| Edge firewall | The only path in: allowed ports, everything else dropped | Hardening Baseline |
| Ubuntu web server | The target: the web application the company runs | Asset Inventory |
| Windows host | Optional second target: RDP and local accounts | Asset Inventory |

## Week 1 — Cold Recon

> New: the hardening baseline, the account policy and the first seven records. Red maps the target without making noise.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Hardening baseline | The settings applied before the attack and checked after it | Hardening Baseline |
| Accounts and sudo | Who may log in to each host, with what rights | Lab Security Policy |
| Scope & RoE | Records what may be tested, when, and who authorized it | Scope & Rules of Engagement |
| Asset inventory | Records every host, owner and classification | Asset Inventory |
| Framework map | Records which control each task satisfies | Framework Mapping |
| Security policy | Records the rules the lab runs under | Lab Security Policy |
| Hardening standard | Records the settings Blue must reach | Hardening Standard |
| Hardening baseline | Records what Blue applied and the evidence | Hardening Baseline |
| Change log | Records every change Blue made, when and why | Change Log |

**Process — Cold Recon:** kali → edge (OSINT · passive recon); edge → ubuntu (map the target, quietly); r_standard → hardening (hardening standard applied).

## Week 2 — Hard Target

> New: the scanner, log forwarding and the SIEM. Red scans while Blue learns what normal looks like and GRC opens the risk register.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Vulnerability scanner | Finds the weaknesses the risk register ranks | Vulnerability-Management SOP |
| Log forwarding | Sends host and web logs to the SOC as they happen | Hardening Baseline |
| SIEM | Turns forwarded logs into alerts Blue can act on | Incident Report |
| Risk register | Records each risk, scored, with its owner and treatment | Risk Register |
| VM SOP | Records how scans run and how findings are handled | Vulnerability-Management SOP |
| Pentest report | Records what Red found, proved and recommends | Penetration Test Report |

**Process — Hard Target:** scanner → ubuntu (port & web scanning); logpipe → siem (baseline capture); siem → r_risks (findings → risk register).

## Week 3 — The Breach

> New: the snapshot, the case queue and the evidence vault. Red attacks for real; Blue detects, contains and preserves what it found.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| VM snapshot | The restore point the runbook falls back to | Incident-Response Runbook |
| Case queue | Every alert worked to a decision and a containment step | Incident Report |
| Evidence vault | Hashed copies of what the findings rest on | Evidence Log |
| IR runbook | Records the steps Blue follows when an alert fires | Incident-Response Runbook |
| Incident report | Records what happened, when it was seen, and the containment | Incident Report |
| Evidence log | Records every file, its hash and its custody | Evidence Log |

**Process — The Breach:** kali → ubuntu (live exploits); siem → cases (detect and contain); cases → evidence (preserve the evidence).

## Week 4 — Payday

> New: the final report. No new traffic — the evidence becomes findings and recommendations.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Final report | The capstone: findings, risks and recommendations | Final Report & Briefing |

**Process — Payday:** evidence → r_final (evidence → findings); r_risks → r_final (final report & presentation).

