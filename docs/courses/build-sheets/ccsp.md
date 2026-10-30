# CCSP — the Cloud Assurance — build sheet

What the architecture gains each week, what each part is for, which form records it, and the process the week walks through. Generated from the course document by `npm run content:export`; edit the picture module, not this file.

## Week 0 — Set up the engagement

> The account with a budget guard, an MFA identity, and the scope written: the app, its data and the obligation.

You start with:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Scope | The application, its data and the obligation in scope | Engagement & Scope Register |
| 1 Engagement & scope | Records the account, the scope and the identity | Engagement & Scope Register |

**Process — Set up: the account, an MFA identity, the scope:** scope → arch (the boundary is written).

## Week 1 — Architecture and the law

> New: the shared-responsibility line, the reference architecture, and the obligations mapped to controls.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Responsibility | Who secures each layer, provider or customer, for this model | Architecture & Responsibility |
| Architecture | Every component and its trust boundary | Architecture & Responsibility |
| Control mapping | Obligations mapped to controls, with the residency rule | Legal, Risk & Compliance |
| Compliance | The obligations, residency and top risks, owned | Legal, Risk & Compliance |
| 2 Architecture | Records the responsibility line and the architecture | Architecture & Responsibility |
| 3 Legal & compliance | Records the obligations, residency and risks | Legal, Risk & Compliance |

**Process — Week 1: shared responsibility, the architecture, the law:** resp → arch (who secures what); scope → legalmap (obligations mapped); legalmap → legal (residency and risk).

## Week 2 — Cloud data security

> New: every data set classified, the store locked, and a customer-owned key with rotation and retention.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Classified data | Every data set classified so the rules can apply | Data Security Record |
| Customer key | A customer-owned key with rotation and retention | Data Security Record |
| 4 Data security | Records the classification, the key and the decision | Data Security Record |

**Process — Week 2: classify it, protect it, own the key:** classify → key (encrypted with a customer key).

## Week 3 — Platform and application security

> New: the platform baseline passing, the network segmented, and the application clean of secrets and critical CVEs.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Platform baseline | The platform baseline, scanned, every failing control owned | Platform & Network Record |
| Network | Segmented so the private tier has no public route | Platform & Network Record |
| The application | The application, scanned for secrets and vulnerable dependencies | Application Security Record |
| Lifecycle gate | The lifecycle gate that blocks a failing build | Application Security Record |
| 5 Platform & network | Records the baseline and the segmentation | Platform & Network Record |
| 6 Application security | Records the secret and dependency scans | Application Security Record |

**Process — Week 3: fence the platform, secure the build:** baseline → network (baseline passes, segmented); network → appcode (the application fenced); gate → appcode (no secrets, no critical CVE).

## Week 4 — Operations and compliance

> New: monitoring that pages, the incident contained one change per row, and every control mapped to its evidence.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Monitoring | Monitoring and alerts that route to a human | Operations & Incident Log |
| The actor | The actor the incident is worked against | Operations & Incident Log |
| Incident log | The incident contained one action per row, failures kept | Operations & Incident Log |
| Custody | A hash for every control evidence the course produced | Cloud Security Handover |
| 7 Operations & incident | Records monitoring, change and the incident | Operations & Incident Log |
| 8 Handover | The capstone: every control mapped to its evidence, with custody | Cloud Security Handover |
| 9 Portfolio | The repository, case study, resume bullets and diagram | Portfolio |

**Process — Week 4: operate, work the incident, hand over:** appcode → monitor (watched, alerts route); actor → incident (contained one change per row); custody → r_handover (controls mapped, custody handed over).

## Week 5 — AI security validation: Attack the model

Nothing new is built this week; the process is drawn over the picture.

## Week 6 — AI security validation: A suite that holds

Nothing new is built this week; the process is drawn over the picture.

## Week 7 — Enterprise AI architect: Design the hybrid platform

Nothing new is built this week; the process is drawn over the picture.

## Week 8 — Enterprise AI architect: Govern the platform

Nothing new is built this week; the process is drawn over the picture.

## The roles

| Role | Mission | Drafts | Reviews | Approves | Hands to | Waits on |
| --- | --- | --- | --- | --- | --- | --- |
| Cloud Data Security (Data Lead) | Leads the data record: classification, encryption, key ownership and retention. | Data Security Record | Architecture & Responsibility, Legal, Risk & Compliance | Engagement & Scope Register, Operations & Incident Log, Cloud Security Handover, Portfolio | Platform & Infrastructure (Platform Lead), Governance & Operations (GRC Lead) | Platform & Infrastructure (Platform Lead), Governance & Operations (GRC Lead) |
| Platform & Infrastructure (Platform Lead) | Leads the platform record: the reference architecture, the network and the controls. | Architecture & Responsibility, Platform & Network Record | Engagement & Scope Register, Application Security Record, Operations & Incident Log, Cloud Security Handover, Portfolio | Legal, Risk & Compliance, Data Security Record | Cloud Data Security (Data Lead), Application Security (AppSec Lead), Governance & Operations (GRC Lead) | Cloud Data Security (Data Lead), Application Security (AppSec Lead), Governance & Operations (GRC Lead) |
| Application Security (AppSec Lead) | Leads the application record: the secure lifecycle, the secrets and the dependencies. | Application Security Record | Platform & Network Record | — | Platform & Infrastructure (Platform Lead), Governance & Operations (GRC Lead) | Platform & Infrastructure (Platform Lead) |
| Governance & Operations (GRC Lead) | Leads the records that outlive the build: law, operations, the incident and handover. | Engagement & Scope Register, Legal, Risk & Compliance, Operations & Incident Log, Cloud Security Handover, Portfolio | Data Security Record | Architecture & Responsibility, Platform & Network Record, Application Security Record | Cloud Data Security (Data Lead), Platform & Infrastructure (Platform Lead) | Cloud Data Security (Data Lead), Platform & Infrastructure (Platform Lead), Application Security (AppSec Lead) |

