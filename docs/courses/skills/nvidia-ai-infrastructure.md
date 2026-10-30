# NVIDIA AI Infrastructure & Operations — the GPU Yard — skills sheet

16 graded tasks and 6 advanced · 17 skills · 7 tools · 6 procedures · 3 standards (10 controls cited) · 0 tactics · 11 practices

Generated from the registries and the course document by `npm run content:export`; edit `src/lib/docs/skills.ts`, `tools.ts`, `standards.ts`, `sops.ts`, `tactics.ts` or the seed, not this file.

## Skills

| Skill | Area | Anchored to | Practised by |
| --- | --- | --- | --- |
| Keep a chain of custody `comp.forensics.chain-of-custody` | Evidence and forensics | SY0-701.d4, ISO_27037 | Hand the plan over |
| Run a local AI assistant offline `comp.ai.local-assistant` | Applied AI | NIST.AI-RMF.MANAGE | See training against inference; AI extension: summarise the AI essentials and the stack; AI extension: explain the GPU sizing from the numbers; AI extension: draft the data-centre capacity notes; AI extension: summarise the monitoring and the fault; Serve a model behind an API |
| Ground an AI answer in the records `comp.ai.ground-in-records` | Applied AI | NIST.AI-RMF.MAP | AI extension: explain the GPU sizing from the numbers; AI extension: draft the data-centre capacity notes; AI extension: summarise the monitoring and the fault |
| Verify AI output against the evidence `comp.ai.verify-ai-output` | Applied AI | NIST.AI-RMF.MEASURE | AI extension: summarise the AI essentials and the stack; AI extension: explain the GPU sizing from the numbers; AI extension: draft the data-centre capacity notes; AI extension: summarise the monitoring and the fault; Answer from the passages; Build a question set; Set the pass line |
| Write a task-specific prompt `comp.ai.prompt-for-the-task` | Applied AI | NIST.AI-RMF.MAP | AI extension: summarise the AI essentials and the stack; Set the pass line |
| Build a retrieval-augmented pipeline `comp.ai.rag-pipeline` | Applied AI | NIST.AI-RMF.MAP | Index a document set; Answer from the passages; Build a question set |
| Load documents into a vector store `comp.ai.vector-store` | Applied AI | NIST.AI-RMF.MAP | Index a document set |
| Serve a model behind an API `comp.ai.serve-model` | Applied AI | NIST.AI-RMF.MEASURE | Map the NVIDIA software stack; Serve a model behind an API; Size the memory |
| Size GPU memory for a model `comp.ai.gpu-sizing` | Applied AI | NIST.AI-RMF.MEASURE | Read the GPU architecture; Size a GPU to a model; Size the memory |
| Read the parts of a language model `comp.ai.model-components` | Applied AI | AI-901.d1 | See training against inference |
| Assemble and hand over an as-built package `comp.docs.as-built-handover` | Documentation and records | SK0-005.d2, 200-301.d1, ITIL.transition | Hand the plan over |
| Create the network foundation: VNet or VPC `comp.cloud.network-foundation` | Cloud services | AZ-900.d2, CLF-C02.d3 | Follow the data-processing path; Size the network fabric |
| Estimate monthly cost and choose storage classes `comp.cloud.cost-estimate` | Cloud services | AZ-900.d3, CLF-C02.d4, WAF.cost | Size a GPU to a model; Power and cool the rack |
| Alert on function errors to the team `comp.cloud.error-alert` | Cloud services | AZ-900.d3, CLF-C02.d3, NIST.CSF.DE.CM | Monitor the GPU telemetry |
| Find a failure in logs and fix it `comp.cloud.read-logs` | Cloud services | AZ-900.d3, CLF-C02.d3 | Read a GPU from nvidia-smi; Monitor the GPU telemetry |
| Build a scale set across two zones `comp.cloud.scale-set` | Cloud services | AZ-104.d3, SAA-C03.d2, WAF.reliability | Scale the training job |
| Recover an app failure through CI `comp.cloud.fix-through-ci` | Cloud services | AZ-400.d3, DOP-C02.d5 | Work a scheduling fault, one change per row |

## Tools

