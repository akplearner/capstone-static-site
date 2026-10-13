# AWS Solutions Architect Capstone — skills sheet

16 graded tasks · 0 skills · 7 tools · 0 procedures · 4 standards (4 controls cited) · 0 tactics · 0 practices

Generated from the registries and the course document by `npm run content:export`; edit `src/lib/docs/skills.ts`, `tools.ts`, `standards.ts`, `sops.ts`, `tactics.ts` or the seed, not this file.

## Skills

| Skill | Area | Anchored to | Practised by |
| --- | --- | --- | --- |

Graded tasks not yet mapped to a skill: aws-w5-arch, aws-w5-infra, aws-w5-dev, aws-w5-secops, aws-w6-arch, aws-w6-infra, aws-w6-dev, aws-w6-secops, aws-w7-arch, aws-w7-infra, aws-w7-dev, aws-w7-secops, aws-w8-arch, aws-w8-infra, aws-w8-dev, aws-w8-secops.

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

## Standards

| Standard | Tagged on tasks | Cited by forms |
| --- | --- | --- |
| AWS SAA-C03 | Write the access matrix and the security design; Put the table name in Parameter Store and a secret under a customer key; Scope the Lambda role to the table and lock CORS; Prove an access is denied and find what is exposed; Design the two-zone fleet and record the decision; Build the fleet: a launch template and an Auto Scaling group across two zones; Put the fleet behind an Application Load Balancer; Give the private subnet a path without the internet; Choose the data store and the storage classes; Create a Multi-AZ PostgreSQL database and keep its snapshot; Queue the visits and write a ledger; Lock the data down and age it out; Set RPO and RTO per asset and the scaling policy; Scale the fleet on CPU and prove a lost instance is replaced; Recover a deleted web file and the database from its snapshot; Run a timed recovery drill and tear the fleet down | — |
| Well-Architected | Write the access matrix and the security design; Put the table name in Parameter Store and a secret under a customer key; Scope the Lambda role to the table and lock CORS; Prove an access is denied and find what is exposed; Design the two-zone fleet and record the decision; Build the fleet: a launch template and an Auto Scaling group across two zones; Put the fleet behind an Application Load Balancer; Give the private subnet a path without the internet; Choose the data store and the storage classes; Create a Multi-AZ PostgreSQL database and keep its snapshot; Queue the visits and write a ledger; Lock the data down and age it out; Set RPO and RTO per asset and the scaling policy; Scale the fleet on CPU and prove a lost instance is replaced; Recover a deleted web file and the database from its snapshot; Run a timed recovery drill and tear the fleet down | Data Store & Runbook |
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

Graded tasks not yet mapped to a practice: aws-w5-arch, aws-w5-infra, aws-w5-dev, aws-w5-secops, aws-w6-arch, aws-w6-infra, aws-w6-dev, aws-w6-secops, aws-w7-arch, aws-w7-infra, aws-w7-dev, aws-w7-secops, aws-w8-arch, aws-w8-infra, aws-w8-dev, aws-w8-secops.

