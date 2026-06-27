# Capstone Labs — Roadmap (MVP → North Star)

> The staged path from today's working MVP ([`CURRENT_STATE.md`](./CURRENT_STATE.md)) to the end goal
> ([`ARCHITECTURE.md`](./ARCHITECTURE.md)). Each phase is independently shippable and green; later phases
> assume the foundations of earlier ones. Decisions behind the phases live in [`adr/`](./adr/).

**Guiding rule:** ship value every phase, but lay the *cheap-now / brutal-to-retrofit* foundations
(events, tenancy, ontology anchoring, consent) before they're load-bearing.

---

## Phase 0 — MVP (DONE / in branches)

What exists today:
- Authored **Security+** course: Weeks 0–4 × Red/Blue/GRC, ~90 steps, 3 gates.
- **Guided task runner** + per-step progress; compact two-column steps; split & explained commands.
- **8 deliverable forms** → PDF/CSV + downloadable **team ZIP** in submission folder structure.
- **Gate sequencing** (a week locks until the prior gate passes; instructor override) + **completion summary**.
- **Lab-access panel** (target IPs/creds → substituted into commands) + reachability checklist.
- **Evidence handling & chain-of-custody** guidance + downloadable CoC log; DVWA lifecycle docs.
- **Optional Supabase backend**: OIDC sign-in (Google/GitHub/magic-link), cloud progress, team visibility,
  one-time local→cloud import, instructor flag — all behind `isSupabaseConfigured()`; localStorage
  otherwise.

> Status note: this work lives across unmerged branches (`integration-test`, `mvp-gaps`, `supabase-auth`,
> `compact-tasks-commands`). Merging + provisioning Supabase is the first operational step — see
> [`OPERATIONS.md`](./OPERATIONS.md).

**Acceptance:** a self-study student can build the lab, work the weeks in order, generate their report
package, and document evidence with chain of custody — fully offline, or cloud-synced when configured.

---

## Phase 1 — Foundations (cheap now, brutal to retrofit)

Goal: lay the spine so everything later is additive. Mostly invisible to students; transformative for the
data asset. Each item maps to a real seam.

1. **Event log + dual-write.** Add an append-only, immutable `events` table (xAPI-shaped:
   actor-verb-object-result-context). Have the existing repo writes (`setCompletion`, docs `save`,
   `joinTeam`, gate changes in `supabaseProgressRepo`/`supabaseDocsRepo`) **also append an event**.
   Keep current state tables as the first **projection** (rebuildable from events). *Seam:*
   `src/lib/data/index.ts` + the supabase repos. *ADR:* [0001](./adr/0001-event-sourcing-cqrs.md).
2. **`tenant_id` everywhere + RLS.** Add `tenant_id` to every user-data row; backfill the current
   single-tenant value; extend RLS in `SUPABASE_SETUP.md` to gate on it. *ADR:*
   [0002](./adr/0002-tenant-id-rls.md).
3. **Control/objective anchoring.** Introduce a `controls` catalog (published codes) + a `frameworks→controls`
   map, and add `controlIds` (and `competencyIds`) to tasks/steps/deliverables — start by enriching the
   existing `frameworks: [...]` tags. *Seam:* `src/lib/utils.ts`, `content-data.ts`, `definitions.ts`. *ADR:*
   [0003](./adr/0003-anchor-control-codes.md).
4. **`Validator` interface.** Generalize `DodCheck` into a `Validator { id, controlIds, run(ctx) → {pass,
   evidenceRef} }`. Early validators stay heuristic (form-data/self-report); the *interface* is what we
   commit to. *Seam:* `src/lib/docs/types.ts` + `definitions.ts`.
5. **Content-addressed evidence.** Persist each artifact's SHA-256 (+ optional object-storage blob) and
   reference it from events/deliverables — promote the chain-of-custody pattern from guidance to data.
   *Seam:* `custodyTemplate.ts`, `package.ts`. *ADR:* [0004](./adr/0004-content-addressed-evidence.md).
6. **Consent + provenance fields.** Add consent grants (train/share/benchmark) per subject and
   provenance/CLA fields on contributed content. Capture consent at sign-up/first-run. *ADR:*
   [0005](./adr/0005-consent-provenance.md).
7. **Actor type + capability-scoped API.** Add `actor.type: human|agent` to identity/events; keep the API
   resource-clean and capability-scoped (no agent gateway yet). *ADRs:*
   [0006](./adr/0006-standards-xapi-oscal-lti-oidc.md), [0007](./adr/0007-agent-ready-not-coupled.md).

**Acceptance:** every meaningful action appends a signed, consented, tenant-scoped, control-tagged event;
today's dashboards rebuild from the log; dropping a projection table and replaying events reproduces it.

---

## Phase 2 — Ground truth: environments + state-reading validators + attestations

Goal: turn "marked complete" into "proven against real state."

- **Environments-as-code.** First-class `Environment` definitions (hosts/network/services/seed state),
  versioned; Scenarios reference an `environmentRef`. (Start declarative even if provisioning stays manual.)
- **State-reading validators.** Implement real validators (read a config/service/log/tool output → pass/fail
  + evidence) for a handful of high-value controls (e.g. UFW least-privilege, logging enabled, SQLi
  reproducible). Emit `ValidatorResult` events.
- **Signed attestations.** On verified outcomes, issue signed `Attestation`s (competency + env-hash +
  validator evidence + framework refs). Show them on the learner profile.

**Acceptance:** a competency can be demonstrated by a validator reading actual state, producing a signed,
framework-mapped attestation backed by content-addressed evidence.

---

## Phase 3 — Dual-use & data flywheel

Goal: the same primitives serve commercial use and model/agent eval.

- **MSP posture / OSCAL reports.** Project events + validator results into control-coverage / posture
  reports; map to OSCAL for compliance lineage.
- **Benchmarks + eval sets.** Package consented, verified run trajectories as benchmarks ("how competent
  operators perform task X") and labeled datasets for evaluating agents on the same tasks.
- **Read-model API.** Expose `CompetencyMastery`, `ControlCoverage`, `MspPostureReport` projections via the
  capability-scoped API.

**Acceptance:** the same validator grades a student lab and an MSP client box; the event corpus yields a
posture report and a reusable benchmark.

---

## Phase 4 — Agent & ecosystem (DEFER — keep possible, don't build)

- **MCP server** as a *thin adapter* over the existing capability-scoped API.
- **A2A federation** riding the ontology + xAPI.
- **Scenario marketplace / payments** on CLA-assigned, provenance-tracked contributions.
- **Dedicated graph DB** only if traversal cost demands it.
- **Real-time agent execution** inside environments.

**Acceptance:** an agent authenticates (OIDC), runs a Scenario, and emits the *same* xAPI events as a human
— with no change to the core domain or data model.

---

## Phase dependency map

```
Phase 0 (MVP)
   └─ Phase 1 (event log · tenant_id · control anchoring · validator iface · CA-evidence · consent · actor type)
         └─ Phase 2 (environments-as-code · state-reading validators · attestations)
               └─ Phase 3 (MSP/OSCAL reports · benchmarks/eval sets)
                     └─ Phase 4 (MCP adapter · A2A · marketplace) — deferred
```

Nothing in Phases 2–4 requires reworking Phase-1 foundations — that's the point of building them first.
