# AWS Certified AI Practitioner — the Bedrock Studio — skills sheet

16 graded tasks and 8 advanced · 17 skills · 11 tools · 9 procedures · 4 standards (11 controls cited) · 0 tactics · 18 practices

Generated from the registries and the course document by `npm run content:export`; edit `src/lib/docs/skills.ts`, `tools.ts`, `standards.ts`, `sops.ts`, `tactics.ts` or the seed, not this file.

## Skills

| Skill | Area | Anchored to | Practised by |
| --- | --- | --- | --- |
| Keep a chain of custody `comp.forensics.chain-of-custody` | Evidence and forensics | SY0-701.d4, ISO_27037 | Hand the solution over |
| Run a local AI assistant offline `comp.ai.local-assistant` | Applied AI | NIST.AI-RMF.MANAGE | Ground a local model in your notes; AI extension: explain the capabilities map; AI extension: check the responsible-AI findings; AI extension: draft the build record; AI extension: summarise the handover |
| Ground an AI answer in the records `comp.ai.ground-in-records` | Applied AI | NIST.AI-RMF.MAP | Ground a local model in your notes; Work a wrong answer until it is grounded; Build a grounded chat app; AI extension: check the responsible-AI findings; AI extension: draft the build record; AI extension: summarise the handover |
| Verify AI output against the evidence `comp.ai.verify-ai-output` | Applied AI | NIST.AI-RMF.MEASURE | Work a wrong answer until it is grounded; AI extension: explain the capabilities map; AI extension: check the responsible-AI findings; AI extension: draft the build record; AI extension: summarise the handover; Answer from the passages; Build a question set; Set the pass line; Give the agent tools; Keep it on a leash; Audit the agent |
| Write a task-specific prompt `comp.ai.prompt-for-the-task` | Applied AI | NIST.AI-RMF.MAP | Name the workloads behind the features; AI extension: explain the capabilities map; Set the pass line |
| Build a retrieval-augmented pipeline `comp.ai.rag-pipeline` | Applied AI | NIST.AI-RMF.MAP | Build a grounded chat app; Index a document set; Answer from the passages; Build a question set |
| Load documents into a vector store `comp.ai.vector-store` | Applied AI | NIST.AI-RMF.MAP | Index a document set |
| Give an agent tools to call `comp.ai.agent-tools` | Applied AI | NIST.AI-RMF.MANAGE | Build an agent that extracts data; Give the agent tools; Keep it on a leash; Serve a tool over MCP; Audit the agent |
| Expose a tool over a model context protocol `comp.ai.mcp-connector` | Applied AI | NIST.AI-RMF.MANAGE | Serve a tool over MCP |
| Identify the AI workload behind a feature `comp.ai.identify-workload` | Applied AI | AI-901.d1, NIST.AI-RMF.MAP | Name the workloads behind the features |
| Read the parts of a language model `comp.ai.model-components` | Applied AI | AI-901.d1 | Read what a foundation model is made of |
| Assess an AI system against responsible-AI principles `comp.ai.responsible-ai` | Applied AI | AI-901.d1, NIST.AI-RMF.GOVERN | Assess it against the guidelines |
| Evaluate a model against a labelled set `comp.ai.evaluate-model` | Applied AI | AI-901.d1, NIST.AI-RMF.MEASURE | Read how it is trained and measured; Lock it down and govern the risks |
| Deploy a model in Azure AI Foundry `comp.ai.deploy-foundry` | Applied AI | AI-901.d2 | Invoke a model on Bedrock |
| Call language and vision services `comp.ai.language-vision` | Applied AI | AI-901.d2 | Add language and document reading |
| Keep an AI risk register `comp.ai.govern-ai` | Applied AI | AI-901.d2, NIST.AI-RMF.MANAGE | Assess it against the guidelines; Lock it down and govern the risks |
| Assemble and hand over an as-built package `comp.docs.as-built-handover` | Documentation and records | SK0-005.d2, 200-301.d1, ITIL.transition | Hand the solution over |

