# AWS Cloud Practitioner Capstone — skills sheet

20 graded tasks and 6 advanced · 26 skills · 15 tools · 7 procedures · 6 standards (6 controls cited) · 0 tactics · 21 practices

Generated from the registries and the course document by `npm run content:export`; edit `src/lib/docs/skills.ts`, `tools.ts`, `standards.ts`, `sops.ts`, `tactics.ts` or the seed, not this file.

## Skills

| Skill | Area | Anchored to | Practised by |
| --- | --- | --- | --- |
| Write an incident report `comp.respond.incident-report` | Incident response | CS0-003.d3, AZ-900.d3, CLF-C02.d2, NIST.800-61 | Find who changed it in CloudTrail and write the incident record |
| Run a local AI assistant offline `comp.ai.local-assistant` | Applied AI | NIST.AI-RMF.MANAGE | AI extension: explain the naming standard; AI extension: read the architecture; AI extension: check the API design; AI extension: draft the incident note; Serve a model behind an API |
| Ground an AI answer in the records `comp.ai.ground-in-records` | Applied AI | NIST.AI-RMF.MAP | AI extension: read the architecture; AI extension: check the API design; AI extension: draft the incident note |
| Verify AI output against the evidence `comp.ai.verify-ai-output` | Applied AI | NIST.AI-RMF.MEASURE | AI extension: explain the naming standard; AI extension: read the architecture; AI extension: check the API design; AI extension: draft the incident note; Answer from the passages; Build a question set; Set the pass line |
| Write a task-specific prompt `comp.ai.prompt-for-the-task` | Applied AI | NIST.AI-RMF.MAP | AI extension: explain the naming standard; Set the pass line |
| Build a retrieval-augmented pipeline `comp.ai.rag-pipeline` | Applied AI | NIST.AI-RMF.MAP | Index a document set; Answer from the passages; Build a question set |
| Load documents into a vector store `comp.ai.vector-store` | Applied AI | NIST.AI-RMF.MAP | Index a document set |
| Serve a model behind an API `comp.ai.serve-model` | Applied AI | NIST.AI-RMF.MEASURE | Serve a model behind an API; Size the memory |
| Size GPU memory for a model `comp.ai.gpu-sizing` | Applied AI | NIST.AI-RMF.MEASURE | Size the memory |
| Set a budget alert and a tag standard `comp.cloud.budget-and-tags` | Cloud services | AZ-900.d1, CLF-C02.d1, WAF.cost | Set the standard, the budget and the service model |
| State the shared-responsibility split `comp.cloud.shared-responsibility` | Cloud services | AZ-900.d1, CLF-C02.d1 | Set the standard, the budget and the service model |
| Create the network foundation: VNet or VPC `comp.cloud.network-foundation` | Cloud services | AZ-900.d2, CLF-C02.d3 | Create the VPC and public subnet |
| Open a team repository and board `comp.cloud.team-repo-and-board` | Cloud services | AZ-900.d3, CLF-C02.d3 | Open the team repository and board |
| Grant team access through groups and roles `comp.cloud.identity-and-groups` | Cloud services | AZ-900.d2, CLF-C02.d2, NIST.800-53.AC-2 | Add the team to the account and give them access |
| Estimate monthly cost and choose storage classes `comp.cloud.cost-estimate` | Cloud services | AZ-900.d3, CLF-C02.d4, WAF.cost | Estimate the cost and choose storage classes |
| Launch a free-tier VM and stop it `comp.cloud.launch-vm` | Cloud services | AZ-900.d2, CLF-C02.d3, WAF.cost | Launch the tools instance |
| Publish a static site over HTTPS `comp.cloud.static-site-https` | Cloud services | AZ-900.d2, CLF-C02.d3 | Publish the website with CloudFront |
| Allow SSH from one address only `comp.cloud.ssh-from-one-ip` | Cloud services | AZ-900.d2, CLF-C02.d2, NIST.800-53.SC-7 | Allow SSH from your IP only |
| Draw a request flow and who manages hops `comp.cloud.request-flow` | Cloud services | AZ-900.d1, CLF-C02.d1 | Draw the request flow and say who manages each hop |
| Create a managed NoSQL table and seed it `comp.cloud.managed-database` | Cloud services | AZ-900.d2, CLF-C02.d3 | Create the DynamoDB table |
| Build a serverless function and API `comp.cloud.serverless-api` | Cloud services | AZ-900.d2, CLF-C02.d3 | Build the counter Lambda and API |
| Grant read-only access to a group with MFA `comp.cloud.read-only-access` | Cloud services | AZ-900.d2, CLF-C02.d2, NIST.800-53.AC-6 | Give the team the right access |
| Report spend and read the advisor `comp.cloud.cost-report` | Cloud services | AZ-900.d3, CLF-C02.d4, WAF.cost | Report the cost, and read Trusted Advisor and the support plans |
| Alert on function errors to the team `comp.cloud.error-alert` | Cloud services | AZ-900.d3, CLF-C02.d3, NIST.CSF.DE.CM | Alarm on Lambda errors |
| Find a failure in logs and fix it `comp.cloud.read-logs` | Cloud services | AZ-900.d3, CLF-C02.d3 | Find a failure in CloudWatch Logs |
| Trace a change in the audit trail `comp.cloud.audit-trail` | Cloud services | AZ-900.d3, CLF-C02.d2, NIST.800-61.DETECT | Find who changed it in CloudTrail and write the incident record |

