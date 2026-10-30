# Security+ Capstone Lab — skills sheet

16 graded tasks and 4 advanced · 38 skills · 35 tools · 16 procedures · 18 standards (16 controls cited) · 5 tactics · 25 practices

Generated from the registries and the course document by `npm run content:export`; edit `src/lib/docs/skills.ts`, `tools.ts`, `standards.ts`, `sops.ts`, `tactics.ts` or the seed, not this file.

## Skills

| Skill | Area | Anchored to | Practised by |
| --- | --- | --- | --- |
| Gather open-source intelligence on a target `comp.recon.osint` | Reconnaissance | SY0-701.d2, NIST.800-115 | OSINT & Passive Recon |
| Enumerate DNS and WHOIS records `comp.recon.dns-whois` | Reconnaissance | SY0-701.d2 | OSINT & Passive Recon |
| Fingerprint web technologies `comp.recon.fingerprint-web` | Reconnaissance | SY0-701.d2 | OSINT & Passive Recon |
| Scan ports and services with nmap `comp.recon.port-scan` | Reconnaissance | SY0-701.d2, CS0-003.d2, NIST.800-115 | Vulnerability Discovery |
| Scan a web server for known weaknesses `comp.recon.web-scan` | Reconnaissance | SY0-701.d2, CS0-003.d2, OWASP | Vulnerability Discovery |
| Summarise vulnerabilities for a non-attacker reader `comp.vuln.summarise-findings` | Vulnerability management | SY0-701.d2, CS0-003.d4 | Vulnerability Discovery |
| Score a vulnerability with CVSS `comp.vuln.cvss-score` | Vulnerability management | SY0-701.d5, CS0-003.d2, CVSS | Risk Assessment & Vulnerability-Management SOP |
| Exploit SQL injection with evidence `comp.exploit.sql-injection` | Exploitation and testing | SY0-701.d2, OWASP | Authorized Attacks & Evidence |
| Brute-force authentication in scope `comp.exploit.brute-force` | Exploitation and testing | SY0-701.d2, MITRE_ATTACK | Authorized Attacks & Evidence |
| Prove a full exploit chain with evidence `comp.exploit.exploit-chain` | Exploitation and testing | SY0-701.d2, NIST.800-115 | Authorized Attacks & Evidence |
| Explain exploits to non-technical stakeholders `comp.report.technical-briefing` | Reporting | SY0-701.d5, CS0-003.d4 | Technical Findings Briefing |
| Summarise detection work and build an incident timeline `comp.report.incident-findings` | Reporting | SY0-701.d4, NIST.800-61.POST | Incident Response Findings |
| Compile a professional security report `comp.report.final-report` | Reporting | SY0-701.d5, ISO27001.9.3 | Final Report & Presentation |
| Harden Linux with ufw, fail2ban and Lynis `comp.harden.linux-baseline` | Hardening and defence | SY0-701.d3, CIS.BENCHMARK | Baseline Hardening (Ubuntu + Windows) |
| Harden Windows with Firewall and Defender `comp.harden.windows-baseline` | Hardening and defence | SY0-701.d3, CIS.BENCHMARK | Baseline Hardening (Ubuntu + Windows) |
| Capture and baseline traffic and logs `comp.detect.capture-baseline` | Detection and monitoring | SY0-701.d4, CS0-003.d1, NIST.CSF.DE.CM | Baseline Capture & Detection Engineering (Linux + Windows) |
| Write a detection filter or rule `comp.detect.write-detection` | Detection and monitoring | SY0-701.d4, NIST.CSF.DE.AE | Baseline Capture & Detection Engineering (Linux + Windows) |
| Read Windows event logs for an attack `comp.detect.windows-event-logs` | Detection and monitoring | SY0-701.d4 | Baseline Capture & Detection Engineering (Linux + Windows); Live Detection & Response (Linux + Windows) |
| Triage live from packets and logs `comp.detect.live-triage` | Detection and monitoring | SY0-701.d4, NIST.800-61.DETECT | Live Detection & Response (Linux + Windows) |
| Contain an attacker with a timestamped block `comp.respond.contain` | Incident response | SY0-701.d4, CS0-003.d3, NIST.800-61.CONTAIN | Live Detection & Response (Linux + Windows) |
| Rebuild an attack timeline from logs `comp.respond.timeline` | Incident response | SY0-701.d4, CS0-003.d3, NIST.800-61.DETECT | Incident Response Findings |
| Write an incident-response runbook `comp.respond.ir-runbook` | Incident response | SY0-701.d4, NIST.800-61, ISO27001.A.5.24 | Incident-Response Runbook & Chain of Custody |
| Hash and log evidence `comp.forensics.hash-evidence` | Evidence and forensics | SY0-701.d4, CS0-003.d3, CY0-001.d2, ISO_27037 | Framework Mapping & Hardening Standard; Incident-Response Runbook & Chain of Custody |
| Keep a chain of custody `comp.forensics.chain-of-custody` | Evidence and forensics | SY0-701.d4, ISO_27037 | Incident-Response Runbook & Chain of Custody |
| Map findings to NIST CSF and CIS `comp.grc.framework-mapping` | Governance and compliance | SY0-701.d5, NIST.CSF, CIS.CONTROLS | Framework Mapping & Hardening Standard |
| Write a hardening standard as an SOP `comp.grc.hardening-standard` | Governance and compliance | SY0-701.d5, CIS.BENCHMARK | Framework Mapping & Hardening Standard |
| Write a vulnerability-management SOP `comp.grc.vm-sop` | Governance and compliance | SY0-701.d5, NIST_800_40 | Risk Assessment & Vulnerability-Management SOP |
| Score risk as likelihood times impact `comp.risk.likelihood-impact` | Risk | SY0-701.d5, NIST_800_30 | Risk Assessment & Vulnerability-Management SOP |
| Prove prompt injection with evidence `comp.ai-attack.prompt-injection` | AI attack and evaluation | CY0-001.d2, OWASP.LLM | Prove a prompt injection |
| Prove sensitive information disclosure `comp.ai-attack.sensitive-disclosure` | AI attack and evaluation | CY0-001.d2, OWASP.LLM | Prove a data leak |
| Map AI threats to OWASP and ATLAS `comp.ai-attack.map-to-atlas` | AI attack and evaluation | CY0-001.d2, MITRE.ATLAS | Prove a prompt injection |
| Automate an attack suite with a pass line `comp.ai-attack.automate-suite` | AI attack and evaluation | CY0-001.d3, NIST_AI_RMF | Automate the attack suite; Report the validation |
| Reproduce a suite on a rebuilt copy `comp.ai-attack.reproduce` | AI attack and evaluation | CY0-001.d3, NIST_800_218 | Prove a data leak; Automate the attack suite |
| Write paper cases: poisoning, theft, inference `comp.ai-attack.paper-cases` | AI attack and evaluation | CY0-001.d3, MITRE.ATLAS | Report the validation |
| Run a local AI assistant offline `comp.ai.local-assistant` | Applied AI | NIST.AI-RMF.MANAGE | AI extension: explain the hardening baseline; AI extension: summarise the risks found; AI extension: draft the incident timeline; AI extension: review the final report |
| Ground an AI answer in the records `comp.ai.ground-in-records` | Applied AI | NIST.AI-RMF.MAP | AI extension: summarise the risks found; AI extension: draft the incident timeline; AI extension: review the final report |
| Verify AI output against the evidence `comp.ai.verify-ai-output` | Applied AI | NIST.AI-RMF.MEASURE | AI extension: explain the hardening baseline; AI extension: summarise the risks found; AI extension: draft the incident timeline; AI extension: review the final report |
| Write a task-specific prompt `comp.ai.prompt-for-the-task` | Applied AI | NIST.AI-RMF.MAP | AI extension: explain the hardening baseline |

