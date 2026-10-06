# CySA+ SOC Capstone — build sheet

What the architecture gains each week, what each part is for, which form records it, and the process the week walks through. Generated from the course document by `npm run content:export`; edit the picture module, not this file.

## Week 0 — Lab setup: build the environment (optional)

> The lab as it is built for you: one Proxmox host, the shared SOC, your team pod and the Kali attacker.

You start with:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Kali Linux | The attacker you drive: recon, exploit, brute force | Incident Response Report |
| Proxmox host | The hypervisor every pod and the SOC run on | Coverage Validation Report |
| Lab edge | Keeps the lab off the internet; only the dashboard is reachable | Coverage Validation Report |
| Ubuntu + DVWA + Suricata | The web target the attack chain lands on | Sensor Deployment Record |
| Windows 11 + Sysmon | The endpoint whose process tree Sysmon records | Sensor Deployment Record |
| Wazuh SOC | Manager, indexer and dashboard: every event, scored by a rule | SOC Monitoring Report |
| Your browser | Dashboards, searches and the triage decisions | SOC Monitoring Report |

## Week 1 — See everything: sensors & baseline

> New: a sensor per role and the first three records. Every pod reports to the SOC; the baseline of normal is written.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Wazuh agent | Ships logs and file changes from the pod to the manager | Sensor Deployment Record |
| Sysmon | Records every process start and connection on Windows | Sensor Deployment Record |
| Suricata IDS | Sees the attack on the wire and names the signature | Sensor Deployment Record |
| SOC monitoring | Records the baseline of normal and the first alerts | SOC Monitoring Report |
| Coverage validation | Records which sources reach the SOC and the gaps | Coverage Validation Report |
| Sensor deployment | Records each sensor, where it runs and its proof | Sensor Deployment Record |

**Process — See everything:** ubuntu → soc (agent · port 1514); windows → soc (Sysmon → agent); soc → browser (prove the feed).

## Week 2 — Prove it: hunt & evidence

> New: threat-intel lookups and the case queue. You run the attack chain yourself and hunt for the evidence each hop leaves.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Threat-intel lookups | Enriches an indicator before it goes in the database | IOC Database |
| Case queue | Every alert worked to true, false or escalate | Alert Triage Report |
| Alert triage | Records every alert and the triage decision | Alert Triage Report |
| Threat investigation | Records the hunt hypotheses and what they found | Threat Investigation Report |
| IOC database | Records every indicator, enriched and attributed | IOC Database |

**Process — The attack you generate:** kali → ubuntu (recon · exploit · brute force); ubuntu → soc (the evidence each hop leaves); soc → browser (hunt and triage); browser → ti (enrich the indicators); ti → cases (open the case).

## Week 3 — Close the gaps: vulns & risk

> New: the vulnerability view and the evidence share. Scan the pod from both sides and rank what you find.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Vulnerability view | What the pod exposes, ranked, from the inside | Vulnerability Assessment |
| Evidence share | Where captures and exports are kept with their hashes | Incident Response Report |
| SOC findings | Records what the SOC found across the week | SOC Findings Record |
| Scan validation | Records the outside scan checked against the inside view | Scan Validation Report |
| Vulnerability assessment | Records the ranked weaknesses and the fix order | Vulnerability Assessment |

**Process — Close the gaps:** kali → ubuntu (scan from the attacker’s side); soc-vuln → browser (rank the risk); browser → evidence (keep the exports, hashed).

## Week 4 — Hold the line: respond & report

> New: the containment rule. Detect, investigate and contain the attack, then report it.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Containment rule | The rule that cuts the attacker off once the case is confirmed | Incident Response Report |
| Detection record | Records the detection that caught the attack | Detection Record |
| Incident response | Records containment, eradication and lessons learned | Incident Response Report |
| Executive debrief | The capstone: the week in one page for the executives | Executive Debrief & Lessons Learned |

**Process — Hold the line:** soc → browser (detect: the first alert); browser → soc (investigate: pivot on the source); browser → firewall (contain: ufw DENY).

