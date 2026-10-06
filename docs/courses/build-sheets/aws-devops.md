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
| Route table → IGW | Sends the public subnet’s traffic to the internet gateway | — |
| Security group | No inbound rule; outbound for patches and the agent | — |
| Amazon EC2 · ec2-tools-team01 | The internal IT tools server | — |
| EBS volume | Data that must outlive the instance | — |
| Route table (local) | Local routes only; no path to the internet | — |

## Week 1 — Infrastructure as Code

> Nothing new is built. The whole environment comes from the template, previewed before it deploys.

Nothing new is built this week; the process is drawn over the picture.

**Process — Infrastructure as Code:** github → region (change set → deploy to dev).

## Week 2 — CI/CD

> New: the deploy identity. GitHub signs in by OIDC without a stored secret and deploys under a change request.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| GitHub OIDC | Trusts GitHub’s tokens; the pipeline signs in with no access key | — |
| Deploy role | What GitHub Actions may do: deploy the site and the code | — |

**Process — CI/CD:** github → DeployRole (sign in by OIDC, no secret); github → SiteDistribution (deploy the site); github → CounterFunction (deploy under a change request).

## Week 3 — Governance

> New: governance — the tag policy, the audit trail. Untagged resources are caught; the month’s cost is reviewed.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| AWS CloudTrail · capstone-team01-trail | Every management call in the account, written to the bucket | — |
| Audit log bucket | Where the audit log is kept, private and versioned | — |

**Process — Governance:** Trail → Vpc (CloudTrail · Config (console)); Trail → admin (who changed what, when); admin → MonthlyBudget (cost review).

## Week 4 — Handover

> Nothing new is built. Three scenarios under time pressure, then the handover package.

Nothing new is built this week; the process is drawn over the picture.

**Process — Handover:** user → SiteDistribution (the symptom); admin → ToolsInstance (recover · fix · contain); admin → github (the handover package).

## The roles

| Role | Mission | Drafts | Reviews | Approves | Hands to | Waits on |
| --- | --- | --- | --- | --- | --- | --- |
| Design & Standards (Cloud Architect) | Owns the design, the standards, the cost and each week’s document. | IaC Design & Deployment Record, Change Request & Release Record, Governance, Security & Cost Report, Operational Handover Package | — | — | Platform Build (Infrastructure Admin), Application Delivery (DevOps Engineer), Security Operations (SecOps Engineer) | — |
| Platform Build (Infrastructure Admin) | Builds the network, the VM, the data and the templates. | — | Governance, Security & Cost Report | IaC Design & Deployment Record | — | Design & Standards (Cloud Architect) |
| Application Delivery (DevOps Engineer) | Ships the website, the API and the pipeline. | — | — | Change Request & Release Record, Operational Handover Package | — | Design & Standards (Cloud Architect) |
| Security Operations (SecOps Engineer) | Locks access down, watches it run, and works the incidents. | — | IaC Design & Deployment Record, Change Request & Release Record, Operational Handover Package | Governance, Security & Cost Report | — | Design & Standards (Cloud Architect) |

