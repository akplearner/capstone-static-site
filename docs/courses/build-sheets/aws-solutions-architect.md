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
| Route table → IGW | Sends the public subnet’s traffic to the internet gateway | — |
| Security group | No inbound rule; outbound for patches and the agent | — |
| Amazon EC2 · ec2-tools-team01 | The internal IT tools server | — |

## Week 1 — Identity

> New: the secret store and the roles. The function reads by identity; readers only read.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Parameter Store | Publishes the table name as configuration, not a secret | — |

**Process — Identity:** CounterFunction → TableNameParameter (read by identity, no key); admin → ReadOnlyGroup (least privilege for readers).

## Week 2 — Networking

> New: the management subnet and the admin path with no open port. SSH is gone.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Role: SSM | Lets the instance talk to Session Manager instead of SSH | — |
| Route table (local) | Local routes only; no path to the internet | — |

**Process — Networking:** admin → ToolsInstance (Session Manager, no open port); user → HttpApi (CORS: your site only).

## Week 3 — Server Admin

> New: the data disk. The VM is patched, measured and right-sized.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| EBS volume | Data that must outlive the instance | — |

**Process — Server admin:** admin → DataVolume (attach and mount); admin → ToolsInstance (patch and baseline).

## Week 4 — Backup and Recovery

> New: the backup protection — soft delete on Azure, a daily AWS Backup plan. Snapshot, restore, time it, and recover a deleted file.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| AWS Backup · capstone-team01-vault | Where AWS Backup keeps the recovery points | — |
| Daily plan | A daily recovery point of the data volume, kept 35 days | — |

**Process — Backup and recovery:** admin → DataVolume (snapshot); DataVolume → ToolsInstance (restore and time it); BackupVault → SiteDistribution (recover the deleted file).

## The roles

| Role | Mission | Drafts | Reviews | Approves | Hands to | Waits on |
| --- | --- | --- | --- | --- | --- | --- |
| Design & Standards (Cloud Architect) | Owns the design, the standards, the cost and each week’s document. | Access Control Matrix & Secrets Register, Network Design Document, Server Configuration & Maintenance Runbook, Backup & Disaster Recovery Plan | — | — | Platform Build (Infrastructure Admin), Application Delivery (DevOps Engineer), Security Operations (SecOps Engineer) | — |
| Platform Build (Infrastructure Admin) | Builds the network, the VM, the data and the templates. | — | — | Network Design Document, Server Configuration & Maintenance Runbook, Backup & Disaster Recovery Plan | — | Design & Standards (Cloud Architect) |
| Application Delivery (DevOps Engineer) | Ships the website, the API and the pipeline. | — | Access Control Matrix & Secrets Register | — | — | Design & Standards (Cloud Architect) |
| Security Operations (SecOps Engineer) | Locks access down, watches it run, and works the incidents. | — | Network Design Document, Server Configuration & Maintenance Runbook, Backup & Disaster Recovery Plan | Access Control Matrix & Secrets Register | — | Design & Standards (Cloud Architect) |

