# CISSP Capstone: Six Releases — build sheet

What the architecture gains each week, what each part is for, which form records it, and the process the week walks through. Generated from the course document by `npm run content:export`; edit the picture module, not this file.

## Week 0 — Scope and ledger

> Where Ridgeline starts: staff, an old server and spreadsheets, and the Hub’s web, API and agent tiers with a third-party model behind them.

You start with:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Office staff | Who the policy binds and who the training reaches | D1 Governance & Risk |
| Old scheduling server | The on-premises server to migrate, then sanitize | D2 Assets & Data |
| Hub web app | What customers and dispatchers see | D8 Software & Change |
| Hub API | The business logic every client and agent calls | D8 Software & Change |
| Dispatch agent | The AI that assigns technicians through the API | D8 Software & Change |
| Database and documents | Where building records, contracts and work orders live | D2 Assets & Data |
| Model provider API | The supplier whose outage stops dispatch | D3 Architecture |
| Largest customer | Sets the contract terms and sends the questionnaire | D1 Governance & Risk |

**Process — Where things stand:** staff → oldserver (spreadsheets and the scheduling app); api → modelapi (AI at the center).

## Week 1 — Release v1

> New: zones, the VPN, the identity provider and device management for the phones. Every domain is written down once, with an owner.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Technicians’ phones | Remote access from the field; the biggest endpoint fleet | D4 Network |
| Device management | Enrols the phones, enforces encryption and remote wipe | D5 Identity |
| Zones and firewall | Separates office, cloud and sensor traffic; default deny | D4 Network |
| VPN remote access | The one recorded path for administrators and phones | D4 Network |
| Identity provider | One account per person, MFA on every administrative login | D5 Identity |
| D1 Governance | Records the policy, risks, legal and supplier registers | D1 Governance & Risk |
| D2 Assets | Records the inventory, classification and categorization | D2 Assets & Data |
| D3 Architecture | Records boundaries, cryptography and shared responsibility | D3 Architecture |
| D4 Network | Records zones, the rule base and remote access | D4 Network |
| D5 Identity | Records accounts, MFA, privileged access and reviews | D5 Identity |
| D6 Assessment | Records the profiles, scores, metrics and the assessment | D6 Assessment |
| D7 Operations | Records logging, incidents, impact, backup and contingency | D7 Operations |
| D8 Software | Records the pipeline gates and change control | D8 Software & Change |
| Release note | Records what each release shipped and its score | Release Note |

**Process — Release v1: one page per domain:** customer → staff (show us your security program); staff → r_d1 (eight sheets, signed by the CEO); phones → vpn (the one path in).

## Week 2 — Release v2

> New: building sensors, key management and the backup vault. Every rule now has a number, an owner and a time limit.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Building sensors | Untrusted devices that feed the failure predictor | D4 Network |
| Key management | Owns the encryption keys and their yearly rotation | D3 Architecture |
| Backup vault | The restore-tested copy the recovery targets depend on | D7 Operations |
| Control statements | Records sixteen controls: who does what, how often | Control Statements |

**Process — Release v2: numbers, owners, time limits:** customer → staff (“promptly” eleven times: give numbers); kms → db (keys owned and rotated); backup → db (recovery targets per process).

## Week 3 — Release v3

> New: the pipeline and the customer’s identity provider. Gates block, TLS 1.2 is refused, and the old server is sanitized.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Pipeline gates | No change reaches production without a scan and a second person | D8 Software & Change |
| Customer identity | Federated sign-on for the customers’ own staff | D5 Identity |

**Process — Release v3: proven in software and cloud:** pipeline → api (a critical finding blocks release); oldserver → db (migrated, then sanitized); custidp → idp (single sign-on by federation).

## Week 4 — Release v4

> New: the AI gateway and the SIEM. A detection fires, a restore matches, and one customer never sees another’s records.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| AI gateway | Tenant separation and a fallback when the provider is down | D3 Architecture |
| Logs and SIEM | Keeps and reviews the logs; raises the detections | D7 Operations |

**Process — Release v4: data, operations and AI:** modelapi → gateway (provider down six hours: fallback); gateway → db (one customer’s records only); backup → db (restore, hashes match); api → siem (the detection fires).

## Week 5 — Release v5

> Nothing new is built: every control is assessed, the questionnaire is answered with evidence, and a tabletop tests the plans.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Questionnaire | Records the sixteen answers, each with evidence | Customer Questionnaire Response |

**Process — Release v5: tested:** customer → r_questionnaire (sixteen questions, each with evidence); staff → firewall (re-test TLS and segmentation); siem → staff (tabletop: four injects).

## Week 6 — Release v6

> New: the federal boundary and the plan. Basic safeguarding has evidence, the SP 800-171 gaps have dates, and the SSP is assembled.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Federal boundary | The information that must stay inside authorized services | D1 Governance & Risk |
| SSP (capstone) | The system security plan and traceability matrix | System Security Plan & Traceability |

**Process — Release v6: federal-ready:** federal → staff (show basic safeguarding); db → federal (federal information stays inside); r_d6 → r_ssp (the plan assembled).

## The roles

| Role | Mission | Drafts | Reviews | Approves | Hands to | Waits on |
| --- | --- | --- | --- | --- | --- | --- |
| Governance & Risk (Program Lead) | Policy, assets, risk and the maturity score: the program’s spine. | D1 Governance & Risk, D2 Assets & Data, D6 Assessment, Release Note, Customer Questionnaire Response, Control Statements, System Security Plan & Traceability | — | D1 Governance & Risk, D2 Assets & Data, D3 Architecture, D4 Network, D5 Identity, D6 Assessment, D7 Operations, D8 Software & Change, Release Note, Customer Questionnaire Response, Control Statements, System Security Plan & Traceability | Architecture & Network (Security Architect) | Architecture & Network (Security Architect), Identity & Operations (Operations Lead) |
| Architecture & Network (Security Architect) | The cloud design, the network zones and the change pipeline. | D3 Architecture, D4 Network, D8 Software & Change | D1 Governance & Risk, D2 Assets & Data, D5 Identity, D6 Assessment, D7 Operations, Release Note, Customer Questionnaire Response, Control Statements, System Security Plan & Traceability | — | Governance & Risk (Program Lead), Identity & Operations (Operations Lead) | Governance & Risk (Program Lead), Identity & Operations (Operations Lead) |
| Identity & Operations (Operations Lead) | Identity, access, logging, incident response and recovery. | D5 Identity, D7 Operations | D3 Architecture, D4 Network, D8 Software & Change | — | Governance & Risk (Program Lead), Architecture & Network (Security Architect) | Architecture & Network (Security Architect) |