## Tools

| Tool | Kind | Used by |
| --- | --- | --- |
| Linux shell | cli | OSINT & Passive Recon; Vulnerability Discovery; Authorized Attacks & Evidence; Technical Findings Briefing; Baseline Hardening (Ubuntu + Windows); Baseline Capture & Detection Engineering (Linux + Windows); Live Detection & Response (Linux + Windows); Framework Mapping & Hardening Standard; Incident-Response Runbook & Chain of Custody; Prove a prompt injection; Prove a data leak; Automate the attack suite; Report the validation |
| PowerShell | cli | Baseline Hardening (Ubuntu + Windows); Baseline Capture & Detection Engineering (Linux + Windows); Live Detection & Response (Linux + Windows) |
| SSH | cli | Baseline Hardening (Ubuntu + Windows) |
| curl | cli | Authorized Attacks & Evidence |
| ping / traceroute | cli | OSINT & Passive Recon |
| nslookup | cli | OSINT & Passive Recon |
| sha256sum | cli | Framework Mapping & Hardening Standard; Incident-Response Runbook & Chain of Custody |
| Capstone forms | document | Final Report & Presentation; AI extension: explain the hardening baseline; AI extension: summarise the risks found; AI extension: draft the incident timeline; AI extension: review the final report; Prove a prompt injection; Prove a data leak; Automate the attack suite; Report the validation |
| Markdown | language | Technical Findings Briefing; Incident Response Findings; Framework Mapping & Hardening Standard; Risk Assessment & Vulnerability-Management SOP; Incident-Response Runbook & Chain of Custody; Final Report & Presentation |
| Slides | app | Technical Findings Briefing; Incident Response Findings; Final Report & Presentation |
| whois | cli | OSINT & Passive Recon |
| dig | cli | OSINT & Passive Recon |
| WhatWeb | cli | OSINT & Passive Recon |
| theHarvester | cli | OSINT & Passive Recon |
| nmap | cli | Vulnerability Discovery |
| Nikto | cli | Vulnerability Discovery |
| sqlmap | cli | Authorized Attacks & Evidence |
| Hydra | cli | Authorized Attacks & Evidence |
| netcat | cli | Authorized Attacks & Evidence |
| Metasploit | cli | Authorized Attacks & Evidence |
| garak | cli | Prove a prompt injection |
| ufw | cli | Baseline Hardening (Ubuntu + Windows); Live Detection & Response (Linux + Windows) |
| fail2ban | cli | Baseline Hardening (Ubuntu + Windows) |
| Lynis | cli | Baseline Hardening (Ubuntu + Windows) |
| Windows Firewall | app | Baseline Hardening (Ubuntu + Windows); Live Detection & Response (Linux + Windows) |
| Microsoft Defender | app | Baseline Hardening (Ubuntu + Windows) |
| Windows Event Viewer | app | Baseline Capture & Detection Engineering (Linux + Windows); Live Detection & Response (Linux + Windows) |
| tcpdump | cli | Baseline Capture & Detection Engineering (Linux + Windows); Live Detection & Response (Linux + Windows) |
| Wireshark | app | Baseline Capture & Detection Engineering (Linux + Windows) |
| PHP | language | Authorized Attacks & Evidence |
| LLM Guard | service | Prove a data leak |
| Ollama | service | AI extension: explain the hardening baseline; AI extension: summarise the risks found; AI extension: draft the incident timeline; AI extension: review the final report |
| Git | cli | Automate the attack suite |
| Docker | cli | Live Detection & Response (Linux + Windows) |
| Python | language | Prove a prompt injection; Prove a data leak; Automate the attack suite; Report the validation |

