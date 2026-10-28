# CySA+ SOC Capstone — skills sheet

13 graded tasks · 21 skills · 21 tools · 12 procedures · 6 standards (11 controls cited) · 5 tactics · 17 practices

Generated from the registries and the course document by `npm run content:export`; edit `src/lib/docs/skills.ts`, `tools.ts`, `standards.ts`, `sops.ts`, `tactics.ts` or the seed, not this file.

## Skills

| Skill | Area | Anchored to | Practised by |
| --- | --- | --- | --- |
| Scan ports and services with nmap `comp.recon.port-scan` | Reconnaissance | SY0-701.d2, CS0-003.d2, NIST.800-115 | Scan from the attacker’s side |
| Scan a web server for known weaknesses `comp.recon.web-scan` | Reconnaissance | SY0-701.d2, CS0-003.d2, OWASP | Scan from the attacker’s side |
| Score a vulnerability with CVSS `comp.vuln.cvss-score` | Vulnerability management | SY0-701.d5, CS0-003.d2, CVSS | Rank the risk & write the fix plan |
| Rank findings on a risk matrix `comp.vuln.risk-rank` | Vulnerability management | CS0-003.d2, NIST_800_30 | Rank the risk & write the fix plan |
| Write a fix plan with owners and dates `comp.vuln.remediation-plan` | Vulnerability management | CS0-003.d2, NIST_800_40 | Rank the risk & write the fix plan |
| Read vulnerability and configuration assessment results `comp.vuln.read-scanner-output` | Vulnerability management | CS0-003.d2, CIS.BENCHMARK | Read what the SOC already knows |
| Validate scanner findings from the attacker side `comp.vuln.validate-scan` | Vulnerability management | CS0-003.d2, NIST.800-115 | Scan from the attacker’s side |
| Write an executive debrief with metrics and lessons `comp.report.executive-debrief` | Reporting | CS0-003.d4, NIST.800-61.POST | Debrief the team (capstone) |
| Deploy an endpoint sensor to the SOC `comp.detect.deploy-endpoint-sensor` | Detection and monitoring | CS0-003.d1, NIST.CSF.DE.CM-01 | Deploy the Windows endpoint sensor; Deploy your Ubuntu sensor, prove the feed, write the baseline |
| Deploy a network IDS and confirm its feed `comp.detect.deploy-network-sensor` | Detection and monitoring | CS0-003.d1, NIST.CSF.DE.CM-01 | Deploy the network sensor, then validate coverage |
| Validate data-source coverage `comp.detect.coverage-validation` | Detection and monitoring | CS0-003.d1, NIST.CSF.DE | Deploy the network sensor, then validate coverage |
| Capture and baseline traffic and logs `comp.detect.capture-baseline` | Detection and monitoring | SY0-701.d4, CS0-003.d1, NIST.CSF.DE.CM | Deploy your Ubuntu sensor, prove the feed, write the baseline |
| Triage alerts with a verdict and a reason `comp.detect.triage-alerts` | Detection and monitoring | CS0-003.d1, NIST.800-61.DETECT | Triage the alerts |
| Scope an incident from the first alert `comp.respond.find-the-incident` | Incident response | CS0-003.d3, NIST.800-61.DETECT | Find the incident |
| Contain an attacker with a timestamped block `comp.respond.contain` | Incident response | SY0-701.d4, CS0-003.d3, NIST.800-61.CONTAIN | Contain, preserve & report |
| Rebuild an attack timeline from logs `comp.respond.timeline` | Incident response | SY0-701.d4, CS0-003.d3, NIST.800-61.DETECT | Rebuild the attack |
| Write an incident report `comp.respond.incident-report` | Incident response | CS0-003.d3, AZ-900.d3, CLF-C02.d2, NIST.800-61 | Contain, preserve & report |
| Hash and log evidence `comp.forensics.hash-evidence` | Evidence and forensics | SY0-701.d4, CS0-003.d3, CY0-001.d2, ISO_27037 | Investigate & prove it; Contain, preserve & report |
| Capture packets and quote the attacker request `comp.forensics.packet-capture` | Evidence and forensics | CS0-003.d1, NIST.800-61.DETECT | Investigate & prove it |
| Pivot across logs to prove an attack `comp.forensics.log-pivoting` | Evidence and forensics | CS0-003.d1 | Investigate & prove it |
| Turn findings into indicators with ATT&CK ids `comp.forensics.iocs` | Evidence and forensics | CS0-003.d3, MITRE_ATTACK | Turn findings into indicators |

