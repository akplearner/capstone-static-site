# AWS Security Specialty — the Secure Workload — skills sheet

16 graded tasks and 6 advanced · 33 skills · 9 tools · 12 procedures · 7 standards (11 controls cited) · 0 tactics · 23 practices

Generated from the registries and the course document by `npm run content:export`; edit `src/lib/docs/skills.ts`, `tools.ts`, `standards.ts`, `sops.ts`, `tactics.ts` or the seed, not this file.

## Skills

| Skill | Area | Anchored to | Practised by |
| --- | --- | --- | --- |
| Implement host firewall and access controls `comp.harden.host-firewall` | Hardening and defence | SOC-2-ISO-27001.c3, NIST.800-53.SC-7 | Least-exposure security groups |
| Triage alerts with a verdict and a reason `comp.detect.triage-alerts` | Detection and monitoring | CS0-003.d1, NIST.800-61.DETECT | Read what detection found |
| Route an alert to a ticket `comp.detect.alert-to-ticket` | Detection and monitoring | CY0-001.d3, ITIL.incident | Wire the detection alarm |
| Contain an attacker with a timestamped block `comp.respond.contain` | Incident response | SY0-701.d4, CS0-003.d3, NIST.800-61.CONTAIN | Work the incident with the runbook |
| Write an incident-response runbook `comp.respond.ir-runbook` | Incident response | SY0-701.d4, NIST.800-61, ISO27001.A.5.24 | Work the incident with the runbook |
| Keep a chain of custody `comp.forensics.chain-of-custody` | Evidence and forensics | SY0-701.d4, ISO_27037 | Hand the baseline over |
| Map findings to NIST CSF and CIS `comp.grc.framework-mapping` | Governance and compliance | SY0-701.d5, NIST.CSF, CIS.CONTROLS | The account governance baseline |
| Classify assets with one owner each `comp.grc.classification` | Governance and compliance | CISSP.d2, ISO27001.A.5.12 | A customer-managed key |
| Prove prompt injection with evidence `comp.ai-attack.prompt-injection` | AI attack and evaluation | CY0-001.d2, OWASP.LLM | Prove a prompt injection |
| Prove sensitive information disclosure `comp.ai-attack.sensitive-disclosure` | AI attack and evaluation | CY0-001.d2, OWASP.LLM | Prove a data leak |
| Map AI threats to OWASP and ATLAS `comp.ai-attack.map-to-atlas` | AI attack and evaluation | CY0-001.d2, MITRE.ATLAS | Prove a prompt injection |
| Automate an attack suite with a pass line `comp.ai-attack.automate-suite` | AI attack and evaluation | CY0-001.d3, NIST_AI_RMF | Automate the attack suite; Report the validation |
| Reproduce a suite on a rebuilt copy `comp.ai-attack.reproduce` | AI attack and evaluation | CY0-001.d3, NIST_800_218 | Prove a data leak; Automate the attack suite |
| Write paper cases: poisoning, theft, inference `comp.ai-attack.paper-cases` | AI attack and evaluation | CY0-001.d3, MITRE.ATLAS | Report the validation |
| Run a local AI assistant offline `comp.ai.local-assistant` | Applied AI | NIST.AI-RMF.MANAGE | AI extension: explain the access matrix; AI extension: summarise the network exposure; AI extension: explain the data-protection choices; AI extension: summarise the incident and the lesson; Serve a model behind an API |
| Ground an AI answer in the records `comp.ai.ground-in-records` | Applied AI | NIST.AI-RMF.MAP | AI extension: summarise the network exposure; AI extension: explain the data-protection choices; AI extension: summarise the incident and the lesson |
| Verify AI output against the evidence `comp.ai.verify-ai-output` | Applied AI | NIST.AI-RMF.MEASURE | AI extension: explain the access matrix; AI extension: summarise the network exposure; AI extension: explain the data-protection choices; AI extension: summarise the incident and the lesson |
| Write a task-specific prompt `comp.ai.prompt-for-the-task` | Applied AI | NIST.AI-RMF.MAP | AI extension: explain the access matrix |
| Serve a model behind an API `comp.ai.serve-model` | Applied AI | NIST.AI-RMF.MEASURE | Serve a model behind an API; Size the memory |
| Size GPU memory for a model `comp.ai.gpu-sizing` | Applied AI | NIST.AI-RMF.MEASURE | Size the memory |
| Assemble and hand over an as-built package `comp.docs.as-built-handover` | Documentation and records | SK0-005.d2, 200-301.d1, ITIL.transition | Hand the baseline over |
| Create the network foundation: VNet or VPC `comp.cloud.network-foundation` | Cloud services | AZ-900.d2, CLF-C02.d3 | The segmented network |
| Grant team access through groups and roles `comp.cloud.identity-and-groups` | Cloud services | AZ-900.d2, CLF-C02.d2, NIST.800-53.AC-2 | Users, roles and MFA |
| Allow SSH from one address only `comp.cloud.ssh-from-one-ip` | Cloud services | AZ-900.d2, CLF-C02.d2, NIST.800-53.SC-7 | Least-exposure security groups |
| Alert on function errors to the team `comp.cloud.error-alert` | Cloud services | AZ-900.d3, CLF-C02.d3, NIST.CSF.DE.CM | Wire the detection alarm |
| Find a failure in logs and fix it `comp.cloud.read-logs` | Cloud services | AZ-900.d3, CLF-C02.d3 | Read what detection found |
| Trace a change in the audit trail `comp.cloud.audit-trail` | Cloud services | AZ-900.d3, CLF-C02.d2, NIST.800-61.DETECT | The account governance baseline |
| Write an access matrix and security layers `comp.cloud.access-matrix` | Cloud services | AZ-104.d1, SAA-C03.d1, NIST.800-53.AC-6 | Least privilege, proved on a denial |
| Keep secrets in a vault under managed keys `comp.cloud.secrets-in-vault` | Cloud services | AZ-104.d1, SAA-C03.d1, NIST.800-53.IA-5 | A customer-managed key |
| Scope a workload identity to one resource `comp.cloud.managed-identity` | Cloud services | AZ-104.d1, SAA-C03.d1, NIST.800-53.AC-6 | Users, roles and MFA |
| Prove an access is denied and find exposure `comp.cloud.prove-denial` | Cloud services | AZ-104.d1, SAA-C03.d1 | Least privilege, proved on a denial |
| Reach private resources without the internet `comp.cloud.private-access-path` | Cloud services | AZ-104.d4, SAA-C03.d1, NIST_800_207 | Reach the host without opening SSH |
| Lock data down: HTTPS, encryption, no public blobs `comp.cloud.data-lockdown` | Cloud services | AZ-104.d2, SAA-C03.d1, NIST.800-53.SC-8 | The locked, encrypted bucket |