## Procedures

Runbooks and standard operating procedures the forms are instances of, and the tasks that execute them.

| Procedure | Kind | Standards | Forms | Executed by |
| --- | --- | --- | --- | --- |
| Operational runbook | runbook | ISO27001.A.5.37, NIST.CSF.PR.PS | Hardening Standard; Vulnerability-Management SOP; Incident-Response Runbook | — |
| Incident response plan | incident | NIST.800-61, ISO27001.A.5.24, NIST.CSF.RS.MA, SOC2.CC7.4 | Incident-Response Runbook | Live Detection & Response (Linux + Windows) |
| Incident record | incident | NIST.800-61.DETECT, ISO27001.A.5.26, NIST.CSF.RS.AN | Incident Report | — |
| Post-incident review | incident | NIST.800-61.POST, ISO27001.A.5.27, NIST.CSF.ID.IM | Incident Report | — |
| Change record | change | ITIL.change, ISO27001.A.8.32, NIST.800-53.CM-3, SOC2.CC8.1 | Change Log | Baseline Hardening (Ubuntu + Windows) |
| Chain of custody | custody | ISO27037, ISO27001.A.5.28, NIST.800-61 | Evidence Log | Incident-Response Runbook & Chain of Custody |
| Scope and rules of engagement | scope | NIST.800-115, PTES | Scope & Rules of Engagement | OSINT & Passive Recon; Vulnerability Discovery; Authorized Attacks & Evidence |
| Hardening baseline | baseline | CIS.BENCHMARK, NIST.800-53.CM-6, ISO27001.A.8.9, NIST.CSF.PR.PS | Hardening Baseline; Hardening Standard | Baseline Hardening (Ubuntu + Windows) |
| Vulnerability management | patching | NIST.800-53.RA-5, CIS.7, ISO27001.A.8.8, NIST.CSF.ID.RA | Vulnerability-Management SOP | — |
| Risk register | risk | NIST.800-30, ISO27005, ISO27001.6.1.2, NIST.CSF.GV.RM | Risk Register | — |
| Security policy | policy | ISO27001.5.2, ISO27001.A.5.1, NIST.CSF.GV.PO, NIST.800-53.PM-1 | Lab Security Policy | — |
| Asset inventory | inventory | NIST.CSF.ID.AM, CIS.1, ISO27001.A.5.9, ITIL.asset | Asset Inventory | — |
| Control mapping | governance | ISO27001.6.1.3, SOC2, NIST.CSF | Framework Mapping | — |
| Governance report | governance | NIST.CSF.GV, ISO27001.9.3 | Final Report & Briefing | — |
| Assessment report | assessment | NIST.800-115, PTES, CVSS | Penetration Test Report | — |
| Portfolio record | handover | ISO42010, NIST.800-53.PL-2, ITIL.knowledge | Portfolio | — |

