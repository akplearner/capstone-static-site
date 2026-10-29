# AWS Certified AI Practitioner — the Bedrock Studio — build sheet

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

> New: the responsible-AI guidelines assessed, a model scored, and a wrong answer worked to grounded.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Training and metrics | A model scored against a labelled set, so accuracy means a number | Responsible AI Assessment |
| Responsible AI | A finding and a mitigation per guideline, and the deployment decision | Responsible AI Assessment |
| Grounding log | A wrong answer worked to grounded, the failed theories kept | Evaluation & Grounding Log |
| 3 Responsible AI | Records the six guidelines and the deployment decision | Responsible AI Assessment |
| 4 Evaluation log | Records each wrong answer worked to grounded | Evaluation & Grounding Log |

**Process — Week 2: weigh it, and work a wrong answer:** ml → responsible (scored and assessed); app → eval (wrong answer worked to grounded).

## Week 3 — Build on Bedrock

> New: a model invoked on Bedrock, a grounded chat app, and the language and document senses.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Model access | Access to one foundation model, requested in the Bedrock console | Bedrock Build Record |
| Bedrock model | A foundation model answered through the Bedrock runtime | Bedrock Build Record |
| Grounded app | Answers only from the studio documents, and says when they are silent | Bedrock Build Record |
| Comprehend | Reads sentiment and key phrases out of text | Language & Extraction Log |
| Textract | Reads the text out of a scanned document | Language & Extraction Log |
| 5 Bedrock build | Records the invoked model and the grounded app | Bedrock Build Record |
| 6 Services & agent | Records the language, document and extraction calls | Language & Extraction Log |

**Process — Week 3: invoke, build the app, add the senses:** model → app (invoked and served); notes → app (grounded on the documents); language → app (language added); vision → agent (document read).

## Week 4 — Secure and hand over

> New: an agent that extracts JSON, least-privilege IAM and a guardrail, the custody log, and the solution torn down.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Extraction agent | Reads a document into structured JSON, a missing field left null | Language & Extraction Log |
| IAM & risks | Least-privilege IAM, a guardrail, and each risk with an owner | Security, Governance & Risk Register |
| Custody | A hash for every artifact the course produced | Handover & Solution Record |
| 7 Security & risks | Records the IAM, the guardrail, the risks and owners | Security, Governance & Risk Register |
| 8 Handover | The capstone: the solution as it is, with custody for every artifact | Handover & Solution Record |
| 9 Portfolio | The repository, case study, resume bullets and diagram | Portfolio |

**Process — Week 4: the agent, the security, the handover:** vision → agent (document to JSON); responsible → govern (risks owned); agent → custody (every artifact hashed); custody → r_handover (handed over).

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
| AI Concepts (Capabilities Lead) | Leads the capabilities map and the responsible-AI assessment: what each workload does and its risks. | AI Workloads & Capabilities Map, Responsible AI Assessment | Security, Governance & Risk Register | Studio Setup & Access Register, Evaluation & Grounding Log, Handover & Solution Record, Portfolio | Bedrock Build (Solution Lead), Language & Documents (Services Lead), Studio Records (Governance Lead) | Studio Records (Governance Lead) |
| Bedrock Build (Solution Lead) | Leads the build record: the invoked model, the chat app and the agent on Bedrock. | Bedrock Build Record | Studio Setup & Access Register, Language & Extraction Log, Handover & Solution Record, Portfolio | Responsible AI Assessment, Security, Governance & Risk Register | Language & Documents (Services Lead), Studio Records (Governance Lead) | AI Concepts (Capabilities Lead), Language & Documents (Services Lead), Studio Records (Governance Lead) |
| Language & Documents (Services Lead) | Leads the services log: text, sentiment and the data read from a document. | Language & Extraction Log | AI Workloads & Capabilities Map, Evaluation & Grounding Log, Bedrock Build Record | — | Bedrock Build (Solution Lead), Studio Records (Governance Lead) | AI Concepts (Capabilities Lead), Bedrock Build (Solution Lead), Studio Records (Governance Lead) |
| Studio Records (Governance Lead) | Leads the records that outlive the studio: evaluation, the risk register, custody and handover. | Studio Setup & Access Register, Evaluation & Grounding Log, Security, Governance & Risk Register, Handover & Solution Record, Portfolio | Responsible AI Assessment | AI Workloads & Capabilities Map, Bedrock Build Record, Language & Extraction Log | AI Concepts (Capabilities Lead), Bedrock Build (Solution Lead), Language & Documents (Services Lead) | AI Concepts (Capabilities Lead), Bedrock Build (Solution Lead), Language & Documents (Services Lead) |

