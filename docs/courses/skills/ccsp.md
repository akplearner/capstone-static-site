# CCSP — the Cloud Assurance — skills sheet

16 graded tasks and 8 advanced · 37 skills · 9 tools · 13 procedures · 8 standards (10 controls cited) · 0 tactics · 27 practices

Generated from the registries and the course document by `npm run content:export`; edit `src/lib/docs/skills.ts`, `tools.ts`, `standards.ts`, `sops.ts`, `tactics.ts` or the seed, not this file.

## Skills

| Skill | Area | Anchored to | Practised by |
| --- | --- | --- | --- |
| Harden Linux with ufw, fail2ban and Lynis `comp.harden.linux-baseline` | Hardening and defence | SY0-701.d3, CIS.BENCHMARK | Secure the platform |
| Store secrets and limit through a gateway `comp.harden.secrets-and-gateway` | Hardening and defence | CY0-001.d2, NIST.800-53.IA-5 | Secure the application |
| Gate a pipeline on scans and tests `comp.harden.pipeline-gates` | Hardening and defence | CY0-001.d3, CISSP.d8, NIST_800_218 | Secure the application |
| Contain an attacker with a timestamped block `comp.respond.contain` | Incident response | SY0-701.d4, CS0-003.d3, NIST.800-61.CONTAIN | Work the incident |
| Write an incident-response runbook `comp.respond.ir-runbook` | Incident response | SY0-701.d4, NIST.800-61, ISO27001.A.5.24 | Work the incident |
| Keep a chain of custody `comp.forensics.chain-of-custody` | Evidence and forensics | SY0-701.d4, ISO_27037 | Hand the baseline over |
| Map findings to NIST CSF and CIS `comp.grc.framework-mapping` | Governance and compliance | SY0-701.d5, NIST.CSF, CIS.CONTROLS | The legal and compliance scope |
| Write a hardening standard as an SOP `comp.grc.hardening-standard` | Governance and compliance | SY0-701.d5, CIS.BENCHMARK | Secure the platform |
| Classify assets with one owner each `comp.grc.classification` | Governance and compliance | CISSP.d2, ISO27001.A.5.12 | Classify the data |
| Decide which rules apply, with a reason `comp.grc.applicability` | Governance and compliance | CY0-001.d4, ISO42001 | The legal and compliance scope |
| Map an AI system: models, prompts, writers `comp.grc.system-map` | Governance and compliance | CY0-001.d4, NIST.AI-RMF.MAP | The reference architecture |
| Threat-model with STRIDE `comp.risk.threat-model` | Risk | CISSP.d3, CY0-001.d2, STRIDE | The reference architecture |
| Draw architecture with trust boundaries `comp.arch.trust-boundaries` | Architecture and network design | CISSP.d3, ISO42010 | Put a gateway in front; Layer the platform |
| Design zones with default deny `comp.arch.default-deny-zones` | Architecture and network design | CISSP.d4, NIST.800-53.SC-7 | Layer the platform |
| Specify a rule base with approved protocols `comp.arch.rule-base` | Architecture and network design | CISSP.d4, NIST.800-53.SC-7 | Govern access and cost |
| Produce a component list (CycloneDX) `comp.arch.component-list` | Architecture and network design | CISSP.d8, NIST_800_218 | Hand the platform over |
| Find personal data and prove it is gone `comp.data.discovery` | Data security | CISSP.d2, NIST.CSF.ID.AM | Classify the data |
| Prove prompt injection with evidence `comp.ai-attack.prompt-injection` | AI attack and evaluation | CY0-001.d2, OWASP.LLM | Prove a prompt injection |
| Prove sensitive information disclosure `comp.ai-attack.sensitive-disclosure` | AI attack and evaluation | CY0-001.d2, OWASP.LLM | Prove a data leak |
| Map AI threats to OWASP and ATLAS `comp.ai-attack.map-to-atlas` | AI attack and evaluation | CY0-001.d2, MITRE.ATLAS | Prove a prompt injection |
| Automate an attack suite with a pass line `comp.ai-attack.automate-suite` | AI attack and evaluation | CY0-001.d3, NIST_AI_RMF | Automate the attack suite; Report the validation |
| Reproduce a suite on a rebuilt copy `comp.ai-attack.reproduce` | AI attack and evaluation | CY0-001.d3, NIST_800_218 | Prove a data leak; Automate the attack suite |
| Write paper cases: poisoning, theft, inference `comp.ai-attack.paper-cases` | AI attack and evaluation | CY0-001.d3, MITRE.ATLAS | Report the validation |
| Run a local AI assistant offline `comp.ai.local-assistant` | Applied AI | NIST.AI-RMF.MANAGE | AI extension: explain the responsibility line; AI extension: check the data classification; AI extension: summarise the platform baseline; AI extension: summarise the incident and the lesson |
| Ground an AI answer in the records `comp.ai.ground-in-records` | Applied AI | NIST.AI-RMF.MAP | AI extension: check the data classification; AI extension: summarise the platform baseline; AI extension: summarise the incident and the lesson |
| Verify AI output against the evidence `comp.ai.verify-ai-output` | Applied AI | NIST.AI-RMF.MEASURE | AI extension: explain the responsibility line; AI extension: check the data classification; AI extension: summarise the platform baseline; AI extension: summarise the incident and the lesson |
| Write a task-specific prompt `comp.ai.prompt-for-the-task` | Applied AI | NIST.AI-RMF.MAP | AI extension: explain the responsibility line |
| Expose a tool over a model context protocol `comp.ai.mcp-connector` | Applied AI | NIST.AI-RMF.MANAGE | Govern access and cost |
| Serve a model behind an API `comp.ai.serve-model` | Applied AI | NIST.AI-RMF.MEASURE | Put a gateway in front; Hand the platform over |
| Assemble and hand over an as-built package `comp.docs.as-built-handover` | Documentation and records | SK0-005.d2, 200-301.d1, ITIL.transition | Hand the baseline over |
| State the shared-responsibility split `comp.cloud.shared-responsibility` | Cloud services | AZ-900.d1, CLF-C02.d1 | The shared-responsibility line |
| Create the network foundation: VNet or VPC `comp.cloud.network-foundation` | Cloud services | AZ-900.d2, CLF-C02.d3 | Segment the network |
| Alert on function errors to the team `comp.cloud.error-alert` | Cloud services | AZ-900.d3, CLF-C02.d3, NIST.CSF.DE.CM | Run security operations |
| Find a failure in logs and fix it `comp.cloud.read-logs` | Cloud services | AZ-900.d3, CLF-C02.d3 | Run security operations |
| Keep secrets in a vault under managed keys `comp.cloud.secrets-in-vault` | Cloud services | AZ-104.d1, SAA-C03.d1, NIST.800-53.IA-5 | Own the key and the lifecycle |
| Reach private resources without the internet `comp.cloud.private-access-path` | Cloud services | AZ-104.d4, SAA-C03.d1, NIST_800_207 | Segment the network |
| Lock data down: HTTPS, encryption, no public blobs `comp.cloud.data-lockdown` | Cloud services | AZ-104.d2, SAA-C03.d1, NIST.800-53.SC-8 | Encrypt it and lock the store |

