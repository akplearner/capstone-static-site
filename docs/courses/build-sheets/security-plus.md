# Security+ Capstone Lab — build sheet

What the architecture gains each week, what each part is for, which form records it, and the process the week walks through. Generated from the course document by `npm run content:export`; edit the picture module, not this file.

## Week 0 — Lab Setup & Rules of Engagement

> The lab, built: one isolated Host-Only network with a Kali attacker, the Ubuntu and Windows targets, a snapshot and the GRC workspace.

You start with:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Hypervisor | Runs every VM on one Host-Only network with no route out | Scope & Rules of Engagement |
| Lab access panel | Where your own hosts and addresses go, substituted into commands | Scope & Rules of Engagement |
| Kali attacker | The attacker’s box, inside the authorized scope | Scope & Rules of Engagement |
| Ubuntu web server | The web target the attack chain lands on | Asset Inventory |
| DVWA | The deliberately vulnerable app Red attacks | Asset Inventory |
| VM snapshot | The restore point the runbook falls back to | Incident-Response Runbook |
| Windows host | The second target: RDP and local accounts | Asset Inventory |
| Team workspace | Where every artefact is filed, week by week | Scope & Rules of Engagement |

## Week 1 — Cold Recon

> New: Red profiles the target with OSINT; Blue hardens both hosts with ufw, fail2ban, Lynis and Defender; GRC issues the hardening standard.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| OSINT recon | Profiles the target quietly, before anything is loud | Asset Inventory |
| Linux hardening | The controls applied before the attack and checked after | Hardening Baseline |
| Windows hardening | The same baseline reached on the Windows host | Hardening Baseline |
| Scope & RoE | Records what may be tested, when, and who authorized it | Scope & Rules of Engagement |
| Asset inventory | Records every host, owner and classification | Asset Inventory |
| Framework map | Records which control each task satisfies | Framework Mapping |
| Security policy | Records the rules the lab runs under | Lab Security Policy |
| Hardening standard | Records the settings Blue must reach | Hardening Standard |
| Hardening baseline | Records what Blue applied and the evidence | Hardening Baseline |
| Change log | Records every change Blue made, when and why | Change Log |

**Process — Cold Recon:** kali → ubuntu (passive recon, nothing loud); osint → r_assets (profile into the asset list); r_standard → linhard (hardening standard applied); r_standard → winhard (same baseline on Windows).

## Week 2 — Hard Target

> New: the scanner, Windows logon auditing, packet capture and detection filters. Red scans while Blue learns normal traffic and GRC opens the risk register.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Vulnerability scan | Finds and ranks the weaknesses the risk register scores | Penetration Test Report |
| Windows logging | Records every logon so a brute force is visible | Vulnerability-Management SOP |
| Packet capture | The normal and attack traffic samples Blue reads | Vulnerability-Management SOP |
| Detection filters | The filters that name the attack in the capture | Vulnerability-Management SOP |
| Risk scoring | Scores each finding so the fix order is defensible | Risk Register |
| Risk register | Records each risk, scored, with its owner and treatment | Risk Register |
| VM SOP | Records how scans run and how findings are handled | Vulnerability-Management SOP |
| Pentest report | Records what Red found, proved and recommends | Penetration Test Report |

**Process — Hard Target:** scanner → dvwa (port and web scanning); capture → rules (baseline becomes detection filters); windows → winlog (turn on logon auditing); scanner → r_risks (findings into the risk register).

## Week 3 — The Breach

> New: live exploits, the web-log watch, the containment rule and the evidence hashes. Red attacks for real; Blue detects, contains and preserves.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Authorized attacks | Proves each finding with evidence, inside scope | Penetration Test Report |
| Web-log watch | Catches the live SQL injection as it is tried | Incident Report |
| Containment | Cuts the attacker off once the case is confirmed | Incident Report |
| Evidence hashes | Hashes every file so the evidence cannot be altered | Evidence Log |
| IR runbook | Records the steps Blue follows when an alert fires | Incident-Response Runbook |
| Incident report | Records what happened, when it was seen, and the containment | Incident Report |
| Evidence log | Records every file, its hash and its custody | Evidence Log |

**Process — The Breach:** exploits → dvwa (live exploits land); weblog → contain (detect, then cut it off); winlog → contain (failed logons, then block); capture → hashes (preserve the evidence, hashed).

## Week 4 — Payday

> New: the final report and the briefing. No new traffic — the evidence becomes findings, the risks become recommendations, and the team briefs the room.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Final briefing | The capstone: findings, risks and recommendations | Final Report & Briefing |
| Final report | The capstone: findings, risks and recommendations | Final Report & Briefing |
| Portfolio | The repository, case study, resume bullets and diagram | Portfolio |

**Process — Payday:** hashes → r_final (evidence into findings); r_risks → r_final (risks into the final report); r_final → briefing (brief it to the room).

## Week 5 — AI security validation: Attack the model

Nothing new is built this week; the process is drawn over the picture.

## Week 6 — AI security validation: A suite that holds

Nothing new is built this week; the process is drawn over the picture.

## The roles

| Role | Mission | Drafts | Reviews | Approves | Hands to | Waits on |
| --- | --- | --- | --- | --- | --- | --- |
| Offensive Security (Red Team) | Reconnaissance, enumeration and exploitation of the in-scope hosts, with proof. | Penetration Test Report | Scope & Rules of Engagement, Risk Register, Hardening Baseline, Incident Report, Final Report & Briefing, Portfolio | — | Defensive Operations (Blue Team), Governance & Compliance (GRC) | Defensive Operations (Blue Team), Governance & Compliance (GRC) |
| Defensive Operations (Blue Team) | Hardening, detection and incident response across the lab hosts. | Hardening Baseline, Change Log, Incident Report | Asset Inventory, Penetration Test Report, Framework Mapping, Lab Security Policy, Hardening Standard, Vulnerability-Management SOP, Incident-Response Runbook, Evidence Log | Change Log | Offensive Security (Red Team), Governance & Compliance (GRC) | Offensive Security (Red Team), Governance & Compliance (GRC) |
| Governance & Compliance (GRC) | Governance, risk, compliance and the reports the client reads. | Scope & Rules of Engagement, Asset Inventory, Risk Register, Final Report & Briefing, Framework Mapping, Lab Security Policy, Hardening Standard, Vulnerability-Management SOP, Incident-Response Runbook, Evidence Log, Portfolio | Change Log | Scope & Rules of Engagement, Asset Inventory, Risk Register, Hardening Baseline, Penetration Test Report, Incident Report, Final Report & Briefing, Framework Mapping, Lab Security Policy, Hardening Standard, Vulnerability-Management SOP, Incident-Response Runbook, Evidence Log, Portfolio | Offensive Security (Red Team), Defensive Operations (Blue Team) | Offensive Security (Red Team), Defensive Operations (Blue Team) |