## Tools

| Tool | Kind | Used by |
| --- | --- | --- |
| Linux shell | cli | Deploy the Windows endpoint sensor; Deploy your Ubuntu sensor, prove the feed, write the baseline; Deploy the network sensor, then validate coverage; Investigate & prove it; Rebuild the attack; Contain, preserve & report |
| PowerShell | cli | Deploy the Windows endpoint sensor |
| SSH | cli | Deploy your Ubuntu sensor, prove the feed, write the baseline; Deploy the network sensor, then validate coverage; Investigate & prove it; Scan from the attacker’s side; Rebuild the attack; Contain, preserve & report |
| curl | cli | Deploy your Ubuntu sensor, prove the feed, write the baseline; Investigate & prove it |
| sha256sum | cli | Investigate & prove it; Contain, preserve & report |
| Capstone forms | document | Deploy the Windows endpoint sensor; Read what the SOC already knows; Rebuild the attack; Debrief the team (capstone) |
| Notes | document | Deploy your Ubuntu sensor, prove the feed, write the baseline; Deploy the network sensor, then validate coverage; Triage the alerts; Turn findings into indicators; Scan from the attacker’s side; Rank the risk & write the fix plan; Find the incident; Debrief the team (capstone); Contain, preserve & report |
| Threat-intel sites | service | Turn findings into indicators |
| CVE lookup (NVD) | service | Rank the risk & write the fix plan |
| nmap | cli | Investigate & prove it; Scan from the attacker’s side |
| Nikto | cli | Scan from the attacker’s side |
| Hydra | cli | Investigate & prove it |
| Kali Linux | platform | Investigate & prove it; Scan from the attacker’s side |
| ufw | cli | Deploy your Ubuntu sensor, prove the feed, write the baseline; Contain, preserve & report |
| Windows | platform | Deploy the Windows endpoint sensor |
| tcpdump | cli | Investigate & prove it |
| Wireshark | app | Investigate & prove it |
| Sysmon | cli | Deploy the Windows endpoint sensor |
| Suricata | service | Deploy the network sensor, then validate coverage |
| Wazuh | service | Deploy the Windows endpoint sensor; Deploy your Ubuntu sensor, prove the feed, write the baseline; Deploy the network sensor, then validate coverage; Triage the alerts; Investigate & prove it; Turn findings into indicators; Read what the SOC already knows; Find the incident; Rebuild the attack |
| Apache httpd | service | Rebuild the attack |

## Procedures

Runbooks and standard operating procedures the forms are instances of, and the tasks that execute them.

