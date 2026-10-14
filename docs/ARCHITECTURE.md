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
all of it, for every course.

**The level contract (R106f).** `cloudCourses.test.ts` holds what each cert level asks of a task.
Entry: nothing bills by the hour, and the R93/R95/R97 first-reader rules. Associate: every week
has a step that proves something (a refused origin, both zones answering, a poison message, a
replaced instance, a timed drill); at least three tasks pay by the hour and each says in its
cost note what it tore down, and in its free-tier line that it must be stopped or deleted.
Professional: every week has a task that works through automation (a pipeline, a preview, a
policy, a runbook, a post-mortem), every task teaches three or more things, and the dev copies
it deploys are deleted inside the task. Every graded task names its own exam first and the
week difficulty matches the level (1–2, 3, 4). The two platforms are one course in two
vocabularies: week titles, task shape and documents match quarter by quarter, and the shared
document fields read in each platform's words where the platforms differ.

**What is printed.** The Guide's "The exam and the cost" section is two tables (`CertCoverage`):
the ladder and each domain with its weight and the tasks that practise it; the cost lines and
the tasks that spend. `docs/courses/cert-coverage/<course>.md` is the same, generated with the
content and diffed by CI. Second-hand kit keeps the CCNA guide's rule: an order of magnitude,
marked approximate, never a price.

### Skills, tools, standards and the member profile (R107)

What a course teaches a person to DO is written once, as registries under `src/lib/docs/`, and
reaches every document as `content.skills` (the course's maps and the registry rows they reach;
`skillsSection.ts` cuts them); the member's own standing against them is a pure projection over
facts the platform already records. Nothing is scored, ranked or badged, and
speed is not measured.

| Fact | Home | Reaches |
|---|---|---|
| competency nodes (`comp.<area>.<slug>`, semver, anchored to an exam domain or a control), task → skills | `skills.ts` `SKILLS`, `TASK_SKILLS` | `content.skills.SKILLS/SKILL_OF`, `index.json` counts, `docs/courses/skills/` |
| tools, their aliases and command heads, the `where` prefixes, per-course defaults | `tools.ts` `TOOLS`, `WHERE_TOOLS`, `COURSE_TOOL_DEFAULTS`, `TASK_TOOL_OVERRIDES` | `content.skills.TOOLS/TOOL_OF` (`TOOL_OF` is **derived** by `toolsByTask()` at export) |
| the standards (the 26 framework ids plus the publications forms cite), the controls catalogue, what a form's `standard` string cites | `standards.ts` `STANDARDS`, `CONTROLS`, `CONTROL_EXCEPTIONS`, `parseStandard()`; `utils.ts` helpers delegate to `standardOf()` | `content.skills.STANDARDS/CONTROLS`, the framework badge and the Guide's framework section |
| SOP kinds anchored to NIST CSF / ISO 27001 / SOC 2 / SP 800-61 / ITIL, form → SOPs, task → SOPs | `sops.ts` `SOPS`, `DELIVERABLE_SOPS`, `TASK_SOPS` | `content.skills.SOPS/SOP_OF/SOP_OF_TASK` |
| ATT&CK and ATLAS tactics (ids only, never techniques), engineering practices, task maps | `tactics.ts` `TACTICS`, `PRACTICES`, `TASK_TACTICS`, `TASK_PRACTICES` | `content.skills.TACTICS/TACTIC_OF/PRACTICES/PRACTICE_OF` |
| every metric the platform keeps or could keep, with its definition, inputs, audience and status | `metricCatalogue.ts` `METRICS` | `content.skills.METRICS` |
| every sentence the skills surfaces print, the level wording per dimension | `skillsCopy.ts` `SKILLS_COPY`, `LEVEL_LABEL`, `DIMENSION_LABEL` | `content.skills.COPY…` |
| what a course practises, per dimension | `skillCoverage.ts` (lowercase: a projection) | `index.json` counts, the skills sheet |

**The rules.** Every graded task maps to one to three competency nodes, at least one tool
(derived, never typed) and at least one practice; a node nobody maps to does not exist; every
objective reference resolves to an exam domain or a control; every form's `standard` parses to a
catalogue control or is an explained practice; every SOP and every practice is anchored to a
standard; tactic ids are the published matrices' and nothing is invented from free text.
Content-integrity holds all of it for every course; graded and advanced weeks both teach, setup
weeks map to nothing. The cloud courses are mapped once (`cloudMap`): the Azure and the AWS form
of a task reach the same node.

