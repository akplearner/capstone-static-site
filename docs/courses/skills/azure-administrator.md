# Azure Administrator Capstone — skills sheet

20 graded tasks and 6 advanced · 25 skills · 10 tools · 8 procedures · 6 standards (9 controls cited) · 0 tactics · 20 practices

Generated from the registries and the course document by `npm run content:export`; edit `src/lib/docs/skills.ts`, `tools.ts`, `standards.ts`, `sops.ts`, `tactics.ts` or the seed, not this file.

## Skills

| Skill | Area | Anchored to | Practised by |
| --- | --- | --- | --- |
| Set recovery targets: RTO, RPO, MTTR `comp.respond.recovery-targets` | Incident response | CISSP.d7, SK0-005.d3, AZ-104.d5, SAA-C03.d4, NIST_800_34 | Set RPO and RTO per asset and the autoscale target |
| Run a local AI assistant offline `comp.ai.local-assistant` | Applied AI | NIST.AI-RMF.MANAGE | AI extension: read the access matrix; AI extension: explain the network; AI extension: draft a runbook step; AI extension: summarise the recovery plan; Serve a model behind an API |
| Ground an AI answer in the records `comp.ai.ground-in-records` | Applied AI | NIST.AI-RMF.MAP | AI extension: explain the network; AI extension: draft a runbook step; AI extension: summarise the recovery plan |
| Verify AI output against the evidence `comp.ai.verify-ai-output` | Applied AI | NIST.AI-RMF.MEASURE | AI extension: read the access matrix; AI extension: explain the network; AI extension: draft a runbook step; AI extension: summarise the recovery plan; Answer from the passages; Build a question set; Set the pass line |
| Write a task-specific prompt `comp.ai.prompt-for-the-task` | Applied AI | NIST.AI-RMF.MAP | AI extension: read the access matrix; Set the pass line |
| Build a retrieval-augmented pipeline `comp.ai.rag-pipeline` | Applied AI | NIST.AI-RMF.MAP | Index a document set; Answer from the passages; Build a question set |
| Load documents into a vector store `comp.ai.vector-store` | Applied AI | NIST.AI-RMF.MAP | Index a document set |
| Serve a model behind an API `comp.ai.serve-model` | Applied AI | NIST.AI-RMF.MEASURE | Serve a model behind an API; Size the memory |
| Size GPU memory for a model `comp.ai.gpu-sizing` | Applied AI | NIST.AI-RMF.MEASURE | Size the memory |
| Write an access matrix and security layers `comp.cloud.access-matrix` | Cloud services | AZ-104.d1, SAA-C03.d1, NIST.800-53.AC-6 | Write the access matrix and the security design |
| Keep secrets in a vault under managed keys `comp.cloud.secrets-in-vault` | Cloud services | AZ-104.d1, SAA-C03.d1, NIST.800-53.IA-5 | Move the key into Key Vault, protected and audited |
| Scope a workload identity to one resource `comp.cloud.managed-identity` | Cloud services | AZ-104.d1, SAA-C03.d1, NIST.800-53.AC-6 | Switch the Function to its identity and lock CORS |
| Prove an access is denied and find exposure `comp.cloud.prove-denial` | Cloud services | AZ-104.d1, SAA-C03.d1 | Prove an access is denied and find what is exposed |
| Design a two-zone fleet and cost it `comp.cloud.two-zone-design` | Cloud services | AZ-104.d3, SAA-C03.d2, WAF.reliability | Design the two-zone fleet and record the decision |
| Build a scale set across two zones `comp.cloud.scale-set` | Cloud services | AZ-104.d3, SAA-C03.d2, WAF.reliability | Build the fleet: a web subnet and a scale set across two zones |
| Put a fleet behind a load balancer `comp.cloud.load-balancer` | Cloud services | AZ-104.d4, SAA-C03.d2, WAF.reliability | Put the fleet behind a Standard Load Balancer |
| Reach private resources without the internet `comp.cloud.private-access-path` | Cloud services | AZ-104.d4, SAA-C03.d1, NIST_800_207 | Close port 22, add Bastion, and reach the vault privately |
| Choose a data store and storage tiers `comp.cloud.data-store-choice` | Cloud services | AZ-104.d2, SAA-C03.d4, WAF.cost | Choose the data store and the storage tiers |
| Create a zone-redundant relational database `comp.cloud.ha-database` | Cloud services | AZ-104.d4, SAA-C03.d2, WAF.reliability | Create a zone-redundant PostgreSQL server in its own subnet, then stop it |
| Decouple with a queue and a ledger `comp.cloud.queue-and-ledger` | Cloud services | AZ-104.d2, SAA-C03.d3, WAF.reliability | Queue the visits and write a ledger |
| Lock data down: HTTPS, encryption, no public blobs `comp.cloud.data-lockdown` | Cloud services | AZ-104.d2, SAA-C03.d1, NIST.800-53.SC-8 | Lock the data down and age it out |
| Set an autoscale target with a reason `comp.cloud.autoscale-target` | Cloud services | AZ-104.d5, SAA-C03.d4, WAF.cost | Set RPO and RTO per asset and the autoscale target |
| Autoscale on CPU and prove self-healing `comp.cloud.autoscale-and-self-heal` | Cloud services | AZ-104.d3, SAA-C03.d2, WAF.reliability | Autoscale the fleet on CPU and prove a lost instance is replaced |
| Recover a deleted file and restore a database `comp.cloud.restore-file-and-database` | Cloud services | AZ-104.d5, SAA-C03.d2, NIST.800-53.CP-4 | Recover a deleted web file and restore the database to a point in time |
| Run a timed recovery drill and tear down `comp.cloud.recovery-drill-and-teardown` | Cloud services | AZ-104.d5, SAA-C03.d2, NIST_800_34 | Run a timed recovery drill and tear the fleet down |

