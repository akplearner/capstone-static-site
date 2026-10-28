# AWS Solutions Architect Capstone — skills sheet

16 graded tasks · 17 skills · 7 tools · 7 procedures · 4 standards (7 controls cited) · 0 tactics · 17 practices

Generated from the registries and the course document by `npm run content:export`; edit `src/lib/docs/skills.ts`, `tools.ts`, `standards.ts`, `sops.ts`, `tactics.ts` or the seed, not this file.

## Skills

| Skill | Area | Anchored to | Practised by |
| --- | --- | --- | --- |
| Set recovery targets: RTO, RPO, MTTR `comp.respond.recovery-targets` | Incident response | CISSP.d7, SK0-005.d3, AZ-104.d5, SAA-C03.d4, NIST_800_34 | Set RPO and RTO per asset and the scaling policy |
| Write an access matrix and security layers `comp.cloud.access-matrix` | Cloud services | AZ-104.d1, SAA-C03.d1, NIST.800-53.AC-6 | Write the access matrix and the security design |
| Keep secrets in a vault under managed keys `comp.cloud.secrets-in-vault` | Cloud services | AZ-104.d1, SAA-C03.d1, NIST.800-53.IA-5 | Put the table name in Parameter Store and a secret under a customer key |
| Scope a workload identity to one resource `comp.cloud.managed-identity` | Cloud services | AZ-104.d1, SAA-C03.d1, NIST.800-53.AC-6 | Scope the Lambda role to the table and lock CORS |
| Prove an access is denied and find exposure `comp.cloud.prove-denial` | Cloud services | AZ-104.d1, SAA-C03.d1 | Prove an access is denied and find what is exposed |
| Design a two-zone fleet and cost it `comp.cloud.two-zone-design` | Cloud services | AZ-104.d3, SAA-C03.d2, WAF.reliability | Design the two-zone fleet and record the decision |
| Build a scale set across two zones `comp.cloud.scale-set` | Cloud services | AZ-104.d3, SAA-C03.d2, WAF.reliability | Build the fleet: a launch template and an Auto Scaling group across two zones |
| Put a fleet behind a load balancer `comp.cloud.load-balancer` | Cloud services | AZ-104.d4, SAA-C03.d2, WAF.reliability | Put the fleet behind an Application Load Balancer |
| Reach private resources without the internet `comp.cloud.private-access-path` | Cloud services | AZ-104.d4, SAA-C03.d1, NIST_800_207 | Give the private subnet a path without the internet |
| Choose a data store and storage tiers `comp.cloud.data-store-choice` | Cloud services | AZ-104.d2, SAA-C03.d4, WAF.cost | Choose the data store and the storage classes |
| Create a zone-redundant relational database `comp.cloud.ha-database` | Cloud services | AZ-104.d4, SAA-C03.d2, WAF.reliability | Create a Multi-AZ PostgreSQL database and keep its snapshot |
| Decouple with a queue and a ledger `comp.cloud.queue-and-ledger` | Cloud services | AZ-104.d2, SAA-C03.d3, WAF.reliability | Queue the visits and write a ledger |
| Lock data down: HTTPS, encryption, no public blobs `comp.cloud.data-lockdown` | Cloud services | AZ-104.d2, SAA-C03.d1, NIST.800-53.SC-8 | Lock the data down and age it out |
| Set an autoscale target with a reason `comp.cloud.autoscale-target` | Cloud services | AZ-104.d5, SAA-C03.d4, WAF.cost | Set RPO and RTO per asset and the scaling policy |
| Autoscale on CPU and prove self-healing `comp.cloud.autoscale-and-self-heal` | Cloud services | AZ-104.d3, SAA-C03.d2, WAF.reliability | Scale the fleet on CPU and prove a lost instance is replaced |
| Recover a deleted file and restore a database `comp.cloud.restore-file-and-database` | Cloud services | AZ-104.d5, SAA-C03.d2, NIST.800-53.CP-4 | Recover a deleted web file and the database from its snapshot |
| Run a timed recovery drill and tear down `comp.cloud.recovery-drill-and-teardown` | Cloud services | AZ-104.d5, SAA-C03.d2, NIST_800_34 | Run a timed recovery drill and tear the fleet down |

## Tools