## Tools

| Tool | Kind | Used by |
| --- | --- | --- |
| Linux shell | cli | The shared-responsibility line; The reference architecture; The legal and compliance scope; Classify the data; Encrypt it and lock the store; Own the key and the lifecycle; Secure the platform; Segment the network; Secure the application; Run security operations; Work the incident; Hand the baseline over; Prove a prompt injection; Prove a data leak; Automate the attack suite; Report the validation; Put a gateway in front; Layer the platform; Govern access and cost; Hand the platform over |
| curl | cli | Put a gateway in front; Govern access and cost |
| Capstone forms | document | The shared-responsibility line; The reference architecture; The legal and compliance scope; Classify the data; Encrypt it and lock the store; Own the key and the lifecycle; Secure the platform; Segment the network; Secure the application; Run security operations; Work the incident; Hand the baseline over; AI extension: explain the responsibility line; AI extension: check the data classification; AI extension: summarise the platform baseline; AI extension: summarise the incident and the lesson; Prove a prompt injection; Prove a data leak; Automate the attack suite; Report the validation; Put a gateway in front; Layer the platform; Govern access and cost; Hand the platform over |
| garak | cli | Prove a prompt injection |
| LLM Guard | service | Prove a data leak |
| LiteLLM | service | Put a gateway in front; Govern access and cost |
| Ollama | service | AI extension: explain the responsibility line; AI extension: check the data classification; AI extension: summarise the platform baseline; AI extension: summarise the incident and the lesson |
| Git | cli | Automate the attack suite |
| Python | language | Prove a prompt injection; Prove a data leak; Automate the attack suite; Report the validation; Put a gateway in front; Layer the platform; Govern access and cost; Hand the platform over |

## Procedures

Runbooks and standard operating procedures the forms are instances of, and the tasks that execute them.

