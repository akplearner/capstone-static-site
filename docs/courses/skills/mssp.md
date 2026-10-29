# MSSP: SOC 2 + ISO 27001 Engagement — skills sheet

13 graded tasks · 21 skills · 13 tools · 13 procedures · 10 standards (13 controls cited) · 4 tactics · 17 practices

Generated from the registries and the course document by `npm run content:export`; edit `src/lib/docs/skills.ts`, `tools.ts`, `standards.ts`, `sops.ts`, `tactics.ts` or the seed, not this file.

## Skills

| Skill | Area | Anchored to | Practised by |
| --- | --- | --- | --- |
| Enumerate an external attack surface `comp.recon.attack-surface` | Reconnaissance | SOC-2-ISO-27001.c2, NIST.800-115 | External attack-surface assessment |
| Assess TLS configuration and exposure `comp.recon.tls-hygiene` | Reconnaissance | SOC-2-ISO-27001.c2, NIST.800-53.SC-8 | External attack-surface assessment |
| Run a CIS baseline gap scan `comp.vuln.cis-gap-scan` | Vulnerability management | SOC-2-ISO-27001.c2, CIS.BENCHMARK | CIS baseline gap scan |
| Test a web application to WSTG `comp.exploit.web-pentest` | Exploitation and testing | SOC-2-ISO-27001.c4, OWASP, PTES | Penetration test & retest |
| Retest findings to closure `comp.exploit.retest` | Exploitation and testing | SOC-2-ISO-27001.c5, NIST.800-115 | Penetration test & retest; Close out the retest and attest |
| Attest a test methodology `comp.exploit.tester-attestation` | Exploitation and testing | SOC-2-ISO-27001.c5, PTES | Close out the retest and attest |
| Report MTTD, MTTR and ATT&CK coverage `comp.report.detection-metrics` | Reporting | SOC-2-ISO-27001.c4, SOC2.CC7, ISO27001.9.1 | Report detection & response metrics |
| Implement host firewall and access controls `comp.harden.host-firewall` | Hardening and defence | SOC-2-ISO-27001.c3, NIST.800-53.SC-7 | Implement the technical controls |
| Record each change for the evidence trail `comp.harden.change-discipline` | Hardening and defence | SOC-2-ISO-27001.c3, ITIL.change | Implement the technical controls |
| Write Sigma detections mapped to ATT&CK `comp.detect.sigma-rules` | Detection and monitoring | SOC-2-ISO-27001.c3, MITRE_ATTACK | Detection engineering |
| Validate a detection against a test attack `comp.detect.validate-detection` | Detection and monitoring | SOC-2-ISO-27001.c3, NIST.CSF.DE.AE | Detection engineering |
| Assess risk to ISO 27005 `comp.risk.iso-27005` | Risk | SOC-2-ISO-27001.c2, ISO27005 | Risk assessment & Statement of Applicability |
| Write a Statement of Applicability `comp.risk.soa` | Risk | SOC-2-ISO-27001.c2, ISO27001.6.1.3 | Risk assessment & Statement of Applicability |
| Threat-model a proposed control set `comp.risk.threat-model-controls` | Risk | SOC-2-ISO-27001.c2, NIST.800-115 | Threat-model the proposed controls |
| Accept a risk with a named owner `comp.risk.accept` | Risk | SOC-2-ISO-27001.c5, CY0-001.d4, ISO27001.6.1.3 | Close out the retest and attest |
| Build a cross-framework control matrix `comp.audit.control-matrix` | Audit and assessment | SOC-2-ISO-27001.c3, SOC2, ISO27001 | Build the control matrix |
| Collect evidence per implemented control `comp.audit.evidence-collection` | Audit and assessment | SOC-2-ISO-27001.c4, SOC2.CC4.1 | Coordinate validation & collect evidence; Assemble the audit evidence packet |
| Track findings to closure `comp.audit.remediation-tracking` | Audit and assessment | SOC-2-ISO-27001.c4, SOC2.CC4.1 | Coordinate validation & collect evidence |
| Run an ISO 27001 internal audit `comp.audit.internal-audit` | Audit and assessment | SOC-2-ISO-27001.c4, ISO27001.9.2 | Run the internal audit |
| Raise corrective actions for nonconformities `comp.audit.corrective-action` | Audit and assessment | SOC-2-ISO-27001.c5, ISO27001.10.2 | Run the internal audit |
| Assemble an audit evidence packet `comp.audit.evidence-packet` | Audit and assessment | SOC-2-ISO-27001.c4, SOC2 | Assemble the audit evidence packet |

