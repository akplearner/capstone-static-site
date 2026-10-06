# Capstone Labs — Architecture (North Star)

> **The end goal.** What this platform becomes if we build it right. This is the destination;
> [`CURRENT_STATE.md`](./CURRENT_STATE.md) is where we are today and [`ROADMAP.md`](./ROADMAP.md) is the
> staged path between them.
> **Status:** north-star reference · **Audience:** anyone building or evaluating the platform.

---

## 0. The spine, in one line

**Immutable, signed, consented events → anchored to a competency/control ontology → proven by
state-reading validators against versioned environments → projected into human metrics, signed
attestations, and MSP posture reports.**

Own that pipeline and the data it produces, and the platform compounds in value as agents arrive.

**Thesis / the moat:** the durable asset is **verified, consented, framework-mapped behavioral data bound
to reproducible environments**, plus the ontology and validators that make it trustworthy and
interoperable. Data ownership alone is necessary, not sufficient.

---

## 1. Where durable value accrues (the seven layers)

1. **Verification / ground truth** — validators that grade by reading real system state. The oracle.
2. **Competency ontology** — the machine-readable skill graph; the interlingua for agent-to-agent interop.
3. **Environments-as-code** — versioned, reproducible, seed-stated substrate agents can be tested in.
4. **Attestation authority** — signed, framework-mapped proof of demonstrated capability (human or agent).
5. **Human→agent data flywheel** — verified runs become labeled trajectories for training *and* eval.
6. **Provenance + consent** — what makes owned data legally usable and tradeable.
7. **Owned network effects** — CLA-assigned contributions compound as assets, not liabilities.

**Design rule:** every datum should be **owned, provenanced, consented, ontology-mapped, and (where
possible) tied to a verified outcome**. If it isn't, it's noise.

---

## 2. Domain model — content as a graph

Content (environments, configs, frameworks, methodologies, tools, SOPs, benchmarks, baselines, policies)
is **not "files"** — it's a graph of typed entities anchored to **published objective codes**.

| Entity | What it is | Key links |
|--------|-----------|-----------|
| **Framework** | NIST CSF, CIS, OWASP, ISO 27001, PTES, 800-61 | has many Controls |
| **Control / Objective** | `ID.AM`, `CIS 5.x`, `OWASP A03` — the published code | mapped from Competency, Validator, Policy |
| **Competency** | atomic capability ("configure UFW least-privilege") | ↔ Control, ↔ CertObjective, ↔ Task |
| **CertObjective** | exam objective code (Security+ SY0-7xx) | ↔ Competency |
| **Tool** | nmap, ufw, sqlmap… (+ version, role) | used by Task |
| **Environment** | declarative IaC: hosts, network, services, seed state | versioned; referenced by Scenario |
| **Scenario / Lab** | environment + ordered Tasks + Validators + mappings | the **CLA-owned unit of contribution** |
| **Task / Step** | one performed action | uses Tools, yields Artifacts, ↔ Competency |
| **Validator** | reads env state → pass/fail + evidence | ↔ Control; the defensible asset |
| **Benchmark / Baseline** | known-good state (CIS baseline) | ground truth for Validators |
| **SOP / Playbook** | ordered procedure (the flow/methodology) | references Tasks/Tools |
| **Policy** | governance doc | ↔ Control |
| **Deliverable** | the report artifacts | ↔ Competency, ↔ Control |

**Anchor everything to Control/CertObjective codes** — that mapping *is* the value proposition (you test
what the cert/framework actually tests) and the join key for MSP/audit reuse.

---

## 3. The behavioral layer — event sourcing + CQRS

The immutable event log is the durable asset; everything else is a **recomputable projection**.

- **Attempt / Run** — a subject (learner *or agent*) executing a Scenario instance against an Environment
  instance.
- **Event** — append-only, immutable, signed. Every action: step started/completed, command issued,
  validator result, artifact submitted, gate cleared, scope/ethics flag. **Shaped as xAPI**
  (actor-verb-object-result).
- **Measurement** — derived, recomputable metrics projected from events (never the source of truth).
- **Outcome / Attestation** — verified result: competency demonstrated, env-hash, validator results,
  signed.
- **Consent** — per-subject record of allowed uses (train, share, benchmark, sell-aggregate).

