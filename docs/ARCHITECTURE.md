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

**Agent-readiness without agent-coupling:** keep the API capability-scoped and resource-clean
(REST/GraphQL). An MCP server becomes a *thin adapter* over that API later; A2A interop rides on the
ontology + xAPI. **Do not build the MCP/agent gateway now** — design so it stays a small addition, not a
rewrite.

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
