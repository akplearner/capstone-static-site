# Azure AI Fundamentals — the Foundry Studio — build sheet

What the architecture gains each week, what each part is for, which form records it, and the process the week walks through. Generated from the course document by `npm run content:export`; edit the picture module, not this file.

## Week 0 — Set up the studio

> The account with a budget guard, a local model running offline, and the studio folder ready.

You start with:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Local model | A model small enough for a laptop, to learn grounding offline | Studio Setup & Access Register |
| Studio folder | Every prompt, transcript and output, under the week it belongs to | Studio Setup & Access Register |
| 1 Setup & access | Records the account, the budget guard and the local models | Studio Setup & Access Register |

**Process — Set up: the account, a local model, the folder:** ollama → folder (model pulled, runs offline).

## Week 1 — Identify the AI

> New: the workloads named, the model read from its own output, and a local answer grounded in the notes.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Studio notes | The text the assistant is made to answer from, and cite | AI Workloads & Capabilities Map |
| Capabilities map | Every feature tagged with its workload and the service behind it | AI Workloads & Capabilities Map |
| 2 Capabilities map | Records the workloads, their services and their limits | AI Workloads & Capabilities Map |

**Process — Week 1: name the workloads, ground a local answer:** ollama → notes (answers from the notes); notes → workloads (mapped to workloads).

## Week 2 — Weigh the AI

> New: the six responsible-AI principles assessed, a model scored, and a wrong answer worked to grounded.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Training and metrics | A model scored against a labelled set, so accuracy means a number | Responsible AI Assessment |
| Responsible AI | A finding and a mitigation per principle, and the deployment decision | Responsible AI Assessment |
| Grounding log | A wrong answer worked to grounded, the failed theories kept | Evaluation & Grounding Log |
| 3 Responsible AI | Records the six principles and the deployment decision | Responsible AI Assessment |
| 4 Evaluation log | Records each wrong answer worked to grounded | Evaluation & Grounding Log |

**Process — Week 2: weigh it, and work a wrong answer:** ml → responsible (scored and assessed); app → eval (wrong answer worked to grounded).

## Week 3 — Build with Foundry

> New: a model deployed in Foundry, a grounded chat app, and the language and vision senses.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Foundry project | The project a deployment, data and an agent all sit in | Foundry Build Record |
| Deployed model | A model deployed in Foundry, callable through the endpoint | Foundry Build Record |
| Grounded app | Answers only from the studio documents, and says when they are silent | Foundry Build Record |
| Language service | Reads sentiment and key phrases out of text | Language, Vision & Extraction Log |
| Vision service | Reads the text out of a picture | Language, Vision & Extraction Log |
| 5 Foundry build | Records the deployed model and the grounded app | Foundry Build Record |
| 6 Services & agent | Records the language, vision and extraction calls | Language, Vision & Extraction Log |

**Process — Week 3: deploy, build the app, add the senses:** model → app (deployed and served); notes → app (grounded on the documents); language → app (language added); vision → agent (vision read).

## Week 4 — Ship and hand over

> New: an agent that extracts JSON, the risk register, the custody log, and the solution handed over and stopped.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Extraction agent | Reads a document into structured JSON, a missing field left null | Language, Vision & Extraction Log |
| Risk register | Each risk with a likelihood, an impact, an owner and a mitigation | AI Governance & Risk Register |
| Custody | A hash for every artifact the course produced | Handover & Solution Record |
| 7 Risk register | Records the risks, owners and mitigations | AI Governance & Risk Register |
| 8 Handover | The capstone: the solution as it is, with custody for every artifact | Handover & Solution Record |
| 9 Portfolio | The repository, case study, resume bullets and diagram | Portfolio |

**Process — Week 4: the agent, the governance, the handover:** vision → agent (document to JSON); responsible → govern (risks owned); agent → custody (every artifact hashed); custody → r_handover (handed over).

## Week 5 — RAG engineering: Index your documents

Nothing new is built this week; the process is drawn over the picture.

## Week 6 — RAG engineering: Evaluate the answers

Nothing new is built this week; the process is drawn over the picture.

## Week 7 — AI agents and MCP: An agent with tools

Nothing new is built this week; the process is drawn over the picture.

## Week 8 — AI agents and MCP: Expose a tool over MCP

Nothing new is built this week; the process is drawn over the picture.

## The roles

| Role | Mission | Drafts | Reviews | Approves | Hands to | Waits on |
| --- | --- | --- | --- | --- | --- | --- |
| AI Concepts (Capabilities Lead) | Leads the capabilities map and the responsible-AI assessment: what each workload does and its risks. | AI Workloads & Capabilities Map, Responsible AI Assessment | AI Governance & Risk Register | Studio Setup & Access Register, Evaluation & Grounding Log, Handover & Solution Record, Portfolio | Foundry Build (Solution Lead), Language & Vision (Services Lead), Studio Records (Governance Lead) | Studio Records (Governance Lead) |
| Foundry Build (Solution Lead) | Leads the build record: the deployed model, the chat app and the agent in Foundry. | Foundry Build Record | Studio Setup & Access Register, Language, Vision & Extraction Log, Handover & Solution Record, Portfolio | Responsible AI Assessment, AI Governance & Risk Register | Language & Vision (Services Lead), Studio Records (Governance Lead) | AI Concepts (Capabilities Lead), Language & Vision (Services Lead), Studio Records (Governance Lead) |
| Language & Vision (Services Lead) | Leads the services log: text, speech, vision and the data read from a document. | Language, Vision & Extraction Log | AI Workloads & Capabilities Map, Evaluation & Grounding Log, Foundry Build Record | — | Foundry Build (Solution Lead), Studio Records (Governance Lead) | AI Concepts (Capabilities Lead), Foundry Build (Solution Lead), Studio Records (Governance Lead) |
| Studio Records (Governance Lead) | Leads the records that outlive the studio: evaluation, the risk register, custody and handover. | Studio Setup & Access Register, Evaluation & Grounding Log, AI Governance & Risk Register, Handover & Solution Record, Portfolio | Responsible AI Assessment | AI Workloads & Capabilities Map, Foundry Build Record, Language, Vision & Extraction Log | AI Concepts (Capabilities Lead), Foundry Build (Solution Lead), Language & Vision (Services Lead) | AI Concepts (Capabilities Lead), Foundry Build (Solution Lead), Language & Vision (Services Lead) |