| Tool | Kind | Used by |
| --- | --- | --- |
| Linux shell | cli | Put the table name in Parameter Store and a secret under a customer key; Scope the Lambda role to the table and lock CORS; Prove an access is denied and find what is exposed; Build the fleet: a launch template and an Auto Scaling group across two zones; Put the fleet behind an Application Load Balancer; Give the private subnet a path without the internet; Queue the visits and write a ledger; Scale the fleet on CPU and prove a lost instance is replaced; Run a timed recovery drill and tear the fleet down |
| curl | cli | Scope the Lambda role to the table and lock CORS; Recover a deleted web file and the database from its snapshot; Run a timed recovery drill and tear the fleet down |
| Capstone forms | document | Write the access matrix and the security design; Put the table name in Parameter Store and a secret under a customer key; Scope the Lambda role to the table and lock CORS; Prove an access is denied and find what is exposed; Design the two-zone fleet and record the decision; Build the fleet: a launch template and an Auto Scaling group across two zones; Put the fleet behind an Application Load Balancer; Give the private subnet a path without the internet; Choose the data store and the storage classes; Create a Multi-AZ PostgreSQL database and keep its snapshot; Queue the visits and write a ledger; Lock the data down and age it out; Set RPO and RTO per asset and the scaling policy; Scale the fleet on CPU and prove a lost instance is replaced; Recover a deleted web file and the database from its snapshot; Run a timed recovery drill and tear the fleet down |
| AWS console | portal | Write the access matrix and the security design; Put the table name in Parameter Store and a secret under a customer key; Scope the Lambda role to the table and lock CORS; Prove an access is denied and find what is exposed; Design the two-zone fleet and record the decision; Build the fleet: a launch template and an Auto Scaling group across two zones; Put the fleet behind an Application Load Balancer; Give the private subnet a path without the internet; Choose the data store and the storage classes; Create a Multi-AZ PostgreSQL database and keep its snapshot; Queue the visits and write a ledger; Lock the data down and age it out; Set RPO and RTO per asset and the scaling policy; Scale the fleet on CPU and prove a lost instance is replaced; Recover a deleted web file and the database from its snapshot; Run a timed recovery drill and tear the fleet down |
| AWS CloudShell | portal | Write the access matrix and the security design; Put the table name in Parameter Store and a secret under a customer key; Scope the Lambda role to the table and lock CORS; Prove an access is denied and find what is exposed; Design the two-zone fleet and record the decision; Build the fleet: a launch template and an Auto Scaling group across two zones; Put the fleet behind an Application Load Balancer; Give the private subnet a path without the internet; Choose the data store and the storage classes; Create a Multi-AZ PostgreSQL database and keep its snapshot; Queue the visits and write a ledger; Lock the data down and age it out; Set RPO and RTO per asset and the scaling policy; Scale the fleet on CPU and prove a lost instance is replaced; Recover a deleted web file and the database from its snapshot; Run a timed recovery drill and tear the fleet down |
| AWS CLI | cli | Write the access matrix and the security design; Put the table name in Parameter Store and a secret under a customer key; Scope the Lambda role to the table and lock CORS; Prove an access is denied and find what is exposed; Design the two-zone fleet and record the decision; Build the fleet: a launch template and an Auto Scaling group across two zones; Put the fleet behind an Application Load Balancer; Give the private subnet a path without the internet; Choose the data store and the storage classes; Create a Multi-AZ PostgreSQL database and keep its snapshot; Queue the visits and write a ledger; Lock the data down and age it out; Set RPO and RTO per asset and the scaling policy; Scale the fleet on CPU and prove a lost instance is replaced; Recover a deleted web file and the database from its snapshot; Run a timed recovery drill and tear the fleet down |
| AWS Pricing Calculator | portal | Design the two-zone fleet and record the decision; Choose the data store and the storage classes; Set RPO and RTO per asset and the scaling policy |

## Procedures

Runbooks and standard operating procedures the forms are instances of, and the tasks that execute them.

