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

> New: the secret store and the roles. The function reads by identity; readers only read.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Key vault · kv-capstone-team01-… | Holds secrets the function reads by identity | — |
| Secrets User | Lets the function read secrets, nothing more | — |
| Data Contributor | Lets the function read and write data by identity | — |

**Process — Identity:** func → kv (read by identity, no key); admin → readerRole (least privilege for readers).

## Week 2 — Networking

> New: the management subnet and the admin path with no open port. SSH is gone.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| NSG · nsg-snet-mgmt | Rules for the management subnet: nothing from the internet | — |
| Azure Bastion · Developer SKU · free | A browser SSH session to the VM with no open port | — |

**Process — Networking:** admin → bastion (Bastion in the browser, no port); user → func (CORS: your site only).

## Week 3 — Server Admin

> New: the data disk. The VM is patched, measured and right-sized.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Data disk | Data that must outlive the operating system | — |

**Process — Server admin:** admin → dataDisk (attach and mount); admin → vm (patch and baseline).

## Week 4 — Backup and Recovery

> New: the backup protection — soft delete on Azure, a daily AWS Backup plan. Snapshot, restore, time it, and recover a deleted file.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Soft delete | Brings a deleted or overwritten page back | — |

**Process — Backup and recovery:** admin → dataDisk (snapshot); dataDisk → vm (restore and time it); webBlobService → webStorage (recover the deleted file).

