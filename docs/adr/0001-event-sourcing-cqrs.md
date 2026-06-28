# ADR 0001 — Event sourcing + CQRS

- **Status:** Proposed
- **Phase:** 1

## Context
Today writes are destructive upserts (`step_completions`, `deliverables` jsonb); history is lost. The moat
is the *behavioral data*, which requires an immutable record. Metrics are already pure projections, so the
read side is half-aligned.

## Decision
Adopt an append-only, immutable, signed `events` log (xAPI-shaped) as the source of truth. All state tables
become **projections** rebuilt from the log (CQRS). Introduce via **dual-write**: existing repo writes also
append an event; current state remains the first projection. No UPDATE/DELETE on `events`.

## Consequences
- (+) Full audit trail, replayable projections, the asset the platform is built to own.
- (+) Additive — slots into the `src/lib/data/index.ts` seam; today's dashboards keep working.
- (−) Two write paths during transition; projection/rebuild workers to maintain.
- Retrofitting events later would mean reconstructing lost history — hence build now.
