# Integration — CertHatch ⇄ capstone-labs (shared kernel)

> Two **separate** platforms (separate repos, deploys, databases, ownership) that share a deliberately small
> contract so a PBQ a learner struggles with in **CertHatch** can pull a targeted hands-on lab in
> **capstone-labs**. Pattern: **shared kernel between two bounded contexts** — share the minimum, keep
> everything else private.
> Companions: [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`ROADMAP.md`](./ROADMAP.md),
> [`OPERATIONS.md`](./OPERATIONS.md), [`adr/0008-shared-kernel-integration.md`](./adr/0008-shared-kernel-integration.md).

---

## 1. Principle — two bounded contexts, one small shared kernel

**Do not merge databases or models.** CertHatch and capstone-labs are independent bounded contexts. The only
things they agree on (the shared kernel) are the **competency ontology**, the **xAPI event vocabulary**, and
**identity (OIDC)** — plus a shared **Learning Record Store (LRS)** as the converging evidence store. Each
platform wraps the kernel in an **anti-corruption layer (ACL)** so its internal model stays clean and ontology
changes are absorbed in one place.

```
   CertHatch (bounded context)                 capstone-labs (bounded context)
   items · item-stats · psychometrics          environments · validators · scenarios
            │  ACL                                   ACL  │
            ▼                                             ▼
   ┌─────────────────────────  SHARED KERNEL  ─────────────────────────┐
   │  Competency Ontology (versioned)   ·   xAPI event vocabulary       │
   │  Identity (OIDC)        ·   Learning Record Store (LRS)            │
   └───────────────────────────────────────────────────────────────────┘
                         ▲  emit xAPI            │  subscribe to events
                         └───────────────────────┘
```

---

## 2. What is shared vs private

| | Shared (kernel) | Private to each platform |
|---|---|---|
| Model | competency/objective ontology (IDs + graph) | items, item-stats, environments, validators, scenarios |
| Data | xAPI evidence in the LRS; competency-level signals | raw responses, raw env state, content, enrichment |
| Identity | one learner via OIDC | platform-local profiles/settings |
| Code | ontology package + event schemas | everything else |

**Rule: only competency-level conclusions cross the boundary** — never raw item responses or full environment
state. CertHatch sends "weak on competency C", not the learner's answers.

---

## 3. The shared components

1. **Competency Ontology** — published as a **versioned artifact** (npm package) both platforms consume, or a
   small read-only service. Competency IDs are the **join keys** across both platforms. Semver; additive
   changes; deprecate, never silently break. Each platform pins a version and its ACL absorbs upgrades.
   *(In capstone-labs this is the same ontology that Phase 1 anchors tasks/steps/deliverables to — see
   [`ROADMAP.md`](./ROADMAP.md) Phase 1 control/competency anchoring.)*
2. **Learning Record Store (LRS)** — one xAPI store both platforms write to. Holds the converging evidence
   (CertHatch responses + lab validator results, both referencing competency IDs). Consent-aware. **The only
   place cross-platform learner data co-mingles.**
3. **Identity (OIDC)** — a shared issuer so `subjectId` is the same person in both contexts. Without it you
   can't connect a CertHatch struggle to a capstone-labs learner. *(capstone-labs already authenticates via
   OIDC — Supabase Google/GitHub/magic-link; point both platforms at one issuer.)*
4. **Event channel** — a bus/webhook with the **outbox pattern** for reliable emission, carrying domain events
   like `CompetencyWeaknessDetected`. **Choreography, not synchronous calls** — neither platform blocks on the
   other.

---

## 4. The remediation loop (competency-mediated, not item-hardcoded)

```
1. CertHatch: a learner's ability estimate θ for competency C drops below threshold
   (or N low-score attempts / heavy hint use on items mapped to C).
2. CertHatch emits  CompetencyWeaknessDetected { subjectId, competencyId: C, severity, evidenceRefs }.
3. capstone-labs (subscriber) finds scenarios where competencyRefs ∋ C, ranks by fit, and
   recommends / provisions that lab to subjectId.
4. Learner runs the lab; validators emit xAPI results referencing C back to the LRS.
5. CertHatch reads strengthened evidence for C → eases off that topic. Loop closed.
```

