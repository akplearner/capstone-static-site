# AWS DevOps Engineer Capstone — build sheet

What the architecture gains each week, what each part is for, which form records it, and the process the week walks through. Generated from the course document by `npm run content:export`; edit the picture module, not this file.

## Week 0 — Start where the last course left off

> What this course starts from — the previous course’s finished environment.

You start with:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| GitHub | The repository the site, the code and the template ship from | — |
| Visitors | The visitors who load the site and call the counter | — |
| Team admin | The team member who administers the environment | — |
| CloudFront · d…cloudfront.net | Serves the site over HTTPS worldwide | — |
| OAC | The identity CloudFront reads the private bucket with | — |
| Read-only group | The team’s group can look at everything and change nothing | — |
| Budget $5 | The $5 guardrail, set before anything can cost money | — |
| Amazon S3 · site bucket (private) | Holds the site files, private | — |
| API Gateway · HTTP API | The visitor-counter API’s front door | — |
| AWS Lambda · capstone-team01-counter | Counts a visit and returns the total | — |
| DynamoDB · on-demand | The table the count lives in | — |
| Parameter Store | Publishes the table name as configuration, not a secret | — |
| Role: counter | Lets the function write its logs and update one table | — |
| Role: SSM | Lets the instance talk to Session Manager instead of SSH | — |
| CloudWatch Logs · /aws/lambda/…counter | Where the function’s logs land, kept two weeks | — |
| CloudWatch alarm · Errors > 0 | Fires when the counter function throws an error | — |
| Amazon SNS · email the team | Who gets told when an alarm fires | — |
| AWS Backup · capstone-team01-vault | Where AWS Backup keeps the recovery points | — |
| Daily plan | A daily recovery point of the data volume, kept 35 days | — |
| Internet gateway | The VPC’s door to the internet | — |
| Route table → IGW | Sends the public subnets’ traffic to the internet gateway | — |
| Security group | Port 80 from the ALB’s group only; outbound for patches and the agent | — |
| Amazon EC2 · ec2-tools-team01 | The internal IT tools server | — |
| EBS volume | Data that must outlive the instance | — |
| Route table (local) | Local routes and the S3 gateway; no path to the internet | — |
| Application LB · alb-web-team01 | One address for the fleet in both zones; drains a dead instance in seconds | — |
| ALB group | Port 80 from the internet to the balancer, nothing else | — |
| Target group | Where the balancer sends traffic; the health check on / | — |
| Auto Scaling group · asg-web-team01 · 0–3 | The web fleet across both zones; replaces an instance that dies, parked at 0 | — |
| Launch template | The web instance written down: AL2023, nginx, IMDSv2, the SSM role | — |
| CPU 50% policy | Target tracking: adds an instance above 50% average CPU, removes it below | — |
| S3 gateway endpoint | Private subnets reach S3 and the package repositories with no NAT, free | — |
| DB group | PostgreSQL from the fleet’s group only | — |
| Amazon RDS · PostgreSQL · Multi-AZ | The relational store, encrypted and private, with a standby in zone b (opt-in) | — |
| Amazon SQS · visits | The queue between the API and the ledger; the front door answers fast | — |
| Dead-letter queue | Where a message the ledger rejects goes after three tries | — |
| Ledger function · capstone-team01-ledger | Writes one item per queued visit | — |
| Role: ledger | Put to one table, read from one queue | — |

## Week 1 — Infrastructure as code, tested

> Nothing new is built. The environment comes from the template: drift detected, linted, checked against policy, previewed, deployed to dev.

Nothing new is built this week; the process is drawn over the picture.

**Process — Infrastructure as code, tested:** github → region (change set → deploy to dev); admin → Vpc (detect drift, lint, policy as code).

## Week 2 — Pipelines with stages and gates

> New: the deploy identity. GitHub signs in by OIDC, checks, deploys dev, waits for a reviewer, deploys prod; a failure stops at dev.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| GitHub OIDC | Trusts GitHub’s tokens; the pipeline signs in with no access key | — |
| Deploy role | What GitHub Actions may do: deploy the site and the code | — |

**Process — Pipelines with stages and gates:** github → DeployRole (sign in by OIDC, no secret); github → SiteDistribution (check → dev → gate → prod); github → CounterFunction (under a change request).

## Week 3 — Release strategies and observability

> New: the green target group and the dashboard. A blue/green shift and a canary, judged by alarms; the tag rule and the audit trail.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| AWS CloudTrail · capstone-team01-trail | Every management call in the account, written to the bucket | — |
| Audit log bucket | Where the audit log is kept, private and versioned | — |
| Green target group | Where the next release registers while blue still serves; the listener weights the two | — |
| CloudWatch dashboard · the service levels | Healthy targets, p95 latency, 5XX and function errors on one screen | — |

**Process — Release strategies and observability:** SiteAlb → WebFleet (blue/green by weight); CounterFunction → FunctionErrorsAlarm (canary: alias weights, an alarm); Trail → admin (who changed what, when).

## Week 4 — Incident, compliance and handover

> Nothing new is built. Rebuild from code, a runbook, drift fixed through CI, an incident with its post-mortem, then the handover package.

Nothing new is built this week; the process is drawn over the picture.

**Process — Incident, compliance and handover:** user → SiteDistribution (the symptom); admin → ToolsInstance (recover · runbook · contain); admin → github (post-mortem and handover).

## The roles

| Role | Mission | Drafts | Reviews | Approves | Hands to | Waits on |
| --- | --- | --- | --- | --- | --- | --- |
| Design & Standards (Cloud Architect) | Owns the design, the standards, the cost and each week’s document. | IaC Design & Deployment Record, Change Request & Release Record, Governance, Security & Cost Report, Operational Handover Package | — | — | Platform Build (Infrastructure Admin), Application Delivery (DevOps Engineer), Security Operations (SecOps Engineer) | — |
| Platform Build (Infrastructure Admin) | Builds the network, the VM, the data and the templates. | — | Governance, Security & Cost Report | IaC Design & Deployment Record | — | Design & Standards (Cloud Architect) |
| Application Delivery (DevOps Engineer) | Ships the website, the API and the pipeline. | — | — | Change Request & Release Record, Operational Handover Package | — | Design & Standards (Cloud Architect) |
| Security Operations (SecOps Engineer) | Locks access down, watches it run, and works the incidents. | — | IaC Design & Deployment Record, Change Request & Release Record, Operational Handover Package | Governance, Security & Cost Report | — | Design & Standards (Cloud Architect) |

