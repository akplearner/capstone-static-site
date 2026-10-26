# Azure Administrator Capstone — skills sheet

16 graded tasks · 17 skills · 8 tools · 7 procedures · 4 standards (4 controls cited) · 0 tactics · 17 practices

Generated from the registries and the course document by `npm run content:export`; edit `src/lib/docs/skills.ts`, `tools.ts`, `standards.ts`, `sops.ts`, `tactics.ts` or the seed, not this file.

## Skills

| Skill | Area | Anchored to | Practised by |
| --- | --- | --- | --- |
| Set recovery targets: RTO, RPO, MTTR `comp.respond.recovery-targets` | Incident response | CISSP.d7, SK0-005.d3, AZ-104.d5, SAA-C03.d4, NIST_800_34 | Set RPO and RTO per asset and the autoscale target |
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
| Linux shell | cli | Move the key into Key Vault, protected and audited; Switch the Function to its identity and lock CORS; Prove an access is denied and find what is exposed; Build the fleet: a web subnet and a scale set across two zones; Put the fleet behind a Standard Load Balancer; Close port 22, add Bastion, and reach the vault privately; Choose the data store and the storage tiers; Create a zone-redundant PostgreSQL server in its own subnet, then stop it; Queue the visits and write a ledger; Lock the data down and age it out; Set RPO and RTO per asset and the autoscale target; Autoscale the fleet on CPU and prove a lost instance is replaced; Run a timed recovery drill and tear the fleet down |
| curl | cli | Switch the Function to its identity and lock CORS; Recover a deleted web file and restore the database to a point in time; Run a timed recovery drill and tear the fleet down |
| Capstone forms | document | Write the access matrix and the security design; Move the key into Key Vault, protected and audited; Switch the Function to its identity and lock CORS; Prove an access is denied and find what is exposed; Design the two-zone fleet and record the decision; Build the fleet: a web subnet and a scale set across two zones; Put the fleet behind a Standard Load Balancer; Close port 22, add Bastion, and reach the vault privately; Choose the data store and the storage tiers; Create a zone-redundant PostgreSQL server in its own subnet, then stop it; Queue the visits and write a ledger; Lock the data down and age it out; Set RPO and RTO per asset and the autoscale target; Autoscale the fleet on CPU and prove a lost instance is replaced; Recover a deleted web file and restore the database to a point in time; Run a timed recovery drill and tear the fleet down |
| Python | language | Build the fleet: a web subnet and a scale set across two zones |
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

## Standards

| Standard | Tagged on tasks | Cited by forms |
| --- | --- | --- |
| AZ-104 | Write the access matrix and the security design; Move the key into Key Vault, protected and audited; Switch the Function to its identity and lock CORS; Prove an access is denied and find what is exposed; Design the two-zone fleet and record the decision; Build the fleet: a web subnet and a scale set across two zones; Put the fleet behind a Standard Load Balancer; Close port 22, add Bastion, and reach the vault privately; Choose the data store and the storage tiers; Create a zone-redundant PostgreSQL server in its own subnet, then stop it; Queue the visits and write a ledger; Lock the data down and age it out; Set RPO and RTO per asset and the autoscale target; Autoscale the fleet on CPU and prove a lost instance is replaced; Recover a deleted web file and restore the database to a point in time; Run a timed recovery drill and tear the fleet down | — |
| Well-Architected | Write the access matrix and the security design; Move the key into Key Vault, protected and audited; Switch the Function to its identity and lock CORS; Prove an access is denied and find what is exposed; Design the two-zone fleet and record the decision; Build the fleet: a web subnet and a scale set across two zones; Put the fleet behind a Standard Load Balancer; Close port 22, add Bastion, and reach the vault privately; Choose the data store and the storage tiers; Create a zone-redundant PostgreSQL server in its own subnet, then stop it; Queue the visits and write a ledger; Lock the data down and age it out; Set RPO and RTO per asset and the autoscale target; Autoscale the fleet on CPU and prove a lost instance is replaced; Recover a deleted web file and restore the database to a point in time; Run a timed recovery drill and tear the fleet down | Data Store & Runbook |
| NIST SP 800-53 | — | Access Control Matrix & Secrets Register |
| NIST SP 800-34 | — | Backup & Disaster Recovery Plan |

| Control cited | Standard | By |
| --- | --- | --- |
| NIST.800-53.AC-6 Least Privilege | NIST_800_53 | Access Control Matrix & Secrets Register |
| NIST.800-34 Contingency Planning Guide | NIST_800_34 | Backup & Disaster Recovery Plan |
| WAF.reliability Reliability pillar | WAF | Data Store & Runbook |
| WAF.cost Cost optimisation pillar | WAF | Data Store & Runbook |

Forms whose standard names a practice rather than a control:

- Network Design Document: practice.addressing-plan, practice.segmentation

## Tactics and practices

Adversary tactics are not part of this course.

