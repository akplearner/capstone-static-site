# Docker Certified Associate — the Container Yard — skills sheet

16 graded tasks and 6 advanced · 23 skills · 7 tools · 8 procedures · 4 standards (10 controls cited) · 0 tactics · 12 practices

Generated from the registries and the course document by `npm run content:export`; edit `src/lib/docs/skills.ts`, `tools.ts`, `standards.ts`, `sops.ts`, `tactics.ts` or the seed, not this file.

## Skills

| Skill | Area | Anchored to | Practised by |
| --- | --- | --- | --- |
| Harden Linux with ufw, fail2ban and Lynis `comp.harden.linux-baseline` | Hardening and defence | SY0-701.d3, CIS.BENCHMARK | Configure the daemon and logging |
| Implement host firewall and access controls `comp.harden.host-firewall` | Hardening and defence | SOC-2-ISO-27001.c3, NIST.800-53.SC-7 | Run it least-privileged, secrets out |
| Rebuild a system clean and prove it `comp.harden.clean-rebuild` | Hardening and defence | CY0-001.d2, WAF.reliability | Scan the image and read the findings |
| Keep a chain of custody `comp.forensics.chain-of-custody` | Evidence and forensics | SY0-701.d4, ISO_27037 | Hand the stack over |
| Write a hardening standard as an SOP `comp.grc.hardening-standard` | Governance and compliance | SY0-701.d5, CIS.BENCHMARK | Scan the image and read the findings |
| Run a local AI assistant offline `comp.ai.local-assistant` | Applied AI | NIST.AI-RMF.MANAGE | AI extension: draft the image build notes; AI extension: summarise the stack layout; AI extension: explain the network and volumes; AI extension: summarise the hardening findings; Serve a model behind an API |
| Ground an AI answer in the records `comp.ai.ground-in-records` | Applied AI | NIST.AI-RMF.MAP | AI extension: summarise the stack layout; AI extension: explain the network and volumes; AI extension: summarise the hardening findings |
| Verify AI output against the evidence `comp.ai.verify-ai-output` | Applied AI | NIST.AI-RMF.MEASURE | AI extension: draft the image build notes; AI extension: summarise the stack layout; AI extension: explain the network and volumes; AI extension: summarise the hardening findings; Answer from the passages; Build a question set; Set the pass line |
| Write a task-specific prompt `comp.ai.prompt-for-the-task` | Applied AI | NIST.AI-RMF.MAP | AI extension: draft the image build notes; Set the pass line |
| Build a retrieval-augmented pipeline `comp.ai.rag-pipeline` | Applied AI | NIST.AI-RMF.MAP | Index a document set; Answer from the passages; Build a question set |
| Load documents into a vector store `comp.ai.vector-store` | Applied AI | NIST.AI-RMF.MAP | Index a document set |
| Serve a model behind an API `comp.ai.serve-model` | Applied AI | NIST.AI-RMF.MEASURE | Serve a model behind an API; Size the memory |
| Size GPU memory for a model `comp.ai.gpu-sizing` | Applied AI | NIST.AI-RMF.MEASURE | Size the memory |
| Run a service with Docker Compose `comp.automation.docker-compose` | Automation and infrastructure as code | SK0-005.d2 | Compose the multi-container stack |
| Keep the infrastructure in Git `comp.automation.infra-in-git` | Automation and infrastructure as code | SK0-005.d2, ITIL.configuration | Push it to a registry |
| Keep secrets out of version history `comp.automation.secrets-out-of-history` | Automation and infrastructure as code | SK0-005.d3, NIST_800_218 | Run it least-privileged, secrets out |
| Build hosts from a golden template `comp.automation.golden-images` | Automation and infrastructure as code | SK0-005.d2 | Build and tag the app image; Push it to a registry |
| Assemble and hand over an as-built package `comp.docs.as-built-handover` | Documentation and records | SK0-005.d2, 200-301.d1, ITIL.transition | Hand the stack over |
| Create the network foundation: VNet or VPC `comp.cloud.network-foundation` | Cloud services | AZ-900.d2, CLF-C02.d3 | Wire the network and resolve by name; Work a connectivity fault, one change per row |
| Choose a data store and storage tiers `comp.cloud.data-store-choice` | Cloud services | AZ-104.d2, SAA-C03.d4, WAF.cost | Persist the data in a volume |
| Autoscale on CPU and prove self-healing `comp.cloud.autoscale-and-self-heal` | Cloud services | AZ-104.d3, SAA-C03.d2, WAF.reliability | Deploy it to a Swarm; Scale it, and roll a bad update back |
| Cut over blue-green with no failed request `comp.cloud.blue-green` | Cloud services | AZ-400.d3, DOP-C02.d3, WAF.operational-excellence | Scale it, and roll a bad update back |
| Recover an app failure through CI `comp.cloud.fix-through-ci` | Cloud services | AZ-400.d3, DOP-C02.d5 | Work a connectivity fault, one change per row |