| Tool | Kind | Used by |
| --- | --- | --- |
| Linux shell | cli | See training against inference; Read the GPU architecture; Map the NVIDIA software stack; Read a GPU from nvidia-smi; Size a GPU to a model; Follow the data-processing path; Size the network fabric; Power and cool the rack; Scale the training job; Monitor the GPU telemetry; Work a scheduling fault, one change per row; Hand the plan over; Size the memory; Answer from the passages; Build a question set; Set the pass line |
| curl | cli | Serve a model behind an API |
| Capstone forms | document | Hand the plan over; AI extension: summarise the AI essentials and the stack; AI extension: explain the GPU sizing from the numbers; AI extension: draft the data-centre capacity notes; AI extension: summarise the monitoring and the fault; Serve a model behind an API; Size the memory; Index a document set; Answer from the passages; Build a question set; Set the pass line |
| Ollama | service | See training against inference; AI extension: summarise the AI essentials and the stack; AI extension: explain the GPU sizing from the numbers; AI extension: draft the data-centre capacity notes; AI extension: summarise the monitoring and the fault; Serve a model behind an API; Answer from the passages |
| Chroma | service | Index a document set |
| nvidia-smi / DCGM | cli | Map the NVIDIA software stack; Read a GPU from nvidia-smi; Monitor the GPU telemetry |
| Python | language | Read the GPU architecture; Size a GPU to a model; Follow the data-processing path; Size the network fabric; Power and cool the rack; Scale the training job; Serve a model behind an API; Size the memory; Index a document set; Answer from the passages; Build a question set; Set the pass line |

## Procedures

Runbooks and standard operating procedures the forms are instances of, and the tasks that execute them.

| Procedure | Kind | Standards | Forms | Executed by |
| --- | --- | --- | --- | --- |
| Chain of custody | custody | ISO27037, ISO27001.A.5.28, NIST.800-61 | Handover & As-Built | Hand the plan over |
| Operational handover | handover | ITIL.transition, ISO27001.A.5.37, ITIL.knowledge | Handover & As-Built | Hand the plan over |
| Asset inventory | inventory | NIST.CSF.ID.AM, CIS.1, ISO27001.A.5.9, ITIL.asset | Lab Setup & Reference Register | — |
| Build record | build | ITIL.configuration, NIST.800-53.CM-2, ISO27001.A.8.9 | AI Knowledge & Stack Record; GPU Hardware & Sizing Record; Data Centre Capacity Record | Read the GPU architecture; Size a GPU to a model |
| Test and acceptance record | build | ITIL.transition, NIST.800-53.CA-2, ISO27001.A.8.29 | GPU Operations & Monitoring Log; GPU Scheduling Troubleshooting Log | Work a scheduling fault, one change per row |
| Portfolio record | handover | ISO42010, NIST.800-53.PL-2, ITIL.knowledge | Portfolio | — |

## Standards

| Standard | Tagged on tasks | Cited by forms |
| --- | --- | --- |
| NIST AI RMF | See training against inference; Read the GPU architecture; Map the NVIDIA software stack; Read a GPU from nvidia-smi; Size a GPU to a model; Follow the data-processing path; Size the network fabric; Power and cool the rack; Scale the training job; Monitor the GPU telemetry; Work a scheduling fault, one change per row; Hand the plan over; AI extension: summarise the AI essentials and the stack; AI extension: explain the GPU sizing from the numbers; AI extension: draft the data-centre capacity notes; AI extension: summarise the monitoring and the fault; Serve a model behind an API; Size the memory; Index a document set; Answer from the passages; Build a question set; Set the pass line | Lab Setup & Reference Register; AI Knowledge & Stack Record; GPU Hardware & Sizing Record |
| NIST SP 800-53 | — | Lab Setup & Reference Register; GPU Hardware & Sizing Record; Data Centre Capacity Record; GPU Operations & Monitoring Log; GPU Scheduling Troubleshooting Log; Handover & As-Built; Portfolio |
| ISO/IEC/IEEE 42010 | — | Portfolio |

| Control cited | Standard | By |
| --- | --- | --- |
| NIST.800-53 Security and Privacy Controls Rev. 5 | NIST_800_53 | Data Centre Capacity Record |
| NIST.800-53.CM-2 Baseline Configuration | NIST_800_53 | GPU Hardware & Sizing Record |
| NIST.800-53.CM-6 Configuration Settings | NIST_800_53 | Lab Setup & Reference Register |
| NIST.800-53.CM-8 System Component Inventory | NIST_800_53 | Handover & As-Built |
| NIST.800-53.IR-4 Incident Handling | NIST_800_53 | GPU Scheduling Troubleshooting Log |
| NIST.800-53.PL-2 System Security and Privacy Plans | NIST_800_53 | Handover & As-Built; Portfolio |
| NIST.800-53.SI-4 System Monitoring | NIST_800_53 | GPU Operations & Monitoring Log |
| NIST.AI-RMF.GOVERN Govern | NIST_AI_RMF | Lab Setup & Reference Register |
| NIST.AI-RMF.MAP Map | NIST_AI_RMF | AI Knowledge & Stack Record; GPU Hardware & Sizing Record |
| ISO42010 Architecture description | ISO_42010 | Portfolio |

