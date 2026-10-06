# AWS Solutions Architect Capstone — certification and cost sheet

**AWS Solutions Architect – Associate (SAA-C03)** · Associate · exam fee $150 (list price, 2026)

Generated from the certification registry and the course document by `npm run content:export`; edit `src/lib/docs/certs.ts`, `src/lib/docs/costs.ts` or the seed, not this file.

## The ladder

Cloud Practitioner (CLF-C02) → **Solutions Architect – Associate (SAA-C03)** → DevOps Engineer – Professional (DOP-C02)

## Exam coverage — 0% of the exam weight is practised

| Domain | Weight | Practised by |
| --- | --- | --- |
| Design Secure Architectures | 30% | — not practised in this course |
| Design Resilient Architectures | 26% | — not practised in this course |
| Design High-Performing Architectures | 24% | — not practised in this course |
| Design Cost-Optimized Architectures | 20% | — not practised in this course |

Graded tasks that name no domain: aws-w5-arch, aws-w5-infra, aws-w5-dev, aws-w5-secops, aws-w6-arch, aws-w6-infra, aws-w6-dev, aws-w6-secops, aws-w7-arch, aws-w7-infra, aws-w7-dev, aws-w7-secops, aws-w8-arch, aws-w8-infra, aws-w8-dev, aws-w8-secops.

## Cost

Exam $150 · one-off $0 · monthly ceiling $20 · tasks $0

| Item | Kind | Cost | Note |
| --- | --- | --- | --- |
| AWS account, free tier plus pay-as-you-go | cloud | $0 / month (approx.) | The free tier still covers the small instance, the function and the table. |
| Application Load Balancer (weeks 2, 4) | cloud | $0.02 / hour | Runs only during the week it is built and the drills; torn down at the end of each task. |
| Two t3.micro instances across two zones (weeks 2, 4) | cloud | $0.02 / hour | One is free-tier; the second is billed while the fleet runs. |
| RDS PostgreSQL db.t3.micro, Multi-AZ (weeks 3) | cloud | $0.04 / hour | Created in the data week and deleted the same day; a final snapshot is kept. |
| VPC interface endpoints (SSM, S3 gateway) (weeks 2) | cloud | $0.01 / hour | Per endpoint-hour; the gateway endpoint is free. |
| Budget guardrail | cloud | $20 / month (approx.) | The cap the course sets for a team that tears down on time. |