| Practice | Anchor | Asked for by |
| --- | --- | --- |
| Least privilege | NIST.800-53.AC-6 | Write the access matrix and the security design; Switch the Function to its identity and lock CORS; Prove an access is denied and find what is exposed |
| Defence in depth | NIST.CSF.PR | Write the access matrix and the security design |
| Default deny | NIST.800-53.SC-7 | Switch the Function to its identity and lock CORS; Close port 22, add Bastion, and reach the vault privately; Lock the data down and age it out |
| Network segmentation | ISO27001.A.8.22 | Close port 22, add Bastion, and reach the vault privately |
| Zero trust access | NIST_800_207 | Close port 22, add Bastion, and reach the vault privately |
| Secrets in a store | NIST.800-53.IA-5 | Move the key into Key Vault, protected and audited |
| Key rotation | NIST.800-53.SC-12 | Move the key into Key Vault, protected and audited |
| Rebuild, do not repair | WAF.reliability | Autoscale the fleet on CPU and prove a lost instance is replaced |
| Tear down after use | WAF.cost | Create a zone-redundant PostgreSQL server in its own subnet, then stop it; Run a timed recovery drill and tear the fleet down |
| Right-sizing | WAF.cost | Design the two-zone fleet and record the decision; Choose the data store and the storage tiers; Set RPO and RTO per asset and the autoscale target |
| Multi-zone redundancy | WAF.reliability | Design the two-zone fleet and record the decision; Build the fleet: a web subnet and a scale set across two zones; Put the fleet behind a Standard Load Balancer; Create a zone-redundant PostgreSQL server in its own subnet, then stop it |
| Health checks | WAF.reliability | Build the fleet: a web subnet and a scale set across two zones; Put the fleet behind a Standard Load Balancer; Autoscale the fleet on CPU and prove a lost instance is replaced |
| Backups tested by restore | NIST.800-53.CP-4 | Recover a deleted web file and restore the database to a point in time; Run a timed recovery drill and tear the fleet down |
| Recovery objectives | NIST_800_34 | Set RPO and RTO per asset and the autoscale target; Run a timed recovery drill and tear the fleet down |
| Architecture decision records | ISO_42010 | Design the two-zone fleet and record the decision; Choose the data store and the storage tiers |
| Encryption at rest | ISO27001.A.8.24 | Create a zone-redundant PostgreSQL server in its own subnet, then stop it; Lock the data down and age it out |
| Decouple with queues | WAF.reliability | Queue the visits and write a ledger |

## KPI board

The sixteen numbers the Skill board keeps per member of this course, the catalogue row and kind of fact each one reads, and what it is counted over here, role by role.

| KPI | Family | Reads | Denominator in this course |
| --- | --- | --- | --- |
| Skills verified `kpi.ability.skills-verified` | ability | metric.skill-verified (own) | arch: 5 skills with a verifiable step; infra: 4 skills with a verifiable step; dev: 4 skills with a verifiable step; secops: 4 skills with a verifiable step |
| Exam weight verified `kpi.ability.exam-weight-verified` | ability | metric.domain-weight-verified (own) | arch: 77 percent of the exam over 4 domains; infra: 64 percent of the exam over 3 domains; dev: 72 percent of the exam over 4 domains; secops: 72 percent of the exam over 4 domains |
| Profile coverage `kpi.ability.profile-coverage` | ability | metric.profile-coverage (own) | arch: Security Architect: 69 required, 65 not taught here; infra: System Administrator: 65 required, 65 not taught here; dev: Software Developer: 81 required, 77 not taught here; secops: Cyber Defense Analyst: 29 required, 29 not taught here |
| Skills proved twice `kpi.ability.skills-transferred` | ability | metric.skill-transfer (own) | arch: 0 skills on two or more tasks; infra: 0 skills on two or more tasks; dev: 0 skills on two or more tasks; secops: 0 skills on two or more tasks |
| Steps verified in order `kpi.execution.steps-in-order` | execution | metric.procedure-in-order (own) | arch: 0 tasks with two or more verifiable steps; infra: 4 tasks with two or more verifiable steps; dev: 4 tasks with two or more verifiable steps; secops: 4 tasks with two or more verifiable steps |
| First-try verifications `kpi.execution.first-try` | execution | metric.ability-first-try (own) | arch: 4 verifiable steps; infra: 15 verifiable steps; dev: 16 verifiable steps; secops: 13 verifiable steps |
| Commands verified `kpi.execution.commands-verified` | execution | metric.tool-commands-verified (own) | arch: 4 verifiable steps that run a command; infra: 15 verifiable steps that run a command; dev: 16 verifiable steps that run a command; secops: 13 verifiable steps that run a command |
| Files named to convention `kpi.execution.evidence-named` | execution | metric.evidence-naming (own) | the files the member hashes; no content denominator |
| Procedures to standard `kpi.procedure.followed-to-standard` | procedure | metric.procedure-to-standard (team) | arch: 7 procedures; infra: 7 procedures; dev: 7 procedures; secops: 7 procedures |
| Definition-of-Done met `kpi.procedure.dod-met` | procedure | metric.doc-dod-met (team) | arch: 28 checks on 4 forms; infra: 28 checks on 4 forms; dev: 28 checks on 4 forms; secops: 28 checks on 4 forms |
| Controls cited `kpi.procedure.controls-cited` | procedure | metric.standard-controls-cited (team) | arch: 4 control codes on 4 forms; infra: 0 control codes on 0 forms; dev: 0 control codes on 0 forms; secops: 0 control codes on 0 forms |
| Document control complete `kpi.procedure.document-control` | procedure | metric.doc-control-complete (team) | arch: 4 forms; infra: 4 forms; dev: 4 forms; secops: 4 forms |
| Submissions rubric-green `kpi.outcome.rubric-green` | outcome | metric.doc-rubric-green (team) | the submissions the member freezes; no content denominator |
| Hand-offs completed `kpi.outcome.handoffs` | outcome | metric.collab-handoffs (team) | arch: 0 hand-offs; infra: 0 hand-offs; dev: 0 hand-offs; secops: 0 hand-offs |
| Instructor approved `kpi.outcome.instructor-approved` | outcome | metric.doc-instructor-approved (team) | arch: 4 forms; infra: 4 forms; dev: 4 forms; secops: 4 forms |
| Capstone filed `kpi.outcome.capstone-filed` | outcome | metric.outcome-capstone-filed (team) | one capstone per course |