**Procedures** are runbooks and SOPs followed to a standard, not pages of a guide. Adherence is
read from facts that exist (Definition-of-Done checks, the document-control block, evidence
hashes, the lifecycle, the order steps were verified in), never typed in; "standard
effectiveness" is read off the same rows per standard.

**The member profile** (`src/lib/skillProfile.ts`) is the projection: for one member and one
course, a row per skill, tool, procedure, tactic, practice, standard and exam domain with the
counts behind it and one honest level, `not-started → practised → verified → reviewed`.
`practised` is a tick on a required step; `verified` is a verifiable step verified from pasted
output (a procedure is "followed" when every Definition-of-Done check due is met and its
document-control block is complete); `reviewed` is a team document on the mapped work approved
or issued, and the labels say it is a team fact. Team facts can only raise a row that was earned.
The denominator is the member's own ticks on required steps of the role's graded and advanced
tasks; timestamps are read only to order verified steps, never for a duration; nothing is
scored, ranked or badged. The Home card (`SkillsCard`, inside the role surface), the dashboard
(`DomainStrip`, "Skills by course") and the portfolio (six sections) render it; the portfolio's
export is `capstone-member-profile/1`, unsigned (`signature: null`) until validators exist.
The cross-course hydrate reads the four team and own tables the profile needs
(`deliverable_status`, `deliverable_submissions` without the frozen form, `task_reports`,
`step_notes`), RLS-scoped exactly as the course hydrate is.

**Published assets.** `content/ontology/` (the registries as versioned JSON; `index.json` states
the id styles and the rules), `content/schemas/` (a JSON Schema per published shape, inside the
subset `src/lib/schema/validate.ts` checks), `docs/courses/skills/` (a readable sheet per course)
and `docs/VALUE_REGISTER.md` (what each asset is worth to companies, students and other
platforms, with an honest status). The metric catalogue is the contract: every metric the
platform keeps or could keep, with its definition, inputs, audience and status
(`computed`, `deferred`, `needs-events`, `needs-validators`, `needs-consent`, `excluded`), and
`scored: false` on every row. Known gap: the Home page's completion percent (`game.ts`) counts
optional and setup steps where the profile counts required steps of graded and advanced weeks;
the two read differently by design and the captions say which is which.

**Agent-readiness without agent-coupling:** keep the API capability-scoped and resource-clean
(REST/GraphQL). An MCP server becomes a *thin adapter* over that API later; A2A interop rides on the
ontology + xAPI. **Do not build the MCP/agent gateway now** — design so it stays a small addition, not a
rewrite.

**Cross-platform interop:** the **competency ontology is the interlingua** shared with other platforms (e.g.
CertHatch) via a small shared kernel — see [`INTEGRATION_CERTHATCH.md`](./INTEGRATION_CERTHATCH.md). The same
xAPI events and OIDC identity carry across that boundary; only competency-level conclusions cross, never raw
data.

---

### The KPI board, profiles and work roles (R108)

Sixteen numbers a course keeps per member, four families of four, each a ratio of counts the
metric catalogue already defines; a competency map lit by level; and three things a hiring reader
or an agent can join on: a work role, an environment profile and a credential envelope.

| Fact | Home | Reaches |
|---|---|---|
| the sixteen KPIs and four families (ids, numerator and denominator in words, fact kind, why lines) | `src/lib/docs/kpis.ts` `KPIS`, `KPI_FAMILIES` | `content.skills.KPIS`, `content/ontology/kpis.json`, the skills sheet's KPI section, every tile |
| NICE work roles (SP 800-181; 2017 ids, transcribed) with their competency areas and nodes; course role → work roles | `src/lib/docs/workRoles.ts` `WORK_ROLES`, `WORK_ROLE_OF` | `content.skills.WORK_ROLES/WORK_ROLE_OF`, `work-roles.json`, the board, the export, the credential |
| the environment profile a company publishes (infrastructure, tools, methodology, policies, ticket taxonomy, competencies per work role) | `src/lib/docs/environmentProfile.ts` (the shape and the one sample, built from the MSSP course); `content/profiles/`, `src/lib/content/profiles.ts` | the board's "measured against" picker; a file a reader imports is kept on the device only |
| the board projection | `src/lib/kpiBoard.ts` (pure; `capstone-kpi-board/1`) | `/courses/<id>/skills`, the dashboard and portfolio, the export's `courses[].kpis`, the cohort report |
| the competency map's layout | `src/lib/skymap.ts` (pure, deterministic) | `src/components/quarry/skymap/SkyMap.tsx` |
| the cohort report | `src/lib/cohortKpi.ts` (bands per cohort; no member in it) | the instructor cohort page and its KPI CSV |