## Tools

| Tool | Kind | Used by |
| --- | --- | --- |
| Linux shell | cli | Set the standard, the budget and the service model; Create the VPC and public subnet; Add the team to the account and give them access; Launch the tools instance; Publish the website with CloudFront; Allow SSH from your IP only; Create the DynamoDB table; Build the counter Lambda and API; Give the team the right access; Find a failure in CloudWatch Logs; Size the memory; Answer from the passages; Build a question set; Set the pass line |
| PowerShell | cli | Allow SSH from your IP only |
| curl | cli | Allow SSH from your IP only; Build the counter Lambda and API; Find a failure in CloudWatch Logs; Serve a model behind an API |
| Capstone forms | document | Set the standard, the budget and the service model; Create the VPC and public subnet; Open the team repository and board; Add the team to the account and give them access; Estimate the cost and choose storage classes; Launch the tools instance; Publish the website with CloudFront; Allow SSH from your IP only; Draw the request flow and say who manages each hop; Create the DynamoDB table; Build the counter Lambda and API; Give the team the right access; Report the cost, and read Trusted Advisor and the support plans; Alarm on Lambda errors; Find a failure in CloudWatch Logs; Find who changed it in CloudTrail and write the incident record; AI extension: explain the naming standard; AI extension: read the architecture; AI extension: check the API design; AI extension: draft the incident note; Serve a model behind an API; Size the memory; Index a document set; Answer from the passages; Build a question set; Set the pass line |
| Capstone guide | document | Draw the request flow and say who manages each hop |
| Browser DevTools | app | Build the counter Lambda and API; Find a failure in CloudWatch Logs |
| Authenticator app | app | Add the team to the account and give them access |
| Ollama | service | AI extension: explain the naming standard; AI extension: read the architecture; AI extension: check the API design; AI extension: draft the incident note; Serve a model behind an API; Answer from the passages |
| Chroma | service | Index a document set |
| GitHub | service | Open the team repository and board |
| Python | language | Serve a model behind an API; Size the memory; Index a document set; Answer from the passages; Build a question set; Set the pass line |
| AWS console | portal | Set the standard, the budget and the service model; Create the VPC and public subnet; Add the team to the account and give them access; Launch the tools instance; Publish the website with CloudFront; Allow SSH from your IP only; Create the DynamoDB table; Build the counter Lambda and API; Give the team the right access; Report the cost, and read Trusted Advisor and the support plans; Alarm on Lambda errors; Find a failure in CloudWatch Logs; Find who changed it in CloudTrail and write the incident record |
| AWS CloudShell | portal | Set the standard, the budget and the service model; Create the VPC and public subnet; Add the team to the account and give them access; Launch the tools instance; Publish the website with CloudFront; Allow SSH from your IP only; Create the DynamoDB table; Build the counter Lambda and API; Give the team the right access; Report the cost, and read Trusted Advisor and the support plans; Alarm on Lambda errors; Find a failure in CloudWatch Logs; Find who changed it in CloudTrail and write the incident record |
| AWS CLI | cli | Set the standard, the budget and the service model; Create the VPC and public subnet; Add the team to the account and give them access; Launch the tools instance; Publish the website with CloudFront; Allow SSH from your IP only; Create the DynamoDB table; Build the counter Lambda and API; Give the team the right access; Report the cost, and read Trusted Advisor and the support plans; Alarm on Lambda errors; Find a failure in CloudWatch Logs; Find who changed it in CloudTrail and write the incident record |
| AWS Pricing Calculator | portal | Estimate the cost and choose storage classes |