## Tools

| Tool | Kind | Used by |
| --- | --- | --- |
| Linux shell | cli | Push it to a registry; Persist the data in a volume; Scan the image and read the findings; Run it least-privileged, secrets out; Hand the stack over; Size the memory; Answer from the passages; Build a question set; Set the pass line |
| curl | cli | Work a connectivity fault, one change per row; Serve a model behind an API |
| Capstone forms | document | Hand the stack over; AI extension: draft the image build notes; AI extension: summarise the stack layout; AI extension: explain the network and volumes; AI extension: summarise the hardening findings; Serve a model behind an API; Size the memory; Index a document set; Answer from the passages; Build a question set; Set the pass line |
| Ollama | service | AI extension: draft the image build notes; AI extension: summarise the stack layout; AI extension: explain the network and volumes; AI extension: summarise the hardening findings; Serve a model behind an API; Answer from the passages |
| Chroma | service | Index a document set |
| Docker | cli | Build and tag the app image; Push it to a registry; Configure the daemon and logging; Compose the multi-container stack; Deploy it to a Swarm; Scale it, and roll a bad update back; Wire the network and resolve by name; Persist the data in a volume; Work a connectivity fault, one change per row; Scan the image and read the findings; Run it least-privileged, secrets out; Hand the stack over |
| Python | language | Serve a model behind an API; Size the memory; Index a document set; Answer from the passages; Build a question set; Set the pass line |

## Procedures

Runbooks and standard operating procedures the forms are instances of, and the tasks that execute them.

| Procedure | Kind | Standards | Forms | Executed by |
| --- | --- | --- | --- | --- |
| Chain of custody | custody | ISO27037, ISO27001.A.5.28, NIST.800-61 | Handover & As-Built | Hand the stack over |
| Operational handover | handover | ITIL.transition, ISO27001.A.5.37, ITIL.knowledge | Handover & As-Built | Hand the stack over |
| Risk register | risk | NIST.800-30, ISO27005, ISO27001.6.1.2, NIST.CSF.GV.RM | Image Security & Hardening Record | Scan the image and read the findings |
| Asset inventory | inventory | NIST.CSF.ID.AM, CIS.1, ISO27001.A.5.9, ITIL.asset | Install & Environment Register | — |
| Governance report | governance | NIST.CSF.GV, ISO27001.9.3 | Image Security & Hardening Record | Run it least-privileged, secrets out |
| Build record | build | ITIL.configuration, NIST.800-53.CM-2, ISO27001.A.8.9 | Image Build & Registry Record; Stack & Orchestration Record; Networking & Storage Record | Build and tag the app image; Compose the multi-container stack |
| Test and acceptance record | build | ITIL.transition, NIST.800-53.CA-2, ISO27001.A.8.29 | Container Troubleshooting Log | Work a connectivity fault, one change per row |
| Portfolio record | handover | ISO42010, NIST.800-53.PL-2, ITIL.knowledge | Portfolio | — |

## Standards

| Standard | Tagged on tasks | Cited by forms |
| --- | --- | --- |
| CIS | Build and tag the app image; Push it to a registry; Configure the daemon and logging; Compose the multi-container stack; Deploy it to a Swarm; Scale it, and roll a bad update back; Wire the network and resolve by name; Persist the data in a volume; Work a connectivity fault, one change per row; Scan the image and read the findings; Run it least-privileged, secrets out; Hand the stack over | Install & Environment Register; Image Build & Registry Record; Networking & Storage Record; Image Security & Hardening Record |
| NIST AI RMF | AI extension: draft the image build notes; AI extension: summarise the stack layout; AI extension: explain the network and volumes; AI extension: summarise the hardening findings; Serve a model behind an API; Size the memory; Index a document set; Answer from the passages; Build a question set; Set the pass line | — |
| NIST SP 800-53 | — | Install & Environment Register; Image Build & Registry Record; Stack & Orchestration Record; Networking & Storage Record; Container Troubleshooting Log; Image Security & Hardening Record; Handover & As-Built; Portfolio |
| ISO/IEC/IEEE 42010 | — | Portfolio |

