# Architecture pictures, the weekly breakdown and the document lifecycle (R103)

Every course draws the system it builds, says what arrives each week and
what each part is for, and moves its documents through one lifecycle. This
page is the contract; the build sheets in `build-sheets/` are the generated
weekly tables, one per course.

## One picture shape for the self-drawn courses

Security+, CySA+, MSSP, SecAI+ and CISSP draw an `ArchPicture`
(`src/lib/docs/archPicture.ts`) from their content module
(`securityContent.ts`, `cysaContent.ts`, `msspContent.ts`, `secaiContent.ts`,
`cisspContent.ts`). One renderer, `ArchDiagram`, draws all five from the course
document (`content.arch`).

| Element | Rule |
|---|---|
| `zones` | sites, trust boundaries, network segments; `lane: true` marks the records strip |
| `nodes[].kind` | a real component kind: endpoint, server, app, ai, data, firewall, router, switch, wireless, network, idp, identity, siem, monitor, pipeline, backup, scanner, ticket, evidence, control, people, outside; `record` is a form in the lane |
| `nodes[].purpose` | what it is for, at most twelve words — printed under the picture and in the build sheet |
| `nodes[].records` | the deliverable (by id) whose form records the part; a record pill names itself |
| `nodes[].addr` | only by reference into `labTopology` / `serverTopology` / `ccnaTopology`, never typed |
| `nodes[].arrives` | the course-local week the part appears; 0 = there from the start; the build model is derived, never typed twice |
| `edges[].kind` | traffic (solid), log, backup, trust, admin (dashed per kind) |
| overlays | `ARCH_BUILD = archBuildModel(ARCH, { processes, captions })` — a process of 1–6 arrows and a caption ≤25 words per week |

`archPicture.test.ts` holds the picture to this: purposes present and short,
records resolve to the course's forms, the lane holds every form as a pill
and nothing else, no two boxes overlap, addresses only by reference.

Server+ (`rack`) and CCNA (`campus`) keep their own renderers because their
pictures are generated from the rack and the device list; each exports a
`PARTS` catalogue (`serverDiagrams.ts`, `ccnaDiagrams.ts`) with the same
id · label · purpose · records · arrives rows. The six cloud courses carry a
`purpose` on every non-plumbing template resource (`azureTopology.ts`,
`awsTopology.ts`).

## The weekly breakdown

`partsOf(doc)` (`src/lib/content/read.ts`) returns the catalogue of any
course; `weekAdds(doc, week)` (`src/lib/weekAdds.ts`) filters it to the week's
arrivals. The Tasks tab and the Guide print it under the picture ("This week
adds": part · purpose · Recorded in → the form); week 0 prints "You start
with". `weekAdds.test.ts` asserts every glowing part has a row and, for the
self-drawn courses, that the catalogue matches the build model exactly.

`npm run content:export` also writes `docs/courses/build-sheets/<course>.md`
from the same function (`scripts/export-build-sheets.ts`,
`src/lib/docs/buildSheet.ts`); `buildSheets.test.ts` and CI fail when a
picture changed without regenerating.

## The document lifecycle

Every deliverable carries a RACI (`src/lib/docs/raci.ts`; the cloud factory
sets its own): who drafts (the `owner`), who reviews (never the drafter) and
who approves (never the reviewer where the course has three roles). Once
approved, the document is handed to its approving role.

The rules (`src/lib/docs/lifecycle.ts`, pure):

| From | Action | Who | To |
|---|---|---|---|
| draft | submit (freezing the document in the Expectations panel, once the definition of done passes) | the drafting role | in review |
| in review | approve | the reviewing role, not the submitter while another reviewer exists | approved |
| in review | return, with a reason | the reviewing role | draft |
| approved | issue | the approving role | issued |
| approved / issued | reopen | the drafting role | draft |

Transitions are append-only rows: a localStorage blob offline, the
`deliverable_status` table in the cloud (migration 0012: team insert and
read, instructor read, an immutable trigger, realtime). The status strip on
each form shows the four states, who moved it last, the RACI line and the
viewer's one action; the "Waiting on" notice names the upstream forms not
yet approved (a notice, never a lock); the Home queue card lists the
documents waiting on the viewer's review or issue; exports carry a Document
control block.

The chain itself (`feeds`) is guarded per course: no edge points back in
time, no document is a dead end, every document reaches the capstone, and
every form is written by at least one step.
