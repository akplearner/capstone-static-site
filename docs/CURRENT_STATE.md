# Capstone Labs — Current State (as-is)

> An honest snapshot of what exists today, mapped to the [North Star](./ARCHITECTURE.md). For each layer:
> **today → target → the seed we build on**. The path is in [`ROADMAP.md`](./ROADMAP.md).
> **Updated by:** repository exploration of the live codebase.

---

## TL;DR

Today the app is a **fully working, mostly client-side course platform**: authored Security+ content
(Weeks 0–4 × Red/Blue/GRC, ~90 steps, 3 gates), 8 deliverable forms that render PDF/CSV and a team ZIP,
guided task runner with progress, gate sequencing + completion, a lab-access panel, and
evidence/chain-of-custody *guidance*. Persistence is **localStorage by default**, with an **optional
Supabase backend** (auth + cloud progress + team sync) behind a clean repo seam.

The good news for the north star: **metrics are already side-effect-free projections**, there's a **clean
data seam** to swap in an event-sourced backend, frameworks are **already tagged** on every task/step, the
**DoD-check interface** is a natural seed for validators, and the **chain-of-custody / SHA-256** work is the
conceptual seed for content-addressed evidence. The gaps are an **event log**, **published control-code
anchoring**, **state-reading validators**, **tenant_id + agent actors**, and **consent/provenance** — all
additive, none requiring a rewrite.

---

## Layer-by-layer map

### 1. Persistence / event sourcing
- **Today:** state-based upserts. `step_completions` rows and `deliverables` jsonb are overwritten in
  place; **still no general event log and no history of those tables.** The one exception is the
  **evidence ledger** (`step_evidence`, `evidence_artifacts` — `supabase/migrations/0003_evidence_ledger.sql`),
  which keeps per-step verification records with hashes, attempt counts and timestamps. That is a
  purpose-built fact table, not the xAPI event log Phase 1 calls for — a step's history is still
  folded into one row rather than appended. Repo seam: `src/lib/data/index.ts`; impls
  `src/lib/data/supabaseProgressRepo.ts`, `supabaseDocsRepo.ts`, `supabaseEvidenceRepo.ts`,
  `localStorage*Repo.ts`.
- **Target:** append-only, immutable, signed `events`; everything else a projection.
- **Seed to build on:** the **repo seam** is the single swap point; `step_completions` is already a fact
  table (one row per completed step) — a short step from an event.

### 2. Measurement / CQRS
- **Today:** `getTaskPercent`/`getWeekCompletion`/`deriveGateStatus` are **pure, recomputable** functions
  over a completion key-set (same math reused by both localStorage and Supabase repos).
- **Target:** read models projected from the event log.
- **Seed:** these *are* projections already — they just read state instead of an event stream. Half-done.

### 3. Ontology — frameworks → controls/competencies
- **Today:** frameworks are **coarse string labels** (`NIST_CSF`, `CIS`, `OWASP`, `ISO_27001`,
  `NIST_800_61`, `NIST_800_115`, `CVSS`, `STRIDE`) attached to `Task.frameworks` / `Step.frameworks` /
  `DeliverableDef.framework`, with helpers in `src/lib/utils.ts` (`getFrameworkLabel/Description/Why/Color`).
  Published control codes appear only as **free text** in deliverable `standard`/`reference` fields. **No
  competency or cert-objective concept** exists.
- **Target:** Control + Competency + CertObjective entities; everything anchored to published codes
  (`NIST.ID.AM-1`, `CIS 5.x`, `OWASP A03`, `SY0-7xx`).
- **Seed:** every task/step/deliverable is already framework-tagged — we add a `controls` map and
  `controlIds`/`competencyIds` rather than starting from zero.

### 4. Validators / ground truth
- **Today:** `DodCheck` (`src/lib/docs/types.ts`) — `test: (d: DeliverableData) => boolean` — inspects
  **only the student-typed form data**, not real system state. Gates = "all required steps marked complete"
  (`deriveGateStatus`).
- **Target:** validators that **read environment state** (config, services, logs, tool output) → pass/fail
  + evidence, mapped to controls.
- **Seed:** `DodCheck` is the right *shape* (declarative check → boolean + label); generalize it to a
  `Validator` interface that can later read state.

