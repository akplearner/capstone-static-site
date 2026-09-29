# Cloud Capstones — Azure and AWS (R87 · R90)

One twelve-week plan per platform, delivered as **three four-week courses**,
one per certification level. The tasks, documents, diagram and template are
authored once against the global weeks 1–12; each course is a quarter of
them, renumbered 1–4.

| Quarter | Azure | AWS | Global weeks |
|---|---|---|---|
| Fundamentals | **Azure Fundamentals Capstone** (`azure-fundamentals`, AZ-900) | **AWS Cloud Practitioner Capstone** (`aws-cloud-practitioner`, CLF-C02) | 1–4 |
| Operate | **Azure Administrator Capstone** (`azure-administrator`, AZ-104) | **AWS Solutions Architect Capstone** (`aws-solutions-architect`, SAA-C03) | 5–8 |
| Codify & hand over | **Azure DevOps Capstone** (`azure-devops`, AZ-400) | **AWS DevOps Engineer Capstone** (`aws-devops`, DOP-C02) | 9–12 |

A course after the first opens with a **Week 0** that deploys the previous
course's end state from the template (`throughWeek=4` / `8`) for a team that
did not build it; a team that did skips it. The diagram shows the course's own
four weeks (Week 0 shows what is inherited); "Show what comes later" reveals
the rest of the plan.

## Course description

> Run a small company in the cloud. Over twelve weeks your team of four
> builds a real environment: a website with HTTPS, a serverless visitor
> counter on a managed database, and one small Linux server. Then you
> secure it, watch it, break it and fix it, back it up and restore it, write
> it as infrastructure as code (an ARM template on Azure, CloudFormation on
> AWS), deploy it from a pipeline with no stored keys, and hand it over to a
> new team. Each role does one independent task a week, under an hour, and
> records it in that week's industry-standard team document. A $5 budget
> alert is the first thing you build.

## Shape

| | |
|---|---|
| Weeks | 4 graded per course (12 across the three), plus Week 0 in the second and third. No week is ever locked. |
| Roles | Cloud Architect · Infrastructure Admin · App & DevOps · Security & Ops (the Architect doubles up in a team of three). |
| Per week | 4 objectives, one task per role, 30–55 minutes, at most 4 steps. |
| Difficulty | Beginner 1–4 · Intermediate 5–8 · Advanced 9–11 · Integrated 12. |
| Tasks | One visible line; "Show me how" holds the clicks, commands and sample output; "Why, and if it breaks" holds the reasoning and fixes. |
| Cost | $5 budget in Week 1; every step that starts the VM ends with it deallocated/stopped. |
| IaC | Native first (ARM / CloudFormation), graded Weeks 9–12. Terraform is one optional comparison step. |

## Weekly plan

| Wk | Focus | Architect | Infrastructure | App & DevOps | Security & Ops |
|---|---|---|---|---|---|
| 1 | Foundation | Naming/tags, $5 budget | RG + VNet / VPC + subnet | Repo and board | NSG / security group, access review |
| 2 | Website + VM | SAD v1, cost, ADR-001 | B1s VM / t3.micro EC2 | Static website / S3 + CloudFront + OAC | SSH from your /32, allowed + blocked test |
| 3 | Serverless API | Request flow with real URLs | Cosmos DB / DynamoDB + seed | Function / Lambda + HTTP API | CORS lock + negative test, no keys |
| 4 | Operate | Cost to date | Error alert + action group / SNS | Find a failure in App Insights / CloudWatch Logs | Layer-by-layer incident (CORS) |
| 5 | Identity | Access matrix | Reader group / ReadOnlyAccess group | Managed identity / table-scoped role | Prove a denial |
| 6 | Networking | Network design doc | snet-mgmt / private subnet | Trace request paths | Remove SSH; Run Command / Session Manager |
| 7 | Server admin | Right-size | Data disk / EBS volume at /data | Update Manager / Patch Manager | Baseline + runbook |
| 8 | Backup + recovery | RPO/RTO per asset | Snapshot → restore | Soft delete / S3 versioning restore | Timed drill |
| 9 | Infrastructure as code | Template ↔ diagram map | CLI inventory | Fill the starter, what-if / change set, deploy dev | Parameter files, validate (Terraform optional) |
| 10 | CI/CD | RFC in a pull request | Branch protection + prod environment | GitHub Actions deploy | OIDC (no stored keys) + rollback test |
| 11 | Governance | Cost by service | Policy / Config required-tags | Activity Log / CloudTrail | Defender free CSPM / Trusted Advisor + Access Analyzer |
| 12 | Handover | Handover package (capstone) | Rebuild from the template | App failure fixed through CI | Security incident contained |

## Service translation

