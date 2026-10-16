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
| `courses/index.json` | catalogue | counts per course, plus vendor, certification, level, prerequisite, next, exam fee, coverage and cost (R106), and the skills, tools, standards, controls, procedures, tactics and practices the graded tasks use (R107) |

Every course's `deliverables[]` carries its RACI (`src/lib/docs/raci.ts`), every course
carries `content.cert` — the certification it prepares for, its exam domains, which domain
each task practises, the ladder and the cost (`src/lib/docs/certs.ts`, `costs.ts`; the
readable copy is `docs/courses/cert-coverage/`) — every course carries `content.skills` — the
competency ontology, the tool, standards, SOP, tactics and practices registers, the metric
catalogue and this course's maps into them (`src/lib/docs/skills.ts`, `tools.ts`, `standards.ts`,
`sops.ts`, `tactics.ts`, `metricCatalogue.ts`, `skillsCopy.ts`, and since R108 `kpis.ts` and
`workRoles.ts`; the readable copy is `docs/courses/skills/`) — every course carries `content.roles` — the role profiles, the motion spec and the labels of the role
pictures (`src/lib/docs/roles.ts`; see `docs/ARCHITECTURE.md` §6) — and the self-drawn
courses carry `content.arch` — the architecture picture and its build model
(`src/lib/docs/archPicture.ts`; see `docs/courses/arch-pictures.md`). The same export
writes the weekly build sheets to `docs/courses/build-sheets/`.

`ontology/` is the published ontology (R107): the competency nodes, tools, standards and
controls, SOP kinds, tactics, practices, the metric catalogue and the exam domains as versioned
JSON any platform can join on (`src/lib/docs/ontology.ts`; semver, additive, deprecate never
remove); R108 adds `kpis.json` (the sixteen KPIs and their families) and `work-roles.json` (the
NICE work roles and the course roles that prepare for them). `schemas/` holds a JSON Schema for
every shape the platform publishes or exports (`content/schemas/README.md`). `profiles/` holds
the published environment profiles (R108): what a company publishes to be measured against,
built by `scripts/export-profiles.ts` from `src/lib/docs/environmentProfile.ts`; the one sample
is the platform's own managed-security entity, and a company's own file follows the same schema.

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
    "skills":         { SKILLS[ {id, version, label, area, objectiveRefs} ], SKILL_OF {taskId: ids}, AREAS,
                        TOOLS[ {id, label, kind, aliases, commands?} ], TOOL_OF {taskId: ids},       // TOOL_OF is derived at export
                        STANDARDS[ {id, label, description, why, kind, tone, publisher} ], CONTROLS[ {code, standard, label, cites} ],
                        CONTROL_OF {formId: codes},                                                   // what each form's standard cites, parsed at export
                        SOPS[ {id, label, kind, definition, standardRefs} ], SOP_OF {formId: ids}, SOP_OF_TASK {taskId: ids},
                        TACTICS[ {id, matrix, label, url} ], TACTIC_OF, PRACTICES[ {id, label, anchor, definition} ], PRACTICE_OF,
                        METRICS[ {id, label, dimension, definition, inputs, valueTo, status, scored: false} ],
                        COPY, LEVEL_LABEL, DIMENSION_LABEL,
                        KPI_FAMILIES[ {id, label, definition} ], KPIS[ {id, family, label, metricId, numerator, denominator, fact, valueTo, whyMember, whyCompany, agentField} ],
                        WORK_ROLES[ {id, label, framework, niceId?, areas, requiredCompetencies} ], WORK_ROLE_OF {roleId: ids} },   // every course (R107, R108); the registry rows this course's maps reach
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

**The effective document (R121).** A committed file is the course as shipped. What the app reads is
`courseDocument(id)` (`src/lib/content/docs.ts`): the same document with the course's live **content
fixes** applied to `course`, plus two optional fields that never appear in a committed file:

```
  "revision": 7,                      // the fix ledger's newest revision; the content version is "{course.version}.{revision}"
  "fixes":    [ { schema: "capstone-content-fix/1", revision, kind: fix | revert | fold, changes[ {taskId, stepId?, field, before, after} ], … } ]
```

A fix is a correction to the words, laid over the course and numbered by the database (`content_fixes`,
migration 0017; `docs/ARCHITECTURE.md` "Versioned content fixes"). The schema id stays
`capstone-course-dto/1`, so nothing that reads a document changes. To fold a live fix into the code, make the
same change in the seed file the document lists first in `generatedFrom`, run `npm run content:export`, and
mark the fix In code on `/instructor/issues` (Fixes). The downloadable **fix bundle**
(`capstone-content-fixes/1`, `content/schemas/content-fixes.schema.json`) names the file and the task and
step titles to search for.

Components never import these tables: they call `useCourseDocument()` and an accessor in
`src/lib/content/read.ts` (`rolesOf`, `archOf`, `weekVisualsOf`, `deliverablesOf` …), and
`src/lib/page-shape.test.ts` fails a component that imports a table from `src/lib/docs/`.

## Adding a section

1. Write a **data-only module** under `src/lib/docs/` (uppercase exports are the tables;
   lowercase helpers are allowed and never reach the JSON).
2. In `src/lib/content/dto.ts`: `generatedFrom.push('<module path>')` and
   `content.<key> = contentData(module)` (or a hand-built object for a per-course lookup).
   A registry shared by every course (R107 `content.skills`) is written into each document
   as the rows the course's own `*_OF` maps reach, so the document holds what it renders and
   the whole catalogue is published once (`content/ontology/`); anything derived from the
   seed (the tools of a task) is computed in the writer, never stored in a seed.
3. In `src/lib/content/read.ts`: a typed accessor `<key>Of(doc)` over `section<T>(doc, '<key>')`,
   with defaults for an authored course that lacks the section; if a bare document needs the
   shared part of it, add it in `src/lib/content/docs.ts` `sharedContent()`.
4. The renderer reads `<key>Of(useCourseDocument())` literally and joins `RENDERERS` in
   `src/lib/page-shape.test.ts`; add the module to the content-module regex there too.
5. Give every string a word budget in `src/lib/data/content-integrity.test.ts`.
6. `npm run content:export`; commit `content/`, `docs/courses/build-sheets/`,
   `docs/courses/cert-coverage/` and `docs/courses/skills/`.
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