### 5. Environments-as-code
- **Today:** environments are **implicit** in task prerequisite prose ("SSH to Ubuntu…") and the new Lab
  Setup guide; students build VMs themselves. No `Environment` entity.
- **Target:** declarative IaC (hosts/network/services/seed state), versioned, referenced by Scenario.
- **Seed:** the Lab Setup guide + lab-access fields enumerate the intended topology; a good spec source for
  the first `Environment` definitions.

### 6. Identity / tenancy
- **Today:** optional Supabase **OIDC** (Google/GitHub/magic-link), **humans only**, `profiles.is_instructor`
  flag. Multi-tenancy is **soft**: scoped by `course_id` + `team_id` (no `tenant_id`); RLS uses
  `(course_id, team_id)` JOINs (`supabase/migrations/`).
- **Target:** `tenant_id` on every row + RLS; `actor.type: human|agent`.
- **Seed:** RLS is already in place and the auth layer is OIDC — adding `tenant_id` and an actor type is
  additive.

### 7. Evidence / content addressing
- **Today:** evidence stays **local**; the app provides a naming convention
  (`YYYYMMDD_TeamXX_Tool_Action.ext`, validated by `validateEvidenceFileName`), `sha256sum` guidance, and a
  downloadable **chain-of-custody log** (`src/lib/docs/custodyTemplate.ts`) seeded into the team ZIP
  (`src/lib/docs/package.ts`). The **hashes are now persisted** to `evidence_artifacts`, keyed by the
  digest itself, so re-hashing a file cannot double-count it and the custody log renders from recorded
  data rather than retyped data. The **files themselves are still never uploaded**, which is ADR-0004's
  intent for self-study; object storage remains unbuilt.
- **Target:** blobs in object storage keyed by SHA-256; hash stored in Postgres; integrity/dedup/provenance
  for free.
- **Seed:** the chain-of-custody / SHA-256 model is exactly the platform-scale pattern, one level up.

### 8. Consent / provenance
- **Today:** **absent.** Only an "authorization" text field on the Scope deliverable.
- **Target:** consent grants + provenance/CLA fields as first-class data on every relevant row.
- **Seed:** none — this is net-new, hence "build the fields now, brutal to retrofit later."

### 9. Standards & interop
- **Today:** none formally adopted (OIDC via Supabase is the exception).
- **Target:** xAPI/cmi5 events, OSCAL control data, LTI 1.3 launch, OIDC identity.
- **Seed:** event shape can be authored xAPI-style from day one; control data can be authored OSCAL-mappable.

---

## Domain entities: present / partial / absent