## Tools

| Tool | Kind | Used by |
| --- | --- | --- |
| Linux shell | cli | Read what a foundation model is made of; Ground a local model in your notes; Read how it is trained and measured; Work a wrong answer until it is grounded; Invoke a model on Bedrock; Add language and document reading; Build an agent that extracts data; Lock it down and govern the risks; Hand the solution over; Answer from the passages; Build a question set; Set the pass line; Give the agent tools; Keep it on a leash; Audit the agent |
| Capstone forms | document | Name the workloads behind the features; Read what a foundation model is made of; Ground a local model in your notes; Assess it against the guidelines; Read how it is trained and measured; Work a wrong answer until it is grounded; Invoke a model on Bedrock; Build a grounded chat app; Add language and document reading; Build an agent that extracts data; Lock it down and govern the risks; Hand the solution over; AI extension: explain the capabilities map; AI extension: check the responsible-AI findings; AI extension: draft the build record; AI extension: summarise the handover; Index a document set; Answer from the passages; Build a question set; Set the pass line; Give the agent tools; Keep it on a leash; Serve a tool over MCP; Audit the agent |
| Notes | document | Name the workloads behind the features |
| Ollama | service | Read what a foundation model is made of; Ground a local model in your notes; Work a wrong answer until it is grounded; Build a grounded chat app; AI extension: explain the capabilities map; AI extension: check the responsible-AI findings; AI extension: draft the build record; AI extension: summarise the handover; Answer from the passages; Give the agent tools |
| Chroma | service | Index a document set |
| Python | language | Build a grounded chat app; Add language and document reading; Build an agent that extracts data; Index a document set; Answer from the passages; Build a question set; Set the pass line; Give the agent tools; Keep it on a leash; Serve a tool over MCP; Audit the agent |
| AWS console | portal | Name the workloads behind the features; Invoke a model on Bedrock; Add language and document reading; Lock it down and govern the risks; Hand the solution over |
| AWS CloudShell | portal | Name the workloads behind the features; Invoke a model on Bedrock; Add language and document reading; Hand the solution over |
| AWS CLI | cli | Name the workloads behind the features; Invoke a model on Bedrock; Add language and document reading; Hand the solution over |
| Amazon Bedrock | service | Invoke a model on Bedrock; Build an agent that extracts data |
| Amazon AI services | service | Add language and document reading |

## Procedures

Runbooks and standard operating procedures the forms are instances of, and the tasks that execute them.

| Procedure | Kind | Standards | Forms | Executed by |
| --- | --- | --- | --- | --- |
| Chain of custody | custody | ISO27037, ISO27001.A.5.28, NIST.800-61 | Handover & Solution Record | Hand the solution over |
| Operational handover | handover | ITIL.transition, ISO27001.A.5.37, ITIL.knowledge | Handover & Solution Record | Hand the solution over |
| Risk register | risk | NIST.800-30, ISO27005, ISO27001.6.1.2, NIST.CSF.GV.RM | Security, Governance & Risk Register | Lock it down and govern the risks |
| Asset inventory | inventory | NIST.CSF.ID.AM, CIS.1, ISO27001.A.5.9, ITIL.asset | Studio Setup & Access Register | — |
| AI system map | inventory | NIST.AI-RMF.MAP, ISO42001 | AI Workloads & Capabilities Map | Name the workloads behind the features |
| Governance report | governance | NIST.CSF.GV, ISO27001.9.3 | Responsible AI Assessment; Security, Governance & Risk Register | Assess it against the guidelines |
| Build record | build | ITIL.configuration, NIST.800-53.CM-2, ISO27001.A.8.9 | Bedrock Build Record; Language & Extraction Log | Invoke a model on Bedrock |
| Test and acceptance record | build | ITIL.transition, NIST.800-53.CA-2, ISO27001.A.8.29 | Evaluation & Grounding Log | Work a wrong answer until it is grounded |
| Portfolio record | handover | ISO42010, NIST.800-53.PL-2, ITIL.knowledge | Portfolio | — |