## Tools

| Tool | Kind | Used by |
| --- | --- | --- |
| Linux shell | cli | Risk assessment & Statement of Applicability; Build the control matrix; Threat-model the proposed controls; Penetration test & retest; Detection engineering; Coordinate validation & collect evidence; Close out the retest and attest; Report detection & response metrics; Run the internal audit; Assemble the audit evidence packet |
| sha256sum | cli | Risk assessment & Statement of Applicability; Build the control matrix; Threat-model the proposed controls; Penetration test & retest; Coordinate validation & collect evidence; Close out the retest and attest; Report detection & response metrics; Run the internal audit; Assemble the audit evidence packet |
| Capstone forms | document | Risk assessment & Statement of Applicability; Build the control matrix; Threat-model the proposed controls; Penetration test & retest; Detection engineering; Coordinate validation & collect evidence; Close out the retest and attest; Report detection & response metrics; Run the internal audit; Assemble the audit evidence packet |
| Ticketing system | service | Coordinate validation & collect evidence |
| nmap | cli | External attack-surface assessment; Penetration test & retest |
| sqlmap | cli | Penetration test & retest |
| Burp Suite | app | Penetration test & retest |
| testssl.sh | cli | External attack-surface assessment |
| ufw | cli | Implement the technical controls |
| Lynis | cli | CIS baseline gap scan |
| auditd | cli | Implement the technical controls |
| Wazuh | service | Detection engineering; Report detection & response metrics |
| Sigma rules | language | Detection engineering |

## Procedures

Runbooks and standard operating procedures the forms are instances of, and the tasks that execute them.

| Procedure | Kind | Standards | Forms | Executed by |
| --- | --- | --- | --- | --- |
| Change record | change | ITIL.change, ISO27001.A.8.32, NIST.800-53.CM-3, SOC2.CC8.1 | — | Implement the technical controls |
| Scope and rules of engagement | scope | NIST.800-115, PTES | Engagement Agreement & Scope | External attack-surface assessment; Penetration test & retest |
| Hardening baseline | baseline | CIS.BENCHMARK, NIST.800-53.CM-6, ISO27001.A.8.9, NIST.CSF.PR.PS | Gap Assessment | CIS baseline gap scan; Implement the technical controls |
| Risk register | risk | NIST.800-30, ISO27005, ISO27001.6.1.2, NIST.CSF.GV.RM | Statement of Applicability (SoA) | — |
| Monitoring plan | monitoring | NIST.CSF.DE.CM, ISO27001.A.8.16, SOC2.CC7.2, ITIL.monitoring | Detection & Response Metrics | — |
| Detection rules | monitoring | NIST.CSF.DE.AE, MITRE.ATTACK, SOC2.CC7.2 | Detection Rules | — |
| Control mapping | governance | ISO27001.6.1.3, SOC2, NIST.CSF | Statement of Applicability (SoA); Control Matrix | — |
| Governance report | governance | NIST.CSF.GV, ISO27001.9.3 | Detection & Response Metrics | — |
| Internal audit | audit | ISO27001.9.2, ISO27001.9.3, SOC2.CC4.1 | Internal Audit Report | Run the internal audit |
| Audit evidence packet | audit | SOC2, ISO27001.7.5, ISO27001.9.2 | Audit Evidence Packet | — |
| Assessment report | assessment | NIST.800-115, PTES, CVSS | Gap Assessment | — |
| Retest and validation record | assessment | NIST.800-115, SOC2.CC4.1 | Retest & Remediation-Validation Report | Penetration test & retest; Close out the retest and attest |
| Portfolio record | handover | ISO42010, NIST.800-53.PL-2, ITIL.knowledge | Portfolio | — |