## Tactics and practices

Adversary tactics are not part of this course.

| Practice | Anchor | Asked for by |
| --- | --- | --- |
| Least privilege | NIST.800-53.AC-6 | Serve a model behind an API |
| Retest to closure | NIST_800_115 | Work a scheduling fault, one change per row |
| Likelihood-times-impact scoring | NIST_800_30 | Power and cool the rack |
| Configuration record | ITIL.configuration | See training against inference; Read the GPU architecture; Map the NVIDIA software stack; Follow the data-processing path |
| Build record | ITIL.configuration | Read a GPU from nvidia-smi; Size a GPU to a model; Size the network fabric; Scale the training job; Hand the plan over |
| Right-sizing | WAF.cost | Size the memory |
| Architecture decision records | ISO_42010 | Size a GPU to a model; Power and cool the rack |
| Evidence by design | SOC2 | Map the NVIDIA software stack; Monitor the GPU telemetry; Hand the plan over |
| Redact before write | NIST_AI_RMF | Index a document set |
| Human checkpoint | NIST_AI_RMF | Work a scheduling fault, one change per row; AI extension: summarise the AI essentials and the stack; AI extension: explain the GPU sizing from the numbers; AI extension: draft the data-centre capacity notes; AI extension: summarise the monitoring and the fault; Answer from the passages |
| Suites with a pass line | NIST_AI_RMF | Build a question set; Set the pass line |

## KPI board

The sixteen numbers the Skill board keeps per member of this course, the catalogue row and kind of fact each one reads, and what it is counted over here, role by role.