## Tools

| Tool | Kind | Used by |
| --- | --- | --- |
| Linux shell | cli | Least-exposure security groups; Reach the host without opening SSH; The locked, encrypted bucket; Read what detection found; Work the incident with the runbook; Hand the baseline over; Prove a prompt injection; Prove a data leak; Automate the attack suite; Report the validation; Size the memory |
| curl | cli | Serve a model behind an API |
| Capstone forms | document | Users, roles and MFA; Least privilege, proved on a denial; The account governance baseline; The segmented network; Least-exposure security groups; Reach the host without opening SSH; A customer-managed key; The locked, encrypted bucket; Read what detection found; Work the incident with the runbook; Wire the detection alarm; Hand the baseline over; AI extension: explain the access matrix; AI extension: summarise the network exposure; AI extension: explain the data-protection choices; AI extension: summarise the incident and the lesson; Prove a prompt injection; Prove a data leak; Automate the attack suite; Report the validation; Serve a model behind an API; Size the memory |
| garak | cli | Prove a prompt injection |
| LLM Guard | service | Prove a data leak |
| Ollama | service | AI extension: explain the access matrix; AI extension: summarise the network exposure; AI extension: explain the data-protection choices; AI extension: summarise the incident and the lesson; Serve a model behind an API |
| Git | cli | Automate the attack suite |
| Python | language | Prove a prompt injection; Prove a data leak; Automate the attack suite; Report the validation; Serve a model behind an API; Size the memory |
| AWS CLI | cli | Users, roles and MFA; Least privilege, proved on a denial; The account governance baseline; The segmented network; Least-exposure security groups; Reach the host without opening SSH; A customer-managed key; The locked, encrypted bucket; Read what detection found; Work the incident with the runbook; Wire the detection alarm; Hand the baseline over |

## Procedures

Runbooks and standard operating procedures the forms are instances of, and the tasks that execute them.