## Tools

| Tool | Kind | Used by |
| --- | --- | --- |
| Linux shell | cli | Move the key into Key Vault, protected and audited; Switch the Function to its identity and lock CORS; Prove an access is denied and find what is exposed; Build the fleet: a web subnet and a scale set across two zones; Put the fleet behind a Standard Load Balancer; Close port 22, add Bastion, and reach the vault privately; Choose the data store and the storage tiers; Create a zone-redundant PostgreSQL server in its own subnet, then stop it; Queue the visits and write a ledger; Lock the data down and age it out; Set RPO and RTO per asset and the autoscale target; Autoscale the fleet on CPU and prove a lost instance is replaced; Run a timed recovery drill and tear the fleet down; Size the memory; Answer from the passages; Build a question set; Set the pass line |
| curl | cli | Switch the Function to its identity and lock CORS; Recover a deleted web file and restore the database to a point in time; Run a timed recovery drill and tear the fleet down; Serve a model behind an API |
| Capstone forms | document | Write the access matrix and the security design; Move the key into Key Vault, protected and audited; Switch the Function to its identity and lock CORS; Prove an access is denied and find what is exposed; Design the two-zone fleet and record the decision; Build the fleet: a web subnet and a scale set across two zones; Put the fleet behind a Standard Load Balancer; Close port 22, add Bastion, and reach the vault privately; Choose the data store and the storage tiers; Create a zone-redundant PostgreSQL server in its own subnet, then stop it; Queue the visits and write a ledger; Lock the data down and age it out; Set RPO and RTO per asset and the autoscale target; Autoscale the fleet on CPU and prove a lost instance is replaced; Recover a deleted web file and restore the database to a point in time; Run a timed recovery drill and tear the fleet down; AI extension: read the access matrix; AI extension: explain the network; AI extension: draft a runbook step; AI extension: summarise the recovery plan; Serve a model behind an API; Size the memory; Index a document set; Answer from the passages; Build a question set; Set the pass line |
| Ollama | service | AI extension: read the access matrix; AI extension: explain the network; AI extension: draft a runbook step; AI extension: summarise the recovery plan; Serve a model behind an API; Answer from the passages |
| Chroma | service | Index a document set |
| Python | language | Build the fleet: a web subnet and a scale set across two zones; Serve a model behind an API; Size the memory; Index a document set; Answer from the passages; Build a question set; Set the pass line |
| Azure portal | portal | Write the access matrix and the security design; Move the key into Key Vault, protected and audited; Switch the Function to its identity and lock CORS; Prove an access is denied and find what is exposed; Design the two-zone fleet and record the decision; Build the fleet: a web subnet and a scale set across two zones; Put the fleet behind a Standard Load Balancer; Close port 22, add Bastion, and reach the vault privately; Choose the data store and the storage tiers; Create a zone-redundant PostgreSQL server in its own subnet, then stop it; Queue the visits and write a ledger; Lock the data down and age it out; Set RPO and RTO per asset and the autoscale target; Autoscale the fleet on CPU and prove a lost instance is replaced; Recover a deleted web file and restore the database to a point in time; Run a timed recovery drill and tear the fleet down |
| Azure Cloud Shell | portal | Write the access matrix and the security design; Move the key into Key Vault, protected and audited; Switch the Function to its identity and lock CORS; Prove an access is denied and find what is exposed; Design the two-zone fleet and record the decision; Build the fleet: a web subnet and a scale set across two zones; Put the fleet behind a Standard Load Balancer; Close port 22, add Bastion, and reach the vault privately; Choose the data store and the storage tiers; Create a zone-redundant PostgreSQL server in its own subnet, then stop it; Queue the visits and write a ledger; Lock the data down and age it out; Set RPO and RTO per asset and the autoscale target; Autoscale the fleet on CPU and prove a lost instance is replaced; Recover a deleted web file and restore the database to a point in time; Run a timed recovery drill and tear the fleet down |
| Azure CLI | cli | Write the access matrix and the security design; Move the key into Key Vault, protected and audited; Switch the Function to its identity and lock CORS; Prove an access is denied and find what is exposed; Design the two-zone fleet and record the decision; Build the fleet: a web subnet and a scale set across two zones; Put the fleet behind a Standard Load Balancer; Close port 22, add Bastion, and reach the vault privately; Choose the data store and the storage tiers; Create a zone-redundant PostgreSQL server in its own subnet, then stop it; Queue the visits and write a ledger; Lock the data down and age it out; Set RPO and RTO per asset and the autoscale target; Autoscale the fleet on CPU and prove a lost instance is replaced; Recover a deleted web file and restore the database to a point in time; Run a timed recovery drill and tear the fleet down |
| Azure Pricing Calculator | portal | Design the two-zone fleet and record the decision; Choose the data store and the storage tiers; Set RPO and RTO per asset and the autoscale target |