| Procedure | Kind | Standards | Forms | Executed by |
| --- | --- | --- | --- | --- |
| Incident response plan | incident | NIST.800-61, ISO27001.A.5.24, NIST.CSF.RS.MA, SOC2.CC7.4 | Operations & Incident Log | Work the incident |
| Chain of custody | custody | ISO27037, ISO27001.A.5.28, NIST.800-61 | Cloud Security Handover | Hand the baseline over |
| Hardening baseline | baseline | CIS.BENCHMARK, NIST.800-53.CM-6, ISO27001.A.8.9, NIST.CSF.PR.PS | Platform & Network Record | Secure the platform |
| Operational handover | handover | ITIL.transition, ISO27001.A.5.37, ITIL.knowledge | Cloud Security Handover | Hand the baseline over |
| Risk register | risk | NIST.800-30, ISO27005, ISO27001.6.1.2, NIST.CSF.GV.RM | Legal, Risk & Compliance | — |
| Data handling standard | policy | NIST.CSF.PR.DS, ISO27001.A.5.12, NIST.800-88 | Data Security Record | Classify the data |
| Monitoring plan | monitoring | NIST.CSF.DE.CM, ISO27001.A.8.16, SOC2.CC7.2, ITIL.monitoring | Operations & Incident Log | Run security operations |
| Asset inventory | inventory | NIST.CSF.ID.AM, CIS.1, ISO27001.A.5.9, ITIL.asset | Engagement & Scope Register | — |
| Control mapping | governance | ISO27001.6.1.3, SOC2, NIST.CSF | Legal, Risk & Compliance | The legal and compliance scope |
| Architecture record | design | ISO42010, WAF, NIST.800-53.PL-8 | Architecture & Responsibility | — |
| Network design | design | NIST.800-53.SC-7, ISO27001.A.8.22, NIST.CSF.PR.IR | Platform & Network Record | — |
| Pipeline record | build | NIST.800-218, WAF.operational-excellence, ITIL.deployment | Application Security Record | Secure the application |
| Portfolio record | handover | ISO42010, NIST.800-53.PL-2, ITIL.knowledge | Portfolio | — |

## Standards

| Standard | Tagged on tasks | Cited by forms |
| --- | --- | --- |
| CIS | — | Platform & Network Record |
| OWASP | — | Application Security Record |
| NIST 800-61 | — | Operations & Incident Log |
| ISO 27001 | The shared-responsibility line; The reference architecture; The legal and compliance scope; Classify the data; Encrypt it and lock the store; Own the key and the lifecycle; Secure the platform; Segment the network; Secure the application; Run security operations; Work the incident; Hand the baseline over | Engagement & Scope Register; Legal, Risk & Compliance; Data Security Record; Cloud Security Handover |
| NIST AI RMF | AI extension: explain the responsibility line; AI extension: check the data classification; AI extension: summarise the platform baseline; AI extension: summarise the incident and the lesson; Put a gateway in front; Layer the platform; Govern access and cost; Hand the platform over | — |
| OWASP LLM Top 10 | Prove a prompt injection; Prove a data leak; Automate the attack suite; Report the validation | — |
| NIST SP 800-53 | — | Cloud Security Handover; Portfolio |
| ISO/IEC/IEEE 42010 | — | Portfolio |

| Control cited | Standard | By |
| --- | --- | --- |
| NIST.800-53 Security and Privacy Controls Rev. 5 | NIST_800_53 | Cloud Security Handover |
| NIST.800-53.PL-2 System Security and Privacy Plans | NIST_800_53 | Portfolio |
| NIST.800-61 Computer Security Incident Handling Guide | NIST_800_61 | Operations & Incident Log |
| ISO27001 Information security management system | ISO_27001 | Engagement & Scope Register |
| ISO27001.6 Planning | ISO_27001 | Legal, Risk & Compliance |
| ISO27001.9 Performance evaluation | ISO_27001 | Cloud Security Handover |
| ISO27001.A.8.24 Use of cryptography | ISO_27001 | Data Security Record |
| CIS.BENCHMARK CIS Benchmarks | CIS | Platform & Network Record |
| OWASP OWASP Top 10 and Web Security Testing Guide | OWASP | Application Security Record |
| ISO42010 Architecture description | ISO_42010 | Portfolio |

## Tactics and practices

Adversary tactics are not part of this course.