## Standards

| Standard | Tagged on tasks | Cited by forms |
| --- | --- | --- |
| NIST CSF | Detection engineering | — |
| CIS | CIS baseline gap scan; Implement the technical controls | Gap Assessment |
| OWASP | External attack-surface assessment; Threat-model the proposed controls; Penetration test & retest | — |
| NIST 800-115 | External attack-surface assessment; Threat-model the proposed controls; Penetration test & retest; Close out the retest and attest | Retest & Remediation-Validation Report; Gap Assessment |
| ISO 27001 | Risk assessment & Statement of Applicability; CIS baseline gap scan; Build the control matrix; Implement the technical controls; Threat-model the proposed controls; Coordinate validation & collect evidence; Run the internal audit; Assemble the audit evidence packet | Statement of Applicability (SoA); Control Matrix; Detection & Response Metrics; Internal Audit Report |
| SOC 2 | Risk assessment & Statement of Applicability; Build the control matrix; Implement the technical controls; Threat-model the proposed controls; Penetration test & retest; Detection engineering; Coordinate validation & collect evidence; Close out the retest and attest; Report detection & response metrics; Run the internal audit; Assemble the audit evidence packet | Control Matrix; Detection & Response Metrics; Audit Evidence Packet |
| NIST SP 800-53 | — | Portfolio |
| ISO/IEC/IEEE 42010 | — | Portfolio |
| PTES | — | Retest & Remediation-Validation Report |
| MITRE ATT&CK | — | Detection Rules |

| Control cited | Standard | By |
| --- | --- | --- |
| NIST.800-53.PL-2 System Security and Privacy Plans | NIST_800_53 | Portfolio |
| NIST.800-115 Technical Guide to Information Security Testing | NIST_800_115 | Retest & Remediation-Validation Report; Gap Assessment |
| ISO27001 Information security management system | ISO_27001 | Control Matrix |
| ISO27001.6.1.3 Information security risk treatment | ISO_27001 | Statement of Applicability (SoA) |
| ISO27001.9.1 Monitoring, measurement, analysis and evaluation | ISO_27001 | Detection & Response Metrics |
| ISO27001.9.2 Internal audit | ISO_27001 | Internal Audit Report |
| ISO27001.9.3 Management review | ISO_27001 | Internal Audit Report |
| SOC2 Trust Services Criteria | SOC_2 | Control Matrix; Audit Evidence Packet |
| SOC2.CC7 System Operations | SOC_2 | Detection & Response Metrics |
| CIS.CONTROLS CIS Critical Security Controls v8 | CIS | Gap Assessment |
| MITRE.ATTACK ATT&CK Enterprise | MITRE_ATTACK | Detection Rules |
| ISO42010 Architecture description | ISO_42010 | Portfolio |
| PTES Penetration Testing Execution Standard | PTES | Retest & Remediation-Validation Report |

Forms whose standard names a practice rather than a control:

- Engagement Agreement & Scope: practice.engagement-agreement

## Tactics and practices

| Tactic | Practised or defended by |
| --- | --- |
| Reconnaissance (TA0043) | External attack-surface assessment |
| Initial Access (TA0001) | Threat-model the proposed controls; Penetration test & retest; Detection engineering; Close out the retest and attest |
| Execution (TA0002) | Penetration test & retest |
| Credential Access (TA0006) | Detection engineering |