| KPI | Family | Reads | Denominator in this course |
| --- | --- | --- | --- |
| Skills verified `kpi.technical.skills-verified` | technical | metric.skill-verified (own) | knowledge: 17 skills with a verifiable step; infra: 17 skills with a verifiable step; datacenter: 17 skills with a verifiable step; records: 17 skills with a verifiable step |
| Exam weight verified `kpi.technical.exam-weight-verified` | technical | metric.domain-weight-verified (own) | knowledge: 100 percent of the exam over 3 domains; infra: 100 percent of the exam over 3 domains; datacenter: 100 percent of the exam over 3 domains; records: 100 percent of the exam over 3 domains |
| Commands verified `kpi.technical.commands-verified` | technical | metric.tool-commands-verified (own) | knowledge: 24 verifiable steps that run a command; infra: 24 verifiable steps that run a command; datacenter: 24 verifiable steps that run a command; records: 24 verifiable steps that run a command |
| Procedures to standard `kpi.technical.procedures-to-standard` | technical | metric.procedure-to-standard (team) | knowledge: 6 procedures; infra: 6 procedures; datacenter: 6 procedures; records: 6 procedures |
| Faults resolved `kpi.problem-solving.faults-resolved` | problem-solving | metric.trouble-resolved (team) | knowledge: 1 fault, incident or triage table; infra: 1 fault, incident or triage table; datacenter: 1 fault, incident or triage table; records: 1 fault, incident or triage table |
| Verified after retry `kpi.problem-solving.persistence` | problem-solving | metric.ability-persistence (own) | knowledge: 24 verifiable steps; infra: 24 verifiable steps; datacenter: 24 verifiable steps; records: 24 verifiable steps |
| Stuck flags cleared `kpi.problem-solving.flags-cleared` | problem-solving | metric.ability-flags-cleared (own) | the stuck flags the member raises; no content denominator |
| Time to resolution `kpi.problem-solving.time-to-resolution` | problem-solving | metric.time-to-verify (own) | knowledge: 24 verifiable steps that can carry two stamps; infra: 24 verifiable steps that can carry two stamps; datacenter: 24 verifiable steps that can carry two stamps; records: 24 verifiable steps that can carry two stamps |
| Steps verified in order `kpi.execution.steps-in-order` | execution | metric.procedure-in-order (own) | knowledge: 2 tasks with two or more verifiable steps; infra: 2 tasks with two or more verifiable steps; datacenter: 2 tasks with two or more verifiable steps; records: 2 tasks with two or more verifiable steps |
| First-try verifications `kpi.execution.first-try` | execution | metric.ability-first-try (own) | knowledge: 24 verifiable steps; infra: 24 verifiable steps; datacenter: 24 verifiable steps; records: 24 verifiable steps |
| Files named to convention `kpi.execution.evidence-named` | execution | metric.evidence-naming (own) | the files the member hashes; no content denominator |
| Definition-of-Done met `kpi.execution.dod-met` | execution | metric.doc-dod-met (team) | knowledge: 29 checks on 8 forms; infra: 29 checks on 8 forms; datacenter: 29 checks on 8 forms; records: 29 checks on 8 forms |
| Decisions recorded `kpi.decision-making.decisions-recorded` | decision-making | metric.decision-recorded (team) | knowledge: 1 decision block; infra: 1 decision block; datacenter: 1 decision block; records: 1 decision block |
| Decisions justified `kpi.decision-making.decisions-justified` | decision-making | metric.decision-justified (team) | knowledge: 1 decision block; infra: 1 decision block; datacenter: 1 decision block; records: 1 decision block |
| Decisions approved `kpi.decision-making.decisions-approved` | decision-making | metric.decision-approved (team) | knowledge: 1 decision block; infra: 1 decision block; datacenter: 1 decision block; records: 1 decision block |
| Changes with rollback `kpi.decision-making.change-rollback` | decision-making | metric.procedure-change-recorded (team) | knowledge: 1 change table with a rollback column; infra: 1 change table with a rollback column; datacenter: 1 change table with a rollback column; records: 1 change table with a rollback column |
| Hand-offs completed `kpi.teamwork.handoffs` | teamwork | metric.collab-handoffs (team) | knowledge: 16 hand-offs; infra: 16 hand-offs; datacenter: 16 hand-offs; records: 16 hand-offs |
| RACI respected `kpi.teamwork.raci-respected` | teamwork | metric.collab-raci-respected (team) | knowledge: 8 forms with a RACI; infra: 8 forms with a RACI; datacenter: 8 forms with a RACI; records: 8 forms with a RACI |
| Peer reviews given `kpi.teamwork.peer-reviews-given` | teamwork | metric.collab-peer-reviews-given (own) | the reviews assigned to the member; no content denominator |
| Teammate steps ticked `kpi.teamwork.teammate-steps` | teamwork | metric.collab-teammate-steps (own) | a count; no denominator |
| On time `kpi.professionalism.on-time` | professionalism | metric.ability-deadline-adherence (own) | knowledge: 22 tasks of the role; infra: 22 tasks of the role; datacenter: 22 tasks of the role; records: 22 tasks of the role |
| Document control complete `kpi.professionalism.document-control` | professionalism | metric.doc-control-complete (team) | knowledge: 8 forms; infra: 8 forms; datacenter: 8 forms; records: 8 forms |
| Controls cited `kpi.professionalism.controls-cited` | professionalism | metric.standard-controls-cited (team) | knowledge: 1 control code on 1 form; infra: 2 control codes on 1 form; datacenter: 1 control code on 1 form; records: 7 control codes on 5 forms |
| Instructor approved `kpi.professionalism.instructor-approved` | professionalism | metric.doc-instructor-approved (team) | knowledge: 8 forms; infra: 8 forms; datacenter: 8 forms; records: 8 forms |
| Skills proved twice `kpi.growth.skills-transferred` | growth | metric.skill-transfer (own) | knowledge: 10 skills on two or more tasks; infra: 10 skills on two or more tasks; datacenter: 10 skills on two or more tasks; records: 10 skills on two or more tasks |
| Skills retained `kpi.growth.retention` | growth | metric.ability-recall (own) | knowledge: 17 skills with a verifiable step; infra: 17 skills with a verifiable step; datacenter: 17 skills with a verifiable step; records: 17 skills with a verifiable step |
| Learning velocity `kpi.growth.learning-velocity` | growth | metric.time-learning-velocity (own) | the verification stamps of the last two months; no content denominator |
| Profile coverage `kpi.growth.profile-coverage` | growth | metric.profile-coverage (own) | knowledge: Cyber Policy and Strategy Planner: 47 required, 46 not taught here; infra: System Administrator: 117 required, 110 not taught here; datacenter: Network Operations Specialist: 62 required, 61 not taught here; records: Cyber Policy and Strategy Planner: 47 required, 46 not taught here |
| Values recalled `kpi.validation.recall-accuracy` | validation | metric.validation-recall (own) |  |
| Scenarios applied `kpi.validation.applied-scenarios` | validation | metric.validation-applied (own) |  |
| Conflicts resolved `kpi.validation.conflicts-resolved` | validation | metric.conflicts-resolved (own) |  |
| Minutes on task `kpi.validation.time-on-task` | validation | metric.minutes-on-task (own) |  |