| Concept | Azure | AWS |
|---|---|---|
| Container | Subscription › resource group | Account › stack |
| Network | VNet, subnets, NSG | VPC, subnets, route tables, IGW, security group |
| Server | B1s Ubuntu VM | t3.micro Amazon Linux 2023, IMDSv2 |
| Website | Storage static website (HTTPS built in) | Private S3 + CloudFront + Origin Access Control |
| API | Function App (Consumption) | Lambda + API Gateway HTTP API |
| Database | Cosmos DB serverless | DynamoDB on-demand (atomic `ADD`) |
| No-secret access | Managed identity + Cosmos data role | Execution role scoped to one table ARN |
| Monitoring | Log Analytics, App Insights, metric alert, action group | CloudWatch Logs, alarm, SNS |
| Admin without ports | Run Command | Session Manager |
| Backup | Incremental disk snapshot, blob soft delete + versioning | EBS snapshot, S3 versioning |
| IaC | ARM template, `what-if` | CloudFormation, change set |
| Pipeline sign-in | Federated credential (azure/login) | IAM OIDC provider + role |
| Governance | Azure Policy (deny), Activity Log, Defender free CSPM | AWS Config (detect), CloudTrail, Trusted Advisor + Access Analyzer |

## Documents — one per week, the same twelve across the three courses, on both platforms

Every document opens with **Document control** (ID, version, owner,
approver, date, status) and closes with **Evidence** (a screenshot named
`YYYYMMDD_TeamXX_Tool_Action.png` and a line per component). Every section
names the role that fills it. Each form draws Architecture vN for its week.

| # | Document | Standard it follows |
|---|---|---|
| 1 | Cloud Foundation & Naming Standard | Cloud Adoption Framework / AWS tagging best practices |
| 2 | Solution Architecture Document + ADR-001 | ISO/IEC/IEEE 42010, ADR |
| 3 | Application & API Design Specification | OpenAPI-style interface spec |
| 4 | Monitoring & Incident Report | ITIL 4 incident management |
| 5 | Access Control Matrix & Secrets Register | NIST SP 800-53 AC-6 |
| 6 | Network Design Document | RFC 1918, segmentation |
| 7 | Server Configuration & Maintenance Runbook | CIS benchmark (reference) |
| 8 | Backup & Disaster Recovery Plan | NIST SP 800-34 |
| 9 | IaC Design & Deployment Record | Well-Architected, operational excellence |
| 10 | Change Request & Release Record | ITIL 4 change enablement |
| 11 | Governance, Security & Cost Report | Well-Architected, cost + security |
| 12 | Operational Handover Package (capstone) | ITIL 4 service transition |

## Architecture and IaC

* `src/lib/cloud/azureIac.ts` / `awsIac.ts`: one source template per platform
  with `⟦FILL:hint|value⟧` markers. A `throughWeek` parameter (4, 8 or 12)
  makes every Week-5+ resource conditional, so one template deploys any
  course's starting point. The full template and the Week 9 starter
  are both derived from it, and every resource is tagged with the week it
  arrives.
* `azureTopology.ts` / `awsTopology.ts`: the diagram, drawn in each
  platform's style. Node ids are template resource ids. The dependency
  arrows are derived from the template, so they are never typed by hand.
* The Guide's **Architecture & IaC** section shows the diagram and the
  template side by side: a week slider (Architecture v1…v12), a click to
  jump to a resource's lines, copy, download, parameters, outputs and
  commands.
* `src/lib/cloud/cloud.test.ts` holds the parity and soundness tests:
  * template ↔ diagram match;
  * weeks, the reference graph, starter/full and parameters are consistent;
  * no SSH from the internet;
  * TLS 1.2 is enforced and the bucket is private;
  * IMDSv2 is required;
  * the Lambda role is scoped to one table.
* `src/lib/data/cloudCourses.test.ts` holds this document's rules as
  numbers:
  * exactly one task per role per week;
  * every task is an hour or less, with 4 steps at most;
  * each visible line is 12 words or fewer;
  * every VM that is started is stopped again;
  * every document has Document control and Evidence;
  * the two courses have the same shape.

## Honest limits, stated in the course

* The VM keeps a public IP for outbound patching only. Production would put
  the VM in a private subnet behind a NAT gateway, which costs about $32 a
  month.
* ARM cannot switch on the static website, so one CLI step does it.
* The Azure counter uses bindings, and its read-then-write is a known race.
  AWS uses an atomic `ADD`.
* AWS Config reports untagged resources but does not block them. Blocking
  needs an SCP in AWS Organizations.
* The icons are the official AWS Architecture Icons and Microsoft Azure
  icons, copied unchanged into `public/cloud-icons/` (see its README for the
  source file of each and the terms). Two Azure icons do not exist in the
  pack (GitHub, an action group) and are drawn.
* The picture shows one week at a time. A Week-1 student sees the foundation
  only; "Show what comes later" reveals the rest greyed with its week.