## Standards

| Standard | Tagged on tasks | Cited by forms |
| --- | --- | --- |
| NIST CSF | OSINT & Passive Recon; Vulnerability Discovery; Technical Findings Briefing; Baseline Hardening (Ubuntu + Windows); Baseline Capture & Detection Engineering (Linux + Windows); Live Detection & Response (Linux + Windows); Incident Response Findings; Framework Mapping & Hardening Standard; Risk Assessment & Vulnerability-Management SOP; Final Report & Presentation | Asset Inventory; Framework Mapping |
| CIS | OSINT & Passive Recon; Vulnerability Discovery; Authorized Attacks & Evidence; Baseline Hardening (Ubuntu + Windows); Framework Mapping & Hardening Standard | Hardening Baseline; Framework Mapping; Hardening Standard |
| OWASP | OSINT & Passive Recon; Vulnerability Discovery; Authorized Attacks & Evidence; Live Detection & Response (Linux + Windows) | — |
| CVSS | Authorized Attacks & Evidence; Risk Assessment & Vulnerability-Management SOP | — |
| NIST 800-61 | Authorized Attacks & Evidence; Live Detection & Response (Linux + Windows); Incident Response Findings; Incident-Response Runbook & Chain of Custody | Incident Report; Incident-Response Runbook; Evidence Log |
| NIST 800-115 | Authorized Attacks & Evidence; Baseline Capture & Detection Engineering (Linux + Windows) | Penetration Test Report |
| ISO 27001 | Technical Findings Briefing; Framework Mapping & Hardening Standard; Risk Assessment & Vulnerability-Management SOP; Incident-Response Runbook & Chain of Custody; Final Report & Presentation | Final Report & Briefing; Lab Security Policy |
| STRIDE | Framework Mapping & Hardening Standard | — |
| ITIL 4 | — | Change Log |
| NIST AI RMF | AI extension: explain the hardening baseline; AI extension: summarise the risks found; AI extension: draft the incident timeline; AI extension: review the final report | — |
| OWASP LLM Top 10 | Prove a prompt injection; Prove a data leak; Automate the attack suite; Report the validation | — |
| NIST SP 800-53 | — | Portfolio |
| NIST SP 800-30 | — | Risk Register |
| NIST SP 800-40 | — | Vulnerability-Management SOP |
| ISO/IEC 27005 | — | Risk Register |
| ISO/IEC 27037 | — | Evidence Log |
| ISO/IEC/IEEE 42010 | — | Portfolio |
| PTES | — | Penetration Test Report |

