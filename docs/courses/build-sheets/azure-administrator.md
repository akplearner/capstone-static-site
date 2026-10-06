# Azure Administrator Capstone — build sheet

What the architecture gains each week, what each part is for, which form records it, and the process the week walks through. Generated from the course document by `npm run content:export`; edit the picture module, not this file.

## Week 0 — Start where the last course left off

> What this course starts from — the previous course’s finished environment.

You start with:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Visitors | The visitors who load the site, call the counter and reach the fleet | — |
| GitHub | The repository the site, the code and the template ship from | — |
| Team admin | The team member who administers the environment | — |
| Storage account · stweb… ($web) | Hosts the company website over HTTPS | — |
| Function app · func-capstone-team01 | The visitor-counter API and the ledger that drains the queue | — |
| Azure Cosmos DB · serverless | The database the counter and the ledger live in | — |
| App Insights · appi-capstone-team01 | Requests, failures and traces from the function | — |
| Log Analytics · log-capstone-team01 | Where every log and metric ends up | — |
| Alert: Http5xx · alert-func-5xx | Fires when the API returns a server error | — |
| Action group · email the team | Who gets told when the alert fires | — |
| NSG · nsg-snet-app | Rules for the app subnet: nothing inbound from the internet | — |
| Virtual machine · vm-tools-team01 | The internal IT tools server | — |
| Public IP | The VM’s public address, outbound only after week 6 | — |
| Reader (group) | The team’s group can look at everything and change nothing | — |
| Budget $5 | The $5 guardrail, set before anything can cost money | — |

## Week 1 — Secure by design

> New: the team’s key and the secret under it, the fenced API. The function reads by identity; a denial is proved and the exposure read.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Key vault · kv-capstone-team01-… | Holds secrets the function reads by identity | — |
| Secrets User | Lets the function read secrets, nothing more | — |
| Data Contributor | Lets the function read and write data by identity | — |

**Process — Secure by design:** func → kv (read by identity, under the team key); user → func (CORS: your site only); admin → readerRole (prove a denial, find exposure).

## Week 2 — Resilient compute

> New: a second zone, a load balancer, a fleet of two behind it, and a private path that needs no internet. One address, two zones.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Load balancer · lb-web-team01 · Standard | One address for the fleet; a health probe decides which instance answers | — |
| Public IP · zone-redundant | The balancer’s address, present in every zone | — |
| Azure Bastion · Developer SKU · free | A browser SSH session to the VM with no open port | — |
| NSG · nsg-snet-web | Rules for the web subnet: HTTP from the internet, nothing else | — |
| Scale set · vmss-web-team01 · B1s × 0–3 | The web fleet across two zones, parked at zero between tasks | — |

**Process — Resilient compute:** user → lb (one address); lb → vmss (two zones, healthy targets); bastion → vmss (Bastion in the browser, no port).

## Week 3 — Data and storage

> New: the Multi-AZ database, encrypted and private, and the queue with its dead-letter queue. The right store per workload, the right class per object.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Lifecycle: age-out | Moves blobs to Cool after 30 days and deletes old versions after 90 | — |
| Queue: visits · on the runtime storage | Decouples the counter from the ledger: the API answers now, the write happens when it can | — |
| visits-poison | Where a message the ledger rejects five times ends up | — |
| Data disk | Data that must outlive the operating system | — |
| NSG · nsg-snet-db | Rules for the database subnet: PostgreSQL from the app and web subnets only | — |
| PostgreSQL · flexible server · zone-redundant | The relational store: a standby in another zone, encrypted, no public address | — |

**Process — Data and storage:** vmss → pg (Multi-AZ, encrypted, private); func → visitsQueue (queue the visit); visitsQueue → cosmos (the ledger writes it).

## Week 4 — Scale, monitor, recover

> New: the scaling policy. The fleet grows on CPU and replaces a lost instance; a file and the database come back; the drill is timed.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Soft delete | Brings a deleted or overwritten page back | — |
| Autoscale · CPU 50% / 25% | Adds an instance above 50% average CPU, removes one below 25% | — |

**Process — Scale, monitor, recover:** vmss → lb (scale on CPU, replace the lost one); webBlobService → webStorage (recover the deleted file); admin → pg (restore from the snapshot, time it).

## The roles

| Role | Mission | Drafts | Reviews | Approves | Hands to | Waits on |
| --- | --- | --- | --- | --- | --- | --- |
| Design & Standards (Cloud Architect) | Owns the design, the standards, the cost and each week’s document. | Access Control Matrix & Secrets Register, Network Design Document, Data Store & Runbook, Backup & Disaster Recovery Plan | — | — | Platform Build (Infrastructure Admin), Application Delivery (DevOps Engineer), Security Operations (SecOps Engineer) | — |
| Platform Build (Infrastructure Admin) | Builds the network, the VM, the data and the templates. | — | — | Network Design Document, Data Store & Runbook, Backup & Disaster Recovery Plan | — | Design & Standards (Cloud Architect) |
| Application Delivery (DevOps Engineer) | Ships the website, the API and the pipeline. | — | Access Control Matrix & Secrets Register | — | — | Design & Standards (Cloud Architect) |
| Security Operations (SecOps Engineer) | Locks access down, watches it run, and works the incidents. | — | Network Design Document, Data Store & Runbook, Backup & Disaster Recovery Plan | Access Control Matrix & Secrets Register | — | Design & Standards (Cloud Architect) |