| Procedure | Kind | Standards | Forms | Executed by |
| --- | --- | --- | --- | --- |
| Operational runbook | runbook | ISO27001.A.5.37, NIST.CSF.PR.PS | Alert Triage Report | Triage the alerts |
| Incident response plan | incident | NIST.800-61, ISO27001.A.5.24, NIST.CSF.RS.MA, SOC2.CC7.4 | — | Contain, preserve & report |
| Incident record | incident | NIST.800-61.DETECT, ISO27001.A.5.26, NIST.CSF.RS.AN | Threat Investigation Report; Incident Response Report; Detection Record | — |
| Post-incident review | incident | NIST.800-61.POST, ISO27001.A.5.27, NIST.CSF.ID.IM | Incident Response Report; Executive Debrief & Lessons Learned | — |
| Chain of custody | custody | ISO27037, ISO27001.A.5.28, NIST.800-61 | — | Investigate & prove it; Contain, preserve & report |
| Scope and rules of engagement | scope | NIST.800-115, PTES | — | Investigate & prove it; Scan from the attacker’s side |
| Vulnerability management | patching | NIST.800-53.RA-5, CIS.7, ISO27001.A.8.8, NIST.CSF.ID.RA | Vulnerability Assessment; SOC Findings Record | — |
| Monitoring plan | monitoring | NIST.CSF.DE.CM, ISO27001.A.8.16, SOC2.CC7.2, ITIL.monitoring | SOC Monitoring Report; Coverage Validation Report; Alert Triage Report | — |
| Sensor deployment record | monitoring | NIST.CSF.DE.CM-01, ISO27001.A.8.15 | Coverage Validation Report; Sensor Deployment Record | Deploy the Windows endpoint sensor; Deploy your Ubuntu sensor, prove the feed, write the baseline; Deploy the network sensor, then validate coverage |
| Indicator database | monitoring | MITRE.ATTACK, NIST.CSF.DE.AE | IOC Database | — |
| Governance report | governance | NIST.CSF.GV, ISO27001.9.3 | Executive Debrief & Lessons Learned | — |
| Assessment report | assessment | NIST.800-115, PTES, CVSS | Vulnerability Assessment; Scan Validation Report | — |

## Standards

| Standard | Tagged on tasks | Cited by forms |
| --- | --- | --- |
| NIST CSF | Deploy the Windows endpoint sensor; Deploy your Ubuntu sensor, prove the feed, write the baseline; Deploy the network sensor, then validate coverage; Triage the alerts; Investigate & prove it; Turn findings into indicators; Debrief the team (capstone) | SOC Monitoring Report; Coverage Validation Report; Executive Debrief & Lessons Learned; Sensor Deployment Record |
| CIS | Read what the SOC already knows | SOC Findings Record |
| CVSS | Read what the SOC already knows; Scan from the attacker’s side; Rank the risk & write the fix plan | Vulnerability Assessment; SOC Findings Record |
| NIST 800-61 | Find the incident; Rebuild the attack; Contain, preserve & report | Threat Investigation Report; Incident Response Report; Alert Triage Report; Detection Record; Executive Debrief & Lessons Learned |
| NIST 800-115 | Read what the SOC already knows; Scan from the attacker’s side; Rank the risk & write the fix plan | Vulnerability Assessment; Scan Validation Report |
| MITRE ATT&CK | — | IOC Database |

| Control cited | Standard | By |
| --- | --- | --- |
| NIST.CSF.DE Detect | NIST_CSF | Coverage Validation Report |
| NIST.CSF.RC Recover | NIST_CSF | Executive Debrief & Lessons Learned |
| NIST.CSF.DE.CM Continuous Monitoring | NIST_CSF | SOC Monitoring Report |
| NIST.CSF.DE.CM-01 Networks and network services are monitored | NIST_CSF | Sensor Deployment Record |
| NIST.800-61 Computer Security Incident Handling Guide | NIST_800_61 | Incident Response Report |
| NIST.800-61.DETECT Detection and Analysis | NIST_800_61 | Threat Investigation Report; Alert Triage Report; Detection Record |
| NIST.800-61.POST Post-Incident Activity | NIST_800_61 | Executive Debrief & Lessons Learned |
| NIST.800-115 Technical Guide to Information Security Testing | NIST_800_115 | Vulnerability Assessment; Scan Validation Report |
| CIS.CONTROLS CIS Critical Security Controls v8 | CIS | SOC Findings Record |
| CVSS Common Vulnerability Scoring System | CVSS | Vulnerability Assessment; SOC Findings Record |
| MITRE.ATTACK ATT&CK Enterprise | MITRE_ATTACK | IOC Database |

## Tactics and practices

| Tactic | Practised or defended by |
| --- | --- |
| Reconnaissance (TA0043) | Investigate & prove it; Scan from the attacker’s side |
| Initial Access (TA0001) | Turn findings into indicators; Find the incident; Rebuild the attack; Contain, preserve & report |
| Execution (TA0002) | Rebuild the attack |
| Credential Access (TA0006) | Investigate & prove it; Turn findings into indicators |
| Discovery (TA0007) | Scan from the attacker’s side |