## Standards

| Standard | Tagged on tasks | Cited by forms |
| --- | --- | --- |
| NIST AI RMF | Name the workloads behind the features; Read what a foundation model is made of; Ground a local model in your notes; Assess it against the guidelines; Read how it is trained and measured; Work a wrong answer until it is grounded; Invoke a model on Bedrock; Build a grounded chat app; Add language and document reading; Build an agent that extracts data; Lock it down and govern the risks; Hand the solution over; AI extension: explain the capabilities map; AI extension: check the responsible-AI findings; AI extension: draft the build record; AI extension: summarise the handover; Index a document set; Answer from the passages; Build a question set; Set the pass line; Give the agent tools; Keep it on a leash; Serve a tool over MCP; Audit the agent | Studio Setup & Access Register; AI Workloads & Capabilities Map; Responsible AI Assessment; Evaluation & Grounding Log; Security, Governance & Risk Register |
| ISO/IEC 42001 | — | Responsible AI Assessment; Security, Governance & Risk Register |
| NIST SP 800-53 | — | Studio Setup & Access Register; Bedrock Build Record; Language & Extraction Log; Handover & Solution Record; Portfolio |
| ISO/IEC/IEEE 42010 | — | Portfolio |

| Control cited | Standard | By |
| --- | --- | --- |
| NIST.800-53 Security and Privacy Controls Rev. 5 | NIST_800_53 | Language & Extraction Log |
| NIST.800-53.AC-2 Account Management | NIST_800_53 | Studio Setup & Access Register |
| NIST.800-53.CM-2 Baseline Configuration | NIST_800_53 | Bedrock Build Record |
| NIST.800-53.CM-8 System Component Inventory | NIST_800_53 | Handover & Solution Record |
| NIST.800-53.PL-2 System Security and Privacy Plans | NIST_800_53 | Handover & Solution Record; Portfolio |
| NIST.AI-RMF.GOVERN Govern | NIST_AI_RMF | Studio Setup & Access Register; Responsible AI Assessment; Security, Governance & Risk Register |
| NIST.AI-RMF.MAP Map | NIST_AI_RMF | AI Workloads & Capabilities Map |
| NIST.AI-RMF.MEASURE Measure | NIST_AI_RMF | Evaluation & Grounding Log |
| NIST.AI-RMF.MANAGE Manage | NIST_AI_RMF | Security, Governance & Risk Register |
| ISO42001 AI management system | ISO_42001 | Responsible AI Assessment; Security, Governance & Risk Register |
| ISO42010 Architecture description | ISO_42010 | Portfolio |

## Tactics and practices

Adversary tactics are not part of this course.

| Practice | Anchor | Asked for by |
| --- | --- | --- |
| Hash evidence at capture | ISO_27037 | Hand the solution over |
| Retest to closure | NIST_800_115 | Work a wrong answer until it is grounded |
| Likelihood-times-impact scoring | NIST_800_30 | Assess it against the guidelines; Lock it down and govern the risks |
| Configuration record | ITIL.configuration | Add language and document reading |
| Build record | ITIL.configuration | Name the workloads behind the features; Read what a foundation model is made of; Invoke a model on Bedrock |
| Software bill of materials | NIST_800_218 | Name the workloads behind the features |
| Guardrail regression tests | NIST_800_218 | Build a grounded chat app |
| Budget guardrails | WAF.cost | Invoke a model on Bedrock |
| Sign and version documents | ISO27001.7.5 | Hand the solution over |
| As-built documentation | ITIL.transition | Hand the solution over |
| Architecture decision records | ISO_42010 | Assess it against the guidelines |
| Test and acceptance | ITIL.transition | Read how it is trained and measured |
| Evidence by design | SOC2 | Ground a local model in your notes |
| Least privilege for agents | OWASP_LLM | Build an agent that extracts data; Give the agent tools; Serve a tool over MCP |
| Redact before write | NIST_AI_RMF | Index a document set |
| Human checkpoint | NIST_AI_RMF | Ground a local model in your notes; Work a wrong answer until it is grounded; Build a grounded chat app; AI extension: explain the capabilities map; AI extension: check the responsible-AI findings; AI extension: draft the build record; AI extension: summarise the handover; Answer from the passages; Keep it on a leash; Audit the agent |
| Suites with a pass line | NIST_AI_RMF | Build a question set; Set the pass line |
| Work tracked on a board | ITIL.knowledge | Lock it down and govern the risks |