**The four families.** Ability (skills verified, exam weight verified, profile coverage, skills
proved twice), Execution (steps verified in order, first-try beside persistence, commands verified,
files named to convention), Procedure and standards (procedures to standard, Definition-of-Done met,
controls cited, document control complete) and Outcome (submissions rubric-green, hand-offs
completed, instructor approved, capstone filed). Every tile prints "n of m", the fact kind it reads
(own, team or content) and, when the fact was not handed in, says so rather than printing zero.
Team facts are labelled as team facts. Nothing reads a clock: the pasted plan's Time family is
catalogued `excluded` under the no-speed rule, and retention is the gap-based recall rows.

**Measured against.** The default is the first NICE work role the course role prepares for: its
required competencies are the nodes of its areas, so a first open never reads "0 of 40 required";
the tile prints how many of them this course does not teach, so a low fraction reads as a gap in
the syllabus, never as failure. A company publishes a profile as a file (no server receives one,
ADR-0007); the sample is the platform's own managed-security entity.

**The credential** is an Open Badges 3.0 `AchievementCredential` envelope around the member
profile, with alignment to competency, exam-domain and work-role ids and the profile's digest as
evidence; its schema admits no `proof`, so it is unsigned by construction and the claim says so. A
signed attestation needs validators that read real state.

**The event contract** (`docs/EVENTS.md`, `content/schemas/event.schema.json`) names what every
write site would append to the log of ADR-0001, with `actor.type`, an assist level and a consent
scope; no table and no dual-write exist yet, and the catalogue keeps the rows that need one as
`needs-events`.

**Motion.** The map is a quarry scene: its draw-ins run under the quarry exemption and it reads
`useReducedMotionSafe`; the tiles are a data surface and keep to `DUR.meter`; the sweep is
positional, so `MotionConfig` stills it; the count-up reads the preference itself.

### The KPI pack and the DTO chips (R109)

The sixteen KPIs reach the two surfaces a member lives on without a second projection:
`SkillsCard` (the course Home's role surface) and every `/dashboard` course card call `kpiBoard()`
against the role's default measure (`defaultMeasure`, the first NICE work role the course maps, else
one sentinel) and render the result with `src/components/skills/KpiPack.tsx`: sixteen 32 px socket
buttons in four family groups of four, each a ring whose arc sweeps to its ratio in the course tint
(`ACC`, which the region and seam tokens already set on both surfaces, so the pack matches the seal
ledger beside it) inside the meter budget, a lit disc with a `qa-breathe` halo when a ratio is
complete, a dashed dim socket when a team fact was not handed in. Hover, focus or a tap prints the
socket in a read-out line; the hero (skills verified) counts up on mount; the pack is one tab stop
and the arrow keys move across it; under reduced motion it declares `data-motion="off"`, breathes
nothing and renders the final arc at once (a stroke is not a transform, so `MotionConfig` alone would
not still it). Family labels use the longhand mono treatment, never the `eyebrow` class.

Beside each pack a `DtoChip` names the document the numbers come from (`capstone-kpi-board/1` and the
ontology version as one case-sensitive code chip) and offers Copy JSON and Download JSON, built at the
click and never printed inline. The dashboard's record grid gains two cross-course totals (commands
verified, procedures to standard) through `sumKpi`, which leaves an unloaded row out and says so, and
a page-level chip for the member profile (`capstone-member-profile/1`) with Export credential. The
profile and the credential are built by one pure module, `src/lib/memberExport.ts`
(`buildMemberProfile`, `profileJson`, `buildCredential`): the portfolio and the dashboard both call
it, the page stamps `generatedAt` and hashes the pretty JSON it downloads, and the module reads no
clock, no window and no repository. `CopyButton` moved to `src/components/ui/` so the chip could use
it without the lab-access graph.