| Control cited | Standard | By |
| --- | --- | --- |
| NIST.800-53 Security and Privacy Controls Rev. 5 | NIST_800_53 | Stack & Orchestration Record |
| NIST.800-53.AC-6 Least Privilege | NIST_800_53 | Image Security & Hardening Record |
| NIST.800-53.CM-2 Baseline Configuration | NIST_800_53 | Image Build & Registry Record |
| NIST.800-53.CM-6 Configuration Settings | NIST_800_53 | Install & Environment Register |
| NIST.800-53.CM-8 System Component Inventory | NIST_800_53 | Handover & As-Built |
| NIST.800-53.IR-4 Incident Handling | NIST_800_53 | Container Troubleshooting Log |
| NIST.800-53.PL-2 System Security and Privacy Plans | NIST_800_53 | Handover & As-Built; Portfolio |
| NIST.800-53.SC-7 Boundary Protection | NIST_800_53 | Networking & Storage Record |
| CIS Center for Internet Security | CIS | Install & Environment Register; Image Build & Registry Record; Networking & Storage Record; Image Security & Hardening Record |
| ISO42010 Architecture description | ISO_42010 | Portfolio |

## Tactics and practices

Adversary tactics are not part of this course.

| Practice | Anchor | Asked for by |
| --- | --- | --- |
| Least privilege | NIST.800-53.AC-6 | Serve a model behind an API |
| Retest to closure | NIST_800_115 | Scale it, and roll a bad update back; Work a connectivity fault, one change per row |
| Likelihood-times-impact scoring | NIST_800_30 | Scan the image and read the findings; Run it least-privileged, secrets out |
| Configuration record | ITIL.configuration | Build and tag the app image; Configure the daemon and logging; Wire the network and resolve by name |
| Build record | ITIL.configuration | Build and tag the app image; Push it to a registry; Compose the multi-container stack; Deploy it to a Swarm; Hand the stack over |
| Right-sizing | WAF.cost | Size the memory |
| Architecture decision records | ISO_42010 | Scale it, and roll a bad update back; Run it least-privileged, secrets out |
| Test and acceptance | ITIL.transition | Compose the multi-container stack |
| Evidence by design | SOC2 | Push it to a registry; Persist the data in a volume; Hand the stack over |
| Redact before write | NIST_AI_RMF | Index a document set |
| Human checkpoint | NIST_AI_RMF | Work a connectivity fault, one change per row; AI extension: draft the image build notes; AI extension: summarise the stack layout; AI extension: explain the network and volumes; AI extension: summarise the hardening findings; Answer from the passages |
| Suites with a pass line | NIST_AI_RMF | Build a question set; Set the pass line |

## KPI board

The sixteen numbers the Skill board keeps per member of this course, the catalogue row and kind of fact each one reads, and what it is counted over here, role by role.