## Procedures

Runbooks and standard operating procedures the forms are instances of, and the tasks that execute them.

| Procedure | Kind | Standards | Forms | Executed by |
| --- | --- | --- | --- | --- |
| Operational runbook | runbook | ISO27001.A.5.37, NIST.CSF.PR.PS | Data Store & Runbook | — |
| Recovery drill | recovery | NIST.800-34, NIST.CSF.RC.RP, ISO27001.A.5.30, NIST.800-53.CP-4 | Backup & Disaster Recovery Plan | Run a timed recovery drill and tear the fleet down |
| Backup plan | recovery | ISO27001.A.8.13, NIST.800-53.CP-9, CIS.11 | Backup & Disaster Recovery Plan | Recover a deleted web file and restore the database to a point in time |
| Access review | access | ISO27001.A.5.18, NIST.800-53.AC-2, SOC2.CC6.3, NIST.CSF.PR.AA | Access Control Matrix & Secrets Register | Prove an access is denied and find what is exposed |
| Identity and access standard | access | NIST.800-63, NIST.800-53.IA-2, ISO27001.A.5.15, NIST.CSF.PR.AA | Access Control Matrix & Secrets Register | — |
| Architecture record | design | ISO42010, WAF, NIST.800-53.PL-8 | Data Store & Runbook | — |
| Network design | design | NIST.800-53.SC-7, ISO27001.A.8.22, NIST.CSF.PR.IR | Network Design Document | — |
| Portfolio record | handover | ISO42010, NIST.800-53.PL-2, ITIL.knowledge | Portfolio | — |