| Practice | Anchor | Asked for by |
| --- | --- | --- |
| Least privilege | NIST.800-53.AC-6 | Put a gateway in front |
| Defence in depth | NIST.CSF.PR | The reference architecture |
| Default deny | NIST.800-53.SC-7 | Segment the network |
| Network segmentation | ISO27001.A.8.22 | Layer the platform |
| Multi-factor authentication | NIST_800_63 | Govern access and cost |
| Hash evidence at capture | ISO_27037 | Hand the baseline over; Prove a prompt injection |
| Authorised testing only | NIST_800_115 | Prove a prompt injection |
| Retest to closure | NIST_800_115 | Prove a data leak |
| Change control | ITIL.change | Run security operations |
| Hardening baseline | CIS.BENCHMARK | Secure the platform |
| Dependency and image scanning | NIST_800_218 | Secure the application |
| Guardrail regression tests | NIST_800_218 | Automate the attack suite |
| Budget guardrails | WAF.cost | Govern access and cost |
| Centralised logging | NIST.CSF.DE.CM | Run security operations |
| Contain before analysing | NIST.800-61.CONTAIN | Work the incident |
| Written runbooks | ISO27001.A.5.37 | Hand the platform over |
| As-built documentation | ITIL.transition | Hand the baseline over; Hand the platform over |
| Architecture decision records | ISO_42010 | Layer the platform |
| Data classification | ISO27001.A.5.12 | The legal and compliance scope; Classify the data |
| Control mapping | ISO27001.6.1.3 | The shared-responsibility line; The legal and compliance scope |
| Corrective action | ISO27001.10.2 | Report the validation |
| Customer assurance | SOC2 | Report the validation |
| Input and output guardrails | OWASP_LLM | Prove a data leak |
| Human checkpoint | NIST_AI_RMF | AI extension: explain the responsibility line; AI extension: check the data classification; AI extension: summarise the platform baseline; AI extension: summarise the incident and the lesson |
| Suites with a pass line | NIST_AI_RMF | Automate the attack suite |
| Encryption at rest | ISO27001.A.8.24 | Encrypt it and lock the store; Own the key and the lifecycle |
| Redundant paths | WAF.reliability | Put a gateway in front |

## KPI board

The sixteen numbers the Skill board keeps per member of this course, the catalogue row and kind of fact each one reads, and what it is counted over here, role by role.

