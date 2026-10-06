# AWS Cloud Practitioner Capstone — build sheet

What the architecture gains each week, what each part is for, which form records it, and the process the week walks through. Generated from the course document by `npm run content:export`; edit the picture module, not this file.

## Week 1 — Cloud concepts and governance

> New: the budget, the group and the network. The standard everything else is named by.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Budget $5 | The $5 guardrail, set before anything can cost money | — |
| Internet gateway | The VPC’s door to the internet | — |
| Route table → IGW | Sends the public subnet’s traffic to the internet gateway | — |

**Process — Set the standard:** admin → MonthlyBudget (the $5 budget); admin → Vpc (the group and the network).

## Week 2 — Core services

> New: the VM, the storage site and the firewall. The company is on the internet, over HTTPS.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| CloudFront · d…cloudfront.net | Serves the site over HTTPS worldwide | — |
| OAC | The identity CloudFront reads the private bucket with | — |
| Amazon S3 · site bucket (private) | Holds the site files, private | — |
| Security group | No inbound rule; outbound for patches and the agent | — |
| Amazon EC2 · ec2-tools-team01 | The internal IT tools server | — |

**Process — Core services:** user → SiteDistribution (the site, over HTTPS); admin → ToolsInstance (SSH from one address only).

## Week 3 — Serverless, data and identity

> New: the function, the database and the identity pieces. A page view becomes a count.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Read-only group | The team’s group can look at everything and change nothing | — |
| API Gateway · HTTP API | The visitor-counter API’s front door | — |
| AWS Lambda · capstone-team01-counter | Counts a visit and returns the total | — |
| DynamoDB · on-demand | The table the count lives in | — |
| Role: counter | Lets the function write its logs and update one table | — |

**Process — The visitor counter:** user → HttpApi (GET the count); CounterFunction → VisitorTable (count + 1).

## Week 4 — Monitor, govern, pay

> New: the alert and who it emails. Break it on purpose and watch the alert win.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| CloudWatch Logs · /aws/lambda/…counter | Where the function’s logs land, kept two weeks | — |
| CloudWatch alarm · Errors > 0 | Fires when the counter function throws an error | — |
| Amazon SNS · email the team | Who gets told when an alarm fires | — |

**Process — The incident loop:** CounterFunction → FunctionErrorsAlarm (server errors); FunctionErrorsAlarm → AlertTopic (email the team); admin → CounterFunction (find it, fix it, retest).