## Procedures

Runbooks and standard operating procedures the forms are instances of, and the tasks that execute them.

| Procedure | Kind | Standards | Forms | Executed by |
| --- | --- | --- | --- | --- |
| Incident record | incident | NIST.800-61.DETECT, ISO27001.A.5.26, NIST.CSF.RS.AN | Monitoring & Incident Report | Find who changed it in CloudTrail and write the incident record |
| Security policy | policy | ISO27001.5.2, ISO27001.A.5.1, NIST.CSF.GV.PO, NIST.800-53.PM-1 | Cloud Foundation & Naming Standard | — |
| Monitoring plan | monitoring | NIST.CSF.DE.CM, ISO27001.A.8.16, SOC2.CC7.2, ITIL.monitoring | Monitoring & Incident Report | — |
| Cost review | governance | WAF.cost | Cloud Foundation & Naming Standard | Launch the tools instance |
| Architecture record | design | ISO42010, WAF, NIST.800-53.PL-8 | Solution Architecture Document | — |
| Requirements record | design | ISO42010, WAF | Application & API Design Specification | — |
| Portfolio record | handover | ISO42010, NIST.800-53.PL-2, ITIL.knowledge | Portfolio | — |

## Standards

| Standard | Tagged on tasks | Cited by forms |
| --- | --- | --- |
| ITIL 4 | — | Monitoring & Incident Report |
| AWS CLF-C02 | Set the standard, the budget and the service model; Create the VPC and public subnet; Open the team repository and board; Add the team to the account and give them access; Estimate the cost and choose storage classes; Launch the tools instance; Publish the website with CloudFront; Allow SSH from your IP only; Draw the request flow and say who manages each hop; Create the DynamoDB table; Build the counter Lambda and API; Give the team the right access; Report the cost, and read Trusted Advisor and the support plans; Alarm on Lambda errors; Find a failure in CloudWatch Logs; Find who changed it in CloudTrail and write the incident record | — |
| Well-Architected | Set the standard, the budget and the service model; Create the VPC and public subnet; Open the team repository and board; Add the team to the account and give them access; Estimate the cost and choose storage classes; Launch the tools instance; Publish the website with CloudFront; Allow SSH from your IP only; Draw the request flow and say who manages each hop; Create the DynamoDB table; Build the counter Lambda and API; Give the team the right access; Report the cost, and read Trusted Advisor and the support plans; Alarm on Lambda errors; Find a failure in CloudWatch Logs; Find who changed it in CloudTrail and write the incident record | — |
| NIST AI RMF | AI extension: explain the naming standard; AI extension: read the architecture; AI extension: check the API design; AI extension: draft the incident note; Serve a model behind an API; Size the memory; Index a document set; Answer from the passages; Build a question set; Set the pass line | — |
| NIST SP 800-53 | — | Cloud Foundation & Naming Standard; Application & API Design Specification; Monitoring & Incident Report; Portfolio |
| ISO/IEC/IEEE 42010 | — | Solution Architecture Document; Portfolio |

| Control cited | Standard | By |
| --- | --- | --- |
| NIST.800-53.CM-8 System Component Inventory | NIST_800_53 | Cloud Foundation & Naming Standard |
| NIST.800-53.IR-4 Incident Handling | NIST_800_53 | Monitoring & Incident Report |
| NIST.800-53.PL-2 System Security and Privacy Plans | NIST_800_53 | Portfolio |
| NIST.800-53.SC-8 Transmission Confidentiality and Integrity | NIST_800_53 | Application & API Design Specification |
| ITIL.incident Incident management | ITIL | Monitoring & Incident Report |
| ISO42010 Architecture description | ISO_42010 | Solution Architecture Document; Portfolio |

Forms whose standard names a practice rather than a control:

- Cloud Foundation & Naming Standard: practice.naming-and-tagging
- Application & API Design Specification: practice.api-contract

## Tactics and practices

Adversary tactics are not part of this course.

