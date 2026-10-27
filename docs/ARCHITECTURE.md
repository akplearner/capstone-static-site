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
emoji. `content-integrity.test.ts` asserts the shape and the register for all 15 courses.

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
facts the platform already records. Since R132 a number may be scored by the published method
(`docs/SCORING.md`, `src/lib/docs/scoring.ts`) and a duration is the difference of two recorded
stamps; nothing ranks one member against another.

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
tasks; timestamps are read to order verified steps, to measure the minutes between a step's
first paste and its verification (R132, `timing`), and against the cohort calendar the page hands
in; nothing ranks one member against another. The Home card (`SkillsCard`, inside the role
surface), the dashboard (`DomainStrip`, "Skills by course") and the portfolio (six sections)
render it; the portfolio's export is `capstone-member-profile/2`, unsigned (`signature: null`)
until validators exist.
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
`scored` (true on the rows a published score reads) and `timing` (true on a row computed between
two recorded stamps) on every row. Known gap: the Home page's completion percent (`game.ts`) counts
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

The numbers a course keeps per member (since R132 twenty-eight, seven families of four, each a
ratio of counts the metric catalogue already defines, or a median of minutes between two recorded
stamps, with six scores by the published method, `capstone-kpi-board/2`); a competency map lit by
level; and three things a hiring reader or an agent can join on: a work role, an environment
profile and a credential envelope.

| Fact | Home | Reaches |
|---|---|---|
| the twenty-eight KPIs and seven families (ids, numerator and denominator in words, fact kind, unit, scored, why lines), and the sixteen deprecated R108 ids with the row that replaced each | `src/lib/docs/kpis.ts` `KPIS`, `KPI_FAMILIES`, `DEPRECATED_KPIS` | `content.skills.KPIS`, `content/ontology/kpis.json`, the skills sheet's KPI section, every tile |
| the six scores: weighted means of KPI percentages, weights summing to one, each component named on the board (R132) | `src/lib/docs/scoring.ts` `SCORES`; `src/lib/scores.ts` computes them | `content.skills.SCORING`, `content/ontology/scoring.json`, the board's `scores`, the export, the credential's results |
| the eight skill domains (dimensions, categories, KPIs, score and evidence per domain) and the fourteen record categories with the form tables the projection reads and the professional threshold of ten verified uses (R132) | `src/lib/docs/skillDomains.ts`, `src/lib/docs/recordCategories.ts` | `content.skills.DOMAINS/CATEGORIES/TROUBLE_GROUPS/CHANGE_GROUPS`, `skill-domains.json`, `record-categories.json` |
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

The KPIs reach the two surfaces a member lives on without a second projection:
`SkillsCard` (the course Home's role surface) and every `/dashboard` course card call `kpiBoard()`
against the role's default measure (`defaultMeasure`, the first NICE work role the course maps, else
one sentinel) and render the result with `src/components/skills/KpiPack.tsx`: twenty-eight 32 px socket
buttons in seven family groups of four, each a ring whose arc sweeps to its ratio in the course tint
(`ACC`, which the region and seam tokens already set on both surfaces, so the pack matches the seal
ledger beside it) inside the meter budget, a lit disc with a `qa-breathe` halo when a ratio is
complete, a dashed dim socket when a team fact was not handed in. Hover, focus or a tap prints the
socket in a read-out line; the hero (skills verified) counts up on mount; the pack is one tab stop
and the arrow keys move across it; under reduced motion it declares `data-motion="off"`, breathes
nothing and renders the final arc at once (a stroke is not a transform, so `MotionConfig` alone would
not still it). Family labels use the longhand mono treatment, never the `eyebrow` class.

Beside each pack a `DtoChip` names the document the numbers come from (`capstone-kpi-board/1` and the
ontology version as one case-sensitive code chip) and offers Copy JSON and, since R127, Download PDF, built at the
click and never printed inline. The dashboard's record grid gains two cross-course totals (commands
verified, procedures to standard) through `sumKpi`, which leaves an unloaded row out and says so, and
a page-level chip for the member profile (`capstone-member-profile/1`). The
profile and the credential are built by one pure module, `src/lib/memberExport.ts`
(`buildMemberProfile`, `profileJson`, `buildCredential`): the portfolio and the dashboard both call
it for the copy and the link a member creates (R114), the page stamps `generatedAt` and hashes the pretty
JSON, and the module reads no clock, no window and no repository. `CopyButton` moved to `src/components/ui/` so the chip could use
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

### Verification receipts, re-hash checks and the first validator (R113)

Verification used to be client-side end to end: the browser derived the stamp (`taskToken`), scored
the paste and wrote `verified`. In cloud mode the platform now issues the stamp and logs a receipt.
The `stamp` edge function hands the signed-in member a random `CQ-` stamp for one task, live for
twenty minutes (a live one with five minutes or more left is handed out again, so two tabs agree);
`verification_stamps` (0014) has RLS on and no policies, so only the platform reads it. When pasted
output carrying that stamp matches every expected token, the verify box calls the `receipt` function
with exactly seven fields: course, task, step, stamp, the output's SHA-256 and the two counts. The
function refuses any other field, so the paste cannot reach the server even by mistake, checks the
stamp is the caller's, for that course and task, and live, and writes one row per stamp and step to
`verification_receipts`: readable by the member, their team and the instructor, writable by no client,
frozen by a trigger. The client half is `src/lib/stamps.ts`; any failure, or a project without the
functions, leaves the client stamp in place for the rest of the page, so offline and demo mode read
exactly as before. A receipt records the stamp, not the machine, and every surface says so.