**CQRS:** commands mutate by appending events; read models (dashboards, metrics, leaderboards, MSP
reports) are projections rebuilt from the log. This is the concrete form of "enrich at ingest, serve from
the database."

### Metrics that matter (projected from events, aligned to the rubric)
- Competency mastery = validator pass × **confidence calibration** (did stated confidence match outcome).
- Process adherence (flow order), documentation completeness, evidence-naming compliance.
- Effort/time **measured but never rewarded** (the rubric is not speed).
- Org-level (MSP): control coverage %, mean-time-to-remediate, drift from baseline.

---

## 4. DTO sketches

Separate **command DTOs** (write) from **read DTOs** (projections).

```jsonc
// LearningEvent — the atomic, immutable record (xAPI-shaped)
{
  "id": "uuid", "occurredAt": "ISO-8601",
  "actor":  { "type": "human|agent", "id": "uuid", "tenantId": "uuid" },
  "verb":   "completed|executed|validated|submitted|cleared|flagged",
  "object": { "type": "task|validator|artifact|gate", "id": "uuid" },
  "context":{ "runId": "uuid", "scenarioId": "uuid", "envInstanceId": "uuid",
              "competencyIds": ["uuid"], "controlIds": ["NIST.ID.AM-1"] },
  "result": { "success": true, "evidenceRef": "sha256:…", "raw": {} },
  "consentScope": ["train","benchmark"],
  "sig": "ed25519:…"            // tamper-evidence
}
```
```jsonc
// Scenario — the CLA-owned unit
{ "id":"uuid","version":"semver","environmentRef":"uuid@version",
  "tasks":[{ "id":"uuid","order":1,"competencyIds":["uuid"],"toolIds":["uuid"] }],
  "validators":["uuid"], "controlMap":["CIS.5.2","OWASP.A03"],
  "provenance":{ "contributorId":"uuid","claVersion":"1.0","license":"owned" } }
```
```jsonc
// ValidatorResult — the ground-truth proof
{ "validatorId":"uuid","runId":"uuid","observedState":{}, "expected":{},
  "pass":true,"controlIds":["CIS.5.2"],"evidenceRef":"sha256:…","at":"ISO" }
```
```jsonc
// Attestation — the tradeable, signed outcome
{ "id":"uuid","subjectId":"uuid","competencyId":"uuid",
  "evidence":["validatorResultId…"],"envHash":"sha256:…",
  "frameworkRefs":["NIST.PR.AC","SY0-7xx.2.1"],
  "issuedAt":"ISO","expiresAt":"ISO","issuerSig":"…" }
```
```jsonc
// Consent — data rights as data
{ "subjectId":"uuid","grants":["train","share","benchmark"],
  "scope":"tenant|aggregate|public","revocable":true,"recordedAt":"ISO" }
```

Read DTOs (`RunSummary`, `CompetencyMastery`, `ControlCoverage`, `MspPostureReport`) are projections and
carry **no authority** — they're rebuildable from events.

---

## 5. Database design

- **Postgres (Supabase) core.** Ontology as relational tables now (adjacency/closure for graph edges); add
  a real graph store only if traversal cost demands it. `pgvector` for semantic search over content.
- **Event store.** Append-only `events` table, time-partitioned, immutable (no UPDATE/DELETE). Projections
  as materialized views or projection tables rebuilt by workers.
- **Content-addressed evidence.** Blobs (pcaps, screenshots, reports) in object storage keyed by SHA-256;
  store the hash in Postgres. This **reuses the Week-3 chain-of-custody at platform scale** — integrity,
  dedup, and provenance for free.
- **Ownership/access as schema.** Row-Level Security keyed on `tenantId` + `subjectId`; access is a
  first-class column, not an afterthought.
- **Multi-tenancy from day one.** `tenantId` on every row so one platform serves a class, a company, and an
  MSP's clients with isolation.

---

## 6. Standards to adopt (interop = the cheapest future-proofing)

| Concern | Standard | Why |
|---------|----------|-----|
| Learning/behavior events | **xAPI / cmi5** | actor-verb-object statements; agents emit the same shape |
| Frameworks, controls, baselines, policies | **OSCAL** (NIST) | machine-readable + mappable; bridge to MSP audit |
| Course/lab delivery into an LMS | **LTI 1.3** | launch external labs from an LMS |
| Evidence integrity / provenance | SHA-256 content addressing (→ in-toto later) | tamper-evidence, supply-chain-style provenance |
| Identity of subjects | **OIDC** | humans and agents both authenticate cleanly |