| Practice | Anchor | Asked for by |
| --- | --- | --- |
| Least privilege | NIST.800-53.AC-6 | Add the team to the account and give them access; Allow SSH from your IP only; Give the team the right access; Serve a model behind an API |
| Default deny | NIST.800-53.SC-7 | Allow SSH from your IP only |
| Multi-factor authentication | NIST_800_63 | Add the team to the account and give them access; Give the team the right access |
| Secrets in a store | NIST.800-53.IA-5 | Build the counter Lambda and API |
| Encryption in transit | NIST.800-53.SC-8 | Publish the website with CloudFront |
| Interface contract | WAF.operational-excellence | Build the counter Lambda and API |
| Naming and tagging | WAF.cost | Set the standard, the budget and the service model |
| Budget guardrails | WAF.cost | Set the standard, the budget and the service model; Report the cost, and read Trusted Advisor and the support plans |
| Tear down after use | WAF.cost | Launch the tools instance |
| Right-sizing | WAF.cost | Estimate the cost and choose storage classes; Create the DynamoDB table; Report the cost, and read Trusted Advisor and the support plans; Size the memory |
| Centralised logging | NIST.CSF.DE.CM | Alarm on Lambda errors; Find a failure in CloudWatch Logs |
| Alert to ticket | ITIL.incident | Alarm on Lambda errors |
| Evidence-backed timeline | NIST.800-61.DETECT | Find who changed it in CloudTrail and write the incident record |
| Lessons learned | NIST.800-61.POST | Find who changed it in CloudTrail and write the incident record |
| Architecture decision records | ISO_42010 | Draw the request flow and say who manages each hop |
| Addressing plan | NIST.CSF.ID.AM | Create the VPC and public subnet |
| Structured troubleshooting | ITIL.problem | Find a failure in CloudWatch Logs |
| Redact before write | NIST_AI_RMF | Index a document set |
| Human checkpoint | NIST_AI_RMF | AI extension: explain the naming standard; AI extension: read the architecture; AI extension: check the API design; AI extension: draft the incident note; Answer from the passages |
| Suites with a pass line | NIST_AI_RMF | Build a question set; Set the pass line |
| Work tracked on a board | ITIL.knowledge | Open the team repository and board |

## KPI board

The sixteen numbers the Skill board keeps per member of this course, the catalogue row and kind of fact each one reads, and what it is counted over here, role by role.

