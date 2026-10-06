# Azure Administrator Capstone — build sheet

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
| Function app · func-capstone-team01 | The visitor-counter API | — |
| Azure Cosmos DB · serverless | The database the counter lives in | — |
| App Insights · appi-capstone-team01 | Requests, failures and traces from the function | — |
| Log Analytics · log-capstone-team01 | Where every log and metric ends up | — |
| Alert: Http5xx · alert-func-5xx | Fires when the API returns a server error | — |
| Action group · email the team | Who gets told when the alert fires | — |
| NSG · nsg-snet-app | Rules for the app subnet: SSH from management only | — |
| Virtual machine · vm-tools-team01 | The internal IT tools server | — |
| Public IP | The VM’s public address, outbound only after week 6 | — |
| Reader (group) | The team’s group can look at everything and change nothing | — |
| Budget $5 | The $5 guardrail, set before anything can cost money | — |

## Week 1 — Identity

> New: the team’s key and the secret under it, the fenced API. The function reads by identity; a denial is proved and the exposure read.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Key vault · kv-capstone-team01-… | Holds secrets the function reads by identity | — |
| Secrets User | Lets the function read secrets, nothing more | — |
| Data Contributor | Lets the function read and write data by identity | — |

**Process — Secure by design:** func → kv (read by identity, under the team key); user → func (CORS: your site only); admin → readerRole (prove a denial, find exposure).

## Week 2 — Networking

> New: a second zone, a load balancer, a fleet of two behind it, and a private path that needs no internet. One address, two zones.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| NSG · nsg-snet-mgmt | Rules for the management subnet: nothing from the internet | — |
| Azure Bastion · Developer SKU · free | A browser SSH session to the VM with no open port | — |

**Process — Resilient compute:** user → bastion (one address); bastion → vm (two zones, healthy targets); kv → vm (Bastion in the browser, no port).

## Week 3 — Server Admin

> New: the Multi-AZ database, encrypted and private, and the queue with its dead-letter queue. The right store per workload, the right class per object.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Data disk | Data that must outlive the operating system | — |

**Process — Data and storage:** vm → cosmos (Multi-AZ, encrypted, private); func → webStorage (queue the visit); webStorage → cosmos (the ledger writes it).

## Week 4 — Backup and Recovery

> New: the scaling policy. The fleet grows on CPU and replaces a lost instance; a file and the database come back; the drill is timed.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Soft delete | Brings a deleted or overwritten page back | — |

**Process — Scale, monitor, recover:** vm → bastion (scale on CPU, replace the lost one); webBlobService → webStorage (recover the deleted file); admin → cosmos (restore from the snapshot, time it).

## The roles

| Role | Mission | Drafts | Reviews | Approves | Hands to | Waits on |
| --- | --- | --- | --- | --- | --- | --- |
| Design & Standards (Cloud Architect) | Owns the design, the standards, the cost and each week’s document. | Access Control Matrix & Secrets Register, Network Design Document, Data Store & Runbook, Backup & Disaster Recovery Plan | — | — | Platform Build (Infrastructure Admin), Application Delivery (DevOps Engineer), Security Operations (SecOps Engineer) | — |
| Platform Build (Infrastructure Admin) | Builds the network, the VM, the data and the templates. | — | — | Network Design Document, Data Store & Runbook, Backup & Disaster Recovery Plan | — | Design & Standards (Cloud Architect) |
| Application Delivery (DevOps Engineer) | Ships the website, the API and the pipeline. | — | Access Control Matrix & Secrets Register | — | — | Design & Standards (Cloud Architect) |
| Security Operations (SecOps Engineer) | Locks access down, watches it run, and works the incidents. | — | Network Design Document, Data Store & Runbook, Backup & Disaster Recovery Plan | Access Control Matrix & Secrets Register | — | Design & Standards (Cloud Architect) |

