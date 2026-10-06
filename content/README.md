# Course content — the JSON snapshot

One JSON document per course, generated from the TypeScript seeds:

| File | Course | Source of truth |
|---|---|---|
| `courses/security-plus.json` | Security+ | `src/lib/data/seed/securityPlus.ts` · `src/lib/docs/definitions.ts` · `src/lib/labTopology.ts` |
| `courses/cysa-plus.json` | CySA+ SOC | `src/lib/data/seed/cysa.ts` · `src/lib/docs/cysaDeliverables.ts` · `src/lib/labTopology.ts` |
| `courses/mssp.json` | MSSP | `src/lib/data/seed/mssp.ts` · `src/lib/docs/msspDeliverables.ts` |
| `courses/server-plus.json` | Server+ Build & Handover | `src/lib/data/seed/serverPlus.ts` · `src/lib/docs/serverPlusDeliverables.ts` · `src/lib/docs/serverProcedures.ts` · `src/lib/serverTopology.ts` |
| `courses/secai-plus.json` | SecAI+ (CY0-001) | `src/lib/data/seed/secaiPlus.ts` · `src/lib/docs/secaiDeliverables.ts` · `src/lib/docs/secaiContent.ts` |
| `courses/cissp.json` | CISSP | `src/lib/data/seed/cissp.ts` · `src/lib/docs/cisspDeliverables.ts` · `src/lib/docs/cisspContent.ts` |
| `courses/ccna.json` | CCNA | `src/lib/data/seed/ccna.ts` · `src/lib/docs/ccnaDeliverables.ts` · `src/lib/docs/ccnaDiagrams.ts` · `src/lib/ccnaTopology.ts` |
| `courses/azure-{fundamentals,administrator,devops}.json` | Azure (three quarters) | `src/lib/data/seed/azureCloud.ts` · `src/lib/docs/cloudDeliverables.ts` · `src/lib/cloud/azureTopology.ts` · `azureIac.ts` |
| `courses/aws-{cloud-practitioner,solutions-architect,devops}.json` | AWS (three quarters) | `src/lib/data/seed/awsCloud.ts` · `src/lib/docs/cloudDeliverables.ts` · `src/lib/cloud/awsTopology.ts` · `awsIac.ts` |
| `courses/index.json` | catalogue | counts per course, plus vendor, certification, level, prerequisite, next, exam fee, coverage and cost (R106) |

Every course's `deliverables[]` carries its RACI (`src/lib/docs/raci.ts`), every course
carries `content.cert` — the certification it prepares for, its exam domains, which domain
each task practises, the ladder and the cost (`src/lib/docs/certs.ts`, `costs.ts`; the
readable copy is `docs/courses/cert-coverage/`) — every course carries `content.roles` — the role profiles, the motion spec and the labels of the role
pictures (`src/lib/docs/roles.ts`; see `docs/ARCHITECTURE.md` §6) — and the self-drawn
courses carry `content.arch` — the architecture picture and its build model
(`src/lib/docs/archPicture.ts`; see `docs/courses/arch-pictures.md`). The same export
writes the weekly build sheets to `docs/courses/build-sheets/`.

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
  "topology":       { HOST, BRIDGES, BASE_VMS, OPS … },  // the addressing single source of truth
  "content": {
    "manual":         { MANUAL_SECTIONS, MANUAL_COPY … },           // every course
    "roles":          { PROFILES[ {id, summary, responsibilities, works, arc} ], MOTION {stagger, draw, ease},
                        WORKS_LABEL, WORKS_SHORT, FLOW_KIND_LABEL, FLOW_HOW_TO_READ },   // every course (R105)
    "cert":           { CERT {vendor, code, name, level, examFeeUsd, domains[ {id, name, weight, gapNote?} ], prerequisite?, next?},
                        DOMAIN_OF {taskId: domainId}, COSTS[ {item, kind, usd, per, note} ], LADDER[] },   // every course (R106)
    "weekVisuals":    [ { week, builtThrough, highlight, process, caption } ],   // every course (R99)
    "custody":        { CUSTODY_COLUMNS, CUSTODY_RULES },            // every course
    "troubleshooting": { … },                                        // courses that run commands
    "arch":           { ARCH, ARCH_BUILD },                          // the five self-drawn courses (R103)
    "cloud":          { topology, iac, block, workflows, raci, phases },   // the six cloud courses
    "security" | "cysa" | "mssp" | "diagrams" | "kit" | "ccnaDiagrams": { … }   // per course
  },
  "glossary": { … }, "marking": { teamWeight, focusWeight }, "labAccess": { … }, "iacTools": { … }
}
```

Components never import these tables: they call `useCourseDocument()` and an accessor in
`src/lib/content/read.ts` (`rolesOf`, `archOf`, `weekVisualsOf`, `deliverablesOf` …), and
`src/lib/page-shape.test.ts` fails a component that imports a table from `src/lib/docs/`.

## Adding a section

1. Write a **data-only module** under `src/lib/docs/` (uppercase exports are the tables;
   lowercase helpers are allowed and never reach the JSON).
2. In `src/lib/content/dto.ts`: `generatedFrom.push('<module path>')` and
   `content.<key> = contentData(module)` (or a hand-built object for a per-course lookup).
3. In `src/lib/content/read.ts`: a typed accessor `<key>Of(doc)` over `section<T>(doc, '<key>')`,
   with defaults for an authored course that lacks the section; if a bare document needs the
   shared part of it, add it in `src/lib/content/docs.ts` `sharedContent()`.
4. The renderer reads `<key>Of(useCourseDocument())` literally and joins `RENDERERS` in
   `src/lib/page-shape.test.ts`; add the module to the content-module regex there too.
5. Give every string a word budget in `src/lib/data/content-integrity.test.ts`.
6. `npm run content:export`; commit `content/` and `docs/courses/build-sheets/`.
7. Document the section here and the standard it serves in `docs/ARCHITECTURE.md`.

## What is deliberately absent

- **Definition-of-Done checks** are predicates (data) since R84, so every document is
  plain JSON — `dto.test.ts` asserts there is no function marker anywhere in it.
- **React components** (diagrams, the guide's rendering) and **student state**
  (progress, forms, evidence — localStorage or Supabase) are not content.
- **Glossary and lab-access field definitions** are platform-wide, in
  `src/lib/glossary.ts` and `src/lib/labAccess.ts`; each document carries a copy so a
  reader needs nothing else.
- **Derived facts** — who hands what to whom, the weighted hand-off arrows — are never
  stored; `roleFlow()` projects them from the RACI and `feeds` at read time.

## Reading the Server+ document

Weeks 0–6 (`course.weeks`; weeks 5 and 6 are `advanced: true`), tasks with `shared: true`
are worked by every focus, `sp-w{N}-{net|win|lnx|mgmt}` are the per-focus deep-dives, a
step's `guideRef.procedureId` names an entry in `procedures`, and any `10.10.30.T` /
`10.20.T` in a command is a per-team rule the Lab access panel fills in.
