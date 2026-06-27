# ADR 0005 — Consent + provenance as data

- **Status:** Proposed
- **Phase:** 1

## Context
There is no consent or provenance model today (only an "authorization" text field). What makes owned data
*legally usable and tradeable* is explicit consent and provenance. Retrofitting consent onto data already
collected without it is effectively impossible.

## Decision
Model **consent as data**: per-subject grants (`train`, `share`, `benchmark`, `sell-aggregate`) with scope
(`tenant|aggregate|public`), revocable, timestamped. Stamp every event with its `consentScope`. Add
**provenance/CLA** fields (contributor, CLA version, license) on contributed content (Scenarios, Validators).

## Consequences
- (+) Data becomes usable for training/benchmarks/sale with a clear rights record; contributions compound as
  assets, not liabilities.
- (+) Capturing consent at sign-up/first-run is cheap now.
- (−) Consent gating must be respected by every downstream use (projections, exports, benchmarks).