| Practice | Anchor | Asked for by |
| --- | --- | --- |
| Default deny | NIST.800-53.SC-7 | Implement the technical controls |
| Encryption in transit | NIST.800-53.SC-8 | External attack-surface assessment |
| Authorised testing only | NIST_800_115 | External attack-surface assessment; Penetration test & retest |
| Retest to closure | NIST_800_115 | Penetration test & retest; Close out the retest and attest |
| Likelihood-times-impact scoring | NIST_800_30 | Risk assessment & Statement of Applicability |
| Threat modelling | STRIDE | Threat-model the proposed controls |
| Compensating controls | ISO27001.6.1.3 | Threat-model the proposed controls |
| Change control | ITIL.change | Implement the technical controls |
| Hardening baseline | CIS.BENCHMARK | CIS baseline gap scan; Implement the technical controls |
| Configuration scanning | CIS.BENCHMARK | CIS baseline gap scan |
| Detection as code | MITRE_ATTACK | Detection engineering |
| ATT&CK-mapped reporting | MITRE_ATTACK | Detection engineering; Report detection & response metrics |
| Sign and version documents | ISO27001.7.5 | Assemble the audit evidence packet |
| Control mapping | ISO27001.6.1.3 | Risk assessment & Statement of Applicability; Build the control matrix |
| Evidence by design | SOC2 | Build the control matrix; Coordinate validation & collect evidence; Assemble the audit evidence packet |
| Corrective action | ISO27001.10.2 | Run the internal audit |
| Metrics with targets | ISO27001.9.1 | Report detection & response metrics |

## KPI board

The sixteen numbers the Skill board keeps per member of this course, the catalogue row and kind of fact each one reads, and what it is counted over here, role by role.