### Consent, outcomes and the acceptance gate (R110)

Every account accepts the platform agreements (`src/lib/legal/agreements.ts`) before using the
platform, and again at the next sign-in whenever one changes: the R86 gate (`LegalGateOverlay` in the
root layout, `LocalLegalDialog` before the first join offline) asks by version, and the append-only
`agreement_acceptances` log keeps every version a person accepted, now with the SHA-256 of the text
(`text_sha256`, migration 0013). R110 bumped `terms`, `aup`, `lab` and `privacy` to version 2 with the
sandbox-only rule and the liability clause (the platform is not liable for any cause, implementation,
overcharge, misuse or consequence of the capstone work), gave the AUP its own page (`/legal/aup`), let
the gate pass under `/legal/*` so the full text can be read while it is up, carried offline
acceptances into the account's log at first sign-in, and put the log in the account export. The
wording is plain-language drafting pending counsel review.

Consent is three grants (`share-employer`, `benchmark`, `outcome`; `src/lib/legal/consents.ts`), each
off until the member turns it on from the account page, each change an append-only row in
`consent_grants` (one blob per device offline); there is no `train` grant because the Terms forbid
training. `has_consent(uuid, text)` is a definer function for the platform's own functions, never
callable by a member about someone else. The consented outcome form (`learner_outcomes`,
`src/lib/legal/outcomes.ts`) appends the member's answer (status, role title, employer visible to the
member alone, start month, courses used at work); instructors read only `outcome_counts(course)`,
counts per status, and nothing at all below five members (the k floor in SQL and in `outcomeBands`).
The catalogue rows `outcome-placement` and `outcome-on-the-job` are computed from it.

### Attribution and currency (R111)

Two questions a hiring reader asks of any team-built record are answered from facts the platform
already keeps. **Who did it:** every form carries a RACI, and the drafting role owns the document, so
the three team folds that also count shared forms (DoD met, document control, instructor approved)
carry an `own` share restricted to the forms the member's role drafts, and the profile lists those
forms (`draftedForms`). The KPI board turns that into a `contribution` on the seven attributable team
KPIs: P1 to P4 and O1 to O3, equal to the value where the count is already the role's own (controls
cited, rubric green, handoffs) and absent on capstone filed, which is the whole team's. A new team
indicator, RACI respected, counts the member's own lifecycle moves made in the role the RACI names
for that move. **Is it current:** each profile row carries `lastVerifiedAt`, and, when the page hands
in its clock as `asOf`, a `current` flag for a last verification inside a 180-day window
(`CURRENT_WINDOW_DAYS`). The projection still reads no clock and reports no duration; the window is
a recency predicate, never a figure shown. The pack's read-out, the Skill board tile and the KPI
table print the role's share where it differs; the portfolio prints "Last verified <day>" with
current or verified earlier; the dashboard's skills tile counts current skills; the credential's
results carry the share. Both profile schemas and the KPI board schema carry the new fields; the
catalogue gains `metric.skill-currency`; the ontology is 1.2.0.

### The funnel and the step friction map (R112)

Two instructor aggregates measure the platform itself, from the facts the cohort loader already reads
for the whole course. `src/lib/funnel.ts` counts, per cohort and for the course, the members who
reached each stage in turn: enrolled, first tick, first verified step, first graded week cleared,
capstone filed. A stage needs every stage before it, so the counts never rise along the funnel. It
also counts members per band of active graded weeks (none, one, two or three, four or more).
`src/lib/friction.ts` counts, per verifiable step, among members whose role has the task: ticked
without matching output, verified, more than one paste, stuck now, and ticked an earlier step but not
this one; a step where a quarter or more of at least two members show a signal is a rewrite candidate.
Both are pure (no clock, no repository, no member in the output), order steps and never people, and
ship fixed-header CSVs. The page is `/instructor/<course>/effectiveness`, linked beside Cohort on the
instructor home. The loader now reads `step_completions` and `step_evidence` a page at a time
(`src/lib/data/selectAll.ts`), so a course past PostgREST's 1000-row cap no longer undercounts any
cohort aggregate. The catalogue rows are `platform-funnel-stage`, `platform-retention-weeks` and
`content-step-friction`; the ontology is 1.3.0.

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
