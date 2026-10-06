# AWS Solutions Architect Capstone — build sheet

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
| Role: counter | Lets the function write its logs and update one table | — |
| CloudWatch Logs · /aws/lambda/…counter | Where the function’s logs land, kept two weeks | — |
| CloudWatch alarm · Errors > 0 | Fires when the counter function throws an error | — |
| Amazon SNS · email the team | Who gets told when an alarm fires | — |
| Internet gateway | The VPC’s door to the internet | — |
| Route table → IGW | Sends the public subnets’ traffic to the internet gateway | — |
| Security group | Port 80 from the ALB’s group only; outbound for patches and the agent | — |
| Amazon EC2 · ec2-tools-team01 | The internal IT tools server | — |

## Week 1 — Secure by design

> New: the team’s key and the secret under it, the fenced API. The function reads by identity; a denial is proved and the exposure read.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Parameter Store | Publishes the table name as configuration, not a secret | — |

**Process — Secure by design:** CounterFunction → TableNameParameter (read by identity, under the team key); user → HttpApi (CORS: your site only); admin → ReadOnlyGroup (prove a denial, find exposure).

## Week 2 — Resilient compute

> New: a second zone, a load balancer, a fleet of two behind it, and a private path that needs no internet. One address, two zones.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Role: SSM | Lets the instance talk to Session Manager instead of SSH | — |
| Route table (local) | Local routes and the S3 gateway; no path to the internet | — |
| Application LB · alb-web-team01 | One address for the fleet in both zones; drains a dead instance in seconds | — |
| ALB group | Port 80 from the internet to the balancer, nothing else | — |
| Target group | Where the balancer sends traffic; the health check on / | — |
| Auto Scaling group · asg-web-team01 · 0–3 | The web fleet across both zones; replaces an instance that dies, parked at 0 | — |
| Launch template | The web instance written down: AL2023, nginx, IMDSv2, the SSM role | — |
| S3 gateway endpoint | Private subnets reach S3 and the package repositories with no NAT, free | — |

**Process — Resilient compute:** user → SiteAlb (one address); SiteAlb → WebFleet (two zones, healthy targets); S3GatewayEndpoint → WebFleet (Session Manager, no open port).

## Week 3 — Data and storage

> New: the Multi-AZ database, encrypted and private, and the queue with its dead-letter queue. The right store per workload, the right class per object.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| EBS volume | Data that must outlive the instance | — |
| DB group | PostgreSQL from the fleet’s group only | — |
| Amazon RDS · PostgreSQL · Multi-AZ | The relational store, encrypted and private, with a standby in zone b (opt-in) | — |
| Amazon SQS · visits | The queue between the API and the ledger; the front door answers fast | — |
| Dead-letter queue | Where a message the ledger rejects goes after three tries | — |
| Ledger function · capstone-team01-ledger | Writes one item per queued visit | — |
| Role: ledger | Put to one table, read from one queue | — |

**Process — Data and storage:** WebFleet → Database (Multi-AZ, encrypted, private); CounterFunction → VisitsQueue (queue the visit); VisitsQueue → VisitorTable (the ledger writes it).

## Week 4 — Scale, monitor, recover

> New: the scaling policy. The fleet grows on CPU and replaces a lost instance; a file and the database come back; the drill is timed.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| AWS Backup · capstone-team01-vault | Where AWS Backup keeps the recovery points | — |
| Daily plan | A daily recovery point of the data volume, kept 35 days | — |
| CPU 50% policy | Target tracking: adds an instance above 50% average CPU, removes it below | — |

**Process — Scale, monitor, recover:** WebFleet → SiteAlb (scale on CPU, replace the lost one); BackupVault → SiteDistribution (recover the deleted file); admin → Database (restore from the snapshot, time it).

## The roles

| Role | Mission | Drafts | Reviews | Approves | Hands to | Waits on |
| --- | --- | --- | --- | --- | --- | --- |
| Design & Standards (Cloud Architect) | Owns the design, the standards, the cost and each week’s document. | Access Control Matrix & Secrets Register, Network Design Document, Data Store & Runbook, Backup & Disaster Recovery Plan | — | — | Platform Build (Infrastructure Admin), Application Delivery (DevOps Engineer), Security Operations (SecOps Engineer) | — |
| Platform Build (Infrastructure Admin) | Builds the network, the VM, the data and the templates. | — | — | Network Design Document, Data Store & Runbook, Backup & Disaster Recovery Plan | — | Design & Standards (Cloud Architect) |
| Application Delivery (DevOps Engineer) | Ships the website, the API and the pipeline. | — | Access Control Matrix & Secrets Register | — | — | Design & Standards (Cloud Architect) |
| Security Operations (SecOps Engineer) | Locks access down, watches it run, and works the incidents. | — | Network Design Document, Data Store & Runbook, Backup & Disaster Recovery Plan | Access Control Matrix & Secrets Register | — | Design & Standards (Cloud Architect) |

