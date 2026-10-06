# Azure Administrator Capstone — certification and cost sheet

**Microsoft Azure Administrator (AZ-104)** · Associate · exam fee $165 (list price, 2026)

Generated from the certification registry and the course document by `npm run content:export`; edit `src/lib/docs/certs.ts`, `src/lib/docs/costs.ts` or the seed, not this file.

## The ladder

Azure Fundamentals (AZ-900) → **Azure Administrator (AZ-104)** → DevOps Engineer (AZ-400)

## Exam coverage — 95% of the exam weight is practised

| Domain | Weight | Practised by |
| --- | --- | --- |
| Manage Azure identities and governance | 20–25% | Write the access matrix and the security design; Move the key into Key Vault, protected and audited; Switch the Function to its identity and lock CORS; Prove an access is denied and find what is exposed |
| Implement and manage storage | 15–20% | Choose the data store and the storage tiers; Queue the visits and write a ledger; Lock the data down and age it out |
| Deploy and manage Azure compute resources | 20–25% | Design the two-zone fleet and record the decision; Build the fleet: a web subnet and a scale set across two zones; Autoscale the fleet on CPU and prove a lost instance is replaced |
| Implement and manage virtual networking | 15–20% | Put the fleet behind a Standard Load Balancer; Close port 22, add Bastion, and reach the vault privately; Create a zone-redundant PostgreSQL server in its own subnet, then stop it |
| Monitor and maintain Azure resources | 10–15% | Set RPO and RTO per asset and the autoscale target; Recover a deleted web file and restore the database to a point in time; Run a timed recovery drill and tear the fleet down |

## Cost

Exam $165 · one-off $0 · monthly ceiling $20 · tasks $0.85

| Item | Kind | Cost | Note |
| --- | --- | --- | --- |
| Azure account, free tier plus pay-as-you-go | cloud | $0 / month (approx.) | The free tier still covers the small instance, the function and the table. |
| Standard Load Balancer (weeks 2, 4) | cloud | $0.03 / hour | Runs only during the week it is built and the drills; torn down at the end of each task. |
| Two B1s instances in a scale set across two zones (weeks 2, 4) | cloud | $0.02 / hour | One is free-tier; the second is billed while the fleet runs. |
| Azure Database for PostgreSQL flexible server D2ds_v4, zone-redundant HA (weeks 3) | cloud | $0.30 / hour | Created in the data week and stopped or deleted the same day; the backups are kept for the restore drill. |
| Private endpoint (weeks 2) | cloud | $0.01 / hour | Per endpoint-hour; the gateway endpoint is free. |
| Budget guardrail | cloud | $20 / month (approx.) | The cap the course sets for a team that tears down on time. |

| Task | Runs for | Cost | Note |
| --- | --- | --- | --- |
| Build the fleet: a web subnet and a scale set across two zones | 55 min | $0.01 | The second B1s while the fleet runs; parked at zero at the end of the task. |
| Put the fleet behind a Standard Load Balancer | 55 min | $0.04 | The Standard Load Balancer ($0.025) and the second B1s while attached; the fleet is parked at the end, the balancer stays until the Week 8 drill. |
| Close port 22, add Bastion, and reach the vault privately | 55 min | $0.01 | The private endpoint while it exists; deleted at the end of the task. |
| Create a zone-redundant PostgreSQL server in its own subnet, then stop it | 60 min | $0.30 | General Purpose D2ds_v4 zone-redundant (two nodes) plus 32 GB while it runs; stopped inside the task, storage kept for cents a day. |
| Autoscale the fleet on CPU and prove a lost instance is replaced | 55 min | $0.02 | Up to two billed B1s beyond the free one while the fleet runs; parked at the end. |
| Recover a deleted web file and restore the database to a point in time | 55 min | $0.44 | The original zone-redundant server ($0.30) and the restored single server ($0.14) while they run; both deleted at the end of the task. |
| Run a timed recovery drill and tear the fleet down | 55 min | $0.04 | The fleet and the balancer for the minutes of the drill; all of it deleted inside the task. |