## Standards

| Standard | Tagged on tasks | Cited by forms |
| --- | --- | --- |
| AZ-104 | Write the access matrix and the security design; Move the key into Key Vault, protected and audited; Switch the Function to its identity and lock CORS; Prove an access is denied and find what is exposed; Design the two-zone fleet and record the decision; Build the fleet: a web subnet and a scale set across two zones; Put the fleet behind a Standard Load Balancer; Close port 22, add Bastion, and reach the vault privately; Choose the data store and the storage tiers; Create a zone-redundant PostgreSQL server in its own subnet, then stop it; Queue the visits and write a ledger; Lock the data down and age it out; Set RPO and RTO per asset and the autoscale target; Autoscale the fleet on CPU and prove a lost instance is replaced; Recover a deleted web file and restore the database to a point in time; Run a timed recovery drill and tear the fleet down | — |
| Well-Architected | Write the access matrix and the security design; Move the key into Key Vault, protected and audited; Switch the Function to its identity and lock CORS; Prove an access is denied and find what is exposed; Design the two-zone fleet and record the decision; Build the fleet: a web subnet and a scale set across two zones; Put the fleet behind a Standard Load Balancer; Close port 22, add Bastion, and reach the vault privately; Choose the data store and the storage tiers; Create a zone-redundant PostgreSQL server in its own subnet, then stop it; Queue the visits and write a ledger; Lock the data down and age it out; Set RPO and RTO per asset and the autoscale target; Autoscale the fleet on CPU and prove a lost instance is replaced; Recover a deleted web file and restore the database to a point in time; Run a timed recovery drill and tear the fleet down | Data Store & Runbook |
| NIST AI RMF | AI extension: read the access matrix; AI extension: explain the network; AI extension: draft a runbook step; AI extension: summarise the recovery plan; Serve a model behind an API; Size the memory; Index a document set; Answer from the passages; Build a question set; Set the pass line | — |
| NIST SP 800-53 | — | Access Control Matrix & Secrets Register; Network Design Document; Data Store & Runbook; Backup & Disaster Recovery Plan; Portfolio |
| NIST SP 800-34 | — | Backup & Disaster Recovery Plan |
| ISO/IEC/IEEE 42010 | — | Portfolio |

| Control cited | Standard | By |
| --- | --- | --- |
| NIST.800-53.AC-6 Least Privilege | NIST_800_53 | Access Control Matrix & Secrets Register |
| NIST.800-53.CP-2 Contingency Plan | NIST_800_53 | Backup & Disaster Recovery Plan |
| NIST.800-53.CP-9 System Backup | NIST_800_53 | Data Store & Runbook |
| NIST.800-53.PL-2 System Security and Privacy Plans | NIST_800_53 | Portfolio |
| NIST.800-53.SC-7 Boundary Protection | NIST_800_53 | Network Design Document |
| NIST.800-34 Contingency Planning Guide | NIST_800_34 | Backup & Disaster Recovery Plan |
| WAF.reliability Reliability pillar | WAF | Data Store & Runbook |
| WAF.cost Cost optimisation pillar | WAF | Data Store & Runbook |
| ISO42010 Architecture description | ISO_42010 | Portfolio |

Forms whose standard names a practice rather than a control:

- Network Design Document: practice.addressing-plan, practice.segmentation

## Tactics and practices

Adversary tactics are not part of this course.

