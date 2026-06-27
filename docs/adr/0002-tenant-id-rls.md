# ADR 0002 — `tenant_id` everywhere + RLS

- **Status:** Proposed
- **Phase:** 1

## Context
Multi-tenancy today is *soft* — scoped by `course_id` + `team_id` with RLS JOINs. One platform must serve a
class, a company, and an MSP's clients with isolation. Adding a tenant boundary after data exists is painful.

## Decision
Add `tenant_id` to every user-data row (events, memberships, completions, deliverables, attestations,
consent…). Enforce isolation in **Row-Level Security** keyed on `tenant_id` (+ `subject_id`). Backfill the
current data with a single default tenant.

## Consequences
- (+) True isolation; access becomes a first-class column, not an afterthought.
- (+) Enables the MSP/multi-org business model without re-architecture.
- (−) Every query/policy must carry tenant context; a default-tenant backfill migration is required.
