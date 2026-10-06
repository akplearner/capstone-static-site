# SecAI+ Capstone: Four Releases — build sheet

What the architecture gains each week, what each part is for, which form records it, and the process the week walks through. Generated from the course document by `npm run content:export`; edit the picture module, not this file.

## Week 0 — Lab and ground rules

> The product as found: portal, agent and tools on one runtime, the models and the retrieval store, every planted weakness in place.

You start with:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Customer | Asks the assistant about buildings and contracts; the first attacker role | P1 System Map |
| Technician | Uses the assistant and the dispatch agent from the field | P1 System Map |
| Office staff | Paste contracts into public chatbots until the tool rules exist | P5 Governance Pack |
| Customer portal | Where customers and technicians ask the assistant | P1 System Map |
| Dispatch agent | Assigns technicians and sends messages through its tools | P1 System Map |
| Work-order + email tools | What the agent can touch; scoped tokens and an approval for email | P1 System Map |
| Runtime hosting | Where the portal, agent and gateway run | P1 System Map |
| Language model | Answers the prompts the gateway forwards | P1 System Map |
| Retrieval store | The documents the model reads; poisoned if intake is missing | P1 System Map |
| Failure predictor | Rates equipment failure; its training data is of unknown origin | P1 System Map |
| Lab rule & ledger | Records the lab rule and the hashed evidence ledger | Lab Rule & Evidence Ledger |

**Process — The product as found:** customer → portal (asks a question); portal → llm (prompt with the key inside); llm → retrieval (reads manuals and records).

## Week 1 — Release v1

> New: identity, the gateway, the secret store, logging and the governance pack. The key leaves the prompt; every attempt is logged.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Identity (SSO) | Who each caller is, before any gateway key is issued | P3 Control Set |
| AI gateway | The only path to the model: per-key limits, every call logged | P3 Control Set |
| Secret store | Holds the API keys the prompt used to carry; rotated | P3 Control Set |
| Logs and traces | Every request and answer, redacted before it is written | P4 Watch Plan |
| P1 System map | Records every model, prompt structure and data writer | P1 System Map |
| P2 Attack casebook | Records each proved attack case with its evidence | P2 Attack Casebook |
| P3 Control set | Records every control: who, how often, with what, the record | P3 Control Set |
| P4 Watch plan | Records logging, thresholds, detections and the handover | P4 Watch Plan |
| P5 Governance pack | Records the policy, risks, rules, procedures and sign-offs | P5 Governance Pack |
| Release note | Records what each release shipped and what stays open | Release Note |

**Process — Release v1: stop the leak:** customer → gateway (print your hidden instructions); idp → gateway (a key per known caller); gateway → llm (rate-limited, no key inside); gateway → logs (every attempt logged).

## Week 2 — Release v2

> New: the WAF, guardrails, document intake and alerts. A poisoned work order is quarantined; the agent cannot email without a person.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Outside inbox | The address a hijacked agent would email; proves the approval gate | P2 Attack Casebook |
| WAF and edge | Stops floods and oversized requests before they reach the portal | P3 Control Set |
| Document intake | Scans uploaded work orders before the retrieval store sees them | P3 Control Set |
| Guardrails | Screens prompts in and answers out; the attack suite tests it | P3 Control Set |
| Wazuh alerts | Turns gateway logs into alerts with an owner | P4 Watch Plan |

**Process — Release v2: the poisoned work order:** intake → retrieval (scanned before it is stored); agent → tools (scoped token, no admin); tools → outside (outbound email needs approval); logs → siem (thresholds with an owner).

## Week 3 — Release v3

> New: the pipeline, backups, the quality audit and the staff’s own AI tools. A missing guardrail blocks the build.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Staff AI tools | Which AI tools staff may use, with what data | P5 Governance Pack |
| Backups | A restorable copy of the store and the gateway configuration | P3 Control Set |
| Pipeline gates | Blocks a release that fails the scans or the attack suite | P3 Control Set |
| Quality audit | Measures accuracy, refusals and bias on a fixed sample | P4 Watch Plan |

**Process — Release v3: automated and measured:** pipeline → guardrail (guardrail removed: build blocked); logs → siem (injection pattern raises an alert); audit → llm (twenty questions, scored); staff → governance (a decision for every tool).

## Week 4 — Release v4

> Nothing new is built: a clean copy is rebuilt from the backups, matches v3, alerts on all six, and the customers get evidence.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| v4 Release package | The capstone: the proven product and the assurance answers | Release v4 Package & Assurance Response |

**Process — Release v4: proven and handed over:** backup → runtime (clean rebuild, same results); siem → governance (six of six alerts); governance → customer (three answers, with evidence).

## The roles

| Role | Mission | Drafts | Reviews | Approves | Hands to | Waits on |
| --- | --- | --- | --- | --- | --- | --- |
| AI Assurance Testing (AI Red Team) | Tests the Hub’s AI on a dedicated instance and proves each case. | P2 Attack Casebook | P3 Control Set, P4 Watch Plan, Release v4 Package & Assurance Response | — | AI Controls Engineering (AI Defender), AI Governance (Governance Lead) | AI Controls Engineering (AI Defender), AI Governance (Governance Lead) |
| AI Controls Engineering (AI Defender) | Builds the controls, logging and alerts that stop and catch each case. | P3 Control Set, P4 Watch Plan | Lab Rule & Evidence Ledger, P1 System Map, P2 Attack Casebook, P5 Governance Pack, Release Note | — | AI Assurance Testing (AI Red Team), AI Governance (Governance Lead) | AI Assurance Testing (AI Red Team), AI Governance (Governance Lead) |
| AI Governance (Governance Lead) | Maps the system, owns the risks and rules, and signs each release. | Lab Rule & Evidence Ledger, P1 System Map, P5 Governance Pack, Release Note, Release v4 Package & Assurance Response | — | Lab Rule & Evidence Ledger, P1 System Map, P2 Attack Casebook, P3 Control Set, P4 Watch Plan, P5 Governance Pack, Release Note, Release v4 Package & Assurance Response | AI Assurance Testing (AI Red Team), AI Controls Engineering (AI Defender) | AI Assurance Testing (AI Red Team), AI Controls Engineering (AI Defender) |