| Practice | Anchor | Asked for by |
| --- | --- | --- |
| Least privilege | NIST.800-53.AC-6 | Write the access matrix and the security design; Switch the Function to its identity and lock CORS; Prove an access is denied and find what is exposed; Serve a model behind an API |
| Defence in depth | NIST.CSF.PR | Write the access matrix and the security design |
| Default deny | NIST.800-53.SC-7 | Switch the Function to its identity and lock CORS; Close port 22, add Bastion, and reach the vault privately; Lock the data down and age it out |
| Network segmentation | ISO27001.A.8.22 | Close port 22, add Bastion, and reach the vault privately |
| Zero trust access | NIST_800_207 | Close port 22, add Bastion, and reach the vault privately |
| Secrets in a store | NIST.800-53.IA-5 | Move the key into Key Vault, protected and audited |
| Key rotation | NIST.800-53.SC-12 | Move the key into Key Vault, protected and audited |
| Rebuild, do not repair | WAF.reliability | Autoscale the fleet on CPU and prove a lost instance is replaced |
| Tear down after use | WAF.cost | Create a zone-redundant PostgreSQL server in its own subnet, then stop it; Run a timed recovery drill and tear the fleet down |
| Right-sizing | WAF.cost | Design the two-zone fleet and record the decision; Choose the data store and the storage tiers; Set RPO and RTO per asset and the autoscale target; Size the memory |
| Multi-zone redundancy | WAF.reliability | Design the two-zone fleet and record the decision; Build the fleet: a web subnet and a scale set across two zones; Put the fleet behind a Standard Load Balancer; Create a zone-redundant PostgreSQL server in its own subnet, then stop it |
| Health checks | WAF.reliability | Build the fleet: a web subnet and a scale set across two zones; Put the fleet behind a Standard Load Balancer; Autoscale the fleet on CPU and prove a lost instance is replaced |
| Backups tested by restore | NIST.800-53.CP-4 | Recover a deleted web file and restore the database to a point in time; Run a timed recovery drill and tear the fleet down |
| Recovery objectives | NIST_800_34 | Set RPO and RTO per asset and the autoscale target; Run a timed recovery drill and tear the fleet down |
| Architecture decision records | ISO_42010 | Design the two-zone fleet and record the decision; Choose the data store and the storage tiers |
| Redact before write | NIST_AI_RMF | Index a document set |
| Human checkpoint | NIST_AI_RMF | AI extension: read the access matrix; AI extension: explain the network; AI extension: draft a runbook step; AI extension: summarise the recovery plan; Answer from the passages |
| Suites with a pass line | NIST_AI_RMF | Build a question set; Set the pass line |
| Encryption at rest | ISO27001.A.8.24 | Create a zone-redundant PostgreSQL server in its own subnet, then stop it; Lock the data down and age it out |
| Decouple with queues | WAF.reliability | Queue the visits and write a ledger |

## KPI board

The sixteen numbers the Skill board keeps per member of this course, the catalogue row and kind of fact each one reads, and what it is counted over here, role by role.