## KPI board

The sixteen numbers the Skill board keeps per member of this course, the catalogue row and kind of fact each one reads, and what it is counted over here, role by role.

| KPI | Family | Reads | Denominator in this course |
| --- | --- | --- | --- |
| Skills verified `kpi.technical.skills-verified` | technical | metric.skill-verified (own) | concepts: 16 skills with a verifiable step; build: 16 skills with a verifiable step; language: 16 skills with a verifiable step; records: 16 skills with a verifiable step |
| Exam weight verified `kpi.technical.exam-weight-verified` | technical | metric.domain-weight-verified (own) | concepts: 100 percent of the exam over 5 domains; build: 100 percent of the exam over 5 domains; language: 100 percent of the exam over 5 domains; records: 100 percent of the exam over 5 domains |
| Commands verified `kpi.technical.commands-verified` | technical | metric.tool-commands-verified (own) | concepts: 30 verifiable steps that run a command; build: 30 verifiable steps that run a command; language: 30 verifiable steps that run a command; records: 30 verifiable steps that run a command |
| Procedures to standard `kpi.technical.procedures-to-standard` | technical | metric.procedure-to-standard (team) | concepts: 9 procedures; build: 9 procedures; language: 9 procedures; records: 9 procedures |
| Faults resolved `kpi.problem-solving.faults-resolved` | problem-solving | metric.trouble-resolved (team) | concepts: 1 fault, incident or triage table; build: 1 fault, incident or triage table; language: 1 fault, incident or triage table; records: 1 fault, incident or triage table |
| Verified after retry `kpi.problem-solving.persistence` | problem-solving | metric.ability-persistence (own) | concepts: 30 verifiable steps; build: 30 verifiable steps; language: 30 verifiable steps; records: 30 verifiable steps |
| Stuck flags cleared `kpi.problem-solving.flags-cleared` | problem-solving | metric.ability-flags-cleared (own) | the stuck flags the member raises; no content denominator |
| Time to resolution `kpi.problem-solving.time-to-resolution` | problem-solving | metric.time-to-verify (own) | concepts: 30 verifiable steps that can carry two stamps; build: 30 verifiable steps that can carry two stamps; language: 30 verifiable steps that can carry two stamps; records: 30 verifiable steps that can carry two stamps |
| Steps verified in order `kpi.execution.steps-in-order` | execution | metric.procedure-in-order (own) | concepts: 7 tasks with two or more verifiable steps; build: 7 tasks with two or more verifiable steps; language: 7 tasks with two or more verifiable steps; records: 7 tasks with two or more verifiable steps |
| First-try verifications `kpi.execution.first-try` | execution | metric.ability-first-try (own) | concepts: 30 verifiable steps; build: 30 verifiable steps; language: 30 verifiable steps; records: 30 verifiable steps |
| Files named to convention `kpi.execution.evidence-named` | execution | metric.evidence-naming (own) | the files the member hashes; no content denominator |
| Definition-of-Done met `kpi.execution.dod-met` | execution | metric.doc-dod-met (team) | concepts: 34 checks on 9 forms; build: 34 checks on 9 forms; language: 34 checks on 9 forms; records: 34 checks on 9 forms |
| Decisions recorded `kpi.decision-making.decisions-recorded` | decision-making | metric.decision-recorded (team) | concepts: 1 decision block; build: 1 decision block; language: 1 decision block; records: 1 decision block |
| Decisions justified `kpi.decision-making.decisions-justified` | decision-making | metric.decision-justified (team) | concepts: 1 decision block; build: 1 decision block; language: 1 decision block; records: 1 decision block |
| Decisions approved `kpi.decision-making.decisions-approved` | decision-making | metric.decision-approved (team) | concepts: 1 decision block; build: 1 decision block; language: 1 decision block; records: 1 decision block |
| Changes with rollback `kpi.decision-making.change-rollback` | decision-making | metric.procedure-change-recorded (team) | concepts: 1 change table with a rollback column; build: 1 change table with a rollback column; language: 1 change table with a rollback column; records: 1 change table with a rollback column |
| Hand-offs completed `kpi.teamwork.handoffs` | teamwork | metric.collab-handoffs (team) | concepts: 16 hand-offs; build: 16 hand-offs; language: 16 hand-offs; records: 16 hand-offs |
| RACI respected `kpi.teamwork.raci-respected` | teamwork | metric.collab-raci-respected (team) | concepts: 9 forms with a RACI; build: 9 forms with a RACI; language: 9 forms with a RACI; records: 9 forms with a RACI |
| Peer reviews given `kpi.teamwork.peer-reviews-given` | teamwork | metric.collab-peer-reviews-given (own) | the reviews assigned to the member; no content denominator |
| Teammate steps ticked `kpi.teamwork.teammate-steps` | teamwork | metric.collab-teammate-steps (own) | a count; no denominator |
| On time `kpi.professionalism.on-time` | professionalism | metric.ability-deadline-adherence (own) | concepts: 24 tasks of the role; build: 24 tasks of the role; language: 24 tasks of the role; records: 24 tasks of the role |
| Document control complete `kpi.professionalism.document-control` | professionalism | metric.doc-control-complete (team) | concepts: 9 forms; build: 9 forms; language: 9 forms; records: 9 forms |
| Controls cited `kpi.professionalism.controls-cited` | professionalism | metric.standard-controls-cited (team) | concepts: 3 control codes on 2 forms; build: 1 control code on 1 form; language: 1 control code on 1 form; records: 8 control codes on 5 forms |
| Instructor approved `kpi.professionalism.instructor-approved` | professionalism | metric.doc-instructor-approved (team) | concepts: 9 forms; build: 9 forms; language: 9 forms; records: 9 forms |
| Skills proved twice `kpi.growth.skills-transferred` | growth | metric.skill-transfer (own) | concepts: 8 skills on two or more tasks; build: 8 skills on two or more tasks; language: 8 skills on two or more tasks; records: 8 skills on two or more tasks |
| Skills retained `kpi.growth.retention` | growth | metric.ability-recall (own) | concepts: 16 skills with a verifiable step; build: 16 skills with a verifiable step; language: 16 skills with a verifiable step; records: 16 skills with a verifiable step |
| Learning velocity `kpi.growth.learning-velocity` | growth | metric.time-learning-velocity (own) | the verification stamps of the last two months; no content denominator |
| Profile coverage `kpi.growth.profile-coverage` | growth | metric.profile-coverage (own) | concepts: Cyber Policy and Strategy Planner: 47 required, 46 not taught here; build: Software Developer: 84 required, 83 not taught here; language: Software Developer: 84 required, 83 not taught here; records: Cyber Policy and Strategy Planner: 47 required, 46 not taught here |
| Values recalled `kpi.validation.recall-accuracy` | validation | metric.validation-recall (own) |  |
| Scenarios applied `kpi.validation.applied-scenarios` | validation | metric.validation-applied (own) |  |
| Conflicts resolved `kpi.validation.conflicts-resolved` | validation | metric.conflicts-resolved (own) |  |
| Minutes on task `kpi.validation.time-on-task` | validation | metric.minutes-on-task (own) |  |