| Procedure | Kind | Standards | Forms | Executed by |
| --- | --- | --- | --- | --- |
| Operational runbook | runbook | ISO27001.A.5.37, NIST.CSF.PR.PS | Data Store & Runbook | — |
| Recovery drill | recovery | NIST.800-34, NIST.CSF.RC.RP, ISO27001.A.5.30, NIST.800-53.CP-4 | Backup & Disaster Recovery Plan | Run a timed recovery drill and tear the fleet down |
| Backup plan | recovery | ISO27001.A.8.13, NIST.800-53.CP-9, CIS.11 | Backup & Disaster Recovery Plan | Recover a deleted web file and the database from its snapshot |
| Access review | access | ISO27001.A.5.18, NIST.800-53.AC-2, SOC2.CC6.3, NIST.CSF.PR.AA | Access Control Matrix & Secrets Register | Prove an access is denied and find what is exposed |
| Identity and access standard | access | NIST.800-63, NIST.800-53.IA-2, ISO27001.A.5.15, NIST.CSF.PR.AA | Access Control Matrix & Secrets Register | — |
| Architecture record | design | ISO42010, WAF, NIST.800-53.PL-8 | Data Store & Runbook | — |
| Network design | design | NIST.800-53.SC-7, ISO27001.A.8.22, NIST.CSF.PR.IR | Network Design Document | — |

## Standards

| Standard | Tagged on tasks | Cited by forms |
| --- | --- | --- |
| AWS SAA-C03 | Write the access matrix and the security design; Put the table name in Parameter Store and a secret under a customer key; Scope the Lambda role to the table and lock CORS; Prove an access is denied and find what is exposed; Design the two-zone fleet and record the decision; Build the fleet: a launch template and an Auto Scaling group across two zones; Put the fleet behind an Application Load Balancer; Give the private subnet a path without the internet; Choose the data store and the storage classes; Create a Multi-AZ PostgreSQL database and keep its snapshot; Queue the visits and write a ledger; Lock the data down and age it out; Set RPO and RTO per asset and the scaling policy; Scale the fleet on CPU and prove a lost instance is replaced; Recover a deleted web file and the database from its snapshot; Run a timed recovery drill and tear the fleet down | — |
| Well-Architected | Write the access matrix and the security design; Put the table name in Parameter Store and a secret under a customer key; Scope the Lambda role to the table and lock CORS; Prove an access is denied and find what is exposed; Design the two-zone fleet and record the decision; Build the fleet: a launch template and an Auto Scaling group across two zones; Put the fleet behind an Application Load Balancer; Give the private subnet a path without the internet; Choose the data store and the storage classes; Create a Multi-AZ PostgreSQL database and keep its snapshot; Queue the visits and write a ledger; Lock the data down and age it out; Set RPO and RTO per asset and the scaling policy; Scale the fleet on CPU and prove a lost instance is replaced; Recover a deleted web file and the database from its snapshot; Run a timed recovery drill and tear the fleet down | Data Store & Runbook |
| NIST SP 800-53 | — | Access Control Matrix & Secrets Register; Network Design Document; Data Store & Runbook; Backup & Disaster Recovery Plan |
| NIST SP 800-34 | — | Backup & Disaster Recovery Plan |

| Control cited | Standard | By |
| --- | --- | --- |
| NIST.800-53.AC-6 Least Privilege | NIST_800_53 | Access Control Matrix & Secrets Register |
| NIST.800-53.CP-2 Contingency Plan | NIST_800_53 | Backup & Disaster Recovery Plan |
| NIST.800-53.CP-9 System Backup | NIST_800_53 | Data Store & Runbook |
| NIST.800-53.SC-7 Boundary Protection | NIST_800_53 | Network Design Document |
| NIST.800-34 Contingency Planning Guide | NIST_800_34 | Backup & Disaster Recovery Plan |
| WAF.reliability Reliability pillar | WAF | Data Store & Runbook |
| WAF.cost Cost optimisation pillar | WAF | Data Store & Runbook |

Forms whose standard names a practice rather than a control:

- Network Design Document: practice.addressing-plan, practice.segmentation

## Tactics and practices

Adversary tactics are not part of this course.