| Control cited | Standard | By |
| --- | --- | --- |
| NIST.CSF Cybersecurity Framework 2.0 | NIST_CSF | Framework Mapping |
| NIST.CSF.ID.AM Asset Management | NIST_CSF | Asset Inventory |
| NIST.800-53.PL-2 System Security and Privacy Plans | NIST_800_53 | Portfolio |
| NIST.800-61 Computer Security Incident Handling Guide | NIST_800_61 | Incident Report; Incident-Response Runbook; Evidence Log |
| NIST.800-115 Technical Guide to Information Security Testing | NIST_800_115 | Penetration Test Report |
| NIST.800-30 Guide for Conducting Risk Assessments | NIST_800_30 | Risk Register |
| NIST.800-40 Enterprise Patch Management Planning | NIST_800_40 | Vulnerability-Management SOP |
| ISO27001.5.2 Policy | ISO_27001 | Lab Security Policy |
| ISO27001.9.3 Management review | ISO_27001 | Final Report & Briefing |
| ITIL.change Change enablement | ITIL | Change Log |
| CIS.BENCHMARK CIS Benchmarks | CIS | Hardening Baseline; Hardening Standard |
| CIS.CONTROLS CIS Critical Security Controls v8 | CIS | Framework Mapping |
| ISO42010 Architecture description | ISO_42010 | Portfolio |
| ISO27005 Information security risk management | ISO_27005 | Risk Register |
| ISO27037 Digital evidence handling | ISO_27037 | Evidence Log |
| PTES Penetration Testing Execution Standard | PTES | Penetration Test Report |

Forms whose standard names a practice rather than a control:

- Scope & Rules of Engagement: practice.authorised-testing

## Tactics and practices

| Tactic | Practised or defended by |
| --- | --- |
| Reconnaissance (TA0043) | OSINT & Passive Recon; Vulnerability Discovery |
| Initial Access (TA0001) | Authorized Attacks & Evidence; Live Detection & Response (Linux + Windows) |
| Execution (TA0002) | Authorized Attacks & Evidence |
| Credential Access (TA0006) | Authorized Attacks & Evidence; Live Detection & Response (Linux + Windows) |
| Discovery (TA0007) | Vulnerability Discovery |

