# AWS Solutions Architect Capstone — certification and cost sheet

**AWS Solutions Architect – Associate (SAA-C03)** · Associate · exam fee $150 (list price, 2026)

Generated from the certification registry and the course document by `npm run content:export`; edit `src/lib/docs/certs.ts`, `src/lib/docs/costs.ts` or the seed, not this file.

## The ladder

Cloud Practitioner (CLF-C02) → **Solutions Architect – Associate (SAA-C03)** → DevOps Engineer – Professional (DOP-C02)

## Exam coverage — 100% of the exam weight is practised

| Domain | Weight | Practised by |
| --- | --- | --- |
| Design Secure Architectures | 30% | Write the access matrix and the security design; Put the table name in Parameter Store and a secret under a customer key; Scope the Lambda role to the table and lock CORS; Prove an access is denied and find what is exposed; Give the private subnet a path without the internet; Lock the data down and age it out |
| Design Resilient Architectures | 26% | Design the two-zone fleet and record the decision; Build the fleet: a launch template and an Auto Scaling group across two zones; Put the fleet behind an Application Load Balancer; Create a Multi-AZ PostgreSQL database and keep its snapshot; Scale the fleet on CPU and prove a lost instance is replaced; Recover a deleted web file and the database from its snapshot; Run a timed recovery drill and tear the fleet down |
| Design High-Performing Architectures | 24% | Queue the visits and write a ledger |
| Design Cost-Optimized Architectures | 20% | Choose the data store and the storage classes; Set RPO and RTO per asset and the scaling policy |

## Cost

Exam $150 · one-off $0 · monthly ceiling $20 · tasks $0.19

| Item | Kind | Cost | Note |
| --- | --- | --- | --- |
| AWS account, free tier plus pay-as-you-go | cloud | $0 / month (approx.) | The free tier still covers the small instance, the function and the table. |
| Application Load Balancer (weeks 2, 4) | cloud | $0.02 / hour | Runs only during the week it is built and the drills; torn down at the end of each task. |
| Two t3.micro instances across two zones (weeks 2, 4) | cloud | $0.02 / hour | One is free-tier; the second is billed while the fleet runs. |
| RDS PostgreSQL db.t3.micro, Multi-AZ (weeks 3) | cloud | $0.04 / hour | Created in the data week and deleted the same day; a final snapshot is kept. |
| VPC interface endpoints (SSM, S3 gateway) (weeks 2) | cloud | $0.01 / hour | Per endpoint-hour; the gateway endpoint is free. |
| Budget guardrail | cloud | $20 / month (approx.) | The cap the course sets for a team that tears down on time. |

| Task | Runs for | Cost | Note |
| --- | --- | --- | --- |
| Put the table name in Parameter Store and a secret under a customer key | 45 min | $0.00 | The KMS key: $1 a month, prorated; schedule deletion at the end of the course. |
| Build the fleet: a launch template and an Auto Scaling group across two zones | 55 min | $0.01 | The second t3.micro while the fleet runs; parked at zero at the end of the task. |
| Put the fleet behind an Application Load Balancer | 55 min | $0.03 | The ALB ($0.0225) and the second instance while attached; the fleet is parked at the end, the ALB stays until the Week 8 drill. |
| Give the private subnet a path without the internet | 55 min | $0.03 | Three interface endpoints at $0.01 each while they exist; deleted at the end of the task. |
| Create a Multi-AZ PostgreSQL database and keep its snapshot | 60 min | $0.04 | db.t3.micro Multi-AZ ($0.036) plus 20 GB gp3 while it exists; deleted inside the task, the snapshot kept for cents. |
| Scale the fleet on CPU and prove a lost instance is replaced | 55 min | $0.02 | Up to two billed t3.micro beyond the free one while the fleet runs; parked at the end. |
| Recover a deleted web file and the database from its snapshot | 55 min | $0.02 | The restored single-AZ db.t3.micro while it exists; deleted at the end of the task. |
| Run a timed recovery drill and tear the fleet down | 55 min | $0.03 | The fleet and the ALB for the minutes of the drill; all of it deleted inside the task. |

