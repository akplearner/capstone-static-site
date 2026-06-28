# ADR 0004 — Content-addressed evidence

- **Status:** Proposed
- **Phase:** 1 (hash) → 2 (blobs)

## Context
Evidence stays on the student's machine today; the app gives a naming convention, `sha256sum` guidance, and
a downloadable chain-of-custody log. Nothing is content-addressed or stored. The same integrity model
should operate at platform scale.

## Decision
Persist each artifact's **SHA-256** in Postgres and reference it from events/deliverables/validator
results. When server-side storage is enabled, store blobs in object storage **keyed by their hash**
(content addressing). Self-study keeps files local; the *hash + custody record* is what the platform owns.

## Consequences
- (+) Tamper-evidence, dedup, and provenance for free; promotes Week-3 chain-of-custody to a platform asset.
- (+) Works in self-study (hash only) and hosted (hash + blob) modes.
- (−) Hash capture must be wired into the evidence/submit flow; blob storage adds an object-store dependency
  when enabled.