| Practice | Anchor | Asked for by |
| --- | --- | --- |
| Default deny | NIST.800-53.SC-7 | Baseline Hardening (Ubuntu + Windows) |
| Hash evidence at capture | ISO_27037 | OSINT & Passive Recon; Vulnerability Discovery; Authorized Attacks & Evidence; Framework Mapping & Hardening Standard; Incident-Response Runbook & Chain of Custody; Prove a prompt injection |
| Authorised testing only | NIST_800_115 | OSINT & Passive Recon; Vulnerability Discovery; Authorized Attacks & Evidence; Prove a prompt injection |
| Passive before active | PTES | OSINT & Passive Recon |
| Retest to closure | NIST_800_115 | Prove a data leak |
| CVSS severity | CVSS | Risk Assessment & Vulnerability-Management SOP |
| Likelihood-times-impact scoring | NIST_800_30 | Risk Assessment & Vulnerability-Management SOP |
| Backup before change | ITIL.change | Baseline Hardening (Ubuntu + Windows) |
| Hardening baseline | CIS.BENCHMARK | Baseline Hardening (Ubuntu + Windows) |
| Guardrail regression tests | NIST_800_218 | Automate the attack suite |
| Capture a baseline | NIST.CSF.DE.CM | Baseline Capture & Detection Engineering (Linux + Windows); Live Detection & Response (Linux + Windows) |
| Detection as code | MITRE_ATTACK | Baseline Capture & Detection Engineering (Linux + Windows) |
| Contain before analysing | NIST.800-61.CONTAIN | Live Detection & Response (Linux + Windows) |
| Evidence-backed timeline | NIST.800-61.DETECT | Incident Response Findings |
| Lessons learned | NIST.800-61.POST | Incident Response Findings |
| Written policy | NIST.CSF.GV.PO | Framework Mapping & Hardening Standard |
| Written runbooks | ISO27001.A.5.37 | Risk Assessment & Vulnerability-Management SOP; Incident-Response Runbook & Chain of Custody |
| Control mapping | ISO27001.6.1.3 | Framework Mapping & Hardening Standard |
| Evidence by design | SOC2 | Final Report & Presentation |
| Corrective action | ISO27001.10.2 | Report the validation |
| Write for leadership | NIST.CSF.RS.CO | Technical Findings Briefing; Final Report & Presentation |
| Customer assurance | SOC2 | Report the validation |
| Input and output guardrails | OWASP_LLM | Prove a data leak |
| Human checkpoint | NIST_AI_RMF | AI extension: explain the hardening baseline; AI extension: summarise the risks found; AI extension: draft the incident timeline; AI extension: review the final report |
| Suites with a pass line | NIST_AI_RMF | Automate the attack suite |

## KPI board

The sixteen numbers the Skill board keeps per member of this course, the catalogue row and kind of fact each one reads, and what it is counted over here, role by role.

