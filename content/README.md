# Course content — the JSON snapshot

One JSON document per course, generated from the TypeScript seeds:

| File | Course | Source of truth |
|---|---|---|
| `courses/security-plus.json` | Security+ | `src/lib/data/seed/securityPlus.ts` · `src/lib/docs/definitions.ts` · `src/lib/labTopology.ts` |
| `courses/cysa-plus.json` | CySA+ SOC | `src/lib/data/seed/cysa.ts` · `src/lib/docs/cysaDeliverables.ts` · `src/lib/labTopology.ts` |
| `courses/mssp.json` | MSSP | `src/lib/data/seed/mssp.ts` · `src/lib/docs/msspDeliverables.ts` |
| `courses/server-plus.json` | Server+ Build & Handover | `src/lib/data/seed/serverPlus.ts` · `src/lib/docs/serverPlusDeliverables.ts` · `src/lib/docs/serverProcedures.ts` · `src/lib/serverTopology.ts` |
| `courses/index.json` | catalogue | counts per course |

**The TypeScript is the source of truth.** Edit the seed, then regenerate:

```
npm run content:export
```

`src/lib/content/dto.test.ts` compares each file with a fresh export and fails when
a seed changed without regenerating; CI runs the export and diffs this folder.

## What a document holds

```
{
  "schema": "capstone-course-dto/1",
  "generatedFrom": ["src/lib/data/seed/server-plus.ts", …],
  "course":        { roles, weeks, gates, tasks[ steps[ commands, expectedOutput, verify, fixes … ] ] … },
  "deliverables":  [ { id, title, file, folder, weeks, sections[ fields | groups(columns, seed) ], dod[ {label, week} ] } ],
  "procedureWeeks": [ … ],            // Server+ only — the configuration guide
  "procedures":     [ { id, week, title, where, summary, steps[ {cmd|gui, explain, doc} ] } ],
  "topology":       { HOST, BRIDGES, BASE_VMS, OPS … }   // the addressing single source of truth
}
```

## What is deliberately absent

- **Definition-of-Done check functions** and **derived columns** cannot be JSON. They
  appear as `{ "$fn": "test" }` / `{ "$fn": "derived" }` markers beside their labels;
  the code lives in the deliverables file named in `generatedFrom`.
- **React components** (diagrams, the guide's rendering) and **student state**
  (progress, forms, evidence — localStorage or Supabase) are not content.
- **Glossary and lab-access field definitions** are platform-wide, in
  `src/lib/glossary.ts` and `src/lib/labAccess.ts`.

## Reading the Server+ document

Weeks 0–6 (`course.weeks`; weeks 5 and 6 are `advanced: true`), tasks with `shared: true`
are worked by every focus, `sp-w{N}-{net|win|lnx|mgmt}` are the per-focus deep-dives, a
step's `guideRef.procedureId` names an entry in `procedures`, and any `10.10.30.T` /
`10.20.T` in a command is a per-team rule the Lab access panel fills in.