| KPI | Family | Reads | Denominator in this course |
| --- | --- | --- | --- |
| Skills verified `kpi.technical.skills-verified` | technical | metric.skill-verified (own) | data: 37 skills with a verifiable step; platform: 37 skills with a verifiable step; appsec: 37 skills with a verifiable step; grc: 37 skills with a verifiable step |
| Exam weight verified `kpi.technical.exam-weight-verified` | technical | metric.domain-weight-verified (own) | data: 100 percent of the exam over 6 domains; platform: 100 percent of the exam over 6 domains; appsec: 100 percent of the exam over 6 domains; grc: 100 percent of the exam over 6 domains |
| Commands verified `kpi.technical.commands-verified` | technical | metric.tool-commands-verified (own) | data: 26 verifiable steps that run a command; platform: 26 verifiable steps that run a command; appsec: 26 verifiable steps that run a command; grc: 26 verifiable steps that run a command |
| Procedures to standard `kpi.technical.procedures-to-standard` | technical | metric.procedure-to-standard (team) | data: 13 procedures; platform: 13 procedures; appsec: 13 procedures; grc: 13 procedures |
| Faults resolved `kpi.problem-solving.faults-resolved` | problem-solving | metric.trouble-resolved (team) | data: 1 fault, incident or triage table; platform: 1 fault, incident or triage table; appsec: 1 fault, incident or triage table; grc: 1 fault, incident or triage table |
| Verified after retry `kpi.problem-solving.persistence` | problem-solving | metric.ability-persistence (own) | data: 26 verifiable steps; platform: 26 verifiable steps; appsec: 26 verifiable steps; grc: 26 verifiable steps |
| Stuck flags cleared `kpi.problem-solving.flags-cleared` | problem-solving | metric.ability-flags-cleared (own) | the stuck flags the member raises; no content denominator |
| Time to resolution `kpi.problem-solving.time-to-resolution` | problem-solving | metric.time-to-verify (own) | data: 26 verifiable steps that can carry two stamps; platform: 26 verifiable steps that can carry two stamps; appsec: 26 verifiable steps that can carry two stamps; grc: 26 verifiable steps that can carry two stamps |
| Steps verified in order `kpi.execution.steps-in-order` | execution | metric.procedure-in-order (own) | data: 2 tasks with two or more verifiable steps; platform: 2 tasks with two or more verifiable steps; appsec: 2 tasks with two or more verifiable steps; grc: 2 tasks with two or more verifiable steps |
| First-try verifications `kpi.execution.first-try` | execution | metric.ability-first-try (own) | data: 26 verifiable steps; platform: 26 verifiable steps; appsec: 26 verifiable steps; grc: 26 verifiable steps |
| Files named to convention `kpi.execution.evidence-named` | execution | metric.evidence-naming (own) | the files the member hashes; no content denominator |
| Definition-of-Done met `kpi.execution.dod-met` | execution | metric.doc-dod-met (team) | data: 33 checks on 9 forms; platform: 33 checks on 9 forms; appsec: 33 checks on 9 forms; grc: 33 checks on 9 forms |
| Decisions recorded `kpi.decision-making.decisions-recorded` | decision-making | metric.decision-recorded (team) | data: 1 decision block; platform: 1 decision block; appsec: 1 decision block; grc: 1 decision block |
| Decisions justified `kpi.decision-making.decisions-justified` | decision-making | metric.decision-justified (team) | data: 1 decision block; platform: 1 decision block; appsec: 1 decision block; grc: 1 decision block |
| Decisions approved `kpi.decision-making.decisions-approved` | decision-making | metric.decision-approved (team) | data: 1 decision block; platform: 1 decision block; appsec: 1 decision block; grc: 1 decision block |
| Changes with rollback `kpi.decision-making.change-rollback` | decision-making | metric.procedure-change-recorded (team) | data: 2 change tables with a rollback column; platform: 2 change tables with a rollback column; appsec: 2 change tables with a rollback column; grc: 2 change tables with a rollback column |
| Hand-offs completed `kpi.teamwork.handoffs` | teamwork | metric.collab-handoffs (team) | data: 16 hand-offs; platform: 16 hand-offs; appsec: 16 hand-offs; grc: 16 hand-offs |
| RACI respected `kpi.teamwork.raci-respected` | teamwork | metric.collab-raci-respected (team) | data: 9 forms with a RACI; platform: 9 forms with a RACI; appsec: 9 forms with a RACI; grc: 9 forms with a RACI |
| Peer reviews given `kpi.teamwork.peer-reviews-given` | teamwork | metric.collab-peer-reviews-given (own) | the reviews assigned to the member; no content denominator |
| Teammate steps ticked `kpi.teamwork.teammate-steps` | teamwork | metric.collab-teammate-steps (own) | a count; no denominator |
| On time `kpi.professionalism.on-time` | professionalism | metric.ability-deadline-adherence (own) | data: 24 tasks of the role; platform: 24 tasks of the role; appsec: 24 tasks of the role; grc: 24 tasks of the role |
| Document control complete `kpi.professionalism.document-control` | professionalism | metric.doc-control-complete (team) | data: 9 forms; platform: 9 forms; appsec: 9 forms; grc: 9 forms |
| Controls cited `kpi.professionalism.controls-cited` | professionalism | metric.standard-controls-cited (team) | data: 1 control code on 1 form; platform: 1 control code on 2 forms; appsec: 1 control code on 1 form; grc: 7 control codes on 5 forms |
| Instructor approved `kpi.professionalism.instructor-approved` | professionalism | metric.doc-instructor-approved (team) | data: 9 forms; platform: 9 forms; appsec: 9 forms; grc: 9 forms |
| Skills proved twice `kpi.growth.skills-transferred` | growth | metric.skill-transfer (own) | data: 7 skills on two or more tasks; platform: 7 skills on two or more tasks; appsec: 7 skills on two or more tasks; grc: 7 skills on two or more tasks |
| Skills retained `kpi.growth.retention` | growth | metric.ability-recall (own) | data: 37 skills with a verifiable step; platform: 37 skills with a verifiable step; appsec: 37 skills with a verifiable step; grc: 37 skills with a verifiable step |
| Learning velocity `kpi.growth.learning-velocity` | growth | metric.time-learning-velocity (own) | the verification stamps of the last two months; no content denominator |
| Profile coverage `kpi.growth.profile-coverage` | growth | metric.profile-coverage (own) | data: Cyber Policy and Strategy Planner: 47 required, 40 not taught here; platform: Cyber Policy and Strategy Planner: 47 required, 40 not taught here; appsec: Cyber Policy and Strategy Planner: 47 required, 40 not taught here; grc: Cyber Policy and Strategy Planner: 47 required, 40 not taught here |
| Values recalled `kpi.validation.recall-accuracy` | validation | metric.validation-recall (own) |  |
| Scenarios applied `kpi.validation.applied-scenarios` | validation | metric.validation-applied (own) |  |
| Conflicts resolved `kpi.validation.conflicts-resolved` | validation | metric.conflicts-resolved (own) |  |
| Minutes on task `kpi.validation.time-on-task` | validation | metric.minutes-on-task (own) |  |