| Practice | Anchor | Asked for by |
| --- | --- | --- |
| Hash evidence at capture | ISO_27037 | Investigate & prove it; Scan from the attacker’s side; Contain, preserve & report |
| Authorised testing only | NIST_800_115 | Investigate & prove it; Scan from the attacker’s side |
| CVSS severity | CVSS | Rank the risk & write the fix plan |
| Likelihood-times-impact scoring | NIST_800_30 | Rank the risk & write the fix plan |
| Managed patching | NIST_800_40 | Rank the risk & write the fix plan |
| Configuration scanning | CIS.BENCHMARK | Read what the SOC already knows |
| Centralised logging | NIST.CSF.DE.CM | Deploy the Windows endpoint sensor; Deploy your Ubuntu sensor, prove the feed, write the baseline; Deploy the network sensor, then validate coverage |
| Capture a baseline | NIST.CSF.DE.CM | Deploy your Ubuntu sensor, prove the feed, write the baseline |
| Alert to ticket | ITIL.incident | Triage the alerts; Find the incident |
| ATT&CK-mapped reporting | MITRE_ATTACK | Turn findings into indicators |
| Indicators from evidence | MITRE_ATTACK | Turn findings into indicators |
| Contain before analysing | NIST.800-61.CONTAIN | Contain, preserve & report |
| Evidence-backed timeline | NIST.800-61.DETECT | Find the incident; Rebuild the attack |
| Lessons learned | NIST.800-61.POST | Debrief the team (capstone) |
| Evidence by design | SOC2 | Deploy the network sensor, then validate coverage |
| Write for leadership | NIST.CSF.RS.CO | Debrief the team (capstone) |
| Metrics with targets | ISO27001.9.1 | Debrief the team (capstone) |

## KPI board

The sixteen numbers the Skill board keeps per member of this course, the catalogue row and kind of fact each one reads, and what it is counted over here, role by role.