**Why mediate through competency, not link PBQ→lab directly:** new PBQs and new labs participate automatically
just by being tagged to competencies. CertHatch owns *what's weak* (its psychometrics); capstone-labs owns
*which lab fixes it* (its scenario↔competency map). *(Optional: a high-value PBQ may carry a curated
`deepensInto: scenarioId` hint, but the default path is always competency-mediated.)*

---

## 5. Contract DTOs (the shared surface only)

```jsonc
// Shared kernel: CompetencyNode (the interlingua)
{ "id":"comp.ufw.least-privilege","version":"1.4.0","label":"Configure UFW least-privilege",
  "objectiveRefs":["SY0-7xx.2.3","CIS.4.x"], "parents":["comp.host-firewalling"] }
```
```jsonc
// Shared event: xAPI statement (both platforms emit this shape)
{ "actor":{"id":"subjectId","oidcSub":"…"}, "verb":"answered|validated",
  "object":{"platform":"certhatch|capstone-labs","refType":"item|validator","refId":"uuid"},
  "result":{"success":false,"score":0.2}, "context":{"competencyIds":["comp.ufw.least-privilege"]},
  "consentScope":["share-cross-platform"], "timestamp":"ISO" }
```
```jsonc
// Domain event: the trigger (competency-level only — no raw answers cross)
{ "type":"CompetencyWeaknessDetected","subjectId":"uuid",
  "competencyId":"comp.ufw.least-privilege","severity":"high",
  "evidenceRefs":["lrsStatementId…"],"detectedBy":"certhatch","at":"ISO" }
```
```jsonc
// Lab side output (capstone-labs → learner / back-channel)
{ "type":"RemediationRecommendation","subjectId":"uuid",
  "competencyId":"comp.ufw.least-privilege","scenarioId":"uuid","rank":1,"reason":"matches weak competency" }
```

These reuse the platform's own event shapes ([`ARCHITECTURE.md`](./ARCHITECTURE.md) §3–4): the cross-platform
xAPI statement is the same statement capstone-labs already emits internally; only its `consentScope` must
include `share-cross-platform` to leave the boundary.

---

## 6. Low-coupling mechanics

- **Anti-corruption layer** in each platform translates kernel ↔ internal model. Ontology change → fix the ACL,
  not the whole codebase. *(capstone-labs ACL lives behind the data seam `src/lib/data/index.ts` and the
  control/competency map from Phase 1.)*
- **Versioned ontology** pinned per platform; upgrade on each platform's own schedule.
- **Outbox pattern** for event emission so a signal isn't lost if the other platform is down.
- **Idempotent consumers** so a replayed event doesn't double-recommend.
- **No shared database, no synchronous dependency** — if capstone-labs is offline, CertHatch still functions;
  the event waits in the outbox.

---

## 7. Consent & privacy across the boundary

Because data crosses between two entities:
- **Explicit cross-platform consent scope** (`share-cross-platform`) on the learner; signals don't cross
  without it. *(Builds on the consent model in [`adr/0005-consent-provenance.md`](./adr/0005-consent-provenance.md).)*
- **Minimize what crosses:** competency + severity + evidence pointers — never raw responses or env state.
- **Clear ownership:** CertHatch owns its content/responses; capstone-labs owns its environments/results; the
  LRS owns the shared evidence record. Document the data-processing roles between the two entities.

---

## 8. Build now vs defer (maps onto the roadmap)

**Build now** *(these are exactly the Phase-1 foundations — see [`ROADMAP.md`](./ROADMAP.md)):*
- The shared **competency ontology** as a versioned package both consume — the foundation.
- **OIDC** shared identity (one issuer for both platforms).
- **xAPI** event shape on both sides (write to a simple statement store before a full LRS exists).
- **ACL stubs** in each platform.

**Defer:**
- The full **LRS + event bus + live remediation loop** — turn on once both platforms emit clean
  competency-tagged events and the ontology is stable.
- **Auto-provisioning** labs — start with *recommend*, add *provision* later.
- Curated `deepensInto` per-item links.

---

## 9. The spine, in one line

**Two independent platforms, one versioned competency ontology + shared LRS + shared identity; CertHatch
decides *what's weak* and emits a competency-level signal; capstone-labs decides *which lab fixes it* — coupled
only by shared IDs and events, never by a shared database.**
