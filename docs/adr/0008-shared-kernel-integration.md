# ADR 0008 — Integrate with CertHatch via a shared kernel (not a shared database)

- **Status:** Proposed
- **Phase:** 1 (kernel: ontology package, OIDC, xAPI shape, ACL stubs) → later (full LRS + event bus +
  live remediation loop)
- **Related:** [`INTEGRATION_CERTHATCH.md`](../INTEGRATION_CERTHATCH.md),
  [0003 control anchoring](./0003-anchor-control-codes.md),
  [0005 consent/provenance](./0005-consent-provenance.md),
  [0006 standards](./0006-standards-xapi-oscal-lti-oidc.md)

## Context
CertHatch (cert-prep / PBQs / psychometrics) and capstone-labs (environments / validators / scenarios) are
separate products with separate repos, deploys, databases, and ownership. They should interoperate so a
learner's weakness detected in one drives remediation in the other — and the design should generalize to
*other* platforms, not just CertHatch.

## Decision
Integrate as **two bounded contexts sharing a small kernel**: a **versioned competency ontology** (the join
keys), an **xAPI event vocabulary**, shared **OIDC identity**, and a shared **LRS** for converging evidence.
Each platform wraps the kernel in an **anti-corruption layer**. Communication is **choreography** (events with
the outbox pattern + idempotent consumers), never synchronous calls. **Only competency-level conclusions
cross** (e.g. `CompetencyWeaknessDetected`) — never raw responses or environment state — and only with
explicit `share-cross-platform` consent.

Explicit **non-goals:** no shared database, no shared internal models, no synchronous runtime dependency
between the platforms.

## Consequences
- (+) Each platform evolves independently; either can be offline without breaking the other (event waits).
- (+) New PBQs and new labs interoperate automatically just by being tagged to competencies — the same
  mechanism extends to any third platform that speaks the kernel.
- (+) Reuses what Phase 1 already builds (ontology anchoring, xAPI events, OIDC, consent) — the integration is
  mostly *publishing the ontology as a package* + *ACL stubs*, not new infrastructure.
- (−) Requires governance of the ontology package (versioning owner, semver discipline) and a shared OIDC
  issuer + LRS host agreed between the two entities.
- (−) Cross-entity data flow needs a documented data-processing agreement and consent enforcement on both
  sides.