### Overview standard (R104)

A course overview — the Guide's orientation, the join picker, the course card — is a
table and a picture, not a read. Three or more parallel things are a table; a flow is a
diagram; a paragraph never explains what a row can show. Everything it prints is read
off the course document, so the overview is as short as the data and cannot drift from it.

| Element | Source | Budget | Guard |
|---|---|---|---|
| Course description (the lede) | `Course.description` | ≤ 40 words | `content-integrity.test.ts` R104 |
| Role mission (one table cell) | `RoleDef.mission` | ≤ 15 words | same |
| Role name | `RoleDef.name` | `Function (Role)`, no decorated label | `content-integrity.test.ts` R105 |
| Role summary (join picker, Home) | `docs/roles.ts` → `content.roles` | ≤ 20 words | same |
| Role arc | `docs/roles.ts` | ≤ 25 words | same |
| Responsibilities | `docs/roles.ts` | three or four, ≤ 6 words each | same |
| Week title | `WeekDef.title` | ≤ 10 words; objective labels ≤ 12 | same; `WeekObjective` |
| The roles | the RACI on every form (`raci.ts`) + `content.roles` | one `RoleTable`: function · title · mission · works in · drafts · reviews · approves · hands to · waits on | `page-shape.test.ts` R104/R105 |
| The hand-offs | the RACI + `feeds` (`roleFlow.ts`) | one `RoleFlowDiagram`: a line per direction and kind, weighted by documents, read aloud as sentences | same |
| The arc | `Course.weeks` + gates | one `WeekGoals` list | `page-shape.test.ts` (one arc) |
| The Guide's own prose | `guide/page.tsx` | < 170 words; no Collapsible; no mission cards | `page-shape.test.ts` |

What the standard forbids: a per-role card with a sentence under it; a picture with no
information (the old radial "roles around a hub"); a paragraph that counts what a table
counts; a second rendering of the mission, the arc or the hand-offs on the same page.
When a role fact is needed on a new screen, add a column to `RoleTable` or an edge kind to
`roleFlow()`; never type it beside the markup.

### Role content and motion (R105)

Role facts have one home each, and nothing is typed twice:

| Fact | Home | Who edits it |
|---|---|---|
| id, name, mission, colour, icon | the seed's `RoleDef` | the instructor, in RolesEditor |
| summary, responsibilities, works (commands · documents · both), arc | `src/lib/docs/roles.ts` → `content.roles.PROFILES`, one per role in the seed's order | the content author |
| who drafts, reviews, approves; hands to / waits on; the weighted hand-off arrows | **derived** by `roleFlow(roles, deliverables)` from the RACI and `feeds` on every form | nobody — it is a projection |
| the motion of the role pictures | `content.roles.MOTION` — `{ stagger, draw, ease }`, every value a token name of `src/lib/motion.ts` | the content author |
| the labels the pictures print (works, edge kinds, how to read) | `content.roles.WORKS_LABEL / WORKS_SHORT / FLOW_KIND_LABEL / FLOW_HOW_TO_READ` | the content author |

**The register.** Every role is named `Function (Role)`: the function is what the lane does and
is drawn in the box and bold in the table; the parenthesised title is the professional role, set
small beneath it (`splitRoleName()`). Missions, summaries, arcs and responsibilities are third
person, present tense, with the lane as the subject: no "you", no contractions, no em dash, no
emoji. `content-integrity.test.ts` asserts the shape and the register for all 13 courses.

**Motion as data.** A picture never carries a number of its own: `resolveRoleMotion(spec,
reduce)` (`src/lib/roleMotion.ts`) turns the spec into framer transitions from `DUR`/`EASE`,
caps every delay at `DUR.meter`, and under reduced motion returns `on: false` with every
duration zero, so boxes and lines render whole from the first frame. Draw-ins run on a mask
path so a line's dash array (its kind) survives the animation. No role picture loops.

**Focus.** `useRoleFocus(defaultRole)` is the one interaction: the viewer's role starts in
focus, a click or Enter on another role moves it, hover previews it, a second click clears it;
elements that do not touch the focused role dim, they never disappear. The same hook drives the
table rows and the picture, and call sites pass `key={member.role}` so a new viewer gets a new
picture.

