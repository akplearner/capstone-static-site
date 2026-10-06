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

> Nothing new is built. The whole environment comes from the template, previewed before it deploys.

Nothing new is built this week; the process is drawn over the picture.

**Process — Infrastructure as Code:** github → rg (what-if → deploy to dev).

## Week 2 — CI/CD

> New: the deploy identity. GitHub signs in by OIDC without a stored secret and deploys under a change request.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Deploy identity | The identity GitHub Actions deploys as; no password to leak | — |
| GitHub federation | Trusts GitHub’s tokens for one repository’s main branch | — |
| Contributor (RG) | Contributor on this resource group only | — |

**Process — CI/CD:** github → deployIdentity (sign in by OIDC, no secret); github → webStorage (deploy the site); github → func (deploy under a change request).

## Week 3 — Governance

> New: governance — the tag policy, the audit trail. Untagged resources are caught; the month’s cost is reviewed.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Policy: owner tag | Refuses any new resource without an owner tag | — |

**Process — Governance:** tagPolicy → rg (Policy: deny untagged); tagPolicy → admin (who changed what, when); admin → budget (cost review).

## Week 4 — Handover

> Nothing new is built. Three scenarios under time pressure, then the handover package.

Nothing new is built this week; the process is drawn over the picture.

**Process — Handover:** user → webStorage (the symptom); admin → vm (recover · fix · contain); admin → github (the handover package).

## The roles

| Role | Mission | Drafts | Reviews | Approves | Hands to | Waits on |
| --- | --- | --- | --- | --- | --- | --- |
| Design & Standards (Cloud Architect) | Owns the design, the standards, the cost and each week’s document. | IaC Design & Deployment Record, Change Request & Release Record, Governance, Security & Cost Report, Operational Handover Package | — | — | Platform Build (Infrastructure Admin), Application Delivery (DevOps Engineer), Security Operations (SecOps Engineer) | — |
| Platform Build (Infrastructure Admin) | Builds the network, the VM, the data and the templates. | — | Governance, Security & Cost Report | IaC Design & Deployment Record | — | Design & Standards (Cloud Architect) |
| Application Delivery (DevOps Engineer) | Ships the website, the API and the pipeline. | — | — | Change Request & Release Record, Operational Handover Package | — | Design & Standards (Cloud Architect) |
| Security Operations (SecOps Engineer) | Locks access down, watches it run, and works the incidents. | — | IaC Design & Deployment Record, Change Request & Release Record, Operational Handover Package | Governance, Security & Cost Report | — | Design & Standards (Cloud Architect) |