| KPI | Family | Reads | Denominator in this course |
| --- | --- | --- | --- |
| Skills verified `kpi.technical.skills-verified` | technical | metric.skill-verified (own) | arch: 11 skills with a verifiable step; infra: 12 skills with a verifiable step; dev: 11 skills with a verifiable step; secops: 13 skills with a verifiable step |
| Exam weight verified `kpi.technical.exam-weight-verified` | technical | metric.domain-weight-verified (own) | arch: 36 percent of the exam over 2 domains; infra: 34 percent of the exam over 1 domain; dev: 34 percent of the exam over 1 domain; secops: 30 percent of the exam over 1 domain |
| Commands verified `kpi.technical.commands-verified` | technical | metric.tool-commands-verified (own) | arch: 13 verifiable steps that run a command; infra: 19 verifiable steps that run a command; dev: 18 verifiable steps that run a command; secops: 19 verifiable steps that run a command |
| Procedures to standard `kpi.technical.procedures-to-standard` | technical | metric.procedure-to-standard (team) | arch: 7 procedures; infra: 7 procedures; dev: 7 procedures; secops: 7 procedures |
| Faults resolved `kpi.problem-solving.faults-resolved` | problem-solving | metric.trouble-resolved (team) | arch: 2 fault, incident or triage tables; infra: 2 fault, incident or triage tables; dev: 2 fault, incident or triage tables; secops: 2 fault, incident or triage tables |
| Verified after retry `kpi.problem-solving.persistence` | problem-solving | metric.ability-persistence (own) | arch: 13 verifiable steps; infra: 19 verifiable steps; dev: 18 verifiable steps; secops: 19 verifiable steps |
| Stuck flags cleared `kpi.problem-solving.flags-cleared` | problem-solving | metric.ability-flags-cleared (own) | the stuck flags the member raises; no content denominator |
| Time to resolution `kpi.problem-solving.time-to-resolution` | problem-solving | metric.time-to-verify (own) | arch: 13 verifiable steps that can carry two stamps; infra: 19 verifiable steps that can carry two stamps; dev: 18 verifiable steps that can carry two stamps; secops: 19 verifiable steps that can carry two stamps |
| Steps verified in order `kpi.execution.steps-in-order` | execution | metric.procedure-in-order (own) | arch: 1 task with two or more verifiable steps; infra: 4 tasks with two or more verifiable steps; dev: 3 tasks with two or more verifiable steps; secops: 3 tasks with two or more verifiable steps |
| First-try verifications `kpi.execution.first-try` | execution | metric.ability-first-try (own) | arch: 13 verifiable steps; infra: 19 verifiable steps; dev: 18 verifiable steps; secops: 19 verifiable steps |
| Files named to convention `kpi.execution.evidence-named` | execution | metric.evidence-naming (own) | the files the member hashes; no content denominator |
| Definition-of-Done met `kpi.execution.dod-met` | execution | metric.doc-dod-met (team) | arch: 33 checks on 5 forms; infra: 33 checks on 5 forms; dev: 33 checks on 5 forms; secops: 33 checks on 5 forms |
| Decisions recorded `kpi.decision-making.decisions-recorded` | decision-making | metric.decision-recorded (team) | arch: 1 decision block; infra: 1 decision block; dev: 1 decision block; secops: 1 decision block |
| Decisions justified `kpi.decision-making.decisions-justified` | decision-making | metric.decision-justified (team) | arch: 1 decision block; infra: 1 decision block; dev: 1 decision block; secops: 1 decision block |
| Decisions approved `kpi.decision-making.decisions-approved` | decision-making | metric.decision-approved (team) | arch: 1 decision block; infra: 1 decision block; dev: 1 decision block; secops: 1 decision block |
| Changes with rollback `kpi.decision-making.change-rollback` | decision-making | metric.procedure-change-recorded (team) | arch: 1 change table with a rollback column; infra: 1 change table with a rollback column; dev: 1 change table with a rollback column; secops: 1 change table with a rollback column |
| Hand-offs completed `kpi.teamwork.handoffs` | teamwork | metric.collab-handoffs (team) | arch: 8 hand-offs; infra: 8 hand-offs; dev: 8 hand-offs; secops: 8 hand-offs |
| RACI respected `kpi.teamwork.raci-respected` | teamwork | metric.collab-raci-respected (team) | arch: 5 forms with a RACI; infra: 5 forms with a RACI; dev: 5 forms with a RACI; secops: 5 forms with a RACI |
| Peer reviews given `kpi.teamwork.peer-reviews-given` | teamwork | metric.collab-peer-reviews-given (own) | the reviews assigned to the member; no content denominator |
| Teammate steps ticked `kpi.teamwork.teammate-steps` | teamwork | metric.collab-teammate-steps (own) | a count; no denominator |
| On time `kpi.professionalism.on-time` | professionalism | metric.ability-deadline-adherence (own) | arch: 14 tasks of the role; infra: 14 tasks of the role; dev: 14 tasks of the role; secops: 14 tasks of the role |
| Document control complete `kpi.professionalism.document-control` | professionalism | metric.doc-control-complete (team) | arch: 5 forms; infra: 5 forms; dev: 5 forms; secops: 5 forms |
| Controls cited `kpi.professionalism.controls-cited` | professionalism | metric.standard-controls-cited (team) | arch: 2 control codes on 2 forms; infra: 1 control code on 1 form; dev: 1 control code on 1 form; secops: 2 control codes on 1 form |
| Instructor approved `kpi.professionalism.instructor-approved` | professionalism | metric.doc-instructor-approved (team) | arch: 5 forms; infra: 5 forms; dev: 5 forms; secops: 5 forms |
| Skills proved twice `kpi.growth.skills-transferred` | growth | metric.skill-transfer (own) | arch: 6 skills on two or more tasks; infra: 6 skills on two or more tasks; dev: 6 skills on two or more tasks; secops: 6 skills on two or more tasks |
| Skills retained `kpi.growth.retention` | growth | metric.ability-recall (own) | arch: 11 skills with a verifiable step; infra: 12 skills with a verifiable step; dev: 11 skills with a verifiable step; secops: 13 skills with a verifiable step |
| Learning velocity `kpi.growth.learning-velocity` | growth | metric.time-learning-velocity (own) | the verification stamps of the last two months; no content denominator |
| Profile coverage `kpi.growth.profile-coverage` | growth | metric.profile-coverage (own) | arch: Security Architect: 69 required, 64 not taught here; infra: System Administrator: 117 required, 113 not taught here; dev: Software Developer: 84 required, 80 not taught here; secops: Cyber Defense Analyst: 78 required, 74 not taught here |
| Values recalled `kpi.validation.recall-accuracy` | validation | metric.validation-recall (own) |  |
| Scenarios applied `kpi.validation.applied-scenarios` | validation | metric.validation-applied (own) |  |
| Conflicts resolved `kpi.validation.conflicts-resolved` | validation | metric.conflicts-resolved (own) |  |
| Minutes on task `kpi.validation.time-on-task` | validation | metric.minutes-on-task (own) |  |