| Practice | Anchor | Asked for by |
| --- | --- | --- |
| Least privilege | NIST.800-53.AC-6 | Write the access matrix and the security design; Scope the Lambda role to the table and lock CORS; Prove an access is denied and find what is exposed |
| Defence in depth | NIST.CSF.PR | Write the access matrix and the security design |
| Default deny | NIST.800-53.SC-7 | Scope the Lambda role to the table and lock CORS; Give the private subnet a path without the internet; Lock the data down and age it out |
| Network segmentation | ISO27001.A.8.22 | Give the private subnet a path without the internet |
| Zero trust access | NIST_800_207 | Give the private subnet a path without the internet |
| Secrets in a store | NIST.800-53.IA-5 | Put the table name in Parameter Store and a secret under a customer key |
| Key rotation | NIST.800-53.SC-12 | Put the table name in Parameter Store and a secret under a customer key |
| Rebuild, do not repair | WAF.reliability | Scale the fleet on CPU and prove a lost instance is replaced |
| Tear down after use | WAF.cost | Create a Multi-AZ PostgreSQL database and keep its snapshot; Run a timed recovery drill and tear the fleet down |
| Right-sizing | WAF.cost | Design the two-zone fleet and record the decision; Choose the data store and the storage classes; Set RPO and RTO per asset and the scaling policy |
| Multi-zone redundancy | WAF.reliability | Design the two-zone fleet and record the decision; Build the fleet: a launch template and an Auto Scaling group across two zones; Put the fleet behind an Application Load Balancer; Create a Multi-AZ PostgreSQL database and keep its snapshot |
| Health checks | WAF.reliability | Build the fleet: a launch template and an Auto Scaling group across two zones; Put the fleet behind an Application Load Balancer; Scale the fleet on CPU and prove a lost instance is replaced |
| Backups tested by restore | NIST.800-53.CP-4 | Recover a deleted web file and the database from its snapshot; Run a timed recovery drill and tear the fleet down |
| Recovery objectives | NIST_800_34 | Set RPO and RTO per asset and the scaling policy; Run a timed recovery drill and tear the fleet down |
| Architecture decision records | ISO_42010 | Design the two-zone fleet and record the decision; Choose the data store and the storage classes |
| Encryption at rest | ISO27001.A.8.24 | Create a Multi-AZ PostgreSQL database and keep its snapshot; Lock the data down and age it out |
| Decouple with queues | WAF.reliability | Queue the visits and write a ledger |

## KPI board

The sixteen numbers the Skill board keeps per member of this course, the catalogue row and kind of fact each one reads, and what it is counted over here, role by role.

