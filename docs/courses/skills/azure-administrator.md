# Azure Administrator Capstone — skills sheet

16 graded tasks · 0 skills · 8 tools · 0 procedures · 4 standards (4 controls cited) · 0 tactics · 0 practices

Generated from the registries and the course document by `npm run content:export`; edit `src/lib/docs/skills.ts`, `tools.ts`, `standards.ts`, `sops.ts`, `tactics.ts` or the seed, not this file.

## Skills

| Skill | Area | Anchored to | Practised by |
| --- | --- | --- | --- |

Graded tasks not yet mapped to a skill: az-w5-arch, az-w5-infra, az-w5-dev, az-w5-secops, az-w6-arch, az-w6-infra, az-w6-dev, az-w6-secops, az-w7-arch, az-w7-infra, az-w7-dev, az-w7-secops, az-w8-arch, az-w8-infra, az-w8-dev, az-w8-secops.

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

Graded tasks not yet mapped to a practice: az-w5-arch, az-w5-infra, az-w5-dev, az-w5-secops, az-w6-arch, az-w6-infra, az-w6-dev, az-w6-secops, az-w7-arch, az-w7-infra, az-w7-dev, az-w7-secops, az-w8-arch, az-w8-infra, az-w8-dev, az-w8-secops.