| KPI | Family | Reads | Denominator in this course |
| --- | --- | --- | --- |
| Skills verified `kpi.technical.skills-verified` | technical | metric.skill-verified (own) | images: 23 skills with a verifiable step; stack: 23 skills with a verifiable step; net: 23 skills with a verifiable step; records: 23 skills with a verifiable step |
| Exam weight verified `kpi.technical.exam-weight-verified` | technical | metric.domain-weight-verified (own) | images: 100 percent of the exam over 6 domains; stack: 100 percent of the exam over 6 domains; net: 100 percent of the exam over 6 domains; records: 100 percent of the exam over 6 domains |
| Commands verified `kpi.technical.commands-verified` | technical | metric.tool-commands-verified (own) | images: 28 verifiable steps that run a command; stack: 28 verifiable steps that run a command; net: 28 verifiable steps that run a command; records: 28 verifiable steps that run a command |
| Procedures to standard `kpi.technical.procedures-to-standard` | technical | metric.procedure-to-standard (team) | images: 8 procedures; stack: 8 procedures; net: 8 procedures; records: 8 procedures |
| Faults resolved `kpi.problem-solving.faults-resolved` | problem-solving | metric.trouble-resolved (team) | images: 1 fault, incident or triage table; stack: 1 fault, incident or triage table; net: 1 fault, incident or triage table; records: 1 fault, incident or triage table |
| Verified after retry `kpi.problem-solving.persistence` | problem-solving | metric.ability-persistence (own) | images: 28 verifiable steps; stack: 28 verifiable steps; net: 28 verifiable steps; records: 28 verifiable steps |
| Stuck flags cleared `kpi.problem-solving.flags-cleared` | problem-solving | metric.ability-flags-cleared (own) | the stuck flags the member raises; no content denominator |
| Time to resolution `kpi.problem-solving.time-to-resolution` | problem-solving | metric.time-to-verify (own) | images: 28 verifiable steps that can carry two stamps; stack: 28 verifiable steps that can carry two stamps; net: 28 verifiable steps that can carry two stamps; records: 28 verifiable steps that can carry two stamps |
| Steps verified in order `kpi.execution.steps-in-order` | execution | metric.procedure-in-order (own) | images: 6 tasks with two or more verifiable steps; stack: 6 tasks with two or more verifiable steps; net: 6 tasks with two or more verifiable steps; records: 6 tasks with two or more verifiable steps |
| First-try verifications `kpi.execution.first-try` | execution | metric.ability-first-try (own) | images: 28 verifiable steps; stack: 28 verifiable steps; net: 28 verifiable steps; records: 28 verifiable steps |
| Files named to convention `kpi.execution.evidence-named` | execution | metric.evidence-naming (own) | the files the member hashes; no content denominator |
| Definition-of-Done met `kpi.execution.dod-met` | execution | metric.doc-dod-met (team) | images: 29 checks on 8 forms; stack: 29 checks on 8 forms; net: 29 checks on 8 forms; records: 29 checks on 8 forms |
| Decisions recorded `kpi.decision-making.decisions-recorded` | decision-making | metric.decision-recorded (team) | images: 1 decision block; stack: 1 decision block; net: 1 decision block; records: 1 decision block |
| Decisions justified `kpi.decision-making.decisions-justified` | decision-making | metric.decision-justified (team) | images: 1 decision block; stack: 1 decision block; net: 1 decision block; records: 1 decision block |
| Decisions approved `kpi.decision-making.decisions-approved` | decision-making | metric.decision-approved (team) | images: 1 decision block; stack: 1 decision block; net: 1 decision block; records: 1 decision block |
| Changes with rollback `kpi.decision-making.change-rollback` | decision-making | metric.procedure-change-recorded (team) | images: 1 change table with a rollback column; stack: 1 change table with a rollback column; net: 1 change table with a rollback column; records: 1 change table with a rollback column |
| Hand-offs completed `kpi.teamwork.handoffs` | teamwork | metric.collab-handoffs (team) | images: 16 hand-offs; stack: 16 hand-offs; net: 16 hand-offs; records: 16 hand-offs |
| RACI respected `kpi.teamwork.raci-respected` | teamwork | metric.collab-raci-respected (team) | images: 8 forms with a RACI; stack: 8 forms with a RACI; net: 8 forms with a RACI; records: 8 forms with a RACI |
| Peer reviews given `kpi.teamwork.peer-reviews-given` | teamwork | metric.collab-peer-reviews-given (own) | the reviews assigned to the member; no content denominator |
| Teammate steps ticked `kpi.teamwork.teammate-steps` | teamwork | metric.collab-teammate-steps (own) | a count; no denominator |
| On time `kpi.professionalism.on-time` | professionalism | metric.ability-deadline-adherence (own) | images: 22 tasks of the role; stack: 22 tasks of the role; net: 22 tasks of the role; records: 22 tasks of the role |
| Document control complete `kpi.professionalism.document-control` | professionalism | metric.doc-control-complete (team) | images: 8 forms; stack: 8 forms; net: 8 forms; records: 8 forms |
| Controls cited `kpi.professionalism.controls-cited` | professionalism | metric.standard-controls-cited (team) | images: 3 control codes on 2 forms; stack: 1 control code on 1 form; net: 2 control codes on 1 form; records: 6 control codes on 4 forms |
| Instructor approved `kpi.professionalism.instructor-approved` | professionalism | metric.doc-instructor-approved (team) | images: 8 forms; stack: 8 forms; net: 8 forms; records: 8 forms |
| Skills proved twice `kpi.growth.skills-transferred` | growth | metric.skill-transfer (own) | images: 9 skills on two or more tasks; stack: 9 skills on two or more tasks; net: 9 skills on two or more tasks; records: 9 skills on two or more tasks |
| Skills retained `kpi.growth.retention` | growth | metric.ability-recall (own) | images: 23 skills with a verifiable step; stack: 23 skills with a verifiable step; net: 23 skills with a verifiable step; records: 23 skills with a verifiable step |
| Learning velocity `kpi.growth.learning-velocity` | growth | metric.time-learning-velocity (own) | the verification stamps of the last two months; no content denominator |
| Profile coverage `kpi.growth.profile-coverage` | growth | metric.profile-coverage (own) | images: System Administrator: 117 required, 111 not taught here; stack: System Administrator: 117 required, 111 not taught here; net: Network Operations Specialist: 62 required, 61 not taught here; records: Cyber Policy and Strategy Planner: 47 required, 45 not taught here |
| Values recalled `kpi.validation.recall-accuracy` | validation | metric.validation-recall (own) |  |
| Scenarios applied `kpi.validation.applied-scenarios` | validation | metric.validation-applied (own) |  |
| Conflicts resolved `kpi.validation.conflicts-resolved` | validation | metric.conflicts-resolved (own) |  |
| Minutes on task `kpi.validation.time-on-task` | validation | metric.minutes-on-task (own) |  |