| KPI | Family | Reads | Denominator in this course |
| --- | --- | --- | --- |
| Skills verified `kpi.technical.skills-verified` | technical | metric.skill-verified (own) | arch: 5 skills with a verifiable step; infra: 4 skills with a verifiable step; dev: 4 skills with a verifiable step; secops: 4 skills with a verifiable step |
| Exam weight verified `kpi.technical.exam-weight-verified` | technical | metric.domain-weight-verified (own) | arch: 76 percent of the exam over 3 domains; infra: 56 percent of the exam over 2 domains; dev: 80 percent of the exam over 3 domains; secops: 56 percent of the exam over 2 domains |
| Commands verified `kpi.technical.commands-verified` | technical | metric.tool-commands-verified (own) | arch: 5 verifiable steps that run a command; infra: 15 verifiable steps that run a command; dev: 16 verifiable steps that run a command; secops: 12 verifiable steps that run a command |
| Procedures to standard `kpi.technical.procedures-to-standard` | technical | metric.procedure-to-standard (team) | arch: 7 procedures; infra: 7 procedures; dev: 7 procedures; secops: 7 procedures |
| Faults resolved `kpi.problem-solving.faults-resolved` | problem-solving | metric.trouble-resolved (team) | arch: 2 fault, incident or triage tables; infra: 2 fault, incident or triage tables; dev: 2 fault, incident or triage tables; secops: 2 fault, incident or triage tables |
| Verified after retry `kpi.problem-solving.persistence` | problem-solving | metric.ability-persistence (own) | arch: 5 verifiable steps; infra: 15 verifiable steps; dev: 16 verifiable steps; secops: 12 verifiable steps |
| Stuck flags cleared `kpi.problem-solving.flags-cleared` | problem-solving | metric.ability-flags-cleared (own) | the stuck flags the member raises; no content denominator |
| Time to resolution `kpi.problem-solving.time-to-resolution` | problem-solving | metric.time-to-verify (own) | arch: 5 verifiable steps that can carry two stamps; infra: 15 verifiable steps that can carry two stamps; dev: 16 verifiable steps that can carry two stamps; secops: 12 verifiable steps that can carry two stamps |
| Steps verified in order `kpi.execution.steps-in-order` | execution | metric.procedure-in-order (own) | arch: 1 task with two or more verifiable steps; infra: 4 tasks with two or more verifiable steps; dev: 4 tasks with two or more verifiable steps; secops: 4 tasks with two or more verifiable steps |
| First-try verifications `kpi.execution.first-try` | execution | metric.ability-first-try (own) | arch: 5 verifiable steps; infra: 15 verifiable steps; dev: 16 verifiable steps; secops: 12 verifiable steps |
| Files named to convention `kpi.execution.evidence-named` | execution | metric.evidence-naming (own) | the files the member hashes; no content denominator |
| Definition-of-Done met `kpi.execution.dod-met` | execution | metric.doc-dod-met (team) | arch: 29 checks on 4 forms; infra: 29 checks on 4 forms; dev: 29 checks on 4 forms; secops: 29 checks on 4 forms |
| Decisions recorded `kpi.decision-making.decisions-recorded` | decision-making | metric.decision-recorded (team) | arch: 1 decision block; infra: 1 decision block; dev: 1 decision block; secops: 1 decision block |
| Decisions justified `kpi.decision-making.decisions-justified` | decision-making | metric.decision-justified (team) | arch: 1 decision block; infra: 1 decision block; dev: 1 decision block; secops: 1 decision block |
| Decisions approved `kpi.decision-making.decisions-approved` | decision-making | metric.decision-approved (team) | arch: 1 decision block; infra: 1 decision block; dev: 1 decision block; secops: 1 decision block |
| Changes with rollback `kpi.decision-making.change-rollback` | decision-making | metric.procedure-change-recorded (team) | arch: 1 change table with a rollback column; infra: 1 change table with a rollback column; dev: 1 change table with a rollback column; secops: 1 change table with a rollback column |
| Hand-offs completed `kpi.teamwork.handoffs` | teamwork | metric.collab-handoffs (team) | arch: 4 hand-offs; infra: 4 hand-offs; dev: 4 hand-offs; secops: 4 hand-offs |
| RACI respected `kpi.teamwork.raci-respected` | teamwork | metric.collab-raci-respected (team) | arch: 4 forms with a RACI; infra: 4 forms with a RACI; dev: 4 forms with a RACI; secops: 4 forms with a RACI |
| Peer reviews given `kpi.teamwork.peer-reviews-given` | teamwork | metric.collab-peer-reviews-given (own) | the reviews assigned to the member; no content denominator |
| Teammate steps ticked `kpi.teamwork.teammate-steps` | teamwork | metric.collab-teammate-steps (own) | a count; no denominator |
| On time `kpi.professionalism.on-time` | professionalism | metric.ability-deadline-adherence (own) | arch: 4 tasks of the role; infra: 4 tasks of the role; dev: 4 tasks of the role; secops: 4 tasks of the role |
| Document control complete `kpi.professionalism.document-control` | professionalism | metric.doc-control-complete (team) | arch: 4 forms; infra: 4 forms; dev: 4 forms; secops: 4 forms |
| Controls cited `kpi.professionalism.controls-cited` | professionalism | metric.standard-controls-cited (team) | arch: 2 control codes on 1 form; infra: 1 control code on 1 form; dev: 3 control codes on 1 form; secops: 1 control code on 1 form |
| Instructor approved `kpi.professionalism.instructor-approved` | professionalism | metric.doc-instructor-approved (team) | arch: 4 forms; infra: 4 forms; dev: 4 forms; secops: 4 forms |
| Skills proved twice `kpi.growth.skills-transferred` | growth | metric.skill-transfer (own) | arch: 0 skills on two or more tasks; infra: 0 skills on two or more tasks; dev: 0 skills on two or more tasks; secops: 0 skills on two or more tasks |
| Skills retained `kpi.growth.retention` | growth | metric.ability-recall (own) | arch: 5 skills with a verifiable step; infra: 4 skills with a verifiable step; dev: 4 skills with a verifiable step; secops: 4 skills with a verifiable step |
| Learning velocity `kpi.growth.learning-velocity` | growth | metric.time-learning-velocity (own) | the verification stamps of the last two months; no content denominator |
| Profile coverage `kpi.growth.profile-coverage` | growth | metric.profile-coverage (own) | arch: Security Architect: 69 required, 65 not taught here; infra: System Administrator: 117 required, 113 not taught here; dev: Software Developer: 84 required, 80 not taught here; secops: Cyber Defense Analyst: 78 required, 74 not taught here |