| Procedure | Kind | Standards | Forms | Executed by |
| --- | --- | --- | --- | --- |
| Incident response plan | incident | NIST.800-61, ISO27001.A.5.24, NIST.CSF.RS.MA, SOC2.CC7.4 | Incident Response Log | Work the incident with the runbook |
| Chain of custody | custody | ISO27037, ISO27001.A.5.28, NIST.800-61 | Security Handover & Baseline | Hand the baseline over |
| Hardening baseline | baseline | CIS.BENCHMARK, NIST.800-53.CM-6, ISO27001.A.8.9, NIST.CSF.PR.PS | Network Security Record | Least-exposure security groups |
| Operational handover | handover | ITIL.transition, ISO27001.A.5.37, ITIL.knowledge | Security Handover & Baseline | Hand the baseline over |
| Data handling standard | policy | NIST.CSF.PR.DS, ISO27001.A.5.12, NIST.800-88 | Data Protection Record | A customer-managed key |
| Access review | access | ISO27001.A.5.18, NIST.800-53.AC-2, SOC2.CC6.3, NIST.CSF.PR.AA | Identity & Access Matrix | Least privilege, proved on a denial |
| Identity and access standard | access | NIST.800-63, NIST.800-53.IA-2, ISO27001.A.5.15, NIST.CSF.PR.AA | Identity & Access Matrix | Users, roles and MFA |
| Detection rules | monitoring | NIST.CSF.DE.AE, MITRE.ATTACK, SOC2.CC7.2 | Detection & Findings Log | Read what detection found |
| Asset inventory | inventory | NIST.CSF.ID.AM, CIS.1, ISO27001.A.5.9, ITIL.asset | Account & Access Register | — |
| Control mapping | governance | ISO27001.6.1.3, SOC2, NIST.CSF | Control Baseline | The account governance baseline |
| Network design | design | NIST.800-53.SC-7, ISO27001.A.8.22, NIST.CSF.PR.IR | Network Security Record | — |
| Portfolio record | handover | ISO42010, NIST.800-53.PL-2, ITIL.knowledge | Portfolio | — |

## Standards

| Standard | Tagged on tasks | Cited by forms |
| --- | --- | --- |
| NIST CSF | Users, roles and MFA; Least privilege, proved on a denial; The account governance baseline; The segmented network; Least-exposure security groups; Reach the host without opening SSH; A customer-managed key; The locked, encrypted bucket; Read what detection found; Work the incident with the runbook; Wire the detection alarm; Hand the baseline over | — |
| NIST 800-61 | — | Incident Response Log |
| Well-Architected | — | Account & Access Register; Control Baseline |
| NIST AI RMF | AI extension: explain the access matrix; AI extension: summarise the network exposure; AI extension: explain the data-protection choices; AI extension: summarise the incident and the lesson; Serve a model behind an API; Size the memory | — |
| OWASP LLM Top 10 | Prove a prompt injection; Prove a data leak; Automate the attack suite; Report the validation | — |
| NIST SP 800-53 | — | Account & Access Register; Identity & Access Matrix; Control Baseline; Network Security Record; Data Protection Record; Detection & Findings Log; Security Handover & Baseline; Portfolio |
| ISO/IEC/IEEE 42010 | — | Portfolio |

| Control cited | Standard | By |
| --- | --- | --- |
| NIST.800-53 Security and Privacy Controls Rev. 5 | NIST_800_53 | Control Baseline |
| NIST.800-53.AC-2 Account Management | NIST_800_53 | Account & Access Register |
| NIST.800-53.AC-6 Least Privilege | NIST_800_53 | Identity & Access Matrix |
| NIST.800-53.AU-6 Audit Record Review, Analysis, and Reporting | NIST_800_53 | Detection & Findings Log |
| NIST.800-53.PL-2 System Security and Privacy Plans | NIST_800_53 | Security Handover & Baseline; Portfolio |
| NIST.800-53.SC-7 Boundary Protection | NIST_800_53 | Network Security Record |
| NIST.800-53.SC-12 Cryptographic Key Establishment and Management | NIST_800_53 | Data Protection Record |
| NIST.800-53.SI-4 System Monitoring | NIST_800_53 | Detection & Findings Log |
| NIST.800-61 Computer Security Incident Handling Guide | NIST_800_61 | Incident Response Log |
| WAF Well-Architected Framework | WAF | Account & Access Register; Control Baseline |
| ISO42010 Architecture description | ISO_42010 | Portfolio |

## Tactics and practices

Adversary tactics are not part of this course.

