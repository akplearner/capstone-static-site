# Azure Administrator Capstone — certification and cost sheet

**Microsoft Azure Administrator (AZ-104)** · Associate · exam fee $165 (list price, 2026)

Generated from the certification registry and the course document by `npm run content:export`; edit `src/lib/docs/certs.ts`, `src/lib/docs/costs.ts` or the seed, not this file.

## The ladder

Azure Fundamentals (AZ-900) → **Azure Administrator (AZ-104)** → DevOps Engineer (AZ-400)

## Exam coverage — 0% of the exam weight is practised

| Domain | Weight | Practised by |
| --- | --- | --- |
| Manage Azure identities and governance | 20–25% | — not practised in this course |
| Implement and manage storage | 15–20% | — not practised in this course |
| Deploy and manage Azure compute resources | 20–25% | — not practised in this course |
| Implement and manage virtual networking | 15–20% | — not practised in this course |
| Monitor and maintain Azure resources | 10–15% | — not practised in this course |

Graded tasks that name no domain: az-w5-arch, az-w5-infra, az-w5-dev, az-w5-secops, az-w6-arch, az-w6-infra, az-w6-dev, az-w6-secops, az-w7-arch, az-w7-infra, az-w7-dev, az-w7-secops, az-w8-arch, az-w8-infra, az-w8-dev, az-w8-secops.

## Cost

Exam $165 · one-off $0 · monthly ceiling $20 · tasks $0

| Item | Kind | Cost | Note |
| --- | --- | --- | --- |
| Azure account, free tier plus pay-as-you-go | cloud | $0 / month (approx.) | The free tier still covers the small instance, the function and the table. |
| Standard Load Balancer (weeks 2, 4) | cloud | $0.03 / hour | Runs only during the week it is built and the drills; torn down at the end of each task. |
| Two B1s instances in a scale set across two zones (weeks 2, 4) | cloud | $0.02 / hour | One is free-tier; the second is billed while the fleet runs. |
| Azure Database for PostgreSQL flexible server B1ms, zone-redundant (weeks 3) | cloud | $0.03 / hour | Created in the data week and deleted the same day; a final snapshot is kept. |
| Private endpoint (weeks 2) | cloud | $0.01 / hour | Per endpoint-hour; the gateway endpoint is free. |
| Budget guardrail | cloud | $20 / month (approx.) | The cap the course sets for a team that tears down on time. |