Receipts join the ledger as their own facts, never as a flag on `step_evidence` (which the client
owns): `courseMetrics.receipted`, `portfolioSummary.receipted` and the abilities `receipted` (over
verified steps) and `rehashConfirmed` (over hashed files) are null or unloaded where no receipt can
exist, so offline prints nothing rather than a zero. The ledger page marks receipted steps and gains a
Re-check per hashed file: the browser hashes the chosen file again and appends a `rehash_checks` row
(locally, a per-device blob); the artifact and its hash time are never rewritten. One `sha256Hex`
(`src/lib/hashFile.ts`) serves the hasher, the packager and the re-check.

`src/lib/docs/validators.ts` holds the `Validator` interface (`run(output, params)` returns pass,
observed, expected and the problems in words) and the first validator, `ufw-least-privilege`, which
parses `ufw status` output as a ruleset: status active, a deny default where shown, the step's public
ports open to everyone, each restricted port open to exactly its listed sources, nothing else allowed
in. A step opts in with `validator: { id, params }`; Server+ `sp-w4-secure-s2` is the first. The verify
box shows the result beside the token verdict, with observed against expected. It reads text the
member pasted, in the browser, and is not recorded this round; a lab agent that reads real state is
Phase 2. The catalogue gains `metric.verified-receipted`, `metric.evidence-rehash-confirmed` is
computed, and the ontology is 1.4.0.

### Candidate links and employer profiles (R114)

A member who holds the share-employer consent creates a link to a frozen, unsigned copy of their
portfolio export or credential, for 7, 30 or 90 days. The `share` edge function checks the consent
(`has_consent`), accepts only the two published shapes within 256 KB, refuses any copy that carries a
member, user or team id, the submitter or an email address in any key or value
(`supabase/functions/_shared/shareGuard.ts`, the same module the app runs before it asks), sets a
profile's subject to the member's display name, and stores the copy with the SHA-256 of a 256-bit token
it returns once (`profile_shares`, 0015). Only the function inserts; the owner lists a link's facts
through column grants that refuse the copy and the token hash, revokes it (a trigger dates the
revocation with the database clock and refuses to undo it) or deletes it with its copy; account
deletion clears links too. The token rides in the URL fragment (`/share#<token>`), which no server sees;
`shared-profile` serves one live link by its token's hash and answers unknown, revoked and expired
with the same 404; the platform's JWT check stays on, because a signed-out reader's request carries
the project's public key, which the check accepts. The public page reads words from the built-in
documents, never the data layer, is noindex and disallowed in robots.txt, and says the copy is unsigned
and not proof of the machine.

**The 256 KB limit (R124).** The copy is measured as compact JSON in UTF-8, and the limit is deliberate: a link is public
for as long as it lives. The full export was never built to fit it: it carried every row of every course, reached or not,
each with about twenty counters, plus the member's own gaps and raw indicators, so one large course came to 100 KB and the
thirteen to 525 KB, and a member with four courses could not make a link whatever they had done. The copy a link serves is
now `shareProfileCopy` (`src/lib/shareCopy.ts`): a row keeps its id and level and the seven counters a reader uses that are
not zero; a row not reached stays as id and level so the denominator survives; gaps, raw indicators, mapped task and form
ids and the "next task" hint stay out, because they are the member's own. Since R130 a row's dimension, label and
references are not in the copy either: the reader (`SharedProfile`) has every course document, so `hydrateShareCourse` puts
them back by id from the published ontology, which deprecates and never removes an id; a standards row keeps the codes
the member's own forms cited, and a copy made before R130 keeps the labels it carries. The fifteen finished courses come
to about 220 KB, the four largest to 97 KB. It is still `capstone-member-profile/1` with `signature: null`: the published schema
lets a row omit a zero counter and a course omit gaps and indicators, and says so. The Create link dialog lists the courses
with the size of each, shows the size of the copy against the limit before the click, lets the member untick courses, and
will not send a copy over the limit; the server's refusal (`too-large`) says the same. `shareCopy.test.ts` builds the largest
record there can be and holds the copy to the cap, so a round that adds to the profile finds out there. The cap itself is in
`shareGuard.ts`, which the app and the deployed function share: raising it means redeploying `share`.

Instructors publish employer environment profiles (`environment_profiles`, validated against
`environment-profile.schema.json` on publish and again on every read) from `/instructor/profiles`;
every signed-in member's Skill board picker lists them after the work roles and the samples. A link
created from the Skill board shares that course alone, its board measured against the chosen profile,
and records the profile's name. Without 0015 or the functions every piece degrades to "not available":
the buttons say links are not set up, the account section and the published profiles do not appear.

### Deploying the functions from the browser (R115)