| KPI | Family | Reads | Denominator in this course |
| --- | --- | --- | --- |
| Skills verified `kpi.technical.skills-verified` | technical | metric.skill-verified (own) | blue: 4 skills with a verifiable step; grc: 9 skills with a verifiable step; red: 4 skills with a verifiable step |
| Exam weight verified `kpi.technical.exam-weight-verified` | technical | metric.domain-weight-verified (own) | blue: 83 percent of the exam over 3 domains; grc: 100 percent of the exam over 4 domains; red: 100 percent of the exam over 4 domains |
| Commands verified `kpi.technical.commands-verified` | technical | metric.tool-commands-verified (own) | blue: 4 verifiable steps that run a command; grc: 7 verifiable steps that run a command; red: 4 verifiable steps that run a command |
| Procedures to standard `kpi.technical.procedures-to-standard` | technical | metric.procedure-to-standard (team) | blue: 9 procedures; grc: 11 procedures; red: 11 procedures |
| Faults resolved `kpi.problem-solving.faults-resolved` | problem-solving | metric.trouble-resolved (team) | blue: 2 fault, incident or triage tables; grc: 2 fault, incident or triage tables; red: 2 fault, incident or triage tables |
| Verified after retry `kpi.problem-solving.persistence` | problem-solving | metric.ability-persistence (own) | blue: 6 verifiable steps; grc: 8 verifiable steps; red: 4 verifiable steps |
| Stuck flags cleared `kpi.problem-solving.flags-cleared` | problem-solving | metric.ability-flags-cleared (own) | the stuck flags the member raises; no content denominator |
| Time to resolution `kpi.problem-solving.time-to-resolution` | problem-solving | metric.time-to-verify (own) | blue: 6 verifiable steps that can carry two stamps; grc: 8 verifiable steps that can carry two stamps; red: 4 verifiable steps that can carry two stamps |
| Steps verified in order `kpi.execution.steps-in-order` | execution | metric.procedure-in-order (own) | blue: 1 task with two or more verifiable steps; grc: 3 tasks with two or more verifiable steps; red: 2 tasks with two or more verifiable steps |
| First-try verifications `kpi.execution.first-try` | execution | metric.ability-first-try (own) | blue: 6 verifiable steps; grc: 8 verifiable steps; red: 4 verifiable steps |
| Files named to convention `kpi.execution.evidence-named` | execution | metric.evidence-naming (own) | the files the member hashes; no content denominator |
| Definition-of-Done met `kpi.execution.dod-met` | execution | metric.doc-dod-met (team) | blue: 10 checks on 4 forms; grc: 14 checks on 5 forms; red: 13 checks on 5 forms |
| Decisions recorded `kpi.decision-making.decisions-recorded` | decision-making | metric.decision-recorded (team) | blue: 0 decision blocks; grc: 0 decision blocks; red: 1 decision block |
| Decisions justified `kpi.decision-making.decisions-justified` | decision-making | metric.decision-justified (team) | blue: 0 decision blocks; grc: 0 decision blocks; red: 1 decision block |
| Decisions approved `kpi.decision-making.decisions-approved` | decision-making | metric.decision-approved (team) | blue: 0 decision blocks; grc: 0 decision blocks; red: 1 decision block |
| Changes with rollback `kpi.decision-making.change-rollback` | decision-making | metric.procedure-change-recorded (team) | blue: 1 change table with a rollback column; grc: 1 change table with a rollback column; red: 1 change table with a rollback column |
| Hand-offs completed `kpi.teamwork.handoffs` | teamwork | metric.collab-handoffs (team) | blue: 4 hand-offs; grc: 5 hand-offs; red: 4 hand-offs |
| RACI respected `kpi.teamwork.raci-respected` | teamwork | metric.collab-raci-respected (team) | blue: 12 forms with a RACI; grc: 12 forms with a RACI; red: 12 forms with a RACI |
| Peer reviews given `kpi.teamwork.peer-reviews-given` | teamwork | metric.collab-peer-reviews-given (own) | the reviews assigned to the member; no content denominator |
| Teammate steps ticked `kpi.teamwork.teammate-steps` | teamwork | metric.collab-teammate-steps (own) | a count; no denominator |
| On time `kpi.professionalism.on-time` | professionalism | metric.ability-deadline-adherence (own) | blue: 4 tasks of the role; grc: 5 tasks of the role; red: 4 tasks of the role |
| Document control complete `kpi.professionalism.document-control` | professionalism | metric.doc-control-complete (team) | blue: 4 forms; grc: 5 forms; red: 5 forms |
| Controls cited `kpi.professionalism.controls-cited` | professionalism | metric.standard-controls-cited (team) | blue: 4 control codes on 4 forms; grc: 5 control codes on 4 forms; red: 5 control codes on 4 forms |
| Instructor approved `kpi.professionalism.instructor-approved` | professionalism | metric.doc-instructor-approved (team) | blue: 4 forms; grc: 5 forms; red: 5 forms |
| Skills proved twice `kpi.growth.skills-transferred` | growth | metric.skill-transfer (own) | blue: 0 skills on two or more tasks; grc: 0 skills on two or more tasks; red: 0 skills on two or more tasks |
| Skills retained `kpi.growth.retention` | growth | metric.ability-recall (own) | blue: 4 skills with a verifiable step; grc: 9 skills with a verifiable step; red: 4 skills with a verifiable step |
| Learning velocity `kpi.growth.learning-velocity` | growth | metric.time-learning-velocity (own) | the verification stamps of the last two months; no content denominator |
| Profile coverage `kpi.growth.profile-coverage` | growth | metric.profile-coverage (own) | blue: Cyber Defense Analyst: 78 required, 75 not taught here; grc: Threat and Warning Analyst: 24 required, 17 not taught here; red: Vulnerability Assessment Analyst: 22 required, 19 not taught here |

