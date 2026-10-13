# The event contract (R108)

> The shape every write site would append to an append-only log, and which site would append
> what. A contract only: **no `events` table exists and no dual-write runs** this round. ROADMAP
> Phase 1 item 1 and [`adr/0001`](./adr/0001-event-sourcing-cqrs.md) describe the table; this page is
> what it will receive, so the day it lands nothing has to be rediscovered. The shape is published as
> [`content/schemas/event.schema.json`](../content/schemas/event.schema.json). The cross-platform
> statement stays [`xapi-statement.schema.json`](../content/schemas/xapi-statement.schema.json).

## The shape

```jsonc
{
  "actor":   { "id": "uuid", "type": "human" },            // or "agent" (ADR-0007: actor.type from day one)
  "verb":    "verified",                                     // ticked · unticked · attempted · verified · hashed · transitioned · submitted · reviewed · reported · flagged
  "object":  { "courseId": "security-plus", "taskId": "red-w1-osint", "stepId": "red-w1-s1", "refType": "step", "refId": "red-w1-osint::red-w1-s1" },
  "result":  { "success": true, "matched": 3, "total": 3, "attempts": 1 },
  "context": { "competencyIds": ["comp.recon.osint"], "ontologyVersion": "1.1.0", "week": 1, "assist": "none" },
  "consentScope": ["own"],
  "timestamp": "2026-10-13T00:00:00Z"
}
```

- `context.assist` is `none`, `hint`, `tutor` or `agent`: "competent with a tutor" and "competent
  alone" are different facts, and an employer will ask. Nothing records it today; the field is
  reserved so the first UI that offers help can stamp it.
- `consentScope` defaults to `["own"]`; `team`, `instructor` and `share-cross-platform` are the
  grants of [`adr/0005`](./adr/0005-consent-provenance.md). An event never leaves its scope.
- `context.competencyIds` are the ontology's ids for the task (`content.skills.SKILL_OF`), so a
  projection joins events to competencies without reading the course.

## The write sites

| Repository write | Verb | `object.refType` | `result` |
|---|---|---|---|
| `progressRepo.setCompletion` / `removeCompletion` | `ticked` / `unticked` | `step` | — |
| `evidenceRepo.saveStep` (a paste that did not match) | `attempted` | `step` | `matched`, `total`, `attempts` |
| `evidenceRepo.saveStep` (a paste that matched) | `verified` | `step` | `success: true`, `matched`, `total`, `attempts`, `sha256` |
| `evidenceRepo.saveArtifact` | `hashed` | `artifact` | `sha256` |
| `statusRepo.save` | `transitioned` | `deliverable` | `status` |
| `submissionsRepo.submit` | `submitted` | `submission` | `sha256`, `categories` (the four rubric verdicts: the `rubric_score` event of the measurement plan, named without the word score) |
| `reviewRepo.save` | `reviewed` | `review` | `status` |
| `taskReportsRepo.save` | `reported` | `report` | — |
| `stepNotesRepo.save` (the stuck flag only, never the note) | `flagged` | `flag` | — |

When the table lands, each site appends after its own write (dual-write, the outbox pattern of
`src/lib/data/outbox.ts` on failure) and today's tables stay the first projection; nothing a page
shows changes. Until then the numbers come from the projections over the fact tables
(`src/lib/skillProfile.ts`, `src/lib/kpiBoard.ts`), which is why the catalogue marks the rows
that need an event as `needs-events` rather than computing them from guesses.