| Target entity | Today | Status |
|---|---|---|
| Course / Week / Gate / Task / Step | `src/lib/types.ts` | **Present** |
| Deliverable (form + data) | `src/lib/docs/*` | **Present** |
| Member / Roster / Completion | `src/lib/types.ts`, repos | **Present** |
| Framework | `Framework = string` + helpers | **Partial** (labels, not control codes) |
| Tool | `Task.tools: string[]` (legend) | **Partial** (no version/role/env link) |
| Validator | `DodCheck` (form-data only); the ledger's output-token check is the first pass/fail evidence that survives a reload | **Partial** (still not state-reading) |
| Control / Objective | free-text in deliverable fields | **Absent** as an entity |
| Competency / CertObjective | `Task.objective`, `Step.learn` prose | **Absent** as an entity |
| Environment | implicit in prose + Lab Setup guide | **Absent** as an entity |
| Scenario | implicit (week theme + gate) | **Minimal** |
| Benchmark / SOP / Policy | exist as deliverable files | **Implicit** (not entities) |
| Evidence ledger (step verification + artifact hashes) | `step_evidence`, `evidence_artifacts`, `src/lib/evidenceLedger.ts`; browsable at `/courses/<id>/ledger` (`src/lib/ledgerView.ts`) | **Partial** (records proof; not an event log) |
| Review (instructor verdict on a form, per week) | `deliverable_reviews`, `reviewRepo`, `ReviewBanner` / `ReviewCell` | **Present** (R68) |
| Cohort (start date → week due dates, .ics) | `cohorts`, `cohortRepo`, `src/lib/calendar.ts` | **Present** (R68; one date per cohort, seeds carry none) |
| Step note / stuck flag | `step_notes` (owner-only) + `step_flags` (team + instructor), `stepNotesRepo` | **Present** (R68) |
| Rubric points (70 TEAM / 30 FOCUS per week) | `src/lib/rubric.ts`, `src/lib/cohort.ts` (CSV) | **Partial** (the platform's share; quality is still marked by hand) |
| Course snapshot (JSON DTO) | `content/courses/<id>.json`, `src/lib/content/dto.ts`, `npm run content:export` | **Present** (generated; the TS seeds stay the source of truth) |
| Event / Attestation / Consent | — | **Absent** |
| `tenant_id` | `course_id`+`team_id` soft scope | **Absent** (column) |

---

## Key seams (where the roadmap plugs in)

- **Data seam:** `src/lib/data/index.ts` selects repo impls — the swap point for an event-sourced backend.
- **Progress math:** `src/lib/data/localStorageProgressRepo.ts` / `supabaseProgressRepo.ts` — the
  projection functions to keep as read models.
- **Validators:** `DodCheck` in `src/lib/docs/types.ts`; checks in `src/lib/docs/definitions.ts`.
- **Frameworks:** `src/lib/utils.ts` (helpers); `frameworks: [...]` on tasks/steps/deliverables.
- **Schema:** `supabase/migrations/` (tables + RLS to extend with `events`, `tenant_id`, consent).
- **Evidence:** `src/lib/docs/custodyTemplate.ts`, `package.ts`, `validateEvidenceFileName` in `utils.ts`.
- **Identity:** `src/lib/useAuth.ts`, `src/lib/supabase/*`, `profiles.is_instructor`.
- **Instructor view:** `src/lib/data/cohortLoader.ts` reads a whole course (six selects, bypassing the
  per-user cache) for `/instructor/<course>/cohort`; `src/lib/search.ts` is the ⌘K index.
- **The host's holes:** `PUBLISHED_PORTS`, `CROSS_ZONE_ALLOW` and `hostRulesFile()` in `src/lib/serverTopology.ts`
  render the Proxmox host's iptables-restore file; the Week-2/3 seed steps, the guide, the topology diagram
  and the IP Plan's published-ports table all read that one model.
- **One home per command:** `src/lib/docs/serverCommands.ts` holds every Server+ base-build command once —
  which machine types it (`MACHINES` in `serverTopology.ts`), why it exists, what it prints, and whether it
  overwrites config. The seed and the guide are filled from it at load (`withCommandDetail` /
  `withProcedureDetail`); `serverProcedures.test.ts` fails if a command is explained in both files, if a chip
  disagrees with its sentence, or if a config write has no backup before it.
- **Drawing the part being built:** `TopologyFocus` (derived from the machines a task's commands name) sits on
  the task row, the week header and each guide week; `ServerTopologyDiagram` takes `highlight` and
  `builtThrough` to light one week and dim what has not been built yet.
- **Remote administration:** `REMOTE_ADMIN` in `src/lib/serverTopology.ts` is the tailnet's way into the zones
  (the host advertises both subnets; `hostRulesFile('the-holes')` allows `tailscale0` forward for SSH and RDP only).
- **Following the build:** `Course.buildMap` (one milestone per week) renders as `src/components/BuildMap.tsx` above
  the Tasks list; `Course.stepDensity` / `Course.guidedDefault` set a course's default view, and
  `src/lib/stepDensity.ts` keeps the student's own choice in `UserCourseState.stepDensity`.
- **IaC tool choice:** `src/lib/iacTool.ts` derives the OpenTofu form of every Terraform command, expected
  output and verify token at render time (`commandFor`/`applyIacTool`); the install line is authored twice
  (`opentofu` on a command entry); the choice is a Lab access field (`IAC_TOOL`) in `src/lib/labAccess.ts`.
- **Offline:** `public/sw.js` (hand-written; navigations network-first, `/_next/static` cache-first,
  RSC and Supabase never cached), `src/lib/pwa.ts`, `src/components/pwa/*`; `/offline` is the fallback.