| KPI | Family | Reads | Denominator in this course |
| --- | --- | --- | --- |
| Skills verified `kpi.technical.skills-verified` | technical | metric.skill-verified (own) | red: 7 skills with a verifiable step; blue: 6 skills with a verifiable step; grc: 8 skills with a verifiable step |
| Exam weight verified `kpi.technical.exam-weight-verified` | technical | metric.domain-weight-verified (own) | red: 60 percent of the exam over 3 domains; blue: 60 percent of the exam over 3 domains; grc: 60 percent of the exam over 3 domains |
| Commands verified `kpi.technical.commands-verified` | technical | metric.tool-commands-verified (own) | red: 7 verifiable steps that run a command; blue: 5 verifiable steps that run a command; grc: 10 verifiable steps that run a command |
| Procedures to standard `kpi.technical.procedures-to-standard` | technical | metric.procedure-to-standard (team) | red: 10 procedures; blue: 12 procedures; grc: 12 procedures |
| Faults resolved `kpi.problem-solving.faults-resolved` | problem-solving | metric.trouble-resolved (team) | red: 1 fault, incident or triage table; blue: 1 fault, incident or triage table; grc: 1 fault, incident or triage table |
| Verified after retry `kpi.problem-solving.persistence` | problem-solving | metric.ability-persistence (own) | red: 7 verifiable steps; blue: 5 verifiable steps; grc: 10 verifiable steps |
| Stuck flags cleared `kpi.problem-solving.flags-cleared` | problem-solving | metric.ability-flags-cleared (own) | the stuck flags the member raises; no content denominator |
| Time to resolution `kpi.problem-solving.time-to-resolution` | problem-solving | metric.time-to-verify (own) | red: 7 verifiable steps that can carry two stamps; blue: 5 verifiable steps that can carry two stamps; grc: 10 verifiable steps that can carry two stamps |
| Steps verified in order `kpi.execution.steps-in-order` | execution | metric.procedure-in-order (own) | red: 3 tasks with two or more verifiable steps; blue: 1 task with two or more verifiable steps; grc: 5 tasks with two or more verifiable steps |
| First-try verifications `kpi.execution.first-try` | execution | metric.ability-first-try (own) | red: 7 verifiable steps; blue: 5 verifiable steps; grc: 10 verifiable steps |
| Files named to convention `kpi.execution.evidence-named` | execution | metric.evidence-naming (own) | the files the member hashes; no content denominator |
| Definition-of-Done met `kpi.execution.dod-met` | execution | metric.doc-dod-met (team) | red: 12 checks on 4 forms; blue: 11 checks on 4 forms; grc: 15 checks on 6 forms |
| Decisions recorded `kpi.decision-making.decisions-recorded` | decision-making | metric.decision-recorded (team) | red: 1 decision block; blue: 0 decision blocks; grc: 0 decision blocks |
| Decisions justified `kpi.decision-making.decisions-justified` | decision-making | metric.decision-justified (team) | red: 1 decision block; blue: 0 decision blocks; grc: 0 decision blocks |
| Decisions approved `kpi.decision-making.decisions-approved` | decision-making | metric.decision-approved (team) | red: 1 decision block; blue: 0 decision blocks; grc: 0 decision blocks |
| Changes with rollback `kpi.decision-making.change-rollback` | decision-making | metric.procedure-change-recorded (team) | red: 1 change table with a rollback column; blue: 1 change table with a rollback column; grc: 1 change table with a rollback column |
| Hand-offs completed `kpi.teamwork.handoffs` | teamwork | metric.collab-handoffs (team) | red: 5 hand-offs; blue: 4 hand-offs; grc: 5 hand-offs |
| RACI respected `kpi.teamwork.raci-respected` | teamwork | metric.collab-raci-respected (team) | red: 7 forms with a RACI; blue: 9 forms with a RACI; grc: 10 forms with a RACI |
| Peer reviews given `kpi.teamwork.peer-reviews-given` | teamwork | metric.collab-peer-reviews-given (own) | the reviews assigned to the member; no content denominator |
| Teammate steps ticked `kpi.teamwork.teammate-steps` | teamwork | metric.collab-teammate-steps (own) | a count; no denominator |
| On time `kpi.professionalism.on-time` | professionalism | metric.ability-deadline-adherence (own) | red: 4 tasks of the role; blue: 4 tasks of the role; grc: 5 tasks of the role |
| Document control complete `kpi.professionalism.document-control` | professionalism | metric.doc-control-complete (team) | red: 4 forms; blue: 4 forms; grc: 6 forms |
| Controls cited `kpi.professionalism.controls-cited` | professionalism | metric.standard-controls-cited (team) | red: 3 control codes on 2 forms; blue: 3 control codes on 2 forms; grc: 7 control codes on 6 forms |
| Instructor approved `kpi.professionalism.instructor-approved` | professionalism | metric.doc-instructor-approved (team) | red: 4 forms; blue: 4 forms; grc: 6 forms |
| Skills proved twice `kpi.growth.skills-transferred` | growth | metric.skill-transfer (own) | red: 1 skill on two or more tasks; blue: 0 skills on two or more tasks; grc: 1 skill on two or more tasks |
| Skills retained `kpi.growth.retention` | growth | metric.ability-recall (own) | red: 7 skills with a verifiable step; blue: 6 skills with a verifiable step; grc: 8 skills with a verifiable step |
| Learning velocity `kpi.growth.learning-velocity` | growth | metric.time-learning-velocity (own) | the verification stamps of the last two months; no content denominator |
| Profile coverage `kpi.growth.profile-coverage` | growth | metric.profile-coverage (own) | red: Exploitation Analyst: 29 required, 24 not taught here; blue: Cyber Defense Analyst: 78 required, 74 not taught here; grc: Information Systems Security Manager: 45 required, 37 not taught here |
| Values recalled `kpi.validation.recall-accuracy` | validation | metric.validation-recall (own) |  |
| Scenarios applied `kpi.validation.applied-scenarios` | validation | metric.validation-applied (own) |  |
| Conflicts resolved `kpi.validation.conflicts-resolved` | validation | metric.conflicts-resolved (own) |  |
| Minutes on task `kpi.validation.time-on-task` | validation | metric.minutes-on-task (own) |  |

