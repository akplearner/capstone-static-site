# Azure Fundamentals Capstone — build sheet

What the architecture gains each week, what each part is for, which form records it, and the process the week walks through. Generated from the course document by `npm run content:export`; edit the picture module, not this file.

## Week 1 — Cloud concepts and governance

> New: the budget, the group and the network. The standard everything else is named by.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Budget $5 | The $5 guardrail, set before anything can cost money | — |

**Process — Set the standard:** admin → budget (the $5 budget); admin → rg (the group and the network).

## Week 2 — Core services

> New: the VM, the storage site and the firewall. The company is on the internet, over HTTPS.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Storage account · stweb… ($web) | Hosts the company website over HTTPS | — |
| NSG · nsg-snet-app | Rules for the app subnet: SSH from management only | — |
| Virtual machine · vm-tools-team01 | The internal IT tools server | — |
| Public IP | The VM’s public address, outbound only after week 6 | — |

**Process — Core services:** user → webStorage (the site, over HTTPS); admin → vm (SSH from one address only).

## Week 3 — Serverless, data and identity

> New: the function, the database and the identity pieces. A page view becomes a count.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Function app · func-capstone-team01 | The visitor-counter API | — |
| Azure Cosmos DB · serverless | The database the counter lives in | — |
| App Insights · appi-capstone-team01 | Requests, failures and traces from the function | — |
| Log Analytics · log-capstone-team01 | Where every log and metric ends up | — |
| Reader (group) | The team’s group can look at everything and change nothing | — |

**Process — The visitor counter:** user → func (GET the count); func → cosmos (count + 1).

## Week 4 — Monitor, govern, pay

> New: the alert and who it emails. Break it on purpose and watch the alert win.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Alert: Http5xx · alert-func-5xx | Fires when the API returns a server error | — |
| Action group · email the team | Who gets told when the alert fires | — |

**Process — The incident loop:** func → http5xxAlert (server errors); http5xxAlert → actionGroup (email the team); admin → func (find it, fix it, retest).

