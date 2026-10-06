# Azure DevOps Capstone — build sheet

What the architecture gains each week, what each part is for, which form records it, and the process the week walks through. Generated from the course document by `npm run content:export`; edit the picture module, not this file.

## Week 0 — Start where the last course left off

> What this course starts from — the previous course’s finished environment.

You start with:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Visitors | The visitors who load the site and call the counter | — |
| GitHub | The repository the site, the code and the template ship from | — |
| Team admin | The team member who administers the environment | — |
| Storage account · stweb… ($web) | Hosts the company website over HTTPS | — |
| Soft delete | Brings a deleted or overwritten page back | — |
| Key vault · kv-capstone-team01-… | Holds secrets the function reads by identity | — |
| Secrets User | Lets the function read secrets, nothing more | — |
| Function app · func-capstone-team01 | The visitor-counter API | — |
| Azure Cosmos DB · serverless | The database the counter lives in | — |
| Data Contributor | Lets the function read and write data by identity | — |
| App Insights · appi-capstone-team01 | Requests, failures and traces from the function | — |
| Log Analytics · log-capstone-team01 | Where every log and metric ends up | — |
| Alert: Http5xx · alert-func-5xx | Fires when the API returns a server error | — |
| Action group · email the team | Who gets told when the alert fires | — |
| NSG · nsg-snet-app | Rules for the app subnet: SSH from management only | — |
| Virtual machine · vm-tools-team01 | The internal IT tools server | — |
| Public IP | The VM’s public address, outbound only after week 6 | — |
| Data disk | Data that must outlive the operating system | — |
| NSG · nsg-snet-mgmt | Rules for the management subnet: nothing from the internet | — |
| Azure Bastion · Developer SKU · free | A browser SSH session to the VM with no open port | — |
| Reader (group) | The team’s group can look at everything and change nothing | — |
| Budget $5 | The $5 guardrail, set before anything can cost money | — |

## Week 1 — Infrastructure as Code

> Nothing new is built. The environment comes from the template: drift detected, linted, checked against policy, previewed, deployed to dev.

Nothing new is built this week; the process is drawn over the picture.

**Process — Infrastructure as code, tested:** github → rg (what-if → deploy to dev); admin → rg (detect drift, lint, policy as code).

## Week 2 — CI/CD

> New: the deploy identity. GitHub signs in by OIDC, checks, deploys dev, waits for a reviewer, deploys prod; a failure stops at dev.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Deploy identity | The identity GitHub Actions deploys as; no password to leak | — |
| GitHub federation | Trusts GitHub’s tokens for one repository’s main branch | — |
| Contributor (RG) | Contributor on this resource group only | — |

**Process — Pipelines with stages and gates:** github → deployIdentity (sign in by OIDC, no secret); github → webStorage (check → dev → gate → prod); github → func (under a change request).

## Week 3 — Governance

> New: the green target group and the dashboard. A blue/green shift and a canary, judged by alarms; the tag rule and the audit trail.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Policy: owner tag | Refuses any new resource without an owner tag | — |

**Process — Release strategies and observability:** bastion → vm (blue/green by weight); func → http5xxAlert (canary: alias weights, an alarm); tagPolicy → admin (who changed what, when).

## Week 4 — Handover

> Nothing new is built. Rebuild from code, a runbook, drift fixed through CI, an incident with its post-mortem, then the handover package.

Nothing new is built this week; the process is drawn over the picture.

**Process — Incident, compliance and handover:** user → webStorage (the symptom); admin → vm (recover · runbook · contain); admin → github (post-mortem and handover).

## The roles

| Role | Mission | Drafts | Reviews | Approves | Hands to | Waits on |
| --- | --- | --- | --- | --- | --- | --- |
| Design & Standards (Cloud Architect) | Owns the design, the standards, the cost and each week’s document. | IaC Design & Deployment Record, Change Request & Release Record, Governance, Security & Cost Report, Operational Handover Package | — | — | Platform Build (Infrastructure Admin), Application Delivery (DevOps Engineer), Security Operations (SecOps Engineer) | — |
| Platform Build (Infrastructure Admin) | Builds the network, the VM, the data and the templates. | — | Governance, Security & Cost Report | IaC Design & Deployment Record | — | Design & Standards (Cloud Architect) |
| Application Delivery (DevOps Engineer) | Ships the website, the API and the pipeline. | — | — | Change Request & Release Record, Operational Handover Package | — | Design & Standards (Cloud Architect) |
| Security Operations (SecOps Engineer) | Locks access down, watches it run, and works the incidents. | — | IaC Design & Deployment Record, Change Request & Release Record, Operational Handover Package | Governance, Security & Cost Report | — | Design & Standards (Cloud Architect) |

