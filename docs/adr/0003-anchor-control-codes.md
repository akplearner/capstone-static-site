# ADR 0003 — Anchor to published control & cert-objective codes

- **Status:** Proposed
- **Phase:** 1

## Context
Frameworks are coarse labels (`NIST_CSF`, `CIS`, …) on tasks/steps/deliverables; published control codes
appear only as free text. There is no competency/cert-objective concept. The mapping to published codes
*is* the value proposition (test what the cert/framework tests) and the join key for MSP/audit reuse.

## Decision
Introduce a `controls` catalog (published codes: `NIST.ID.AM-1`, `CIS 5.x`, `OWASP A03`, `SY0-7xx`) and a
`frameworks→controls` map. Add `controlIds` and `competencyIds` to tasks/steps/deliverables/validators,
enriching the existing `frameworks: [...]` tags rather than replacing them.

## Consequences
- (+) Every datum becomes ontology-mapped; enables attestations, coverage reports, and A2A interop.
- (+) Authorable incrementally — start with the controls already implied by current framework tags.
- (−) Requires curating the control catalog and mapping content to it; OSCAL alignment recommended early.