| Practice | Anchor | Asked for by |
| --- | --- | --- |
| Least privilege | NIST.800-53.AC-6 | Serve a model behind an API |
| Defence in depth | NIST.CSF.PR | The segmented network |
| Default deny | NIST.800-53.SC-7 | Least privilege, proved on a denial; Least-exposure security groups |
| Periodic access review | NIST.800-53.AC-2 | Users, roles and MFA |
| Hash evidence at capture | ISO_27037 | Hand the baseline over; Prove a prompt injection |
| Authorised testing only | NIST_800_115 | Prove a prompt injection |
| Retest to closure | NIST_800_115 | Prove a data leak |
| Hardening baseline | CIS.BENCHMARK | Reach the host without opening SSH |
| Guardrail regression tests | NIST_800_218 | Automate the attack suite |
| Right-sizing | WAF.cost | Size the memory |
| Centralised logging | NIST.CSF.DE.CM | The account governance baseline |
| Alert to ticket | ITIL.incident | Read what detection found |
| Detection as code | MITRE_ATTACK | Wire the detection alarm |
| Contain before analysing | NIST.800-61.CONTAIN | Work the incident with the runbook |
| As-built documentation | ITIL.transition | Hand the baseline over |
| Data classification | ISO27001.A.5.12 | The locked, encrypted bucket |
| Control mapping | ISO27001.6.1.3 | The account governance baseline |
| Corrective action | ISO27001.10.2 | Report the validation |
| Customer assurance | SOC2 | Report the validation |
| Input and output guardrails | OWASP_LLM | Prove a data leak |
| Human checkpoint | NIST_AI_RMF | AI extension: explain the access matrix; AI extension: summarise the network exposure; AI extension: explain the data-protection choices; AI extension: summarise the incident and the lesson |
| Suites with a pass line | NIST_AI_RMF | Automate the attack suite |
| Encryption at rest | ISO27001.A.8.24 | A customer-managed key; The locked, encrypted bucket |

## KPI board

The sixteen numbers the Skill board keeps per member of this course, the catalogue row and kind of fact each one reads, and what it is counted over here, role by role.