| KPI | Family | Reads | Denominator in this course |
| --- | --- | --- | --- |
| Skills verified `kpi.technical.skills-verified` | technical | metric.skill-verified (own) | arch: 13 skills with a verifiable step; infra: 12 skills with a verifiable step; dev: 12 skills with a verifiable step; secops: 12 skills with a verifiable step |
| Exam weight verified `kpi.technical.exam-weight-verified` | technical | metric.domain-weight-verified (own) | arch: 77 percent of the exam over 4 domains; infra: 64 percent of the exam over 3 domains; dev: 72 percent of the exam over 4 domains; secops: 72 percent of the exam over 4 domains |
| Commands verified `kpi.technical.commands-verified` | technical | metric.tool-commands-verified (own) | arch: 15 verifiable steps that run a command; infra: 25 verifiable steps that run a command; dev: 26 verifiable steps that run a command; secops: 23 verifiable steps that run a command |
| Procedures to standard `kpi.technical.procedures-to-standard` | technical | metric.procedure-to-standard (team) | arch: 8 procedures; infra: 8 procedures; dev: 8 procedures; secops: 8 procedures |
| Faults resolved `kpi.problem-solving.faults-resolved` | problem-solving | metric.trouble-resolved (team) | arch: 2 fault, incident or triage tables; infra: 2 fault, incident or triage tables; dev: 2 fault, incident or triage tables; secops: 2 fault, incident or triage tables |
| Verified after retry `kpi.problem-solving.persistence` | problem-solving | metric.ability-persistence (own) | arch: 15 verifiable steps; infra: 25 verifiable steps; dev: 26 verifiable steps; secops: 23 verifiable steps |
| Stuck flags cleared `kpi.problem-solving.flags-cleared` | problem-solving | metric.ability-flags-cleared (own) | the stuck flags the member raises; no content denominator |
| Time to resolution `kpi.problem-solving.time-to-resolution` | problem-solving | metric.time-to-verify (own) | arch: 15 verifiable steps that can carry two stamps; infra: 25 verifiable steps that can carry two stamps; dev: 26 verifiable steps that can carry two stamps; secops: 23 verifiable steps that can carry two stamps |
| Steps verified in order `kpi.execution.steps-in-order` | execution | metric.procedure-in-order (own) | arch: 1 task with two or more verifiable steps; infra: 4 tasks with two or more verifiable steps; dev: 4 tasks with two or more verifiable steps; secops: 4 tasks with two or more verifiable steps |
| First-try verifications `kpi.execution.first-try` | execution | metric.ability-first-try (own) | arch: 15 verifiable steps; infra: 25 verifiable steps; dev: 26 verifiable steps; secops: 23 verifiable steps |
| Files named to convention `kpi.execution.evidence-named` | execution | metric.evidence-naming (own) | the files the member hashes; no content denominator |
| Definition-of-Done met `kpi.execution.dod-met` | execution | metric.doc-dod-met (team) | arch: 34 checks on 5 forms; infra: 34 checks on 5 forms; dev: 34 checks on 5 forms; secops: 34 checks on 5 forms |
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
| Controls cited `kpi.professionalism.controls-cited` | professionalism | metric.standard-controls-cited (team) | arch: 4 control codes on 2 forms; infra: 1 control code on 1 form; dev: 3 control codes on 1 form; secops: 1 control code on 1 form |
| Instructor approved `kpi.professionalism.instructor-approved` | professionalism | metric.doc-instructor-approved (team) | arch: 5 forms; infra: 5 forms; dev: 5 forms; secops: 5 forms |
| Skills proved twice `kpi.growth.skills-transferred` | growth | metric.skill-transfer (own) | arch: 6 skills on two or more tasks; infra: 6 skills on two or more tasks; dev: 6 skills on two or more tasks; secops: 6 skills on two or more tasks |
| Skills retained `kpi.growth.retention` | growth | metric.ability-recall (own) | arch: 13 skills with a verifiable step; infra: 12 skills with a verifiable step; dev: 12 skills with a verifiable step; secops: 12 skills with a verifiable step |
| Learning velocity `kpi.growth.learning-velocity` | growth | metric.time-learning-velocity (own) | the verification stamps of the last two months; no content denominator |
| Profile coverage `kpi.growth.profile-coverage` | growth | metric.profile-coverage (own) | arch: Security Architect: 69 required, 65 not taught here; infra: System Administrator: 117 required, 113 not taught here; dev: Software Developer: 84 required, 80 not taught here; secops: Cyber Defense Analyst: 78 required, 74 not taught here |
| Values recalled `kpi.validation.recall-accuracy` | validation | metric.validation-recall (own) |  |
| Scenarios applied `kpi.validation.applied-scenarios` | validation | metric.validation-applied (own) |  |
| Conflicts resolved `kpi.validation.conflicts-resolved` | validation | metric.conflicts-resolved (own) |  |
| Minutes on task `kpi.validation.time-on-task` | validation | metric.minutes-on-task (own) |  |