**Adding a role fact.** Put it in the profile (or derive it in `roleFlow()`), regenerate with
`npm run content:export`, give it a budget in content-integrity, and read it through
`rolesOf(doc)`; never import a table from `roles.ts` into a component (`page-shape.test.ts`
forbids it along with every other content module).

### Certification ladder and cost (R106)

Every course prepares for one registered credential, and the registry is the only place a
vendor, an exam code, a level, an exam domain, a fee or a prerequisite is written:

| Fact | Home | Reaches |
|---|---|---|
| vendor, code, name, level, the vendor's own tier word, exam fee (USD, year checked), domains with weights, prerequisite and next rung | `src/lib/docs/certs.ts` `CERTS` | `content.cert.CERT`, `content.cert.LADDER`, `index.json` |
| which exam domain a task practises | the seven self-authored courses: `TASK_DOMAINS` in the registry; the cloud courses: `learn[0]` as `CODE · Domain` | `content.cert.DOMAIN_OF`; coverage is **derived** by `coverageOf()` at read time |
| a domain the course does not practise | `gapNote` on the domain | printed as the gap, never hidden |
| what the course costs: exam, lab, kit, software, cloud by the hour | `src/lib/docs/costs.ts` `COURSE_COSTS` | `content.cert.COSTS`; summed by `costSummary()` into `index.json` |
| what a task spends while it runs | `Task.cost {usd, per, note}`; every cloud task carries one (free unless said) | the Guide's cost table and the coverage sheet |

**The rules.** A graded task names exactly one domain of its own exam; the course practises at
least 70 % of the exam's weight; every gap has a note; the registry and the seed agree on the
level; a rung's `next` points back with `prerequisite`; a course that creates a billable resource
says its hourly rate on the task and tears it down in the same task. Content-integrity asserts
all of it; the four associate and professional cloud courses are held to coverage as each is
rewritten against its exam.

**What is printed.** The Guide's "The exam and the cost" section is two tables (`CertCoverage`):
the ladder and each domain with its weight and the tasks that practise it; the cost lines and
the tasks that spend. `docs/courses/cert-coverage/<course>.md` is the same, generated with the
content and diffed by CI. Second-hand kit keeps the CCNA guide's rule: an order of magnitude,
marked approximate, never a price.

**Agent-readiness without agent-coupling:** keep the API capability-scoped and resource-clean
(REST/GraphQL). An MCP server becomes a *thin adapter* over that API later; A2A interop rides on the
ontology + xAPI. **Do not build the MCP/agent gateway now** — design so it stays a small addition, not a
rewrite.

**Cross-platform interop:** the **competency ontology is the interlingua** shared with other platforms (e.g.
CertHatch) via a small shared kernel — see [`INTEGRATION_CERTHATCH.md`](./INTEGRATION_CERTHATCH.md). The same
xAPI events and OIDC identity carry across that boundary; only competency-level conclusions cross, never raw
data.

---

## 7. The MSP / business bridge (dual-use is the unlock)

The same primitives serve training *and* commercial implementation:

- **Validator = teaching check = audit check.** A CIS-baseline validator grades a student lab and audits a
  real client box. One asset, two markets.
- **Attestations = workforce evidence + client reporting.** Prove staff competency and control coverage,
  signed.
- **Event corpus = benchmarks + agent eval set.** "How competent operators perform task X" is a sellable
  benchmark and a labeled dataset for evaluating agents on the same task.
- **OSCAL mapping = compliance lineage.** Tie every run/attestation to controls → generate posture reports.

---

## 8. Build now vs defer

**Build now (cheap now, brutal to retrofit):**
- Event sourcing (immutable log) + CQRS projections.
- Single competency ontology + control/objective anchoring.
- Validator *interface* (even if early validators are simple).
- Content-addressed evidence storage.
- Consent + provenance fields on every relevant row.
- `tenantId` everywhere + RLS.
- Clean, capability-scoped API; xAPI-shaped events; OSCAL for control data.

**Defer (keep possible, don't build):**
- MCP server / agent gateway (thin adapter later).
- A2A federation, scenario marketplace, payments.
- Dedicated graph database.
- Real-time agent execution in environments.

See [`ROADMAP.md`](./ROADMAP.md) for how each of these lands in a phase, and [`adr/`](./adr/) for the
load-bearing decisions.