| KPI | Family | Reads | Denominator in this course |
| --- | --- | --- | --- |
| Skills verified `kpi.technical.skills-verified` | technical | metric.skill-verified (own) | iam: 33 skills with a verifiable step; infra: 33 skills with a verifiable step; data: 33 skills with a verifiable step; records: 33 skills with a verifiable step |
| Exam weight verified `kpi.technical.exam-weight-verified` | technical | metric.domain-weight-verified (own) | iam: 100 percent of the exam over 6 domains; infra: 100 percent of the exam over 6 domains; data: 100 percent of the exam over 6 domains; records: 100 percent of the exam over 6 domains |
| Commands verified `kpi.technical.commands-verified` | technical | metric.tool-commands-verified (own) | iam: 32 verifiable steps that run a command; infra: 32 verifiable steps that run a command; data: 32 verifiable steps that run a command; records: 32 verifiable steps that run a command |
| Procedures to standard `kpi.technical.procedures-to-standard` | technical | metric.procedure-to-standard (team) | iam: 12 procedures; infra: 12 procedures; data: 12 procedures; records: 12 procedures |
| Faults resolved `kpi.problem-solving.faults-resolved` | problem-solving | metric.trouble-resolved (team) | iam: 1 fault, incident or triage table; infra: 1 fault, incident or triage table; data: 1 fault, incident or triage table; records: 1 fault, incident or triage table |
| Verified after retry `kpi.problem-solving.persistence` | problem-solving | metric.ability-persistence (own) | iam: 32 verifiable steps; infra: 32 verifiable steps; data: 32 verifiable steps; records: 32 verifiable steps |
| Stuck flags cleared `kpi.problem-solving.flags-cleared` | problem-solving | metric.ability-flags-cleared (own) | the stuck flags the member raises; no content denominator |
| Time to resolution `kpi.problem-solving.time-to-resolution` | problem-solving | metric.time-to-verify (own) | iam: 32 verifiable steps that can carry two stamps; infra: 32 verifiable steps that can carry two stamps; data: 32 verifiable steps that can carry two stamps; records: 32 verifiable steps that can carry two stamps |
| Steps verified in order `kpi.execution.steps-in-order` | execution | metric.procedure-in-order (own) | iam: 10 tasks with two or more verifiable steps; infra: 10 tasks with two or more verifiable steps; data: 10 tasks with two or more verifiable steps; records: 10 tasks with two or more verifiable steps |
| First-try verifications `kpi.execution.first-try` | execution | metric.ability-first-try (own) | iam: 32 verifiable steps; infra: 32 verifiable steps; data: 32 verifiable steps; records: 32 verifiable steps |
| Files named to convention `kpi.execution.evidence-named` | execution | metric.evidence-naming (own) | the files the member hashes; no content denominator |
| Definition-of-Done met `kpi.execution.dod-met` | execution | metric.doc-dod-met (team) | iam: 32 checks on 9 forms; infra: 32 checks on 9 forms; data: 32 checks on 9 forms; records: 32 checks on 9 forms |
| Decisions recorded `kpi.decision-making.decisions-recorded` | decision-making | metric.decision-recorded (team) | iam: 1 decision block; infra: 1 decision block; data: 1 decision block; records: 1 decision block |
| Decisions justified `kpi.decision-making.decisions-justified` | decision-making | metric.decision-justified (team) | iam: 1 decision block; infra: 1 decision block; data: 1 decision block; records: 1 decision block |
| Decisions approved `kpi.decision-making.decisions-approved` | decision-making | metric.decision-approved (team) | iam: 1 decision block; infra: 1 decision block; data: 1 decision block; records: 1 decision block |
| Changes with rollback `kpi.decision-making.change-rollback` | decision-making | metric.procedure-change-recorded (team) | iam: 1 change table with a rollback column; infra: 1 change table with a rollback column; data: 1 change table with a rollback column; records: 1 change table with a rollback column |
| Hand-offs completed `kpi.teamwork.handoffs` | teamwork | metric.collab-handoffs (team) | iam: 16 hand-offs; infra: 16 hand-offs; data: 16 hand-offs; records: 16 hand-offs |
| RACI respected `kpi.teamwork.raci-respected` | teamwork | metric.collab-raci-respected (team) | iam: 9 forms with a RACI; infra: 9 forms with a RACI; data: 9 forms with a RACI; records: 9 forms with a RACI |
| Peer reviews given `kpi.teamwork.peer-reviews-given` | teamwork | metric.collab-peer-reviews-given (own) | the reviews assigned to the member; no content denominator |
| Teammate steps ticked `kpi.teamwork.teammate-steps` | teamwork | metric.collab-teammate-steps (own) | a count; no denominator |
| On time `kpi.professionalism.on-time` | professionalism | metric.ability-deadline-adherence (own) | iam: 22 tasks of the role; infra: 22 tasks of the role; data: 22 tasks of the role; records: 22 tasks of the role |
| Document control complete `kpi.professionalism.document-control` | professionalism | metric.doc-control-complete (team) | iam: 9 forms; infra: 9 forms; data: 9 forms; records: 9 forms |
| Controls cited `kpi.professionalism.controls-cited` | professionalism | metric.standard-controls-cited (team) | iam: 1 control code on 1 form; infra: 1 control code on 1 form; data: 1 control code on 1 form; records: 8 control codes on 6 forms |
| Instructor approved `kpi.professionalism.instructor-approved` | professionalism | metric.doc-instructor-approved (team) | iam: 9 forms; infra: 9 forms; data: 9 forms; records: 9 forms |
| Skills proved twice `kpi.growth.skills-transferred` | growth | metric.skill-transfer (own) | iam: 6 skills on two or more tasks; infra: 6 skills on two or more tasks; data: 6 skills on two or more tasks; records: 6 skills on two or more tasks |
| Skills retained `kpi.growth.retention` | growth | metric.ability-recall (own) | iam: 33 skills with a verifiable step; infra: 33 skills with a verifiable step; data: 33 skills with a verifiable step; records: 33 skills with a verifiable step |
| Learning velocity `kpi.growth.learning-velocity` | growth | metric.time-learning-velocity (own) | the verification stamps of the last two months; no content denominator |
| Profile coverage `kpi.growth.profile-coverage` | growth | metric.profile-coverage (own) | iam: Cyber Policy and Strategy Planner: 47 required, 44 not taught here; infra: Network Operations Specialist: 62 required, 61 not taught here; data: Cyber Policy and Strategy Planner: 47 required, 44 not taught here; records: Cyber Defense Incident Responder: 26 required, 21 not taught here |
| Values recalled `kpi.validation.recall-accuracy` | validation | metric.validation-recall (own) |  |
| Scenarios applied `kpi.validation.applied-scenarios` | validation | metric.validation-applied (own) |  |
| Conflicts resolved `kpi.validation.conflicts-resolved` | validation | metric.conflicts-resolved (own) |  |
| Minutes on task `kpi.validation.time-on-task` | validation | metric.minutes-on-task (own) |  |