The edge functions deploy without the CLI. Each reads the project's URL and keys from what Supabase
injects into every function (`supabase/functions/_shared/env.ts`: the `default` entry of
`SUPABASE_SECRET_KEYS` or `SUPABASE_PUBLISHABLE_KEYS`, else the legacy `SUPABASE_SERVICE_ROLE_KEY` or
`SUPABASE_ANON_KEY`, else an older guide's `SERVICE_ROLE_KEY` secret), so no secret is set by hand; a
function without a key answers 503 `not-configured` instead of crashing. The dashboard's editor deploys
one file, so `npm run functions:dashboard` writes `supabase/dashboard/<name>.ts`: the function's source
with each `../_shared` helper copied in verbatim. `src/lib/dashboardCopy.test.ts` fails when a copy
differs from a fresh build, CI type-checks the copies with Deno, and `SUPABASE_SETUP.md` walks the
paste: Edge Functions, Deploy a new function, Via Editor, name, Deploy function. No function needs
`--no-verify-jwt`: the platform's JWT check accepts the public key a signed-out reader sends.

### The role on top, whose task is whose, and gates as notes (R116)

A member's role is the first item in `CourseSubNav`, the one sticky bar every course page renders, so
it stays at the top edge however far the page scrolls, rides up with the site header's auto-hide and
survives Focus mode (`RoleStrip`: "Your role", the icon, the name, the team; a visitor sees "No role
yet. Join"; it links to the `#role` section on Home). A page-shape guard enumerates
`src/app/courses/[courseId]/**/page.tsx` and fails when one (other than the two forwarding stubs)
does not render the bar. Whose a task is comes from one pure helper, `taskOwnership(task, role)`
(`yours`, `shared`, `other`), drawn by one chip, `OwnerChip`, on every row ("Your task", "Everyone",
"{Role} · open to anyone") and in a sentence on every opened task: another role's task is open to the
whole team and counts for the team. `YourTasksStrip` lists the member's own tasks for the week above
the objective-grouped list. A gate is a note: `weekLocked` is gone, `gateNote(week)` returns the gate
and `openGateSteps` (the exact required tasks still open, setup-week tasks included), `WeekGateNote`
shows them as links beside an open week, the week rail carries a flag with a word, and the Security+
scope sign-off is an amber note above a form that is always open. `FlowDiagram` has no locked status.
No padlock is drawn on a task, a week or a form; the instructor's explicit course lock and sign-in are
the only doors left.

### Empty roles and failures never strand a team (R117)

A document's steps belong to the RACI roles of its form, but a team can be smaller than the role list
or lose a member. A role is vacant when the team has members and none holds it (`isVacant`,
`src/lib/docs/lifecycle.ts`); then `allowedActions` lets any member do that role's step, and the
separation rule still holds (a submitter cannot approve their own work while another member could). The
transition records the cover in its note, which starts "Covering for <role id>." (`COVER_PREFIX`,
`coverOf`, `noteText`), so there is no migration: the database never decided who may make a transition,
only that the row is the caller's own, on their team, and never rewritten. An empty team array means the
team is unknown and gives no cover. `raciRespected` skips covering rows (neither respected nor broken);
the status strip, the submit bar and the review queue say "any member may cover" and "covering for
{Role}". The first load of a course that fails on the membership query is recorded
(`courseHydrateFailed`, `useMember().failed`) instead of marking the course loaded with nobody in it, so
an enrolled student sees "Couldn't load your team" with a retry, never the Join panel (which would let
them overwrite their own team and role); the import prompt stays quiet then. A member whose role was
removed from the course is asked for a new role with the picker open and their progress kept; a full
house says so and points at an online lobby. Content tests pin that every gate waits on a required step
and every task is shared or belongs to a role of its course.

### One word for "done" (R118)

A task on a role-split course is done once anyone on the team did it (R98), while the member's own
record (the stone, the gems, the ledger) stays theirs, so a task has two figures. `taskState`
(`src/lib/taskState.ts`, pure) is the one place that says which is which: the state is the TEAM's
(`not-started`, `in-progress`, `done`) and the member's own count is shown beside it only when it
differs. `TaskStateChip` draws it as an icon and the words ("Not started", "In progress · 2 of 5
steps", "Done", "Done by Ada", "Done for the team", "You: 0 of 5 steps"), on every task row and in
the opened task's header with the member's verified checks. The contradictions went with it: the
stone is labelled as the member's own, the week header says its bar is the team's and shows "You n%"
beside it when that differs, each rail tick says in words what it means (every task done for the
team; every document meets the definition of done), the done tick on an objective, a gate dot and a
filed document are words for assistive tech, and the instructor's verdict is always named
(`REVIEW_VERDICT_LABEL`: "Instructor: approved", "Instructor: reviewing") so it never collides with
the team's own lifecycle (Draft, In review, Approved, Issued). Home shows `MyWaitingCard` (the
documents the member is waiting on others for, and that any member may cover an empty role), and a
late joiner on a finished team sees "Done for the team. Your own record: n of m steps." with their
first open step as the way in, instead of a dead end.

### The team's roles board (R119)

A role says who a task is FOR, never who may do it (R98), so a student needs to see the whole team
at once: which roles exist, who holds each, and what each is doing this week. `roleBoard`
(`src/lib/roleBoard.ts`, pure) builds it from the course, the week, the roster and the progress
Tasks already reads: the shared build first, then the viewer's own role marked "You", then the other
roles in the course's order, each with the display names of the holders on the viewer's OWN team (never
a member id) and this week's tasks, every task with its `taskOwnership` (R116) and `taskState` (R118).
`RoleBoard` (`src/components/course/RoleBoard.tsx`, props only) replaces Home's titles-only list:
each task opens in Tasks, another role's reads "{Role} · open to anyone", never locked. A role nobody
on the team holds is **open**, by the same `isVacant` that lets any member cover its documents (R117);
its card says so, and **Take this role** moves the member there. That is the join panel's own call
(`takeRole` in `src/lib/takeRole.ts`: `progressRepo.joinTeam` with only the role replaced), behind a
short confirm; ticks, evidence and notes are keyed by the member, so they stay, and a role change on
the team the member is already on is never refused as "full" (it leaves the team's size as it was).
The role strip on every course page now lands on this board (`#roles`; a one-role course has no board
and lands on the role section). `roleCoverage` gives the instructor the same rule per team: the
registrations panel names, for each team with a gap, the roles nobody holds. No migration: cover and
role changes use what R117 and the join panel already write.

### The issues inbox (R120)

A student's report was a task and a kind on a per-course list. The admin working the queue needs the
whole picture, so a report now records, as filed, **where** (the week and the optional step), **who** (the
name and the role at the time, so a student moved later does not rewrite what they said), **when**, and
**which version of the course they saw** (`contentVersion`, `src/lib/contentVersion.ts`: `{document
version}.{revision}`, e.g. `1.7`; the revision half is the content-fix ledger of R121). Migration
`0016_report_context.sql` adds the columns (all nullable or defaulted, so an older row reads as before),
widens the status to `open | in_progress | resolved | wont_fix` (`REPORT_STATUSES`,
`src/lib/reportKinds.ts`), lets a student file only an **open** report, and **freezes** who, what, when and
which version with a trigger: afterwards only the status and the resolution may change, for staff too.
`/instructor/issues` (any instructor; the instructor layout is the gate) is the one place that reads every
report across every course (`src/lib/data/issuesLoader.ts`; offline it reads this device). The pure core
`src/lib/issueInbox.ts` joins a report to its course (`IssueDto`, the published `capstone-issue/1`, which
names a person and never an account) and answers the inbox's questions: the four tabs (**Pending** is open
plus in progress, **Complete** is resolved, **Won't fix** is closed without a change, **All**), the filters
(course, week, the reporter's role, the task's role, kind, reporter, words), the **group by task** view that
puts the tasks with the most pending reports first (where content needs fixing), counts, and the CSV and JSON
exports. The instructor's move on a card is a status and a note for the reporter. The cohort page's panel
stays as the per-course glance and links to the inbox; the instructor home shows pending counts per course.
The admin applies SQL by hand and the app can reach production first, so every new column is feature-detected
(`isMissingSchema`, `src/lib/data/schemaErrors.ts`): a report is filed with the columns the database has, a
status the old constraint refuses says so, and the inbox shows a "Database update needed" notice until
`supabase/setup.sql` is re-run.

### Versioned content fixes (R121)

A student reports a typo or a sentence nobody can follow, and the admin should be able to correct it
without waiting for a deploy and without forking the course (an edited copy stops receiving the built-in
course's later updates). So a correction is an entry in a **ledger laid over the course**, never an edit
of it: "in this task, this step, this field, the text was X and is now Y" (`src/lib/contentFix.ts`, pure).
The code stays the source of truth; a live fix exists so the words are right today, and a developer folds
it into the course file later.

**The ledger.** One append-only row per entry in `content_fixes` (migration `0017_content_fixes.sql`;
offline, one localStorage blob per course), published as `capstone-content-fix/1`. Three kinds: a **fix**
(`changes[] = {taskId, stepId?, field, before, after}`), a **revert** (a new entry carrying the inverse
changes of an earlier fix, so history is never rewritten) and a **fold** (bookkeeping: these revisions are
now in the code; it changes no text). Each carries who (a name, never an account), when, the document
version it was made on, the reports it answers and a one-line why. The database assigns the `revision`
(1, 2, 3 … per course) under a per-course lock, so no client picks a number; a revert names an existing fix
once (a unique index) and a fold names existing fixes; nobody updates or deletes a row (no policy, the
grants revoked, and a trigger that refuses it for the table owner too); erasing an admin's account keeps
their entries and the name they were signed with. Any signed-in member reads the ledger (the corrected words
are what they render); only an admin inserts.

**The apply rule**, per change, in revision order: the text now is `before` → set `after`; it is already
`after` → nothing to do (so a fix already folded into the code is harmless); anything else → skip it
(**stale**: the text changed underneath it, code wins). A fix is **Live**, **Reverted** (a later revert
names it), **In code** (a later fold names it) or **Stale** (nothing of it applies). It can be reverted only
while each `after` is still the current text; when a later fix changed the same text again the ledger says
which revision to revert first. What a fix may touch is the words: a task's title, objective, definition of
done and what to have ready; a step's title, description, instruction, actions, command and its
explanation, each command's text, explanation and sample, the expected output, how to read it and what it
means. Adding or removing steps, gates, ids and forms stays a code change: progress keys on the ids and the
structure is what the tests hold.

**The version.** A course's content version is `{document version}.{revision}` (`contentVersion()`,
`src/lib/contentVersion.ts`): the document's own version, and the ledger's counter, which goes up for every
fix, revert and fold. A report stamps the version the student was reading (`Course.revision` is set where the
ledger is applied); the ledger prints `v1.7` beside every entry; the downloads carry both halves.

**Where it is applied: one place.** `courseDocument(id)` (`src/lib/content/docs.ts`) is the document with the
live fixes applied to its `course`, plus the optional `revision` and `fixes` that `CourseDto` gained (additive:
the schema id stays `capstone-course-dto/1`, and the committed `content/courses/*.json` do not change).
`effectiveCourse()` is the same layer for a `Course`, and both repos list through it, so the catalogue, the
course page, the search and every export read the same words at once. With no fixes nothing is a new object
(tested); with fixes the result is memoised on the ledger, so a reader's `useMemo` is stable. A saved copy of a
course never stores the ledger's counter or a copy of the ledger (`storedCourse`, `documentFor`): the ledger
has its own table, and a copy made from the corrected words simply reads the fix as already applied.
Students get the ledger with the course's other rows (`hydrateCourse` selects it), so the page never paints
the old words first.

**Held to what the seeds are held to.** A fix is checked when it is typed, beside the field it is about,
with the same rules the suite holds the code to: the reading budgets (`src/lib/readingBudget.ts`, which
`content-integrity.test.ts` imports, so there is one set of numbers; a sentence already past its budget may
be corrected but not lengthened), every self-check `verify` token must still appear in the output the step
shows, a lab-access placeholder it adds must be a real token, and "this text changed after the panel opened".
A fix that is saved cannot fail the suite on the day it is folded into the code.

**The admin's desk** (`/instructor/issues`). Under each report an admin sees **Fix the text**
(`FixTextPanel`, props only): the words of the step or task the report names, as students read them now, each
in a box; changed fields are marked, the checks speak beside their field, and Save adds a revision, closes this
report against it (`fix_revision`, shown on the card) and, if ticked, the other pending reports about the same
text. The **Fixes** view (`FixesLedger`, admin only) is the course's ledger, newest first: version, kind, state
(an icon and a word), who, when, the reports it answers, and each change before and after; **Revert** (asked
first) and **Mark in code** (with where it shipped) are the two moves. A banner counts the live fixes that are
not in the code yet, and two downloads close the loop: the **fix bundle** (`capstone-content-fixes/1`: the live
fixes with the task and step titles to search for and the file the course is written in) and the **live course
document**. To fold: make the same changes in the course file, `npm run content:export`, commit and deploy,
then mark the revisions In code; from then on the ledger replays them as no-ops.

The app can reach production before the SQL does, so the ledger degrades like the report columns did
(`isMissingSchema`): a database without `0017` reads as "no fixes", the page says "Database update needed",
and a save names the step instead of failing quietly. Offline the ledger is this device's, and the same
suite of tests (`contentFix.test.ts`, the local and cloud repo tests, the page test, `rls.sql`) covers both
paths.

### Versioned course editing (R122)

The studio saved a course by overwriting its one row in `course_documents`: the version was whatever the
browser said (and the browser never counted it up), nothing recorded who saved or what the course said
before, and a mistaken save could only be undone by retyping. A built-in course was forked by that first
save without anyone being told: the copy keeps the old text and stops receiving the built-in course's
updates. R122 numbers and keeps every save, and says so before a fork.

**The database counts.** Migration `0018_course_document_versions.sql` puts a trigger on `course_documents`:
every insert or update takes the next version number under a per-course lock, `greatest(the newest snapshot
+ 1, the row's version + 1, the number the client sent)`, so a client may skip ahead (a built-in forked at
its shipped version carries that numbering on) and never go behind; it writes the number into
`doc.course.version`, so the row, the document and the history agree; and it snapshots the saved document
into `course_document_versions` with the course title, its size, who saved it (a name) and when. Only the
trigger writes there: the grants are revoked, a second trigger refuses a rewrite for the table owner too, and
`saved_by` detaches (`on delete set null`) when an account is erased. Only an admin reads. A deleted course
keeps its history, and a course made again carries the numbering on. Rows saved before the migration are
snapshotted once, so the history starts with what is live. One repair rode along:
`course_documents.updated_by` had no `ON DELETE` action, so an admin who had ever saved a course could not be
erased; it now detaches, and the trigger does not count that as an edit.

**The clients count the same way**, so the page already shows the number the database will give: both
repos save with `version = (the course's saved version, else the one it shipped at, else 0) + 1`, whatever
number the draft in the studio held, and a duplicate starts again at 1. Offline,
`localStorageCourseHistoryRepo` (beside the repo whose saves it records) keeps the last eight saves, each a
whole course, quietly: a full browser must not turn a save that worked into an alarm about its history.

**The content version** a student sees is `{this version}.{content fix revision}` (R121): the first counts
the edits made in the studio, the second the corrections made from reports.

**History** is the studio's new tab (`HistoryPanel`, props only, `courseHistoryRepo`): each save with its
number, title, who, when and size; **Download** for any; **Restore**, which asks first and saves the old
document again as a NEW version (an ordinary upsert, so the trigger numbers it and nothing is lost), after
which the editor re-seeds from what was restored.

**No silent fork.** A built-in course shows a banner, and its first Save asks: it forks the course (for every
student, or on this device offline), later updates to the built-in course will not reach the copy, wording
is better corrected from a report (Fix the text, R121), and a course of one's own is a duplicate. (The
instructor home never offered Edit on a built-in; the hole was the address.) Once forked, the edited copy has
its own banner and the next saves do not ask. **Saved ids are read-only**: task, step, role and gate ids are
shown and not editable once saved (`ID_LOCKED_HINT`), because progress, team state, the RACI and gate status
are recorded against them; an id added in the session stays editable until it is saved. As with the other
migrations, a database without `0018` degrades: the History tab says "Database update needed", saves still
work, and the version the page counts is the one the database will confirm once it is applied.

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

### The earned-skills ledger (R125)

The member profile is a projection over the progress a member has now, so "Reset my progress" (the way to retake a
course) used to empty the record with it. The rule the admin asked for is the opposite: a skill is earned the first
time it is reached, a retake only adds what is missing, and nothing earned is lowered, rewritten or re-dated.
`src/lib/earnedSkills.ts` holds that rule, pure: a ledger row is (dimension, id) with the highest level reached
(practised < verified < reviewed), the course it was first reached in, when it was first reached, when it reached its
level, and the steps behind that level (ids only, so the words come from the course). `mergeLedger` adds a row or
raises it and changes nothing else; `applyEarned` lays the ledger over a live profile so a row below its earned level
reads at that level (this course's rows only, counters stay live, gaps shrink); `candidatesFrom` turns a profile into
the rows it reaches. It covers every earned dimension (skills, tools, procedures, tactics, practices, standards, exam
domains), and `skillPortfolio` still takes distinct ids across courses.

The pages bank as they show (`useBankEarned`, after render, only when something new is reached), so the ledger is
current before the Home tab's reset is used; every surface that builds a profile for the member passes it through
`withEarned` (dashboard, portfolio, the Skills card, the skill board). `earnedRepo` is `localStorageEarnedRepo` offline
and `supabaseEarnedRepo` in the cloud: optimistic, the upsert carries no time of its own, a write that fails is kept and
tried again, and a database with no table yet (0019 not applied) keeps the ledger on the device, per account, so a retake
never costs a skill in the meantime. In the database (`0019_earned_skills.sql`) a trigger holds the same rule for every
client: a new row is stamped with the database's clock, an update that does not raise the level is written back as it was,
and a raise keeps who, what, where and when it was first reached. A member reads, adds, raises and erases their own rows
(erasing so that deleting an account removes the ledger), an instructor reads all and writes none, and "Reset my
progress" never touches the table. `supabase/tests/rls.sql` has the R125 section with eight mutation checks (no trigger,
client stamps, can lower, everyone reads, insert for anyone, the course moves, first reached rewritten, no cascade), each
of which fails it. Counted from the first time a row is reached, not only at course completion, so the record stays live.
The instructor's cohort figures (`cohortKpi.ts`) are built from the cohort's live data and are not laid over by it.

### The record updates and every figure opens (R126)

The dashboard's "Your record" printed verified evidence and little else: three ticked steps changed no
figure, steps done were not in it at all (only on a card further down), and a page left open never
refreshed. It is now twelve figures in the order a course is lived: progress (steps done, tasks done, weeks
sealed, capstones delivered), proof (steps verified, commands verified, evidence hashed, days worked) and
what the course taught (skills verified, tools used, procedures to standard, exam domains verified). Each is
a button (`RecordStrip`, props only) that opens a panel under the strip: `lib/recordDetail.ts` (pure, no
repository, clock or window) builds, from the step set the figure itself counts, the steps (actions),
commands, tools and procedures behind it, each with the course, week and task it came from and a link to
the task; the page reads the facts (`lib/recordFacts.ts`) when a figure is opened and again whenever the
store changes, so an open list is as live as the strip. A row the earned-skills ledger holds above the live
run (R125) is listed too, marked as kept from an earlier run, with the steps it was earned from; the work
figures start again from nothing after a reset, the skill figures do not.

Live: the page also loads the account again when it is looked at (focus, visibility, back-forward cache;
at most every ten seconds; `useUserSync`), every reader re-reads, and a first load shows a skeleton
(`ready`) instead of "No capstones yet". The store key stands in for each course's body (the one large part
of a card) so the page no longer serialises every course on every broadcast. `recordDetail.test.ts` holds
each list to the number the page prints for it on a real course, for one course and for two, and after a
reset; `dashboard/page.test.tsx` runs the real page on the real repositories.

### The eight domains and the fourteen categories (R133)

The question the platform answers from R132 on is whether a member can consistently perform at a
professional level in a real work environment, and two surfaces now read the record that way.

**Skills by course** on the Skill board (`/courses/<id>/skills`) is eight domains
(`src/lib/docs/skillDomains.ts`: technical capability, professional execution, problem solving,
thought process, architecture and design, team and communication, learning and retention,
professional readiness). `src/lib/skillDomainsView.ts` (pure) lists, per domain, only the rows of its
dimensions with evidence behind them (a verified step, an approved form, a resolved fault, a chosen
decision, a stamp a week after another); the rest are counted as gaps, never listed. Beside each
row: how often (verified steps, or uses for a fact row), how consistently (proved on two or more
tasks, in order, current), what the role measured against expects (required or beyond), and the
evidence counted. The domain's KPIs and score come off the board (`kpi-board/2`). `DomainBoard`
(props only) draws it between the competency map and the KPI board.

**Your record** on the dashboard leads with fourteen categories (`src/lib/docs/recordCategories.ts`:
tools, commands, procedures, standards, troubleshooting, investigations, documentation,
architectures, configurations, communication, collaboration, decisions, projects, exam domains).
`src/lib/recordCard.ts` (pure) builds one card per category across every course started: uses,
verified uses, the success rate as a ratio of the two, the last activity stamp, the courses and
projects behind it, six monthly counts of verified uses against the page clock, the evidence
(receipts, hashed files, approved forms) and the industry relevance (the share of the NICE work
roles whose competency areas the category serves). The tier is PROFESSIONAL at ten verified uses
across every course and retake, BUILDING below it with the count as `n/10`; nothing is hidden for
being small. The tasks of a category come from the registries (tools, SOPs, standards, domains) and
the words (`taskCategories`), the forms from `FORM_CATEGORY`, the fault and decision rows from the
profile's fact dimensions. `RecordCategories` (props only) draws the cards, each a button that opens
the list of what counted (`categoryDetail` in `recordDetail.ts`: the rows, the forms, the steps,
commands, tools and procedures) in the same panel the twelve progress figures use; those twelve
follow under "Progress figures", unchanged. The method behind the tier and the relevance is
`docs/SCORING.md`; the card's shape is `content/schemas/record-category.schema.json`.

### The workforce-readiness pipeline (R132 to R134)

One picture of what the three rounds added, from the facts to the surfaces. Nothing in the
middle is a source of truth: every box right of the facts is recomputed from the facts on every
read, and every number names the fact it was counted from.

```text
 facts (tables, RLS)                 projections (pure, no clock)                     surfaces and documents
 ──────────────────────              ─────────────────────────────────────────         ───────────────────────────────
 step_evidence ─ stamps ──┐          skillProfile.ts                                   /courses/<id>/skills
 step_completions         │   ┌──▶   rows: 7 registry dims + troubleshooting,          ├─ SkyMap (competency map)
 evidence_artifacts       │   │      decisions, retention, execution                   ├─ DomainBoard   ◀── skillDomainsView.ts (8 domains)
 verification_receipts    ├───┤      abilities (38 indicators), timing (2 stamps)      ├─ KpiBoard: 28 tiles, 6 scores, timing
 deliverables (forms)     │   │              │                                          └─ KpiTable, Agent view (kpi-board/2)
   decision blocks        │   │              ▼
 deliverable_status       │   │      kpiBoard.ts ──▶ scores.ts (docs/scoring.ts)        /dashboard
 deliverable_reviews      │   │      28 KPIs · 6 scores · timing                       ├─ RecordCategories ◀── recordCard.ts (14 categories, tier at 10)
 deliverable_review_marks │   │              │                                          ├─ RecordStrip (12 progress figures)
 step_flag_events         │   │              ▼                                          └─ KpiPack per course
 cohorts (start date) ────┘   │      memberExport.ts ──▶ member-profile/2 + credential
                              │      cohortKpi.ts   ──▶ cohort-kpis (bands, score means, timing)   /instructor/<id>/cohort
                              │      recordPdf.ts   ──▶ the PDF (figures, categories, scores)     /share (SharedProfile)
 registries (data) ───────────┘
   skills · tools · sops · standards · certs · workRoles
   kpis (7×4) · scoring (6) · skillDomains (8) · recordCategories (14, TROUBLE_GROUPS, CHANGE_GROUPS)
```

The method behind the scores, the timing and the tier is `docs/SCORING.md`; the published shapes
are `content/schemas/` (`kpi-board`, `member-profile`, `skill-profile`, `scoring`,
`record-category`, `decision-record`) and the ontology (2.0.0) carries the registries. R134 put
the scores and the timing on the KPI board, the table and the pack (a count prints no
denominator; a minutes row prints the median over the steps timed and the share within the hour),
folded score means and the group's timing into the cohort report, carried the record by category
into the export, the credential's results, the PDF and the shared page, and gave the instructor one
mark per rubric category beside the verdict (`ReviewCell`, appended to `deliverable_review_marks`).

### Ownership and the hardening layer (R135)

The repository is proprietary (`LICENSE`, `NOTICE.md`, `SECURITY.md`, `CODEOWNERS`; the owner makes it private). The
security model has three layers and each is tested where it lives. **The database** (migration 0023, proven by
`supabase/tests/rls.sql`): nobody inserts a profile row by request (the signup trigger, security definer, does), so no
account can arrive as admin; a `reviewed` skill level is clamped to `verified` unless an instructor approved the team's
work (`team_has_review`); at most 50 reports and 100 support rows per member per day, counted by triggers that run as
the owner so a row policy cannot hide rows from the count; size checks on forms, snapshots, state and notes (added NOT
VALID, so rows already there are left alone); an avatar is https or null; a form write names its author only as the
writer; a report names a team the reporter is on; every trigger function pins `search_path`. **The functions**
(`_shared/cors.ts`, `_shared/limits.ts`, Deno-tested): `APP_ORIGIN` is required and nothing is echoed — a browser
origin that is not it is refused with 403 before the function runs; a member holds at most 20 live candidate links, is
issued at most 120 stamps an hour and causes at most 10 report emails a day; the email is a fixed template that names
who, what kind, which task and course, never the note; `delete-account` answers a fixed code and logs the detail. **The
app**: a CSV cell that begins `= + - @`, tab or CR is prefixed with an apostrophe before quoting (`csvEscape`, the one
helper both writers use), the CSP names the two avatar hosts, and sign-out clears the deliverables outbox. **CI** runs
with a read-only token, every action pinned to a commit, plus a `security` job (`npm audit` on runtime dependencies and
gitleaks over the full history). The lab passwords left the source: the app says "set by the instructor" and
`page-shape.test.ts` asserts no literal is anywhere in `src`.

### Support codes and the support log (R129)

A failure shows a person a support code and a time and nothing else; the detail stays on our side. `src/lib/reportError.ts`
makes the code (`E-` and six characters with no look-alikes), writes the whole story to `client_errors` (migration 0020: the
database's error code, message and status, the account's id and email, the area, the reason, the page and the browser) and
returns `{ code, at }`; it never throws, so a log that cannot be written (signed out, offline, 0020 not yet applied) still gives
the person a code. Only the person it is about can insert a row, only an admin reads (the Support errors list on
`/instructor/metrics`, searchable by code, `ErrorLog`, props only), nobody updates or deletes. The acknowledgement write
(`acceptInCloudDetailed`) is the first caller: its result carries the reason and the reference, never the database's words, and the
module prints nothing to the console. Before: the error object went to the console and a permission fault's code to the student.

**What a "gate" is, in this codebase.** A gate is a checkpoint that decides whether you may continue. There are four:
the **sign-in gate** (`src/proxy.ts` and `src/lib/routeGate.ts`: no session, no course material or dashboard, runs on the server on
every navigation); the **enrolment gate** (`CourseEnrolGate`: signed in, but have you joined this course and picked a role);
the **agreements gate** (`LegalGateOverlay` in `AgreementGate.tsx`: the full-screen "Before you continue" checklist that covers
everything until the current agreements are accepted, and again whenever one changes); and the **instructor and admin gates**
(`InstructorGate`, `AdminGate`: staff pages). The course **week gates** are different: a graded checkpoint inside a course that
opens when a team has finished the week's work. Gates are not content security: course text still ships in the browser bundle (roadmap R37).

### Exports are a compact PDF (R127)

Every file a learner could save was JSON: the member profile, the credential, the KPI board, a shared
copy, the issues. Nobody a member would hand one to can open it, so the exports are now one compact PDF of
skills, progress and issues. `src/lib/pdf.ts` is the writer: A4 pages, the three standard fonts every viewer
carries (nothing is embedded, so a file is a few kilobytes), WinAnsi text with Adobe's Core 14 widths so a line
breaks where it really ends, wrapping and page breaks, hairline rules and filled rectangles. It is pure, adds
no dependency and reads no clock (the caller passes the creation time), so the same input is the same bytes.
Text outside WinAnsi prints as "?" so a gap is visible. `src/lib/recordPdf.ts` is the document: the figures the
page printed (the dashboard passes its twelve, so the PDF is the strip), the skills by name (verified,
practised, tools, procedures, standards, tactics and practices, exam domains, the roles the courses prepare
for; each counted once at the best level any course reached, as the portfolio does), progress by course with a
bar, and the issues the member reported (`IssueDto`, joined as the inbox joins them, newest first; a note is cut
at 280 characters and 40 are listed, with "and N more"). A normal record is one page; thirteen courses with
everything reached are four.

It is offered where the JSON file was: the dashboard (the whole record, and each course's card for that
course), the portfolio, the Home card (that course), the shared-copy page (a profile copy, or a credential
copy as a one-page statement of what it is aligned to, with its digest and the line that it is unsigned) and the
issues inbox (the list on screen, with the tab and filters said on the first page, grouped by course, with
who reported it and on which version). The issues a member reported are read at the click
(`ownIssues` in `lib/recordFacts.ts`): a team's reports are visible to the team, so only the member's own are
kept. A shared copy holds no issues, so its PDF has no issues section rather than a claim that there are none.
`downloadBytes` in `lib/download.ts` is the one place a binary file is handed to the browser.

Still machine-readable, on purpose, and listed in the page-shape guard so a new one is added deliberately: the
account page's "Export my data" (the complete dump; the privacy policy promises it as JSON, so changing it needs
a new policy version), the Deliverables page's "Export my work" (a handoff file a teammate restores and merges,
`docs/handoff.ts`), the Studio's course document and the course export (imported again), the fix bundle and
the live course document (folded into the code), the IaC template files a lab step asks for, the CSV files and
the calendar file. "Copy JSON" stays on the clipboard for an agent. The credential is no longer a file: it is
what a link serves, and the shared page prints it as the PDF statement.
`pdf.test.ts` reads the file back (offsets, escaping, wrapping, margins, page breaks, determinism);
`recordPdf.test.ts` holds the content, order, limits and shared copies of any shape; the browser sweep opens the
real downloads with PDFium (Chrome's engine) and pypdf.
