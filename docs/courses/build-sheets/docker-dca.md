# Docker Certified Associate — the Container Yard — build sheet

What the architecture gains each week, what each part is for, which form records it, and the process the week walks through. Generated from the course document by `npm run content:export`; edit the picture module, not this file.

## Week 0 — Set up the yard

> The engine and Compose installed and proven, and the yard folder ready.

You start with:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| 1 Install & env | Records the engine, Compose and the team | Install & Environment Register |

**Process — Set up: engine, Compose, the yard folder:** dockerfile → image (engine ready to build).

## Week 1 — Build the image

> New: the image built from a Dockerfile, tagged, pushed and pulled back, and the daemon configured.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Dockerfile | The recipe the image is built from, small by design | Image Build & Registry Record |
| App image | The built, tagged artifact the whole stack runs | Image Build & Registry Record |
| Registry | Where the image is shipped from; the digest is its true name | Image Build & Registry Record |
| Daemon config | The storage and logging the engine runs with | Image Build & Registry Record |
| 2 Image & registry | Records the Dockerfile, the tags and the registry | Image Build & Registry Record |

**Process — Week 1: build, tag, push, configure:** dockerfile → image (built and tagged); image → registry (pushed and pulled back); daemon → image (driver and log cap set).

## Week 2 — Orchestrate the stack

> New: the stack composed, deployed to a Swarm as services, scaled, and a bad update rolled back.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Compose stack | The multi-container stack as one versioned file | Stack & Orchestration Record |
| Swarm services | The stack as desired-state services across replicas | Stack & Orchestration Record |
| Scale & rollback | Scaling up and rolling a bad deploy back | Stack & Orchestration Record |
| Running app | The app container serving behind a healthcheck | Stack & Orchestration Record |
| 3 Stack & orchestration | Records Compose, Swarm, scaling and rollback | Stack & Orchestration Record |

**Process — Week 2: compose, swarm, scale, roll back:** registry → compose (image pulled into the stack); compose → swarm (deployed as services); swarm → scale (scaled and rolled back).

## Week 3 — Network and persist

> New: the user network and name resolution, the data on a named volume, and a connectivity fault worked.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Database | The stateful service whose data lives on a volume | Networking & Storage Record |
| User network | The network containers resolve each other by name on | Networking & Storage Record |
| Published ports | The host ports that reach the app | Networking & Storage Record |
| Named volume | Where the data outlives any one container | Networking & Storage Record |
| Connectivity fault | A broken connection worked to a proven fix, failures kept | Container Troubleshooting Log |
| 4 Network & storage | Records the networks, ports and volumes | Networking & Storage Record |
| 5 Troubleshooting log | Records the fault worked one change per row | Container Troubleshooting Log |

**Process — Week 3: network, persist, work the fault:** network → app_run (resolves by name); db → volume (data survives recreate); ports → fault (connectivity worked).

## Week 4 — Harden and hand over

> New: the image scanned, run non-root with no secret, the base decided, and the stack handed over and torn down.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Image scan | The vulnerabilities in the image, found before an attacker does | Image Security & Hardening Record |
| Hardening | The image run least-privileged, secrets kept out | Image Security & Hardening Record |
| Custody | A hash for every artifact the course produced | Handover & As-Built |
| 6 Security & hardening | Records the scan, the hardening and the base decision | Image Security & Hardening Record |
| 7 Handover | The capstone: the stack as it is, with custody for every artifact | Handover & As-Built |
| 8 Portfolio | The repository, case study, resume bullets and diagram | Portfolio |

**Process — Week 4: scan, harden, hand over:** image → scan (vulnerabilities found); scan → harden (non-root, secrets out); harden → custody (every artifact hashed); custody → r_handover (handed over).

## Week 5 — Local LLM serving: Serve a model locally

Nothing new is built this week; the process is drawn over the picture.

## Week 6 — RAG engineering: Index your documents

Nothing new is built this week; the process is drawn over the picture.

## Week 7 — RAG engineering: Evaluate the answers

Nothing new is built this week; the process is drawn over the picture.

## The roles

| Role | Mission | Drafts | Reviews | Approves | Hands to | Waits on |
| --- | --- | --- | --- | --- | --- | --- |
| Images (Build Lead) | Leads the image record: the Dockerfile, the tags, the registry and the scan. | Image Build & Registry Record, Image Security & Hardening Record | Install & Environment Register | Handover & As-Built, Portfolio | Orchestration (Stack Lead), Operations (Records Lead) | Operations (Records Lead) |
| Orchestration (Stack Lead) | Leads the stack record: Compose, the Swarm services, scaling and rollback. | Stack & Orchestration Record | Networking & Storage Record, Handover & As-Built, Portfolio | Install & Environment Register, Image Build & Registry Record, Container Troubleshooting Log, Image Security & Hardening Record | Networking & Storage (Platform Lead), Operations (Records Lead) | Images (Build Lead), Networking & Storage (Platform Lead), Operations (Records Lead) |
| Networking & Storage (Platform Lead) | Leads the network and volume record: the container networks, the ports and the data. | Networking & Storage Record | Stack & Orchestration Record, Container Troubleshooting Log | — | Orchestration (Stack Lead), Operations (Records Lead) | Orchestration (Stack Lead), Operations (Records Lead) |
| Operations (Records Lead) | Leads the records that outlive the yard: hardening, the runbook, custody and handover. | Install & Environment Register, Container Troubleshooting Log, Handover & As-Built, Portfolio | Image Build & Registry Record, Image Security & Hardening Record | Stack & Orchestration Record, Networking & Storage Record | Images (Build Lead), Orchestration (Stack Lead), Networking & Storage (Platform Lead) | Images (Build Lead), Orchestration (Stack Lead), Networking & Storage (Platform Lead) |

