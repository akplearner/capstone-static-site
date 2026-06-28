# ADR 0006 — Adopt xAPI, OSCAL, LTI 1.3, OIDC

- **Status:** Proposed
- **Phase:** 1 (xAPI shape, OIDC) → 3 (OSCAL reports, LTI launch)

## Context
Interop is the cheapest future-proofing: it lets humans and agents emit the same data, bridges to MSP/audit
tooling, and allows LMS delivery. We already use OIDC via Supabase.

## Decision
- **xAPI / cmi5** as the event shape (actor-verb-object-result) from day one.
- **OSCAL** (NIST) for frameworks/controls/baselines so they're machine-readable and map to audits.
- **LTI 1.3** for launching labs from an LMS (later).
- **OIDC** for identity of humans *and* agents.

## Consequences
- (+) Agents emit the same shape as humans; control data bridges to compliance tooling; LMS reach.
- (+) Authoring to these shapes now costs little; conforming later is costly.
- (−) Some upfront schema discipline; full OSCAL/LTI surface arrives in later phases.