| KPI | Family | Reads | Denominator in this course |
| --- | --- | --- | --- |
| Skills verified `kpi.technical.skills-verified` | technical | metric.skill-verified (own) | red: 19 skills with a verifiable step; blue: 17 skills with a verifiable step; grc: 15 skills with a verifiable step |
| Exam weight verified `kpi.technical.exam-weight-verified` | technical | metric.domain-weight-verified (own) | red: 42 percent of the exam over 2 domains; blue: 46 percent of the exam over 2 domains; grc: 48 percent of the exam over 2 domains |
| Commands verified `kpi.technical.commands-verified` | technical | metric.tool-commands-verified (own) | red: 19 verifiable steps that run a command; blue: 17 verifiable steps that run a command; grc: 12 verifiable steps that run a command |
| Procedures to standard `kpi.technical.procedures-to-standard` | technical | metric.procedure-to-standard (team) | red: 9 procedures; blue: 13 procedures; grc: 16 procedures |
| Faults resolved `kpi.problem-solving.faults-resolved` | problem-solving | metric.trouble-resolved (team) | red: 1 fault, incident or triage table; blue: 1 fault, incident or triage table; grc: 1 fault, incident or triage table |
| Verified after retry `kpi.problem-solving.persistence` | problem-solving | metric.ability-persistence (own) | red: 19 verifiable steps; blue: 17 verifiable steps; grc: 12 verifiable steps |
| Stuck flags cleared `kpi.problem-solving.flags-cleared` | problem-solving | metric.ability-flags-cleared (own) | the stuck flags the member raises; no content denominator |
| Time to resolution `kpi.problem-solving.time-to-resolution` | problem-solving | metric.time-to-verify (own) | red: 19 verifiable steps that can carry two stamps; blue: 17 verifiable steps that can carry two stamps; grc: 12 verifiable steps that can carry two stamps |
| Steps verified in order `kpi.execution.steps-in-order` | execution | metric.procedure-in-order (own) | red: 3 tasks with two or more verifiable steps; blue: 3 tasks with two or more verifiable steps; grc: 2 tasks with two or more verifiable steps |
| First-try verifications `kpi.execution.first-try` | execution | metric.ability-first-try (own) | red: 19 verifiable steps; blue: 17 verifiable steps; grc: 12 verifiable steps |
| Files named to convention `kpi.execution.evidence-named` | execution | metric.evidence-naming (own) | the files the member hashes; no content denominator |
| Definition-of-Done met `kpi.execution.dod-met` | execution | metric.doc-dod-met (team) | red: 8 checks on 3 forms; blue: 11 checks on 4 forms; grc: 19 checks on 12 forms |
| Decisions recorded `kpi.decision-making.decisions-recorded` | decision-making | metric.decision-recorded (team) | red: 0 decision blocks; blue: 1 decision block; grc: 0 decision blocks |
| Decisions justified `kpi.decision-making.decisions-justified` | decision-making | metric.decision-justified (team) | red: 0 decision blocks; blue: 1 decision block; grc: 0 decision blocks |
| Decisions approved `kpi.decision-making.decisions-approved` | decision-making | metric.decision-approved (team) | red: 0 decision blocks; blue: 1 decision block; grc: 0 decision blocks |
| Changes with rollback `kpi.decision-making.change-rollback` | decision-making | metric.procedure-change-recorded (team) | red: 1 change table with a rollback column; blue: 1 change table with a rollback column; grc: 1 change table with a rollback column |
| Hand-offs completed `kpi.teamwork.handoffs` | teamwork | metric.collab-handoffs (team) | red: 8 hand-offs; blue: 8 hand-offs; grc: 10 hand-offs |
| RACI respected `kpi.teamwork.raci-respected` | teamwork | metric.collab-raci-respected (team) | red: 8 forms with a RACI; blue: 12 forms with a RACI; grc: 15 forms with a RACI |
| Peer reviews given `kpi.teamwork.peer-reviews-given` | teamwork | metric.collab-peer-reviews-given (own) | the reviews assigned to the member; no content denominator |
| Teammate steps ticked `kpi.teamwork.teammate-steps` | teamwork | metric.collab-teammate-steps (own) | a count; no denominator |
| On time `kpi.professionalism.on-time` | professionalism | metric.ability-deadline-adherence (own) | red: 12 tasks of the role; blue: 12 tasks of the role; grc: 12 tasks of the role |
| Document control complete `kpi.professionalism.document-control` | professionalism | metric.doc-control-complete (team) | red: 3 forms; blue: 4 forms; grc: 12 forms |
| Controls cited `kpi.professionalism.controls-cited` | professionalism | metric.standard-controls-cited (team) | red: 2 control codes on 1 form; blue: 3 control codes on 3 forms; grc: 13 control codes on 11 forms |
| Instructor approved `kpi.professionalism.instructor-approved` | professionalism | metric.doc-instructor-approved (team) | red: 3 forms; blue: 4 forms; grc: 12 forms |
| Skills proved twice `kpi.growth.skills-transferred` | growth | metric.skill-transfer (own) | red: 5 skills on two or more tasks; blue: 6 skills on two or more tasks; grc: 6 skills on two or more tasks |
| Skills retained `kpi.growth.retention` | growth | metric.ability-recall (own) | red: 19 skills with a verifiable step; blue: 17 skills with a verifiable step; grc: 15 skills with a verifiable step |
| Learning velocity `kpi.growth.learning-velocity` | growth | metric.time-learning-velocity (own) | the verification stamps of the last two months; no content denominator |
| Profile coverage `kpi.growth.profile-coverage` | growth | metric.profile-coverage (own) | red: Exploitation Analyst: 29 required, 14 not taught here; blue: Cyber Defense Analyst: 78 required, 72 not taught here; grc: Security Control Assessor: 42 required, 37 not taught here |
| Values recalled `kpi.validation.recall-accuracy` | validation | metric.validation-recall (own) |  |
| Scenarios applied `kpi.validation.applied-scenarios` | validation | metric.validation-applied (own) |  |
| Conflicts resolved `kpi.validation.conflicts-resolved` | validation | metric.conflicts-resolved (own) |  |
| Minutes on task `kpi.validation.time-on-task` | validation | metric.minutes-on-task (own) |  |

